// /app/api/tickets/lookup/route.ts
// GET /api/tickets/lookup?url=<interpark-url-or-goodsCode>
//
// Flow:
//  1. Parse goodsCode from input.
//  2. Hit api-ticketfront.interpark.com summary → goodsName, placeCode, placeName.
//  3. Look up /venues/{placeCode} in Firestore (global cache, populated by first user).
//  4. Cache miss → call resolveSeatLayout (externalSeatMeta crawler) → save to /venues.
//  5. Return { meta, layout } so the client renders block selection without manual presets.
import { NextResponse } from 'next/server';
import { Timestamp } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { adminDb } from '@/lib/firebase/admin';
import { extractGoodsCode, fetchGoodsSummary } from '@/lib/tickets/interparkMeta';
import { resolveSeatLayout, type ResolvedLayout, type BlockGroup } from '@/lib/tickets/seatLayoutResolver';
import { getVenuePreset } from '@/lib/tickets/venues';
import type { BlockSpec, VenueTemplate } from '@/lib/tickets/firestoreSchema';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

const VENUE_CACHE_TTL_MS = 1000 * 60 * 60 * 24 * 30; // 30 days

async function requireAuth(req: Request) {
  const header = req.headers.get('authorization');
  if (!header?.startsWith('Bearer ')) throw new Error('UNAUTHENTICATED');
  await getAuth().verifyIdToken(header.slice('Bearer '.length));
}

type VenueDoc = {
  placeCode: string;
  placeName: string;
  blocks: BlockSpec[];
  groups: BlockGroup[];
  totalSeats: number;
  resolvedAt: Timestamp;
  source: 'externalSeatMeta' | 'preset';
};

function presetAsLayout(template: VenueTemplate): { layout: ResolvedLayout; placeName: string } | null {
  const preset = getVenuePreset(template);
  if (!preset) return null;
  const blocks = preset.groups.flatMap(g => g.blocks);
  return {
    placeName: preset.name,
    layout: {
      blocks,
      groups: preset.groups.map(g => ({ title: g.title, blocks: g.blocks })),
      totalSeats: 0,
      resolvedAt: Date.now(),
      source: 'externalSeatMeta', // logical: preset-based layout, treated identically downstream
    },
  };
}

export async function GET(req: Request) {
  try {
    await requireAuth(req);
  } catch (e) {
    const msg = (e as Error).message ?? 'unknown';
    console.error('[lookup] auth failed:', msg, (e as Error).stack);
    return new NextResponse(`Unauthorized: ${msg}`, { status: 401 });
  }

  const url = new URL(req.url);
  const input = url.searchParams.get('url') ?? '';
  const goodsCode = extractGoodsCode(input);
  if (!goodsCode) return NextResponse.json({ error: 'invalid url or goodsCode' }, { status: 400 });

  let summary;
  try {
    summary = await fetchGoodsSummary(goodsCode);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }

  const db = adminDb();
  const venueRef = db.collection('venues').doc(summary.placeCode);
  const venueSnap = await venueRef.get();

  let layout: ResolvedLayout | null = null;

  if (venueSnap.exists) {
    const data = venueSnap.data() as VenueDoc;
    const age = Date.now() - (data.resolvedAt?.toMillis?.() ?? 0);
    if (age < VENUE_CACHE_TTL_MS && data.blocks?.length > 0) {
      layout = {
        blocks: data.blocks,
        groups: data.groups,
        totalSeats: data.totalSeats ?? 0,
        resolvedAt: data.resolvedAt.toMillis(),
        source: data.source ?? 'externalSeatMeta',
      };
    }
  }

  // Fall back to hardcoded preset (faster than network probe) if a known venue.
  if (!layout && summary.supported) {
    const preset = presetAsLayout(summary.venueTemplate);
    if (preset) layout = preset.layout;
  }

  // Last resort: probe Interpark in real time.
  if (!layout) {
    try {
      layout = await resolveSeatLayout(goodsCode, summary.placeCode, '001');
    } catch (e) {
      return NextResponse.json({ error: `Layout resolve failed: ${(e as Error).message}` }, { status: 502 });
    }
    if (layout.blocks.length === 0) {
      return NextResponse.json({ error: '좌석 layout 을 가져올 수 없습니다 (좌석 페이지 비공개일 수 있음)' }, { status: 502 });
    }
  }

  // Persist for future lookups (don't block response on a write failure).
  venueRef
    .set(
      {
        placeCode: summary.placeCode,
        placeName: summary.placeName,
        blocks: layout.blocks,
        groups: layout.groups,
        totalSeats: layout.totalSeats,
        resolvedAt: Timestamp.now(),
        source: layout.source,
      },
      { merge: true }
    )
    .catch(() => {});

  return NextResponse.json({
    ok: true,
    meta: {
      goodsCode: summary.goodsCode,
      goodsName: summary.goodsName,
      placeCode: summary.placeCode,
      placeName: summary.placeName,
      playStartDate: summary.playStartDate,
      playEndDate: summary.playEndDate,
      venueTemplate: summary.venueTemplate,
      supported: true, // all venues now supported via dynamic resolution
    },
    layout: {
      groups: layout.groups,
      totalSeats: layout.totalSeats,
      blockCount: layout.blocks.length,
    },
    defaults: {
      playSeq: '001',
      blocks: layout.blocks, // pre-select all blocks
    },
  });
}

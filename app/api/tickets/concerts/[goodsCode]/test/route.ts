// /app/api/tickets/concerts/[goodsCode]/test/route.ts
// GET: fetch current seat status on demand (does NOT modify state or send alerts).
// Useful for the "Test" button on the dashboard to verify the concert is set up right.
import { NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { adminDb } from '@/lib/firebase/admin';
import { fetchSeatStatus } from '@/lib/tickets/interpark';
import type { ConcertDoc } from '@/lib/tickets/firestoreSchema';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function requireUid(req: Request): Promise<string> {
  const header = req.headers.get('authorization');
  if (!header?.startsWith('Bearer ')) throw new Error('UNAUTHENTICATED');
  const decoded = await getAuth().verifyIdToken(header.slice('Bearer '.length));
  return decoded.uid;
}

export async function GET(req: Request, { params }: { params: Promise<{ goodsCode: string }> }) {
  try { await requireUid(req); } catch { return new NextResponse('Unauthorized', { status: 401 }); }

  const { goodsCode } = await params;
  const db = adminDb();
  const snap = await db.collection('concerts').doc(goodsCode).get();
  if (!snap.exists) return NextResponse.json({ error: 'not found' }, { status: 404 });
  const data = snap.data() as ConcertDoc;

  const result = await fetchSeatStatus({
    goodsCode: data.goodsCode,
    placeCode: data.placeCode,
    playSeq: data.playSeq,
    blockCodes: data.blocks.map(b => b.code),
  });

  const breakdown = data.blocks.map(b => ({
    code: b.code,
    label: b.label,
    avail: result.blockAvail[b.code] ?? 0,
    total: result.blockTotal[b.code] ?? 0,
  }));

  return NextResponse.json({
    ok: true,
    totalAvail: result.totalAvail,
    totalSeats: result.totalSeats,
    blocks: breakdown,
  });
}

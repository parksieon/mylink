// /app/api/tickets/concerts/route.ts
// POST: upsert a concert and add the caller as a subscriber.
// Body: { goodsCode, placeCode, playSeq, venueTemplate, name, blocks: BlockSpec[] }
// Uses the caller's Firebase ID token (sent in Authorization header) to verify identity.
import { NextResponse } from 'next/server';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase/admin';
import { getAuth } from 'firebase-admin/auth';
import type { BlockSpec, ConcertDoc, SubscriberDoc, VenueTemplate } from '@/lib/tickets/firestoreSchema';

export const runtime = 'nodejs';

async function requireUid(req: Request): Promise<string> {
  const header = req.headers.get('authorization');
  if (!header?.startsWith('Bearer ')) throw new Error('UNAUTHENTICATED');
  const idToken = header.slice('Bearer '.length);
  const decoded = await getAuth().verifyIdToken(idToken);
  return decoded.uid;
}

type Body = {
  goodsCode: string;
  placeCode: string;
  playSeq: string;
  venueTemplate: VenueTemplate;
  name: string;
  blocks: BlockSpec[];
};

function validate(body: Body): string | null {
  if (!body.goodsCode || !/^\d+$/.test(body.goodsCode)) return 'invalid goodsCode';
  if (!body.placeCode || !/^\d+$/.test(body.placeCode)) return 'invalid placeCode';
  if (!body.playSeq) return 'invalid playSeq';
  if (!body.name || body.name.length > 100) return 'invalid name';
  if (!Array.isArray(body.blocks) || body.blocks.length === 0) return 'no blocks selected';
  if (body.blocks.length > 100) return 'too many blocks';
  return null;
}

function unionBlocks(a: BlockSpec[], b: BlockSpec[]): BlockSpec[] {
  const map = new Map<string, BlockSpec>();
  for (const x of [...a, ...b]) map.set(x.code, x);
  return Array.from(map.values()).sort((x, y) => x.code.localeCompare(y.code));
}

export async function POST(req: Request) {
  let uid: string;
  try {
    uid = await requireUid(req);
  } catch {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const body = (await req.json()) as Body;
  const err = validate(body);
  if (err) return NextResponse.json({ error: err }, { status: 400 });

  const db = adminDb();
  const concertRef = db.collection('concerts').doc(body.goodsCode);
  const subRef = concertRef.collection('subscribers').doc(uid);

  await db.runTransaction(async tx => {
    const [concertSnap, subSnap] = await Promise.all([tx.get(concertRef), tx.get(subRef)]);

    const now = Timestamp.now();
    if (!concertSnap.exists) {
      const doc: ConcertDoc = {
        goodsCode: body.goodsCode,
        placeCode: body.placeCode,
        playSeq: body.playSeq,
        venueTemplate: body.venueTemplate,
        name: body.name,
        blocks: body.blocks,
        state: { blockAvail: {}, totalAvail: 0, totalSeats: 0, updatedAt: null },
        enabled: true,
        subscriberCount: 1,
        createdBy: uid,
        createdAt: now,
        updatedAt: now,
      };
      tx.set(concertRef, doc);
    } else {
      const existing = concertSnap.data() as ConcertDoc;
      const merged = unionBlocks(existing.blocks ?? [], body.blocks);
      tx.update(concertRef, {
        blocks: merged,
        enabled: true,
        subscriberCount: subSnap.exists ? existing.subscriberCount : (existing.subscriberCount ?? 0) + 1,
        updatedAt: now,
      });
    }

    const subDoc: SubscriberDoc = {
      uid,
      blocks: body.blocks,
      enabled: true,
      createdAt: subSnap.exists ? (subSnap.get('createdAt') as Timestamp) ?? now : now,
    };
    tx.set(subRef, subDoc, { merge: true });
  });

  return NextResponse.json({ ok: true, goodsCode: body.goodsCode });
}

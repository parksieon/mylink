// /app/api/tickets/concerts/[goodsCode]/route.ts
// PATCH: update caller's subscription (blocks, enabled)
// DELETE: unsubscribe (decrement subscriberCount; flip concert.enabled=false if last)
import { NextResponse } from 'next/server';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { adminDb } from '@/lib/firebase/admin';
import type { BlockSpec, ConcertDoc, SubscriberDoc } from '@/lib/tickets/firestoreSchema';

export const runtime = 'nodejs';

async function requireUid(req: Request): Promise<string> {
  const header = req.headers.get('authorization');
  if (!header?.startsWith('Bearer ')) throw new Error('UNAUTHENTICATED');
  const decoded = await getAuth().verifyIdToken(header.slice('Bearer '.length));
  return decoded.uid;
}

type PatchBody = {
  blocks?: BlockSpec[];
  enabled?: boolean;
};

export async function PATCH(req: Request, { params }: { params: Promise<{ goodsCode: string }> }) {
  let uid: string;
  try { uid = await requireUid(req); } catch { return new NextResponse('Unauthorized', { status: 401 }); }

  const { goodsCode } = await params;
  const body = (await req.json()) as PatchBody;
  const db = adminDb();
  const subRef = db.collection('concerts').doc(goodsCode).collection('subscribers').doc(uid);

  const update: Record<string, unknown> = {};
  if (Array.isArray(body.blocks)) update.blocks = body.blocks;
  if (typeof body.enabled === 'boolean') update.enabled = body.enabled;
  if (Object.keys(update).length === 0) return NextResponse.json({ ok: true });

  await subRef.update(update);
  // Note: we intentionally don't shrink concerts.blocks here — the union may still be needed for other subscribers.
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ goodsCode: string }> }) {
  let uid: string;
  try { uid = await requireUid(req); } catch { return new NextResponse('Unauthorized', { status: 401 }); }

  const { goodsCode } = await params;
  const db = adminDb();
  const concertRef = db.collection('concerts').doc(goodsCode);
  const subRef = concertRef.collection('subscribers').doc(uid);

  await db.runTransaction(async tx => {
    const [c, s] = await Promise.all([tx.get(concertRef), tx.get(subRef)]);
    if (!s.exists) return;
    tx.delete(subRef);
    if (c.exists) {
      const data = c.data() as ConcertDoc;
      const newCount = Math.max(0, (data.subscriberCount ?? 1) - 1);
      tx.update(concertRef, {
        subscriberCount: newCount,
        enabled: newCount > 0,
        updatedAt: Timestamp.now(),
      });
    }
  });

  return NextResponse.json({ ok: true });
}

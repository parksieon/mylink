// /lib/tickets/poll.ts
// Core polling logic — runs inside /api/cron/poll for every enabled concert.
// 1. Calls Interpark for the union of all subscribers' blocks.
// 2. Diffs against state.blockAvail; finds blocks where availability *increased*.
// 3. For each subscriber whose interests intersect the increased blocks, sends FCM push.
// 4. Writes an alert doc + updates state.
import { Timestamp, type DocumentSnapshot } from 'firebase-admin/firestore';
import { adminDb } from '../firebase/admin';
import { fetchSeatStatus } from './interpark';
import { pushToUser } from './fcm';
import type { ConcertDoc, SubscriberDoc, BlockSpec } from './firestoreSchema';

export type PollOutcome = {
  goodsCode: string;
  ok: boolean;
  initial?: boolean;
  notified?: number;
  increased?: { code: string; delta: number; label: string }[];
  error?: string;
};

function findLabel(blocks: BlockSpec[], code: string): string {
  return blocks.find(b => b.code === code)?.label ?? code;
}

export async function pollConcert(doc: DocumentSnapshot): Promise<PollOutcome> {
  const data = doc.data() as ConcertDoc | undefined;
  if (!data) return { goodsCode: doc.id, ok: false, error: 'empty doc' };

  const { goodsCode, placeCode, playSeq, blocks } = data;
  if (!blocks || blocks.length === 0) {
    return { goodsCode, ok: false, error: 'no blocks' };
  }

  let result;
  try {
    result = await fetchSeatStatus({
      goodsCode,
      placeCode,
      playSeq,
      blockCodes: blocks.map(b => b.code),
    });
  } catch (e) {
    return { goodsCode, ok: false, error: (e as Error).message };
  }

  const prev = data.state?.blockAvail ?? {};
  const curr = result.blockAvail;
  const hadPrev = Object.keys(prev).length > 0;

  // First-time poll for this concert: only record state, never alert (prevents spurious "everything is new" alerts).
  if (!hadPrev) {
    await doc.ref.update({
      'state.blockAvail': curr,
      'state.totalAvail': result.totalAvail,
      'state.totalSeats': result.totalSeats,
      'state.updatedAt': Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    return { goodsCode, ok: true, initial: true };
  }

  // Compute per-block increases.
  const increased: { code: string; delta: number; label: string }[] = [];
  for (const code of Object.keys(curr)) {
    const pv = prev[code] ?? 0;
    const cv = curr[code];
    if (cv > pv) increased.push({ code, delta: cv - pv, label: findLabel(blocks, code) });
  }

  // Update state regardless of whether anyone was notified.
  await doc.ref.update({
    'state.blockAvail': curr,
    'state.totalAvail': result.totalAvail,
    'state.totalSeats': result.totalSeats,
    'state.updatedAt': Timestamp.now(),
    updatedAt: Timestamp.now(),
  });

  if (increased.length === 0) return { goodsCode, ok: true, notified: 0, increased: [] };

  // Notify subscribers whose own block selection intersects the increased blocks.
  const subsSnap = await doc.ref.collection('subscribers').where('enabled', '==', true).get();
  const increasedCodes = new Set(increased.map(i => i.code));

  const notifiedUids: string[] = [];
  await Promise.allSettled(
    subsSnap.docs.map(async s => {
      const sub = s.data() as SubscriberDoc;
      const subCodes = new Set((sub.blocks ?? []).map(b => b.code));
      const overlap = increased.filter(i => subCodes.has(i.code));
      if (overlap.length === 0) return;

      const summary = overlap.map(i => `${i.label} +${i.delta}`).join(', ');
      const title = `🚨 ${data.name} 취소표!`;
      const body = `${summary}`;
      const url = `/tickets/${goodsCode}`;
      const { sent } = await pushToUser(s.id, { title, body, url });
      if (sent > 0) notifiedUids.push(s.id);
    })
  );

  // Append alert history doc.
  const alertRef = doc.ref.collection('alerts').doc();
  await alertRef.set({
    increasedBlocks: increased,
    totalDelta: increased.reduce((a, b) => a + b.delta, 0),
    sentAt: Timestamp.now(),
    notifiedUids,
  });

  return { goodsCode, ok: true, notified: notifiedUids.length, increased };
}

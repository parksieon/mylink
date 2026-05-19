// /app/api/cron/poll/route.ts
// Vercel Cron handler — wired to `*/1 * * * *` in vercel.json.
// Iterates over every enabled concert, calls pollConcert in parallel.
import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { pollConcert, type PollOutcome } from '@/lib/tickets/poll';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

export async function GET(req: Request) {
  // Vercel cron sends `Authorization: Bearer ${CRON_SECRET}` automatically when CRON_SECRET is set.
  const expected = `Bearer ${process.env.CRON_SECRET ?? ''}`;
  if (process.env.CRON_SECRET && req.headers.get('authorization') !== expected) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const db = adminDb();
  const snap = await db.collection('concerts').where('enabled', '==', true).get();

  const results = await Promise.allSettled(snap.docs.map(d => pollConcert(d)));
  const summary = results.map<PollOutcome | { ok: false; error: string }>(r =>
    r.status === 'fulfilled' ? r.value : { ok: false, error: r.reason?.message ?? 'unknown' }
  );

  return NextResponse.json({
    polled: snap.size,
    notified: summary.reduce((a, r) => a + ('notified' in r ? r.notified ?? 0 : 0), 0),
    results: summary,
  });
}

// /app/api/cron/poll/route.ts
// 매분 트리거되어 enabled 공연만 폴링. 공연 종료일이 지난 doc 은 폴링 직전에
// enabled=false 로 auto-disable 시켜서 다음 사이클부터 대기열에서 빠짐.
import { NextResponse } from 'next/server';
import { Timestamp } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase/admin';
import { pollConcert, type PollOutcome } from '@/lib/tickets/poll';
import type { ConcertDoc } from '@/lib/tickets/firestoreSchema';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

// 인터파크 summary 는 KST 기준 YYYYMMDD. cron 은 UTC 에서 도니까 KST 자정 경계로 환산.
function todayYYYYMMDD_KST(): string {
  const kst = new Date(Date.now() + 9 * 60 * 60 * 1000);
  const yyyy = kst.getUTCFullYear();
  const mm = String(kst.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(kst.getUTCDate()).padStart(2, '0');
  return `${yyyy}${mm}${dd}`;
}

export async function GET(req: Request) {
  // Vercel cron sends `Authorization: Bearer ${CRON_SECRET}` automatically when CRON_SECRET is set.
  const expected = `Bearer ${process.env.CRON_SECRET ?? ''}`;
  if (process.env.CRON_SECRET && req.headers.get('authorization') !== expected) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const db = adminDb();
  const snap = await db.collection('concerts').where('enabled', '==', true).get();

  const today = todayYYYYMMDD_KST();
  const active: typeof snap.docs = [];
  const expiredIds: string[] = [];

  for (const doc of snap.docs) {
    const data = doc.data() as ConcertDoc;
    // playEndDate 가 없는 기존 공연은 만료 처리 안 함 (마이그레이션 안전장치).
    if (data.playEndDate && data.playEndDate < today) {
      expiredIds.push(doc.id);
    } else {
      active.push(doc);
    }
  }

  // 만료 공연 일괄 disable (병렬). 실패해도 폴링 계속 진행.
  if (expiredIds.length > 0) {
    await Promise.allSettled(
      expiredIds.map(id =>
        db.collection('concerts').doc(id).update({ enabled: false, updatedAt: Timestamp.now() })
      )
    );
  }

  const results = await Promise.allSettled(active.map(d => pollConcert(d)));
  const summary = results.map<PollOutcome | { ok: false; error: string }>(r =>
    r.status === 'fulfilled' ? r.value : { ok: false, error: r.reason?.message ?? 'unknown' }
  );

  return NextResponse.json({
    polled: active.length,
    expired: expiredIds.length,
    notified: summary.reduce((a, r) => a + ('notified' in r ? r.notified ?? 0 : 0), 0),
    results: summary,
  });
}

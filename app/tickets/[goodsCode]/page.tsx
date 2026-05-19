// /app/tickets/[goodsCode]/page.tsx
// Concert detail: per-block availability snapshot + alert history + "Test now" button.
'use client';

import { use, useEffect, useState } from 'react';
import { doc, getFirestore, onSnapshot } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { firebaseApp } from '@/lib/firebase';
import { AlertHistoryList } from '@/components/tickets/AlertHistoryList';
import type { ConcertDoc } from '@/lib/tickets/firestoreSchema';

type TestResult = {
  totalAvail: number;
  totalSeats: number;
  blocks: { code: string; label: string; avail: number; total: number }[];
};

export default function ConcertDetailPage({ params }: { params: Promise<{ goodsCode: string }> }) {
  const { goodsCode } = use(params);
  const [concert, setConcert] = useState<ConcertDoc | null>(null);
  const [testing, setTesting] = useState(false);
  const [test, setTest] = useState<TestResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const db = getFirestore(firebaseApp);
    const unsub = onSnapshot(doc(db, 'concerts', goodsCode), snap => {
      if (snap.exists()) setConcert(snap.data() as ConcertDoc);
    });
    return unsub;
  }, [goodsCode]);

  async function runTest() {
    setError(null);
    setTesting(true);
    try {
      const idToken = await getAuth(firebaseApp).currentUser?.getIdToken();
      const res = await fetch(`/api/tickets/concerts/${goodsCode}/test`, {
        headers: { Authorization: `Bearer ${idToken}` },
        cache: 'no-store',
      });
      if (!res.ok) throw new Error(await res.text());
      setTest((await res.json()) as TestResult);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setTesting(false);
    }
  }

  if (!concert) return <div className="text-sm text-gray-500">불러오는 중…</div>;

  const state = concert.state;

  return (
    <div className="space-y-6">
      <section>
        <h2 className="text-xl font-semibold">{concert.name}</h2>
        <div className="text-sm text-gray-500 font-mono">
          goodsCode {concert.goodsCode} · placeCode {concert.placeCode}
        </div>
        <div className="text-sm mt-2">
          현재 가능: <span className="font-semibold text-red-600">{state?.totalAvail ?? 0}</span>
          {' / '}
          {state?.totalSeats ?? 0}석{' '}
          {state?.updatedAt?.toDate && (
            <span className="text-xs text-gray-500">
              (업데이트 {state.updatedAt.toDate().toLocaleString('ko-KR')})
            </span>
          )}
        </div>
        <a
          href={`https://tickets.interpark.com/goods/${concert.goodsCode}`}
          target="_blank"
          rel="noreferrer"
          className="inline-block mt-2 text-sm text-blue-600 hover:underline"
        >
          Interpark 페이지 열기 ↗
        </a>
      </section>

      <section className="border rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">블록별 현재 상태</h3>
          <button
            onClick={runTest}
            disabled={testing}
            className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50"
          >
            {testing ? '확인 중…' : '지금 확인'}
          </button>
        </div>
        {error && <div className="text-sm text-red-600 mb-2">{error}</div>}

        <table className="w-full text-sm">
          <thead className="text-left text-gray-500">
            <tr>
              <th className="py-1">블록</th>
              <th className="py-1">코드</th>
              <th className="py-1 text-right">스냅샷</th>
              <th className="py-1 text-right">지금 확인</th>
            </tr>
          </thead>
          <tbody>
            {concert.blocks.map(b => {
              const snap = state?.blockAvail?.[b.code] ?? 0;
              const live = test?.blocks.find(x => x.code === b.code);
              return (
                <tr key={b.code} className="border-t">
                  <td className="py-1">{b.label}</td>
                  <td className="py-1 font-mono text-xs text-gray-500">{b.code}</td>
                  <td className={`py-1 text-right ${snap > 0 ? 'text-red-600 font-semibold' : ''}`}>
                    {snap}
                  </td>
                  <td className="py-1 text-right">
                    {live ? (
                      <span className={live.avail > 0 ? 'text-red-600 font-semibold' : ''}>
                        {live.avail}/{live.total}
                      </span>
                    ) : (
                      <span className="text-gray-300">-</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      <section>
        <h3 className="font-semibold mb-2">알림 이력 (최근 20개)</h3>
        <AlertHistoryList goodsCode={goodsCode} />
      </section>
    </div>
  );
}

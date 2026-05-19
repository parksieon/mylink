// /components/tickets/AlertHistoryList.tsx
// Renders recent alerts for a concert (read directly from Firestore on the client).
'use client';

import { useEffect, useState } from 'react';
import { collection, limit, onSnapshot, orderBy, query, Timestamp } from 'firebase/firestore';
import { getFirestore } from 'firebase/firestore';
import { firebaseApp } from '@/lib/firebase';

type AlertEntry = {
  id: string;
  increasedBlocks: { code: string; delta: number; label: string }[];
  totalDelta: number;
  sentAt: Date;
};

export function AlertHistoryList({ goodsCode }: { goodsCode: string }) {
  const [alerts, setAlerts] = useState<AlertEntry[]>([]);

  useEffect(() => {
    const db = getFirestore(firebaseApp);
    const q = query(
      collection(db, 'concerts', goodsCode, 'alerts'),
      orderBy('sentAt', 'desc'),
      limit(20)
    );
    const unsub = onSnapshot(q, snap => {
      setAlerts(
        snap.docs.map(d => {
          const data = d.data() as {
            increasedBlocks: AlertEntry['increasedBlocks'];
            totalDelta: number;
            sentAt: Timestamp;
          };
          return {
            id: d.id,
            increasedBlocks: data.increasedBlocks ?? [],
            totalDelta: data.totalDelta ?? 0,
            sentAt: data.sentAt?.toDate?.() ?? new Date(0),
          };
        })
      );
    });
    return unsub;
  }, [goodsCode]);

  if (alerts.length === 0) {
    return <div className="text-sm text-gray-500">아직 알림 이력 없음</div>;
  }

  return (
    <ul className="divide-y border rounded">
      {alerts.map(a => (
        <li key={a.id} className="px-3 py-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="font-medium text-red-600">+{a.totalDelta}석</span>
            <span className="text-xs text-gray-500">{a.sentAt.toLocaleString('ko-KR')}</span>
          </div>
          <div className="text-xs text-gray-600 mt-0.5">
            {a.increasedBlocks.map(b => `${b.label} +${b.delta}`).join(', ')}
          </div>
        </li>
      ))}
    </ul>
  );
}

// /components/tickets/ConcertCard.tsx
// Dashboard card for one subscribed concert.
'use client';

import Link from 'next/link';
import { useState } from 'react';
import { getAuth } from 'firebase/auth';
import { firebaseApp } from '@/lib/firebase';

type Props = {
  goodsCode: string;
  name: string;
  subscriberEnabled: boolean;
  myBlockCount: number;
  totalAvail: number;
  totalSeats: number;
  updatedAt: Date | null;
  onChanged?: () => void;
};

export function ConcertCard({
  goodsCode,
  name,
  subscriberEnabled,
  myBlockCount,
  totalAvail,
  totalSeats,
  updatedAt,
  onChanged,
}: Props) {
  const [busy, setBusy] = useState(false);
  const [enabled, setEnabled] = useState(subscriberEnabled);

  async function toggle() {
    setBusy(true);
    try {
      const idToken = await getAuth(firebaseApp).currentUser?.getIdToken();
      await fetch(`/api/tickets/concerts/${goodsCode}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({ enabled: !enabled }),
      });
      setEnabled(!enabled);
      onChanged?.();
    } finally {
      setBusy(false);
    }
  }

  async function unsubscribe() {
    if (!confirm(`"${name}" 구독을 해제하시겠습니까?`)) return;
    setBusy(true);
    try {
      const idToken = await getAuth(firebaseApp).currentUser?.getIdToken();
      await fetch(`/api/tickets/concerts/${goodsCode}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${idToken}` },
      });
      onChanged?.();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="border rounded-lg p-4 bg-white shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <Link href={`/tickets/${goodsCode}`} className="font-semibold hover:underline">
            {name}
          </Link>
          <div className="text-xs text-gray-500 font-mono">{goodsCode}</div>
        </div>
        <label className="flex items-center gap-1 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={enabled}
            onChange={toggle}
            disabled={busy}
            className="accent-blue-600"
          />
          <span className={enabled ? 'text-blue-600' : 'text-gray-400'}>
            {enabled ? '알림 ON' : 'OFF'}
          </span>
        </label>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
        <Stat label="내 블록" value={String(myBlockCount)} />
        <Stat label="현재 가능" value={`${totalAvail}석`} highlight={totalAvail > 0} />
        <Stat label="전체" value={`${totalSeats}석`} />
      </div>

      <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
        <span>{updatedAt ? `업데이트 ${updatedAt.toLocaleTimeString('ko-KR')}` : '아직 폴링 전'}</span>
        <button onClick={unsubscribe} disabled={busy} className="text-red-500 hover:underline">
          구독 해제
        </button>
      </div>
    </div>
  );
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div>
      <div className={`text-base font-semibold ${highlight ? 'text-red-600' : ''}`}>{value}</div>
      <div className="text-xs text-gray-500">{label}</div>
    </div>
  );
}

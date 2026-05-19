// /app/tickets/page.tsx
// Dashboard: list concerts the current user subscribes to + push enable + add module.
'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  collectionGroup,
  doc,
  getDoc,
  getFirestore,
  onSnapshot,
  query,
  where,
} from 'firebase/firestore';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { getAuth } from 'firebase/auth';
import { firebaseApp } from '@/lib/firebase';
import { EnablePushButton } from '@/components/tickets/EnablePushButton';
import { ConcertCard } from '@/components/tickets/ConcertCard';
import { AddConcertModule } from '@/components/tickets/AddConcertModule';
import type { ConcertDoc, SubscriberDoc } from '@/lib/tickets/firestoreSchema';

type Row = {
  goodsCode: string;
  name: string;
  enabled: boolean;
  myBlocks: number;
  totalAvail: number;
  totalSeats: number;
  updatedAt: Date | null;
};

export default function TicketsDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);

  useEffect(() => {
    return onAuthStateChanged(getAuth(firebaseApp), u => setUser(u));
  }, []);

  useEffect(() => {
    if (!user) {
      setRows([]);
      setLoading(false);
      return;
    }
    const db = getFirestore(firebaseApp);
    const q = query(collectionGroup(db, 'subscribers'), where('uid', '==', user.uid));

    const unsub = onSnapshot(q, async snap => {
      const fetched = await Promise.all(
        snap.docs.map(async s => {
          const sub = s.data() as SubscriberDoc;
          const concertRef = s.ref.parent.parent!; // concerts/{goodsCode}
          const cSnap = await getDoc(concertRef);
          if (!cSnap.exists()) return null;
          const c = cSnap.data() as ConcertDoc;
          return {
            goodsCode: c.goodsCode,
            name: c.name,
            enabled: sub.enabled,
            myBlocks: (sub.blocks ?? []).length,
            totalAvail: c.state?.totalAvail ?? 0,
            totalSeats: c.state?.totalSeats ?? 0,
            updatedAt: c.state?.updatedAt?.toDate?.() ?? null,
          } satisfies Row;
        })
      );
      setRows(fetched.filter((r): r is Row => r !== null));
      setLoading(false);
    });

    return unsub;
  }, [user]);

  if (!user) {
    return (
      <div className="text-sm text-gray-600">
        로그인이 필요합니다. 상단 우측 메뉴에서 로그인해주세요.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="flex items-center justify-between">
        <EnablePushButton />
        <button
          onClick={() => setShowAdd(v => !v)}
          className="px-3 py-1.5 bg-gray-100 border rounded text-sm hover:bg-gray-200"
        >
          {showAdd ? '닫기' : '+ 공연 추가'}
        </button>
      </section>

      {showAdd && <AddConcertModule />}

      <section>
        <h2 className="text-lg font-semibold mb-3">내가 구독한 공연</h2>
        {loading ? (
          <div className="text-sm text-gray-500">불러오는 중…</div>
        ) : rows.length === 0 ? (
          <div className="text-sm text-gray-500 border-dashed border-2 rounded p-6 text-center">
            아직 구독한 공연이 없습니다. 위 "공연 추가" 버튼으로 시작하세요.
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-3">
            {rows.map(r => (
              <ConcertCard
                key={r.goodsCode}
                goodsCode={r.goodsCode}
                name={r.name}
                subscriberEnabled={r.enabled}
                myBlockCount={r.myBlocks}
                totalAvail={r.totalAvail}
                totalSeats={r.totalSeats}
                updatedAt={r.updatedAt}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

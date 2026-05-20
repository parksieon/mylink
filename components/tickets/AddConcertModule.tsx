// /components/tickets/AddConcertModule.tsx
// URL-paste-only UX. Calls /api/tickets/lookup which:
//   - Hits Interpark summary for goodsName + placeCode + placeName
//   - Looks up /venues/{placeCode} cache, falls back to live externalSeatMeta probe
//   - Returns a grouped block layout so EVERY Interpark venue is supported, not just presets
'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getAuth } from 'firebase/auth';
import { firebaseApp } from '@/lib/firebase';
import { BlockPicker, type BlockPickerGroup } from './BlockPicker';
import { extractGoodsCode } from '@/lib/tickets/interparkMeta';
import type { BlockSpec, VenueTemplate } from '@/lib/tickets/firestoreSchema';

type LookupResponse = {
  ok: true;
  meta: {
    goodsCode: string;
    goodsName: string;
    placeCode: string;
    placeName: string;
    playStartDate: string;
    playEndDate: string;
    venueTemplate: VenueTemplate;
    supported: boolean;
  };
  layout: {
    groups: BlockPickerGroup[];
    totalSeats: number;
    blockCount: number;
  };
  defaults: { playSeq: string; blocks: BlockSpec[] };
};

export function AddConcertModule() {
  const router = useRouter();
  const [url, setUrl] = useState('');
  const [looking, setLooking] = useState(false);
  const [data, setData] = useState<LookupResponse | null>(null);
  const [blocks, setBlocks] = useState<BlockSpec[]>([]);
  const [playSeq, setPlaySeq] = useState('001');
  const [showBlocks, setShowBlocks] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lookup = useCallback(async (raw: string) => {
    setError(null);
    setData(null);
    setBlocks([]);
    if (!raw.trim()) return;
    if (!extractGoodsCode(raw)) {
      setError('Interpark 공연 URL 또는 goodsCode 를 입력해주세요');
      return;
    }
    setLooking(true);
    try {
      const idToken = await getAuth(firebaseApp).currentUser?.getIdToken();
      if (!idToken) throw new Error('로그인이 필요합니다');
      const res = await fetch(`/api/tickets/lookup?url=${encodeURIComponent(raw)}`, {
        headers: { Authorization: `Bearer ${idToken}` },
      });
      if (!res.ok) throw new Error(await res.text());
      const j = (await res.json()) as LookupResponse;
      setData(j);
      setPlaySeq(j.defaults.playSeq);
      setBlocks(j.defaults.blocks);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLooking(false);
    }
  }, []);

  useEffect(() => {
    if (!url) return;
    const t = setTimeout(() => lookup(url), 400);
    return () => clearTimeout(t);
  }, [url, lookup]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!data) {
      setError('공연 정보를 먼저 조회해주세요');
      return;
    }
    if (blocks.length === 0) {
      setError('블록을 1개 이상 선택해주세요');
      return;
    }
    setSubmitting(true);
    try {
      const idToken = await getAuth(firebaseApp).currentUser?.getIdToken();
      if (!idToken) throw new Error('로그인이 필요합니다');
      const res = await fetch('/api/tickets/concerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({
          goodsCode: data.meta.goodsCode,
          placeCode: data.meta.placeCode,
          playSeq,
          venueTemplate: data.meta.venueTemplate,
          name: data.meta.goodsName,
          blocks,
          playStartDate: data.meta.playStartDate || undefined,
          playEndDate: data.meta.playEndDate || undefined,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      router.push(`/tickets/${data.meta.goodsCode}`);
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  function fmtDate(yyyymmdd: string) {
    if (!/^\d{8}$/.test(yyyymmdd)) return yyyymmdd;
    return `${yyyymmdd.slice(0, 4)}-${yyyymmdd.slice(4, 6)}-${yyyymmdd.slice(6, 8)}`;
  }

  return (
    <form onSubmit={submit} className="space-y-4 border rounded-lg p-4 bg-white">
      <h2 className="text-lg font-semibold">공연 추가</h2>

      <label className="block">
        <span className="text-sm">Interpark 공연 URL 붙여넣기</span>
        <input
          value={url}
          onChange={e => setUrl(e.target.value)}
          placeholder="https://tickets.interpark.com/goods/26004120"
          className="mt-1 w-full border rounded px-2 py-1.5 font-mono text-sm"
          autoFocus
        />
        <span className="text-xs text-gray-500 block mt-1">
          공연장이 처음 등장하면 좌석 layout 을 자동으로 분석합니다 (1-2초 소요, 다음부터는 즉시)
        </span>
      </label>

      {looking && <div className="text-sm text-gray-500">조회 중…</div>}

      {data && (
        <div className="border rounded p-3 bg-gray-50 space-y-2">
          <div>
            <div className="text-base font-semibold">{data.meta.goodsName}</div>
            <div className="text-sm text-gray-600">
              {data.meta.placeName} · {fmtDate(data.meta.playStartDate)}
              {data.meta.playEndDate !== data.meta.playStartDate && ` ~ ${fmtDate(data.meta.playEndDate)}`}
            </div>
            <div className="text-xs text-gray-500 font-mono mt-1">
              goodsCode {data.meta.goodsCode} · placeCode {data.meta.placeCode} · 블록 {data.layout.blockCount}개
            </div>
          </div>

          <div className="text-sm">
            모니터링할 블록 <span className="text-gray-500">({blocks.length}/{data.layout.blockCount}개 선택)</span>
            <button
              type="button"
              onClick={() => setShowBlocks(v => !v)}
              className="ml-2 text-xs text-blue-600 hover:underline"
            >
              {showBlocks ? '블록 숨기기' : '블록 선택 변경'}
            </button>
          </div>
          {showBlocks && (
            <div className="bg-white border rounded p-2">
              <BlockPicker groups={data.layout.groups} value={blocks} onChange={setBlocks} />
            </div>
          )}

          <details className="text-xs text-gray-600">
            <summary className="cursor-pointer hover:text-gray-900">고급 (다회차 공연)</summary>
            <label className="mt-2 block">
              <span>playSeq (회차)</span>
              <input
                value={playSeq}
                onChange={e => setPlaySeq(e.target.value)}
                className="ml-2 border rounded px-2 py-0.5 font-mono w-20"
              />
              <span className="ml-2 text-gray-500">기본 001. 다회차면 002, 003... 시도</span>
            </label>
          </details>
        </div>
      )}

      {error && <div className="text-sm text-red-600">{error}</div>}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={submitting || !data}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {submitting ? '저장 중…' : '모니터링 시작'}
        </button>
      </div>

      <p className="text-xs text-gray-500">
        같은 goodsCode 를 다른 사람이 이미 등록했다면 새 공연이 만들어지지 않고 본인이 구독자로 추가됨.
      </p>
    </form>
  );
}

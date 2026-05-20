// /lib/tickets/interparkMeta.ts
// Resolves an Interpark URL → full concert metadata via api-ticketfront.interpark.com.
// Discovered by capturing network requests from the SPA at tickets.interpark.com/goods/{code}.
//
// Endpoint: GET https://api-ticketfront.interpark.com/v1/goods/{goodsCode}/summary
// Requires browser-like headers (Origin + Referer) or returns 403.
import type { VenueTemplate } from './firestoreSchema';

const SUMMARY_BASE = 'https://api-ticketfront.interpark.com/v1/goods';

const PLACE_CODE_TO_TEMPLATE: Record<string, VenueTemplate> = {
  '25001214': 'SAC_CONCERT',
  '17000515': 'IBK_CHAMBER',
  '25001205': 'LOTTE_CONCERT',
  // 부천아트센터(24001584)는 인터파크 waiting queue + 세션 토큰 필요로 변경되어 비회원 cron 으로 좌석 조회 불가.
  // 등록은 가능하나 폴링이 항상 0/0 으로 떠서 사용자 혼동 유발 → preset 매핑 제거로 등록 단계에서 차단.
};

/** Extract goodsCode from a full Interpark URL or a bare code. Returns null if not parseable. */
export function extractGoodsCode(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  if (/^\d{6,}$/.test(trimmed)) return trimmed;
  const m = trimmed.match(/\/goods\/(\d{6,})/);
  if (m) return m[1];
  const q = trimmed.match(/[?&]goodsCode=(\d{6,})/);
  if (q) return q[1];
  return null;
}

export type GoodsMeta = {
  goodsCode: string;
  goodsName: string;
  placeCode: string;
  placeName: string;
  playStartDate: string;   // YYYYMMDD
  playEndDate: string;     // YYYYMMDD
  venueTemplate: VenueTemplate;
  supported: boolean;      // true if we have a venue preset for this placeCode
};

export async function fetchGoodsSummary(goodsCode: string): Promise<GoodsMeta> {
  const url =
    `${SUMMARY_BASE}/${encodeURIComponent(goodsCode)}/summary` +
    `?goodsCode=${encodeURIComponent(goodsCode)}&passCode=&priceGrade=&seatGrade=&ts=${Date.now()}`;

  const res = await fetch(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      Referer: `https://tickets.interpark.com/goods/${goodsCode}`,
      Origin: 'https://tickets.interpark.com',
      Accept: 'application/json, text/plain, */*',
      'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
    },
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`Interpark summary fetch failed: ${res.status}`);

  const body = (await res.json()) as {
    data?: {
      goodsCode?: string;
      goodsName?: string;
      placeCode?: string;
      placeName?: string;
      playStartDate?: string;
      playEndDate?: string;
    };
  };
  const d = body.data;
  if (!d || !d.goodsCode || !d.placeCode) {
    throw new Error('Unexpected Interpark response shape');
  }

  const template: VenueTemplate = PLACE_CODE_TO_TEMPLATE[d.placeCode] ?? 'CUSTOM';

  return {
    goodsCode: d.goodsCode,
    goodsName: d.goodsName ?? '',
    placeCode: d.placeCode,
    placeName: d.placeName ?? '',
    playStartDate: d.playStartDate ?? '',
    playEndDate: d.playEndDate ?? '',
    venueTemplate: template,
    supported: template !== 'CUSTOM',
  };
}

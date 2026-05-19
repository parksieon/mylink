// /lib/tickets/interpark.ts
// Port of inline Python in monitor_mahler8.sh / monitor_chamber_a.sh.
// Interpark seatStatus API:
//   - up to 2 blockKeys per request (3+ returns partial/empty)
//   - response: { data: [string, ...] } — one string per requested block, in order
//   - each char = one seat; '0' = unavailable, anything else = available
// Required headers: User-Agent + Referer (mimics browser).

const ENDPOINT = 'https://tickets.interpark.com/onestop/api/seatStatus';
const REQUEST_TIMEOUT_MS = 5_000;

export type SeatStatusParams = {
  goodsCode: string;
  placeCode: string;
  playSeq: string;       // typically "001"
  blockCodes: string[];  // e.g. ["201", "202", ...] or ["004", "005", ...]
};

export type SeatStatusResult = {
  blockAvail: Record<string, number>;   // block code → available seat count
  blockTotal: Record<string, number>;   // block code → total seat count in that block
  totalAvail: number;
  totalSeats: number;
};

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
  Accept: 'application/json',
};

function pairBlocks<T>(arr: T[]): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += 2) out.push(arr.slice(i, i + 2));
  return out;
}

function countAvail(data: string | null | undefined): number {
  if (!data) return 0;
  let n = 0;
  for (let i = 0; i < data.length; i++) if (data[i] !== '0') n++;
  return n;
}

async function fetchPair(
  params: SeatStatusParams,
  pair: string[]
): Promise<{ data: (string | null)[] } | null> {
  const keys = pair.map(b => `blockKeys=001%3A${encodeURIComponent(b)}`).join('&');
  const url =
    `${ENDPOINT}?goodsCode=${params.goodsCode}` +
    `&placeCode=${params.placeCode}` +
    `&playSeq=${params.playSeq}` +
    `&${keys}` +
    `&bizCode=WEBBR`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      headers: {
        ...HEADERS,
        Referer: `https://tickets.interpark.com/goods/${params.goodsCode}`,
      },
      signal: controller.signal,
      cache: 'no-store',
    });
    if (!res.ok) return null;
    return (await res.json()) as { data: (string | null)[] };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchSeatStatus(params: SeatStatusParams): Promise<SeatStatusResult> {
  const pairs = pairBlocks(params.blockCodes);
  const blockAvail: Record<string, number> = {};
  const blockTotal: Record<string, number> = {};

  const results = await Promise.all(pairs.map(p => fetchPair(params, p)));

  results.forEach((res, i) => {
    const pair = pairs[i];
    if (!res || !Array.isArray(res.data)) {
      // failed pair — leave blocks unmeasured; pollConcert treats missing as "no change"
      return;
    }
    res.data.forEach((s, idx) => {
      const block = pair[idx];
      if (block == null) return;
      const total = s ? s.length : 0;
      const avail = countAvail(s);
      blockTotal[block] = total;
      blockAvail[block] = avail;
    });
  });

  const totalAvail = Object.values(blockAvail).reduce((a, b) => a + b, 0);
  const totalSeats = Object.values(blockTotal).reduce((a, b) => a + b, 0);

  return { blockAvail, blockTotal, totalAvail, totalSeats };
}

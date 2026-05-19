// /lib/tickets/seatLayoutResolver.ts
// Dynamic venue layout discovery via Interpark's externalSeatMeta endpoint.
// Allows the app to handle any concert hall in Interpark without manual preset entry.
//
// Discovery flow:
//   - GET /onestop/api/externalSeatMeta?...&blockKeys=001:001&blockKeys=001:002&...
//   - Response: array of { blockKey, seats: [{ floor, rowNo, seatNo, ... }] }
//   - We probe block 001..N in pairs until we hit `EMPTY_RUN` consecutive empty blocks.
//   - From each non-empty block we extract the floor + zone (rowNo prefix) + seat count.
//   - Group by floor → BlockGroup list for the UI.
//
// Works WITHOUT auth — only requires Referer + Origin headers. Discovered 2026-05-18.
import type { BlockSpec } from './firestoreSchema';

const ENDPOINT = 'https://tickets.interpark.com/onestop/api/externalSeatMeta';
const MAX_BLOCK = 50;       // hard cap (real venues range 7~26 blocks; 50 is more than enough)
const EMPTY_RUN_STOP = 4;   // stop after this many consecutive empty pair-results
const REQUEST_TIMEOUT_MS = 8_000;

const HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  Origin: 'https://tickets.interpark.com',
  Accept: 'application/json, text/plain, */*',
  'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8',
};

type RawSeat = { floor?: string; rowNo?: string; seatNo?: string };
type RawBlock = { blockKey?: string; seats?: RawSeat[] };

export type BlockGroup = {
  title: string;       // e.g. "1층" or "2층"
  blocks: BlockSpec[];
};

export type ResolvedLayout = {
  blocks: BlockSpec[];           // flat list, all blocks
  groups: BlockGroup[];          // grouped by floor for UI
  totalSeats: number;
  resolvedAt: number;            // ms epoch
  source: 'externalSeatMeta' | 'preset';
};

async function fetchPair(
  goodsCode: string,
  placeCode: string,
  playSeq: string,
  a: string,
  b: string
): Promise<RawBlock[]> {
  const url =
    `${ENDPOINT}?goodsCode=${encodeURIComponent(goodsCode)}` +
    `&placeCode=${encodeURIComponent(placeCode)}` +
    `&playSeq=${encodeURIComponent(playSeq)}` +
    `&blockKeys=001%3A${a}&blockKeys=001%3A${b}` +
    `&bizCode=WEBBR`;

  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      headers: { ...HEADERS, Referer: `https://tickets.interpark.com/goods/${goodsCode}` },
      cache: 'no-store',
      signal: ac.signal,
    });
    if (!res.ok) return [];
    const j = (await res.json()) as unknown;
    const arr = Array.isArray(j) ? (j as RawBlock[]) : (Object.values(j as object) as RawBlock[]);
    return arr;
  } catch {
    return [];
  } finally {
    clearTimeout(timer);
  }
}

function zonePrefix(rowNo: string | undefined): string {
  if (!rowNo) return '';
  return rowNo.split(/\s+/)[0] ?? '';
}

function floorOrder(floor: string): number {
  // Sort: 1F → 2F → 3F → unknown
  const m = floor.match(/(\d)/);
  return m ? parseInt(m[1], 10) : 99;
}

export async function resolveSeatLayout(
  goodsCode: string,
  placeCode: string,
  playSeq: string
): Promise<ResolvedLayout> {
  const found: { blockKey: string; floor: string; zone: string; count: number }[] = [];
  let consecutiveEmpty = 0;

  for (let i = 1; i <= MAX_BLOCK; i += 2) {
    const a = String(i).padStart(3, '0');
    const b = String(Math.min(i + 1, MAX_BLOCK)).padStart(3, '0');
    const items = await fetchPair(goodsCode, placeCode, playSeq, a, b);
    let pairEmpty = true;
    for (const it of items) {
      if (!it?.blockKey || !Array.isArray(it.seats) || it.seats.length === 0) continue;
      const first = it.seats[0];
      const code = it.blockKey.split(':')[1] ?? '';
      found.push({
        blockKey: it.blockKey,
        floor: first?.floor ?? '',
        zone: zonePrefix(first?.rowNo),
        count: it.seats.length,
      });
      pairEmpty = false;
      void code;
    }
    if (pairEmpty) consecutiveEmpty++;
    else consecutiveEmpty = 0;
    if (consecutiveEmpty >= EMPTY_RUN_STOP) break;
  }

  const blocks: BlockSpec[] = found.map(f => ({
    code: f.blockKey.split(':')[1] ?? f.blockKey,
    label: `${f.floor} ${f.zone} (${f.count})`,
    grade: '',
    floor: f.floor,
  }));

  // Group by floor; preserve venue ordering by sorting floor numerically.
  const byFloor = new Map<string, BlockSpec[]>();
  for (const b of blocks) {
    const key = b.floor ?? '';
    if (!byFloor.has(key)) byFloor.set(key, []);
    byFloor.get(key)!.push(b);
  }

  const groups: BlockGroup[] = Array.from(byFloor.entries())
    .sort((x, y) => floorOrder(x[0]) - floorOrder(y[0]))
    .map(([floor, bs]) => ({ title: floor || '기타', blocks: bs }));

  const totalSeats = found.reduce((a, b) => a + b.count, 0);

  return {
    blocks,
    groups,
    totalSeats,
    resolvedAt: Date.now(),
    source: 'externalSeatMeta',
  };
}

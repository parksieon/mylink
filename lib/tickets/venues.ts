// /lib/tickets/venues.ts
import type { BlockSpec, VenueTemplate } from './firestoreSchema';

export type VenuePreset = {
  template: VenueTemplate;
  name: string;
  placeCode: string;
  playSeq: string;
  groups: { title: string; blocks: BlockSpec[] }[];
};

// 예술의전당 콘서트홀 (placeCode 25001214)
// 1F: 101-105, 2F: 201-214, 3F: 301-315
// Grade-to-block mapping varies per concert — user picks blocks, picks grade label themselves.
const SAC_CONCERT: VenuePreset = {
  template: 'SAC_CONCERT',
  name: '예술의전당 콘서트홀',
  placeCode: '25001214',
  playSeq: '001',
  groups: [
    {
      title: '1F (101-105)',
      blocks: Array.from({ length: 5 }, (_, i) => {
        const n = 101 + i;
        return { code: String(n), label: `1F ${n}블록`, grade: '', floor: '1F' };
      }),
    },
    {
      title: '2F (201-214)',
      blocks: Array.from({ length: 14 }, (_, i) => {
        const n = 201 + i;
        return { code: String(n), label: `2F ${n}블록`, grade: '', floor: '2F' };
      }),
    },
    {
      title: '3F (301-315)',
      blocks: Array.from({ length: 15 }, (_, i) => {
        const n = 301 + i;
        return { code: String(n), label: `3F ${n}블록`, grade: '', floor: '3F' };
      }),
    },
  ],
};

// 예술의전당 IBK 챔버홀 (placeCode 17000515)
// blockName ≠ grade — 1F A/B/C 블록은 공연마다 R/S 다르고, 2F 는 항상 A석.
const IBK_CHAMBER: VenuePreset = {
  template: 'IBK_CHAMBER',
  name: '예술의전당 IBK챔버홀',
  placeCode: '17000515',
  playSeq: '001',
  groups: [
    {
      title: '1F (R/S석 — 공연마다 다름)',
      blocks: [
        { code: '001', label: '1F A블록', grade: 'R/S석', floor: '1F' },
        { code: '002', label: '1F B블록', grade: 'R/S석', floor: '1F' },
        { code: '003', label: '1F C블록', grade: 'R/S석', floor: '1F' },
      ],
    },
    {
      title: '2F (A석)',
      blocks: [
        { code: '004', label: '2F A블록', grade: 'A석', floor: '2F' },
        { code: '005', label: '2F B블록', grade: 'A석', floor: '2F' },
        { code: '006', label: '2F BOX1', grade: 'A석', floor: '2F' },
        { code: '007', label: '2F BOX2', grade: 'A석', floor: '2F' },
      ],
    },
  ],
};

// 부천아트센터 콘서트홀 (placeCode 24001584, 1445석)
// 2024년 개관, 클래식 전용 슈박스형, 부천필 본거지
// 26개 블록 (1F 메인 6 + 2F 정면 3 + 2F 사이드/합창 5 + 3F 5 + 박스 7)
const BUCHEON_CONCERT: VenuePreset = {
  template: 'BUCHEON_CONCERT',
  name: '부천아트센터 콘서트홀',
  placeCode: '24001584',
  playSeq: '001',
  groups: [
    {
      title: '1F 메인',
      blocks: [
        { code: '006', label: '1F A구역 (86)', grade: '', floor: '1F' },
        { code: '007', label: '1F B구역 (283)', grade: '', floor: '1F' },
        { code: '008', label: '1F C구역 (86)', grade: '', floor: '1F' },
        { code: '011', label: '1F D구역 (49)', grade: '', floor: '1F' },
        { code: '012', label: '1F E구역 (117)', grade: '', floor: '1F' },
        { code: '013', label: '1F F구역 (49)', grade: '', floor: '1F' },
      ],
    },
    {
      title: '2F 정면',
      blocks: [
        { code: '014', label: '2F A구역 (41)', grade: '', floor: '2F' },
        { code: '015', label: '2F B구역 (138)', grade: '', floor: '2F' },
        { code: '016', label: '2F C구역 (41)', grade: '', floor: '2F' },
      ],
    },
    {
      title: '2F 사이드 + 합창석',
      blocks: [
        { code: '005', label: '2F L구역 (78)', grade: '', floor: '2F' },
        { code: '009', label: '2F R구역 (78)', grade: '', floor: '2F' },
        { code: '001', label: '2F LP구역 합창석 (34)', grade: '', floor: '2F' },
        { code: '002', label: '2F P구역 합창석 (85)', grade: '', floor: '2F' },
        { code: '003', label: '2F RP구역 합창석 (34)', grade: '', floor: '2F' },
      ],
    },
    {
      title: '3F',
      blocks: [
        { code: '004', label: '3F L구역 (41)', grade: '', floor: '3F' },
        { code: '010', label: '3F R구역 (41)', grade: '', floor: '3F' },
        { code: '017', label: '3F A구역 (26)', grade: '', floor: '3F' },
        { code: '018', label: '3F B구역 (96)', grade: '', floor: '3F' },
        { code: '019', label: '3F C구역 (26)', grade: '', floor: '3F' },
      ],
    },
    {
      title: 'BOX (소수석)',
      blocks: [
        { code: '020', label: '1F A 박스 (2)', grade: '', floor: '1F' },
        { code: '021', label: '1F C 박스 (2)', grade: '', floor: '1F' },
        { code: '022', label: '1F D 박스 (2)', grade: '', floor: '1F' },
        { code: '023', label: '1F E 박스 (6)', grade: '', floor: '1F' },
        { code: '024', label: '1F F 박스 (2)', grade: '', floor: '1F' },
        { code: '025', label: '2F A 박스 (1)', grade: '', floor: '2F' },
        { code: '026', label: '2F C 박스 (1)', grade: '', floor: '2F' },
      ],
    },
  ],
};

// 롯데콘서트홀 (placeCode 25001205, 1444석)
// 좌석 layout 은 인터파크의 좌석배치도 SVG 좌표를 분석해 그룹·라벨을 추정 (2026-05-20 수집).
// floor·zone 라벨은 추정치 — 실제 사용 중 mismatch 발견되면 수정.
const LOTTE_CONCERT: VenuePreset = {
  template: 'LOTTE_CONCERT',
  name: '롯데콘서트홀',
  placeCode: '25001205',
  playSeq: '001',
  groups: [
    {
      title: '합창석 (무대 뒤편)',
      blocks: [
        { code: '018', label: '합창석 (167석)', grade: '', floor: '무대뒤' },
      ],
    },
    {
      title: '1F 사이드·BOX',
      blocks: [
        { code: '007', label: '1F 좌측 상단 (151석)', grade: '', floor: '1F' },
        { code: '009', label: '1F 우측 상단 (151석)', grade: '', floor: '1F' },
        { code: '016', label: '1F 좌측 측면 (61석)', grade: '', floor: '1F' },
        { code: '017', label: '1F 우측 측면 (61석)', grade: '', floor: '1F' },
        { code: '008', label: '1F 좌측 안쪽 (90석)', grade: '', floor: '1F' },
        { code: '010', label: '1F 우측 안쪽 (90석)', grade: '', floor: '1F' },
      ],
    },
    {
      title: '1F 메인 객석',
      blocks: [
        { code: '001', label: '1F 좌측 끝 (35석)', grade: '', floor: '1F' },
        { code: '002', label: '1F 좌중앙 (31석)', grade: '', floor: '1F' },
        { code: '003', label: '1F 중앙 (93석)', grade: '', floor: '1F' },
        { code: '004', label: '1F 우중앙 (31석)', grade: '', floor: '1F' },
        { code: '005', label: '1F 우측 끝 (35석)', grade: '', floor: '1F' },
      ],
    },
    {
      title: '2F·3F 후방',
      blocks: [
        { code: '011', label: '후방 좌측 끝 (12석)', grade: '', floor: '2F' },
        { code: '012', label: '후방 좌중앙 (15석)', grade: '', floor: '2F' },
        { code: '013', label: '후방 중앙 (41석)', grade: '', floor: '2F' },
        { code: '014', label: '후방 우중앙 (15석)', grade: '', floor: '2F' },
        { code: '015', label: '후방 우측 끝 (12석)', grade: '', floor: '2F' },
      ],
    },
  ],
};

export const VENUE_PRESETS: Record<VenueTemplate, VenuePreset | null> = {
  SAC_CONCERT,
  IBK_CHAMBER,
  BUCHEON_CONCERT,
  LOTTE_CONCERT,
  CUSTOM: null,
};

export function getVenuePreset(template: VenueTemplate): VenuePreset | null {
  return VENUE_PRESETS[template];
}

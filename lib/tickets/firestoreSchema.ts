// /lib/tickets/firestoreSchema.ts
// 구조 타입 — client SDK Timestamp 와 admin SDK Timestamp 둘 다 만족.
// 서버는 admin SDK 로 쓰고 클라는 client SDK 로 읽으므로, 양쪽 SDK 의 Timestamp 가
// 같은 schema 타입에 대입 가능해야 함.
export interface Timestamp {
  toDate(): Date;
  toMillis(): number;
  readonly seconds: number;
  readonly nanoseconds: number;
}

export type VenueTemplate = 'SAC_CONCERT' | 'IBK_CHAMBER' | 'BUCHEON_CONCERT' | 'LOTTE_CONCERT' | 'CUSTOM';

export type BlockSpec = {
  code: string;        // e.g. "201", "004"
  label: string;       // e.g. "2F 201블록", "A블록 (2F)"
  grade: string;       // e.g. "S석", "A석", "R석"
  floor?: string;      // e.g. "1F", "2F", "3F"
};

export type ConcertState = {
  blockAvail: Record<string, number>;   // block code → available seat count
  totalAvail: number;
  totalSeats: number;
  updatedAt: Timestamp | null;
};

export type ConcertDoc = {
  goodsCode: string;
  placeCode: string;
  playSeq: string;
  venueTemplate: VenueTemplate;
  name: string;
  blocks: BlockSpec[];                  // union of all subscribers' interests
  state: ConcertState;
  enabled: boolean;
  subscriberCount: number;
  createdBy: string;                    // uid
  createdAt: Timestamp;
  updatedAt: Timestamp;
  // YYYYMMDD — 인터파크 summary 가 주는 형식 그대로. 기존 등록 공연은 없을 수 있어 optional.
  playStartDate?: string;
  playEndDate?: string;
};

export type SubscriberDoc = {
  uid: string;
  blocks: BlockSpec[];                  // subset of ConcertDoc.blocks
  enabled: boolean;
  createdAt: Timestamp;
};

export type AlertDoc = {
  increasedBlocks: { code: string; delta: number; label: string }[];
  totalDelta: number;
  sentAt: Timestamp;
  notifiedUids: string[];
};

export type FcmToken = {
  token: string;
  device: string;                       // user agent fragment
  createdAt: Timestamp;
};

export type UserExtraFields = {
  fcmTokens?: FcmToken[];
};

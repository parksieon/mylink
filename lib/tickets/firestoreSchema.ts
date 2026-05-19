// /lib/tickets/firestoreSchema.ts
import type { Timestamp } from 'firebase/firestore';

export type VenueTemplate = 'SAC_CONCERT' | 'IBK_CHAMBER' | 'BUCHEON_CONCERT' | 'CUSTOM';

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

import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

const OWNER_UID = process.env.NEXT_PUBLIC_SITE_OWNER_UID || "";
export const DEFAULT_QUOTA_BYTES = 200 * 1024 * 1024;
export const MAX_FILE_SIZE_BYTES = 100 * 1024 * 1024;

export function isOwnerUid(uid: string): boolean {
  return !!OWNER_UID && uid === OWNER_UID;
}

export interface QuotaInfo {
  usedBytes: number;
  quotaBytes: number;
  isOwner: boolean;
}

export async function getQuotaInfo(uid: string): Promise<QuotaInfo> {
  if (isOwnerUid(uid)) {
    return { usedBytes: 0, quotaBytes: Number.POSITIVE_INFINITY, isOwner: true };
  }
  const snap = await getDoc(doc(db, "users", uid));
  const data = snap.exists() ? snap.data() : {};
  return {
    usedBytes: (data.usedBytes as number) ?? 0,
    quotaBytes: (data.quotaBytes as number) ?? DEFAULT_QUOTA_BYTES,
    isOwner: false,
  };
}

export function formatBytes(bytes: number): string {
  if (!isFinite(bytes)) return "무제한";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

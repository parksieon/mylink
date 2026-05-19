import {
  doc,
  getDoc,
  setDoc,
  runTransaction,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface UserProfile {
  uid: string;
  displayName?: string;
  photoURL?: string;
  username?: string;
  bio?: string;
}

export const BIO_MAX_LENGTH = 300;

const USERNAME_REGEX = /^[a-z0-9][a-z0-9_-]{2,19}$/;

export function isValidUsername(username: string): boolean {
  return USERNAME_REGEX.test(username);
}

export async function getProfile(uid: string): Promise<UserProfile | null> {
  try {
    const snap = await getDoc(doc(db, "users", uid));
    if (!snap.exists()) return null;
    return { uid, ...(snap.data() as Omit<UserProfile, "uid">) };
  } catch (err) {
    console.error("getProfile failed:", err);
    return null;
  }
}

export async function getProfileByUsername(
  username: string
): Promise<UserProfile | null> {
  try {
    const mappingSnap = await getDoc(doc(db, "usernames", username));
    if (!mappingSnap.exists()) return null;
    const uid = mappingSnap.data().uid as string;
    return getProfile(uid);
  } catch (err) {
    console.error("getProfileByUsername failed:", err);
    return null;
  }
}

export type SetUsernameResult =
  | { ok: true }
  | { ok: false; reason: string };

export async function setUsername(
  uid: string,
  newUsername: string,
  oldUsername?: string
): Promise<SetUsernameResult> {
  if (!isValidUsername(newUsername)) {
    return {
      ok: false,
      reason: "3~20자의 영문 소문자, 숫자, _, - 만 사용할 수 있어요.",
    };
  }
  if (oldUsername === newUsername) {
    return { ok: true };
  }

  try {
    await runTransaction(db, async (tx) => {
      const newRef = doc(db, "usernames", newUsername);
      const existing = await tx.get(newRef);
      if (existing.exists() && existing.data()?.uid !== uid) {
        throw new Error("DUPLICATE");
      }
      tx.set(newRef, { uid });
      tx.set(doc(db, "users", uid), { username: newUsername }, { merge: true });
      if (oldUsername && oldUsername !== newUsername) {
        tx.delete(doc(db, "usernames", oldUsername));
      }
    });
    return { ok: true };
  } catch (err) {
    if (err instanceof Error && err.message === "DUPLICATE") {
      return { ok: false, reason: "이미 사용 중인 username 이에요." };
    }
    console.error("setUsername failed:", err);
    return { ok: false, reason: "username 저장에 실패했어요." };
  }
}

export type SetBioResult = { ok: true } | { ok: false; reason: string };

export async function setBio(uid: string, bio: string): Promise<SetBioResult> {
  const trimmed = bio.trim();
  if (trimmed.length > BIO_MAX_LENGTH) {
    return { ok: false, reason: `소개는 ${BIO_MAX_LENGTH}자 이하로 입력해주세요.` };
  }
  try {
    await setDoc(doc(db, "users", uid), { bio: trimmed }, { merge: true });
    return { ok: true };
  } catch (err) {
    console.error("setBio failed:", err);
    return { ok: false, reason: "소개 저장에 실패했어요." };
  }
}

export async function upsertUserProfile(input: {
  uid: string;
  displayName?: string | null;
  photoURL?: string | null;
}): Promise<void> {
  await setDoc(
    doc(db, "users", input.uid),
    {
      displayName: input.displayName ?? "",
      photoURL: input.photoURL ?? "",
    },
    { merge: true }
  );
}

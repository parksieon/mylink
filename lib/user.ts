import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  increment,
  runTransaction,
  collection,
  query,
  orderBy,
  getDocs,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface UserProfile {
  uid: string;
  displayName?: string;
  photoURL?: string;
  username?: string;
}

export interface PublicLink {
  id: string;
  title: string;
  url: string;
  iconName: string;
  clickCount: number;
}

const USERNAME_REGEX = /^[a-z0-9][a-z0-9_-]{2,19}$/;

export function isValidUsername(username: string): boolean {
  return USERNAME_REGEX.test(username);
}

export async function getProfile(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(db, "users", uid));
  if (!snap.exists()) return null;
  return { uid, ...(snap.data() as Omit<UserProfile, "uid">) };
}

export async function getProfileByUsername(
  username: string
): Promise<UserProfile | null> {
  const mappingSnap = await getDoc(doc(db, "usernames", username));
  if (!mappingSnap.exists()) return null;
  const uid = mappingSnap.data().uid as string;
  return getProfile(uid);
}

export async function getUserLinks(uid: string): Promise<PublicLink[]> {
  const linksQ = query(
    collection(db, "users", uid, "links"),
    orderBy("createdAt", "asc")
  );
  const snap = await getDocs(linksQ);
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      title: data.title as string,
      url: data.url as string,
      iconName: (data.iconName as string) ?? "Link",
      clickCount: (data.clickCount as number) ?? 0,
    };
  });
}

export async function incrementLinkClick(
  uid: string,
  linkId: string
): Promise<void> {
  try {
    await updateDoc(doc(db, "users", uid, "links", linkId), {
      clickCount: increment(1),
    });
  } catch (err) {
    // 통계 누락은 사용자 흐름을 막지 않도록 조용히 로그만 남김
    console.error("incrementLinkClick failed:", err);
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

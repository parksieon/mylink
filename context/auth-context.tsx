"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
} from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";
import { upsertUserProfile } from "@/lib/user";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (current) => {
      setUser(current);
      setLoading(false);
      if (current) {
        // 로그인 사용자의 기본 프로필을 Firestore에 동기화 (공개 페이지에서 쓰임)
        try {
          await upsertUserProfile({
            uid: current.uid,
            displayName: current.displayName,
            photoURL: current.photoURL,
          });
        } catch (err) {
          console.error("Profile upsert failed:", err);
        }
      }
    });
    return () => unsub();
  }, []);

  const signIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      const code = (err as { code?: string })?.code;
      if (code === "auth/popup-blocked") {
        alert(
          "Google 로그인 팝업을 띄울 수 없습니다.\n\n" +
            "• 브라우저 주소창의 팝업 차단 아이콘을 확인해주세요\n" +
            "• 광고 차단기(AdGuard, uBlock 등)를 쓰고 있다면 이 사이트에서 잠시 꺼주세요"
        );
        return;
      }
      if (
        code === "auth/popup-closed-by-user" ||
        code === "auth/cancelled-popup-request"
      ) {
        // 사용자가 직접 닫음 — 조용히 무시
        return;
      }
      console.error("Google sign-in failed:", err);
    }
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}

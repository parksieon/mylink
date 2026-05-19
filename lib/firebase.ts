import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import {
  initializeFirestore,
  getFirestore,
  type Firestore,
} from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app: FirebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);

// Windows/Node 환경에서 gRPC 스트리밍 불안정 이슈 회피용 — 첫 호출 시 long-polling 옵션과 함께 초기화.
// 이후 getFirestore() 호출은 같은 인스턴스를 반환함.
let _db: Firestore;
try {
  _db = initializeFirestore(app, {
    experimentalForceLongPolling: true,
  });
} catch {
  // 이미 초기화된 경우(HMR 등) — 기존 인스턴스 사용
  _db = getFirestore(app);
}

export const db = _db;
export const auth = getAuth(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();
export const firebaseApp = app;

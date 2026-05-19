// /lib/firebase/admin.ts
// Server-side Firebase Admin SDK. Skip this file if your existing site already has it
// — just make sure adminDb() and adminMessaging() helpers are exported equivalently.
import { cert, getApp, getApps, initializeApp, type App } from 'firebase-admin/app';
import { getAuth, type Auth } from 'firebase-admin/auth';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { getMessaging, type Messaging } from 'firebase-admin/messaging';

function getServiceAccount() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!raw) throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY env var is missing');
  // Allow either raw JSON or base64-encoded JSON
  const json = raw.trim().startsWith('{') ? raw : Buffer.from(raw, 'base64').toString('utf8');
  return JSON.parse(json);
}

function ensureApp(): App {
  if (getApps().length) return getApp();
  return initializeApp({ credential: cert(getServiceAccount()) });
}

// 모듈 import 시점에 default app 초기화 — getAuth() 등을 admin.ts 헬퍼를 안 거치고
// 직접 firebase-admin/{auth,firestore} 에서 import 해서 쓰는 라우트들도 동작 보장.
ensureApp();

export function adminDb(): Firestore {
  return getFirestore(ensureApp());
}

export function adminMessaging(): Messaging {
  return getMessaging(ensureApp());
}

// getAuth() 를 직접 import 해서 쓰는 라우트가 default app 을 못 찾는 케이스를 막기 위해
// 명시적으로 ensureApp() 을 통한 헬퍼 제공.
export function adminAuth(): Auth {
  return getAuth(ensureApp());
}

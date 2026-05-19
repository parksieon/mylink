// /lib/firebase/admin.ts
// Server-side Firebase Admin SDK. Skip this file if your existing site already has it
// — just make sure adminDb() and adminMessaging() helpers are exported equivalently.
import { cert, getApp, getApps, initializeApp, type App } from 'firebase-admin/app';
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

export function adminDb(): Firestore {
  return getFirestore(ensureApp());
}

export function adminMessaging(): Messaging {
  return getMessaging(ensureApp());
}

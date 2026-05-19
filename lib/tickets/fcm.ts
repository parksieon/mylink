// /lib/tickets/fcm.ts
// Server-side push delivery using Firebase Admin SDK.
// Cleans up tokens that the FCM API reports as invalid.
import { FieldValue } from 'firebase-admin/firestore';
import { adminDb, adminMessaging } from '../firebase/admin';
import type { FcmToken } from './firestoreSchema';

type PushPayload = {
  title: string;
  body: string;
  url: string;          // deep-link, e.g. /tickets/26004120
};

const INVALID_TOKEN_ERRORS = new Set([
  'messaging/registration-token-not-registered',
  'messaging/invalid-registration-token',
  'messaging/invalid-argument',
]);

export async function pushToUser(uid: string, payload: PushPayload): Promise<{ sent: number; pruned: number }> {
  const db = adminDb();
  const userRef = db.collection('users').doc(uid);
  const snap = await userRef.get();
  const tokens: FcmToken[] = (snap.get('fcmTokens') as FcmToken[] | undefined) ?? [];
  if (tokens.length === 0) return { sent: 0, pruned: 0 };

  const tokenStrings = tokens.map(t => t.token);

  const res = await adminMessaging().sendEachForMulticast({
    tokens: tokenStrings,
    notification: { title: payload.title, body: payload.body },
    webpush: {
      notification: { title: payload.title, body: payload.body, icon: '/icon.png' },
      fcmOptions: { link: payload.url },
    },
    data: { url: payload.url },
  });

  const invalidTokens: FcmToken[] = [];
  res.responses.forEach((r, i) => {
    if (!r.success && r.error && INVALID_TOKEN_ERRORS.has(r.error.code)) {
      invalidTokens.push(tokens[i]);
    }
  });

  if (invalidTokens.length > 0) {
    await userRef.update({ fcmTokens: FieldValue.arrayRemove(...invalidTokens) });
  }

  return { sent: res.successCount, pruned: invalidTokens.length };
}

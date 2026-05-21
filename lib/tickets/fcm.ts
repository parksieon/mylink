// /lib/tickets/fcm.ts
// Server-side push delivery using Firebase Admin SDK.
// 토큰 저장소: users/{uid}/devices/{tokenId} 서브컬렉션.
// Cleans up tokens that the FCM API reports as invalid by deleting that device doc.
import { adminDb, adminMessaging } from '../firebase/admin';
import type { DocumentReference } from 'firebase-admin/firestore';
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
  const devicesSnap = await db.collection('users').doc(uid).collection('devices').get();
  if (devicesSnap.empty) return { sent: 0, pruned: 0 };

  const devices: { ref: DocumentReference; token: string }[] = devicesSnap.docs.map(d => ({
    ref: d.ref,
    token: (d.data() as FcmToken).token,
  }));
  const tokenStrings = devices.map(d => d.token);

  const res = await adminMessaging().sendEachForMulticast({
    tokens: tokenStrings,
    notification: { title: payload.title, body: payload.body },
    webpush: {
      notification: { title: payload.title, body: payload.body, icon: '/icon.png' },
      fcmOptions: { link: payload.url },
    },
    data: { url: payload.url },
  });

  const invalidRefs: DocumentReference[] = [];
  res.responses.forEach((r, i) => {
    if (!r.success && r.error && INVALID_TOKEN_ERRORS.has(r.error.code)) {
      invalidRefs.push(devices[i].ref);
    }
  });

  if (invalidRefs.length > 0) {
    const batch = db.batch();
    for (const ref of invalidRefs) batch.delete(ref);
    await batch.commit();
  }

  return { sent: res.successCount, pruned: invalidRefs.length };
}

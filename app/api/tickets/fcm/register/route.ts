// /app/api/tickets/fcm/register/route.ts
// POST: register a browser FCM token under the caller's user doc.
// Body: { token: string, device?: string }
import { NextResponse } from 'next/server';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { adminDb } from '@/lib/firebase/admin';
import type { FcmToken } from '@/lib/tickets/firestoreSchema';

export const runtime = 'nodejs';

async function requireUid(req: Request): Promise<string> {
  const header = req.headers.get('authorization');
  if (!header?.startsWith('Bearer ')) throw new Error('UNAUTHENTICATED');
  const decoded = await getAuth().verifyIdToken(header.slice('Bearer '.length));
  return decoded.uid;
}

export async function POST(req: Request) {
  let uid: string;
  try { uid = await requireUid(req); } catch { return new NextResponse('Unauthorized', { status: 401 }); }

  const body = (await req.json()) as { token?: string; device?: string };
  if (!body.token || typeof body.token !== 'string' || body.token.length > 1000) {
    return NextResponse.json({ error: 'invalid token' }, { status: 400 });
  }

  const db = adminDb();
  const userRef = db.collection('users').doc(uid);

  await db.runTransaction(async tx => {
    const snap = await tx.get(userRef);
    const tokens: FcmToken[] = (snap.get('fcmTokens') as FcmToken[] | undefined) ?? [];
    // de-dupe: drop any existing entry with the same token, then append fresh
    const filtered = tokens.filter(t => t.token !== body.token);
    filtered.push({
      token: body.token!,
      device: body.device?.slice(0, 200) ?? '',
      createdAt: Timestamp.now(),
    });
    tx.set(userRef, { fcmTokens: filtered }, { merge: true });
  });

  return NextResponse.json({ ok: true });
}

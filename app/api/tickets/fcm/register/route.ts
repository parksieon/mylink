// /app/api/tickets/fcm/register/route.ts
// POST: register a browser FCM token under users/{uid}/devices/{token}.
// Body: { token: string, device?: string }
//
// 서브컬렉션 패턴인 이유: users/{uid} 문서는 공개 페이지 헤더용으로 read public 인데
// 그 안에 fcmTokens 배열을 두면 누구나 토큰·UA 를 enumerate 가능. 토큰은 본인만 read
// 가능한 서브컬렉션으로 분리해야 PoLP 가 지켜진다.
import { NextResponse } from 'next/server';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { adminDb } from '@/lib/firebase/admin';

export const runtime = 'nodejs';

async function requireUid(req: Request): Promise<string> {
  const header = req.headers.get('authorization');
  if (!header?.startsWith('Bearer ')) throw new Error('UNAUTHENTICATED');
  const idToken = header.slice('Bearer '.length);
  const decoded = await getAuth().verifyIdToken(idToken);
  return decoded.uid;
}

// FCM 토큰은 URL-safe base64 + ':' 만 사용 — Firestore doc id 에 안전하지만
// 만일을 대비해 path 구분자 '/' 만 한 번 더 escape.
function tokenToDocId(token: string): string {
  return token.replace(/\//g, '_');
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
  const deviceRef = userRef.collection('devices').doc(tokenToDocId(body.token));

  await deviceRef.set({
    token: body.token,
    device: body.device?.slice(0, 200) ?? '',
    createdAt: Timestamp.now(),
  });

  // 기존 users/{uid}.fcmTokens 배열 잔존분 정리 — 한 번이라도 register 호출되면 자동 cleanup.
  // 실패해도 무시 (필드가 원래 없는 케이스가 정상).
  await userRef.update({ fcmTokens: FieldValue.delete() }).catch(() => {});

  return NextResponse.json({ ok: true });
}

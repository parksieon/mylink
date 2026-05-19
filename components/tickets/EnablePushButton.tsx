// /components/tickets/EnablePushButton.tsx
// Asks for browser notification permission, fetches the FCM token, and registers it server-side.
'use client';

import { useEffect, useState } from 'react';
import { getAuth } from 'firebase/auth';
import { getMessaging, getToken, isSupported } from 'firebase/messaging';
import { firebaseApp } from '@/lib/firebase';

export function EnablePushButton() {
  const [status, setStatus] = useState<'idle' | 'asking' | 'enabled' | 'denied' | 'unsupported' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const supported = typeof window !== 'undefined' && (await isSupported().catch(() => false));
      if (!supported) {
        setStatus('unsupported');
        return;
      }
      if (Notification.permission === 'granted') setStatus('enabled');
      else if (Notification.permission === 'denied') setStatus('denied');
    })();
  }, []);

  async function enable() {
    setError(null);
    setStatus('asking');
    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setStatus(permission === 'denied' ? 'denied' : 'idle');
        return;
      }

      const sw = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
      const messaging = getMessaging(firebaseApp);
      const token = await getToken(messaging, {
        vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
        serviceWorkerRegistration: sw,
      });
      if (!token) {
        setStatus('error');
        setError('토큰을 가져오지 못함');
        return;
      }

      const idToken = await getAuth(firebaseApp).currentUser?.getIdToken();
      if (!idToken) {
        setStatus('error');
        setError('로그인이 필요합니다');
        return;
      }

      const res = await fetch('/api/tickets/fcm/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({ token, device: navigator.userAgent }),
      });
      if (!res.ok) throw new Error(await res.text());
      setStatus('enabled');
    } catch (e) {
      setStatus('error');
      setError((e as Error).message);
    }
  }

  if (status === 'unsupported') {
    return (
      <div className="text-sm text-gray-500">
        이 브라우저는 푸시 알림을 지원하지 않습니다. (iOS Safari는 홈화면 PWA 설치 후 사용 가능)
      </div>
    );
  }

  if (status === 'enabled') {
    return <div className="text-sm text-green-600">✓ 푸시 알림 활성화됨</div>;
  }

  if (status === 'denied') {
    return (
      <div className="text-sm text-orange-600">
        브라우저 알림 권한이 거부됨. 사이트 설정에서 알림 허용 후 다시 시도.
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={enable}
        disabled={status === 'asking'}
        className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50"
      >
        {status === 'asking' ? '요청 중…' : '🔔 알림 받기'}
      </button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}

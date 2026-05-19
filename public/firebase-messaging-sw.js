// /public/firebase-messaging-sw.js
// Firebase Cloud Messaging service worker — handles BACKGROUND notifications
// when the site is closed or in another tab. Service workers can't read process.env,
// so the firebaseConfig values below must be HARD-CODED with your project's values
// (these are public Web API keys, fine to commit).
//
// Replace each "REPLACE_*" placeholder before deploying.
importScripts('https://www.gstatic.com/firebasejs/10.13.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.13.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'AIzaSyDAsqjIL9UC8CsyA1-C0JBukixp34PdRAY',
  authDomain: 'my-link-e4670.firebaseapp.com',
  projectId: 'my-link-e4670',
  messagingSenderId: '725534168921',
  appId: '1:725534168921:web:b85289fe3a147fb7ad1e48',
});

const messaging = firebase.messaging();

// Background message handler — fires when the page is not visible.
messaging.onBackgroundMessage(payload => {
  const title = payload.notification?.title || '취소표 알림';
  const body = payload.notification?.body || '';
  const url = payload.data?.url || '/tickets';

  self.registration.showNotification(title, {
    body,
    icon: '/icon.png',
    badge: '/icon.png',
    tag: payload.data?.goodsCode || 'ticket-alert',
    data: { url },
    requireInteraction: true,
  });
});

// Clicking the OS notification opens the deep-link.
self.addEventListener('notificationclick', event => {
  event.notification.close();
  const url = event.notification.data?.url || '/tickets';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
      for (const c of windowClients) {
        if (c.url.includes(url) && 'focus' in c) return c.focus();
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});

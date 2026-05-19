// /app/tickets/layout.tsx
// Section layout — assumes the parent layout already provides an AuthProvider
// that exposes Firebase Auth state. If you need a stricter login gate, render
// a sign-in prompt here when there's no user.
import type { ReactNode } from 'react';

export const metadata = { title: '취소표 모니터' };

export default function TicketsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">🎫 취소표 모니터</h1>
        <p className="text-sm text-gray-600 mt-1">
          Interpark 공연 좌석을 1분마다 체크 → 취소표 발생 시 브라우저 푸시 알림
        </p>
      </header>
      {children}
    </div>
  );
}

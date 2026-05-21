"use client";

import { AlertTriangle } from "lucide-react";
import { isFirebaseStorageUrl } from "@/lib/url-safe";

interface HtmlSimViewerProps {
  url: string;
  className?: string;
  title?: string;
}

export function HtmlSimViewer({ url, className, title }: HtmlSimViewerProps) {
  if (!isFirebaseStorageUrl(url)) {
    return <UnsafeFallback className={className} />;
  }
  return (
    <iframe
      src={url}
      // allow-scripts + allow-popups — allow-same-origin 없음 ⇒ null origin 으로 격리됨.
      // allow-popups 는 iframe 안의 <a target="_blank"> 가 새 탭으로 열리게 해줌
      // (storage·cookie 공유 위험 없음).
      sandbox="allow-scripts allow-popups"
      referrerPolicy="no-referrer"
      title={title ?? "HTML 시뮬레이션"}
      className={
        className ?? "aspect-video w-full rounded-xl bg-white ring-1 ring-border/60"
      }
    />
  );
}

function UnsafeFallback({ className }: { className?: string }) {
  return (
    <div
      className={
        className ??
        "flex aspect-video w-full items-center justify-center rounded-xl bg-amber-50 ring-1 ring-amber-200/60"
      }
    >
      <div className="flex items-center gap-2 text-sm text-amber-900">
        <AlertTriangle size={14} />
        안전하지 않은 파일 주소예요.
      </div>
    </div>
  );
}

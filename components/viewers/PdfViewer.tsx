"use client";

import { AlertTriangle } from "lucide-react";
import { isFirebaseStorageUrl } from "@/lib/url-safe";

interface PdfViewerProps {
  url: string;
  className?: string;
  title?: string;
}

export function PdfViewer({ url, className, title }: PdfViewerProps) {
  if (!isFirebaseStorageUrl(url)) {
    return <UnsafeFallback className={className} />;
  }
  return (
    <iframe
      src={url}
      title={title ?? "PDF"}
      // 동일 오리진 PDF여도 추가 격리 — 파일 자체에 악성 JS가 있어도 부모 컨텍스트 접근 차단
      sandbox="allow-scripts allow-same-origin allow-downloads"
      referrerPolicy="no-referrer"
      className={
        className ??
        "aspect-[3/4] w-full rounded-xl bg-white ring-1 ring-border/60"
      }
    />
  );
}

function UnsafeFallback({ className }: { className?: string }) {
  return (
    <div
      className={
        className ??
        "flex aspect-[3/4] w-full items-center justify-center rounded-xl bg-amber-50 ring-1 ring-amber-200/60"
      }
    >
      <div className="flex items-center gap-2 text-sm text-amber-900">
        <AlertTriangle size={14} />
        안전하지 않은 파일 주소예요.
      </div>
    </div>
  );
}

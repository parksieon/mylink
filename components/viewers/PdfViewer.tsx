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
      // sandbox 는 의도적으로 미적용 — Chrome 이 sandbox iframe 안의 cross-origin PDF 를
      // "차단한 페이지" 로 가리는 케이스가 있어서. URL 자체는 isFirebaseStorageUrl 로
      // 이미 검증됐고, Chrome PDF viewer 가 PDF 내부 JS 실행을 자체 차단함.
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

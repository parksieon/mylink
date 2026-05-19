"use client";

interface PdfViewerProps {
  url: string;
  className?: string;
  title?: string;
}

export function PdfViewer({ url, className, title }: PdfViewerProps) {
  return (
    <iframe
      src={url}
      title={title ?? "PDF"}
      className={
        className ??
        "aspect-[3/4] w-full rounded-xl bg-white ring-1 ring-border/60"
      }
    />
  );
}

"use client";

interface HtmlSimViewerProps {
  url: string;
  className?: string;
  title?: string;
}

export function HtmlSimViewer({ url, className, title }: HtmlSimViewerProps) {
  return (
    <iframe
      src={url}
      sandbox="allow-scripts"
      title={title ?? "HTML 시뮬레이션"}
      className={
        className ?? "aspect-video w-full rounded-xl bg-white ring-1 ring-border/60"
      }
    />
  );
}

"use client";

import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { AlertTriangle, Loader2 } from "lucide-react";
import { isFirebaseStorageUrl, isSafeHttpUrl } from "@/lib/url-safe";
import "highlight.js/styles/github.css";

interface MarkdownViewerProps {
  url: string;
  className?: string;
}

type FetchState =
  | { kind: "loading" }
  | { kind: "ok"; text: string }
  | { kind: "error"; reason: string };

export function MarkdownViewer({ url, className }: MarkdownViewerProps) {
  const [state, setState] = useState<FetchState>({ kind: "loading" });

  useEffect(() => {
    if (!isFirebaseStorageUrl(url)) {
      setState({ kind: "error", reason: "안전하지 않은 파일 주소예요." });
      return;
    }
    let cancelled = false;
    setState({ kind: "loading" });
    fetch(url)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.text();
      })
      .then((text) => {
        if (!cancelled) setState({ kind: "ok", text });
      })
      .catch((err) => {
        if (!cancelled) {
          setState({
            kind: "error",
            reason: `불러오기 실패: ${(err as Error).message}`,
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [url]);

  if (state.kind === "loading") {
    return (
      <div
        className={`flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground ${className ?? ""}`}
      >
        <Loader2 size={14} className="animate-spin" /> 불러오는 중...
      </div>
    );
  }
  if (state.kind === "error") {
    return (
      <div
        className={`flex items-center gap-2 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-amber-200/60 dark:bg-amber-950/30 dark:text-amber-200 dark:ring-amber-900/60 ${className ?? ""}`}
      >
        <AlertTriangle size={14} className="shrink-0" />
        <span>{state.reason}</span>
      </div>
    );
  }

  return (
    <div className={`markdown-content ${className ?? ""}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={{
          a: ({ href, children, ...rest }) => {
            const safe = typeof href === "string" && isSafeHttpUrl(href);
            if (!safe) {
              return <span {...rest}>{children}</span>;
            }
            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer nofollow"
                {...rest}
              >
                {children}
              </a>
            );
          },
        }}
      >
        {state.text}
      </ReactMarkdown>
    </div>
  );
}

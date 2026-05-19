"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { ChevronLeft, AlertTriangle } from "lucide-react";
import type { Node } from "@/lib/nodes";
import { HtmlSimViewer } from "@/components/viewers/HtmlSimViewer";
import { PdfViewer } from "@/components/viewers/PdfViewer";

const ThreeDViewer = dynamic(
  () =>
    import("@/components/viewers/ThreeDViewer").then((m) => ({
      default: m.ThreeDViewer,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="h-[calc(100vh-3rem)] w-full animate-pulse bg-foreground/5" />
    ),
  }
);

const ArticleViewer = dynamic(
  () =>
    import("@/components/viewers/ArticleViewer").then((m) => ({
      default: m.ArticleViewer,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="h-[60vh] w-full animate-pulse rounded-2xl bg-foreground/5" />
    ),
  }
);

interface LeafViewProps {
  leaf: Node;
  parentHref: string;
}

export function LeafView({ leaf, parentHref }: LeafViewProps) {
  return (
    <div className="relative">
      <Link
        href={parentHref}
        className="fixed left-4 top-16 z-40 inline-flex items-center gap-1 rounded-full bg-background/85 px-3 py-1.5 text-sm text-muted-foreground shadow-sm ring-1 ring-border/60 backdrop-blur transition-colors hover:bg-background hover:text-foreground"
        title="뒤로"
      >
        <ChevronLeft size={14} />
        뒤로
      </Link>

      {renderContent(leaf)}
    </div>
  );
}

function renderContent(leaf: Node) {
  // 문서는 글 가독성을 위해 max-w 유지하고 제목 + 본문 표시
  if (leaf.kind === "article") {
    return (
      <div className="mx-auto max-w-3xl px-8 pb-16 pt-20">
        <h1 className="mb-6 text-3xl font-bold tracking-tight text-foreground">
          {leaf.name}
        </h1>
        <ArticleViewer content={leaf.content} />
      </div>
    );
  }

  if (!leaf.fileURL) {
    return (
      <div className="mx-auto max-w-md px-6 pt-20">
        <div className="flex items-center gap-2 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-amber-200/60 dark:bg-amber-950/30 dark:text-amber-200 dark:ring-amber-900/60">
          <AlertTriangle size={14} className="shrink-0" />
          <span>파일이 첨부되지 않았어요.</span>
        </div>
      </div>
    );
  }

  // HTML / 3D / PDF — 화면 가득
  const fullClass = "h-[calc(100vh-3rem)] w-full block";

  switch (leaf.kind) {
    case "html":
      return (
        <HtmlSimViewer
          url={leaf.fileURL}
          title={leaf.name}
          className={`${fullClass} border-0 bg-white`}
        />
      );
    case "3d":
      return (
        <ThreeDViewer
          url={leaf.fileURL}
          className={`${fullClass} overflow-hidden bg-foreground/[0.04]`}
        />
      );
    case "pdf":
      return (
        <PdfViewer
          url={leaf.fileURL}
          title={leaf.name}
          className={`${fullClass} border-0 bg-white`}
        />
      );
    default:
      return null;
  }
}

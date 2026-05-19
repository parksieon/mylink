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
      <div className="h-[calc(100vh-220px)] w-full animate-pulse rounded-xl bg-foreground/5" />
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
      <div className="h-[calc(100vh-220px)] w-full animate-pulse rounded-xl bg-foreground/5" />
    ),
  }
);

interface LeafViewProps {
  leaf: Node;
  parentHref: string;
}

export function LeafView({ leaf, parentHref }: LeafViewProps) {
  return (
    <div className="mx-auto max-w-4xl px-6 pb-12 pt-8">
      <Link
        href={parentHref}
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ChevronLeft size={14} />
        뒤로
      </Link>
      <header className="mb-6">
        <p className="text-xs text-muted-foreground">
          {leaf.path.length > 1
            ? leaf.path.slice(0, -1).join(" / ")
            : "최상위"}
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground">
          {leaf.name}
        </h1>
      </header>

      {renderContent(leaf)}
    </div>
  );
}

function renderContent(leaf: Node) {
  const tall = "h-[calc(100vh-220px)]";

  if (leaf.kind === "article") {
    return <ArticleViewer content={leaf.content} />;
  }

  if (!leaf.fileURL) {
    return (
      <div className="flex items-center gap-2 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-amber-200/60 dark:bg-amber-950/30 dark:text-amber-200 dark:ring-amber-900/60">
        <AlertTriangle size={14} className="shrink-0" />
        <span>파일이 첨부되지 않았어요.</span>
      </div>
    );
  }

  switch (leaf.kind) {
    case "html":
      return (
        <HtmlSimViewer
          url={leaf.fileURL}
          title={leaf.name}
          className={`${tall} w-full rounded-xl bg-white ring-1 ring-border/60`}
        />
      );
    case "3d":
      return (
        <ThreeDViewer
          url={leaf.fileURL}
          className={`${tall} w-full overflow-hidden rounded-xl bg-foreground/[0.04] ring-1 ring-border/60`}
        />
      );
    case "pdf":
      return (
        <PdfViewer
          url={leaf.fileURL}
          title={leaf.name}
          className={`${tall} w-full rounded-xl bg-white ring-1 ring-border/60`}
        />
      );
    default:
      return null;
  }
}

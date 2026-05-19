"use client";

import Link from "next/link";
import { ChevronRight, ExternalLink } from "lucide-react";
import type { Node } from "@/lib/nodes";
import { getIcon } from "@/lib/icon-map";
import { getCardColor } from "@/lib/card-colors";
import { incrementLinkClick } from "@/lib/nodes";
import { isSafeHttpUrl } from "@/lib/url-safe";
import { cn } from "@/lib/utils";

interface NodeCardProps {
  node: Node;
  basePath: string;
  ownerUid: string;
}

const KIND_LABEL: Record<string, string> = {
  folder: "폴더",
  article: "문서",
  link: "링크",
  html: "HTML",
  "3d": "3D",
  pdf: "PDF",
};

function defaultIcon(kind: Node["kind"]): string {
  switch (kind) {
    case "folder":
      return "Folder";
    case "article":
      return "FileText";
    case "link":
      return "Link";
    case "html":
      return "Code";
    case "3d":
      return "Box";
    case "pdf":
      return "FileText";
    default:
      return "Link";
  }
}

export function NodeCard({
  node,
  basePath,
  ownerUid,
}: NodeCardProps) {
  const Icon = getIcon(node.iconName ?? defaultIcon(node.kind));
  const style = getCardColor(node.cardColor);
  const kindLabel = KIND_LABEL[node.kind] ?? node.kind;

  const inner = (
    <>
      <div
        className={cn(
          "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-colors",
          style.iconBg,
          style.iconText
        )}
      >
        <Icon size={22} strokeWidth={1.8} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-[15px] font-semibold text-foreground">
          {node.name}
        </div>
        <div className="mt-0.5 text-[11px] uppercase tracking-wider text-muted-foreground">
          {kindLabel}
        </div>
      </div>
      {node.kind === "link" ? (
        <ExternalLink
          size={14}
          className="shrink-0 text-foreground/30 transition-colors group-hover:text-foreground/60"
        />
      ) : (
        <ChevronRight
          size={16}
          className="shrink-0 text-foreground/20 transition-all group-hover:translate-x-0.5 group-hover:text-foreground/40"
        />
      )}
    </>
  );

  const baseClass = cn(
    "group flex w-full items-center gap-4 rounded-2xl p-4 ring-1 transition-all hover:shadow-sm active:scale-[0.98]",
    style.bg,
    style.ring,
    style.hover
  );

  // 외부 링크는 새 탭으로 — http(s) 외 스킴은 표시만 하고 클릭 불가
  if (node.kind === "link" && node.url) {
    if (!isSafeHttpUrl(node.url)) {
      return (
        <div className={cn(baseClass, "cursor-not-allowed opacity-60")} title="안전하지 않은 링크">
          {inner}
        </div>
      );
    }
    return (
      <a
        href={node.url}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => {
          incrementLinkClick(ownerUid, node.id);
        }}
        className={baseClass}
      >
        {inner}
      </a>
    );
  }

  // 폴더 / 문서 / HTML / 3D / PDF — 모두 URL 경로로 이동 (풀스크린 페이지)
  const href = `${basePath}/${encodeURIComponent(node.name)}`;
  return (
    <Link href={href} className={baseClass}>
      {inner}
    </Link>
  );
}

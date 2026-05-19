"use client";

import { LayoutGrid } from "lucide-react";
import { useNodes } from "@/context/nodes-context";
import { FolderEditor } from "./editors/FolderEditor";
import { ArticleEditor } from "./editors/ArticleEditor";
import { LinkEditor } from "./editors/LinkEditor";
import { AssetEditor } from "./editors/AssetEditor";

export function NodeEditor() {
  const { nodes, activeNodeId } = useNodes();
  const active = activeNodeId ? nodes.find((n) => n.id === activeNodeId) : null;

  if (!active) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center">
        <LayoutGrid
          size={28}
          strokeWidth={1.5}
          className="text-muted-foreground/40"
        />
        <p className="text-sm text-muted-foreground">
          왼쪽 트리에서 항목을 선택하거나 새로 만들어 보세요.
        </p>
      </div>
    );
  }

  switch (active.kind) {
    case "folder":
      return <FolderEditor key={active.id} node={active} />;
    case "article":
      return <ArticleEditor key={active.id} node={active} />;
    case "link":
      return <LinkEditor key={active.id} node={active} />;
    case "html":
    case "3d":
    case "pdf":
      return <AssetEditor key={active.id} node={active} />;
    default:
      return null;
  }
}

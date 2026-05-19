"use client";

import dynamic from "next/dynamic";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Node } from "@/lib/nodes";
import { HtmlSimViewer } from "@/components/viewers/HtmlSimViewer";
import { PdfViewer } from "@/components/viewers/PdfViewer";

const ThreeDViewer = dynamic(
  () => import("@/components/viewers/ThreeDViewer").then((m) => ({ default: m.ThreeDViewer })),
  { ssr: false, loading: () => <ViewerSkeleton ratio="aspect-video" /> }
);

const ArticleViewer = dynamic(
  () => import("@/components/viewers/ArticleViewer").then((m) => ({ default: m.ArticleViewer })),
  { ssr: false, loading: () => <ViewerSkeleton ratio="aspect-video" /> }
);

function ViewerSkeleton({ ratio }: { ratio: string }) {
  return (
    <div className={`${ratio} w-full animate-pulse rounded-xl bg-foreground/5`} />
  );
}

interface AssetModalProps {
  node: Node | null;
  onOpenChange: (open: boolean) => void;
}

export function AssetModal({ node, onOpenChange }: AssetModalProps) {
  return (
    <Dialog open={!!node} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100%-2rem)] sm:max-w-3xl">
        {node && (
          <>
            <DialogHeader>
              <DialogTitle>{node.name}</DialogTitle>
            </DialogHeader>
            <div className="overflow-y-auto" style={{ maxHeight: "70vh" }}>
              {renderViewer(node)}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function renderViewer(node: Node) {
  switch (node.kind) {
    case "article":
      return <ArticleViewer content={node.content} />;
    case "html":
      return node.fileURL ? (
        <HtmlSimViewer url={node.fileURL} title={node.name} />
      ) : (
        <p className="p-6 text-center text-sm text-muted-foreground">
          파일이 없어요
        </p>
      );
    case "3d":
      return node.fileURL ? (
        <ThreeDViewer url={node.fileURL} />
      ) : (
        <p className="p-6 text-center text-sm text-muted-foreground">
          파일이 없어요
        </p>
      );
    case "pdf":
      return node.fileURL ? (
        <PdfViewer url={node.fileURL} title={node.name} />
      ) : (
        <p className="p-6 text-center text-sm text-muted-foreground">
          파일이 없어요
        </p>
      );
    default:
      return null;
  }
}

"use client";

import dynamic from "next/dynamic";
import { Box, Code, FileText, AlertTriangle } from "lucide-react";
import { HtmlSimViewer } from "@/components/viewers/HtmlSimViewer";
import { PdfViewer } from "@/components/viewers/PdfViewer";
import { MarkdownViewer } from "@/components/viewers/MarkdownViewer";
import type { Node } from "@/lib/nodes";
import { formatBytes } from "@/lib/quota";
import { StyleControls } from "../StyleControls";

const ThreeDViewer = dynamic(
  () =>
    import("@/components/viewers/ThreeDViewer").then((m) => ({
      default: m.ThreeDViewer,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="aspect-video w-full animate-pulse rounded-xl bg-foreground/5" />
    ),
  }
);

interface AssetEditorProps {
  node: Node;
}

const KIND_INFO: Record<
  string,
  { label: string; Icon: typeof Box; hint: string }
> = {
  html: { label: "HTML 시뮬레이션", Icon: Code, hint: "sandbox iframe으로 표시돼요" },
  "3d": { label: "3D 모델", Icon: Box, hint: ".glb / .gltf, 마우스로 회전" },
  pdf: { label: "PDF", Icon: FileText, hint: "브라우저 기본 뷰어" },
  md: { label: "Markdown", Icon: FileText, hint: "GFM 서식 + 코드블록 색상" },
};

export function AssetEditor({ node }: AssetEditorProps) {
  const info = KIND_INFO[node.kind];
  if (!info) return null;

  return (
    <div className="mx-auto h-full w-full max-w-3xl overflow-y-auto px-8 py-10">
      <header className="mb-6">
        <p className="text-xs text-muted-foreground">
          {node.path.length > 1 ? node.path.slice(0, -1).join(" / ") : "최상위"}{" "}
          · {info.label}
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground">
          {node.name}
        </h1>
        <p className="mt-1 text-[12px] text-muted-foreground">{info.hint}</p>
      </header>

      {/* Preview */}
      <section className="mb-6">
        {node.fileURL ? (
          renderPreview(node)
        ) : (
          <div className="flex items-center gap-2 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-amber-200/60 dark:bg-amber-950/30 dark:text-amber-200 dark:ring-amber-900/60">
            <AlertTriangle size={14} className="shrink-0" />
            <span>파일이 첨부되지 않았어요.</span>
          </div>
        )}
        {node.fileSize !== undefined && (
          <p className="mt-1 text-[11px] text-muted-foreground">
            {formatBytes(node.fileSize)} · {node.mimeType ?? "unknown"}
          </p>
        )}
      </section>

      <section className="mb-6 rounded-xl bg-card p-4 ring-1 ring-border/60">
        <h3 className="mb-3 text-sm font-medium">카드 꾸미기</h3>
        <StyleControls node={node} />
      </section>

      <section className="rounded-xl bg-muted/30 p-4 text-[12px] text-muted-foreground">
        파일을 바꾸려면 이 항목을 삭제하고 새로 만들어 주세요. (한 자료당 파일
        하나)
      </section>
    </div>
  );
}

function renderPreview(node: Node) {
  if (!node.fileURL) return null;
  switch (node.kind) {
    case "html":
      return <HtmlSimViewer url={node.fileURL} title={node.name} />;
    case "3d":
      return <ThreeDViewer url={node.fileURL} />;
    case "pdf":
      return <PdfViewer url={node.fileURL} title={node.name} />;
    case "md":
      return (
        <MarkdownViewer
          url={node.fileURL}
          className="rounded-xl bg-card p-6 ring-1 ring-border/60"
        />
      );
    default:
      return null;
  }
}

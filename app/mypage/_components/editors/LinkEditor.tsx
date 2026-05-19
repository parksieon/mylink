"use client";

import { useState, useEffect } from "react";
import { ExternalLink, MousePointerClick } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useNodes } from "@/context/nodes-context";
import type { Node } from "@/lib/nodes";
import { StyleControls } from "../StyleControls";

interface LinkEditorProps {
  node: Node;
}

export function LinkEditor({ node }: LinkEditorProps) {
  const { updateUrl } = useNodes();
  const [urlInput, setUrlInput] = useState(node.url ?? "");
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<
    { kind: "ok" | "error"; message: string } | null
  >(null);

  useEffect(() => {
    setUrlInput(node.url ?? "");
    setStatus(null);
  }, [node.id, node.url]);

  const handleSave = async () => {
    setSaving(true);
    setStatus(null);
    const r = await updateUrl(node.id, urlInput);
    setSaving(false);
    if (!r.ok) {
      setStatus({ kind: "error", message: r.reason });
      return;
    }
    setStatus({ kind: "ok", message: "저장됐어요!" });
  };

  return (
    <div className="mx-auto h-full w-full max-w-3xl overflow-y-auto px-8 py-10">
      <header className="mb-6">
        <p className="text-xs text-muted-foreground">
          {node.path.length > 1 ? node.path.slice(0, -1).join(" / ") : "최상위"}{" "}
          · 외부 링크
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground">
          {node.name}
        </h1>
      </header>

      <section className="mb-6 rounded-xl bg-card p-5 ring-1 ring-border/60">
        <div className="space-y-2">
          <Label htmlFor="url">이동할 주소 (URL)</Label>
          <div className="flex gap-2">
            <Input
              id="url"
              value={urlInput}
              onChange={(e) => {
                setUrlInput(e.target.value);
                setStatus(null);
              }}
              placeholder="https://..."
              className="flex-1"
            />
            <Button
              onClick={handleSave}
              disabled={saving || urlInput.trim() === (node.url ?? "")}
            >
              {saving ? "저장 중..." : "저장"}
            </Button>
          </div>
          {status && (
            <p
              className={
                "text-[12px] " +
                (status.kind === "ok" ? "text-emerald-600" : "text-destructive")
              }
            >
              {status.message}
            </p>
          )}
          {node.url && (
            <a
              href={node.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[12px] text-muted-foreground transition-colors hover:text-foreground"
            >
              새 탭에서 열기 <ExternalLink size={11} />
            </a>
          )}
        </div>
      </section>

      <section className="mb-6 rounded-xl bg-card p-4 ring-1 ring-border/60">
        <h3 className="mb-3 text-sm font-medium">카드 꾸미기</h3>
        <StyleControls node={node} />
      </section>

      <section className="rounded-xl bg-foreground/[0.04] p-4 ring-1 ring-border/60">
        <div className="flex items-center gap-2 text-sm">
          <MousePointerClick
            size={16}
            className="text-muted-foreground"
            strokeWidth={1.8}
          />
          <span className="text-muted-foreground">총 클릭 수:</span>
          <span className="font-semibold tabular-nums">
            {node.clickCount ?? 0}
          </span>
        </div>
      </section>
    </div>
  );
}

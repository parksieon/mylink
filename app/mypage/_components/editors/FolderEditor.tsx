"use client";

import { useMemo, useRef, useState } from "react";
import Image from "next/image";
import { Eye, EyeOff, Image as ImageIcon, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNodes } from "@/context/nodes-context";
import type { Node } from "@/lib/nodes";
import { NodeCard } from "@/components/NodeCard";
import { StyleControls } from "../StyleControls";
import { cn } from "@/lib/utils";

interface FolderEditorProps {
  node: Node;
}

export function FolderEditor({ node }: FolderEditorProps) {
  const { nodes, setVisibility, setFolderBg, clearFolderBg } = useNodes();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const children = useMemo(
    () =>
      nodes
        .filter((n) => n.parentId === node.id)
        .sort((a, b) => a.order - b.order),
    [nodes, node.id]
  );

  const handleBgUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setError("");
    const r = await setFolderBg(node.id, file);
    setBusy(false);
    if (!r.ok) setError(r.reason);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="mx-auto h-full w-full max-w-3xl overflow-y-auto px-8 py-10">
      <header className="mb-6">
        <p className="text-xs text-muted-foreground">
          {node.path.length > 1 ? node.path.slice(0, -1).join(" / ") : "최상위"}{" "}
          · 폴더
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground">
          {node.name}
        </h1>
      </header>

      {/* 공개 설정 */}
      <section className="mb-6 rounded-xl bg-card p-4 ring-1 ring-border/60">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-sm font-medium">공개 설정</h3>
            <p className="mt-0.5 text-[12px] text-muted-foreground">
              현재 효력:{" "}
              <span
                className={cn(
                  "font-medium",
                  node.effectiveVisibility === "public"
                    ? "text-emerald-600"
                    : "text-amber-600"
                )}
              >
                {node.effectiveVisibility === "public" ? "공개" : "비공개"}
              </span>
              {node.effectiveVisibility !== node.visibility &&
                " (조상이 비공개라 강제)"}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setVisibility(
                node.id,
                node.visibility === "public" ? "private" : "public"
              )
            }
          >
            {node.visibility === "public" ? (
              <>
                <EyeOff size={14} /> 비공개로
              </>
            ) : (
              <>
                <Eye size={14} /> 공개로
              </>
            )}
          </Button>
        </div>
      </section>

      {/* 배경 이미지 */}
      <section className="mb-6 rounded-xl bg-card p-4 ring-1 ring-border/60">
        <h3 className="text-sm font-medium">배경 이미지</h3>
        <p className="mt-0.5 text-[12px] text-muted-foreground">
          폴더 공개 페이지의 배경으로 사용돼요.
        </p>
        <div className="mt-3 flex items-center gap-3">
          {node.bgImageURL ? (
            <div className="relative h-20 w-32 overflow-hidden rounded-lg ring-1 ring-border">
              <Image
                src={node.bgImageURL}
                alt="배경"
                fill
                unoptimized
                className="object-cover"
              />
            </div>
          ) : (
            <div className="flex h-20 w-32 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <ImageIcon size={20} />
            </div>
          )}
          <div className="flex flex-col gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={busy}
            >
              {busy ? "올리는 중..." : node.bgImageURL ? "교체" : "업로드"}
            </Button>
            {node.bgImageURL && (
              <Button
                variant="ghost"
                size="sm"
                onClick={async () => {
                  setBusy(true);
                  await clearFolderBg(node.id);
                  setBusy(false);
                }}
                disabled={busy}
              >
                <X size={14} /> 제거
              </Button>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleBgUpload}
          />
        </div>
        {error && <p className="mt-2 text-[12px] text-destructive">{error}</p>}
      </section>

      {/* 카드 꾸미기 */}
      <section className="mb-6 rounded-xl bg-card p-4 ring-1 ring-border/60">
        <h3 className="mb-3 text-sm font-medium">카드 꾸미기</h3>
        <StyleControls node={node} />
        <p className="mt-2 text-[11px] text-muted-foreground">
          상위 폴더에서 보일 때의 카드 모양이에요.
        </p>
      </section>

      {/* 자식 미리보기 */}
      <section className="rounded-xl bg-card p-4 ring-1 ring-border/60">
        <h3 className="mb-3 text-sm font-medium">
          이 폴더 안 항목
          <span className="ml-2 text-[12px] font-normal text-muted-foreground">
            {children.length}개
          </span>
        </h3>
        {children.length === 0 ? (
          <p className="px-2 py-4 text-[12px] text-muted-foreground">
            아직 비어있어요. 왼쪽 트리에서 이 폴더 옆 ... 메뉴 → 새로 만들기
          </p>
        ) : (
          <div className="space-y-2">
            {children.map((c) => (
              <div key={c.id} className="pointer-events-none">
                <NodeCard
                  node={c}
                  basePath=""
                  ownerUid=""
                />
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

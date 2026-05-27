"use client";

import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Folder,
  FileText,
  Link as LinkIcon,
  Code,
  Box,
  Upload,
} from "lucide-react";
import { useNodes } from "@/context/nodes-context";
import type { NodeKind } from "@/lib/nodes";
import { cn } from "@/lib/utils";

type CreatableKind = "folder" | "article" | "link" | "html" | "3d" | "pdf" | "md";

const KINDS: { kind: CreatableKind; label: string; desc: string; Icon: typeof Folder; accept?: string }[] = [
  { kind: "folder", label: "폴더", desc: "방·하위 항목 그룹", Icon: Folder },
  { kind: "article", label: "문서", desc: "글·메모 (블록 에디터)", Icon: FileText },
  { kind: "link", label: "외부 링크", desc: "URL로 바로 이동", Icon: LinkIcon },
  { kind: "html", label: "HTML 시뮬", desc: ".html 업로드 (sandbox)", Icon: Code, accept: ".html,.htm" },
  { kind: "3d", label: "3D 모델", desc: ".glb / .gltf 업로드", Icon: Box, accept: ".glb,.gltf,model/gltf-binary" },
  { kind: "pdf", label: "PDF", desc: ".pdf 업로드", Icon: FileText, accept: ".pdf,application/pdf" },
  { kind: "md", label: "Markdown", desc: ".md 업로드 (서식 렌더)", Icon: FileText, accept: ".md,.markdown,text/markdown" },
];

interface CreateNodeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parentId: string | null;
  onCreated?: (id: string) => void;
}

export function CreateNodeDialog({
  open,
  onOpenChange,
  parentId,
  onCreated,
}: CreateNodeDialogProps) {
  const { createFolder, createArticle, createLink, createAsset } = useNodes();
  const [step, setStep] = useState<"pick" | "form">("pick");
  const [kind, setKind] = useState<CreatableKind>("folder");
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setStep("pick");
      setKind("folder");
      setName("");
      setUrl("");
      setFile(null);
      setError("");
    }
  }, [open]);

  const config = KINDS.find((k) => k.kind === kind)!;
  const needsUrl = kind === "link";
  const needsFile = kind === "html" || kind === "3d" || kind === "pdf" || kind === "md";

  const submit = async () => {
    setError("");
    if (!name.trim()) {
      setError("이름을 입력해주세요");
      return;
    }
    if (needsUrl && !url.trim()) {
      setError("주소를 입력해주세요");
      return;
    }
    if (needsFile && !file) {
      setError("파일을 선택해주세요");
      return;
    }
    setSubmitting(true);
    try {
      let result;
      if (kind === "folder") result = await createFolder(parentId, name);
      else if (kind === "article") result = await createArticle(parentId, name);
      else if (kind === "link") result = await createLink(parentId, name, url);
      else result = await createAsset(parentId, name, kind, file!);

      if (!result.ok) {
        setError(result.reason);
        return;
      }
      onCreated?.(result.value.id);
      onOpenChange(false);
    } catch (err) {
      console.error("create failed:", err);
      setError(
        `저장 실패: ${(err as Error)?.message ?? "알 수 없는 오류"} — 브라우저 콘솔을 확인해주세요`
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100%-2rem)] sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {step === "pick" ? "무엇을 만들까요?" : `${config.label} 만들기`}
          </DialogTitle>
          <DialogDescription>
            {parentId === null ? "최상위에 추가돼요." : "선택한 폴더 안에 추가돼요."}
          </DialogDescription>
        </DialogHeader>

        {step === "pick" ? (
          <div className="grid grid-cols-2 gap-2">
            {KINDS.map(({ kind: k, label, desc, Icon }) => (
              <button
                key={k}
                type="button"
                onClick={() => {
                  setKind(k);
                  setStep("form");
                }}
                className="flex items-start gap-2.5 rounded-xl bg-card p-3 text-left ring-1 ring-border/60 transition-colors hover:bg-accent/40"
              >
                <Icon size={20} className="mt-0.5 shrink-0 text-foreground/70" />
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] font-semibold">{label}</div>
                  <div className="mt-0.5 truncate text-[10px] text-muted-foreground">
                    {desc}
                  </div>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">이름</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={
                  kind === "folder" ? "예: 리액트 학습" : "표시할 이름"
                }
                autoFocus
              />
            </div>

            {needsUrl && (
              <div className="space-y-2">
                <Label htmlFor="url">URL</Label>
                <Input
                  id="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://..."
                />
              </div>
            )}

            {needsFile && (
              <div className="space-y-2">
                <Label>파일</Label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className={cn(
                    "flex cursor-pointer items-center gap-2 rounded-md border border-dashed border-input bg-background px-3 py-3 text-sm transition-colors hover:bg-accent/40",
                    file && "border-solid"
                  )}
                >
                  <Upload size={16} className="shrink-0 text-muted-foreground" />
                  <span className="truncate text-[13px] text-foreground/80">
                    {file ? file.name : `${config.accept} 파일 선택`}
                  </span>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={config.accept}
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    setFile(f ?? null);
                  }}
                />
                <p className="text-[10px] text-muted-foreground">
                  최대 100MB
                </p>
              </div>
            )}

            {error && <p className="text-[12px] text-destructive">{error}</p>}

            <div className="flex justify-between">
              <Button
                variant="ghost"
                onClick={() => setStep("pick")}
                disabled={submitting}
              >
                ← 종류 다시
              </Button>
              <Button onClick={submit} disabled={submitting}>
                {submitting ? "만드는 중..." : "만들기"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

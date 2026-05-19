"use client";

import { useMemo, useState } from "react";
import {
  Folder,
  FileText,
  Link as LinkIcon,
  Code,
  Box,
  ChevronRight,
  ChevronDown,
  MoreHorizontal,
  ArrowUp,
  ArrowDown,
  Pencil,
  Trash2,
  Move,
  Eye,
  EyeOff,
  Plus,
  X,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { MoveDialog } from "@/components/notes/MoveDialog";
import { useNodes } from "@/context/nodes-context";
import type { Node, NodeKind } from "@/lib/nodes";
import { cn } from "@/lib/utils";

function kindIcon(kind: NodeKind) {
  switch (kind) {
    case "folder":
      return Folder;
    case "article":
      return FileText;
    case "link":
      return LinkIcon;
    case "html":
      return Code;
    case "3d":
      return Box;
    case "pdf":
      return FileText;
  }
}

interface TreeProps {
  onCreateClick: (parentId: string | null) => void;
}

export function Tree({ onCreateClick }: TreeProps) {
  const {
    nodes,
    activeNodeId,
    setActiveNodeId,
    rename,
    reorder,
    move,
    remove,
    setVisibility,
  } = useNodes();

  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<Node | null>(null);
  const [moveTarget, setMoveTarget] = useState<Node | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  const childMap = useMemo(() => {
    const m = new Map<string | null, Node[]>();
    for (const n of nodes) {
      const arr = m.get(n.parentId) ?? [];
      arr.push(n);
      m.set(n.parentId, arr);
    }
    return m;
  }, [nodes]);

  const toggle = (id: string) =>
    setExpanded((p) => {
      const next = new Set(p);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const submitRename = async () => {
    if (!renamingId) return;
    const r = await rename(renamingId, renameValue);
    if (!r.ok) {
      setErrorMsg(r.reason);
      return;
    }
    setRenamingId(null);
    setErrorMsg("");
  };

  const renderRow = (node: Node, depth: number) => {
    const Icon = kindIcon(node.kind);
    const isFolder = node.kind === "folder";
    const isOpen = expanded.has(node.id);
    const children = childMap.get(node.id) ?? [];
    const hasChildren = children.length > 0;
    const isActive = activeNodeId === node.id;
    const isPrivate = node.effectiveVisibility === "private";

    return (
      <div key={node.id}>
        <div
          className={cn(
            "group flex items-center gap-1 rounded-md py-1 text-sm transition-colors hover:bg-accent/50",
            isActive && "bg-accent"
          )}
          style={{ paddingLeft: depth * 14 + 4, paddingRight: 4 }}
        >
          {isFolder ? (
            <button
              type="button"
              onClick={() => toggle(node.id)}
              className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded text-muted-foreground hover:text-foreground"
            >
              {hasChildren ? (
                isOpen ? (
                  <ChevronDown size={14} />
                ) : (
                  <ChevronRight size={14} />
                )
              ) : null}
            </button>
          ) : (
            <span className="inline-block w-5 shrink-0" />
          )}

          <Icon size={15} className="shrink-0 text-muted-foreground" />

          {renamingId === node.id ? (
            <div className="flex flex-1 items-center gap-1">
              <Input
                autoFocus
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") submitRename();
                  if (e.key === "Escape") {
                    setRenamingId(null);
                    setErrorMsg("");
                  }
                }}
                className="h-6 px-1.5 text-sm"
              />
              <Button size="xs" variant="ghost" onClick={submitRename}>
                <Check size={12} />
              </Button>
              <Button
                size="xs"
                variant="ghost"
                onClick={() => {
                  setRenamingId(null);
                  setErrorMsg("");
                }}
              >
                <X size={12} />
              </Button>
            </div>
          ) : (
            <>
              <button
                type="button"
                onClick={() => {
                  setActiveNodeId(node.id);
                  if (isFolder) toggle(node.id);
                }}
                className={cn(
                  "flex-1 truncate text-left",
                  isPrivate && "text-muted-foreground"
                )}
                title={node.name}
              >
                {node.name}
                {isFolder && node.visibility === "public" && (
                  <Eye
                    size={11}
                    className="ml-1.5 inline text-foreground/40"
                  />
                )}
              </button>
              <div className="flex shrink-0 items-center opacity-0 transition-opacity group-hover:opacity-100">
                <Button
                  size="xs"
                  variant="ghost"
                  onClick={() => reorder(node.id, "up")}
                  title="위로"
                >
                  <ArrowUp size={12} />
                </Button>
                <Button
                  size="xs"
                  variant="ghost"
                  onClick={() => reorder(node.id, "down")}
                  title="아래로"
                >
                  <ArrowDown size={12} />
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={
                      <Button size="xs" variant="ghost">
                        <MoreHorizontal size={12} />
                      </Button>
                    }
                  />
                  <DropdownMenuContent align="end">
                    {isFolder && (
                      <>
                        <DropdownMenuItem
                          onClick={() => onCreateClick(node.id)}
                        >
                          <Plus /> 새로 만들기
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                      </>
                    )}
                    <DropdownMenuItem
                      onClick={() => {
                        setRenamingId(node.id);
                        setRenameValue(node.name);
                      }}
                    >
                      <Pencil /> 이름 변경
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setMoveTarget(node)}>
                      <Move /> 이동
                    </DropdownMenuItem>
                    {isFolder && (
                      <DropdownMenuItem
                        onClick={() =>
                          setVisibility(
                            node.id,
                            node.visibility === "public" ? "private" : "public"
                          )
                        }
                      >
                        {node.visibility === "public" ? (
                          <>
                            <EyeOff /> 비공개로
                          </>
                        ) : (
                          <>
                            <Eye /> 공개로
                          </>
                        )}
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      variant="destructive"
                      onClick={() => setConfirmDelete(node)}
                    >
                      <Trash2 /> 삭제
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </>
          )}
        </div>

        {isFolder && isOpen && hasChildren && (
          <div>{children.map((c) => renderRow(c, depth + 1))}</div>
        )}
      </div>
    );
  };

  const roots = childMap.get(null) ?? [];

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border/60 px-3 py-2">
        <h2 className="text-sm font-semibold tracking-tight">내 트리</h2>
        <Button
          size="xs"
          variant="default"
          onClick={() => onCreateClick(null)}
          title="새로 만들기"
        >
          <Plus size={14} /> 만들기
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        {roots.length === 0 ? (
          <p className="px-2 py-6 text-xs text-muted-foreground">
            위쪽 만들기 버튼으로 폴더·자료·링크를 추가해 보세요.
          </p>
        ) : (
          roots.map((n) => renderRow(n, 0))
        )}
        {errorMsg && (
          <p className="mt-2 px-2 text-xs text-destructive">{errorMsg}</p>
        )}
      </div>

      <MoveDialog
        open={!!moveTarget}
        onOpenChange={(open) => !open && setMoveTarget(null)}
        nodes={nodes}
        sourceNode={moveTarget}
        onMove={async (targetParentId) => {
          if (!moveTarget) return;
          const r = await move(moveTarget.id, targetParentId);
          if (!r.ok) setErrorMsg(r.reason);
        }}
      />
      <ConfirmDialog
        open={!!confirmDelete}
        onOpenChange={(open) => !open && setConfirmDelete(null)}
        title={`'${confirmDelete?.name}'을(를) 삭제할까요?`}
        description={
          confirmDelete?.kind === "folder"
            ? "폴더 안의 모든 항목과 파일이 함께 삭제돼요. 되돌릴 수 없어요."
            : "삭제한 항목과 그 파일은 되돌릴 수 없어요."
        }
        confirmLabel="삭제"
        destructive
        onConfirm={() => {
          if (confirmDelete) remove(confirmDelete.id);
        }}
      />
    </div>
  );
}

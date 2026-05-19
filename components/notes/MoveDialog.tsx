"use client";

import { useMemo, useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Folder, ChevronRight, ChevronDown, Home } from "lucide-react";
import { cn } from "@/lib/utils";

interface MoveNode {
  id: string;
  kind: string;
  name: string;
  parentId: string | null;
  ancestorIds: string[];
}

interface MoveDialogProps<T extends MoveNode> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nodes: T[];
  sourceNode: T | null;
  onMove: (targetParentId: string | null) => void | Promise<void>;
}

export function MoveDialog<T extends MoveNode>({
  open,
  onOpenChange,
  nodes,
  sourceNode,
  onMove,
}: MoveDialogProps<T>) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [selectedParentId, setSelectedParentId] = useState<string | null | undefined>(
    undefined
  );

  useEffect(() => {
    if (open) {
      setSelectedParentId(undefined);
      // Expand all ancestor folders of source so user can see context
      if (sourceNode) {
        setExpanded(new Set(sourceNode.ancestorIds));
      } else {
        setExpanded(new Set());
      }
    }
  }, [open, sourceNode]);

  const childMap = useMemo(() => {
    const m = new Map<string | null, T[]>();
    for (const n of nodes) {
      if (n.kind !== "folder") continue;
      const arr = m.get(n.parentId) ?? [];
      arr.push(n);
      m.set(n.parentId, arr);
    }
    return m;
  }, [nodes]);

  const isDisabled = (id: string) => {
    if (!sourceNode) return false;
    if (id === sourceNode.id) return true;
    const node = nodes.find((n) => n.id === id);
    if (node?.ancestorIds.includes(sourceNode.id)) return true;
    return false;
  };

  const toggle = (id: string) =>
    setExpanded((p) => {
      const next = new Set(p);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const renderRow = (node: T, depth: number) => {
    const isOpen = expanded.has(node.id);
    const children = childMap.get(node.id) ?? [];
    const hasChildren = children.length > 0;
    const disabled = isDisabled(node.id);
    const isCurrent = sourceNode?.parentId === node.id;
    const isSelected = selectedParentId === node.id;

    return (
      <div key={node.id}>
        <div
          className={cn(
            "group flex items-center gap-1 rounded-md py-1 text-sm",
            disabled && "opacity-40",
            !disabled && "hover:bg-accent/50",
            isSelected && "bg-accent"
          )}
          style={{ paddingLeft: depth * 14 + 4, paddingRight: 4 }}
        >
          <button
            type="button"
            onClick={() => toggle(node.id)}
            className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded text-muted-foreground hover:text-foreground"
            aria-label={isOpen ? "접기" : "펼치기"}
          >
            {hasChildren ? (
              isOpen ? (
                <ChevronDown size={14} />
              ) : (
                <ChevronRight size={14} />
              )
            ) : null}
          </button>
          <Folder size={15} className="shrink-0 text-muted-foreground" />
          <button
            type="button"
            disabled={disabled}
            onClick={() => !disabled && setSelectedParentId(node.id)}
            className="flex-1 truncate text-left disabled:cursor-not-allowed"
          >
            {node.name}
          </button>
          {isCurrent && (
            <span className="text-[10px] text-muted-foreground">현재</span>
          )}
        </div>
        {isOpen && hasChildren && (
          <div>{children.map((c) => renderRow(c, depth + 1))}</div>
        )}
      </div>
    );
  };

  const roots = childMap.get(null) ?? [];
  const isCurrentRoot = sourceNode?.parentId === null;
  const canMove =
    selectedParentId !== undefined &&
    selectedParentId !== sourceNode?.parentId;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>이동할 위치</DialogTitle>
          <DialogDescription>
            옮길 폴더를 선택하세요. 최상위로도 이동할 수 있어요.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-72">
          <button
            type="button"
            onClick={() => setSelectedParentId(null)}
            className={cn(
              "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-accent/50",
              selectedParentId === null && "bg-accent"
            )}
          >
            <Home size={15} className="text-muted-foreground" />
            <span className="flex-1 text-left">최상위</span>
            {isCurrentRoot && (
              <span className="text-[10px] text-muted-foreground">현재</span>
            )}
          </button>
          {roots.map((n) => renderRow(n, 0))}
        </ScrollArea>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            취소
          </Button>
          <Button
            disabled={!canMove}
            onClick={async () => {
              if (selectedParentId === undefined) return;
              await onMove(selectedParentId);
              onOpenChange(false);
            }}
          >
            이동
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

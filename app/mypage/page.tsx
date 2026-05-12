"use client";

import { useState, FormEvent } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useLinkContext } from "@/context/link-context";
import { Pencil, Trash2, Check, X } from "lucide-react";

interface FieldErrors {
  title?: string;
  url?: string;
}

function isValidUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export default function MyPage() {
  const { links, addLink, updateLink, deleteLink } = useLinkContext();

  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editUrl, setEditUrl] = useState("");
  const [editErrors, setEditErrors] = useState<FieldErrors>({});

  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const validate = (t: string, u: string): FieldErrors => {
    const newErrors: FieldErrors = {};
    if (!t.trim()) newErrors.title = "제목을 입력해주세요";
    if (!u.trim()) newErrors.url = "주소를 입력해주세요";
    else if (!isValidUrl(u.trim())) newErrors.url = "올바른 주소를 입력해주세요";
    return newErrors;
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const fieldErrors = validate(title, url);
    setErrors(fieldErrors);
    if (Object.keys(fieldErrors).length > 0) return;

    addLink(title.trim(), url.trim());
    setTitle("");
    setUrl("");
    setErrors({});
  };

  const startEdit = (id: string, currentTitle: string, currentUrl: string) => {
    setEditingId(id);
    setEditTitle(currentTitle);
    setEditUrl(currentUrl);
    setEditErrors({});
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditTitle("");
    setEditUrl("");
    setEditErrors({});
  };

  const saveEdit = (id: string) => {
    const fieldErrors = validate(editTitle, editUrl);
    setEditErrors(fieldErrors);
    if (Object.keys(fieldErrors).length > 0) return;

    updateLink(id, editTitle.trim(), editUrl.trim());
    cancelEdit();
  };

  const confirmDelete = () => {
    if (deleteTargetId) {
      deleteLink(deleteTargetId);
      setDeleteTargetId(null);
    }
  };

  const deleteTarget = links.find((l) => l.id === deleteTargetId);

  return (
    <div className="mx-auto max-w-2xl px-6 pb-20 pt-16">
      {/* Header */}
      <div className="mb-12">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          링크 관리
        </h1>
        <p className="mt-2 text-base text-muted-foreground">
          새로운 링크를 추가하고 관리하세요.
        </p>
      </div>

      {/* Add Form */}
      <section className="mb-16 rounded-2xl bg-card p-6 ring-1 ring-border/60 sm:p-8">
        <h2 className="mb-6 text-lg font-semibold tracking-tight text-foreground">
          새 링크 추가
        </h2>
        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm font-medium text-foreground/80">
              제목
            </Label>
            <Input
              id="title"
              placeholder="예: 인스타그램, 포트폴리오"
              className={errors.title ? "border-destructive" : ""}
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (errors.title)
                  setErrors((prev) => ({ ...prev, title: undefined }));
              }}
            />
            {errors.title && (
              <p className="text-[13px] text-destructive">{errors.title}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="url" className="text-sm font-medium text-foreground/80">
              주소 (URL)
            </Label>
            <Input
              id="url"
              placeholder="https://..."
              className={errors.url ? "border-destructive" : ""}
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                if (errors.url)
                  setErrors((prev) => ({ ...prev, url: undefined }));
              }}
            />
            {errors.url && (
              <p className="text-[13px] text-destructive">{errors.url}</p>
            )}
          </div>
          <Button type="submit" size="lg" className="w-full cursor-pointer rounded-xl">
            링크 추가하기
          </Button>
        </form>
      </section>

      {/* Link List */}
      <section>
        <h2 className="mb-6 text-lg font-semibold tracking-tight text-foreground">
          내 링크
          <span className="ml-2 text-sm font-normal text-muted-foreground">
            {links.length}
          </span>
        </h2>
        <div className="divide-y divide-border/60 overflow-hidden rounded-2xl ring-1 ring-border/60">
          {links.map((link) => {
            const IconComponent = link.icon;
            const isEditing = editingId === link.id;

            if (isEditing) {
              return (
                <div key={link.id} className="bg-card p-4 sm:p-5">
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <Input
                        placeholder="제목"
                        value={editTitle}
                        className={editErrors.title ? "border-destructive" : ""}
                        onChange={(e) => {
                          setEditTitle(e.target.value);
                          if (editErrors.title)
                            setEditErrors((prev) => ({ ...prev, title: undefined }));
                        }}
                      />
                      {editErrors.title && (
                        <p className="text-[13px] text-destructive">{editErrors.title}</p>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <Input
                        placeholder="https://..."
                        value={editUrl}
                        className={editErrors.url ? "border-destructive" : ""}
                        onChange={(e) => {
                          setEditUrl(e.target.value);
                          if (editErrors.url)
                            setEditErrors((prev) => ({ ...prev, url: undefined }));
                        }}
                      />
                      {editErrors.url && (
                        <p className="text-[13px] text-destructive">{editErrors.url}</p>
                      )}
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={cancelEdit}
                        className="cursor-pointer"
                      >
                        <X size={14} strokeWidth={2} />
                        취소
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => saveEdit(link.id)}
                        className="cursor-pointer"
                      >
                        <Check size={14} strokeWidth={2} />
                        저장
                      </Button>
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={link.id}
                className="flex items-center gap-4 bg-card p-4 transition-colors hover:bg-accent/40"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-foreground/[0.04] text-foreground/60">
                  <IconComponent size={18} strokeWidth={1.8} />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-[15px] font-medium text-foreground">
                    {link.title}
                  </h3>
                  <p className="mt-0.5 truncate text-[13px] text-muted-foreground">
                    {link.url}
                  </p>
                </div>
                <button
                  onClick={() => startEdit(link.id, link.title, link.url)}
                  aria-label="수정"
                  className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-foreground/[0.06] hover:text-foreground"
                >
                  <Pencil size={14} strokeWidth={1.8} />
                </button>
                <button
                  onClick={() => setDeleteTargetId(link.id)}
                  aria-label="삭제"
                  className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 size={15} strokeWidth={1.8} />
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/30 px-6 backdrop-blur-sm"
          onClick={() => setDeleteTargetId(null)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-card p-6 shadow-xl ring-1 ring-border/60"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold tracking-tight text-foreground">
              링크를 삭제할까요?
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{deleteTarget.title}</span>{" "}
              링크가 영구적으로 삭제됩니다.
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setDeleteTargetId(null)}
                className="cursor-pointer"
              >
                취소
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={confirmDelete}
                className="cursor-pointer"
              >
                삭제
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

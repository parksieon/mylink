"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/context/auth-context";
import {
  Check,
  Loader2,
  Bold,
  Italic,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Code as CodeIcon,
  ImagePlus,
  Link as LinkIcon,
  Youtube as YoutubeIcon,
  Music,
  Undo2,
  Redo2,
} from "lucide-react";
import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Youtube from "@tiptap/extension-youtube";
import type { JSONContent } from "@tiptap/react";
import { useNodes } from "@/context/nodes-context";
import type { Node } from "@/lib/nodes";
import { uploadAsset } from "@/lib/assets";
import { StyleControls } from "../StyleControls";
import { isSafeHttpUrl } from "@/lib/url-safe";
import { Audio } from "@/lib/tiptap/audio-extension";
import { cn } from "@/lib/utils";

const SAVE_DEBOUNCE_MS = 400;

interface ArticleEditorProps {
  node: Node;
}

export function ArticleEditor({ node }: ArticleEditorProps) {
  const { user } = useAuth();
  const { saveArticle } = useNodes();
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSaved = useRef<string>("");

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ link: false }),
      Image,
      Link.configure({
        openOnClick: false,
        autolink: true,
        protocols: ["http", "https", "mailto"],
        validate: (href) => isSafeHttpUrl(href),
        HTMLAttributes: { rel: "noopener noreferrer nofollow", target: "_blank" },
      }),
      Youtube.configure({ controls: true, nocookie: true, width: 640, height: 360 }),
      Audio,
    ],
    content: (node.content as JSONContent) ?? "",
    immediatelyRender: false,
    onUpdate({ editor }) {
      const doc = editor.getJSON();
      const str = JSON.stringify(doc);
      if (str === lastSaved.current) return;
      setStatus("saving");
      if (saveTimeout.current) clearTimeout(saveTimeout.current);
      saveTimeout.current = setTimeout(async () => {
        try {
          await saveArticle(node.id, doc);
          lastSaved.current = str;
          setStatus("saved");
        } catch (err) {
          console.error("saveArticle failed:", err);
          setStatus("idle");
        }
      }, SAVE_DEBOUNCE_MS);
    },
  });

  // 페이지 전환 시 직전 페이지의 debounce 보류 분 저장
  useEffect(() => {
    return () => {
      if (saveTimeout.current) clearTimeout(saveTimeout.current);
    };
  }, []);

  return (
    <div className="mx-auto h-full w-full max-w-3xl overflow-y-auto px-8 py-10">
      <header className="mb-6 flex items-end justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-xs text-muted-foreground">
            {node.path.length > 1
              ? node.path.slice(0, -1).join(" / ")
              : "최상위"}{" "}
            · 문서
          </p>
          <h1 className="mt-1 truncate text-2xl font-bold tracking-tight text-foreground">
            {node.name}
          </h1>
        </div>
        <SaveIndicator status={status} />
      </header>

      <section className="mb-4">
        <StyleControls node={node} />
      </section>

      <div className="rounded-2xl bg-card ring-1 ring-border/60">
        {editor && (
          <>
            <Toolbar editor={editor} uid={user?.uid ?? ""} nodeId={node.id} />
            <div className="article-content p-6">
              <EditorContent editor={editor} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

interface ToolbarProps {
  editor: Editor;
  uid: string;
  nodeId: string;
}

function Toolbar({ editor, uid, nodeId }: ToolbarProps) {
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingAudio, setUploadingAudio] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !uid) return;
    setUploadingImage(true);
    try {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const path = `users/${uid}/files/${nodeId}/img-${Date.now()}-${safeName}`;
      const result = await uploadAsset(uid, file, path);
      if (result.ok) {
        editor.chain().focus().setImage({ src: result.value.downloadURL }).run();
      } else {
        alert(result.reason);
      }
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleAudioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !uid) return;
    setUploadingAudio(true);
    try {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const path = `users/${uid}/files/${nodeId}/audio-${Date.now()}-${safeName}`;
      const result = await uploadAsset(uid, file, path);
      if (result.ok) {
        editor
          .chain()
          .focus()
          .setAudio({ src: result.value.downloadURL, title: file.name })
          .run();
      } else {
        alert(result.reason);
      }
    } finally {
      setUploadingAudio(false);
      if (audioInputRef.current) audioInputRef.current.value = "";
    }
  };

  const handleLink = () => {
    const previousUrl = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("링크 주소를 입력하세요", previousUrl ?? "https://");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    if (!isSafeHttpUrl(url)) {
      alert("http:// 또는 https:// 주소만 사용할 수 있어요.");
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  const handleYoutube = () => {
    const url = window.prompt("YouTube URL을 입력하세요", "https://");
    if (!url) return;
    try {
      const u = new URL(url);
      const host = u.hostname.replace(/^www\./, "");
      const ok =
        host === "youtube.com" ||
        host === "youtu.be" ||
        host === "m.youtube.com" ||
        host === "youtube-nocookie.com";
      if (!ok) {
        alert("YouTube 주소만 사용할 수 있어요.");
        return;
      }
    } catch {
      alert("올바른 YouTube 주소를 입력해주세요.");
      return;
    }
    editor.commands.setYoutubeVideo({ src: url });
  };

  return (
    <div className="flex flex-wrap items-center gap-0.5 border-b border-border/60 px-2 py-1.5">
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        active={editor.isActive("bold")}
        title="굵게"
      >
        <Bold size={14} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        active={editor.isActive("italic")}
        title="기울임"
      >
        <Italic size={14} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleStrike().run()}
        active={editor.isActive("strike")}
        title="취소선"
      >
        <Strikethrough size={14} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleCode().run()}
        active={editor.isActive("code")}
        title="인라인 코드"
      >
        <CodeIcon size={14} />
      </ToolbarButton>
      <span className="mx-1 h-4 w-px bg-border/60" />
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        active={editor.isActive("heading", { level: 1 })}
        title="제목 1"
      >
        <Heading1 size={14} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        active={editor.isActive("heading", { level: 2 })}
        title="제목 2"
      >
        <Heading2 size={14} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        active={editor.isActive("heading", { level: 3 })}
        title="제목 3"
      >
        <Heading3 size={14} />
      </ToolbarButton>
      <span className="mx-1 h-4 w-px bg-border/60" />
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        active={editor.isActive("bulletList")}
        title="불릿"
      >
        <List size={14} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        active={editor.isActive("orderedList")}
        title="번호 매기기"
      >
        <ListOrdered size={14} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        active={editor.isActive("blockquote")}
        title="인용"
      >
        <Quote size={14} />
      </ToolbarButton>
      <span className="mx-1 h-4 w-px bg-border/60" />
      <ToolbarButton onClick={handleLink} active={editor.isActive("link")} title="링크">
        <LinkIcon size={14} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => fileInputRef.current?.click()}
        title="이미지 업로드"
        disabled={uploadingImage}
      >
        {uploadingImage ? (
          <Loader2 size={14} className="animate-spin" />
        ) : (
          <ImagePlus size={14} />
        )}
      </ToolbarButton>
      <ToolbarButton onClick={handleYoutube} title="YouTube 임베드">
        <YoutubeIcon size={14} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => audioInputRef.current?.click()}
        title="오디오(mp3) 업로드"
        disabled={uploadingAudio}
      >
        {uploadingAudio ? (
          <Loader2 size={14} className="animate-spin" />
        ) : (
          <Music size={14} />
        )}
      </ToolbarButton>
      <span className="mx-1 h-4 w-px bg-border/60" />
      <ToolbarButton
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
        title="실행 취소"
      >
        <Undo2 size={14} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
        title="다시 실행"
      >
        <Redo2 size={14} />
      </ToolbarButton>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImageUpload}
      />
      <input
        ref={audioInputRef}
        type="file"
        accept="audio/*,.mp3"
        className="hidden"
        onChange={handleAudioUpload}
      />
    </div>
  );
}

interface ToolbarButtonProps {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  title?: string;
  children: React.ReactNode;
}

function ToolbarButton({
  onClick,
  active,
  disabled,
  title,
  children,
}: ToolbarButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cn(
        "inline-flex h-7 w-7 items-center justify-center rounded text-foreground/70 transition-colors hover:bg-accent hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40",
        active && "bg-accent text-foreground"
      )}
    >
      {children}
    </button>
  );
}

function SaveIndicator({ status }: { status: "idle" | "saving" | "saved" }) {
  if (status === "saving")
    return (
      <span className="inline-flex shrink-0 items-center gap-1 text-[11px] text-muted-foreground">
        <Loader2 size={11} className="animate-spin" /> 저장 중
      </span>
    );
  if (status === "saved")
    return (
      <span className="inline-flex shrink-0 items-center gap-1 text-[11px] text-muted-foreground">
        <Check size={11} /> 저장됨
      </span>
    );
  return null;
}

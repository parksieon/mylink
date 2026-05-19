"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Youtube from "@tiptap/extension-youtube";
import type { JSONContent } from "@tiptap/react";

interface ArticleViewerProps {
  content: unknown;
}

export function ArticleViewer({ content }: ArticleViewerProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Image,
      Link.configure({ openOnClick: true, autolink: true }),
      Youtube.configure({ controls: true, nocookie: true, width: 640, height: 360 }),
    ],
    content: (content as JSONContent) ?? "",
    editable: false,
    immediatelyRender: false,
  });

  return (
    <div className="article-content rounded-2xl bg-card p-6 ring-1 ring-border/60">
      <EditorContent editor={editor} />
    </div>
  );
}

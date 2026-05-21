/**
 * TipTap article content (JSON) sanitize.
 *
 * Firestore 룰이 article 본문 스키마까지 검증하지 못하므로, 렌더 시점에서
 * 위험한 attribute(href, src)를 정리해서 직접 SDK로 악성 JSON을 심은 경우에도
 * 방문자 브라우저에서 XSS·임의 외부 트래커가 작동하지 않게 한다.
 */

import { isSafeHttpUrl, isFirebaseStorageUrl } from "@/lib/url-safe";

type AnyJson = unknown;

function sanitizeMark(mark: Record<string, unknown>): Record<string, unknown> | null {
  if (mark.type === "link") {
    const attrs = (mark.attrs ?? {}) as Record<string, unknown>;
    if (!isSafeHttpUrl(attrs.href)) return null;
    return {
      ...mark,
      attrs: {
        ...attrs,
        // rel·target은 TipTap이 기본으로 채워주지만 안전한 값으로 강제
        rel: "noopener noreferrer nofollow",
        target: "_blank",
      },
    };
  }
  return mark;
}

function sanitizeNode(node: Record<string, unknown>): Record<string, unknown> | null {
  const type = node.type;

  if (type === "image") {
    const attrs = (node.attrs ?? {}) as Record<string, unknown>;
    if (!isFirebaseStorageUrl(attrs.src)) return null;
  }

  if (type === "audio") {
    const attrs = (node.attrs ?? {}) as Record<string, unknown>;
    if (!isFirebaseStorageUrl(attrs.src)) return null;
  }

  if (type === "youtube") {
    const attrs = (node.attrs ?? {}) as Record<string, unknown>;
    const src = attrs.src;
    if (typeof src !== "string") return null;
    try {
      const u = new URL(src);
      const host = u.hostname.replace(/^www\./, "");
      const okHost =
        host === "youtube.com" ||
        host === "youtu.be" ||
        host === "youtube-nocookie.com" ||
        host === "m.youtube.com";
      if (!okHost) return null;
    } catch {
      return null;
    }
  }

  const cleaned: Record<string, unknown> = { ...node };

  if (Array.isArray(node.marks)) {
    const marks: Record<string, unknown>[] = [];
    for (const m of node.marks as Record<string, unknown>[]) {
      const safe = sanitizeMark(m);
      if (safe) marks.push(safe);
    }
    cleaned.marks = marks;
  }

  if (Array.isArray(node.content)) {
    const children: Record<string, unknown>[] = [];
    for (const c of node.content as Record<string, unknown>[]) {
      const safe = sanitizeNode(c);
      if (safe) children.push(safe);
    }
    cleaned.content = children;
  }

  return cleaned;
}

export function sanitizeArticleContent(content: AnyJson): AnyJson {
  if (content == null) return content;
  if (typeof content !== "object") return content;
  return sanitizeNode(content as Record<string, unknown>);
}

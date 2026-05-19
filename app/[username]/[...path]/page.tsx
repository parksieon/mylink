"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { getProfileByUsername } from "@/lib/user";
import { getNodeTreeByUsername, getNodeByPath, type Node } from "@/lib/nodes";
import { PublicFolderView } from "@/components/PublicFolderView";
import { LeafView } from "@/components/LeafView";
import { isSafeHttpUrl } from "@/lib/url-safe";

interface PageProps {
  params: Promise<{ username: string; path: string[] }>;
}

type ResolveResult =
  | { state: "not-found" }
  | { state: "user-not-found" }
  | { state: "folder"; folder: Node; children: Node[] }
  | { state: "leaf"; leaf: Node };

export default function NestedPage({ params }: PageProps) {
  const { username, path } = use(params);
  const [result, setResult] = useState<ResolveResult | null>(null);
  const [ownerUid, setOwnerUid] = useState<string>("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setResult(null);
      const profile = await getProfileByUsername(username);
      if (cancelled) return;
      if (!profile) {
        setResult({ state: "user-not-found" });
        return;
      }
      setOwnerUid(profile.uid);

      const decodedPath = path.map(decodeURIComponent);
      const node = await getNodeByPath(profile.uid, decodedPath);
      if (cancelled) return;

      if (!node || node.effectiveVisibility !== "public") {
        setResult({ state: "not-found" });
        return;
      }

      // 외부 링크 → 클라 redirect (http/https 만 허용 — javascript:·data: 차단)
      if (node.kind === "link" && node.url) {
        if (isSafeHttpUrl(node.url)) {
          window.location.replace(node.url);
        } else {
          setResult({ state: "not-found" });
        }
        return;
      }

      if (node.kind !== "folder") {
        // 단일 leaf → 풀스크린 페이지
        setResult({ state: "leaf", leaf: node });
        return;
      }

      // 폴더 → 자식 카드 목록
      const tree = await getNodeTreeByUsername(username);
      if (cancelled) return;
      const allNodes = tree?.nodes ?? [];
      const folderChildren = allNodes
        .filter(
          (n) => n.parentId === node.id && n.effectiveVisibility === "public"
        )
        .sort((a, b) => a.order - b.order);
      setResult({ state: "folder", folder: node, children: folderChildren });
    })();
    return () => {
      cancelled = true;
    };
  }, [username, path]);

  useEffect(() => {
    if (result?.state === "folder") {
      document.title = `${result.folder.name} | @${username}의 TimeFilm`;
    } else if (result?.state === "leaf") {
      document.title = `${result.leaf.name} | @${username}의 TimeFilm`;
    }
  }, [result, username]);

  if (!result) return null;

  if (result.state === "user-not-found") {
    return <NotFoundCard username={username} />;
  }
  if (result.state === "not-found") {
    return <NotFoundPathCard username={username} />;
  }

  const decodedPath = path.map(decodeURIComponent);
  const parentHref =
    decodedPath.length === 1
      ? `/${username}`
      : `/${username}/${decodedPath
          .slice(0, -1)
          .map(encodeURIComponent)
          .join("/")}`;

  if (result.state === "leaf") {
    return <LeafView leaf={result.leaf} parentHref={parentHref} />;
  }

  // folder
  return (
    <PublicFolderView
      username={username}
      ownerUid={ownerUid}
      folder={result.folder}
      children={result.children}
      basePath={`/${username}/${decodedPath.map(encodeURIComponent).join("/")}`}
      parentHref={parentHref}
    />
  );
}

function NotFoundCard({ username }: { username: string }) {
  return (
    <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-md flex-col items-center justify-center px-6 text-center">
      <h1 className="text-2xl font-bold tracking-tight text-foreground">
        페이지를 찾을 수 없어요
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        <span className="font-mono">@{username}</span> 사용자가 존재하지 않아요.
      </p>
      <Link
        href="/"
        className="mt-6 text-sm text-muted-foreground underline transition-colors hover:text-foreground"
      >
        홈으로 돌아가기
      </Link>
    </div>
  );
}

function NotFoundPathCard({ username }: { username: string }) {
  return (
    <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-md flex-col items-center justify-center px-6 text-center">
      <h1 className="text-2xl font-bold tracking-tight text-foreground">
        찾을 수 없는 페이지
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        비공개이거나 삭제된 항목일 수 있어요.
      </p>
      <Link
        href={`/${username}`}
        className="mt-6 text-sm text-muted-foreground underline transition-colors hover:text-foreground"
      >
        @{username} 홈으로
      </Link>
    </div>
  );
}

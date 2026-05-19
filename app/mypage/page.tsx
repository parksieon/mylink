"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ExternalLink, AlertCircle } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { getProfile } from "@/lib/user";
import { Tree } from "./_components/Tree";
import { NodeEditor } from "./_components/NodeEditor";
import { CreateNodeDialog } from "./_components/CreateNodeDialog";
import { useNodes } from "@/context/nodes-context";
import { formatBytes } from "@/lib/quota";

export default function MyPage() {
  const { user, loading: authLoading, signIn } = useAuth();
  const [username, setUsername] = useState<string | null>(null);
  const [profileChecked, setProfileChecked] = useState(false);

  useEffect(() => {
    if (!user) {
      setUsername(null);
      setProfileChecked(false);
      return;
    }
    let cancelled = false;
    (async () => {
      const p = await getProfile(user.uid);
      if (cancelled) return;
      setUsername(p?.username ?? null);
      setProfileChecked(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  if (authLoading) return null;

  if (!user) {
    return (
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-md flex-col items-center justify-center px-6 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          로그인이 필요해요
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          관리하려면 먼저 Google로 로그인해 주세요.
        </p>
        <button
          type="button"
          onClick={signIn}
          className="mt-8 cursor-pointer rounded-xl bg-foreground px-6 py-3 text-sm font-medium text-background transition-opacity hover:opacity-90 active:scale-[0.98]"
        >
          Google로 로그인
        </button>
      </div>
    );
  }

  return <Workspace username={username} profileChecked={profileChecked} />;
}

function Workspace({
  username,
  profileChecked,
}: {
  username: string | null;
  profileChecked: boolean;
}) {
  const { usedBytes, quotaBytes, isOwner } = useNodes();
  const [createOpen, setCreateOpen] = useState(false);
  const [createParentId, setCreateParentId] = useState<string | null>(null);

  return (
    <div className="flex h-[calc(100vh-3rem)] flex-col">
      <header className="flex items-center justify-between border-b border-border/60 px-6 py-3">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft size={14} />홈
          </Link>
          <span className="text-muted-foreground/40">/</span>
          <h1 className="text-sm font-semibold tracking-tight">관리</h1>
        </div>
        <div className="flex items-center gap-4">
          <span className="hidden text-[11px] text-muted-foreground sm:inline">
            {isOwner
              ? `${formatBytes(usedBytes)} 사용 (무제한)`
              : `${formatBytes(usedBytes)} / ${formatBytes(quotaBytes)}`}
          </span>
          {username && (
            <Link
              href={`/${username}`}
              target="_blank"
              className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              공개 페이지 <ExternalLink size={11} />
            </Link>
          )}
        </div>
      </header>

      {profileChecked && !username && (
        <div className="flex items-start gap-2 border-b border-amber-200/60 bg-amber-50/60 px-6 py-2 text-xs text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200">
          <AlertCircle size={14} className="mt-0.5 shrink-0" />
          <div>
            공개 URL로 공유하려면{" "}
            <Link href="/profile" className="underline hover:opacity-70">
              프로필에서 username
            </Link>
            을 먼저 설정해 주세요.
          </div>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        <aside className="hidden w-72 shrink-0 border-r border-border/60 md:flex md:flex-col">
          <Tree
            onCreateClick={(parentId) => {
              setCreateParentId(parentId);
              setCreateOpen(true);
            }}
          />
        </aside>
        <main className="flex-1 overflow-y-auto">
          <NodeEditor />
        </main>
      </div>

      <div className="md:hidden border-t border-border/60 bg-muted/30 px-6 py-4 text-center text-xs text-muted-foreground">
        관리 기능은 데스크탑에서 더 편하게 사용할 수 있어요.
      </div>

      <CreateNodeDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        parentId={createParentId}
      />
    </div>
  );
}

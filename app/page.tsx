"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ExternalLink, LayoutGrid, User, Sparkles } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { getProfile } from "@/lib/user";

export default function Home() {
  const { user, loading: authLoading, signIn } = useAuth();
  const [myUsername, setMyUsername] = useState<string | null>(null);
  const [myDisplayName, setMyDisplayName] = useState<string | null>(null);
  const [myBio, setMyBio] = useState<string>("");

  useEffect(() => {
    if (!user) {
      setMyUsername(null);
      setMyDisplayName(null);
      setMyBio("");
      return;
    }
    let cancelled = false;
    (async () => {
      const profile = await getProfile(user.uid);
      if (cancelled) return;
      setMyUsername(profile?.username ?? null);
      setMyDisplayName(profile?.displayName ?? user.displayName ?? null);
      setMyBio(profile?.bio ?? "");
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  if (authLoading) return null;

  if (!user) {
    return (
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-md flex-col items-center justify-center px-6 text-center">
        <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-white ring-1 ring-border/60">
          <Image
            src="/CelloIMG.png"
            alt="첼로"
            width={96}
            height={96}
            priority
            className="h-20 w-20 object-contain"
          />
        </div>
        <h1 className="mt-6 text-2xl font-bold tracking-tight text-foreground">
          TimeFilm
        </h1>
        <p className="mt-2 max-w-xs text-[13px] leading-relaxed text-muted-foreground">
          Google 계정으로 로그인하고 나만의 페이지를 만들어보세요.
        </p>
        <button
          type="button"
          onClick={signIn}
          className="mt-8 cursor-pointer rounded-xl bg-foreground px-6 py-3 text-sm font-medium text-background transition-opacity hover:opacity-90 active:scale-[0.98]"
        >
          Google로 시작하기
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-2xl flex-col px-6 pb-12 pt-20">
      <header className="flex flex-col items-center text-center">
        <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-white ring-1 ring-border/60">
          {user.photoURL ? (
            <Image
              src={user.photoURL}
              alt={user.displayName ?? "프로필"}
              width={96}
              height={96}
              unoptimized
              className="h-full w-full object-cover"
            />
          ) : (
            <Image
              src="/CelloIMG.png"
              alt="첼로"
              width={96}
              height={96}
              priority
              className="h-20 w-20 object-contain"
            />
          )}
        </div>
        <h1 className="mt-5 text-2xl font-bold tracking-tight text-foreground">
          {myDisplayName ?? "이름 없음"}
        </h1>
        {myUsername ? (
          <Link
            href={`/${myUsername}`}
            className="mt-1.5 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            @{myUsername}
            <ExternalLink size={12} strokeWidth={1.8} />
          </Link>
        ) : (
          <Link
            href="/profile"
            className="mt-1.5 inline-block rounded-full border border-dashed border-muted-foreground/30 px-3 py-1 text-[12px] text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground"
          >
            username 설정하기
          </Link>
        )}
        {myBio && (
          <p className="mt-4 max-w-md whitespace-pre-wrap text-[14px] leading-relaxed text-foreground/80">
            {myBio}
          </p>
        )}
      </header>

      <div className="mt-12 grid gap-3 sm:grid-cols-2">
        <Link
          href="/mypage"
          className="group flex items-center gap-4 rounded-2xl bg-card p-5 ring-1 ring-border/60 transition-all hover:ring-border hover:shadow-sm active:scale-[0.99]"
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-foreground/[0.04] text-foreground/60 transition-colors group-hover:bg-foreground/[0.07] group-hover:text-foreground">
            <LayoutGrid size={22} strokeWidth={1.8} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[15px] font-semibold text-foreground">관리</div>
            <div className="mt-0.5 text-[12px] text-muted-foreground">
              폴더·자료·링크 추가하고 꾸미기
            </div>
          </div>
        </Link>
        <Link
          href="/profile"
          className="group flex items-center gap-4 rounded-2xl bg-card p-5 ring-1 ring-border/60 transition-all hover:ring-border hover:shadow-sm active:scale-[0.99]"
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-foreground/[0.04] text-foreground/60 transition-colors group-hover:bg-foreground/[0.07] group-hover:text-foreground">
            <User size={22} strokeWidth={1.8} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[15px] font-semibold text-foreground">프로필</div>
            <div className="mt-0.5 text-[12px] text-muted-foreground">
              username·소개글 설정
            </div>
          </div>
        </Link>
      </div>

      {myUsername && (
        <Link
          href={`/${myUsername}`}
          className="group mt-3 flex items-center gap-4 rounded-2xl bg-card p-5 ring-1 ring-border/60 transition-all hover:ring-border hover:shadow-sm active:scale-[0.99]"
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-foreground/[0.04] text-foreground/60 transition-colors group-hover:bg-foreground/[0.07] group-hover:text-foreground">
            <Sparkles size={22} strokeWidth={1.8} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[15px] font-semibold text-foreground">
              내 공개 페이지 열기
            </div>
            <div className="mt-0.5 truncate text-[12px] text-muted-foreground">
              /{myUsername}
            </div>
          </div>
          <ExternalLink size={14} className="shrink-0 text-foreground/30" />
        </Link>
      )}

      <footer className="mt-auto pt-16 text-center">
        <p className="text-[11px] tracking-wide text-muted-foreground/60">
          Powered by <span className="font-semibold text-foreground/70">TimeFilm</span>
        </p>
      </footer>
    </div>
  );
}

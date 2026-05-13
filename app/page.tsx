"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLinkContext } from "@/context/link-context";
import { useAuth } from "@/context/auth-context";
import { ChevronRight, ExternalLink } from "lucide-react";
import Image from "next/image";
import { getProfile } from "@/lib/user";

export default function Home() {
  const { user, loading: authLoading, signIn } = useAuth();
  const { links } = useLinkContext();
  const [myUsername, setMyUsername] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setMyUsername(null);
      return;
    }
    let cancelled = false;
    (async () => {
      const profile = await getProfile(user.uid);
      if (cancelled) return;
      setMyUsername(profile?.username ?? null);
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
          MyLink
        </h1>
        <p className="mt-2 max-w-xs text-[13px] leading-relaxed text-muted-foreground">
          Google 계정으로 로그인하고 나만의 링크 모음을 만들어보세요.
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
    <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-lg flex-col px-6 pb-12 pt-20">
      {/* Profile Hero */}
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
          {user.displayName ?? "이름 없음"}
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
            href="/mypage"
            className="mt-1.5 inline-block rounded-full border border-dashed border-muted-foreground/30 px-3 py-1 text-[12px] text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground"
          >
            공개 URL을 설정하려면 클릭하세요
          </Link>
        )}
      </header>

      {/* Links */}
      <div className="mt-12 w-full space-y-3">
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <a
              key={link.id}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex w-full items-center gap-4 rounded-2xl bg-card p-4 ring-1 ring-border/60 transition-all duration-200 hover:ring-border hover:shadow-sm active:scale-[0.98]"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-foreground/[0.04] text-foreground/60 transition-colors group-hover:bg-foreground/[0.07] group-hover:text-foreground">
                <Icon size={20} strokeWidth={1.8} />
              </div>
              <span className="flex-1 text-[15px] font-medium text-foreground">
                {link.title}
              </span>
              <ChevronRight
                size={16}
                className="text-foreground/20 transition-all group-hover:translate-x-0.5 group-hover:text-foreground/40"
              />
            </a>
          );
        })}
      </div>

      {/* Footer */}
      <footer className="mt-auto pt-16 text-center">
        <p className="text-[11px] tracking-wide text-muted-foreground/60">
          Powered by{" "}
          <span className="font-semibold text-foreground/70">MyLink</span>
        </p>
      </footer>
    </div>
  );
}

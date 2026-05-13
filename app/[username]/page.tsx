"use client";

import { use, useEffect, useState } from "react";
import { ChevronRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import {
  getProfileByUsername,
  getUserLinks,
  incrementLinkClick,
  type UserProfile,
  type PublicLink,
} from "@/lib/user";
import { getIcon } from "@/lib/icon-map";

interface PageProps {
  params: Promise<{ username: string }>;
}

export default function UsernamePage({ params }: PageProps) {
  const { username } = use(params);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [links, setLinks] = useState<PublicLink[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const p = await getProfileByUsername(username);
      if (cancelled) return;
      if (!p) {
        setLoading(false);
        return;
      }
      setProfile(p);
      const ls = await getUserLinks(p.uid);
      if (cancelled) return;
      setLinks(ls);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [username]);

  if (loading) return null;

  if (!profile) {
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

  return (
    <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-lg flex-col px-6 pb-12 pt-20">
      <header className="flex flex-col items-center text-center">
        <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-white ring-1 ring-border/60">
          {profile.photoURL ? (
            <Image
              src={profile.photoURL}
              alt={profile.displayName ?? username}
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
          {profile.displayName || username}
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">@{username}</p>
      </header>

      <div className="mt-12 w-full space-y-3">
        {links.length === 0 ? (
          <p className="mt-8 text-center text-sm text-muted-foreground">
            아직 등록된 링크가 없어요.
          </p>
        ) : (
          links.map((link) => {
            const Icon = getIcon(link.iconName);
            return (
              <a
                key={link.id}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => {
                  incrementLinkClick(profile.uid, link.id);
                }}
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
          })
        )}
      </div>

      <footer className="mt-auto pt-16 text-center">
        <p className="text-[11px] tracking-wide text-muted-foreground/60">
          Powered by{" "}
          <Link
            href="/"
            className="font-semibold text-foreground/70 transition-opacity hover:opacity-70"
          >
            MyLink
          </Link>
        </p>
      </footer>
    </div>
  );
}

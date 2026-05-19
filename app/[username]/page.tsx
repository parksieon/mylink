"use client";

import { use, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  getProfileByUsername,
  type UserProfile,
} from "@/lib/user";
import { getNodeTreeByUsername, type Node } from "@/lib/nodes";
import { PublicFolderView } from "@/components/PublicFolderView";

interface PageProps {
  params: Promise<{ username: string }>;
}

export default function UsernamePage({ params }: PageProps) {
  const { username } = use(params);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [rootChildren, setRootChildren] = useState<Node[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const p = await getProfileByUsername(username);
      if (cancelled) return;
      if (!p) {
        setLoading(false);
        return;
      }
      setProfile(p);

      const tree = await getNodeTreeByUsername(username);
      if (cancelled) return;
      const children = tree?.nodes
        .filter(
          (n) => n.parentId === null && n.effectiveVisibility === "public"
        )
        .sort((a, b) => a.order - b.order) ?? [];
      setRootChildren(children);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [username]);

  useEffect(() => {
    if (profile?.displayName) {
      document.title = `${profile.displayName}의 TimeFilm`;
    } else {
      document.title = `@${username}의 TimeFilm`;
    }
  }, [profile, username]);

  if (loading) return null;

  if (!profile) {
    return <NotFoundCard username={username} />;
  }

  return (
    <div>
      <ProfileHeader profile={profile} username={username} />
      <PublicFolderView
        username={username}
        ownerUid={profile.uid}
        folder={null}
        children={rootChildren}
        basePath={`/${username}`}
        hideOwnHeader
      />
    </div>
  );
}

function ProfileHeader({
  profile,
  username,
}: {
  profile: UserProfile;
  username: string;
}) {
  return (
    <header className="mx-auto flex max-w-2xl flex-col items-center px-6 pt-16 text-center">
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
      {profile.bio && (
        <p className="mt-4 max-w-md whitespace-pre-wrap text-[14px] leading-relaxed text-foreground/80">
          {profile.bio}
        </p>
      )}
    </header>
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

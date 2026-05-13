"use client";

import Image from "next/image";
import { useAuth } from "@/context/auth-context";

export function NavUserMenu() {
  const { user, loading, signIn, signOut } = useAuth();

  if (loading) {
    return <div className="h-7 w-7" />;
  }

  if (!user) {
    return (
      <button
        type="button"
        onClick={signIn}
        className="cursor-pointer text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        로그인
      </button>
    );
  }

  return (
    <div className="flex items-center gap-3">
      {user.photoURL ? (
        <Image
          src={user.photoURL}
          alt={user.displayName ?? "사용자"}
          width={28}
          height={28}
          unoptimized
          className="h-7 w-7 rounded-full ring-1 ring-border/60"
        />
      ) : (
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-foreground/10 text-[11px] font-medium">
          {(user.displayName ?? user.email ?? "?").slice(0, 1).toUpperCase()}
        </div>
      )}
      <button
        type="button"
        onClick={signOut}
        className="cursor-pointer text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        로그아웃
      </button>
    </div>
  );
}

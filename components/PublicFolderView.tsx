"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import type { Node } from "@/lib/nodes";
import { NodeCard } from "@/components/NodeCard";

interface PublicFolderViewProps {
  username: string;
  ownerUid: string;
  // If null, this is the root view
  folder: Node | null;
  children: Node[];
  basePath: string; // e.g., "/parksieon" or "/parksieon/방A"
  parentHref?: string; // for back nav
  hideOwnHeader?: boolean;
}

export function PublicFolderView({
  username,
  ownerUid,
  folder,
  children,
  basePath,
  parentHref,
  hideOwnHeader,
}: PublicFolderViewProps) {
  const bgImage = folder?.bgImageURL;

  return (
    <div className="relative min-h-[calc(100vh-3rem)]">
      {bgImage && (
        <div className="pointer-events-none absolute inset-0 -z-10">
          <Image
            src={bgImage}
            alt=""
            fill
            unoptimized
            className="object-cover opacity-50"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/40 to-background" />
        </div>
      )}

      <div className="mx-auto max-w-2xl px-6 pb-16 pt-12">
        {parentHref && (
          <Link
            href={parentHref}
            className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ChevronLeft size={14} />
            상위 폴더로
          </Link>
        )}

        {!hideOwnHeader && (
          <header className="mb-10 text-center">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              {folder ? folder.name : `@${username}`}
            </h1>
          </header>
        )}

        {children.length === 0 ? (
          <p className="mt-12 text-center text-sm text-muted-foreground">
            아직 공개된 항목이 없어요.
          </p>
        ) : (
          <div className="space-y-3">
            {children.map((node) => (
              <NodeCard
                key={node.id}
                node={node}
                basePath={basePath}
                ownerUid={ownerUid}
              />
            ))}
          </div>
        )}

        <footer className="mt-16 text-center">
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
    </div>
  );
}

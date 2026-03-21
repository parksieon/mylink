"use client";

import { useLinkContext } from "@/context/link-context";
import { ChevronRight } from "lucide-react";

export default function Home() {
  const { links } = useLinkContext();

  return (
    <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-lg flex-col items-center px-6 pb-20 pt-24">
      {/* Profile */}
      <div className="mb-2 flex h-20 w-20 items-center justify-center rounded-full bg-foreground/5">
        <span className="text-3xl font-bold text-foreground/30">H</span>
      </div>
      <h1 className="mt-4 text-2xl font-bold tracking-tight text-foreground">
        홍길동
      </h1>
      <p className="mt-1.5 text-sm text-muted-foreground">
        개발자 · 크리에이터
      </p>

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
    </div>
  );
}

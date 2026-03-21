import type { Metadata } from "next";
import { Geist } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { cn } from "@/lib/utils";
import { LinkProvider } from "@/context/link-context";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "MyLink",
  description: "나만의 링크를 한곳에 모아 관리하세요.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={cn("font-sans", geist.variable)}>
      <body className="antialiased">
        <nav className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-xl backdrop-saturate-150">
          <div className="mx-auto flex h-12 max-w-3xl items-center justify-between px-6">
            <Link
              href="/"
              className="text-sm font-semibold tracking-tight text-foreground transition-opacity hover:opacity-60"
            >
              MyLink
            </Link>
            <Link
              href="/mypage"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              관리
            </Link>
          </div>
        </nav>
        <LinkProvider>
          <main>{children}</main>
        </LinkProvider>
      </body>
    </html>
  );
}

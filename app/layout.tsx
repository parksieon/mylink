import type { Metadata } from "next";
import { Geist } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { cn } from "@/lib/utils";
import { LinkProvider } from "@/context/link-context";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  metadataBase: new URL("https://mylink.vercel.app"),
  title: {
    default: "MyLink — 나만의 링크를 한곳에",
    template: "%s · MyLink",
  },
  description:
    "인스타그램, 블로그, 포트폴리오 등 흩어진 링크를 하나의 프로필로 모아 공유하세요.",
  openGraph: {
    type: "website",
    locale: "ko_KR",
    siteName: "MyLink",
    title: "MyLink — 나만의 링크를 한곳에",
    description:
      "인스타그램, 블로그, 포트폴리오 등 흩어진 링크를 하나의 프로필로 모아 공유하세요.",
  },
  twitter: {
    card: "summary_large_image",
    title: "MyLink — 나만의 링크를 한곳에",
    description:
      "인스타그램, 블로그, 포트폴리오 등 흩어진 링크를 하나의 프로필로 모아 공유하세요.",
  },
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

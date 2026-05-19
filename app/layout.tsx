import type { Metadata } from "next";
import { Geist } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { cn } from "@/lib/utils";
import { AuthProvider } from "@/context/auth-context";
import { NavUserMenu } from "@/components/nav-user-menu";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  metadataBase: new URL("https://mylink.vercel.app"),
  title: {
    default: "박시언의 TimeFilm",
    template: "%s · 박시언의 TimeFilm",
  },
  description:
    "코드로 세상을 더 행복하게 만들고 싶은 학생, 박시언의 페이지.",
  openGraph: {
    type: "website",
    locale: "ko_KR",
    siteName: "박시언의 TimeFilm",
    title: "박시언의 TimeFilm",
    description:
      "코드로 세상을 더 행복하게 만들고 싶은 학생, 박시언의 페이지.",
  },
  twitter: {
    card: "summary_large_image",
    title: "박시언의 TimeFilm",
    description:
      "코드로 세상을 더 행복하게 만들고 싶은 학생, 박시언의 페이지.",
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
        <AuthProvider>
          <nav className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-xl backdrop-saturate-150">
            <div className="mx-auto flex h-12 max-w-3xl items-center justify-between px-6">
              <Link
                href="/"
                className="text-sm font-semibold tracking-tight text-foreground transition-opacity hover:opacity-60"
              >
                TimeFilm
              </Link>
              <div className="flex items-center gap-6">
                <Link
                  href="/mypage"
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  관리
                </Link>
                <Link
                  href="/profile"
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  프로필
                </Link>
                <NavUserMenu />
              </div>
            </div>
          </nav>
          <main>{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}

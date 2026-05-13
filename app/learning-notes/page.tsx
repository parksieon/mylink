import fs from "node:fs";
import path from "node:path";
import Link from "next/link";
import { ArrowLeft, FileText, ExternalLink } from "lucide-react";

export const dynamic = "force-dynamic";

const NOTES_DIR_NAME = "학습정리";

function getNoteFiles(): string[] {
  try {
    const dir = path.join(process.cwd(), NOTES_DIR_NAME);
    return fs
      .readdirSync(dir)
      .filter((name) => !name.startsWith(".") && fs.statSync(path.join(dir, name)).isFile())
      .sort();
  } catch {
    return [];
  }
}

function getDisplayName(filename: string): string {
  const ext = path.extname(filename);
  return ext ? filename.slice(0, -ext.length) : filename;
}

function getExtBadge(filename: string): string {
  return path.extname(filename).replace(".", "").toUpperCase() || "FILE";
}

export default function LearningNotesPage() {
  const files = getNoteFiles();

  return (
    <div className="mx-auto max-w-2xl px-6 pb-20 pt-16">
      <Link
        href="/"
        className="mb-10 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft size={14} />
        돌아가기
      </Link>

      <header className="mb-12">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          학습 정리
        </h1>
        <p className="mt-2 text-base text-muted-foreground">
          공부하면서 정리한 자료를 모아두는 공간입니다.
        </p>
      </header>

      {files.length === 0 ? (
        <div className="rounded-2xl bg-card p-10 text-center ring-1 ring-border/60">
          <FileText
            size={28}
            strokeWidth={1.5}
            className="mx-auto text-muted-foreground/50"
          />
          <p className="mt-4 text-sm font-medium text-foreground">
            아직 올라온 자료가 없어요
          </p>
          <p className="mt-1 text-[13px] text-muted-foreground">
            곧 새로운 학습 정리가 추가될 예정입니다.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-border/60 overflow-hidden rounded-2xl ring-1 ring-border/60">
          {files.map((filename) => (
            <a
              key={filename}
              href={`/api/learning-notes/${encodeURIComponent(filename)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-4 bg-card p-4 transition-colors hover:bg-accent/40"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-foreground/[0.04] text-foreground/60">
                <FileText size={18} strokeWidth={1.8} />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-[15px] font-medium text-foreground">
                  {getDisplayName(filename)}
                </h3>
                <p className="mt-0.5 text-[12px] font-medium tracking-wide text-muted-foreground">
                  {getExtBadge(filename)}
                </p>
              </div>
              <ExternalLink
                size={15}
                className="text-foreground/30 transition-colors group-hover:text-foreground/60"
              />
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

"use client";

/**
 * 공개 프로필 페이지 헤더(bio 아래)에 인라인으로 들어가는 BGM 카드.
 *
 * UI: [음반 아이콘]  곡 제목  [▶/⏸]
 * - 곡 제목은 YouTube oEmbed (https://www.youtube.com/oembed) 로 자동 조회 — CSP connect-src 에 추가됨
 * - 재생은 hidden iframe(0×0) + postMessage 로 제어 (의존성 0)
 * - 자동재생은 브라우저 정책상 막혀있어 사용자가 ▶ 한 번 눌러야 시작
 */

import { useEffect, useRef, useState } from "react";
import { Disc3, Pause, Play } from "lucide-react";
import { extractYoutubeVideoId } from "@/lib/youtube";

interface Props {
  url: string;
}

export function MiniBgmPlayer({ url }: Props) {
  const videoId = extractYoutubeVideoId(url);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [playing, setPlaying] = useState(false);
  const [title, setTitle] = useState<string | null>(null);

  // oEmbed 로 곡 제목 조회 — 실패해도 카드는 표시되고 fallback 텍스트로 대체
  useEffect(() => {
    if (!videoId) return;
    let cancelled = false;
    (async () => {
      try {
        const oembed = `https://www.youtube.com/oembed?url=${encodeURIComponent(
          `https://www.youtube.com/watch?v=${videoId}`
        )}&format=json`;
        const res = await fetch(oembed);
        if (!res.ok) return;
        const data = (await res.json()) as { title?: string };
        if (!cancelled && data.title) setTitle(data.title);
      } catch {
        // CSP 차단·네트워크 실패 등 — fallback 라벨 사용
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [videoId]);

  // YouTube iframe 상태 변화 동기화 (외부 일시정지·종료 시 버튼 표시 일치)
  useEffect(() => {
    if (!videoId) return;
    const onMessage = (e: MessageEvent) => {
      if (typeof e.origin !== "string" || !e.origin.includes("youtube.com")) return;
      try {
        const data = typeof e.data === "string" ? JSON.parse(e.data) : e.data;
        if (data?.event === "onStateChange") {
          if (data.info === 1) setPlaying(true);
          else if (data.info === 2 || data.info === 0) setPlaying(false);
        }
      } catch {
        // 다른 iframe 메시지 무시
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [videoId]);

  if (!videoId) return null;

  const toggle = () => {
    const func = playing ? "pauseVideo" : "playVideo";
    iframeRef.current?.contentWindow?.postMessage(
      JSON.stringify({ event: "command", func, args: [] }),
      "*"
    );
    setPlaying((p) => !p);
  };

  // loop 트릭: playlist 파라미터에 같은 videoId 한 번 더 지정해야 단일 영상 반복 재생됨
  const src =
    `https://www.youtube.com/embed/${videoId}` +
    `?enablejsapi=1&loop=1&playlist=${videoId}&controls=0&modestbranding=1&playsinline=1&rel=0`;

  return (
    <>
      {/* 화면에 안 보이는 0×0 재생용 iframe */}
      <iframe
        ref={iframeRef}
        src={src}
        width={0}
        height={0}
        allow="autoplay; encrypted-media"
        style={{ position: "absolute", width: 0, height: 0, border: 0 }}
        title="배경 음악"
        aria-hidden="true"
      />

      {/* 인라인 BGM 카드 */}
      <div className="mt-5 inline-flex max-w-full items-center gap-3 rounded-full bg-card px-4 py-2 ring-1 ring-border/60">
        <Disc3
          size={20}
          strokeWidth={1.8}
          className={
            "shrink-0 text-foreground/70 " +
            (playing ? "animate-spin [animation-duration:3s]" : "")
          }
          aria-hidden="true"
        />
        <span
          className="min-w-0 max-w-[200px] truncate text-[13px] text-foreground/80 sm:max-w-[280px]"
          title={title ?? "배경 음악"}
        >
          {title ?? "배경 음악"}
        </span>
        <button
          type="button"
          onClick={toggle}
          aria-label={playing ? "일시정지" : "재생"}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-foreground text-background transition-opacity hover:opacity-90 active:scale-95"
        >
          {playing ? (
            <Pause size={13} strokeWidth={2.4} />
          ) : (
            <Play size={13} strokeWidth={2.4} className="translate-x-[1px]" />
          )}
        </button>
      </div>
    </>
  );
}

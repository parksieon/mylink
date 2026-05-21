"use client";

/**
 * 공개 프로필 페이지 헤더(bio 아래)에 인라인으로 들어가는 BGM 카드.
 *
 * UI: [음반 아이콘]  곡 제목  [🔊 ━━○━] [▶/⏸]
 * - 곡 제목은 YouTube oEmbed (https://www.youtube.com/oembed) 로 자동 조회 — CSP connect-src 에 추가됨
 * - 재생은 hidden iframe(0×0) + postMessage 로 제어 (의존성 0)
 * - 자동재생은 브라우저 정책상 막혀있어 사용자가 ▶ 한 번 눌러야 시작
 * - 볼륨은 localStorage 에 저장되어 새로고침·다른 페이지에서도 유지
 */

import { useEffect, useRef, useState } from "react";
import { Disc3, Pause, Play, Volume2, VolumeX } from "lucide-react";
import { extractYoutubeVideoId } from "@/lib/youtube";

const VOLUME_STORAGE_KEY = "mylink_bgm_volume";
const DEFAULT_VOLUME = 40;

interface Props {
  url: string;
}

export function MiniBgmPlayer({ url }: Props) {
  const videoId = extractYoutubeVideoId(url);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [playing, setPlaying] = useState(false);
  const [title, setTitle] = useState<string | null>(null);
  const [volume, setVolume] = useState<number>(DEFAULT_VOLUME);

  // localStorage 에서 저장된 볼륨 불러오기 (마운트 한 번만)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(VOLUME_STORAGE_KEY);
    if (stored == null) return;
    const v = parseInt(stored, 10);
    if (!Number.isNaN(v) && v >= 0 && v <= 100) setVolume(v);
  }, []);

  // volume state 변경 시 iframe 에 setVolume 전송
  useEffect(() => {
    iframeRef.current?.contentWindow?.postMessage(
      JSON.stringify({ event: "command", func: "setVolume", args: [volume] }),
      "*"
    );
  }, [volume]);

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseInt(e.target.value, 10);
    if (Number.isNaN(v)) return;
    setVolume(v);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(VOLUME_STORAGE_KEY, String(v));
    }
  };

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
      // origin 은 정확 매칭 — `.includes("youtube.com")` 패턴은 attacker-youtube.com 같은
      // 서브도메인 사칭에 취약. 현재 iframe src 는 www.youtube.com 뿐이지만 nocookie 도 같이 허용.
      if (e.origin !== "https://www.youtube.com" && e.origin !== "https://www.youtube-nocookie.com") return;
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
    // 첫 재생 직전에 현재 볼륨을 한번 더 보내서 player ready 이후 확실히 적용되게.
    if (!playing) {
      iframeRef.current?.contentWindow?.postMessage(
        JSON.stringify({ event: "command", func: "setVolume", args: [volume] }),
        "*"
      );
    }
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
          className="min-w-0 max-w-[150px] truncate text-[13px] text-foreground/80 sm:max-w-[220px]"
          title={title ?? "배경 음악"}
        >
          {title ?? "배경 음악"}
        </span>

        {/* 볼륨 */}
        <div className="flex shrink-0 items-center gap-1.5">
          {volume === 0 ? (
            <VolumeX size={14} strokeWidth={1.8} className="text-foreground/50" aria-hidden="true" />
          ) : (
            <Volume2 size={14} strokeWidth={1.8} className="text-foreground/70" aria-hidden="true" />
          )}
          <input
            type="range"
            min={0}
            max={100}
            value={volume}
            onChange={handleVolumeChange}
            aria-label="볼륨"
            className="h-1 w-14 cursor-pointer accent-foreground sm:w-20"
          />
        </div>

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

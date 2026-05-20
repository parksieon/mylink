"use client";

/**
 * 공개 프로필 페이지 우측 하단에 떠 있는 작은 BGM 플레이어.
 *
 * - hidden iframe(0x0)으로 YouTube 영상을 임베드하고 postMessage 로 재생/일시정지 제어
 * - 자동재생은 브라우저 정책상 막혀있어 사용자가 ▶ 버튼을 처음 눌러야 시작
 * - YouTube IFrame API JS 를 별도로 로드하지 않고 enablejsapi=1 + postMessage 만 사용 (의존성 0)
 */

import { useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";
import { extractYoutubeVideoId } from "@/lib/youtube";

interface Props {
  url: string;
}

export function MiniBgmPlayer({ url }: Props) {
  const videoId = extractYoutubeVideoId(url);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [playing, setPlaying] = useState(false);

  // YouTube iframe state 변화를 받아서 외부에서 다른 액션으로 멈춰도 동기화
  useEffect(() => {
    if (!videoId) return;
    const onMessage = (e: MessageEvent) => {
      if (typeof e.origin !== "string" || !e.origin.includes("youtube.com")) return;
      try {
        const data = typeof e.data === "string" ? JSON.parse(e.data) : e.data;
        if (data?.event === "onStateChange") {
          // YT.PlayerState: 1=PLAYING, 2=PAUSED, 0=ENDED
          if (data.info === 1) setPlaying(true);
          else if (data.info === 2 || data.info === 0) setPlaying(false);
        }
      } catch {
        // JSON 이 아닌 메시지(다른 iframe 등)는 무시
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [videoId]);

  if (!videoId) return null;

  const send = (func: "playVideo" | "pauseVideo") => {
    iframeRef.current?.contentWindow?.postMessage(
      JSON.stringify({ event: "command", func, args: [] }),
      "*"
    );
  };

  const toggle = () => {
    if (playing) {
      send("pauseVideo");
      setPlaying(false);
    } else {
      send("playVideo");
      setPlaying(true);
    }
  };

  // loop 시키려면 playlist 파라미터에 같은 videoId 한 번 더 지정해야 함 (YouTube 공식 트릭)
  const src =
    `https://www.youtube.com/embed/${videoId}` +
    `?enablejsapi=1&loop=1&playlist=${videoId}&controls=0&modestbranding=1&playsinline=1&rel=0`;

  return (
    <>
      <iframe
        ref={iframeRef}
        src={src}
        // 0×0 으로 화면에서 사라지게 — 음악만 재생
        width={0}
        height={0}
        allow="autoplay; encrypted-media"
        style={{ position: "absolute", width: 0, height: 0, border: 0 }}
        title="배경 음악"
        aria-hidden="true"
      />
      <button
        type="button"
        onClick={toggle}
        aria-label={playing ? "BGM 일시정지" : "BGM 재생"}
        title={playing ? "BGM 일시정지" : "BGM 재생"}
        className="fixed bottom-4 right-4 z-50 flex h-11 w-11 items-center justify-center rounded-full bg-foreground text-background shadow-lg ring-1 ring-border/30 transition-all hover:scale-105 hover:shadow-xl active:scale-95"
      >
        {playing ? <Pause size={18} strokeWidth={2.2} /> : <Play size={18} strokeWidth={2.2} className="translate-x-[1px]" />}
      </button>
    </>
  );
}

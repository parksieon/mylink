/**
 * YouTube URL 헬퍼.
 *
 * - extractYoutubeVideoId: 다양한 YouTube URL 형태(watch, youtu.be, embed, shorts) 또는
 *   순수 11자 videoId 를 받아서 videoId 만 추출. 인식 실패 시 null.
 * - isValidYoutubeUrl: 입력값이 추출 가능한 YouTube URL/ID 인지 boolean.
 */

const VIDEO_ID_REGEX = /^[A-Za-z0-9_-]{11}$/;

export function extractYoutubeVideoId(input: unknown): string | null {
  if (typeof input !== "string") return null;
  const trimmed = input.trim();
  if (!trimmed) return null;

  // 순수 11자 videoId 직접 입력
  if (VIDEO_ID_REGEX.test(trimmed)) return trimmed;

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return null;
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;

  const host = parsed.hostname.replace(/^www\.|^m\./, "").toLowerCase();

  // youtu.be/VIDEO_ID
  if (host === "youtu.be") {
    const id = parsed.pathname.split("/").filter(Boolean)[0];
    return id && VIDEO_ID_REGEX.test(id) ? id : null;
  }

  // youtube.com / music.youtube.com 의 여러 패턴
  if (host === "youtube.com" || host === "music.youtube.com") {
    // /watch?v=VIDEO_ID
    const v = parsed.searchParams.get("v");
    if (v && VIDEO_ID_REGEX.test(v)) return v;

    // /embed/VIDEO_ID, /shorts/VIDEO_ID, /v/VIDEO_ID, /live/VIDEO_ID
    const segments = parsed.pathname.split("/").filter(Boolean);
    if (
      segments.length >= 2 &&
      ["embed", "shorts", "v", "live"].includes(segments[0])
    ) {
      const id = segments[1];
      return VIDEO_ID_REGEX.test(id) ? id : null;
    }
  }

  return null;
}

export function isValidYoutubeUrl(input: unknown): input is string {
  return extractYoutubeVideoId(input) !== null;
}

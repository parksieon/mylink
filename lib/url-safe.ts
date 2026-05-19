/**
 * URL 검증 헬퍼.
 *
 * 모든 사용자가 입력·저장하는 URL은 화면에 그려지거나 navigation에 쓰이기 전에
 * 반드시 이 함수들을 한 번 통과시킬 것.
 *
 * - isSafeHttpUrl: 외부 링크용 — http / https 만 허용 (javascript:, data:, vbscript: 차단)
 * - isFirebaseStorageUrl: 업로드 파일 미리보기용 — Firebase Storage 호스트만 허용
 */

export function isSafeHttpUrl(value: unknown): value is string {
  if (typeof value !== "string" || value.length === 0) return false;
  try {
    const u = new URL(value);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

export function isFirebaseStorageUrl(value: unknown): value is string {
  if (typeof value !== "string" || value.length === 0) return false;
  try {
    const u = new URL(value);
    return (
      u.protocol === "https:" &&
      u.hostname === "firebasestorage.googleapis.com"
    );
  } catch {
    return false;
  }
}

export function isSafeImageUrl(value: unknown): value is string {
  if (typeof value !== "string" || value.length === 0) return false;
  try {
    const u = new URL(value);
    if (u.protocol !== "https:") return false;
    return (
      u.hostname === "firebasestorage.googleapis.com" ||
      u.hostname === "lh3.googleusercontent.com"
    );
  } catch {
    return false;
  }
}

# Cloudflare Cron — TimeFilm 취소표 모니터

Vercel Hobby 플랜은 분 단위 cron 을 막아두기 때문에, **매분 트리거 역할만** 분리해서 Cloudflare Workers 무료 티어로 돌립니다.
실제 폴링/FCM 발송 로직은 전부 Vercel 의 `/api/cron/poll` 라우트가 처리합니다 — 이 Worker 는 그냥 fetch 한 번 날리는 알람시계.

## 한 번만 설정

```bash
# 1. wrangler CLI 설치 (없으면)
npm i -g wrangler

# 2. Cloudflare 계정 로그인
wrangler login

# 3. wrangler.toml 의 VERCEL_URL 을 본인 도메인으로 수정
#    예: "https://timefilm.vercel.app" 또는 커스텀 도메인

# 4. CRON_SECRET 등록 (Vercel 환경변수와 같은 값)
cd cloudflare-cron
wrangler secret put CRON_SECRET
# → 프롬프트가 뜨면 시크릿 값 붙여넣기

# 5. 배포
wrangler deploy
```

## 동작 확인

```bash
wrangler tail
# 1분 안에 다음 같은 로그가 떠야 함:
#   poll status=200 ms=XXX body={"polled":N,"notified":0,...}
```

## 무료 티어 한도

Cloudflare Workers 무료 플랜:
- 하루 100,000 요청 — 1분마다 호출하면 일 1,440회 → 1.4% 사용. 여유 100배.
- Cron 트리거 자체 무제한

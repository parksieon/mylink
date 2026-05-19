# 취소표 모니터 모듈 — 셋업 체크리스트

`/tickets` 모듈을 라이브로 띄우기 위해 박시언님이 직접 해야 하는 작업들.
파일 단의 코드 작업은 이미 완료됨 — 아래는 외부 콘솔/CLI 작업만.

---

## 1. 패키지 설치

```bash
npm install
```

`package.json` 에 `firebase-admin` 이 추가됨 — 그 한 줄 때문에 필요.

---

## 2. Firebase 콘솔 설정

### 2-1. Cloud Messaging 활성 + VAPID 키 생성
1. https://console.firebase.google.com/ → 프로젝트 선택
2. ⚙ Project Settings → **Cloud Messaging** 탭
3. **Web Push certificates** 섹션 → "Generate key pair"
4. 생성된 키 페어의 public key 복사 → `NEXT_PUBLIC_FIREBASE_VAPID_KEY` 값으로 사용

### 2-2. 서비스 계정 JSON 생성
1. ⚙ Project Settings → **Service accounts** 탭
2. "Generate new private key" 클릭 → JSON 다운로드
3. JSON 전체를 **한 줄로 압축**해서 `FIREBASE_SERVICE_ACCOUNT_KEY` 환경변수에 저장
   (또는 base64 인코딩 후 저장 — `admin.ts` 는 양쪽 다 지원)

---

## 3. 환경변수 (Vercel)

기존에 있던 것 외에 추가로 필요:

| Key | 값 | 비고 |
|---|---|---|
| `NEXT_PUBLIC_FIREBASE_VAPID_KEY` | 2-1 에서 받은 public key | FCM 토큰 발급용 |
| `FIREBASE_SERVICE_ACCOUNT_KEY` | 2-2 JSON 전체 (한 줄) | Admin SDK |
| `CRON_SECRET` | 본인이 정한 임의 문자열 | Worker → Vercel 인증 |

Vercel Dashboard → Project → Settings → Environment Variables 에서 추가.
`NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` 는 이미 있을 가능성이 큼 — 없으면 같이 추가.

---

## 4. Service Worker config 하드코딩

`public/firebase-messaging-sw.js` 의 `firebase.initializeApp({...})` 안의 `REPLACE_*` 자리를
본인 Firebase 프로젝트 값으로 **실제 문자열 하드코딩**.

```js
firebase.initializeApp({
  apiKey: '...',           // NEXT_PUBLIC_FIREBASE_API_KEY 와 같은 값
  authDomain: '...',
  projectId: '...',
  messagingSenderId: '...',
  appId: '...',
});
```

이 파일은 service worker 라 `process.env` 를 못 읽음 — 하드코딩 필수.
(public Web API key 라 git 에 들어가도 보안 문제 없음.)

---

## 5. Firestore Rules 배포

Firebase 콘솔 → Firestore → Rules 탭 → 현재 워크트리의 `firestore.rules` 내용 복붙 → Publish.

(rules 파일에 `/venues`, `/concerts` 블록이 새로 추가됨. 기존 보안 패치 다 보존됨.)

---

## 6. Cloudflare Workers Cron 배포

자세한 절차는 [cloudflare-cron/README.md](cloudflare-cron/README.md) 참고.

요약:
```bash
npm i -g wrangler
wrangler login
cd cloudflare-cron
# wrangler.toml 의 VERCEL_URL 본인 도메인으로 수정
wrangler secret put CRON_SECRET   # Vercel 의 CRON_SECRET 과 같은 값
wrangler deploy
```

---

## 7. 동작 확인 (end-to-end)

1. `https://<your-domain>/tickets` 접속 → Google 로그인
2. "🔔 알림 받기" 버튼 → 브라우저 권한 허용 → "✓ 푸시 알림 활성화됨" 뜨는지
3. "+ 공연 추가" → Interpark 공연 URL 붙여넣기 → 블록 자동 분석 (1-2초) → "모니터링 시작"
4. `https://dash.cloudflare.com/` → Workers → `timefilm-ticket-cron` → Logs (또는 `wrangler tail`) → 1분 안에 `poll status=200` 로그
5. Firebase 콘솔 → Firestore → `concerts/{goodsCode}/state/blockAvail` 한 블록 값 임의로 감소 → 1분 이내 푸시 알림 도착
6. 사이트 탭 닫고 같은 조작 → service worker 경유 OS 알림 뜨는지

---

## 8. iOS Safari 모바일 주의

푸시는 **PWA 홈화면 설치(iOS 16.4+)** 후에만 동작.
Android Chrome / 데스크탑은 그냥 됨.

---

## 알려진 한계

- 같은 `goodsCode` 가 이미 누가 등록했다면, 새 공연이 만들어지지 않고 본인이 구독자로 추가됨 (원래 의도).
- 첫 폴링은 알림 없이 상태만 기록 (폭주 방지).
- 다회차 공연은 "공연 추가" 모달의 "고급" 에서 `playSeq` 변경 (기본 001).

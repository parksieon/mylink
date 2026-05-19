# TimeFilm — 박시언의 콘텐츠 트리 페이지

> ⚠ **학습 목적 공개** — 본 저장소의 무단 배포·복제·재사용은 금지됩니다. 자세한 내용은 [LICENSE](./LICENSE) 참고.

폴더와 다양한 자료(문서·외부링크·HTML 시뮬레이션·3D 모델·PDF)를 트리 구조로 꾸미는 개인 페이지 플랫폼.
Google 계정으로 로그인해 본인만의 공개 URL(`/내_username`)을 만들고,
배경 이미지·카드 아이콘·색상으로 개성 있게 꾸밀 수 있어요.

🔗 **Live Demo**: [https://mylink-nine.vercel.app](https://mylink-nine.vercel.app)

---

## 주요 기능

- **Google 소셜 로그인** — Firebase Authentication, 본인만의 데이터 공간
- **링크 CRUD** — 실시간 동기화 (`onSnapshot`), 새로고침해도 유지
- **공개 페이지 (`/[username]`)** — 누구나 접속 가능, 로그인 불필요
- **링크 클릭 통계** — 클릭할 때마다 카운트 자동 증가, `/mypage`에서 합계·링크별 확인
- **OG 이미지 자동 생성** — 카톡/디스코드/SNS 공유 시 미리보기 카드 표시
- **반응형 디자인** — 모바일/태블릿/데스크탑

## 기술 스택

| 영역 | 기술 |
|---|---|
| Framework | Next.js 16 (App Router) + React 19 + TypeScript |
| Styling | Tailwind CSS v4 + shadcn/ui |
| Backend | Firebase Authentication, Cloud Firestore |
| Deployment | Vercel (자동 배포 — `main` 브랜치 푸쉬 시) |
| Icon | lucide-react |

## 데이터 구조 (Firestore)

```
users/{uid}                       ← 사용자 프로필 (누구나 읽기, 본인만 쓰기)
  ├─ displayName, photoURL, username
  └─ links/{linkId}               ← 링크 (본인만 수정, clickCount는 누구나 +1)
       ├─ title, url, iconName
       ├─ createdAt
       └─ clickCount

usernames/{username}              ← username → uid 매핑 (중복 방지용)
  └─ uid
```

## 보안 규칙 요약

- 모든 컬렉션은 **누구나 읽기 가능** (공개 페이지를 위해)
- 사용자 프로필·링크 **쓰기는 본인만** 가능
- `clickCount` 필드만은 **누구나 단조 증가** 가능 (익명 클릭 추적용)
- `usernames`는 본인 uid를 가진 문서만 생성/삭제 가능

전체 규칙은 Firebase 콘솔의 Firestore Rules 탭 참조.

## 로컬 실행

### 1. 의존성 설치
```bash
npm install
```

### 2. Firebase 환경변수 설정

`.env.local` 파일을 프로젝트 루트에 만들고 Firebase 프로젝트 설정값을 입력:

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
```

값은 Firebase 콘솔 → 프로젝트 설정 → 내 앱 → SDK 설정에서 확인.

### 3. 개발 서버 실행
```bash
npm run dev
```

[http://localhost:3000](http://localhost:3000) 접속.

## 프로젝트 구조

```
app/
  ├─ layout.tsx              # 루트 레이아웃 (AuthProvider, LinkProvider)
  ├─ page.tsx                # 홈 — 본인 프로필/링크
  ├─ mypage/page.tsx         # 링크 관리 + username 설정 + 클릭 통계
  ├─ [username]/page.tsx     # 공개 페이지 (동적 라우팅)
  ├─ learning-notes/         # 학습 정리
  └─ opengraph-image.tsx     # OG 이미지 생성

context/
  ├─ auth-context.tsx        # Firebase Auth 상태 + signIn/signOut
  └─ link-context.tsx        # Firestore 실시간 링크 구독

lib/
  ├─ firebase.ts             # Firebase 초기화 (Auth + Firestore)
  ├─ user.ts                 # username·프로필·클릭 통계 헬퍼
  └─ icon-map.ts             # iconName 문자열 ↔ Lucide 아이콘 매핑

components/
  ├─ nav-user-menu.tsx       # 네비게이션 로그인/로그아웃 UI
  └─ ui/                     # shadcn/ui 컴포넌트
```

## 빌드 & 배포

`main` 브랜치에 푸쉬하면 Vercel이 자동으로 빌드·배포합니다.
환경변수는 Vercel 대시보드 → Settings → Environment Variables에 동일하게 등록되어 있습니다.

## 라이선스

학습 목적 프로젝트입니다.

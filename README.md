# TimeFilm — 박시언의 콘텐츠 트리 페이지

> ⚠ **학습 목적 공개** — 본 저장소의 무단 배포·복제·재사용은 금지됩니다. 자세한 내용은 [LICENSE](./LICENSE) 참고.

폴더와 다양한 자료(문서·외부링크·HTML 시뮬레이션·3D 모델·PDF)를 트리 구조로 꾸미는 개인 페이지 플랫폼.
Google 계정으로 로그인해 본인만의 공개 URL(`/내_username`)을 만들고,
배경 이미지·카드 아이콘·색상으로 개성 있게 꾸밀 수 있어요.

🔗 **Live Demo**: [https://timefilm.vercel.app](https://timefilm.vercel.app)

---

## 주요 기능

- **Google 소셜 로그인** — Firebase Authentication, 본인만의 데이터 공간
- **통합 트리 워크스페이스** — 폴더 안에 6종 자료 자유 조합 (폴더/문서/외부링크/HTML 시뮬레이션/3D 모델/PDF)
- **노션 스타일 문서 에디터 (TipTap)** — WYSIWYG로 글·이미지·YouTube 임베드·링크 작성
- **HTML 시뮬레이션 임베드** — `.html` 업로드 시 sandbox iframe에서 실행 (Three.js 등 자유 활용)
- **3D 모델 뷰어** — `.glb`/`.gltf` 업로드 시 마우스로 회전·확대
- **카드 꾸미기** — 폴더 배경 이미지, 각 카드의 아이콘·색상 커스터마이즈
- **공개 페이지 (`/[username]`)** — 누구나 접속 가능, 폴더별 공개/비공개 토글
- **외부 링크 클릭 통계** — 익명 클릭도 카운트
- **반응형 디자인** — 모바일/태블릿/데스크탑

## 기술 스택

| 영역 | 기술 |
|---|---|
| Framework | Next.js 16 (App Router) + React 19 + TypeScript |
| Styling | Tailwind CSS v4 + shadcn/ui |
| Editor | TipTap (Image, Link, YouTube 확장) |
| 3D | Three.js + @react-three/fiber + @react-three/drei |
| Backend | Firebase Authentication, Cloud Firestore, Cloud Storage |
| Deployment | Vercel (자동 배포 — `main` 브랜치 푸쉬 시) |
| Icon | lucide-react |

## 데이터 구조 (Firestore)

```
users/{uid}                          ← 사용자 프로필 (누구나 읽기, 본인만 쓰기)
  ├─ displayName, photoURL, username, bio
  ├─ quotaBytes, usedBytes            ← 콘솔에서 수동 조정
  └─ nodes/{nodeId}                   ← 통합 트리 (folder/article/link/html/3d/pdf)
       ├─ kind, name, parentId, ancestorIds, path
       ├─ depth, order
       ├─ visibility, effectiveVisibility
       ├─ iconName, cardColor          ← 카드 꾸미기
       ├─ bgImageURL, bgImagePath      ← 폴더 배경
       ├─ content                       ← article: TipTap JSON
       ├─ url, clickCount               ← link
       └─ fileURL, filePath, fileSize   ← html / 3d / pdf

usernames/{username}                  ← username → uid 매핑 (중복 방지)
  └─ uid
```

Storage 경로: `users/{uid}/files/{nodeId}/{file=**}` — leaf 자료·article 임베드 이미지·폴더 배경 모두 통합.

## 보안 규칙 요약

- `users/{uid}` 프로필·`usernames`·`nodes` 컬렉션 모두 **누구나 읽기 가능** (공개 페이지)
- 노드 생성은 본인만, depth 0~3 검사
- 노드 수정도 본인만 — 단, **익명 사용자는 외부 링크 노드의 `clickCount`만 +1 가능**
- `usernames`는 본인 uid 매칭 시에만 생성/삭제 (스쿼팅 방지)
- `quotaBytes`는 콘솔(Admin SDK)에서만 수정 가능, 클라이언트는 불가
- Storage는 본인만 100MB 이하 업로드, 모든 사용자 읽기 가능

전체 규칙은 `firestore.rules` / `storage.rules` 파일 참조 — Firebase 콘솔에 직접 붙여넣고 Publish.

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
  ├─ layout.tsx               # 루트 레이아웃 (AuthProvider + nav)
  ├─ page.tsx                 # 홈 — 로그인 후 대시보드 카드
  ├─ profile/page.tsx         # username + 소개글 설정
  ├─ mypage/                  # 워크스페이스 (트리 + kind별 에디터)
  │   ├─ layout.tsx           # NodesProvider 래퍼
  │   ├─ page.tsx             # 2열 레이아웃 (Tree + NodeEditor)
  │   └─ _components/         # Tree, CreateNodeDialog, editors/*
  ├─ [username]/              # 공개 페이지 (클라이언트 렌더링)
  │   ├─ page.tsx             # 프로필 헤더 + 루트 카드
  │   └─ [...path]/page.tsx   # 폴더 인덱스 / leaf 풀스크린
  └─ opengraph-image.tsx      # OG 이미지 생성

context/
  ├─ auth-context.tsx         # Firebase Auth 상태
  └─ nodes-context.tsx        # 통합 트리(nodes) 실시간 구독 + CRUD

lib/
  ├─ firebase.ts              # Firebase 초기화 (long-polling 강제)
  ├─ nodes.ts                 # 트리 CRUD·visibility 전파·이동·청소
  ├─ assets.ts                # Storage 업로드/삭제, 노드 prefix 청소
  ├─ user.ts                  # 프로필·username·bio 헬퍼
  ├─ quota.ts                 # 사용량/한도 계산
  ├─ icon-map.ts              # 카드 아이콘 매핑
  └─ card-colors.ts           # 카드 색상 프리셋

components/
  ├─ NodeCard.tsx             # 공개 페이지 카드
  ├─ PublicFolderView.tsx     # 공개 폴더 인덱스
  ├─ LeafView.tsx             # 공개 leaf 풀스크린
  ├─ IconPicker, ColorPicker  # 카드 꾸미기
  ├─ confirm-dialog, notes/MoveDialog
  ├─ viewers/                 # ArticleViewer(TipTap), Html/3D/PDF
  └─ ui/                      # shadcn/ui 컴포넌트
```


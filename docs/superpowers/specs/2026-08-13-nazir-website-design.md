# 〈나지르〉 웹사이트 — 설계 문서

- 작성일: 2026-08-13
- 상태: 승인됨 (구현 계획 단계로 진행 예정)
- 원본 시안: `나지르.dc.html` (디자인 툴 export, `DCLogic`/`sc-if`/`sc-for` 자체 포맷)

## 1. 목적 · 범위

창작 뮤지컬 〈나지르〉(제작 PRAYSOUND)의 소개·후원 안내 웹사이트를 만든다.
기존 HTML 시안을 **React + TypeScript 반응형 웹**으로 이식하고, 클라이언트가 코드를
건드리지 않고 **콘텐츠(텍스트·사진)를 직접 관리**할 수 있는 관리자 기능을 붙인다.

### 우선순위
1. 시안을 React 반응형 웹으로 이식 (최우선)
2. 콘텐츠를 Supabase로 이관
3. 관리자 편집 기능(텍스트 + 사진 업로드)

### 이번 범위에 포함
- 공개 소개 사이트(홈 / 대하여 / 무대에 오르기까지 / 함께하기)
- 대부분의 콘텐츠를 관리자가 편집 가능(인사말·시놉시스·인물·일정·예산·기도제목·명단·날짜·계좌·링크)
- 관리자가 인물/팀/연출자 사진 업로드·교체
- 관리자 로그인(이메일+비밀번호)

### 이번 범위에서 제외 (YAGNI)
- 네이티브 앱(React Native) — 반응형 웹으로 충분
- 방문자 회원가입/로그인 — 관리자 계정만 존재
- 사이트 내 후원 결제/폼 접수 — 기존 외부 링크(Google Forms, joey.team) 유지
- 다국어 — 한국어 단일
- PWA/오프라인 — 필요 시 추후

## 2. 기술 스택

| 영역 | 선택 |
|------|------|
| 빌드 | Vite |
| 언어 | TypeScript |
| UI | React |
| 스타일 | Tailwind CSS (시안의 색·폰트·여백을 Tailwind 테마 토큰으로 이관) |
| 라우팅 | React Router |
| 백엔드 | Supabase (Postgres · Auth · Storage) |
| 테스트 | Vitest + React Testing Library |

시안의 디자인 토큰을 Tailwind `theme.extend`로 옮긴다:
- 색: `stage #0B0A0E`, `velvet #17131F`, `gold #E9B949`, `gold-deep #8A6F2E`, `paper #F2EADA`, `ink #1A1712`
- 폰트: Display `Gowun Batang`, Body `IBM Plex Sans KR`, Data/Mono `IBM Plex Mono`
- 반응형은 시안대로 `clamp()`와 `auto-fit` 그리드를 유지(미디어쿼리 최소화), 모바일 우선

## 3. 라우팅 · 페이지

시안은 한 페이지 안에서 상태로 화면을 전환하지만, **실제 URL 라우팅**으로 바꿔
링크 공유·뒤로가기·SEO를 확보한다.

### 공개
- `/` — 홈: 성구, 타이틀(나지르/구별된 사람들), 제작 정보, 3개 섹션 진입 카드
- `/about` — 대하여: 연출 인사말, Praysound 이야기, 작품 개요, 로그라인·시놉시스, 주요 등장인물
- `/process` — 무대에 오르기까지: 함께 세우는 사람들(그룹 아코디언), 제작 예산
- `/join` — 함께하기: 후원 안내(외부 폼 링크 + 계좌 원터치 복사), 기도제목, Q&A 외부 링크

### 관리자
- `/admin/login` — 로그인
- `/admin` — 섹션별 편집 대시보드 (인증 필요, 미인증 시 로그인으로 리다이렉트)

### 유지할 인터랙션
- 커튼 오프닝 애니메이션(최초 진입)
- 홈 스포트라이트 `pointermove` 효과
- 계좌번호 원터치 복사(복사 완료 라벨 토글)
- `prefers-reduced-motion` 존중(모든 애니메이션 정지)

## 4. 데이터 모델 (Supabase)

반복 목록은 구조화 테이블, 단일 문구·설정·링크는 키-값 테이블로 관리한다.

### `content_blocks`
| 컬럼 | 타입 | 비고 |
|------|------|------|
| `key` | text (PK) | 예: `about.greeting`, `about.synopsis`, `hero.date`, `join.account_number`, `join.support_form_url` |
| `value` | text | 문구/URL 값 |
| `updated_at` | timestamptz | |

담는 값 예시: 인사말, Praysound 이야기, 작품 개요 항목, 로그라인, 시놉시스,
공연 날짜, 제작 정보, 계좌번호·예금주, 후원폼/Q&A/SNS 링크, 예산 총액, 기도 안내문.

### `characters`
`id (uuid pk)`, `name text`, `description text`, `photo_url text null`, `sort_order int`, `updated_at`

### `timeline_events`
`id`, `period text`, `title text`, `status text` (`완료`/`진행 중`/`예정`), `sort_order int`, `updated_at`

### `budget_items`
`id`, `name text`, `sort_order int`, `updated_at`

### `prayers`
`id`, `text text`, `sort_order int`, `updated_at`

### `people_groups`
`id`, `label text` (헤더진/팀원/배우), `sort_order int`

### `people_members`
`id`, `group_id (fk → people_groups)`, `text text`, `sort_order int`

### Storage
- 버킷 `images` (공개 읽기) — 인물·팀·연출자 사진
- 파일 경로 규칙 예: `characters/{id}.jpg`, `site/team.jpg`, `site/director.jpg`

### RLS 정책
- 모든 콘텐츠 테이블·Storage 버킷: **공개 읽기(anon select) 허용**
- **쓰기(insert/update/delete)는 인증된 사용자만** — 관리자 계정만 존재하므로 사실상 관리자 전용

## 5. 관리자 화면

- 인증: Supabase Auth **이메일 + 비밀번호**. 관리자 계정은 시드로 생성해 클라이언트에 전달(공개 가입 없음)
- 대시보드 구성은 공개 사이트 섹션과 1:1 대응:
  - 단일 문구(`content_blocks`) → 폼 필드로 수정
  - 목록(인물·일정·예산·기도제목·명단) → 행 추가 / 수정 / 삭제 / 순서 변경
  - 사진 → 파일 업로드로 교체(→ Storage 저장 후 해당 레코드 `photo_url` 갱신)
- 저장 시 낙관적/명시적 피드백, 유효성 검사(빈 값·URL 형식 등)

## 6. 단계별 진행

각 단계는 그 자체로 배포 가능한 상태를 목표로 한다.

### 1단계 — React 이식 (최우선)
- Vite + React + TS + Tailwind 프로젝트 스캐폴딩, 디자인 토큰 이관
- 4개 공개 페이지 + 공통 레이아웃(헤더/푸터) 구현, 인터랙션 이식
- **모든 문구를 `src/content/*.ts` 타입 데이터로 분리** — 미래 DB 스키마와 동일한 모양
- 이 상태로 완성·배포 가능(백엔드 없이 정적으로 동작)

### 2단계 — Supabase 콘텐츠 이관
- 테이블·RLS·Storage 버킷 생성(마이그레이션)
- 1단계의 `src/content/*.ts` 값을 시드로 이관
- 데이터 접근 계층(`src/lib/`)을 통해 화면이 Supabase에서 읽도록 교체
- 로딩/빈값/에러 상태 처리

### 3단계 — 관리자 기능
- Supabase Auth 로그인, 보호 라우트
- 섹션별 편집 UI(단일 문구/목록/사진 업로드)
- 관리자 시드 계정 생성

## 7. 아키텍처 · 모듈 경계

- `src/content/` — 타입 정의 + 1단계 초기 데이터(2단계에서 시드로 사용)
- `src/lib/supabase.ts` — 클라이언트, `src/lib/content.ts` — 콘텐츠 read/write 함수(화면은 이 계층만 의존)
- `src/components/` — 공통 UI(헤더, 푸터, 카드, 상태칩, 아코디언 등)
- `src/pages/` — 공개 페이지 4종
- `src/admin/` — 관리자 화면
- 화면 컴포넌트는 데이터 출처(로컬 or Supabase)를 모르고, 데이터 계층 인터페이스에만 의존 → 1→2단계 전환 시 화면 코드 변경 최소화

## 8. 테스트 · 에러 처리

- Vitest + React Testing Library: 공개 페이지 렌더, 콘텐츠 매핑, 관리자 폼 로직
- 데이터 로딩 실패 시 사용자 친화적 폴백/에러 표시
- 관리자 폼 유효성 검사(필수값, URL·계좌 형식)
- `prefers-reduced-motion` 대응 확인

## 9. 알려진 제약 · 후속 과제

- 현재 세션에서 **Supabase MCP가 인증되지 않음** → 실제 프로젝트 자동 생성/DB 조작 불가.
  코드·스키마·마이그레이션은 모두 작성 가능하며, 실제 연결은 사용자가 인증 후 진행.
- 사진 최적화(리사이즈/포맷), 배포 파이프라인, 도메인 연결은 별도 후속 과제.

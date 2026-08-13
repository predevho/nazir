# 〈나지르〉 Phase 3B-4 — 약력 마크다운 설계 문서

- 작성일: 2026-08-14
- 상태: 승인됨 (구현 계획 단계로 진행)
- 선행: Phase 3B-3b(참여자 편집) 완료 · `main` @ 87ef603
- 관련: 3B-3 설계

## 1. 목적 · 범위

약력/설명에 경력 리스트 등 긴 서식 텍스트가 들어가므로, **참여자(제작진) 약력**과
**주요 등장인물 설명**을 **마크다운**으로 작성·표시하고, 관리자 입력칸을 넓힌다.

### 포함
- 마크다운 렌더 컴포넌트(`react-markdown` + `remark-gfm`)
- 공개 표시: `/process` 참여자 약력(bio), `/about` 등장인물 설명(description)을 마크다운으로
- 관리자 입력칸 확대: PeopleEditor 약력 textarea, characters 편집기의 설명 textarea + "마크다운 지원" 안내
- 참여자 카드 폭을 약력이 편히 들어가게 조정

### 제외
- 사진 업로드(3C)
- 다른 단일 문구·목록의 마크다운화(현 요청 범위 아님)

## 2. 마크다운 렌더

- `components/MarkdownText.tsx` — `react-markdown`을 감싼 서버 호환 컴포넌트. `remark-gfm`으로 GFM(리스트·표·취소선·자동링크). 빈 문자열이면 `null`.
- 스타일: Tailwind 자식 선택자(`[&_ul]:list-disc` 등)로 리스트·문단·강조·링크 스타일링(다크 테마 톤).
- 보안: react-markdown 기본값(raw HTML 미허용). 작성자는 로그인 관리자(신뢰).

## 3. 공개 표시

- `/process` 참여자 카드: `member.bio`를 `<MarkdownText>`로 렌더(불릿 경력 등). 카드 폭을 넓혀 약력 공간 확보.
- `/about` 등장인물 카드: `character.description`을 `<MarkdownText>`로 렌더.

## 4. 관리자 입력

- **PeopleEditor**: 약력 textarea를 여러 줄·전체 폭으로 확대 + placeholder/안내("마크다운 지원").
- **목록 편집기(ListEditor)**: 컬럼 설정(`ListColumn`)에 `markdown?: boolean` 추가. `characters.description`을 `markdown: true`로 지정 → 편집기에서 그 컬럼은 큰 textarea + "마크다운 지원" 안내.

## 5. 테스트

- `MarkdownText`: `- 항목` 마크다운이 리스트로, `**굵게**`가 strong으로 렌더.
- 공개 페이지 회귀: `/process`·`/about` 기존 테스트 유지(약력·설명이 비어 있어도 정상, 마크다운 렌더 후에도 이름·시놉시스 등 단언 유지).

## 6. 유의

- `react-markdown` v9는 ESM. Next 16에서 정상 처리되어야 함(빌드 확인). 문제 시 `next.config`의 처리 확인.
- 서버 컴포넌트에서 렌더(클라이언트 JS 추가 없음).
- 커밋 메시지 한글 + 타입 접두사.

## 7. 진행 순서 요약

1. `react-markdown`+`remark-gfm` 설치 + `MarkdownText` + 테스트
2. 공개 표시 적용(/process bio, /about description)
3. 관리자 입력칸 확대(PeopleEditor 약력, ListEditor markdown 컬럼 + `adminLists` 갱신)
4. 검증 + README

### 후속
- **Phase 3C** — 사진 업로드(characters·people_members photo_url).

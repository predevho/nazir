# 응원 게시판 제작팀 하트 + 소개 문단 고딕 폰트 — 설계

작성일 2026-09-11. 클라이언트(빛/One Step) 답변으로 대기 항목 두 가지가 확정됐다.

- "응원 쪽지 하트는 제작팀용" → 운영진이 켜고 끄는 하트. 방문자 좋아요 없음.
  `docs/decisions.md` C-3 의 권장안 그대로.
- "제목 아래 부분은 AppleSDGothicNeo, 제목과 나머지 본문은 빛의계승자" →
  페이지 제목 바로 아래 소개 문단만 고딕. 피그마의 해당 노드는 `AppleSDGothicNeoUL00`(UltraLight).

둘은 서로 독립이다. 하나의 브랜치에서 작업하되 커밋은 나눈다.

---

## 1. 제작팀 하트

### 데이터

`0014_guestbook_heart.sql` — `guestbook_entries` 에 `is_hearted boolean not null default false`.
기존 `auth all` 정책(0009)이 authenticated 의 update 를 이미 허용하므로 정책 추가는 없다.
anon 은 `public read` 로 읽기만 한다. 재실행 안전(`add column if not exists`).

`lib/guestbook.ts` 의 `GuestbookEntry` 에 `isHearted: boolean` 추가.
공개 페이지 조회(`app/(site)/guestbook/page.tsx`)와 어드민 조회(`app/admin/guestbook/page.tsx`)의
select 에 `is_hearted` 를 넣는다.

### 어드민 — `/admin/guestbook`

- `ModerateOp` 에 `heart` / `unheart` 를 더한다. `moderateEntry` 는 `is_hearted` 를 갱신하고
  기존처럼 `/guestbook` `/admin/guestbook` 을 revalidate 한다.
- 완료 메시지: `heart` → "하트를 보냈습니다. 쪽지에 제작팀 하트가 붙습니다." /
  `unheart` → "하트를 거뒀습니다."
- `GuestbookAdmin.tsx` 의 버튼 줄에 `하트 보내기` / `하트 거두기` 버튼을 숨기기 버튼 옆에 둔다.
  같은 `formAction` 폼 패턴(`display: contents`). 하트가 켜진 글은 이름 옆에 `♥ 하트` 배지.
- 숨긴 글에도 하트는 켤 수 있다(숨김을 풀면 바로 보이도록). 막을 이유가 없다.

### 공개 쪽지 — `components/guestbook/GuestbookNote.tsx`

- 하단 왼쪽, 댓글 아이콘 자리에 하트를 붙인다. 순서는 **댓글 아이콘 → 하트**. 둘 다 없으면 지금처럼 빈 span.
- 하트 = `HeartIcon`(새 컴포넌트, `CommentIcon` 과 같은 방식의 인라인 SVG, `currentColor`) +
  `제작팀` 글자(그리운 고씨네 14px). 색은 `ds-key2`(노랑). 크기는 댓글 아이콘과 같은 21px.
- 눌리는 요소가 아니다. `<span>` 에 `aria-label="제작팀의 하트"` 만 준다.
- 하트 켜진 글이 정렬 순서를 바꾸지 않는다(최신순 그대로).

### 테스트

- `actions.test.ts`: `heart` → `update({ is_held ... })` 가 아니라 `update({ is_hearted: true })`,
  `unheart` → `false`. 알 수 없는 op 는 여전히 거부.
- `GuestbookNote.test.tsx`: `isHearted: true` 면 "제작팀의 하트" 가 보이고, `false` 면 없다.
  답글과 하트가 같이 있을 때 둘 다 렌더.
- `GuestbookAdmin.test.tsx`: 버튼 라벨이 상태에 따라 `하트 보내기` / `하트 거두기`.

---

## 2. 소개 문단 고딕 폰트

### 폰트 정의

`app/globals.css` 에 `@font-face` 하나:

```
font-family: 'Nazir Sans'; font-weight: 200; font-display: swap;
src: local('AppleSDGothicNeo-UltraLight'), local('Apple SD Gothic Neo UltraLight'),
     url('/fonts/Pretendard-ExtraLight.woff2') format('woff2');
```

- 애플 기기는 내장 Apple SD Gothic Neo UltraLight 를 쓰므로 다운로드가 없다.
- 그 외 기기는 `public/fonts/Pretendard-ExtraLight.woff2`(717KB, SIL OFL)를 받는다.
  자체 호스팅·영구 캐시는 기존 폰트와 같은 규약(`next.config.ts` `/fonts/*`).
- Tailwind `fontFamily.sans-desc` 대신 이름을 짧게 `desc` 로 둔다:
  `desc: ["'Nazir Sans'", "'Apple SD Gothic Neo'", 'Pretendard', "'Noto Sans KR'", 'sans-serif']`.
- `public/fonts/README.md` 표에 한 줄 추가. `docs/design-tokens.md` 의 "무시해도 되는 것" 절은
  틀렸으므로 고친다(플레이스홀더가 아니라 소개 문단용 지정이었다). `docs/decisions.md` 미결 A 를
  확정으로 옮긴다.

### 적용 범위 — 소개 문단 5곳만

`font-heir` → `font-desc font-extralight`. 크기·행간·색(`text-[15px] leading-[2] text-ds-text/70`)은 그대로.

| 파일 | 위치 |
|---|---|
| `app/(site)/about/[slug]/page.tsx` | 제목 아래 `intro` MarkdownText |
| `app/(site)/process/[slug]/page.tsx` | 제목 아래 `intro` MarkdownText |
| `app/(site)/join/[slug]/page.tsx` | 제목 아래 `intro` MarkdownText (성구 blockquote·후원 안내 카드는 제외) |
| `app/(site)/people/page.tsx` | `peopleIntro` |
| `app/(site)/guestbook/page.tsx` | `guestbookIntro` |

`app/(site)/people/[id]/page.tsx` 의 인물 약력은 본문이므로 바꾸지 않는다.

빛의계승자 그대로 두는 것: 기도 제목 목록, 인물 약력·한 줄 소개, 편지 캐러셀 본문, 후원 안내 카드,
성구 인용, 쪽지·답글(그리운 고씨네).

### 테스트

각 페이지의 기존 테스트에 "소개 문단이 `font-desc` 를 가진다" 단언을 하나씩 추가한다.
폰트 파일 존재는 테스트하지 않는다(정적 자산).

---

## 문서 갱신

- `docs/roadmap.md`: 3단계 하트 항목 체크, "답변 대기 중인 것" 표에서 하트·카드 링크·본문 폰트
  세 줄을 "해소된 항목"으로 이동.
- `docs/client-feedback.md`: #38 항목을 확정으로.
- `docs/decisions.md`: C-3 확정, 미결 A 확정.

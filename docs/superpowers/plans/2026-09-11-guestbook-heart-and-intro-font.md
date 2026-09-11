# 제작팀 하트 + 소개 문단 고딕 폰트 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 운영진이 응원글에 켜고 끄는 "제작팀 하트"를 붙이고, 페이지 제목 아래 소개 문단 5곳을 Apple SD Gothic Neo UltraLight(대체 Pretendard ExtraLight)로 바꾼다.

**Architecture:** 하트는 `guestbook_entries.is_hearted` boolean 하나. 어드민의 기존 `moderateEntry` 서버 액션에 `heart`/`unheart` 동작을 더하고, 공개 쪽지 하단 왼쪽에 하트 아이콘을 그린다. 폰트는 `@font-face` 하나로 애플 내장 폰트를 `local()`로 먼저 찾고 없으면 자체 호스팅 woff2를 내려받는다. Tailwind `font-desc` 클래스를 소개 문단 5곳에만 붙인다.

**Tech Stack:** Next.js 16 App Router, React 19, Tailwind v3, Supabase(RLS), Vitest + Testing Library.

설계 문서: `docs/superpowers/specs/2026-09-11-guestbook-heart-and-intro-font-design.md`
브랜치: `feat/guestbook-heart-intro-font` (이미 만들어져 있음)

**규약**
- 테스트: `npx vitest run <파일>` (전체는 `npm test`). 현재 353개 통과 상태에서 시작한다.
- 커밋 메시지는 한글 + 타입 접두사(`feat:` `fix:` `docs:` `chore:` `test:`), 끝에
  `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>` 한 줄.
- 코드 주석은 한글, "왜"를 적는다(기존 파일 스타일 참고).
- 마이그레이션은 파일만 만든다. 실제 적용은 사용자가 Supabase SQL Editor에서 한다.

---

## 파일 지도

| 파일 | 역할 | 작업 |
|---|---|---|
| `supabase/migrations/0014_guestbook_heart.sql` | `is_hearted` 컬럼 | 생성 |
| `lib/guestbook.ts` | `GuestbookEntry.isHearted` 타입 | 수정 |
| `app/admin/guestbook/actions.ts` | `heart`/`unheart` 동작 | 수정 |
| `app/admin/guestbook/actions.test.ts` | 액션 테스트 | 수정 |
| `app/admin/guestbook/GuestbookAdmin.tsx` | 하트 버튼·배지 | 수정 |
| `app/admin/guestbook/GuestbookAdmin.test.tsx` | 버튼 테스트 | 수정 |
| `app/admin/guestbook/page.tsx` | select에 `is_hearted` | 수정 |
| `components/guestbook/HeartIcon.tsx` | 하트 SVG | 생성 |
| `components/guestbook/GuestbookNote.tsx` | 쪽지에 하트 표시 | 수정 |
| `components/guestbook/GuestbookNote.test.tsx` | 하트 표시 테스트 | 수정 |
| `app/(site)/guestbook/page.tsx` | select에 `is_hearted`, 소개 문단 폰트 | 수정 |
| `public/fonts/Pretendard-ExtraLight.woff2` | 대체 폰트 | 생성(복사) |
| `public/fonts/README.md` | 폰트 표 | 수정 |
| `app/globals.css` | `@font-face 'Nazir Sans'` | 수정 |
| `tailwind.config.ts` | `fontFamily.desc` | 수정 |
| `app/(site)/about/[slug]/page.tsx` · `process/[slug]/page.tsx` · `join/[slug]/page.tsx` · `people/page.tsx` | 소개 문단 폰트 | 수정 |
| 위 4개의 `page.test.tsx` | 폰트 클래스 단언 | 수정 |
| `docs/roadmap.md` · `docs/client-feedback.md` · `docs/decisions.md` · `docs/design-tokens.md` | 확정 반영 | 수정 |

---

### Task 1: 마이그레이션과 타입

**Files:**
- Create: `supabase/migrations/0014_guestbook_heart.sql`
- Modify: `lib/guestbook.ts:1-6`
- Modify: `components/guestbook/GuestbookNote.test.tsx:6-11` (픽스처에 필드 추가)

- [ ] **Step 1: 마이그레이션 파일 작성**

```sql
-- 제작팀 하트 (클라이언트 확정 2026-09-11: "응원 쪽지 하트는 제작팀용")
--
-- 운영진이 응원글에 감사 표시로 켜고 끄는 boolean 하나다. 방문자 좋아요가 아니다.
-- 방문자 카운트로 만들면 중복 방지 테이블과 봇 대응이 따라오는데, 숫자의 신뢰도는 낮고
-- 어뷰징 표면만 늘어난다 — docs/decisions.md C-3.
--
-- 쓰기는 기존 `auth all` 정책(0009)이 authenticated 의 update 를 허용하므로 정책 추가 없음.
-- anon 은 `public read` 로 읽기만 한다.
--
-- 배포 Supabase 대시보드 SQL Editor 에서 1회 실행. 재실행 안전.

alter table guestbook_entries
  add column if not exists is_hearted boolean not null default false;

-- 확인용:
-- select id, name, is_hearted from guestbook_entries where is_hearted order by created_at desc;
```

- [ ] **Step 2: `GuestbookEntry` 타입에 `isHearted` 추가**

`lib/guestbook.ts` 맨 위 인터페이스를 이렇게 바꾼다:

```ts
export interface GuestbookEntry {
  id: string;
  name: string;
  message: string;
  createdAt: string;
  /** 제작팀이 켠 하트. 방문자 좋아요가 아니다 — docs/decisions.md C-3. */
  isHearted: boolean;
}
```

- [ ] **Step 3: 쪽지 테스트 픽스처에 필드 추가**

`components/guestbook/GuestbookNote.test.tsx` 의 `entry` 상수:

```ts
const entry = {
  id: 'e1',
  name: '정은수',
  message: '함께 기도하겠습니다!',
  createdAt: '2026-08-26T04:00:00.000Z',
  isHearted: false,
};
```

- [ ] **Step 4: 타입 검사와 기존 테스트가 여전히 통과하는지 확인**

Run: `npx tsc --noEmit -p . 2>&1 | head -20`
Expected: `app/(site)/guestbook/page.tsx` 에서 `isHearted` 가 없다는 오류 1건이 나온다(Task 4에서 고침). 그 외 오류 없음.

Run: `npx vitest run components/guestbook lib/guestbook.test.ts`
Expected: 전부 PASS.

- [ ] **Step 5: 커밋**

```bash
git add supabase/migrations/0014_guestbook_heart.sql lib/guestbook.ts components/guestbook/GuestbookNote.test.tsx
git commit -m "feat: 응원글에 제작팀 하트 칸을 더한다 (0014)

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 2: 서버 액션 — `heart` / `unheart`

**Files:**
- Modify: `app/admin/guestbook/actions.ts:9-56`
- Test: `app/admin/guestbook/actions.test.ts`

- [ ] **Step 1: 실패하는 테스트 추가**

`actions.test.ts` 의 `describe('moderateEntry', ...)` 안, `'refreshes the public board...'` 앞에 추가:

```ts
  it('하트를 켠다 — 제작팀이 응원에 답하는 표시', async () => {
    const r = await moderateEntry(initial, fd('e1', 'heart'));
    expect(update).toHaveBeenCalledWith({ is_hearted: true });
    expect(updateEq).toHaveBeenCalledWith('id', 'e1');
    expect(r.ok).toBe(true);
    expect(r.message).toMatch(/하트/);
  });

  it('하트를 거둔다', async () => {
    await moderateEntry(initial, fd('e1', 'unheart'));
    expect(update).toHaveBeenCalledWith({ is_hearted: false });
  });

  it('하트도 공개 게시판을 다시 그린다', async () => {
    revalidatePath.mockClear();
    await moderateEntry(initial, fd('e1', 'heart'));
    expect(revalidatePath).toHaveBeenCalledWith('/guestbook');
  });
```

- [ ] **Step 2: 실패 확인**

Run: `npx vitest run app/admin/guestbook/actions.test.ts`
Expected: 새 테스트 3개 FAIL — `r.ok` 가 false("알 수 없는 동작입니다.").

- [ ] **Step 3: 액션 구현**

`app/admin/guestbook/actions.ts` 에서 `ModerateOp`·`DONE`·`moderateEntry` 를 이렇게 바꾼다:

```ts
export type ModerateOp = 'hold' | 'release' | 'delete' | 'heart' | 'unheart';

const DONE: Record<ModerateOp, string> = {
  hold: '숨김 처리했습니다. 공개 목록에서 사라집니다.',
  release: '공개했습니다. 게시판에 바로 보입니다.',
  delete: '삭제했습니다.',
  heart: '하트를 보냈습니다. 쪽지에 제작팀 하트가 붙습니다.',
  unheart: '하트를 거뒀습니다.',
};

const OPS: readonly ModerateOp[] = ['hold', 'release', 'delete', 'heart', 'unheart'];

/**
 * 응원글 한 건을 숨김 / 공개 / 삭제하거나 제작팀 하트를 켜고 끈다.
 *
 * 링크가 섞인 글은 등록 시 자동으로 보류(`is_held`)되므로, 운영진이 여기서 보고
 * 풀어주거나 지운다 — docs/decisions.md C-4.
 *
 * 하트는 제작팀이 응원에 감사를 표시하는 boolean 하나다(C-3). 숨긴 글에도 켤 수 있다 —
 * 숨김을 풀면 바로 보이면 되고, 막을 이유가 없다.
 *
 * 작성자 본인이 지우는 경로는 두지 않기로 했다(C-1). 삭제 권한은 여기뿐이다.
 */
export async function moderateEntry(
  _prev: ModerateState,
  formData: FormData,
): Promise<ModerateState> {
  const id = String(formData.get('id') ?? '').trim();
  const op = String(formData.get('op') ?? '') as ModerateOp;
  if (!id) return { ok: false, message: '대상을 찾지 못했습니다.' };
  if (!OPS.includes(op)) {
    return { ok: false, message: '알 수 없는 동작입니다.' };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/admin/login');

  const patch =
    op === 'hold' || op === 'release'
      ? { is_held: op === 'hold' }
      : op === 'heart' || op === 'unheart'
        ? { is_hearted: op === 'heart' }
        : null;

  const { error } = patch
    ? await supabase.from('guestbook_entries').update(patch).eq('id', id)
    : await supabase.from('guestbook_entries').delete().eq('id', id);

  if (error) return { ok: false, message: `처리 실패: ${error.message}` };

  revalidatePath('/guestbook');
  revalidatePath('/admin/guestbook');
  return { ok: true, message: DONE[op] };
}
```

- [ ] **Step 4: 통과 확인**

Run: `npx vitest run app/admin/guestbook/actions.test.ts`
Expected: 전부 PASS (기존 6 + 새 3).

- [ ] **Step 5: 커밋**

```bash
git add app/admin/guestbook/actions.ts app/admin/guestbook/actions.test.ts
git commit -m "feat: 관리자 액션에 하트 켜기·끄기를 더한다

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 3: 어드민 화면 — 하트 버튼과 배지

**Files:**
- Modify: `app/admin/guestbook/GuestbookAdmin.tsx:7-16, 60-96`
- Modify: `app/admin/guestbook/page.tsx:19, 40-50`
- Test: `app/admin/guestbook/GuestbookAdmin.test.tsx`

- [ ] **Step 1: 실패하는 테스트 추가**

`GuestbookAdmin.test.tsx` 의 `entry` 픽스처에 `isHearted: false,` 를 `isHeld: false,` 다음 줄에 넣고,
`describe` 안 마지막에 추가:

```ts
  it('하트가 없는 글에는 하트 보내기, 있는 글에는 하트 거두기를 준다', () => {
    render(<GuestbookAdmin entries={[entry({ id: 'a' }), entry({ id: 'b', isHearted: true })]} />);
    expect(screen.getByRole('button', { name: '하트 보내기' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '하트 거두기' })).toBeInTheDocument();
  });

  it('하트 버튼은 heart / unheart 동작을 보낸다', () => {
    render(<GuestbookAdmin entries={[entry({ id: 'x', isHearted: true })]} />);
    const form = screen.getByRole('button', { name: '하트 거두기' }).closest('form')!;
    expect(form.querySelector('input[name="op"]')).toHaveValue('unheart');
    expect(form.querySelector('input[name="id"]')).toHaveValue('x');
  });

  it('하트가 켜진 글은 이름 옆에 배지가 붙는다', () => {
    render(<GuestbookAdmin entries={[entry({ isHearted: true })]} />);
    expect(screen.getByText('♥ 하트')).toBeInTheDocument();
  });
```

- [ ] **Step 2: 실패 확인**

Run: `npx vitest run app/admin/guestbook/GuestbookAdmin.test.tsx`
Expected: 새 테스트 3개 FAIL (버튼·배지 없음).

- [ ] **Step 3: `AdminEntry` 타입과 배지·버튼 구현**

`GuestbookAdmin.tsx` 의 `AdminEntry`:

```ts
export type AdminEntry = {
  id: string;
  name: string;
  message: string;
  isHeld: boolean;
  /** 제작팀 하트 — docs/decisions.md C-3. */
  isHearted: boolean;
  /** 왜 숨겨졌는지. 비어 있으면 운영진이 손으로 숨긴 글이다. */
  holdReasons: HoldReason[];
  createdAt: string;
  replies: GuestbookReply[];
};
```

이름 줄의 `{e.isHeld && (...)}` 바로 뒤에 배지 추가:

```tsx
              {e.isHearted && (
                <span className="text-[11px] tracking-[0.14em] text-ds-key2">♥ 하트</span>
              )}
```

버튼 줄에서 숨기기 폼(`</form>`) 바로 다음, `{confirming === e.id ? (` 앞에 하트 폼 추가:

```tsx
              {/* 제작팀 하트. 숨긴 글에도 켤 수 있다 — 숨김을 풀면 바로 보인다. */}
              <form action={formAction} className="contents">
                <input type="hidden" name="id" value={e.id} />
                <input type="hidden" name="op" value={e.isHearted ? 'unheart' : 'heart'} />
                <button
                  type="submit"
                  disabled={pending}
                  className="cursor-pointer border border-ds-key2/50 px-3 py-1.5 text-[11px] text-ds-key2 transition-colors hover:bg-ds-key2/10 disabled:opacity-40"
                >
                  {e.isHearted ? '하트 거두기' : '하트 보내기'}
                </button>
              </form>
```

- [ ] **Step 4: 어드민 조회에 `is_hearted` 포함**

`app/admin/guestbook/page.tsx`:

select 문자열을 `'id,name,message,is_held,is_hearted,hold_reasons,created_at'` 로 바꾸고,
매핑에 `isHeld: r.is_held as boolean,` 다음 줄로 `isHearted: r.is_hearted as boolean,` 을 넣는다.
(0014 선적용이 전제다. 처음엔 `?? false` 폴백을 넣었으나, 없는 칸을 select 하면 조회 자체가 42703 으로 실패해 폴백에 닿지 못한다 — 리뷰에서 걷어냄.)

- [ ] **Step 5: 통과 확인**

Run: `npx vitest run app/admin/guestbook`
Expected: 전부 PASS.

Run: `npx tsc --noEmit -p . 2>&1 | head`
Expected: `app/(site)/guestbook/page.tsx` 의 `isHearted` 누락 오류만 남음.

- [ ] **Step 6: 커밋**

```bash
git add app/admin/guestbook/GuestbookAdmin.tsx app/admin/guestbook/GuestbookAdmin.test.tsx app/admin/guestbook/page.tsx
git commit -m "feat: 관리자 응원 게시판에 하트 버튼과 배지를 둔다

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 4: 공개 쪽지에 하트 표시

**Files:**
- Create: `components/guestbook/HeartIcon.tsx`
- Modify: `components/guestbook/GuestbookNote.tsx:75-100`
- Modify: `app/(site)/guestbook/page.tsx:26-30, 64-72`
- Test: `components/guestbook/GuestbookNote.test.tsx`

- [ ] **Step 1: 실패하는 테스트 추가**

`GuestbookNote.test.tsx` `describe` 안 마지막에 추가:

```ts
  it('제작팀 하트가 켜진 쪽지에는 하단 왼쪽에 하트가 붙는다', () => {
    render(
      <ul>
        <GuestbookNote entry={{ ...entry, isHearted: true }} index={0} />
      </ul>,
    );
    const heart = screen.getByLabelText('제작팀의 하트');
    expect(heart).toBeInTheDocument();
    expect(heart).toHaveTextContent('제작팀');
    // 눌리는 것이 아니다
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('하트가 꺼진 쪽지에는 하트가 없다', () => {
    render(
      <ul>
        <GuestbookNote entry={entry} index={0} />
      </ul>,
    );
    expect(screen.queryByLabelText('제작팀의 하트')).not.toBeInTheDocument();
  });

  it('답글과 하트가 같이 있으면 둘 다 그린다 — 댓글 아이콘이 먼저', () => {
    const { container } = render(
      <ul>
        <GuestbookNote
          entry={{ ...entry, isHearted: true }}
          index={0}
          replies={[reply('r1', '고맙습니다')]}
        />
      </ul>,
    );
    expect(screen.getByRole('button', { name: '답글 1개 보기' })).toBeInTheDocument();
    const heart = screen.getByLabelText('제작팀의 하트');
    const button = screen.getByRole('button');
    // 같은 줄(footer)에 있고, 버튼이 하트보다 앞에 온다
    expect(heart.parentElement).toBe(button.parentElement);
    expect(button.compareDocumentPosition(heart) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(container.querySelectorAll('svg')).toHaveLength(2);
  });
```

`reply` 헬퍼는 파일 중간에 이미 선언돼 있다(`const reply = (id, message) => ...`). 새 테스트는 그 아래에 둔다.

- [ ] **Step 2: 실패 확인**

Run: `npx vitest run components/guestbook/GuestbookNote.test.tsx`
Expected: 새 테스트 중 2개 FAIL (`제작팀의 하트` 없음). "하트가 꺼진" 테스트는 통과해도 된다.

- [ ] **Step 3: `HeartIcon` 작성**

`components/guestbook/HeartIcon.tsx`:

```tsx
/**
 * 쪽지 하단 왼쪽의 제작팀 하트. 시안에는 하트 자리가 없어 댓글 아이콘(`CommentIcon`)과
 * 같은 크기·같은 방식으로 그린다. 색은 currentColor — 쓰는 쪽이 정한다.
 */
export function HeartIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 21 21"
      aria-hidden
      focusable="false"
      className={className}
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M10.5 18.6l-1.16-1.06C5.12 13.72 2.3 11.16 2.3 8.02 2.3 5.46 4.3 3.5 6.86 3.5c1.45 0 2.84.68 3.64 1.75.8-1.07 2.19-1.75 3.64-1.75 2.56 0 4.56 1.96 4.56 4.52 0 3.14-2.82 5.7-7.04 9.53L10.5 18.6z" />
    </svg>
  );
}
```

- [ ] **Step 4: 쪽지에 하트 그리기**

`GuestbookNote.tsx` 상단 import에 `import { HeartIcon } from './HeartIcon';` 추가.

하단 `<div className="mt-4 flex items-center justify-between gap-3">` 안의 왼쪽 부분을 이렇게 바꾼다
(오른쪽 날짜 `<p>` 는 그대로):

```tsx
        <div className="mt-4 flex items-center justify-between gap-3">
          {/*
            왼쪽: 댓글 아이콘 → 제작팀 하트 순.
            댓글 아이콘은 답글이 있는 쪽지에만 붙는다 — 눌러도 아무 일이 없는 아이콘은 없는 것만 못하다.
            하트는 제작팀이 켠 표시일 뿐 눌리지 않는다(docs/decisions.md C-3). 둘 다 없으면 빈 칸.
          */}
          <div className="flex items-center gap-3">
            {replies.length > 0 && (
              <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                aria-expanded={open}
                aria-controls={panelId}
                aria-label={open ? '답글 접기' : `답글 ${replies.length}개 보기`}
                className="tap-target flex items-center gap-1 leading-none transition-opacity hover:opacity-70"
              >
                <CommentIcon className="h-[21px] w-[21px]" />
                {replies.length > 1 && (
                  <span aria-hidden className="font-griun text-[14px] leading-none">
                    {replies.length}
                  </span>
                )}
              </button>
            )}
            {entry.isHearted && (
              <span
                role="img"
                aria-label="제작팀의 하트"
                className="flex items-center gap-1 leading-none text-ds-key2"
              >
                <HeartIcon className="h-[21px] w-[21px]" />
                <span aria-hidden className="font-griun text-[14px] leading-none">
                  제작팀
                </span>
              </span>
            )}
          </div>
          <p className="font-griun text-[15px] leading-none">{formatNoteDate(entry.createdAt)}</p>
        </div>
```

주의: `role="img"` 을 준 span 안의 텍스트는 접근성 이름이 `aria-label` 로 대체된다. 테스트의 `toHaveTextContent('제작팀')` 은 DOM 텍스트를 보므로 그대로 통과한다.

- [ ] **Step 5: 공개 조회에 `is_hearted` 포함**

`app/(site)/guestbook/page.tsx`:

select 를 `'id,name,message,is_hearted,created_at'` 로 바꾸고 매핑에
`isHearted: r.is_hearted as boolean,` 을 추가한다(0014 선적용 전제).

파일 상단 주석의 `하트는 아직 확정 대기라 빠져 있다 — 같은 문서 C-3.` 를
`하트는 제작팀이 켜는 표시다(C-3). 방문자 좋아요는 없다.` 로 바꾼다.

- [ ] **Step 6: 통과 확인**

Run: `npx vitest run components/guestbook`
Expected: 전부 PASS.

Run: `npx tsc --noEmit -p .`
Expected: 오류 없음.

- [ ] **Step 7: 커밋**

```bash
git add components/guestbook/HeartIcon.tsx components/guestbook/GuestbookNote.tsx components/guestbook/GuestbookNote.test.tsx "app/(site)/guestbook/page.tsx"
git commit -m "feat: 응원 쪽지에 제작팀 하트를 그린다

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 5: 폰트 정의 — `Nazir Sans`

**Files:**
- Create: `public/fonts/Pretendard-ExtraLight.woff2` (복사)
- Modify: `app/globals.css:26-34` (Griun Gossi 블록 뒤)
- Modify: `tailwind.config.ts:20-26`
- Modify: `public/fonts/README.md:5-11`

- [ ] **Step 1: 폰트 파일 복사**

이미 내려받아 둔 파일이 있다(Pretendard v1.3.9, SIL OFL 1.1, 734,392 bytes):

```bash
cp /private/tmp/claude-501/-Users-predevho-nazir/825c42a7-bcb0-4caf-83aa-5034514688ec/scratchpad/Pretendard-ExtraLight.woff2 public/fonts/Pretendard-ExtraLight.woff2
ls -la public/fonts/Pretendard-ExtraLight.woff2
head -c 4 public/fonts/Pretendard-ExtraLight.woff2 | od -c | head -1
```

Expected: 734392 bytes, 첫 4바이트 `w O F 2`.

파일이 없으면 Node 로 다시 받는다(curl 은 이 환경에서 막혀 있다):

```bash
node -e "fetch('https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/packages/pretendard/dist/web/static/woff2/Pretendard-ExtraLight.woff2').then(r=>r.arrayBuffer()).then(b=>require('fs').writeFileSync('public/fonts/Pretendard-ExtraLight.woff2',Buffer.from(b)))"
```

- [ ] **Step 2: `@font-face` 추가**

`app/globals.css` 의 Griun Gossi `@font-face` 블록 바로 뒤에:

```css
/* 페이지 제목 아래 소개 문단용 고딕 (클라이언트 확정 2026-09-11: "제목 아래 부분은 AppleSDGothicNeo").
   시안 지정은 Apple SD Gothic Neo UltraLight. 애플 내장 폰트라 웹에 심을 수 없으므로
   애플 기기는 local() 로 그 폰트를 그대로 쓰고(다운로드 0), 그 외 기기만 거의 같은 모양의
   Pretendard ExtraLight(SIL OFL)를 받는다. 이 패밀리는 소개 문단(font-desc)에만 쓴다. */
@font-face {
  font-family: 'Nazir Sans';
  font-style: normal;
  font-weight: 200;
  font-display: swap;
  src: local('AppleSDGothicNeo-UltraLight'),
       local('Apple SD Gothic Neo UltraLight'),
       url('/fonts/Pretendard-ExtraLight.woff2') format('woff2');
}
```

- [ ] **Step 3: Tailwind 패밀리 추가**

`tailwind.config.ts` 의 `fontFamily` 에 `griun` 다음 줄로:

```ts
        // 페이지 제목 아래 소개 문단 전용 고딕. 'Nazir Sans' 는 globals.css 의 @font-face
        // (애플은 내장 Apple SD Gothic Neo, 그 외는 Pretendard). 나머지 본문은 font-heir.
        desc: ["'Nazir Sans'", "'Apple SD Gothic Neo'", 'Pretendard', "'Noto Sans KR'", 'sans-serif'],
```

- [ ] **Step 4: README 표 갱신**

`public/fonts/README.md` 의 "현재 상태" 표에 한 줄 추가:

```
| `Pretendard-ExtraLight.woff2` | 717KB | 소개 문단용 대체 폰트(애플 기기는 내장 Apple SD Gothic Neo 사용) |
```

그리고 `합계 4.3MB.` 를 `합계 5.0MB.` 로 바꾼다. 문서 끝에 절 추가:

```markdown
## 4. Pretendard (소개 문단 대체 폰트)

- 출처: https://github.com/orioncactus/pretendard (v1.3.9), SIL Open Font License 1.1
- 파일: `packages/pretendard/dist/web/static/woff2/Pretendard-ExtraLight.woff2`
- 용도: 페이지 제목 아래 소개 문단(`font-desc`). 시안 지정은 Apple SD Gothic Neo UltraLight 이고,
  애플 기기는 `local()` 로 내장 폰트를 쓴다. 이 파일은 윈도우·안드로이드용이다.
- OFL 이라 자체 호스팅·서브셋 모두 허용. 지금은 서브셋 없이 정적 파일 하나만 둔다.
```

- [ ] **Step 5: 빌드 확인**

Run: `npx next build 2>&1 | tail -15`
Expected: 오류 없이 완료. (폰트 파일은 정적 자산이라 빌드에 영향이 없지만, CSS 문법 오류는 여기서 잡힌다.)

- [ ] **Step 6: 커밋**

```bash
git add public/fonts/Pretendard-ExtraLight.woff2 public/fonts/README.md app/globals.css tailwind.config.ts
git commit -m "feat: 소개 문단용 고딕 폰트 Nazir Sans 를 정의한다

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 6: 소개 문단 5곳에 적용

**Files:**
- Modify: `app/(site)/about/[slug]/page.tsx:88`
- Modify: `app/(site)/process/[slug]/page.tsx:64`
- Modify: `app/(site)/join/[slug]/page.tsx:60`
- Modify: `app/(site)/people/page.tsx:41`
- Modify: `app/(site)/guestbook/page.tsx:108`
- Test: 위 앞 4개의 `page.test.tsx` (응원 게시판은 페이지 테스트가 없어 Supabase 의존이라 건너뛴다)

- [ ] **Step 1: 실패하는 테스트 추가**

`app/(site)/about/[slug]/page.test.tsx` `describe` 안 마지막:

```ts
  it('제목 아래 소개 문단만 고딕(font-desc)이고 제목은 빛의계승자다 — 클라이언트 확정', async () => {
    const { container } = await show('greeting');
    const intro = container.querySelector('header .font-desc');
    expect(intro).not.toBeNull();
    expect(intro).toHaveClass('font-extralight');
    expect(screen.getByRole('heading', { level: 1 })).toHaveClass('font-heir');
  });
```

`app/(site)/process/[slug]/page.test.tsx` `describe` 안 마지막:

```ts
  it('제목 아래 소개 문단만 고딕(font-desc)이다', async () => {
    const { container } = await show('schedule');
    expect(container.querySelector('header .font-desc')).toHaveClass('font-extralight');
    expect(screen.getByRole('heading', { level: 1 })).toHaveClass('font-heir');
  });
```

`app/(site)/join/[slug]/page.test.tsx` `describe` 안 마지막:

```ts
  it('제목 아래 소개 문단만 고딕(font-desc)이고 성구 인용은 빛의계승자다', async () => {
    const { container } = await show('support');
    expect(container.querySelector('header .font-desc')).toHaveClass('font-extralight');
    expect(container.querySelector('blockquote p')).toHaveClass('font-heir');
    expect(container.querySelector('blockquote .font-desc')).toBeNull();
  });
```

`app/(site)/people/page.test.tsx` `describe` 안 마지막:

```ts
  it('제목 아래 소개 문단은 고딕(font-desc)이다', async () => {
    const { container } = await render_();
    expect(container.querySelector('.font-desc')).toHaveClass('font-extralight');
  });
```

주의: `people/page.tsx` 의 소개 문단은 `site.peopleIntro` 가 비어 있으면 그려지지 않는다.
로컬 시드(`content/data.ts`)의 `peopleIntro` 가 비어 있으면 이 테스트는 실패하니, 그 경우 테스트를
`expect(container.querySelector('.font-desc') ?? document.createElement('p')).not.toHaveClass('font-heir')` 처럼
약화하지 말고, 시드 값을 확인해 실제 문구가 있는지 먼저 본다(`grep -n peopleIntro content/data.ts`).
비어 있으면 이 테스트 하나는 빼고 나머지 3개로 충분하다.

- [ ] **Step 2: 실패 확인**

Run: `npx vitest run "app/(site)/about" "app/(site)/process" "app/(site)/join" "app/(site)/people/page.test.tsx"`
Expected: 새 테스트 4개(또는 3개) FAIL — `.font-desc` 가 null.

- [ ] **Step 3: 5곳의 클래스 교체**

각 파일에서 소개 문단의 `font-heir` 를 `font-desc font-extralight` 로 바꾼다. 나머지 클래스는 그대로.

`app/(site)/about/[slug]/page.tsx`:
```tsx
              <MarkdownText className="mt-4 max-w-[586px] font-desc font-extralight text-[15px] leading-[2] text-ds-text/70">
```

`app/(site)/process/[slug]/page.tsx`:
```tsx
            <MarkdownText className="mt-4 max-w-[586px] font-desc font-extralight text-[15px] leading-[2] text-ds-text/70">
              {intro}
            </MarkdownText>
```

`app/(site)/join/[slug]/page.tsx` — 제목 바로 아래 `{intro}` 를 감싼 것만. 그 아래 `blockquote` 와
`후원 안내` 카드의 `MarkdownText` 는 손대지 않는다:
```tsx
            <MarkdownText className="mt-4 max-w-[586px] font-desc font-extralight text-[15px] leading-[2] text-ds-text/70">
              {intro}
            </MarkdownText>
```

`app/(site)/people/page.tsx`:
```tsx
        <MarkdownText className="mx-auto mt-4 max-w-[720px] text-center font-desc font-extralight text-[15px] leading-[2] text-ds-text/70">
```

`app/(site)/guestbook/page.tsx`:
```tsx
          <p className="mt-4 whitespace-pre-line font-desc font-extralight text-[15px] leading-[2] text-ds-text/70">
```

- [ ] **Step 4: 통과 확인**

Run: `npx vitest run "app/(site)"`
Expected: 전부 PASS.

- [ ] **Step 5: 화면으로 확인**

개발 서버를 띄워(`.claude/launch.json` 의 설정 사용) `/join/support` 를 열고 스크린샷을 찍는다.
확인할 것: 제목 `후원으로 함께하기` 는 세리프(빛의계승자), 바로 아래 문단은 가는 고딕, 그 아래 성구는 다시 세리프.
맥에서는 네트워크 탭에 `Pretendard-ExtraLight.woff2` 요청이 **없어야** 한다(내장 폰트 사용).

- [ ] **Step 6: 커밋**

```bash
git add "app/(site)/about/[slug]/page.tsx" "app/(site)/about/[slug]/page.test.tsx" "app/(site)/process/[slug]/page.tsx" "app/(site)/process/[slug]/page.test.tsx" "app/(site)/join/[slug]/page.tsx" "app/(site)/join/[slug]/page.test.tsx" "app/(site)/people/page.tsx" "app/(site)/people/page.test.tsx" "app/(site)/guestbook/page.tsx"
git commit -m "feat: 페이지 제목 아래 소개 문단을 고딕으로 바꾼다

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 7: 문서 갱신

**Files:**
- Modify: `docs/roadmap.md:31, 120, 156, 218-237`
- Modify: `docs/client-feedback.md:137-149`
- Modify: `docs/decisions.md:94-105, 228-241`
- Modify: `docs/design-tokens.md:90-93`

- [ ] **Step 1: roadmap.md**

- 31행 `- [x] **3단계 응원 게시판** — 읽기·쓰기·답글·규칙 선별 (하트만 대기)` → `(하트 포함)`.
- 34행 `**남은 것은 클라이언트 답변 대기 3건과 운영진이 채울 데이터(인물 43명)뿐입니다.**` →
  `**남은 것은 운영진이 채울 데이터(인물 43명 사진·소개·약력, 9월 중 전달 예정)뿐입니다.**`
- 120행 `**읽기·쓰기·답글·선별까지 완료.** 하트만 확정 대기로 남았습니다.` → `**읽기·쓰기·답글·선별·하트까지 완료.**`
- 156행 `- [ ] 하트 토글 — "우리 하트"의 의미가 확정 대기` →
  `- [x] **하트 토글** (\`0014\`) — 제작팀 하트로 확정(2026-09-11). 어드민에서 켜고 끄며 쪽지 하단 왼쪽에 붙는다. 방문자 좋아요는 없다`
- "답변 대기 중인 것" 표에서 위 3줄(우리 하트 / 카드 클릭 / 본문 폰트)을 지우고, "해소된 항목" 목록 맨 위에 추가:

```markdown
- ~~"우리 하트"의 의미~~ → **제작팀 하트로 확정**(2026-09-11). `is_hearted` boolean 하나, 방문자 좋아요 없음
- ~~함께하는 사람들 카드 클릭 → 상세페이지 여부~~ → **개인 페이지로 이동 확정**(2026-09-11). `/people/[id]` 유지
- ~~본문 폰트~~ → **제목·본문은 빛의계승자, 제목 아래 소개 문단만 Apple SD Gothic Neo UltraLight**(2026-09-11).
  애플 외 기기는 Pretendard ExtraLight 로 대체(`font-desc`)
```

- 236행 `**지금 화면을 막고 있는 것은 없습니다.** \`함께하는 사람들\` 카드 링크(#46)만 답이 오면 지금 구조(\`/people/[id]\` 유지)를 그대로 둘지 확정됩니다.` →
  `**지금 화면을 막고 있는 것은 없습니다.** 남은 표의 3건은 전부 디자이너 최종 에셋이고, 오면 파일만 교체한다.`

- [ ] **Step 2: client-feedback.md**

137행 절 제목 아래 내용 끝(149행 `선택지: ...` 다음)에 추가:

```markdown
**확정(2026-09-11, 빛/One Step 답변):** 제목과 나머지 본문은 빛의계승자, **제목 아래 소개 문단만
AppleSDGothicNeo**. 피그마에서 `AppleSDGothicNeoUL00` 로 지정된 자리가 정확히 그곳이다.
```

- [ ] **Step 3: decisions.md**

96행 `### A. 메인 폰트 가독성 (팀 내 의견 충돌)` 절의 끝(104행 `① ... / ② ...` 다음)에:

```markdown
**확정(2026-09-11):** ②에 가깝다. 제목·본문은 빛의계승자, **페이지 제목 아래 소개 문단만**
Apple SD Gothic Neo UltraLight. 애플 내장 폰트라 웹 임베드가 안 되므로 `local()` 우선 +
Pretendard ExtraLight(OFL) 대체 — `app/globals.css` 의 `'Nazir Sans'`, Tailwind `font-desc`.
```

240~241행의 `> 확인 필요: ...` 인용 두 줄을 이렇게 바꾼다:

```markdown
> **확정(2026-09-11):** 클라이언트 답변 "응원 쪽지 하트는 제작팀용". 왼쪽 열(운영진 하트)로 구현했다 —
> `0014_guestbook_heart.sql`, 어드민 `하트 보내기/거두기`, 쪽지 하단 왼쪽 하트 + `제작팀`.
```

- [ ] **Step 4: design-tokens.md**

90~93행 "무시해도 되는 것" 절을 이렇게 바꾼다:

```markdown
### Apple SD Gothic Neo UltraLight — 페이지 제목 아래 소개 문단 (9회)

`AppleSDGothicNeoUL00`(8), `Apple SD Gothic Neo`(1)는 `간단한 설명…` 플레이스홀더에 붙어 있어
처음엔 더미로 봤으나, **클라이언트 확정(2026-09-11)으로 실제 지정**이었다. 제목 바로 아래 소개
문단만 이 폰트이고 나머지 본문은 빛의계승자다. 구현은 `'Nazir Sans'`(`local()` Apple SD Gothic Neo
UltraLight → Pretendard ExtraLight) + Tailwind `font-desc`.
```

- [ ] **Step 5: 전체 테스트와 커밋**

Run: `npm test 2>&1 | tail -6`
Expected: 353 + 새 테스트(약 12개) 전부 PASS.

```bash
git add docs/roadmap.md docs/client-feedback.md docs/decisions.md docs/design-tokens.md
git commit -m "docs: 하트·카드 링크·폰트 확정을 문서에 반영한다

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

## 완료 후 사용자 몫

1. Supabase SQL Editor 에서 `supabase/migrations/0014_guestbook_heart.sql` 1회 실행.
   **push 전에 반드시** 실행한다. 미적용 상태로 배포하면 없는 칸을 조회해 42703 에러가 나고 공개 응원 게시판
   전체가 "불러올 수 없습니다"가 된다(실제로 확인함). 적용 직후 하트 버튼이 PGRST204 로 실패하면
   SQL Editor 에서 `notify pgrst, 'reload schema';` 1회.
2. main 에 ff 병합 후 push → Vercel 배포.

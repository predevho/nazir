# 〈나지르〉 Phase 3B-2 — 목록 편집(단순 5종) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.

**Goal:** 재사용 목록 편집기로 단순 목록 5종(facts·characters·timeline·budget·prayers)을 추가/수정/삭제/순서변경·저장하고, 저장 시 공개 페이지에 즉시 반영한다.

**Architecture:** 레지스트리(`lib/adminLists.ts`)가 목록별 테이블·컬럼을 정의하고 서버 화이트리스트 역할. `ListEditor`(클라이언트)가 행 배열을 관리해 JSON으로 제출하고, `saveList`(서버 액션)가 정리(upsert + 누락 삭제) 후 `revalidatePath`.

**Tech Stack:** Next.js 16 App Router, `@supabase/ssr`, React 19(useActionState), TypeScript, Vitest.

**핵심 결정**
- 단순 목록 5종만(people 중첩은 3B-3). characters는 이름/설명만 편집(사진 photo_url은 3C — 저장 시 미포함해 보존).
- 새 행 id는 클라이언트 생성(재저장 중복 방지). 순서변경 ↑↓, 저장 시 sort_order=배열 index.
- 커밋 메시지 한글 + 타입 접두사.
- **제약**: 실제 저장 왕복은 로그인 후 확인. 여기서는 코드 + 렌더/상호작용/액션(목) 테스트 + 빌드.

**전제:** `main`(4db92a1) = 동작하는 앱, Supabase 연결·관리자 로그인·3B-1 완료. 작업은 새 브랜치.

---

## File Structure

| 경로 | 상태 | 책임 |
|------|------|------|
| `lib/adminLists.ts` | 신규 | 목록 레지스트리(테이블·컬럼·화이트리스트) |
| `lib/adminLists.test.ts` | 신규 | 레지스트리 테스트 |
| `app/admin/lists/actions.ts` | 신규 | `saveList` 서버 액션(정리+반영) |
| `app/admin/lists/actions.test.ts` | 신규 | 저장 액션 로직(목) |
| `app/admin/lists/ListEditor.tsx` | 신규 | 재사용 편집기(클라이언트) |
| `app/admin/lists/ListEditor.test.tsx` | 신규 | 편집기 렌더·추가/삭제 |
| `app/admin/lists/[list]/page.tsx` | 신규 | 동적 라우트(목록별 편집 화면) |
| `app/admin/page.tsx` | 수정 | 허브에 목록 편집 링크 5종 |

---

## Task 1: 레지스트리 (lib/adminLists.ts)

**Files:** Create `lib/adminLists.ts`, `lib/adminLists.test.ts`. 검증: `npm test`

- [ ] **Step 1: 테스트 작성 (TDD)**

`lib/adminLists.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { ADMIN_LISTS } from './adminLists';

describe('ADMIN_LISTS', () => {
  it('단순 목록 5종을 정의한다', () => {
    expect(Object.keys(ADMIN_LISTS).sort()).toEqual(
      ['budget', 'characters', 'facts', 'prayers', 'timeline'].sort()
    );
  });
  it('테이블 매핑이 정확하다', () => {
    expect(ADMIN_LISTS.timeline.table).toBe('timeline_events');
    expect(ADMIN_LISTS.budget.table).toBe('budget_items');
    expect(ADMIN_LISTS.facts.table).toBe('facts');
  });
  it('timeline status는 select이고 3개 옵션(완료/진행 중/예정)이다', () => {
    const status = ADMIN_LISTS.timeline.columns.find((c) => c.key === 'status');
    expect(status?.type).toBe('select');
    expect(status?.options?.map((o) => o.value)).toEqual(['완료', '진행 중', '예정']);
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `npm test lib/adminLists.test.ts` → FAIL(모듈 없음).

- [ ] **Step 3: `lib/adminLists.ts` 작성**

```ts
export type ListColumn = {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'select';
  options?: { value: string; label: string }[];
};

export type ListConfig = {
  key: string;
  table: string;
  title: string;
  columns: ListColumn[];
};

export const ADMIN_LISTS: Record<string, ListConfig> = {
  facts: {
    key: 'facts',
    table: 'facts',
    title: '작품 개요',
    columns: [
      { key: 'key', label: '항목 (예: FORM)', type: 'text' },
      { key: 'value', label: '내용', type: 'text' },
    ],
  },
  characters: {
    key: 'characters',
    table: 'characters',
    title: '주요 등장인물',
    columns: [
      { key: 'name', label: '이름', type: 'text' },
      { key: 'description', label: '설명', type: 'textarea' },
    ],
  },
  timeline: {
    key: 'timeline',
    table: 'timeline_events',
    title: '제작 일정',
    columns: [
      { key: 'period', label: '기간 (예: 26.01.12 ~ 26.06.28)', type: 'text' },
      { key: 'title', label: '내용', type: 'text' },
      {
        key: 'status',
        label: '상태',
        type: 'select',
        options: [
          { value: '완료', label: '완료' },
          { value: '진행 중', label: '진행 중' },
          { value: '예정', label: '예정' },
        ],
      },
    ],
  },
  budget: {
    key: 'budget',
    table: 'budget_items',
    title: '제작 예산 항목',
    columns: [{ key: 'name', label: '항목명', type: 'text' }],
  },
  prayers: {
    key: 'prayers',
    table: 'prayers',
    title: '기도제목',
    columns: [{ key: 'text', label: '내용', type: 'textarea' }],
  },
};
```

- [ ] **Step 4: 통과 + Commit**

Run: `npm test lib/adminLists.test.ts` → PASS.
```bash
git add -A
git commit -m "feat: 목록 편집 레지스트리(테이블·컬럼) 추가"
```

---

## Task 2: 저장 서버 액션 (saveList)

**Files:** Create `app/admin/lists/actions.ts`, `app/admin/lists/actions.test.ts`. 검증: `npm test`

- [ ] **Step 1: `app/admin/lists/actions.ts` 작성**

```ts
'use server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ADMIN_LISTS } from '@/lib/adminLists';

export type SaveState = { ok: boolean; message: string };

function makeServerId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  return 'srv-' + Math.random().toString(36).slice(2);
}

export async function saveList(_prev: SaveState, formData: FormData): Promise<SaveState> {
  const listKey = String(formData.get('listKey') ?? '');
  const config = ADMIN_LISTS[listKey];
  if (!config) return { ok: false, message: '알 수 없는 목록입니다.' };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/admin/login');

  let parsed: Array<Record<string, string>>;
  try {
    const raw = JSON.parse(String(formData.get('rows') ?? '[]'));
    if (!Array.isArray(raw)) throw new Error('not array');
    parsed = raw;
  } catch {
    return { ok: false, message: '데이터 형식 오류입니다.' };
  }

  const desired = parsed.map((r, i) => {
    const row: Record<string, unknown> = {
      id: r.id && String(r.id).trim() ? String(r.id) : makeServerId(),
      sort_order: i,
    };
    for (const c of config.columns) row[c.key] = String(r[c.key] ?? '');
    return row;
  });

  const { error: upErr } = await supabase.from(config.table).upsert(desired);
  if (upErr) return { ok: false, message: `저장 실패: ${upErr.message}` };

  const keep = new Set(desired.map((r) => r.id as string));
  const { data: existing, error: selErr } = await supabase.from(config.table).select('id');
  if (selErr) return { ok: false, message: `조회 실패: ${selErr.message}` };
  const toDelete = (existing ?? []).map((e) => e.id as string).filter((id) => !keep.has(id));
  if (toDelete.length) {
    const { error: delErr } = await supabase.from(config.table).delete().in('id', toDelete);
    if (delErr) return { ok: false, message: `삭제 실패: ${delErr.message}` };
  }

  revalidatePath('/', 'layout');
  return { ok: true, message: '저장되었습니다. 공개 페이지에 반영됩니다.' };
}
```

- [ ] **Step 2: `app/admin/lists/actions.test.ts` 작성**

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

const { getUser, upsert, select, deleteIn, del, revalidatePath } = vi.hoisted(() => {
  const deleteIn = vi.fn().mockResolvedValue({ error: null });
  return {
    getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'u1' } } }),
    upsert: vi.fn().mockResolvedValue({ error: null }),
    select: vi.fn().mockResolvedValue({ data: [{ id: 'b0' }, { id: 'old' }], error: null }),
    deleteIn,
    del: vi.fn(() => ({ in: deleteIn })),
    revalidatePath: vi.fn(),
  };
});
vi.mock('next/cache', () => ({ revalidatePath }));
vi.mock('next/navigation', () => ({ redirect: vi.fn() }));
vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({ auth: { getUser }, from: () => ({ upsert, select, delete: del }) }),
}));

import { saveList } from './actions';

function fd(listKey: string, rows: unknown) {
  const f = new FormData();
  f.set('listKey', listKey);
  f.set('rows', JSON.stringify(rows));
  return f;
}

beforeEach(() => {
  upsert.mockClear();
  deleteIn.mockClear();
  revalidatePath.mockClear();
});

describe('saveList', () => {
  it('알 수 없는 목록은 거부한다', async () => {
    const res = await saveList({ ok: false, message: '' }, fd('bogus', []));
    expect(res.ok).toBe(false);
    expect(upsert).not.toHaveBeenCalled();
  });

  it('upsert(sort_order 부여)하고 누락 행 삭제 후 성공을 반환한다', async () => {
    const res = await saveList({ ok: false, message: '' }, fd('budget', [{ id: 'b0', name: '기획' }]));
    expect(upsert).toHaveBeenCalledOnce();
    const rows = upsert.mock.calls[0][0] as Array<Record<string, unknown>>;
    expect(rows[0]).toMatchObject({ id: 'b0', name: '기획', sort_order: 0 });
    // 기존 'old'는 제출되지 않았으므로 삭제 대상
    expect(deleteIn).toHaveBeenCalledWith('id', ['old']);
    expect(revalidatePath).toHaveBeenCalledWith('/', 'layout');
    expect(res.ok).toBe(true);
  });
});
```

- [ ] **Step 3: 통과 + Commit**

Run: `npm test app/admin/lists/actions.test.ts` → PASS.
```bash
git add -A
git commit -m "feat: 목록 저장 서버 액션(정리+즉시 반영) 추가"
```

---

## Task 3: 재사용 편집기 (ListEditor)

**Files:** Create `app/admin/lists/ListEditor.tsx`, `app/admin/lists/ListEditor.test.tsx`. 검증: `npm test`

- [ ] **Step 1: `app/admin/lists/ListEditor.tsx` 작성**

```tsx
'use client';
import { useActionState, useState } from 'react';
import type { ListConfig } from '@/lib/adminLists';
import { saveList, type SaveState } from './actions';

type Row = { _key: string; id: string } & Record<string, string>;

function makeId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  return 'tmp-' + Math.random().toString(36).slice(2);
}

function toRow(config: ListConfig, r: Record<string, string>): Row {
  const row = { _key: makeId(), id: r.id ?? '' } as Row;
  for (const c of config.columns) row[c.key] = r[c.key] ?? '';
  return row;
}

const initial: SaveState = { ok: false, message: '' };

export function ListEditor({ config, initialRows }: { config: ListConfig; initialRows: Record<string, string>[] }) {
  const [rows, setRows] = useState<Row[]>(() => initialRows.map((r) => toRow(config, r)));
  const [state, formAction, pending] = useActionState(saveList, initial);

  function addRow() {
    const row = { _key: makeId(), id: makeId() } as Row;
    for (const c of config.columns) row[c.key] = c.type === 'select' ? c.options?.[0]?.value ?? '' : '';
    setRows((rs) => [...rs, row]);
  }
  function removeRow(key: string) {
    setRows((rs) => rs.filter((r) => r._key !== key));
  }
  function move(key: string, dir: -1 | 1) {
    setRows((rs) => {
      const i = rs.findIndex((r) => r._key === key);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= rs.length) return rs;
      const copy = [...rs];
      [copy[i], copy[j]] = [copy[j], copy[i]];
      return copy;
    });
  }
  function setVal(key: string, col: string, value: string) {
    setRows((rs) => rs.map((r) => (r._key === key ? { ...r, [col]: value } : r)));
  }

  const payload = rows.map((r) => {
    const o: Record<string, string> = { id: r.id };
    for (const c of config.columns) o[c.key] = r[c.key] ?? '';
    return o;
  });

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="listKey" value={config.key} />
      <input type="hidden" name="rows" value={JSON.stringify(payload)} readOnly />
      {rows.map((row, idx) => (
        <div key={row._key} className="border border-gold/20 bg-velvet rounded-sm p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[11px] text-paper/40">#{idx + 1}</span>
            <div className="flex gap-1">
              <button type="button" onClick={() => move(row._key, -1)} disabled={idx === 0} aria-label="위로 이동" className="px-2 py-1 text-paper/70 disabled:opacity-30 hover:text-gold">↑</button>
              <button type="button" onClick={() => move(row._key, 1)} disabled={idx === rows.length - 1} aria-label="아래로 이동" className="px-2 py-1 text-paper/70 disabled:opacity-30 hover:text-gold">↓</button>
              <button type="button" onClick={() => removeRow(row._key)} aria-label="행 삭제" className="px-2 py-1 text-[13px] text-red-400/80 hover:text-red-400">삭제</button>
            </div>
          </div>
          {config.columns.map((c) => (
            <label key={c.key} className="flex flex-col gap-1">
              <span className="font-mono text-[10px] tracking-[0.1em] text-paper/50">{c.label}</span>
              {c.type === 'textarea' ? (
                <textarea value={row[c.key] ?? ''} onChange={(e) => setVal(row._key, c.key, e.target.value)} rows={2} className="px-3 py-2 bg-stage border border-gold/25 rounded-sm text-paper text-sm outline-none focus:border-gold/60 resize-y" />
              ) : c.type === 'select' ? (
                <select value={row[c.key] ?? ''} onChange={(e) => setVal(row._key, c.key, e.target.value)} className="min-h-[40px] px-3 bg-stage border border-gold/25 rounded-sm text-paper text-sm outline-none focus:border-gold/60">
                  {c.options?.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              ) : (
                <input type="text" value={row[c.key] ?? ''} onChange={(e) => setVal(row._key, c.key, e.target.value)} className="min-h-[40px] px-3 bg-stage border border-gold/25 rounded-sm text-paper text-sm outline-none focus:border-gold/60" />
              )}
            </label>
          ))}
        </div>
      ))}
      <button type="button" onClick={addRow} className="min-h-[44px] border border-dashed border-gold/40 text-gold text-sm rounded-sm hover:bg-gold/[0.08]">+ 행 추가</button>
      <div className="flex items-center gap-4 sticky bottom-0 bg-stage/90 backdrop-blur py-4">
        <button type="submit" disabled={pending} className="min-h-[48px] px-6 bg-gold text-ink font-medium rounded-sm hover:bg-gold-soft transition-colors disabled:opacity-60">
          {pending ? '저장 중…' : '저장'}
        </button>
        {state.message && <span className={`text-sm ${state.ok ? 'text-gold' : 'text-red-400'}`}>{state.message}</span>}
      </div>
    </form>
  );
}
```

- [ ] **Step 2: `app/admin/lists/ListEditor.test.tsx` 작성**

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ADMIN_LISTS } from '@/lib/adminLists';

vi.mock('./actions', () => ({ saveList: vi.fn() }));
import { ListEditor } from './ListEditor';

describe('ListEditor', () => {
  it('초기 행/값과 저장 버튼을 렌더한다', () => {
    render(<ListEditor config={ADMIN_LISTS.budget} initialRows={[{ id: 'b0', name: '기획' }]} />);
    expect(screen.getByDisplayValue('기획')).toBeInTheDocument();
    expect(screen.getByText('항목명')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '저장' })).toBeInTheDocument();
  });

  it('행 추가/삭제가 동작한다', async () => {
    render(<ListEditor config={ADMIN_LISTS.budget} initialRows={[{ id: 'b0', name: '기획' }]} />);
    // 처음엔 텍스트박스 1개(항목명) + 숨김 input 2개는 별개
    expect(screen.getAllByRole('textbox').length).toBe(1);
    await userEvent.click(screen.getByRole('button', { name: '+ 행 추가' }));
    expect(screen.getAllByRole('textbox').length).toBe(2);
    await userEvent.click(screen.getAllByRole('button', { name: '행 삭제' })[1]);
    expect(screen.getAllByRole('textbox').length).toBe(1);
  });
});
```
참고: `type="hidden"` input은 `getAllByRole('textbox')`에 잡히지 않으므로 항목명 input 수만 센다.

- [ ] **Step 3: 통과 + Commit**

Run: `npm test app/admin/lists/ListEditor.test.tsx` → PASS.
```bash
git add -A
git commit -m "feat: 재사용 목록 편집기(행 추가·삭제·순서변경) 추가"
```

---

## Task 4: 라우트 + 허브 링크

**Files:** Create `app/admin/lists/[list]/page.tsx`; Modify `app/admin/page.tsx`. 검증: `npm run build`, `npm test`

- [ ] **Step 1: `app/admin/lists/[list]/page.tsx` (동적 라우트)**

```tsx
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { ADMIN_LISTS } from '@/lib/adminLists';
import { ListEditor } from '../ListEditor';

export default async function ListAdminPage({ params }: { params: Promise<{ list: string }> }) {
  const { list } = await params;
  const config = ADMIN_LISTS[list];
  if (!config) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/admin/login');

  const { data } = await supabase.from(config.table).select('*').order('sort_order');
  const rows = (data ?? []) as Record<string, string>[];

  return (
    <section className="max-w-[760px] mx-auto px-5 py-[clamp(32px,6vw,56px)]">
      <Link href="/admin" className="font-mono text-[11px] text-gold">← 관리자</Link>
      <h1 className="font-display font-bold text-[clamp(24px,5vw,32px)] text-paper mt-3 mb-2">{config.title}</h1>
      <p className="text-sm text-paper/60 mb-8">행 추가 · 수정 · 삭제 · 순서변경 후 저장하면 즉시 반영됩니다.</p>
      <ListEditor config={config} initialRows={rows} />
    </section>
  );
}
```

- [ ] **Step 2: `app/admin/page.tsx` 허브에 목록 링크 추가**

기존 허브에서 "목록 편집 (인물 · 일정 · 명단)" placeholder 블록을 아래로 교체(단일 문구 편집 링크와 로그아웃은 유지). 파일 상단에 `import { ADMIN_LISTS } from '@/lib/adminLists';` 추가.
교체할 블록:
```tsx
        <div className="border-t border-gold/15 pt-6">
          <p className="font-mono text-[11px] tracking-[0.2em] text-gold mb-3">목록 편집</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {Object.values(ADMIN_LISTS).map((l) => (
              <Link
                key={l.key}
                href={`/admin/lists/${l.key}`}
                className="border border-gold/25 bg-velvet rounded-sm px-4 py-3 text-sm text-paper hover:border-gold/55 transition-colors"
              >
                {l.title}
              </Link>
            ))}
          </div>
          <p className="text-[13px] text-paper/40 mt-3">참여자 명단(중첩)은 다음 단계(3B-3)에서 추가됩니다.</p>
        </div>
```
(즉, 기존 허브의 `단일 문구 편집` 링크 카드는 그대로 두고, 그 아래 "목록 편집 (인물…)" placeholder를 위 블록으로 대체. 결과적으로 허브 = 단일 문구 편집 카드 + 목록 편집 링크 5종 + 로그아웃.)

- [ ] **Step 3: 빌드 + 테스트**

Run: `npm run build` → 성공(`/admin/lists/[list]` 동적 라우트 생성). 필요 시 `rm -rf .next` 후 재빌드.
Run: `npm test` → 전체 통과.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: 목록 편집 동적 라우트와 허브 링크 구성"
```

---

## Task 5: 검증 · README

**Files:** Modify `README.md`. 검증만.

- [ ] **Step 1: 전체 테스트 + 빌드**

Run: `npm test` → 전부 통과.
Run: `npm run build` → 성공.

- [ ] **Step 2: README "관리자" 절 갱신**

- 목록 편집(`/admin/lists/[목록]`): 작품 개요·인물·일정·예산·기도제목을 행 단위로 추가/수정/삭제/순서변경 후 저장 → 즉시 반영.
- 참여자 명단(중첩)·사진은 다음 단계(3B-3, 3C).
- 로드맵: Phase 3B-2(완료).

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "docs: 관리자 목록 편집 사용 안내 추가"
```

---

## 후속 (별도 계획)

- **Phase 3B-3** — 참여자 명단(people, 그룹+멤버 중첩) 편집.
- **Phase 3C** — 사진 업로드(Storage `images`, `photo_url` 갱신).

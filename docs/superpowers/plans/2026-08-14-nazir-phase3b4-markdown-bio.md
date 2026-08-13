# 〈나지르〉 Phase 3B-4 — 약력 마크다운 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.

**Goal:** 참여자 약력(bio)과 등장인물 설명(description)을 마크다운으로 작성·표시하고, 관리자 입력칸을 넓힌다.

**Architecture:** `react-markdown`+`remark-gfm`을 감싼 서버 호환 `MarkdownText` 컴포넌트로 공개 페이지에서 렌더. 관리자 편집기는 해당 필드를 큰 textarea + 안내로.

**Tech Stack:** Next.js 16, react-markdown, remark-gfm, TypeScript, Vitest.

**핵심 결정**
- 대상: 참여자 bio(/process), 등장인물 description(/about)만. 다른 문구·목록은 그대로.
- 서버 컴포넌트에서 렌더(클라이언트 JS 미추가).
- 커밋 메시지 한글 + 타입 접두사.

**전제:** `main`(3B-3b 완료). 작업은 새 브랜치.

---

## File Structure

| 경로 | 상태 | 책임 |
|------|------|------|
| `components/MarkdownText.tsx` | 신규 | react-markdown 래퍼(리스트·강조 스타일) |
| `components/MarkdownText.test.tsx` | 신규 | 마크다운 렌더 테스트 |
| `app/(site)/process/page.tsx` | 수정 | 참여자 bio를 MarkdownText로 + 카드 폭 조정 |
| `app/(site)/about/page.tsx` | 수정 | 등장인물 description을 MarkdownText로 |
| `lib/adminLists.ts` | 수정 | ListColumn에 `markdown?` + characters.description 지정 |
| `app/admin/lists/ListEditor.tsx` | 수정 | markdown 컬럼은 큰 textarea + 안내 |
| `app/admin/lists/people/PeopleEditor.tsx` | 수정 | 약력 textarea 확대 + 안내 |

---

## Task 1: MarkdownText 컴포넌트

**Files:** Create `components/MarkdownText.tsx`, `components/MarkdownText.test.tsx`; Modify `package.json`. 검증: `npm test`, `npm run build`

- [ ] **Step 1: 설치**

```bash
npm install react-markdown remark-gfm
```

- [ ] **Step 2: 테스트 작성 (TDD)**

`components/MarkdownText.test.tsx`:
```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MarkdownText } from './MarkdownText';

describe('MarkdownText', () => {
  it('불릿 마크다운을 리스트로 렌더한다', () => {
    render(<MarkdownText>{'- 항목1\n- 항목2'}</MarkdownText>);
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
    expect(screen.getByText('항목1')).toBeInTheDocument();
  });
  it('강조(**)를 strong으로 렌더한다', () => {
    render(<MarkdownText>{'**굵게**'}</MarkdownText>);
    expect(screen.getByText('굵게').tagName).toBe('STRONG');
  });
  it('빈 값이면 아무것도 렌더하지 않는다', () => {
    const { container } = render(<MarkdownText>{'   '}</MarkdownText>);
    expect(container.firstChild).toBeNull();
  });
});
```

- [ ] **Step 3: 실패 확인**

Run: `npm test components/MarkdownText.test.tsx` → FAIL(모듈 없음).

- [ ] **Step 4: `components/MarkdownText.tsx` 작성**

```tsx
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

/** 관리자 작성 마크다운을 다크 테마에 맞게 렌더. 빈 값이면 null. */
export function MarkdownText({ children, className }: { children: string; className?: string }) {
  if (!children || !children.trim()) return null;
  return (
    <div
      className={`[&_p]:mb-1.5 [&_p:last-child]:mb-0 [&_ul]:list-disc [&_ul]:pl-4 [&_ul]:flex [&_ul]:flex-col [&_ul]:gap-0.5 [&_ol]:list-decimal [&_ol]:pl-4 [&_li]:marker:text-gold/50 [&_a]:text-gold [&_a]:underline [&_strong]:font-medium [&_strong]:text-paper [&_em]:italic ${className ?? ''}`}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{children}</ReactMarkdown>
    </div>
  );
}
```

- [ ] **Step 5: 통과 + 빌드**

Run: `npm test components/MarkdownText.test.tsx` → PASS.
Run: `npm run build` → 성공(react-markdown ESM이 정상 번들되는지 확인). 실패 시 `rm -rf .next` 후 재시도; ESM 관련 오류면 보고.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: 마크다운 렌더 컴포넌트(MarkdownText) 추가"
```

---

## Task 2: 공개 표시에 마크다운 적용

**Files:** Modify `app/(site)/process/page.tsx`, `app/(site)/about/page.tsx`. 검증: `npm test`, `npm run build`

- [ ] **Step 1: `/process` 참여자 카드 — bio를 MarkdownText로 + 카드 폭 조정**

상단에 `import { MarkdownText } from '@/components/MarkdownText';` 추가. people 카드 그리드에서:
- 그리드 최소 폭을 넓힘: `[grid-template-columns:repeat(auto-fit,minmax(130px,1fr))]` → `[grid-template-columns:repeat(auto-fit,minmax(180px,1fr))]`
- 기존 약력 렌더:
```tsx
{m.bio && <span className="text-[12px] font-light text-paper/60 leading-relaxed">{m.bio}</span>}
```
를 아래로 교체:
```tsx
<MarkdownText className="text-[12px] font-light text-paper/70">{m.bio}</MarkdownText>
```
(MarkdownText가 빈 값이면 null이라 `m.bio &&` 불필요.)

- [ ] **Step 2: `/about` 등장인물 카드 — description을 MarkdownText로**

상단에 `import { MarkdownText } from '@/components/MarkdownText';` 추가. 등장인물 카드에서:
```tsx
<p className="text-[13px] font-light leading-[1.95] text-paper/[0.72] m-0">{c.description}</p>
```
를 아래로 교체:
```tsx
<MarkdownText className="text-[13px] font-light text-paper/[0.72]">{c.description}</MarkdownText>
```

- [ ] **Step 3: 테스트 확인/갱신**

`app/(site)/about/page.test.tsx`, `app/(site)/process/page.test.tsx`는 시놉시스·이름·역할 등을 단언하므로 그대로 통과해야 함(설명·약력은 시드에서 비어 있거나 단순 텍스트 → 마크다운 렌더 후에도 `getByText`로 잡힘). 만약 등장인물 설명 텍스트를 단언하는 부분이 있어 `<p>`가 아니라 마크다운 `<p>`로 바뀌어도 `getByText`는 유효. 실패 시 해당 단언만 조정.

Run: `npm test` → 전체 통과. Run: `npm run build` → 성공.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: 참여자 약력과 등장인물 설명을 마크다운으로 표시"
```

---

## Task 3: 관리자 입력칸 확대

**Files:** Modify `lib/adminLists.ts`, `app/admin/lists/ListEditor.tsx`, `app/admin/lists/people/PeopleEditor.tsx`. 검증: `npm test`, `npm run build`

- [ ] **Step 1: `lib/adminLists.ts` — ListColumn에 markdown 옵션 + characters.description 지정**

`ListColumn` 타입에 `markdown?: boolean;` 추가. `characters` 목록의 `description` 컬럼을 `{ key: 'description', label: '설명', type: 'textarea', markdown: true }`로.

- [ ] **Step 2: `app/admin/lists/ListEditor.tsx` — markdown 컬럼은 큰 textarea + 안내**

ListEditor는 **제어(controlled) textarea**(`value` + `onChange`)를 쓴다. 기존 textarea 분기:
```tsx
{c.type === 'textarea' ? (
  <textarea value={row[c.key] ?? ''} onChange={(e) => setVal(row._key, c.key, e.target.value)} rows={2} className="px-3 py-2 bg-stage border border-gold/25 rounded-sm text-paper text-sm outline-none focus:border-gold/60 resize-y" />
) : c.type === 'select' ? (
```
를 아래로 교체(controlled 유지, markdown이면 rows=6 + placeholder + 안내):
```tsx
{c.type === 'textarea' ? (
  <>
    <textarea
      value={row[c.key] ?? ''}
      onChange={(e) => setVal(row._key, c.key, e.target.value)}
      rows={c.markdown ? 6 : 2}
      placeholder={c.markdown ? '마크다운 지원 (예: - 항목)' : undefined}
      className={`px-3 py-2 bg-stage border border-gold/25 rounded-sm text-paper text-sm outline-none focus:border-gold/60 resize-y ${c.markdown ? 'font-mono' : ''}`}
    />
    {c.markdown && <span className="font-mono text-[10px] text-paper/35">마크다운 지원 · 불릿(- ), 굵게(**텍스트**)</span>}
  </>
) : c.type === 'select' ? (
```
(select·text 분기는 그대로. `<label>` 안에 `<span>라벨</span>` 다음 요소로 렌더되므로 fragment로 감싸도 됨.)

- [ ] **Step 3: `app/admin/lists/people/PeopleEditor.tsx` — 약력 textarea 확대 + 안내**

약력 textarea:
```tsx
<textarea value={m.bio} onChange={(e) => setMember(g._key, m._key, 'bio', e.target.value)} placeholder="약력(선택)" aria-label="약력" rows={1} className={`${inputCls} py-1.5 resize-y`} />
```
를 아래로 교체:
```tsx
<textarea
  value={m.bio}
  onChange={(e) => setMember(g._key, m._key, 'bio', e.target.value)}
  placeholder="약력 · 마크다운 지원 (예: - 2025 …)"
  aria-label="약력"
  rows={5}
  className={`${inputCls} py-2 font-mono resize-y`}
/>
```

- [ ] **Step 4: 테스트 + 빌드**

Run: `npm test` → 전체 통과(ListEditor/PeopleEditor 기존 테스트 유지 — aria-label '약력' 등 변화 없음). Run: `npm run build` → 성공.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: 관리자 약력·설명 입력칸 확대와 마크다운 안내 추가"
```

---

## Task 4: 검증 · README

**Files:** Modify `README.md`. 검증만.

- [ ] **Step 1: 전체 테스트 + 빌드**

Run: `npm test` → 전부 통과. Run: `npm run build` → 성공.

- [ ] **Step 2: README 갱신**

- 관리자 절: 참여자 약력·등장인물 설명은 **마크다운**으로 작성(불릿·강조 등), 공개 페이지에 서식대로 표시됨.
- 로드맵: Phase 3B-4(완료), 3C(사진) 예정.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "docs: 약력 마크다운 안내 추가"
```

---

## 후속 (별도 계획)

- **Phase 3C** — 사진 업로드(Storage `images`): characters·people_members의 `photo_url` 채우기.

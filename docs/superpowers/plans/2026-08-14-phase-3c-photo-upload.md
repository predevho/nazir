# 나지르 Phase 3C — 사진 업로드 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 관리자가 등장인물·참여자 사진을 업로드해 `photo_url`을 채우고, 공개 카드에 실제 이미지로 표시한다.

**Architecture:** 파일 선택 시 브라우저에서 canvas로 WebP 압축(긴 변 1200px/품질 0.85) 후 Supabase Storage `images` 버킷에 고정 경로(`characters|people/{id}.webp`)로 즉시 upsert 업로드하고, 반환 public URL을 편집기 state에 담는다. "저장" 시 `saveList`/`savePeople`가 `photo_url`을 DB에 반영한다. 쓰기·삭제는 로그인 세션 + Storage RLS로만 처리.

**Tech Stack:** Next.js 16(App Router), React 19, TypeScript, Tailwind v3, Supabase(@supabase/ssr 브라우저 클라이언트, Storage), Vitest.

---

## 파일 구조

- Create: `supabase/migrations/0003_storage_write_policies.sql` — images 버킷 auth UPDATE·DELETE 정책
- Create: `lib/image/resize.ts` — `computeTargetSize`(순수), `compressToWebp`(canvas)
- Create: `lib/image/resize.test.ts` — `computeTargetSize` 단위 테스트
- Create: `lib/image/upload.ts` — `photoPath`(순수), `uploadEntityPhoto`, `removeEntityPhoto`
- Create: `lib/image/upload.test.ts` — `photoPath` 단위 테스트
- Create: `app/admin/lists/PhotoField.tsx` — 미리보기+선택+제거 공유 컴포넌트
- Modify: `lib/adminLists.ts` — `ListColumn.type`에 `'image'` 추가, characters에 photo_url 컬럼
- Modify: `app/admin/lists/ListEditor.tsx` — image 타입 → PhotoField 렌더
- Modify: `app/admin/lists/actions.ts` — image 컬럼 빈 값 null 처리해 photo_url upsert
- Modify: `app/admin/lists/people/PeopleEditor.tsx` — Member.photoUrl + PhotoField 배치
- Modify: `app/admin/lists/people/actions.ts` — photo_url upsert 포함
- Modify: `app/(site)/about/page.tsx` — 등장인물 카드 photoUrl 렌더
- Modify: `app/(site)/process/page.tsx` — 참여자 `<img>`에 loading="lazy" 추가

---

## Task 1: Storage 쓰기 정책 마이그레이션

**Files:**
- Create: `supabase/migrations/0003_storage_write_policies.sql`

- [ ] **Step 1: 마이그레이션 파일 작성**

`supabase/migrations/0003_storage_write_policies.sql`:

```sql
-- Phase 3C: images 버킷 쓰기 정책 확장(교체=UPDATE, 제거=DELETE)
-- 기존 0001의 public SELECT·auth INSERT 정책은 유지.
drop policy if exists "auth update images" on storage.objects;
drop policy if exists "auth delete images" on storage.objects;

create policy "auth update images"
  on storage.objects for update to authenticated
  using (bucket_id = 'images')
  with check (bucket_id = 'images');

create policy "auth delete images"
  on storage.objects for delete to authenticated
  using (bucket_id = 'images');
```

- [ ] **Step 2: 커밋**

```bash
git add supabase/migrations/0003_storage_write_policies.sql
git commit -m "feat: images 버킷 UPDATE·DELETE 정책 마이그레이션(0003)"
```

> 참고: 이 SQL은 배포된 Supabase에 별도로 적용해야 반영됨(코드만으로는 미반영). 구현 중 자동 적용하지 말 것.

---

## Task 2: 이미지 리사이즈 유틸 (순수 함수 TDD)

**Files:**
- Create: `lib/image/resize.ts`
- Test: `lib/image/resize.test.ts`

- [ ] **Step 1: 실패하는 테스트 작성**

`lib/image/resize.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { computeTargetSize } from './resize';

describe('computeTargetSize', () => {
  it('긴 변이 max를 넘으면 비율을 유지하며 축소한다(가로가 김)', () => {
    expect(computeTargetSize(3000, 2000, 1200)).toEqual({ width: 1200, height: 800 });
  });
  it('세로가 긴 경우도 긴 변 기준으로 축소한다', () => {
    expect(computeTargetSize(2000, 4000, 1200)).toEqual({ width: 600, height: 1200 });
  });
  it('정사각은 max x max로 축소한다', () => {
    expect(computeTargetSize(2400, 2400, 1200)).toEqual({ width: 1200, height: 1200 });
  });
  it('긴 변이 max 이하이면 원본 크기를 유지한다(확대 금지)', () => {
    expect(computeTargetSize(800, 600, 1200)).toEqual({ width: 800, height: 600 });
  });
  it('결과 크기는 정수로 반올림한다', () => {
    expect(computeTargetSize(1000, 333, 1200)).toEqual({ width: 1000, height: 333 });
    expect(computeTargetSize(2500, 833, 1200)).toEqual({ width: 1200, height: 400 });
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npx vitest run lib/image/resize.test.ts`
Expected: FAIL — `computeTargetSize` 미정의(모듈 없음).

- [ ] **Step 3: 최소 구현**

`lib/image/resize.ts`:

```typescript
export type Size = { width: number; height: number };

/** 비율 유지, 긴 변이 max를 초과할 때만 축소(확대 금지). 결과는 정수. */
export function computeTargetSize(width: number, height: number, max: number): Size {
  const longest = Math.max(width, height);
  if (longest <= max) return { width, height };
  const scale = max / longest;
  return { width: Math.round(width * scale), height: Math.round(height * scale) };
}

/** 이미지 File을 WebP Blob으로 압축. 긴 변 max까지 축소(확대 금지). 브라우저 전용. */
export async function compressToWebp(file: File, max = 1200, quality = 0.85): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const { width, height } = computeTargetSize(bitmap.width, bitmap.height, max);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('canvas 컨텍스트를 생성할 수 없습니다.');
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close?.();
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, 'image/webp', quality)
  );
  if (!blob) throw new Error('이미지 압축에 실패했습니다.');
  return blob;
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npx vitest run lib/image/resize.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: 커밋**

```bash
git add lib/image/resize.ts lib/image/resize.test.ts
git commit -m "feat: 이미지 리사이즈 유틸(computeTargetSize·compressToWebp) 추가"
```

---

## Task 3: 업로드 유틸 (경로 순수 함수 TDD + Storage 래퍼)

**Files:**
- Create: `lib/image/upload.ts`
- Test: `lib/image/upload.test.ts`

- [ ] **Step 1: 실패하는 테스트 작성**

`lib/image/upload.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { photoPath } from './upload';

describe('photoPath', () => {
  it('등장인물은 characters/{id}.webp 경로를 만든다', () => {
    expect(photoPath('characters', 'abc-123')).toBe('characters/abc-123.webp');
  });
  it('참여자는 people/{id}.webp 경로를 만든다', () => {
    expect(photoPath('people', 'g1m0')).toBe('people/g1m0.webp');
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npx vitest run lib/image/upload.test.ts`
Expected: FAIL — `photoPath` 미정의.

- [ ] **Step 3: 최소 구현**

`lib/image/upload.ts`:

```typescript
import { createClient } from '@/lib/supabase/client';

export type PhotoKind = 'characters' | 'people';

const BUCKET = 'images';

/** 고정 저장 경로. 포맷은 항상 webp. */
export function photoPath(kind: PhotoKind, id: string): string {
  return `${kind}/${id}.webp`;
}

/** WebP Blob을 고정 경로에 upsert 업로드하고 캐시버스터 붙은 public URL을 반환. */
export async function uploadEntityPhoto(kind: PhotoKind, id: string, blob: Blob): Promise<string> {
  const supabase = createClient();
  const path = photoPath(kind, id);
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, blob, { upsert: true, contentType: 'image/webp' });
  if (error) throw new Error(`업로드 실패: ${error.message}`);
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return `${data.publicUrl}?v=${Date.now()}`;
}

/** Storage 객체 삭제(제거 버튼). 실패는 호출측에서 처리. */
export async function removeEntityPhoto(kind: PhotoKind, id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.storage.from(BUCKET).remove([photoPath(kind, id)]);
  if (error) throw new Error(`삭제 실패: ${error.message}`);
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npx vitest run lib/image/upload.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: 커밋**

```bash
git add lib/image/upload.ts lib/image/upload.test.ts
git commit -m "feat: 사진 업로드 유틸(photoPath·uploadEntityPhoto·removeEntityPhoto) 추가"
```

---

## Task 4: PhotoField 공유 컴포넌트

**Files:**
- Create: `app/admin/lists/PhotoField.tsx`

- [ ] **Step 1: 컴포넌트 작성**

`app/admin/lists/PhotoField.tsx`:

```tsx
'use client';
import { useRef, useState } from 'react';
import { compressToWebp } from '@/lib/image/resize';
import { uploadEntityPhoto, removeEntityPhoto, type PhotoKind } from '@/lib/image/upload';

type Props = {
  kind: PhotoKind;
  id: string;
  value: string;
  onChange: (url: string) => void;
};

export function PhotoField({ kind, id, value, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function handleFile(file: File) {
    setError('');
    if (!file.type.startsWith('image/')) {
      setError('이미지 파일만 업로드할 수 있습니다.');
      return;
    }
    setBusy(true);
    try {
      const blob = await compressToWebp(file);
      const url = await uploadEntityPhoto(kind, id, blob);
      onChange(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : '업로드 중 오류가 발생했습니다.');
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  async function handleRemove() {
    setError('');
    setBusy(true);
    try {
      await removeEntityPhoto(kind, id);
    } catch {
      setError('Storage 파일 삭제에 실패했지만 사진 연결은 해제했습니다.');
    } finally {
      onChange('');
      setBusy(false);
    }
  }

  return (
    <div className="flex items-start gap-3">
      <div className="w-20 h-20 shrink-0 rounded-sm overflow-hidden bg-[repeating-linear-gradient(135deg,#0B0A0E,#0B0A0E_8px,#141019_8px,#141019_16px)] flex items-center justify-center">
        {value ? (
          <img src={value} alt="미리보기" className="w-full h-full object-cover" />
        ) : (
          <span className="font-mono text-[10px] text-paper/40">사진 없음</span>
        )}
      </div>
      <div className="flex flex-col gap-1.5">
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          disabled={busy}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
          }}
          className="text-[12px] text-paper/70 file:mr-2 file:min-h-[32px] file:px-3 file:border file:border-gold/30 file:bg-transparent file:text-gold file:rounded-sm file:text-[12px] file:cursor-pointer"
        />
        <div className="flex items-center gap-2">
          {busy && <span className="text-[11px] text-paper/50">처리 중…</span>}
          {value && !busy && (
            <button type="button" onClick={handleRemove} className="text-[12px] text-red-400/80 hover:text-red-400">
              사진 제거
            </button>
          )}
        </div>
        {error && <span className="text-[11px] text-red-400">{error}</span>}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: 타입체크 통과 확인**

Run: `npx tsc --noEmit`
Expected: PASS (에러 없음).

- [ ] **Step 3: 커밋**

```bash
git add app/admin/lists/PhotoField.tsx
git commit -m "feat: 사진 업로드 공유 컴포넌트 PhotoField 추가"
```

---

## Task 5: 등장인물 편집기에 사진 필드 연결 (adminLists + ListEditor + saveList)

**Files:**
- Modify: `lib/adminLists.ts`
- Modify: `app/admin/lists/ListEditor.tsx`
- Modify: `app/admin/lists/actions.ts`

- [ ] **Step 1: adminLists에 image 타입·컬럼 추가**

`lib/adminLists.ts`의 `ListColumn.type`에 `'image'` 추가:

```typescript
export type ListColumn = {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'image';
  options?: { value: string; label: string }[];
  markdown?: boolean;
};
```

characters 컬럼 배열에 photo_url 항목 추가(name 위, 맨 앞):

```typescript
  characters: {
    key: 'characters',
    table: 'characters',
    title: '주요 등장인물',
    columns: [
      { key: 'photo_url', label: '사진', type: 'image' },
      { key: 'name', label: '이름', type: 'text' },
      { key: 'description', label: '설명', type: 'textarea', markdown: true },
    ],
  },
```

- [ ] **Step 2: ListEditor에서 image 타입 렌더**

`app/admin/lists/ListEditor.tsx` 상단 import에 PhotoField 추가:

```tsx
import { PhotoField } from './PhotoField';
```

`config.columns.map` 내부의 조건 렌더에서 `c.type === 'textarea'` 분기 앞에 image 분기를 추가한다. 기존:

```tsx
              {c.type === 'textarea' ? (
```

를 다음으로 교체:

```tsx
              {c.type === 'image' ? (
                <PhotoField kind="characters" id={row.id} value={row[c.key] ?? ''} onChange={(url) => setVal(row._key, c.key, url)} />
              ) : c.type === 'textarea' ? (
```

- [ ] **Step 3: saveList에서 image 컬럼 null 처리**

`app/admin/lists/actions.ts`의 `desired` 매핑 루프를 수정. 기존:

```typescript
    for (const c of config.columns) row[c.key] = String(r[c.key] ?? '');
```

를 다음으로 교체(image 컬럼은 빈 문자열을 null로):

```typescript
    for (const c of config.columns) {
      const v = String(r[c.key] ?? '');
      row[c.key] = c.type === 'image' ? (v || null) : v;
    }
```

- [ ] **Step 4: 전체 테스트·타입체크**

Run: `npx vitest run && npx tsc --noEmit`
Expected: 기존 테스트 전부 PASS, 타입 에러 없음.

- [ ] **Step 5: 커밋**

```bash
git add lib/adminLists.ts app/admin/lists/ListEditor.tsx app/admin/lists/actions.ts
git commit -m "feat: 등장인물 편집기에 사진 업로드 필드 연결"
```

---

## Task 6: 참여자 편집기에 사진 필드 연결 (PeopleEditor + savePeople)

**Files:**
- Modify: `app/admin/lists/people/page.tsx` — 로더가 photo_url select·전달
- Modify: `app/admin/lists/people/PeopleEditor.tsx`
- Modify: `app/admin/lists/people/actions.ts`

> 참고: 등장인물은 제네릭 로더 `app/admin/lists/[list]/page.tsx`가 `select('*')`라 photo_url이 자동 포함되어 별도 수정 불필요. 참여자 로더만 명시 컬럼이라 수정 필요.

- [ ] **Step 0: people 로더가 photo_url을 읽어 전달**

`app/admin/lists/people/page.tsx`의 members select에 photo_url 추가. 기존:

```tsx
    supabase.from('people_members').select('id,group_id,role,name,bio,sort_order').order('sort_order'),
```

를 다음으로 교체:

```tsx
    supabase.from('people_members').select('id,group_id,role,name,bio,photo_url,sort_order').order('sort_order'),
```

`initialGroups` 매핑의 member 객체에 photo_url 추가. 기존:

```tsx
      .map((m) => ({ id: m.id, role: m.role ?? '', name: m.name ?? '', bio: m.bio ?? '' })),
```

를 다음으로 교체:

```tsx
      .map((m) => ({ id: m.id, role: m.role ?? '', name: m.name ?? '', bio: m.bio ?? '', photo_url: m.photo_url ?? null })),
```

안내 문구에서 "(사진은 다음 단계)" 제거. 기존:

```tsx
      <p className="text-sm text-paper/60 mb-8">그룹·개인 추가 · 수정 · 삭제 · 순서변경 후 저장하면 즉시 반영됩니다. (사진은 다음 단계)</p>
```

를 다음으로 교체:

```tsx
      <p className="text-sm text-paper/60 mb-8">그룹·개인 추가 · 수정 · 삭제 · 순서변경 · 사진 업로드 후 저장하면 즉시 반영됩니다.</p>
```

- [ ] **Step 1: PeopleEditor 타입·상태에 photoUrl 추가**

`app/admin/lists/people/PeopleEditor.tsx` 상단 타입 수정:

```tsx
type Member = { _key: string; id: string; role: string; name: string; bio: BioLine[]; photoUrl: string };
```

`InitialGroup` 타입의 member에 photo_url 추가:

```tsx
export type InitialGroup = { id: string; label: string; members: { id: string; role: string; name: string; bio: string; photo_url: string | null }[] };
```

import에 PhotoField 추가:

```tsx
import { PhotoField } from '../PhotoField';
```

초기화 매핑에서 photoUrl 채우기(기존 `bio: parseBio(m.bio)` 뒤에 추가):

```tsx
      members: g.members.map((m) => ({ _key: makeId(), id: m.id, role: m.role, name: m.name, bio: parseBio(m.bio), photoUrl: m.photo_url ?? '' })),
```

`addMember`의 새 멤버 객체에 photoUrl 추가:

```tsx
    setG((gs) => gs.map((g) => (g._key === gk ? { ...g, members: [...g.members, { _key: id, id, role: '', name: '', bio: [], photoUrl: '' }] } : g)));
```

photoUrl 갱신 헬퍼 추가(setBio 함수 근처):

```tsx
  function setPhoto(gk: string, mk: string, url: string) {
    updateMember(gk, mk, (m) => ({ ...m, photoUrl: url }));
  }
```

payload에 photoUrl 포함(기존 members 매핑 수정):

```tsx
    members: g.members.map((m) => ({ id: m.id, role: m.role, name: m.name, bio: serializeBio(m.bio), photoUrl: m.photoUrl })),
```

- [ ] **Step 2: 멤버 행에 PhotoField 배치**

`PeopleEditor.tsx`에서 멤버 블록의 role/name 입력 `<div className="flex gap-2 items-center">...</div>` 바로 다음 줄(약력 `<div>` 앞)에 삽입:

```tsx
                <PhotoField kind="people" id={m.id} value={m.photoUrl} onChange={(url) => setPhoto(g._key, m._key, url)} />
```

- [ ] **Step 3: savePeople에 photo_url 반영**

`app/admin/lists/people/actions.ts`의 `InMember` 타입에 photoUrl 추가:

```typescript
type InMember = { id?: string; role?: string; name?: string; bio?: string; photoUrl?: string };
```

`desiredMembers` 배열 타입에 photo_url 추가:

```typescript
  const desiredMembers: { id: string; group_id: string; role: string; name: string; bio: string; photo_url: string | null; sort_order: number }[] = [];
```

`desiredMembers.push({...})`에 photo_url 추가(기존 `bio` 라인 뒤):

```typescript
        photo_url: String(m.photoUrl ?? '') || null,
```

- [ ] **Step 4: 전체 테스트·타입체크**

Run: `npx vitest run && npx tsc --noEmit`
Expected: 전부 PASS, 타입 에러 없음.

- [ ] **Step 5: 커밋**

```bash
git add app/admin/lists/people/PeopleEditor.tsx app/admin/lists/people/actions.ts
git commit -m "feat: 참여자 편집기에 사진 업로드 필드 연결"
```

---

## Task 7: 공개 카드 이미지 렌더

**Files:**
- Modify: `app/(site)/about/page.tsx`
- Modify: `app/(site)/process/page.tsx`

- [ ] **Step 1: about 등장인물 카드 렌더 교체**

`app/(site)/about/page.tsx`의 등장인물 카드 사진 영역. 기존:

```tsx
              <div className="aspect-square bg-[repeating-linear-gradient(135deg,#0B0A0E,#0B0A0E_8px,#141019_8px,#141019_16px)] flex items-center justify-center">
                <span className="font-mono text-[10px] text-paper/40">배우 사진 1:1</span>
              </div>
```

를 다음으로 교체:

```tsx
              <div className="aspect-square overflow-hidden bg-[repeating-linear-gradient(135deg,#0B0A0E,#0B0A0E_8px,#141019_8px,#141019_16px)] flex items-center justify-center">
                {c.photoUrl ? (
                  <img src={c.photoUrl} alt={c.name} loading="lazy" className="w-full h-full object-cover" />
                ) : (
                  <span className="font-mono text-[10px] text-paper/40">배우 사진 1:1</span>
                )}
              </div>
```

- [ ] **Step 2: process 참여자 이미지에 lazy 로딩 추가**

`app/(site)/process/page.tsx`의 참여자 이미지. 기존:

```tsx
                      <img src={m.photoUrl} alt={m.name} className="w-full h-full object-cover" />
```

를 다음으로 교체:

```tsx
                      <img src={m.photoUrl} alt={m.name} loading="lazy" className="w-full h-full object-cover" />
```

- [ ] **Step 3: 전체 테스트·타입체크·빌드**

Run: `npx vitest run && npx tsc --noEmit && npm run build`
Expected: 테스트 전부 PASS, 타입 에러 없음, 빌드 성공.

- [ ] **Step 4: 커밋**

```bash
git add "app/(site)/about/page.tsx" "app/(site)/process/page.tsx"
git commit -m "feat: 공개 카드에 등장인물·참여자 사진 렌더"
```

---

## Task 8: 문서 갱신 (README 로드맵)

**Files:**
- Modify: `README.md`

- [ ] **Step 1: README에 Phase 3C 완료 반영**

`README.md`에서 진행 단계/로드맵 섹션에 Phase 3C(사진 업로드) 완료를 추가하고, 마이그레이션 목록에 `0003_storage_write_policies.sql`(배포 Supabase에 수동 적용 필요)을 명시한다. 기존 문서의 표기 형식(다른 Phase 항목)과 동일한 스타일로 한 줄 추가.

- [ ] **Step 2: 커밋**

```bash
git add README.md
git commit -m "docs: Phase 3C(사진 업로드) 완료 및 0003 마이그레이션 안내 반영"
```

---

## 최종 검증

- [ ] `npx vitest run` — 기존 42개 + 신규 7개(resize 5 + upload 2) 전부 PASS
- [ ] `npx tsc --noEmit` — 타입 에러 없음
- [ ] `npm run build` — 빌드 성공
- [ ] (선택) 깨끗한 프로덕션 서버(포트 3100)로 관리자 업로드 → 공개 카드 표시 QA
- [ ] 배포 Supabase에 `0003_storage_write_policies.sql` 수동 적용 안내

> 개발 서버(next dev)는 서브에이전트가 띄우지 말 것. 구조 변경 후 확인이 필요하면 `rm -rf .next && npm run build && npx next start -p 3100`로 프로덕션 QA.

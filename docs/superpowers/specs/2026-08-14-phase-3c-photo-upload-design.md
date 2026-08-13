# 나지르 Phase 3C — 사진 업로드 설계

작성일: 2026-08-14
상태: 확정 (구현 대기)

## 목표

등장인물(`characters`)과 참여자(`people_members`)의 사진을 관리자가 업로드해
`photo_url`을 채우고, 공개 카드(`/about` 등장인물, `/process` 참여자)에 실제 이미지로 표시한다.
보안은 로그인 세션 + Supabase Storage RLS로만 처리하며 service_role은 사용하지 않는다.

## 결정 사항 요약

| 항목 | 결정 |
|---|---|
| 업로드 시점 | 파일 선택 **즉시** 브라우저 클라이언트로 Storage 업로드. "저장"은 `photo_url`만 DB 반영 |
| 저장 경로 | 등장인물 `characters/{id}.webp`, 참여자 `people/{id}.webp` (고정 경로) |
| 교체 방식 | 포맷을 WebP로 통일 → 확장자 고정 `.webp` → `upsert:true`로 덮어쓰기 |
| 캐시 무효화 | DB에 `.../{id}.webp?v={업로드시각}` 쿼리 부여 |
| 렌더 방식 | 일반 `<img loading="lazy">` (process 카드와 일관, next/image 미사용) |
| 화질 대책 | 업로드 시 클라이언트 압축: 긴 변 최대 1200px(확대 금지), 품질 0.85, WebP |
| 제거 시 | `photo_url`을 null로 + Storage 객체 `remove()` |

### 화질 근거
카드 표시 크기는 정사각 약 180~240px(레티나 2x 고려 시 필요 원본 ~480px).
긴 변 1200px은 표시 필요량의 2배 이상이라 카드에서 원본과 육안 구분 불가.
손실되는 것은 사이트가 보여주지 않는 초과 픽셀뿐. 결과 파일 통상 150~400KB.

## 아키텍처

### 신규 유틸

**`lib/image/resize.ts`**
- `computeTargetSize(width, height, max): { width, height }` — 순수 함수.
  비율 유지, 긴 변이 `max` 초과 시에만 축소, `max` 이하면 원본 크기 그대로(확대 금지).
- `compressToWebp(file, max=1200, quality=0.85): Promise<Blob>` —
  `createImageBitmap` + canvas로 `computeTargetSize` 크기로 그린 뒤 `toBlob('image/webp', quality)`.

**`lib/image/upload.ts`**
- `type PhotoKind = 'characters' | 'people'`
- `photoPath(kind, id): string` — `${kind}/${id}.webp` (순수 함수, 테스트 대상).
- `uploadEntityPhoto(kind, id, blob): Promise<string>` —
  브라우저 Supabase 클라이언트(`lib/supabase/client.ts`)로 `images` 버킷에
  `upload(path, blob, { upsert: true, contentType: 'image/webp' })` →
  `getPublicUrl(path)` → `${publicUrl}?v=${Date.now()}` 반환.
- `removeEntityPhoto(kind, id): Promise<void>` — `storage.from('images').remove([path])`.

### 신규 컴포넌트

**`app/admin/lists/PhotoField.tsx`** (클라이언트, 두 편집기 공유)
- props: `{ kind: PhotoKind; id: string; value: string; onChange(url: string): void }`
- UI: 정사각 미리보기(값 있으면 `<img>`, 없으면 "사진 없음" placeholder) +
  "사진 선택"(`<input type="file" accept="image/*">`) + 값 있으면 "제거" 버튼.
- 동작:
  - 선택 → `image/*` 아니면 인라인 에러 후 중단.
  - `compressToWebp` → `uploadEntityPhoto` → 성공 시 `onChange(url)`, 실패 시 인라인 에러.
  - 업로드 중 스피너/비활성. 다른 필드 편집을 막지 않음.
  - "제거" → `removeEntityPhoto` 시도(실패해도 진행) → `onChange('')`.

### 편집기 연결

**등장인물 — 제네릭 경로**
- `lib/adminLists.ts`의 `ListColumn.type`에 `'image'` 추가.
- characters 컬럼에 `{ key: 'photo_url', label: '사진', type: 'image' }` 추가.
- `ListEditor.tsx`: `c.type === 'image'`이면 `<PhotoField kind="characters" id={row.id} value={row[c.key]} onChange=... />` 렌더.

**참여자 — 전용 경로**
- `PeopleEditor.tsx`: `Member`에 `photoUrl: string` 추가, 초기화/파생 payload에 포함.
  멤버 행에 `<PhotoField kind="people" id={m.id} ... />` 배치.

### 저장 액션

**`app/admin/lists/actions.ts` (`saveList`)**
- image 타입 컬럼은 빈 문자열을 `null`로 변환하여 `photo_url` upsert에 포함.
  (기타 컬럼은 기존 `String(...)` 유지.)

**`app/admin/lists/people/actions.ts` (`savePeople`)**
- `desiredMembers`에 `photo_url: String(m.photoUrl ?? '') || null` 포함하여 upsert.

### 공개 렌더

- `app/(site)/about/page.tsx`: 등장인물 카드의 정적 placeholder를
  `c.photoUrl ? <img src={c.photoUrl} alt={c.name} loading="lazy" className="w-full h-full object-cover"/> : <span>배우 사진 1:1</span>`로 교체.
- `app/(site)/process/page.tsx`: 이미 `m.photoUrl` 렌더 중 → 변경 없음
  (일관성 위해 `<img>`에 `loading="lazy"`만 추가).

### 데이터 흐름

```
[관리자 편집기]
  파일 선택
   → compressToWebp (canvas, 1200px/0.85/webp)
   → uploadEntityPhoto (images 버킷, {id}.webp, upsert)
   → publicUrl?v=ts
   → PhotoField.onChange(url) → 편집기 state.photoUrl
  "저장"
   → saveList / savePeople upsert(photo_url) → DB
   → revalidatePath('/', 'layout')

[공개 페이지] getContent() → photoUrl → <img>
```

## 마이그레이션 `supabase/migrations/0003_storage_write_policies.sql`

`images` 버킷에 authenticated UPDATE·DELETE 정책 추가(기존 public SELECT·auth INSERT 유지).

```sql
drop policy if exists "auth update images" on storage.objects;
drop policy if exists "auth delete images" on storage.objects;
create policy "auth update images"
  on storage.objects for update to authenticated
  using (bucket_id = 'images') with check (bucket_id = 'images');
create policy "auth delete images"
  on storage.objects for delete to authenticated
  using (bucket_id = 'images');
```

## 에러 처리

- 업로드 전 파일 타입(`image/*`) 검증 실패 → 필드별 인라인 에러, 중단.
- 압축·업로드 실패 → 인라인 에러 표시, 다른 편집 계속 가능.
- 제거 시 Storage 삭제 실패 → URL은 비우고(사용자 의도 우선) 경고만.
- 저장 액션은 기존과 동일하게 인증 없으면 `/admin/login` 리다이렉트.

## 보안

- 모든 쓰기·업로드는 로그인 세션 + Storage RLS(auth INSERT/UPDATE/DELETE, public SELECT).
- service_role·비공개 키 미사용. 경로는 `{id}.webp`로 고정, id는 서버 발급 UUID.

## 테스트

- `lib/image/resize.test.ts`: `computeTargetSize` — 초과 축소/비율 유지/확대 금지/정사각·가로·세로 케이스.
- `lib/image/upload.test.ts`: `photoPath` — kind/id 조합 경로.
- 기존 `lib/content.test.ts`의 `photoUrl` 매핑 유지.
- canvas 인코딩(`compressToWebp`)·업로드 네트워크는 jsdom 한계로 단위 테스트 제외(순수 로직만 검증).
- 전체: 기존 42개 + 신규 유지, `npm test`·`npm run build` 통과.

## 범위 밖 (YAGNI)

- 원본 크게 보기(라이트박스) — 현재 카드에 확대 기능 없음.
- next/image·이미지 최적화 서버.
- 다중 사진/갤러리, 드래그 앤 드롭 업로드, 크롭 UI.
- 고아 파일 정리 작업(교체는 덮어쓰기, 제거는 즉시 삭제라 고아 최소).
```

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

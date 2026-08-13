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

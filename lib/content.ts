import { content } from '../content/data';
import type { AllContent } from '../content/types';

/** Phase 1: 로컬 데이터. Phase 2: Supabase에서 읽어 동일 형태로 반환. */
export async function getContent(): Promise<AllContent> {
  return content;
}

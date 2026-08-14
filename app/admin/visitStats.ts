import { createClient } from '@/lib/supabase/server';
import type { VisitStats } from '@/lib/visits';

/** 관리자용 방문 통계. 미적용/오류 시 null. */
export async function getVisitStats(): Promise<VisitStats | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc('get_visit_stats');
    if (error || !data) return null;
    return data as VisitStats;
  } catch {
    return null;
  }
}

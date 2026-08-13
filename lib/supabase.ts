import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * 서버 전용 읽기 클라이언트. env가 모두 있을 때만 생성하고, 없으면 null(로컬 폴백 신호).
 * 공개(anon) 읽기만 하므로 세션을 유지하지 않는다(ISR 캐싱 가능).
 */
export function createServerClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;
  return createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

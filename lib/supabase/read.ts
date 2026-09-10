import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * 공개 콘텐츠를 읽는 클라이언트. env가 모두 있을 때만 만들고, 없으면 null 을 준다
 * (로컬 폴백 신호 — content/data.ts 시드로 떨어진다).
 *
 * 세션을 유지하지 않아 ISR 캐싱이 가능하다. 로그인이 필요한 읽기·쓰기는
 * 같은 폴더의 server.ts(쿠키를 실어 나르는 SSR 클라이언트)를 쓴다.
 *
 * 예전 이름은 `lib/supabase.ts` 의 `createServerClient` 였다. 폴더와 파일이 같은
 * 이름으로 공존하는 데다, server.ts 의 export 이름은 `createClient` 라서
 * 어느 쪽이 무엇인지 이름만으로는 알 수 없었다.
 */
export function createReadClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;
  return createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

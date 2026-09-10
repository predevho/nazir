import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options));
        },
      },
    }
  );

  // createServerClient와 getUser() 사이에 다른 코드를 넣지 말 것(세션 랜덤 로그아웃 방지).
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && !request.nextUrl.pathname.startsWith('/admin/login')) {
    const url = request.nextUrl.clone();
    url.pathname = '/admin/login';
    const redirectResponse = NextResponse.redirect(url);
    /*
      갱신된 쿠키를 새 응답으로 옮겨 담는다.

      위의 getUser() 가 토큰을 갱신했다면 그 쿠키는 supabaseResponse 에만 담겨 있다.
      여기서 응답을 새로 만들면서 옮기지 않으면 갱신분이 통째로 버려지고, 브라우저는
      낡은 토큰을 계속 들고 온다 — 이유 없이 로그아웃되는 것처럼 보인다.
    */
    supabaseResponse.cookies.getAll().forEach((cookie) => redirectResponse.cookies.set(cookie));
    return redirectResponse;
  }

  return supabaseResponse;
}

/**
 * 관리자 로그인은 UI에서 "아이디"만 입력받고, 내부적으로 고정 도메인을 붙여
 * Supabase Auth(이메일 기반)에 로그인한다. 사용자는 도메인을 보거나 입력하지 않는다.
 * 예) 아이디 "nazir1234" → 내부 이메일 "nazir1234@nazir.local"
 */
export const ADMIN_EMAIL_DOMAIN = 'nazir.local';

/** 아이디 → 내부 로그인 이메일 (공백 제거 + 소문자화로 계정 생성/로그인 표기를 일치시킨다). */
export function usernameToEmail(username: string): string {
  return `${username.trim().toLowerCase()}@${ADMIN_EMAIL_DOMAIN}`;
}

/** 내부 이메일 → 표시용 아이디 (대시보드에서 도메인을 숨겨 아이디만 보여준다). */
export function emailToUsername(email: string): string {
  const suffix = `@${ADMIN_EMAIL_DOMAIN}`;
  return email.endsWith(suffix) ? email.slice(0, -suffix.length) : email;
}

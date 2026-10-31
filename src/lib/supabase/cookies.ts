import type { CookieOptions } from "@supabase/ssr";

/**
 * 로그인을 브라우저 세션 쿠키로 저장해 브라우저를 닫으면 끝나게 한다.
 * @supabase/ssr이 cookieOptions의 maxAge를 400일로 덮어쓰므로 쓰기 직전에 뺀다. 삭제용 maxAge 0은 유지한다.
 */
export function toSessionCookie(options: CookieOptions): CookieOptions {
  if (options.maxAge === 0) return options;
  const cookie = { ...options };
  delete cookie.maxAge;
  delete cookie.expires;
  return cookie;
}

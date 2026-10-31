import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { toSessionCookie } from "./cookies";
import { getSupabaseEnv, hasSupabaseEnv } from "./env";

/**
 * 요청마다 Supabase 세션 쿠키를 갱신한다.
 * 화면 접근 권한은 여기서 결정하지 않는다. 권한은 서버 API와 DB RLS에서 검증한다.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  if (!hasSupabaseEnv()) return response;

  const { url, key } = getSupabaseEnv();
  const supabase = createServerClient(
    url,
    key,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, toSessionCookie(options)));
        },
      },
    },
  );

  // getClaims()가 토큰을 로컬에서 검증하고 필요하면 갱신한다. 이 호출을 지우면 세션이 만료된다.
  await supabase.auth.getClaims();

  return response;
}

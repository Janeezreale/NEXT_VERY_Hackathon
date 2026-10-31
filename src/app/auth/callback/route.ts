import { NextResponse, type NextRequest } from "next/server";

import { homePathForRole } from "@/src/app/(auth)/_lib/validation";
import { hasSupabaseEnv } from "@/src/lib/supabase/env";
import { createClient } from "@/src/lib/supabase/server";

/**
 * 가입 인증 메일 링크(PKCE code)를 세션으로 교환한다.
 * 성공하면 역할별 첫 화면, 실패하면 로그인 화면에 안내를 띄운다.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");

  if (code && hasSupabaseEnv()) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(new URL(homePathForRole(data.user?.user_metadata?.role), origin));
    }
  }

  return NextResponse.redirect(new URL("/login?error=confirm", origin));
}

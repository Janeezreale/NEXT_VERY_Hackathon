import { createBrowserClient, parseCookieHeader, serializeCookieHeader } from "@supabase/ssr";

import { toSessionCookie } from "./cookies";
import { getSupabaseEnv } from "./env";

/** 클라이언트 컴포넌트용 Supabase 클라이언트 */
export function createClient() {
  const { url, key } = getSupabaseEnv();
  return createBrowserClient(url, key, {
    cookies: {
      getAll() {
        return parseCookieHeader(document.cookie).map(({ name, value }) => ({ name, value: value ?? "" }));
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          document.cookie = serializeCookieHeader(name, value, toSessionCookie(options));
        });
      },
    },
  });
}

import { createBrowserClient } from "@supabase/ssr";

import { getSupabaseEnv } from "./env";

/** 클라이언트 컴포넌트용 Supabase 클라이언트 */
export function createClient() {
  const { url, key } = getSupabaseEnv();
  return createBrowserClient(url, key);
}

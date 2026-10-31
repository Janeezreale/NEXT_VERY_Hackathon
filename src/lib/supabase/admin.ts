import "server-only";

import { createClient } from "@supabase/supabase-js";

import { getSupabaseEnv } from "./env";

/**
 * 서버 전용 키로 RLS를 우회하는 클라이언트. 예약 생성처럼 서버가 계산한 값을 저장할 때만 쓴다.
 * 호출하는 쪽에서 사용자와 소유권을 먼저 확인한다.
 */
export function createAdminClient() {
  const secretKey = process.env.SUPABASE_SECRET_KEY;
  if (!secretKey) throw new Error("SUPABASE_SECRET_KEY가 없습니다. .env.local을 확인하세요.");
  return createClient(getSupabaseEnv().url, secretKey, { auth: { persistSession: false, autoRefreshToken: false } });
}

import "server-only";

import { userRoleSchema } from "../schemas/api";
import { createClient } from "../supabase/server";
import { ApiError } from "./api";

/** 세션과 profiles에서 사용자를 확인한다. user_metadata.role은 사용자가 바꿀 수 있으므로 권한 근거로 쓰지 않는다. */
export async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new ApiError("UNAUTHENTICATED", "로그인이 필요해요.");

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role, region_code")
    .eq("id", user.id)
    .single();
  if (error) throw error;

  return {
    supabase,
    id: user.id,
    role: userRoleSchema.parse(profile.role),
    regionCode: profile.region_code as string | null,
  };
}

export async function requireSeller() {
  const user = await requireUser();
  if (user.role !== "seller") throw new ApiError("FORBIDDEN", "판매자만 사용할 수 있어요.");
  return user;
}

import { ok, route } from "../../../lib/server/api";
import { requireUser } from "../../../lib/server/auth";
import type { Me } from "../../../types/api";

export const GET = route(async () => {
  const { supabase, id, role, regionCode } = await requireUser();

  let hasStore = false;
  if (role === "seller") {
    const { data, error } = await supabase.from("stores").select("id").eq("owner_id", id).maybeSingle();
    if (error) throw error;
    hasStore = data !== null;
  }

  return ok<Me>({ id, role, regionCode, hasStore });
});

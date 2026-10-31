import { ok, route } from "../../../lib/server/api";
import { listMappedStores } from "../../../lib/server/store";
import { createClient } from "../../../lib/supabase/server";

/** 지도에 표시할 수 있는 매장 목록. 비로그인도 조회한다. */
export const GET = route(async () => {
  return ok({ items: await listMappedStores(await createClient()) });
});

import { reportQuerySchema } from "../../../../lib/schemas/api";
import { ok, parseInput, route } from "../../../../lib/server/api";
import { loadReport } from "../../../../lib/server/report";
import { requireSellerStore } from "../../../../lib/server/store";

export const GET = route(async (request) => {
  const { supabase, store } = await requireSellerStore();
  const { days } = parseInput(reportQuerySchema, Object.fromEntries(new URL(request.url).searchParams));
  return ok(await loadReport(supabase, store.id, days));
});

import { reservationListQuerySchema } from "../../../../lib/schemas/api";
import { ok, parseInput, route } from "../../../../lib/server/api";
import { listReservations } from "../../../../lib/server/reservation";
import { requireSellerStore } from "../../../../lib/server/store";

export const GET = route(async (request) => {
  const { supabase, store } = await requireSellerStore();
  const query = parseInput(reservationListQuerySchema, Object.fromEntries(new URL(request.url).searchParams));
  return ok(await listReservations(supabase, { storeId: store.id }, query));
});

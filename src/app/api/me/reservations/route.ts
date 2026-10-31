import { reservationListQuerySchema } from "../../../../lib/schemas/api";
import { ok, parseInput, route } from "../../../../lib/server/api";
import { requireUser } from "../../../../lib/server/auth";
import { listReservations } from "../../../../lib/server/reservation";

export const GET = route(async (request) => {
  const { supabase, id } = await requireUser();
  const query = parseInput(reservationListQuerySchema, Object.fromEntries(new URL(request.url).searchParams));
  return ok(await listReservations(supabase, { consumerId: id }, query));
});

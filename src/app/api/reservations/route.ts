import { reservationCreateSchema } from "../../../lib/schemas/api";
import { ApiError, ok, parseJson, route } from "../../../lib/server/api";
import { requireUser } from "../../../lib/server/auth";
import { createReservation } from "../../../lib/server/reservation";

export const POST = route(async (request) => {
  const { supabase, id, role } = await requireUser();
  if (role !== "consumer") throw new ApiError("FORBIDDEN", "소비자만 예약할 수 있어요.");
  const input = await parseJson(request, reservationCreateSchema);
  return ok(await createReservation(supabase, id, input), 201);
});

import { z } from "zod";

import { ApiError, ok, route } from "../../../../../lib/server/api";
import { requireUser } from "../../../../../lib/server/auth";
import { changeReservationStatus } from "../../../../../lib/server/reservation";

export const POST = route<{ params: Promise<{ id: string }> }>(async (_request, { params }) => {
  const { supabase } = await requireUser();
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) throw new ApiError("NOT_FOUND", "예약을 찾을 수 없어요.");
  return ok(await changeReservationStatus(supabase, id, "cancel"));
});

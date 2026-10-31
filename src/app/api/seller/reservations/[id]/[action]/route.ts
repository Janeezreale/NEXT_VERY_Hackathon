import { z } from "zod";

import { ApiError, ok, route } from "../../../../../../lib/server/api";
import { requireSeller } from "../../../../../../lib/server/auth";
import { changeReservationStatus, SELLER_ACTIONS } from "../../../../../../lib/server/reservation";

const actionSchema = z.enum(Object.keys(SELLER_ACTIONS) as [keyof typeof SELLER_ACTIONS]);

export const POST = route<{ params: Promise<{ id: string; action: string }> }>(async (_request, { params }) => {
  const { supabase } = await requireSeller();
  const { id, action } = await params;
  const parsedAction = actionSchema.safeParse(action);
  if (!parsedAction.success || !z.uuid().safeParse(id).success) {
    throw new ApiError("NOT_FOUND", "예약을 찾을 수 없어요.");
  }
  return ok(await changeReservationStatus(supabase, id, SELLER_ACTIONS[parsedAction.data]));
});

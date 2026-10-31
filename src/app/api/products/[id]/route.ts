import { z } from "zod";

import { ApiError, ok, route } from "../../../../lib/server/api";
import { findPublicProduct } from "../../../../lib/server/product";
import { createClient } from "../../../../lib/supabase/server";

export const GET = route<{ params: Promise<{ id: string }> }>(async (_request, { params }) => {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) throw new ApiError("NOT_FOUND", "상품을 찾을 수 없어요.");
  return ok(await findPublicProduct(await createClient(), id));
});

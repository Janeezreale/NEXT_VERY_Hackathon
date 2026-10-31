import { z } from "zod";

import { productUpdateSchema } from "../../../../../lib/schemas/api";
import { ApiError, ok, parseJson, route } from "../../../../../lib/server/api";
import { requireSeller } from "../../../../../lib/server/auth";
import { deleteProduct, updateProduct } from "../../../../../lib/server/product";

type Context = { params: Promise<{ id: string }> };

async function productId({ params }: Context) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) throw new ApiError("NOT_FOUND", "상품을 찾을 수 없어요.");
  return id;
}

export const PATCH = route<Context>(async (request, context) => {
  const { supabase } = await requireSeller();
  const id = await productId(context);
  return ok(await updateProduct(supabase, id, await parseJson(request, productUpdateSchema)));
});

export const DELETE = route<Context>(async (_request, context) => {
  const { supabase } = await requireSeller();
  await deleteProduct(supabase, await productId(context));
  return ok(null);
});

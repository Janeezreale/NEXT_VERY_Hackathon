import { z } from "zod";

import { productUpdateSchema } from "../../../../../lib/schemas/api";
import { ApiError, ok, parseJson, route } from "../../../../../lib/server/api";
import { assertOwnImage, assertSaleEnd, deleteProduct, removeUnusedImages, replaceProductImage, updateProduct } from "../../../../../lib/server/product";
import { requireSellerStore } from "../../../../../lib/server/store";

type Context = { params: Promise<{ id: string }> };

async function productId({ params }: Context) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) throw new ApiError("NOT_FOUND", "상품을 찾을 수 없어요.");
  return id;
}

export const PATCH = route<Context>(async (request, context) => {
  const { supabase, store } = await requireSellerStore();
  const id = await productId(context);
  const input = await parseJson(request, productUpdateSchema);
  assertSaleEnd(input.saleEndsAt, store.closingTime);
  if (input.imagePath) assertOwnImage(input.imagePath, store.id);
  const product = await updateProduct(supabase, id, input);
  if (input.imagePath !== undefined) await replaceProductImage(supabase, id, input.imagePath);
  await removeUnusedImages(supabase, store.id);
  return ok(product);
});

export const DELETE = route<Context>(async (_request, context) => {
  const { supabase } = await requireSellerStore();
  await deleteProduct(supabase, await productId(context));
  return ok(null);
});

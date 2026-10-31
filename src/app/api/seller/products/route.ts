import { listQuerySchema, productCreateSchema } from "../../../../lib/schemas/api";
import { ok, parseInput, parseJson, route } from "../../../../lib/server/api";
import { assertOwnImage, listSellerProducts, PRODUCT_COLUMNS, toSellerProduct, type ProductRow } from "../../../../lib/server/product";
import { requireSellerStore } from "../../../../lib/server/store";

export const GET = route(async (request) => {
  const { supabase, store } = await requireSellerStore();
  const params = Object.fromEntries(new URL(request.url).searchParams);
  return ok(await listSellerProducts(supabase, store.id, parseInput(listQuerySchema, params)));
});

export const POST = route(async (request) => {
  const { supabase, store } = await requireSellerStore();
  const input = await parseJson(request, productCreateSchema);
  if (input.imagePath) assertOwnImage(input.imagePath, store.id);
  const { data, error } = await supabase
    .from("products")
    .insert({
      store_id: store.id,
      name: input.name,
      unit: input.unit,
      available_quantity: input.quantity,
      base_price: input.basePrice,
      min_price: input.minPrice,
      freshness: input.freshness,
      sale_ends_at: input.saleEndsAt,
    })
    .select(PRODUCT_COLUMNS)
    .single();
  if (error) throw error;
  const product = toSellerProduct(data as ProductRow);
  if (input.imagePath) {
    const { error: imageError } = await supabase.from("product_images").insert({ product_id: product.id, storage_path: input.imagePath });
    if (imageError) throw imageError;
  }
  return ok(product, 201);
});

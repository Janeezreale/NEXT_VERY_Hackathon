import { productListQuerySchema } from "../../../lib/schemas/api";
import { ok, parseInput, route } from "../../../lib/server/api";
import { listPublicProducts } from "../../../lib/server/product";
import { createClient } from "../../../lib/supabase/server";

export const GET = route(async (request) => {
  const query = parseInput(productListQuerySchema, Object.fromEntries(new URL(request.url).searchParams));
  return ok(await listPublicProducts(await createClient(), query));
});

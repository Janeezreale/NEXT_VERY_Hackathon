import { geocodeQuerySchema } from "../../../../lib/schemas/api";
import { ok, parseInput, route } from "../../../../lib/server/api";
import { requireSeller } from "../../../../lib/server/auth";
import { searchAddress } from "../../../../lib/server/geocoding";

/** 네이버 호출량을 쓰는 API라 로그인한 판매자만 호출한다. */
export const GET = route(async (request) => {
  await requireSeller();
  const { query } = parseInput(geocodeQuerySchema, Object.fromEntries(new URL(request.url).searchParams));
  return ok({ items: await searchAddress(query) });
});

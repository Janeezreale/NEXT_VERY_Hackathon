import { storeCreateSchema, storeUpdateSchema } from "../../../../lib/schemas/api";
import { ApiError, ok, parseJson, route } from "../../../../lib/server/api";
import { requireSeller } from "../../../../lib/server/auth";
import { findStore, STORE_COLUMNS, toStore, type StoreRow } from "../../../../lib/server/store";

const UNIQUE_VIOLATION = "23505";

export const GET = route(async () => {
  const { supabase, id } = await requireSeller();
  const store = await findStore(supabase, id);
  if (!store) throw new ApiError("NOT_FOUND", "등록한 매장이 없어요.");
  return ok(store);
});

export const POST = route(async (request) => {
  const { supabase, id } = await requireSeller();
  const input = await parseJson(request, storeCreateSchema);
  const { data, error } = await supabase
    .from("stores")
    .insert({
      owner_id: id,
      name: input.name,
      region_code: input.regionCode,
      address: input.address,
      closing_time: input.closingTime,
      latitude: input.latitude ?? null,
      longitude: input.longitude ?? null,
    })
    .select(STORE_COLUMNS)
    .single();
  if (error?.code === UNIQUE_VIOLATION) throw new ApiError("STORE_EXISTS", "이미 등록한 매장이 있어요.");
  if (error) throw error;
  return ok(toStore(data as StoreRow), 201);
});

export const PATCH = route(async (request) => {
  const { supabase, id } = await requireSeller();
  const input = await parseJson(request, storeUpdateSchema);
  // 좌표 없이 주소만 바꾸면 예전 위치가 남지 않도록 좌표를 비운다.
  const clearedCoordinate = input.address === undefined ? undefined : null;
  const { data, error } = await supabase
    .from("stores")
    .update({
      name: input.name,
      region_code: input.regionCode,
      address: input.address,
      closing_time: input.closingTime,
      latitude: input.latitude === undefined ? clearedCoordinate : input.latitude,
      longitude: input.longitude === undefined ? clearedCoordinate : input.longitude,
    })
    .eq("owner_id", id)
    .select(STORE_COLUMNS)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new ApiError("NOT_FOUND", "등록한 매장이 없어요.");
  return ok(toStore(data as StoreRow));
});

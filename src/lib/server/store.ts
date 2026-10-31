import "server-only";

import { redirect } from "next/navigation";
import { cache } from "react";
import { z } from "zod";

import type { MappedStore, Store } from "../../types/api";
import { createClient } from "../supabase/server";
import { ApiError } from "./api";
import { requireSeller } from "./auth";

export const STORE_COLUMNS = "id, name, region_code, address, opening_time, closing_time, description, phone, latitude, longitude";
const MAPPED_STORE_LIMIT = 200;

type Supabase = Awaited<ReturnType<typeof createClient>>;

export type StoreRow = {
  id: string;
  name: string;
  region_code: string;
  address: string;
  opening_time: string;
  closing_time: string;
  description: string | null;
  phone: string | null;
  latitude: number | null;
  longitude: number | null;
};

export function toStore(row: StoreRow): Store {
  return {
    id: row.id,
    name: row.name,
    regionCode: row.region_code,
    address: row.address,
    openingTime: row.opening_time.slice(0, 5),
    closingTime: row.closing_time.slice(0, 5),
    description: row.description,
    phone: row.phone,
    latitude: row.latitude,
    longitude: row.longitude,
  };
}

export async function listMappedStores(supabase: Supabase): Promise<MappedStore[]> {
  const { data, error } = await supabase
    .from("stores")
    .select(STORE_COLUMNS)
    .not("latitude", "is", null)
    .order("name")
    .limit(MAPPED_STORE_LIMIT);
  if (error) throw error;
  return (data as StoreRow[]).map((row) => toStore(row) as MappedStore);
}

/** 소비자가 보는 가게 프로필 */
export async function findPublicStore(supabase: Supabase, id: string): Promise<Store | null> {
  if (!z.uuid().safeParse(id).success) return null;
  const { data, error } = await supabase.from("stores").select(STORE_COLUMNS).eq("id", id).maybeSingle();
  if (error) throw error;
  return data ? toStore(data as StoreRow) : null;
}

export async function findStore(supabase: Supabase, ownerId: string): Promise<Store | null> {
  const { data, error } = await supabase.from("stores").select(STORE_COLUMNS).eq("owner_id", ownerId).maybeSingle();
  if (error) throw error;
  return data ? toStore(data as StoreRow) : null;
}

export async function requireSellerStore() {
  const seller = await requireSeller();
  const store = await findStore(seller.supabase, seller.id);
  if (!store) throw new ApiError("NOT_FOUND", "등록한 매장이 없어요.");
  return { supabase: seller.supabase, store };
}

/** 판매자 화면용. 판매자가 아니면 화면을 벗어나게 하고, 매장이 없으면 null을 반환한다. */
export const loadSellerStore = cache(async (): Promise<Store | null> => {
  try {
    const { supabase, id } = await requireSeller();
    return await findStore(supabase, id);
  } catch (error) {
    if (error instanceof ApiError && error.code === "UNAUTHENTICATED") redirect("/login");
    if (error instanceof ApiError && error.code === "FORBIDDEN") redirect("/shop?notice=seller-only");
    throw error;
  }
});

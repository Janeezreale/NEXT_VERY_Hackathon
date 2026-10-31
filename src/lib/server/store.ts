import "server-only";

import { redirect } from "next/navigation";

import type { Store } from "../../types/api";
import { createClient } from "../supabase/server";
import { ApiError } from "./api";
import { requireSeller } from "./auth";

export const STORE_COLUMNS = "id, name, region_code, address, closing_time";

type Supabase = Awaited<ReturnType<typeof createClient>>;

export type StoreRow = {
  id: string;
  name: string;
  region_code: string;
  address: string;
  closing_time: string;
};

export function toStore(row: StoreRow): Store {
  return {
    id: row.id,
    name: row.name,
    regionCode: row.region_code,
    address: row.address,
    closingTime: row.closing_time.slice(0, 5),
  };
}

export async function findStore(supabase: Supabase, ownerId: string): Promise<Store | null> {
  const { data, error } = await supabase.from("stores").select(STORE_COLUMNS).eq("owner_id", ownerId).maybeSingle();
  if (error) throw error;
  return data ? toStore(data as StoreRow) : null;
}

/** 판매자 화면용. 판매자가 아니면 화면을 벗어나게 하고, 매장이 없으면 null을 반환한다. */
export async function loadSellerStore(): Promise<Store | null> {
  try {
    const { supabase, id } = await requireSeller();
    return await findStore(supabase, id);
  } catch (error) {
    if (error instanceof ApiError && error.code === "UNAUTHENTICATED") redirect("/login");
    if (error instanceof ApiError && error.code === "FORBIDDEN") redirect("/shop");
    throw error;
  }
}

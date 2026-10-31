import "server-only";

import type { createClient } from "../supabase/server";

type Supabase = Awaited<ReturnType<typeof createClient>>;

/** 상품별 최근 60분 확정 수량. 예약이 없는 상품은 결과에 없고 0으로 본다. */
export async function loadRecentApprovedQuantities(supabase: Supabase, productIds: string[]): Promise<Map<string, number>> {
  if (productIds.length === 0) return new Map();
  const { data, error } = await supabase.rpc("recent_approved_quantities", { product_ids: productIds });
  if (error) throw error;
  const rows = data as { product_id: string; quantity: number }[];
  return new Map(rows.map((row) => [row.product_id, row.quantity]));
}

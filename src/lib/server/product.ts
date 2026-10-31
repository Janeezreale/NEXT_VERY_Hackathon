import "server-only";

import { z } from "zod";

import { freshnessSchema } from "../schemas/api";
import type { createClient } from "../supabase/server";
import type { Page, SellerProduct } from "../../types/api";
import { ApiError } from "./api";

export const PRODUCT_COLUMNS =
  "id, store_id, name, category, unit, available_quantity, base_price, min_price, freshness, sale_ends_at, created_at";

const cursorSchema = z.tuple([z.iso.datetime({ offset: true }), z.uuid()]);

type Supabase = Awaited<ReturnType<typeof createClient>>;

export type ProductRow = {
  id: string;
  store_id: string;
  name: string;
  category: string;
  unit: string;
  available_quantity: number;
  base_price: number;
  min_price: number;
  freshness: string;
  sale_ends_at: string;
  created_at: string;
};

export function toSellerProduct(row: ProductRow): SellerProduct {
  return {
    id: row.id,
    storeId: row.store_id,
    name: row.name,
    category: row.category,
    unit: row.unit,
    availableQuantity: row.available_quantity,
    basePrice: row.base_price,
    minPrice: row.min_price,
    freshness: freshnessSchema.parse(row.freshness),
    saleEndsAt: row.sale_ends_at,
    createdAt: row.created_at,
  };
}

function encodeCursor(row: ProductRow) {
  return Buffer.from(JSON.stringify([row.created_at, row.id])).toString("base64url");
}

function decodeCursor(cursor: string) {
  try {
    return cursorSchema.parse(JSON.parse(Buffer.from(cursor, "base64url").toString()));
  } catch {
    throw new ApiError("VALIDATION_ERROR", "목록 위치가 올바르지 않아요.");
  }
}

/** 최신 게시 순. 같은 시각의 상품이 누락되지 않도록 id까지 함께 비교한다. */
export async function listSellerProducts(
  supabase: Supabase,
  storeId: string,
  { cursor, limit }: { cursor?: string; limit: number },
): Promise<Page<SellerProduct>> {
  let query = supabase
    .from("products")
    .select(PRODUCT_COLUMNS)
    .eq("store_id", storeId)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(limit + 1);

  if (cursor) {
    const [createdAt, id] = decodeCursor(cursor);
    query = query.or(`created_at.lt."${createdAt}",and(created_at.eq."${createdAt}",id.lt.${id})`);
  }

  const { data, error } = await query;
  if (error) throw error;

  const rows = data as ProductRow[];
  const page = rows.slice(0, limit);
  return {
    items: page.map(toSellerProduct),
    nextCursor: rows.length > limit ? encodeCursor(page[page.length - 1]) : null,
  };
}

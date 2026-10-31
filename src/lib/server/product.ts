import "server-only";

import { z } from "zod";

import { calculatePrice, getSaleDeadline, isSaleOpen } from "../pricing/price";
import { freshnessSchema } from "../schemas/api";
import type { createClient } from "../supabase/server";
import type { Page, Product, ProductListing, SellerProduct, Store } from "../../types/api";
import { ApiError } from "./api";
import { loadRecentApprovedQuantities } from "./pricing";
import { STORE_COLUMNS, toStore, type StoreRow } from "./store";

export const PRODUCT_COLUMNS =
  "id, store_id, name, unit, available_quantity, base_price, min_price, freshness, sale_ends_at, created_at";

const PUBLIC_PRODUCT_COLUMNS = `${PRODUCT_COLUMNS}, stores!inner(${STORE_COLUMNS})`;

const cursorSchema = z.tuple([z.iso.datetime({ offset: true }), z.uuid()]);

type Supabase = Awaited<ReturnType<typeof createClient>>;

export type ProductRow = {
  id: string;
  store_id: string;
  name: string;
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

/** 최신 게시 순의 다음 위치. 같은 시각의 상품이 누락되지 않도록 id까지 함께 비교한다. */
function cursorFilter(cursor: string) {
  try {
    const [createdAt, id] = cursorSchema.parse(JSON.parse(Buffer.from(cursor, "base64url").toString()));
    return `created_at.lt."${createdAt}",and(created_at.eq."${createdAt}",id.lt.${id})`;
  } catch {
    throw new ApiError("VALIDATION_ERROR", "목록 위치가 올바르지 않아요.");
  }
}

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

  if (cursor) query = query.or(cursorFilter(cursor));

  const { data, error } = await query;
  if (error) throw error;

  const rows = data as ProductRow[];
  const page = rows.slice(0, limit);
  return {
    items: page.map(toSellerProduct),
    nextCursor: rows.length > limit ? encodeCursor(page[page.length - 1]) : null,
  };
}

type PublicProductRow = ProductRow & { stores: StoreRow };

function toProduct(row: PublicProductRow, recentApprovedQuantity: number, now: Date): Product {
  const deadline = getSaleDeadline(new Date(row.sale_ends_at), toStore(row.stores).closingTime, now);
  const seller = toSellerProduct(row);
  return {
    id: seller.id,
    storeId: seller.storeId,
    name: seller.name,
    unit: seller.unit,
    availableQuantity: seller.availableQuantity,
    basePrice: seller.basePrice,
    freshness: seller.freshness,
    saleEndsAt: seller.saleEndsAt,
    saleDeadline: deadline.toISOString(),
    ...calculatePrice({
      basePrice: seller.basePrice,
      minPrice: seller.minPrice,
      freshness: seller.freshness,
      deadline,
      createdAt: new Date(row.created_at),
      recentApprovedQuantity,
      now,
    }),
    imageUrls: [],
    pricedAt: now.toISOString(),
    saleOpen: seller.availableQuantity > 0 && isSaleOpen(deadline, now),
  };
}

/**
 * 지역의 판매 중 상품. 매장 마감은 DB에서 거를 수 없어 페이지를 나눈 뒤 제외하므로
 * 한 페이지가 limit보다 적어도 nextCursor가 있을 수 있다.
 */
export async function listPublicProducts(
  supabase: Supabase,
  { region, cursor, limit }: { region: string; cursor?: string; limit: number },
): Promise<Page<ProductListing>> {
  const now = new Date();
  let query = supabase
    .from("products")
    .select(PUBLIC_PRODUCT_COLUMNS)
    .eq("stores.region_code", region)
    .gt("available_quantity", 0)
    .gt("sale_ends_at", now.toISOString())
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(limit + 1);

  if (cursor) query = query.or(cursorFilter(cursor));

  const { data, error } = await query;
  if (error) throw error;

  const rows = data as unknown as PublicProductRow[];
  const page = rows.slice(0, limit);
  const quantities = await loadRecentApprovedQuantities(supabase, page.map((row) => row.id));
  return {
    items: page
      .map((row) => {
        const { id, name, address } = toStore(row.stores);
        return { ...toProduct(row, quantities.get(row.id) ?? 0, now), store: { id, name, address } };
      })
      .filter((product) => product.saleOpen),
    nextCursor: rows.length > limit ? encodeCursor(page[page.length - 1]) : null,
  };
}

/** 상품 상세. 품절·판매 종료 상품도 saleOpen: false로 돌려준다. */
export async function findPublicProduct(supabase: Supabase, id: string): Promise<{ product: Product; store: Store }> {
  const { data, error } = await supabase.from("products").select(PUBLIC_PRODUCT_COLUMNS).eq("id", id).maybeSingle();
  if (error) throw error;
  if (!data) throw new ApiError("NOT_FOUND", "상품을 찾을 수 없어요.");

  const row = data as unknown as PublicProductRow;
  const quantities = await loadRecentApprovedQuantities(supabase, [row.id]);
  return { product: toProduct(row, quantities.get(row.id) ?? 0, new Date()), store: toStore(row.stores) };
}

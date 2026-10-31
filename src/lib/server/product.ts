import "server-only";

import { z } from "zod";

import { calculatePrice, getSaleDeadline, isSaleOpen, saleEndError } from "../pricing/price";
import { freshnessSchema } from "../schemas/api";
import { getSupabaseEnv } from "../supabase/env";
import type { createClient } from "../supabase/server";
import type { ProductUpdateInput } from "../schemas/api";
import type { ApiErrorCode, Page, Product, ProductListing, SellerProduct, Store } from "../../types/api";
import { ApiError } from "./api";
import { loadRecentApprovedQuantities } from "./pricing";
import { STORE_COLUMNS, toStore, type StoreRow } from "./store";

export const PRODUCT_COLUMNS =
  "id, store_id, name, unit, available_quantity, base_price, min_price, freshness, sale_ends_at, created_at";

const PUBLIC_PRODUCT_COLUMNS = `${PRODUCT_COLUMNS}, stores!inner(${STORE_COLUMNS}), product_images(storage_path)`;
const IMAGE_BUCKET = "product-images";

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

export function encodeCursor(row: { created_at: string; id: string }) {
  return Buffer.from(JSON.stringify([row.created_at, row.id])).toString("base64url");
}

/** 최신 게시 순의 다음 위치. 같은 시각의 상품이 누락되지 않도록 id까지 함께 비교한다. */
export function cursorFilter(cursor: string) {
  try {
    const [createdAt, id] = cursorSchema.parse(JSON.parse(Buffer.from(cursor, "base64url").toString()));
    return `created_at.lt."${createdAt}",and(created_at.eq."${createdAt}",id.lt.${id})`;
  } catch {
    throw new ApiError("VALIDATION_ERROR", "목록 위치가 올바르지 않아요.");
  }
}

/** 기한이 지난 대기 예약을 만료해 재고를 돌려준다. 스케줄러가 없어 조회할 때 호출한다. */
export async function expireOverdueReservations(supabase: Supabase) {
  const { error } = await supabase.rpc("expire_overdue_reservations");
  if (error) throw error;
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

const PRODUCT_ERRORS: Partial<Record<ApiErrorCode, string>> = {
  NOT_FOUND: "상품을 찾을 수 없어요.",
  FORBIDDEN: "이 상품을 변경할 권한이 없어요.",
  STOCK_CHANGED: "그 사이 예약으로 재고가 바뀌었어요. 최신 재고를 확인해 주세요.",
  PRODUCT_HAS_RESERVATIONS: "예약이 있는 상품은 삭제할 수 없어요.",
};

function toProductError(error: { message: string }) {
  const message = PRODUCT_ERRORS[error.message as ApiErrorCode];
  return message ? new ApiError(error.message as ApiErrorCode, message) : error;
}

export async function findSellerProduct(supabase: Supabase, storeId: string, id: string): Promise<SellerProduct | null> {
  if (!z.uuid().safeParse(id).success) return null;
  const { data, error } = await supabase.from("products").select(PRODUCT_COLUMNS).eq("id", id).eq("store_id", storeId).maybeSingle();
  if (error) throw error;
  return data ? toSellerProduct(data as ProductRow) : null;
}

export async function updateProduct(supabase: Supabase, id: string, input: ProductUpdateInput): Promise<SellerProduct> {
  const { data, error } = await supabase.rpc("update_product", {
    p_product_id: id,
    p_name: input.name,
    p_unit: input.unit,
    p_quantity: input.quantity,
    p_expected_quantity: input.expectedQuantity,
    p_base_price: input.basePrice,
    p_min_price: input.minPrice,
    p_freshness: input.freshness,
    p_sale_ends_at: input.saleEndsAt,
  });
  if (error) throw toProductError(error);
  return toSellerProduct(data as ProductRow);
}

export async function deleteProduct(supabase: Supabase, id: string) {
  const { error } = await supabase.rpc("delete_product", { p_product_id: id });
  if (error) throw toProductError(error);
}

type PublicProductRow = ProductRow & { stores: StoreRow; product_images?: { storage_path: string }[] };

export function imagePublicUrl(path: string) {
  return `${getSupabaseEnv().url}/storage/v1/object/public/${IMAGE_BUCKET}/${path}`;
}

export function assertSaleEnd(saleEndsAt: string, closingTime: string) {
  const message = saleEndError(new Date(saleEndsAt), closingTime);
  if (message) throw new ApiError("VALIDATION_ERROR", message, { saleEndsAt: [message] });
}

/** 경로만 바꿔 다른 매장의 파일을 쓰지 못하게 한다. */
export function assertOwnImage(path: string, storeId: string) {
  if (!path.startsWith(`${storeId}/`)) throw new ApiError("FORBIDDEN", "이 사진을 사용할 권한이 없어요.");
}

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
    imageUrls: (row.product_images ?? []).map((image) => imagePublicUrl(image.storage_path)),
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
  await expireOverdueReservations(supabase);
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
  await expireOverdueReservations(supabase);
  const { data, error } = await supabase.from("products").select(PUBLIC_PRODUCT_COLUMNS).eq("id", id).maybeSingle();
  if (error) throw error;
  if (!data) throw new ApiError("NOT_FOUND", "상품을 찾을 수 없어요.");

  const row = data as unknown as PublicProductRow;
  const quantities = await loadRecentApprovedQuantities(supabase, [row.id]);
  return { product: toProduct(row, quantities.get(row.id) ?? 0, new Date()), store: toStore(row.stores) };
}

import "server-only";

import { z } from "zod";

import { calculatePrice, getBusinessDayStart, getSaleDeadline, getSaleStatus, saleEndError } from "../pricing/price";
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
/** 게시 전 사진을 지우지 않도록 올린 지 하루가 지난 파일만 정리한다. */
const UNUSED_IMAGE_KEEP_MS = 24 * 60 * 60 * 1000;
const UNUSED_IMAGE_SCAN_LIMIT = 200;

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

/** 상품별 예약으로 확보된 수량. 재고(available_quantity)에는 이미 빠져 있다. */
export async function loadReservedQuantities(supabase: Supabase, productIds: string[]): Promise<Map<string, number>> {
  if (productIds.length === 0) return new Map();
  const { data, error } = await supabase.from("reservations").select("product_id, quantity").eq("status", "approved").in("product_id", productIds);
  if (error) throw error;
  const reserved = new Map<string, number>();
  for (const row of data) reserved.set(row.product_id, (reserved.get(row.product_id) ?? 0) + row.quantity);
  return reserved;
}

/** 판매자가 보는 현재가. 소비자에게 보이는 값과 같은 규칙으로 계산한다. */
export function sellerCurrentPrice(product: SellerProduct, closingTime: string, recentApprovedQuantity: number, now: Date) {
  return calculatePrice({
    basePrice: product.basePrice,
    minPrice: product.minPrice,
    freshness: product.freshness,
    deadline: getSaleDeadline(new Date(product.saleEndsAt), closingTime, now),
    createdAt: new Date(product.createdAt),
    recentApprovedQuantity,
    now,
  });
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

/** 상품의 현재 사진 주소. 없으면 null이다. */
export async function findProductImageUrl(supabase: Supabase, id: string): Promise<string | null> {
  const { data, error } = await supabase.from("product_images").select("storage_path").eq("product_id", id).limit(1);
  if (error) throw error;
  return data[0] ? imagePublicUrl(data[0].storage_path) : null;
}

/**
 * 상품 사진을 바꾸거나(path) 지운다(null). 중간에 실패해도 사진이 사라지지 않도록 새 사진을 먼저 연결한다.
 * 파일 삭제는 연결을 끊은 뒤라 실패해도 저장을 되돌리지 않는다.
 */
export async function replaceProductImage(supabase: Supabase, id: string, path: string | null) {
  const current = await linkedImagePaths(supabase, id);
  const stale = current.filter((storagePath) => storagePath !== path);

  if (path && !current.includes(path)) {
    const { error: insertError } = await supabase.from("product_images").insert({ product_id: id, storage_path: path });
    if (insertError) throw insertError;
  }
  if (stale.length === 0) return;

  const { error: deleteError } = await supabase.from("product_images").delete().eq("product_id", id).in("storage_path", stale);
  if (deleteError) throw deleteError;
  await removeImageFiles(supabase, stale);
}

async function linkedImagePaths(supabase: Supabase, id: string) {
  const { data, error } = await supabase.from("product_images").select("storage_path").eq("product_id", id);
  if (error) throw error;
  return data.map((image) => image.storage_path);
}

/** 남은 파일은 removeUnusedImages가 다시 지우므로 실패해도 요청을 실패시키지 않는다. */
async function removeImageFiles(supabase: Supabase, paths: string[]) {
  const { error } = await supabase.storage.from(IMAGE_BUCKET).remove(paths);
  if (error) console.error("Failed to remove product images", error);
}

/**
 * 어느 상품에도 연결되지 않은 파일을 지운다. 저장하지 않고 떠난 사진이 여기서 정리된다.
 * 스케줄러가 없어 상품을 저장할 때 호출한다. 정리에 실패해도 저장은 성공해야 한다.
 */
export async function removeUnusedImages(supabase: Supabase, storeId: string, now = new Date()) {
  try {
    const { data: files, error } = await supabase.storage
      .from(IMAGE_BUCKET)
      .list(storeId, { limit: UNUSED_IMAGE_SCAN_LIMIT, sortBy: { column: "created_at", order: "desc" } });
    if (error) throw error;

    const cutoff = now.getTime() - UNUSED_IMAGE_KEEP_MS;
    const old = files.filter((file) => file.created_at && new Date(file.created_at).getTime() < cutoff).map((file) => `${storeId}/${file.name}`);
    if (old.length === 0) return;

    const { data: linked, error: linkedError } = await supabase.from("product_images").select("storage_path").in("storage_path", old);
    if (linkedError) throw linkedError;

    const used = new Set(linked.map((image) => image.storage_path));
    const unused = old.filter((path) => !used.has(path));
    if (unused.length > 0) await removeImageFiles(supabase, unused);
  } catch (error) {
    console.error("Failed to clean up unused product images", error);
  }
}

export async function deleteProduct(supabase: Supabase, id: string) {
  const paths = await linkedImagePaths(supabase, id);
  const { error } = await supabase.rpc("delete_product", { p_product_id: id });
  if (error) throw toProductError(error);
  if (paths.length > 0) await removeImageFiles(supabase, paths);
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
  const { openingTime, closingTime } = toStore(row.stores);
  const saleEndsAt = new Date(row.sale_ends_at);
  const deadline = getSaleDeadline(saleEndsAt, closingTime, now);
  const seller = toSellerProduct(row);
  const saleStatus = getSaleStatus({ availableQuantity: seller.availableQuantity, saleEndsAt, openingTime, closingTime }, now);
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
    saleStatus,
    saleOpen: saleStatus === "on_sale",
  };
}

/** 지역이나 가게의 재고가 있는 오늘 상품. 마감했거나 오픈 전이어도 보여주고 saleStatus로 예약만 막는다. */
export async function listPublicProducts(
  supabase: Supabase,
  { cursor, limit, ...scope }: ({ region: string } | { storeId: string }) & { cursor?: string; limit: number },
): Promise<Page<ProductListing>> {
  const now = new Date();
  const products = supabase.from("products").select(PUBLIC_PRODUCT_COLUMNS);
  let query = ("region" in scope ? products.eq("stores.region_code", scope.region) : products.eq("store_id", scope.storeId))
    .gt("available_quantity", 0)
    .gte("sale_ends_at", getBusinessDayStart(now).toISOString())
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
    items: page.map((row) => {
      const { id, name, address, openingTime, closingTime, latitude, longitude } = toStore(row.stores);
      return { ...toProduct(row, quantities.get(row.id) ?? 0, now), store: { id, name, address, openingTime, closingTime, latitude, longitude } };
    }),
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

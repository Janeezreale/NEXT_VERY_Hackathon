import "server-only";

import { z } from "zod";

import type { ReservationCreateInput } from "../schemas/api";
import { createAdminClient } from "../supabase/admin";
import type { createClient } from "../supabase/server";
import type { ApiErrorCode, Page, Reservation, ReservationStatus, UserRole } from "../../types/api";
import { ApiError } from "./api";
import { cursorFilter, encodeCursor, expireOverdueReservations, findPublicProduct } from "./product";

type Supabase = Awaited<ReturnType<typeof createClient>>;

export const SELLER_ACTIONS = {
  approve: "approve",
  reject: "reject",
  cancel: "seller_cancel",
  "no-show": "no_show",
  complete: "complete",
} as const;

const RESERVATION_COLUMNS =
  "id, product_id, quantity, confirmed_unit_price, total_price, pickup_at, status, created_at, cancelled_by, products!inner(name, unit, store_id, stores!inner(id, name, address))";

const MESSAGES: Partial<Record<ApiErrorCode, string>> = {
  VALIDATION_ERROR: "픽업 시각을 다시 선택해 주세요.",
  UNAUTHENTICATED: "로그인이 필요해요.",
  FORBIDDEN: "이 예약을 변경할 권한이 없어요.",
  NOT_FOUND: "예약을 찾을 수 없어요.",
  OUT_OF_STOCK: "남은 수량이 부족해요. 수량을 다시 확인해 주세요.",
  SALE_ENDED: "판매가 종료되었어요.",
  INVALID_TRANSITION: "지금 상태에서는 처리할 수 없어요. 예약을 새로 확인해 주세요.",
};

type ReservationRow = {
  id: string;
  product_id: string;
  quantity: number;
  confirmed_unit_price: number;
  total_price: number;
  pickup_at: string;
  status: ReservationStatus;
  created_at: string;
  cancelled_by: UserRole | null;
  products: { name: string; unit: string; store_id: string; stores: { id: string; name: string; address: string } };
};

function toReservation(row: ReservationRow): Reservation {
  return {
    id: row.id,
    productId: row.product_id,
    productName: row.products.name,
    unit: row.products.unit,
    quantity: row.quantity,
    confirmedUnitPrice: row.confirmed_unit_price,
    totalPrice: row.total_price,
    pickupAt: row.pickup_at,
    status: row.status,
    createdAt: row.created_at,
    cancelledBy: row.cancelled_by,
    store: row.products.stores,
  };
}

/** DB 함수가 메시지에 담은 오류 코드를 API 오류로 바꾼다. */
function toApiError(error: { message: string }) {
  const message = MESSAGES[error.message as ApiErrorCode];
  return message ? new ApiError(error.message as ApiErrorCode, message) : error;
}

async function readReservation(client: Supabase | ReturnType<typeof createAdminClient>, id: string) {
  const { data, error } = await client.from("reservations").select(RESERVATION_COLUMNS).eq("id", id).single();
  if (error) throw error;
  return toReservation(data as unknown as ReservationRow);
}

/** 재시도가 가격 변동으로 실패하지 않도록 같은 요청 키는 가격 확인보다 먼저 찾는다. */
export async function createReservation(supabase: Supabase, consumerId: string, input: ReservationCreateInput) {
  const admin = createAdminClient();
  const { data: existing, error: lookupError } = await admin
    .from("reservations")
    .select("id")
    .eq("consumer_id", consumerId)
    .eq("idempotency_key", input.idempotencyKey)
    .maybeSingle();
  if (lookupError) throw lookupError;
  if (existing) return readReservation(admin, existing.id);

  const { product } = await findPublicProduct(supabase, input.productId);
  if (!product.saleOpen) {
    throw product.availableQuantity === 0
      ? new ApiError("OUT_OF_STOCK", MESSAGES.OUT_OF_STOCK as string)
      : new ApiError("SALE_ENDED", MESSAGES.SALE_ENDED as string);
  }
  if (product.currentPrice !== input.expectedUnitPrice) {
    throw new ApiError("PRICE_CHANGED", `가격이 ${product.currentPrice.toLocaleString("ko-KR")}원으로 바뀌었어요. 확인 후 다시 예약해 주세요.`);
  }

  const { data, error } = await admin.rpc("create_reservation", {
    p_consumer_id: consumerId,
    p_product_id: input.productId,
    p_quantity: input.quantity,
    p_pickup_at: input.pickupAt,
    p_idempotency_key: input.idempotencyKey,
    p_unit_price: product.currentPrice,
  });
  if (error) throw toApiError(error);
  return readReservation(admin, z.object({ id: z.uuid() }).parse(data).id);
}

export async function changeReservationStatus(supabase: Supabase, id: string, action: string) {
  const { error } = await supabase.rpc("change_reservation_status", { p_reservation_id: id, p_action: action });
  if (error) throw toApiError(error);
  return readReservation(supabase, id);
}

export async function listReservations(
  supabase: Supabase,
  owner: { consumerId: string } | { storeId: string },
  { status, cursor, limit }: { status?: ReservationStatus; cursor?: string; limit: number },
): Promise<Page<Reservation>> {
  await expireOverdueReservations(supabase);

  const base = supabase
    .from("reservations")
    .select(RESERVATION_COLUMNS)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(limit + 1);
  let query = "consumerId" in owner ? base.eq("consumer_id", owner.consumerId) : base.eq("products.store_id", owner.storeId);
  if (status) query = query.eq("status", status);
  if (cursor) query = query.or(cursorFilter(cursor));

  const { data, error } = await query;
  if (error) throw error;

  const rows = data as unknown as ReservationRow[];
  const page = rows.slice(0, limit);
  return {
    items: page.map(toReservation),
    nextCursor: rows.length > limit ? encodeCursor(page[page.length - 1]) : null,
  };
}

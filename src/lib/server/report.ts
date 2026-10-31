import "server-only";

import { PRICING_CONFIG } from "../pricing/config";
import type { createClient } from "../supabase/server";
import type { Report } from "../../types/api";

type Supabase = Awaited<ReturnType<typeof createClient>>;

const DAY_MS = 24 * 60 * 60 * 1000;
const ROW_LIMIT = 1000;

const kstDate = new Intl.DateTimeFormat("en-CA", { timeZone: PRICING_CONFIG.timeZone });

export type ReportRows = {
  products: { id: string; name: string; unit: string; available_quantity: number; created_at: string }[];
  reservations: { product_id: string; status: string; created_at: string }[];
  sales: { final_amount: number; completed_at: string; reservations: { product_id: string; quantity: number } }[];
};

/** 기간은 한국 날짜 기준이다. 매출은 판매 완료 금액이며 순이익·정산액이 아니다. */
export function summarizeReport({ products, reservations, sales }: ReportRows, days: number, now: Date): Report {
  const dates = Array.from({ length: days }, (_, index) => kstDate.format(now.getTime() - (days - 1 - index) * DAY_MS));
  const from = new Date(`${dates[0]}T00:00:00${PRICING_CONFIG.timeZoneOffset}`);
  const within = (at: string) => new Date(at) >= from;

  const periodSales = sales.filter((sale) => within(sale.completed_at));
  const sold = new Map<string, number>();
  for (const sale of periodSales) {
    const { product_id: id, quantity } = sale.reservations;
    sold.set(id, (sold.get(id) ?? 0) + quantity);
  }

  return {
    days,
    from: dates[0],
    to: dates[dates.length - 1],
    registeredProducts: products.filter((product) => within(product.created_at)).length,
    requestedReservations: reservations.filter((reservation) => within(reservation.created_at)).length,
    currentApproved: reservations.filter((reservation) => reservation.status === "approved").length,
    completedSales: periodSales.length,
    revenue: periodSales.reduce((total, sale) => total + sale.final_amount, 0),
    series: dates.map((date) => {
      const rows = periodSales.filter((sale) => kstDate.format(new Date(sale.completed_at)) === date);
      return { date: date.slice(5).replace("-", "/"), revenue: rows.reduce((total, sale) => total + sale.final_amount, 0), completed: rows.length };
    }),
    products: products.map((product) => ({
      id: product.id,
      name: product.name,
      unit: product.unit,
      soldQuantity: sold.get(product.id) ?? 0,
      remainingQuantity: product.available_quantity,
    })),
  };
}

export async function loadReport(supabase: Supabase, storeId: string, days: number): Promise<Report> {
  const [products, reservations, sales] = await Promise.all([
    supabase.from("products").select("id, name, unit, available_quantity, created_at").eq("store_id", storeId).order("created_at", { ascending: false }).limit(ROW_LIMIT),
    supabase.from("reservations").select("product_id, status, created_at, products!inner(store_id)").eq("products.store_id", storeId).order("created_at", { ascending: false }).limit(ROW_LIMIT),
    supabase.from("sales").select("final_amount, completed_at, reservations!inner(product_id, quantity, products!inner(store_id))").eq("reservations.products.store_id", storeId).order("completed_at", { ascending: false }).limit(ROW_LIMIT),
  ]);
  const failed = products.error ?? reservations.error ?? sales.error;
  if (failed) throw failed;
  return summarizeReport(
    { products: products.data ?? [], reservations: reservations.data ?? [], sales: (sales.data ?? []) as unknown as ReportRows["sales"] },
    days,
    new Date(),
  );
}

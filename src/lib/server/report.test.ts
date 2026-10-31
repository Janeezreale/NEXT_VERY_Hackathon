import { describe, expect, it, vi } from "vitest";

import { summarizeReport, type ReportRows } from "./report";

vi.mock("server-only", () => ({}));

const now = new Date("2026-11-03T03:00:00Z"); // 한국 시간 12:00
const product = { id: "a", name: "사과", unit: "봉지", available_quantity: 2, created_at: "2026-11-03T01:00:00Z" };
const rows: ReportRows = {
  products: [product, { ...product, id: "b", name: "오래된 상품", unit: "팩", created_at: "2026-10-01T00:00:00Z" }],
  reservations: [
    { product_id: "a", status: "approved", created_at: "2026-11-03T01:30:00Z" },
    { product_id: "a", status: "completed", created_at: "2026-11-02T01:30:00Z" },
    { product_id: "a", status: "rejected", created_at: "2026-10-20T01:30:00Z" },
  ],
  sales: [
    { final_amount: 8000, completed_at: "2026-11-03T02:30:00Z", reservations: { product_id: "a", quantity: 2 } },
    { final_amount: 3000, completed_at: "2026-11-02T14:59:00Z", reservations: { product_id: "b", quantity: 1 } },
    { final_amount: 9999, completed_at: "2026-10-01T00:00:00Z", reservations: { product_id: "a", quantity: 9 } },
  ],
};

describe("summarizeReport", () => {
  it("uses Korean dates: 14:59 UTC is still the previous Korean day boundary", () => {
    const today = summarizeReport(rows, 1, now);
    expect(today).toMatchObject({ from: "2026-11-03", to: "2026-11-03", revenue: 8000, completedSales: 1 });
  });

  it("sums revenue and counts inside the period", () => {
    expect(summarizeReport(rows, 7, now)).toMatchObject({
      registeredProducts: 1,
      requestedReservations: 2,
      currentApproved: 1,
      completedSales: 2,
      revenue: 11000,
    });
  });

  it("fills empty days in the series", () => {
    const { series } = summarizeReport(rows, 7, now);
    expect(series).toHaveLength(7);
    expect(series[6]).toEqual({ date: "11/03", revenue: 8000, completed: 1 });
    expect(series[0]).toEqual({ date: "10/28", revenue: 0, completed: 0 });
  });

  it("keeps quantities per product without mixing units", () => {
    expect(summarizeReport(rows, 7, now).products).toEqual([
      { id: "a", name: "사과", unit: "봉지", soldQuantity: 2, remainingQuantity: 2 },
      { id: "b", name: "오래된 상품", unit: "팩", soldQuantity: 1, remainingQuantity: 2 },
    ]);
  });
});

import { describe, expect, it } from "vitest";

import { RESERVATION_STATUSES, type Reservation } from "@/src/types/api";

import { toReservationView } from "./reservation-view";

const reservation: Reservation = {
  id: "reservation-1",
  productId: "product-1",
  productName: "사과",
  unit: "봉지",
  quantity: 2,
  confirmedUnitPrice: 8800,
  totalPrice: 17600,
  pickupAt: "2026-11-01T09:30:00Z",
  status: "approved",
  imageUrl: null,
  createdAt: "2026-11-01T08:00:00Z",
  cancelledBy: null,
  contact: null,
  store: { id: "store-1", name: "테스트 마켓", address: "서울 성북구" },
};

describe("toReservationView", () => {
  it("keeps the confirmed price and shows pickup in Korean time", () => {
    expect(toReservationView(reservation)).toMatchObject({ unitPrice: 8800, total: 17600, pickup: expect.stringContaining("18:30") });
  });

  it("carries the product photo", () => {
    expect(toReservationView({ ...reservation, imageUrl: "https://image/a.jpg" }).photo).toBe("https://image/a.jpg");
    expect(toReservationView(reservation).photo).toBeNull();
  });

  it("gives every status a label and explanation", () => {
    const views = RESERVATION_STATUSES.map((status) => toReservationView({ ...reservation, status }));
    expect(new Set(views.map((view) => view.status)).size).toBe(6);
    for (const view of views) expect(view.explanation).not.toBe("");
  });

  it.each([
    ["approved", true],
    ["rejected", false],
    ["cancelled", false],
    ["completed", false],
    ["expired", false],
    ["no_show", false],
  ] as const)("allows cancelling %s: %s", (status, canCancel) => {
    expect(toReservationView({ ...reservation, status }).canCancel).toBe(canCancel);
  });

  it("explains a cancellation by the seller", () => {
    const view = toReservationView({ ...reservation, status: "cancelled", cancelledBy: "seller" });
    expect(view.explanation).toBe("판매자가 예약을 취소했어요.");
  });
});

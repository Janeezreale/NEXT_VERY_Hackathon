import { describe, expect, it } from "vitest";

import type { Product } from "@/src/types/api";

import { pickupSlots, toProductView } from "./product-view";

const kst = (value: string) => new Date(`${value}+09:00`);
const labels = (now: Date, deadline: Date) => pickupSlots(now, deadline).map((slot) => slot.label);

const product: Product = {
  id: "product-1",
  storeId: "store-1",
  name: "사과",
  unit: "봉지",
  availableQuantity: 3,
  basePrice: 10000,
  currentPrice: 8800,
  discountRate: 12,
  freshness: "fresh",
  saleEndsAt: "2026-11-01T11:00:00.000Z",
  saleDeadline: "2026-11-01T11:00:00.000Z",
  imageUrls: [],
  pricedAt: "2026-11-01T08:10:00.000Z",
  saleOpen: true,
};

describe("pickupSlots", () => {
  it("starts at the next half hour and ends at the deadline", () => {
    expect(labels(kst("2026-11-01T17:10:00"), kst("2026-11-01T18:30:00"))).toEqual(["17:30", "18:00", "18:30"]);
  });

  it("keeps an exact half hour", () => {
    expect(labels(kst("2026-11-01T17:30:00"), kst("2026-11-01T18:00:00"))).toEqual(["17:30", "18:00"]);
  });

  it("keeps the exact time for the reservation request", () => {
    expect(pickupSlots(kst("2026-11-01T17:10:00"), kst("2026-11-01T17:30:00"))).toEqual([{ label: "17:30", at: "2026-11-01T08:30:00.000Z" }]);
  });

  it("limits the number of slots", () => {
    expect(labels(kst("2026-11-01T09:00:00"), kst("2026-11-01T22:00:00"))).toHaveLength(6);
  });

  it("offers the deadline when no half hour remains", () => {
    expect(labels(kst("2026-11-01T17:05:00"), kst("2026-11-01T17:20:00"))).toEqual(["17:20"]);
  });
});

describe("toProductView", () => {
  const view = toProductView(product, { name: "테스트 마켓", address: "서울 성북구" }, new Date("2026-11-01T08:10:00Z"));

  it("uses server prices without recalculating them", () => {
    expect(view).toMatchObject({ price: 8800, base: 10000, discount: 12, stock: 3 });
  });

  it("shows times in Korean time", () => {
    expect(view).toMatchObject({ dateLabel: "11월 1일", end: "20:00", pickup: "17:30–20:00" });
  });

  it("uses the store information", () => {
    expect(view).toMatchObject({ store: "테스트 마켓", address: "서울 성북구" });
  });

  it("does not invent a photo or description", () => {
    expect(view).toMatchObject({ photo: null, description: null });
  });

  it("uses the uploaded photo", () => {
    const withPhoto = toProductView({ ...product, imageUrls: ["https://image"] }, { name: "마켓", address: "주소" }, new Date());
    expect(withPhoto.photo).toBe("https://image");
  });
});

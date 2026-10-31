import { describe, expect, it } from "vitest";

import type { Product } from "@/src/types/api";

import { normalizeQuantity, pickupSlots, toProductView } from "./product-view";

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
  saleStatus: "on_sale",
  saleOpen: true,
};

describe("normalizeQuantity", () => {
  it.each([
    ["3", "3"],
    ["12", "5"],
    ["a2b", "2"],
    ["03", "3"],
    ["0", ""],
    ["", ""],
    ["-1", "1"],
    ["1.5", "5"],
  ])("turns %s into %s with 5 left", (value, expected) => {
    expect(normalizeQuantity(value, 5)).toBe(expected);
  });
});

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
  const store = { name: "테스트 마켓", address: "서울 성북구", openingTime: "09:00", closingTime: "21:00", latitude: 37.5, longitude: 127 };
  const view = toProductView(product, store, new Date("2026-11-01T08:10:00Z"));

  it("shows when the price was calculated in Korean time", () => {
    expect(view.pricedAt).toBe("17:10");
  });

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

  it("has no notice while reservations are open", () => {
    expect(view).toMatchObject({ notice: null, hours: "09:00–21:00" });
  });

  it("explains why a closed store cannot be reserved", () => {
    expect(toProductView({ ...product, saleStatus: "store_closed" }, store, new Date()).notice).toBe("오늘 예약이 마감되었어요. 영업시간은 09:00–21:00이에요.");
    expect(toProductView({ ...product, saleStatus: "before_open" }, store, new Date()).notice).toBe("아직 영업 전이에요. 09:00부터 예약할 수 있어요.");
  });

  it("uses the uploaded photo", () => {
    const withPhoto = toProductView({ ...product, imageUrls: ["https://image"] }, store, new Date());
    expect(withPhoto.photo).toBe("https://image");
  });
});

import { describe, expect, it } from "vitest";

import { analysisSchema, listQuerySchema, productCreateSchema, reservationCreateSchema, storeCreateSchema } from "./api";

const product = {
  name: "사과",
  category: "과일",
  quantity: 3,
  unit: "봉지",
  basePrice: 10000,
  minPrice: 7000,
  freshness: "fresh",
  saleEndsAt: "2026-11-01T18:00:00+09:00",
  imagePaths: [],
  sellerConfirmed: true,
};

const reservation = {
  productId: "6f1f6a3e-2d8c-4f6e-9b1a-0c9f3f6a1b11",
  quantity: 1,
  pickupAt: "2026-11-01T18:00:00+09:00",
  idempotencyKey: "0d8b1c52-7a3e-4f0a-8e2d-5b7c9a1d2e33",
  expectedUnitPrice: 7300,
};

describe("productCreateSchema", () => {
  it("accepts a confirmed product", () => {
    expect(productCreateSchema.safeParse(product).success).toBe(true);
  });
  it("rejects a minimum price above the base price on minPrice", () => {
    const result = productCreateSchema.safeParse({ ...product, minPrice: 10001 });
    expect(result.error?.issues[0].path).toEqual(["minPrice"]);
  });
  it.each([
    ["free product", { basePrice: 0 }],
    ["zero minimum price", { minPrice: 0 }],
    ["fractional quantity", { quantity: 1.5 }],
    ["zero quantity", { quantity: 0 }],
    ["unconfirmed publish", { sellerConfirmed: false }],
    ["time without offset", { saleEndsAt: "2026-11-01T18:00:00" }],
  ])("rejects %s", (_, change) => {
    expect(productCreateSchema.safeParse({ ...product, ...change }).success).toBe(false);
  });
});

describe("reservationCreateSchema", () => {
  it("accepts a request with an idempotency key and expected price", () => {
    expect(reservationCreateSchema.safeParse(reservation).success).toBe(true);
  });
  it.each(["idempotencyKey", "expectedUnitPrice"])("requires %s", (field) => {
    expect(reservationCreateSchema.safeParse({ ...reservation, [field]: undefined }).success).toBe(false);
  });
});

describe("storeCreateSchema", () => {
  const store = { name: "초록가게", regionCode: "seoul", address: "주소", closingTime: "21:00" };

  it("accepts HH:mm closing times", () => {
    expect(storeCreateSchema.safeParse(store).success).toBe(true);
  });
  it.each(["24:00", "9:00", "21:60"])("rejects closing time %s", (closingTime) => {
    expect(storeCreateSchema.safeParse({ ...store, closingTime }).success).toBe(false);
  });
  it("rejects a blank address", () => {
    expect(storeCreateSchema.safeParse({ ...store, address: "  " }).success).toBe(false);
  });
});

describe("listQuerySchema", () => {
  it("applies the default limit and coerces query strings", () => {
    expect(listQuerySchema.parse({}).limit).toBe(20);
    expect(listQuerySchema.parse({ limit: "5" }).limit).toBe(5);
  });
  it("rejects a limit above the maximum", () => {
    expect(listQuerySchema.safeParse({ limit: "51" }).success).toBe(false);
  });
});

describe("analysisSchema", () => {
  it("keeps uncertain values as null", () => {
    const analysis = {
      name: "사과",
      estimatedQuantity: null,
      unit: null,
      freshness: "sell_today",
      needsConfirmation: true,
      uncertaintyReason: "수량이 가려져 있어요.",
    };
    expect(analysisSchema.parse(analysis)).toEqual(analysis);
  });
});

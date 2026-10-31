import { describe, expect, it } from "vitest";

import { analysisSchema, listQuerySchema, productCreateSchema, reservationCreateSchema, storeCreateSchema } from "./api";

const product = {
  name: "사과",
  quantity: 3,
  unit: "봉지",
  basePrice: 10000,
  minPrice: 7000,
  freshness: "fresh",
  saleEndsAt: "2099-11-01T18:00:00+09:00",
  sellerConfirmed: true,
};

const reservation = {
  productId: "6f1f6a3e-2d8c-4f6e-9b1a-0c9f3f6a1b11",
  quantity: 1,
  pickupAt: "2026-11-01T18:00:00+09:00",
  idempotencyKey: "0d8b1c52-7a3e-4f0a-8e2d-5b7c9a1d2e33",
  expectedUnitPrice: 7300,
  contactName: "홍길동",
  contactPhone: "01012345678",
};

describe("productCreateSchema", () => {
  it("accepts only listed units", () => {
    expect(productCreateSchema.safeParse({ ...product, unit: "박스" }).success).toBe(true);
    const unknown = productCreateSchema.safeParse({ ...product, unit: "자루" });
    expect(unknown.error?.issues[0].message).toBe("단위를 선택해 주세요.");
  });

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
    ["time without offset", { saleEndsAt: "2099-11-01T18:00:00" }],
    ["past end time", { saleEndsAt: "2000-11-01T18:00:00+09:00" }],
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
  const store = { name: "초록가게", regionCode: "seoul", address: "주소", openingTime: "09:00", closingTime: "21:00" };

  it("accepts HH:mm closing times", () => {
    expect(storeCreateSchema.safeParse(store).success).toBe(true);
  });
  it.each(["24:00", "9:00", "21:60"])("rejects closing time %s", (closingTime) => {
    expect(storeCreateSchema.safeParse({ ...store, closingTime }).success).toBe(false);
  });

  it("requires an opening time", () => {
    expect(storeCreateSchema.safeParse({ ...store, openingTime: undefined }).success).toBe(false);
  });

  it.each([
    ["before the business day", { openingTime: "05:59" }, false],
    ["at the business day start", { openingTime: "06:00" }, true],
    ["closing at opening", { closingTime: "09:00" }, false],
    ["closing before opening", { closingTime: "08:00" }, false],
    ["closing after midnight", { closingTime: "00:30" }, true],
  ])("checks business hours: %s", (_, change, valid) => {
    expect(storeCreateSchema.safeParse({ ...store, ...change }).success).toBe(valid);
  });
  it("accepts a store with or without a coordinate pair", () => {
    expect(storeCreateSchema.safeParse({ ...store, latitude: 37.5, longitude: 127 }).success).toBe(true);
    expect(storeCreateSchema.safeParse({ ...store, latitude: null, longitude: null }).success).toBe(true);
  });
  it.each([
    ["only a latitude", { latitude: 37.5 }],
    ["a latitude with a null longitude", { latitude: 37.5, longitude: null }],
    ["an out-of-range latitude", { latitude: 91, longitude: 127 }],
  ])("rejects %s", (_, change) => {
    expect(storeCreateSchema.safeParse({ ...store, ...change }).success).toBe(false);
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

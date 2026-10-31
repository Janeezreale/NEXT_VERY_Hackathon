import { describe, expect, it } from "vitest";

import { calculatePrice, getSaleDeadline, getTodayClosing, isSaleOpen, type PriceInput } from "./price";

const now = new Date("2026-11-01T06:00:00Z"); // 한국 시간 15:00
const hours = (value: number) => new Date(now.getTime() + value * 60 * 60 * 1000);
const minutes = (value: number) => new Date(now.getTime() + value * 60 * 1000);

const input: PriceInput = {
  basePrice: 10000,
  minPrice: 1000,
  freshness: "fresh",
  deadline: hours(10),
  createdAt: minutes(-30),
  recentApprovedQuantity: 0,
  now,
};
const price = (change: Partial<PriceInput>) => calculatePrice({ ...input, ...change });

describe("calculatePrice: docs/PRICING.md cases", () => {
  it("matches the original example", () => {
    expect(price({ freshness: "discard_tomorrow", deadline: hours(1), minPrice: 7000 }).currentPrice).toBe(7300);
  });

  it("does not go below the minimum price", () => {
    expect(price({ freshness: "discard_tomorrow", deadline: hours(1), minPrice: 8000 })).toEqual({
      currentPrice: 8000,
      discountRate: 20,
    });
  });

  it("clamps a negative total discount to the base price", () => {
    expect(price({ recentApprovedQuantity: 2 })).toEqual({ currentPrice: 10000, discountRate: 0 });
  });

  it("rounds to the won", () => {
    expect(price({ basePrice: 999, minPrice: 1, freshness: "sell_today" }).currentPrice).toBe(919);
  });

  it("uses approved quantity, not the number of reservations", () => {
    const base = { freshness: "discard_tomorrow", createdAt: minutes(-120) } as const;
    expect(price({ ...base, recentApprovedQuantity: 2 }).currentPrice).toBe(8800);
    expect(price({ ...base, recentApprovedQuantity: 1 }).currentPrice).toBe(8500);
  });

  it.each([
    ["freshness only", { freshness: "sell_today" }, 9200],
    ["all discounts combined", { freshness: "discard_tomorrow", deadline: hours(1), createdAt: minutes(-60) }, 6800],
  ] as const)("adds discounts: %s", (_, change, expected) => {
    expect(price(change).currentPrice).toBe(expected);
  });
});

describe("deadline brackets", () => {
  const atMinutes = (value: number) => price({ deadline: minutes(value) }).currentPrice;

  it.each([
    [119, 8800],
    [120, 8800],
    [121, 9500],
    [239, 9500],
    [240, 9500],
    [241, 10000],
  ])("%i minutes left", (left, expected) => {
    expect(atMinutes(left)).toBe(expected);
  });

  it("keeps the urgent discount after the deadline for display", () => {
    expect(atMinutes(-10)).toBe(8800);
  });
});

describe("idle demand", () => {
  it.each([
    [59, 10000],
    [60, 9500],
    [61, 9500],
  ])("%i minutes after listing with no approvals", (listed, expected) => {
    expect(price({ createdAt: minutes(-listed) }).currentPrice).toBe(expected);
  });

  it("applies no demand adjustment for one approved unit", () => {
    expect(price({ createdAt: minutes(-120), recentApprovedQuantity: 1 }).currentPrice).toBe(10000);
  });
});

describe("invalid input", () => {
  it.each([
    ["a minimum above the base price", { minPrice: 10001 }],
    ["a negative base price", { basePrice: -1 }],
    ["a zero minimum price", { minPrice: 0 }],
    ["a fractional price", { basePrice: 100.5 }],
    ["a negative quantity", { recentApprovedQuantity: -1 }],
  ])("rejects %s", (_, change) => {
    expect(() => price(change)).toThrow(RangeError);
  });
});

describe("sale deadline", () => {
  it("reads closing time in Korean time", () => {
    expect(getTodayClosing("21:00", now).toISOString()).toBe("2026-11-01T12:00:00.000Z");
  });

  it("uses the Korean date around UTC midnight", () => {
    expect(getTodayClosing("21:00", new Date("2026-11-01T16:00:00Z")).toISOString()).toBe("2026-11-02T12:00:00.000Z");
  });

  it("uses the earlier of sale end and store closing", () => {
    expect(getSaleDeadline(hours(1), "21:00", now)).toEqual(hours(1));
    expect(getSaleDeadline(hours(10), "21:00", now)).toEqual(new Date("2026-11-01T12:00:00Z"));
  });

  it("closes sales exactly at the deadline", () => {
    expect(isSaleOpen(minutes(1), now)).toBe(true);
    expect(isSaleOpen(now, now)).toBe(false);
    expect(isSaleOpen(minutes(-1), now)).toBe(false);
  });
});

import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import type { ProductView } from "./product-view";
import ReservePreview from "./reserve-preview";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }) }));
vi.mock("@/src/components/common/logout-button", () => ({ SessionAuthAction: () => null }));

const product: ProductView = {
  id: "p", name: "사과", store: "마켓", address: "주소", price: 8800, base: 10000, discount: 12, stock: 5, unit: "봉지",
  dateLabel: "11월 1일", end: "20:00", pickup: "17:30–20:00", slots: [{ label: "17:30", at: "2026-11-01T08:30:00.000Z" }],
  photo: null, description: null, saleStatus: "on_sale", hours: "09:00–21:00", pricedAt: "17:10", notice: null,
};

describe("ReservePreview", () => {
  const html = renderToStaticMarkup(<ReservePreview product={product} back="/shop" />);

  it("lets a phone type the quantity with the number keyboard", () => {
    expect(html).toContain('name="quantity"');
    expect(html).toContain('inputMode="numeric"');
    expect(html).toContain('value="1"');
  });

  it("keeps the step buttons", () => {
    expect(html).toContain('aria-label="수량 줄이기"');
    expect(html).toContain('aria-label="수량 늘리기"');
  });

  it("shows when the price was calculated", () => {
    expect(html).toContain("17:10");
  });
});

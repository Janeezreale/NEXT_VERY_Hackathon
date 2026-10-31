import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { ProductForm } from "./product-form";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

describe("ProductForm", () => {
  const html = renderToStaticMarkup(<ProductForm />);

  it("asks for everything needed to publish", () => {
    for (const name of ["name", "category", "quantity", "unit", "basePrice", "minPrice", "freshness", "saleEndsAt", "sellerConfirmed"]) {
      expect(html).toContain(`name="${name}"`);
    }
  });

  it("does not require an image", () => {
    expect(html).not.toContain('type="file"');
  });

  it("offers the three freshness levels", () => {
    for (const label of ["싱싱", "오늘 안에 판매 권장", "내일 폐기 예정"]) expect(html).toContain(label);
  });
});

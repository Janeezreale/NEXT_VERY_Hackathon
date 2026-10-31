import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { ProductForm } from "./product-form";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

describe("ProductForm", () => {
  const html = renderToStaticMarkup(<ProductForm closingTime="23:00" />);

  it("asks for everything needed to publish", () => {
    for (const name of ["name", "quantity", "unit", "basePrice", "minPrice", "freshness", "saleEndsAt", "sellerConfirmed"]) {
      expect(html).toContain(`name="${name}"`);
    }
  });

  it("tells the seller the latest sale end", () => {
    expect(html).toContain("가게 마감(23:00) 30분 전까지");
  });

  it("does not require an image", () => {
    expect(html).not.toContain('type="file"');
  });

  describe("when editing", () => {
    const product = { id: "p", storeId: "s", name: "사과", unit: "개", availableQuantity: 2, basePrice: 1000, minPrice: 500, freshness: "fresh" as const, saleEndsAt: "2099-01-01T00:00:00Z", createdAt: "2099-01-01T00:00:00Z" };
    const edit = (imageUrl: string | null) => renderToStaticMarkup(<ProductForm product={product} imageUrl={imageUrl} storeId="s" closingTime="23:00" />);

    it("shows the current photo with a way to delete it", () => {
      const withPhoto = edit("https://image/a.jpg");
      expect(withPhoto).toContain("https://image/a.jpg");
      expect(withPhoto).toContain("사진 삭제");
      expect(withPhoto).toContain('type="file"');
    });

    it("offers no delete button without a photo", () => {
      expect(edit(null)).not.toContain("사진 삭제");
    });

    it("does not promise AI suggestions", () => {
      expect(edit(null)).not.toContain("AI 제안");
      expect(edit(null)).not.toContain("이름과 수량을 제안");
    });
  });

  it("offers the three freshness levels", () => {
    for (const label of ["싱싱", "오늘 안에 판매 권장", "내일 폐기 예정"]) expect(html).toContain(label);
  });
});

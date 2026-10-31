import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { StoreForm } from "./store-form";

vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: vi.fn(), refresh: vi.fn() }) }));

describe("StoreForm", () => {
  it("shows the fields needed to register a store, without a business type", () => {
    const html = renderToStaticMarkup(<StoreForm store={null} />);
    for (const id of ["store-name", "store-address-search", "store-region", "store-address", "store-closing-time"]) {
      expect(html).toContain(`id="${id}"`);
    }
    expect(html).toContain("매장 등록하기");
    expect(html).not.toContain("업종");
  });

  it("offers Seoul districts instead of free text when there is no searched address", () => {
    const html = renderToStaticMarkup(<StoreForm store={null} />);
    expect(html).toContain("<option>강남구</option>");
    expect(html).toContain("<option>중랑구</option>");
    expect(html).not.toContain("샘플");
  });

  it("fills in the saved store when editing", () => {
    const store = { id: "store-1", name: "초록가게", regionCode: "마포구", address: "서울 마포구", closingTime: "21:00", latitude: null, longitude: null };
    const html = renderToStaticMarkup(<StoreForm store={store} />);
    for (const value of [store.name, store.regionCode, store.address, store.closingTime]) {
      expect(html).toContain(value === store.regionCode ? `<option selected="">${value}</option>` : `value="${value}"`);
    }
    expect(html).toContain("저장하기");
  });
});

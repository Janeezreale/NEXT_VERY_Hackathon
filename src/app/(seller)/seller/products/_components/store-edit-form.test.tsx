import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { demoStore } from "./demo-store";
import { demoProducts } from "./demo-products";
import StoreEditForm from "./store-edit-form";
import StoreOverview from "./store-overview";
import ProductEditForm from "./product-edit-form";

describe("가게 정보 데모 수정", () => {
  it("날짜 없이 공통 정보 입력과 저장되지 않는 데모임을 표시한다", () => {
    const html = renderToStaticMarkup(<StoreEditForm store={demoStore} onChange={() => {}} onSubmit={() => {}} onCancel={() => {}} />);
    for (const id of ["store-name", "store-address", "store-hours", "store-deadline"]) {
      expect(html).toContain(`id="${id}"`);
    }
    expect(html).not.toContain('type="datetime-local"');
    expect(html).toContain("서버·DB에 저장하지 않으며");
    expect(html).toContain("가게 정보 데모 반영");
    expect(html).toContain("취소");
    expect(html).toContain("자동 계산되지 않아요");
  });

  it("공통 정보에서 수정 진입 버튼을 제공한다", () => {
    const html = renderToStaticMarkup(<StoreOverview store={demoStore} onEdit={() => {}} />);
    expect(html).toContain("가게 정보 수정 · 데모");
  });

  it("변경한 공통 마감을 목록 상단과 모든 상품 수정 폼에서 참조한다", () => {
    const changedStore = { ...demoStore, nameLabel: "변경한 데모 가게", reservationDeadlineLabel: "18:00 (한국 시간)" };
    const overview = renderToStaticMarkup(<StoreOverview store={changedStore} onEdit={() => {}} />);
    expect(overview).toContain(changedStore.nameLabel);
    expect(overview).toContain(changedStore.reservationDeadlineLabel);
    for (const product of demoProducts) {
      const html = renderToStaticMarkup(<ProductEditForm product={product} store={changedStore} onChange={() => {}} onSubmit={() => {}} onCancel={() => {}} />);
      expect(html).toContain(changedStore.reservationDeadlineLabel);
      expect(html).not.toContain(demoStore.reservationDeadlineLabel);
    }
    expect(demoStore.reservationDeadlineLabel).toBe("19:00 (한국 시간)");
  });
});

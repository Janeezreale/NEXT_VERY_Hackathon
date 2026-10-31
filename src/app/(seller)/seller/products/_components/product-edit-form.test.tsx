import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import ProductEditForm from "./product-edit-form";
import { demoProducts } from "./demo-products";
import { demoStore } from "./demo-store";
import StoreOverview from "./store-overview";

function markup() {
  return renderToStaticMarkup(<ProductEditForm product={demoProducts[0]} store={demoStore} onChange={() => {}} onSubmit={() => {}} onCancel={() => {}} />);
}

describe("상품과 가게 운영 정보 분리", () => {
  it("가게 공통 정보와 승인 전 정책을 별도 영역에 표시한다", () => {
    const html = renderToStaticMarkup(<StoreOverview store={demoStore} onEdit={() => {}} />);
    expect(html).toContain(demoStore.nameLabel);
    expect(html).toContain(demoStore.businessHoursLabel);
    expect(html).toContain(demoStore.reservationDeadlineLabel);
    expect(html).toContain("영업 종료 30분 전 예약 접수 마감");
    expect(html).toContain("총괄 승인 전");
    expect(html).not.toContain('type="datetime-local"');
    expect(html).not.toContain('id="demo-closing"');
    expect(html).not.toContain("<input");
    expect(html).toContain("최초 가게 등록 시 한 번 설정");
  });

  it("상품 폼은 가게 시간·날짜 입력 대신 공통 마감을 참조한다", () => {
    const html = markup();
    expect(html).toContain("가게 공통 설정을 참조해요");
    expect(html).toContain(demoStore.reservationDeadlineLabel);
    expect(html).not.toContain('type="datetime-local"');
    expect(html).not.toContain('id="demo-closing"');
    expect(html).not.toContain(demoStore.addressLabel);
  });

  it("정상 판매가와 최저 판매가를 각각 읽기 전용으로 제공한다", () => {
    const html = markup();
    expect(html).toContain("정상 판매가");
    expect(html).toContain("최저 판매가");
    for (const id of ["demo-regular-price", "demo-minimum-price", "demo-price"]) {
      expect(html.match(new RegExp(`<input[^>]*id="${id}"[^>]*>`))?.[0]).toContain('readOnly=""');
    }
    expect(html).toContain(demoProducts[0].regularPriceLabel);
    expect(html).toContain(demoProducts[0].minimumPriceLabel);
  });

  it("기존 상품명·재고 입력과 데모 반영 안내를 유지한다", () => {
    const html = markup();
    expect(html).toContain('id="demo-name"');
    expect(html).toContain('id="demo-quantity"');
    expect(html).toContain("데모 변경 미리보기");
    expect(html).toContain("서버나 DB에 정보를 보내지 않습니다");
  });
});

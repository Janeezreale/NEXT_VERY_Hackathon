import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import ReservationList, { type ReservationFilter, type ReservationView } from "./reservation-list";
import { demoReservations } from "./demo-reservations";

function markup(filter: ReservationFilter = "전체", view: ReservationView = "list", items = demoReservations) {
  return renderToStaticMarkup(<ReservationList items={items} filter={filter} view={view} onFilter={() => {}} onRetry={() => {}} onDetail={() => {}} onAction={() => {}} />);
}

describe("판매자 예약 관리 데모", () => {
  it("승인 대기에서만 승인·거절 미리보기를 제공한다", () => {
    const html = markup("승인 대기");
    expect(html).toContain("DEMO-101");
    expect(html).not.toContain("DEMO-103");
    expect(html).toContain("승인 미리보기");
    expect(html).toContain("거절 미리보기");
    expect(html).not.toContain("판매 완료 미리보기");
  });
  it("예약 승인에서 판매 완료 미리보기를 제공한다", () => {
    const html = markup("예약 승인");
    expect(html).toContain("DEMO-103");
    expect(html).toContain("판매 완료 미리보기");
    expect(html).not.toContain("승인 미리보기");
  });
  it.each(["예약 거절", "예약 취소", "판매 완료"] as const)("%s 상태는 추가 처리 버튼을 제공하지 않는다", (status) => {
    const html = markup(status);
    expect(html).not.toContain("승인 미리보기");
    expect(html).not.toContain("거절 미리보기");
    expect(html).not.toContain("판매 완료 미리보기");
    expect(html).toContain("예약 상세 보기");
  });
  it("필터 결과가 없으면 전체 예약으로 돌아갈 수 있다", () => {
    expect(markup("예약 승인", "list", [])).toContain("전체 예약 보기");
  });
  it.each(["loading", "empty", "error"] as const)("%s에서는 예시 예약과 처리 버튼을 노출하지 않는다", (view) => {
    const html = markup("전체", view);
    expect(html).not.toContain("DEMO-101");
    expect(html).not.toContain("승인 미리보기");
    if (view === "loading") expect(html).toContain('aria-busy="true"');
    if (view === "error") expect(html).toContain('role="alert"');
  });
});

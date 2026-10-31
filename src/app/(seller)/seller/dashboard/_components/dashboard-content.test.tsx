import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import DashboardContent, { type DemoView, type RequestFilter } from "./dashboard-content";

function markup(view: DemoView = "overview", filter: RequestFilter = "전체") {
  return renderToStaticMarkup(<DashboardContent view={view} filter={filter} onFilter={() => {}} onRetry={() => {}} onRequest={() => {}} />);
}

describe("판매자 대시보드 데모", () => {
  it("상품별 단위를 유지하고 준비된 상품 관리 경로로 이동한다", () => {
    const html = markup();
    expect(html).toContain("판매 중 상품");
    expect(html).toContain("승인 대기");
    expect(html).toContain("픽업 대기");
    expect(html).toContain("봉지");
    expect(html).toContain("팩");
    expect(html).toContain('href="/seller/products"');
    expect(html).not.toContain('href="/seller/reservations"');
  });

  it("승인 대기 필터는 픽업 대기 요청을 제외한다", () => {
    const html = markup("overview", "승인 대기");
    expect(html).toContain("DEMO-101");
    expect(html).toContain("DEMO-102");
    expect(html).not.toContain("DEMO-103");
  });

  it("픽업 대기 필터는 승인 대기 요청을 제외한다", () => {
    const html = markup("overview", "픽업 대기");
    expect(html).toContain("DEMO-103");
    expect(html).not.toContain("DEMO-101");
    expect(html).not.toContain("DEMO-102");
  });

  it.each(["loading", "empty", "error"] as const)("%s 상태에서 상품·예약 데모 지표를 노출하지 않는다", (view) => {
    const html = markup(view);
    expect(html).not.toContain("DEMO-101");
    expect(html).not.toContain("지금 확인할 현황");
    if (view === "loading") expect(html).toContain('aria-busy="true"');
    if (view === "error") expect(html).toContain('role="alert"');
    if (view === "empty") expect(html).toContain("아직 표시할 운영 현황이 없어요");
  });
});

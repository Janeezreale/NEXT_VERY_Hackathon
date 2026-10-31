import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import ReportContent, { type ReportView } from "./report-content";
import type { DemoPeriod } from "./demo-report";

function markup(period: DemoPeriod = "week", view: ReportView = "report") {
  return renderToStaticMarkup(<ReportContent period={period} view={view} onRetry={() => {}} />);
}

describe("판매 리포트 데모", () => {
  it("주간 차트와 표의 고정 예시를 합산하고 집계 범위를 안내한다", () => {
    const html = markup();
    expect(html).toContain("120,000원");
    expect(html).toContain("22건");
    expect(html).toContain("10/25");
    expect(html).toContain("10/31");
    expect(html).toContain("순이익·정산액이 아니며");
    expect(html).toContain("누적 아님");
    expect(html).toContain("선택 기간의 데모 일별 판매 매출·완료 건수");
  });
  it("당일 선택에서는 당일 수치·표와 상품별 판매량이 표시된다", () => {
    const html = markup("day");
    expect(html).toContain("15,000원");
    expect(html).not.toContain("120,000원");
    expect(html).not.toContain("10/25");
    expect(html).toContain("2봉지");
    expect(html).toContain("2팩");
  });
  it("잔여 재고를 확정 폐기량으로 표현하거나 다른 단위로 합산하지 않는다", () => {
    const html = markup();
    expect(html).toContain("확정 폐기량이 아닙니다");
    expect(html).toContain("8봉지");
    expect(html).toContain("3팩");
    expect(html).toContain("단위가 다른 수량은 합산하지 않습니다");
  });
  it.each(["loading", "empty", "error"] as const)("%s에서는 매출 예시를 성공 데이터로 노출하지 않는다", (view) => {
    const html = markup("week", view);
    expect(html).not.toContain("120,000원");
    expect(html).not.toContain("데모 합계");
    if (view === "loading") expect(html).toContain('aria-busy="true"');
    if (view === "error") expect(html).toContain('role="alert"');
    if (view === "empty") expect(html).toContain("선택한 기간의 판매 데이터가 없어요");
  });
});

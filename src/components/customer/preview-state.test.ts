import { describe, expect, it } from "vitest";
import { availability, browseUrl, contextQuery, filtersFrom, loadState, regions, reservationMatches } from "./preview-state";

describe("consumer browse URL", () => {
  it("does not invent an initial region", () => {
    expect(filtersFrom({})).toEqual({ region: "" });
    expect(browseUrl(filtersFrom({}))).toBe("/shop");
  });
  it("round-trips the region through a detail URL", () => {
    const filters = filtersFrom({ region: "성북구" });
    const query = contextQuery(filters);
    expect(filtersFrom(Object.fromEntries(new URLSearchParams(query)))).toEqual(filters);
    expect(browseUrl(filters)).toBe(`/shop?${query}`);
  });
  it("accepts every Seoul district and no other region", () => {
    expect(regions).toHaveLength(25);
    for (const region of regions) expect(filtersFrom({ region }).region).toBe(region);
    expect(filtersFrom({ region: "샘플 동네 A" }).region).toBe("");
  });
  it("rejects unknown and duplicate query values without external navigation", () => {
    expect(browseUrl(filtersFrom({ region: "https://example.com", category: "채소" }))).toBe("/shop");
  });
  it("does not propagate developer scenarios in consumer navigation", () => {
    expect(contextQuery(filtersFrom({ region: "성북구", _preview: "error" }))).not.toContain("_preview");
  });
});
describe("UI states", () => {
  it.each([["soldout", "품절"], ["ended", "판매 종료"], ["unavailable", "재고 확인 불가"], ["", "판매 중"]])("maps external scenario %s without stock/time calculations", (input, expected) => {
    expect(availability(input)).toBe(expected);
  });
  it.each(["loading", "error"])("keeps %s distinct from a successful empty result", state => {
    expect(loadState(state)).toBe(state);
    expect(loadState("empty")).toBe("ready");
  });
  it.each(["승인 대기", "예약 승인"])("keeps %s in active reservations", status => {
    expect(reservationMatches(status, "진행 중")).toBe(true);
    expect(reservationMatches(status, "진행 완료")).toBe(false);
  });
  it.each(["예약 거절", "예약 취소", "판매 완료"])("keeps the terminal state %s visible without treating it as a completed sale", status => {
    expect(reservationMatches(status, "진행 완료")).toBe(true);
    expect(reservationMatches(status, "진행 중")).toBe(false);
    expect(reservationMatches(status, "전체")).toBe(true);
  });
});

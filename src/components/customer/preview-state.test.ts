import { describe, expect, it } from "vitest";
import { browseUrl, contextQuery, filtersFrom, regions, reservationMatches } from "./preview-state";

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
});
describe("UI states", () => {
  it.each(["승인 대기", "예약 승인"])("keeps %s in active reservations", status => {
    expect(reservationMatches(status, "진행 중")).toBe(true);
    expect(reservationMatches(status, "진행 완료")).toBe(false);
  });
  it.each(["예약 거절", "예약 취소", "판매 완료", "기한 만료", "미방문"])("keeps the terminal state %s visible without treating it as a completed sale", status => {
    expect(reservationMatches(status, "진행 완료")).toBe(true);
    expect(reservationMatches(status, "진행 중")).toBe(false);
    expect(reservationMatches(status, "전체")).toBe(true);
  });
});

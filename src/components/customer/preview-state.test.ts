import { describe, expect, it } from "vitest";
import { browseUrl, contextQuery, filtersFrom, filtersWithSavedRegion, regionCookie, regions, reservationMatches } from "./preview-state";

describe("consumer browse URL", () => {
  it("does not invent an initial region", () => {
    expect(filtersFrom({})).toEqual({ region: "", sort: "latest" });
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
describe("product sort", () => {
  it("keeps the sort through a detail URL", () => {
    const filters = filtersFrom({ region: "성북구", sort: "distance" });
    expect(filtersFrom(Object.fromEntries(new URLSearchParams(contextQuery(filters))))).toEqual(filters);
  });
  it("leaves the default out of the URL", () => {
    expect(browseUrl(filtersFrom({ sort: "latest" }))).toBe("/shop");
  });
  it("ignores an unknown sort", () => {
    expect(filtersFrom({ sort: "price" }).sort).toBe("latest");
  });
});
describe("saved region", () => {
  it("restores the saved region when the URL has none", () => {
    expect(filtersWithSavedRegion({}, "성북구").region).toBe("성북구");
  });
  it("prefers the URL", () => {
    expect(filtersWithSavedRegion({ region: "마포구" }, "성북구").region).toBe("마포구");
  });
  it("ignores a missing or tampered cookie", () => {
    expect(filtersWithSavedRegion({}, undefined).region).toBe("");
    expect(filtersWithSavedRegion({}, "샘플 동네").region).toBe("");
  });
  it("encodes the region and clears the cookie when none is selected", () => {
    expect(regionCookie("성북구")).toContain(`shop-region=${encodeURIComponent("성북구")}; path=/;`);
    expect(regionCookie("")).toContain("max-age=0");
  });
});
describe("UI states", () => {
  it("keeps a confirmed reservation in active reservations", () => {
    expect(reservationMatches("예약 확정", "진행 중")).toBe(true);
    expect(reservationMatches("예약 확정", "진행 완료")).toBe(false);
  });
  it.each(["예약 거절", "예약 취소", "판매 완료", "기한 만료", "미방문"])("keeps the terminal state %s visible without treating it as a completed sale", status => {
    expect(reservationMatches(status, "진행 완료")).toBe(true);
    expect(reservationMatches(status, "진행 중")).toBe(false);
    expect(reservationMatches(status, "전체")).toBe(true);
  });
});

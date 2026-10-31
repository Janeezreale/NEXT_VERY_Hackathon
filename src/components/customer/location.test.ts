import { describe, expect, it } from "vitest";

import { SEOUL_DISTRICTS } from "@/src/lib/regions";
import bounds from "@/src/lib/seoul-district-bounds.json";

import { distanceKm, districtAt, formatDistance, productDistance, sortProducts } from "./location";
import type { ProductView } from "./product-view";

const product = (name: string, store: string, latitude: number | null, longitude: number | null) =>
  ({ name, store, latitude, longitude }) as ProductView;

const seoulStation = { latitude: 37.5547, longitude: 126.9707 };
const gangnam = { latitude: 37.4979, longitude: 127.0276 };

const near = product("참외", "다온상회", 37.555, 126.971);
const far = product("사과", "가람마켓", gangnam.latitude, gangnam.longitude);
const unknown = product("배", "나래과일", null, null);
const list = [unknown, far, near];
const names = (items: ProductView[]) => items.map((item) => item.name);

describe("distanceKm", () => {
  it("measures a known distance", () => {
    expect(distanceKm(seoulStation, gangnam)).toBeCloseTo(8.1, 0);
  });

  it("is zero at the same place", () => {
    expect(distanceKm(gangnam, gangnam)).toBe(0);
  });
});

describe("districtAt", () => {
  it.each([
    ["성북구청 부근", 37.5894, 127.0167, "성북구"],
    ["상계역", 37.6607, 127.0735, "노원구"],
    ["신림역", 37.4842, 126.9297, "관악구"],
    ["화곡역", 37.5416, 126.8403, "강서구"],
    ["잠실역", 37.5133, 127.1001, "송파구"],
    ["홍대입구역", 37.5572, 126.9245, "마포구"],
    ["가산디지털단지역", 37.4816, 126.8827, "금천구"],
  ])("finds the district at %s", (_, latitude, longitude, district) => {
    expect(districtAt(bounds, { latitude, longitude })).toBe(district);
  });

  it.each([
    ["부산", 35.1796, 129.0756],
    ["수원", 37.2636, 127.0286],
    ["일산", 37.6584, 126.77],
    ["분당", 37.3825, 127.1189],
    ["의정부", 37.7381, 127.0337],
  ])("selects nothing in %s", (_, latitude, longitude) => {
    expect(districtAt(bounds, { latitude, longitude })).toBeNull();
  });

  it("has a boundary for every district", () => {
    expect(Object.keys(bounds).sort()).toEqual([...SEOUL_DISTRICTS].sort());
  });
});

describe("formatDistance", () => {
  it.each([
    [0.04, "40m"],
    [0.356, "360m"],
    [1, "1.0km"],
    [8.14, "8.1km"],
  ])("formats %s km", (km, label) => {
    expect(formatDistance(km)).toBe(label);
  });
});

describe("productDistance", () => {
  it("needs both my position and the store position", () => {
    expect(productDistance(near, null)).toBeNull();
    expect(productDistance(unknown, seoulStation)).toBeNull();
    expect(productDistance(near, seoulStation)).toBeLessThan(0.1);
  });
});

describe("sortProducts", () => {
  it("keeps the latest order by default", () => {
    expect(names(sortProducts(list, "latest", seoulStation))).toEqual(["배", "사과", "참외"]);
  });

  it("puts the nearest first and unknown distances last", () => {
    expect(names(sortProducts(list, "distance", seoulStation))).toEqual(["참외", "사과", "배"]);
  });

  it("keeps the order until the position is known", () => {
    expect(names(sortProducts(list, "distance", null))).toEqual(["배", "사과", "참외"]);
  });

  it("sorts by store name", () => {
    expect(sortProducts(list, "store", null).map((item) => item.store)).toEqual(["가람마켓", "나래과일", "다온상회"]);
  });

  it("sorts by product name", () => {
    expect(names(sortProducts(list, "name", null))).toEqual(["배", "사과", "참외"]);
  });

  it("does not change the list it was given", () => {
    sortProducts(list, "name", null);
    expect(names(list)).toEqual(["배", "사과", "참외"]);
  });
});

import { describe, expect, it } from "vitest";

import type { Store } from "@/src/types/api";

import { toStoreView } from "./store-view";

const store: Store = {
  id: "store-1",
  name: "초록가게",
  regionCode: "성북구",
  address: "서울 성북구",
  openingTime: "09:00",
  closingTime: "21:00",
  description: "오늘 들어온 과일을 팔아요.",
  phone: "0212345678",
  latitude: null,
  longitude: null,
};
const noon = new Date("2026-11-01T12:00:00+09:00");

describe("toStoreView", () => {
  it("shows the profile with store hours", () => {
    expect(toStoreView(store, noon)).toMatchObject({ description: "오늘 들어온 과일을 팔아요.", status: "영업 중", hours: "09:00–21:00" });
  });

  it.each([
    ["0212345678", "02-1234-5678"],
    ["0314567890", "031-456-7890"],
    ["01012345678", "010-1234-5678"],
  ])("formats %s", (phone, phoneLabel) => {
    expect(toStoreView({ ...store, phone }, noon).phoneLabel).toBe(phoneLabel);
  });

  it("leaves out a phone number the store did not give", () => {
    expect(toStoreView({ ...store, phone: null }, noon)).toMatchObject({ phone: null, phoneLabel: null });
  });

  it.each([
    ["2026-11-01T08:00:00+09:00", "영업 전"],
    ["2026-11-01T22:00:00+09:00", "오늘 영업 마감"],
  ])("reports the store at %s as %s", (at, status) => {
    expect(toStoreView(store, new Date(at)).status).toBe(status);
  });
});

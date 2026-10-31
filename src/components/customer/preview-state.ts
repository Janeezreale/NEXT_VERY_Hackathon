import { SEOUL_DISTRICTS } from "@/src/lib/regions";

// 소비자 화면의 URL과 필터 상태. API 타입이 아니다.
export type SearchValues = Record<string, string | string[] | undefined>;
export type LoadState = "ready" | "loading" | "error";
export const regions: string[] = [...SEOUL_DISTRICTS];
export const firstValue = (value: SearchValues[string]) => typeof value === "string" ? value : "";
export function filtersFrom(values: SearchValues) {
  const pick = (key: string, allowed: string[], fallback: string) => allowed.includes(firstValue(values[key])) ? firstValue(values[key]) : fallback;
  return { region: pick("region", regions, "") };
}
export const REGION_COOKIE = "shop-region";
const REGION_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;
/** 선택한 지역을 기억한다. 지역을 비우면 지운다. */
export function regionCookie(region: string) {
  return region
    ? `${REGION_COOKIE}=${encodeURIComponent(region)}; path=/; max-age=${REGION_COOKIE_MAX_AGE}; samesite=lax`
    : `${REGION_COOKIE}=; path=/; max-age=0; samesite=lax`;
}
/** URL에 지역이 없으면 기억한 지역을 쓴다. */
export function filtersWithSavedRegion(values: SearchValues, saved: string | undefined) {
  return filtersFrom({ region: saved, ...values });
}
export function browseUrl(filters: ReturnType<typeof filtersFrom>) {
  const query = new URLSearchParams();
  if (filters.region) query.set("region", filters.region);
  return `/shop${query.size ? `?${query}` : ""}`;
}
export function contextQuery(filters: ReturnType<typeof filtersFrom>) {
  return browseUrl(filters).split("?")[1] ?? "";
}
export function reservationMatches(status: string, filter: string) {
  const active = status === "예약 확정";
  return filter === "전체" || (filter === "진행 중" ? active : !active);
}

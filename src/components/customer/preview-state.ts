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

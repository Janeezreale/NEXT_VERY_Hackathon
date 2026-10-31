import { SEOUL_DISTRICTS } from "@/src/lib/regions";

// UI-only contracts for the isolated preview, not shared API/domain types.
export type SearchValues = Record<string, string | string[] | undefined>;
export type LoadState = "ready" | "loading" | "error";
export type Availability = "판매 중" | "품절" | "판매 종료" | "재고 확인 불가";
export type RequestOutcome = "unconnected" | "failure" | "unknown" | "pending";
export const regions: string[] = [...SEOUL_DISTRICTS];
export const categories = ["전체", "채소", "과일", "꽃"];
export const firstValue = (value: SearchValues[string]) => typeof value === "string" ? value : "";
export function filtersFrom(values: SearchValues) {
  const pick = (key: string, allowed: string[], fallback: string) => allowed.includes(firstValue(values[key])) ? firstValue(values[key]) : fallback;
  return { region: pick("region", regions, ""), category: pick("category", categories, "전체") };
}
export function browseUrl(filters: ReturnType<typeof filtersFrom>) {
  const query = new URLSearchParams();
  if (filters.region) query.set("region", filters.region);
  if (filters.category !== "전체") query.set("category", filters.category);
  return `/shop${query.size ? `?${query}` : ""}`;
}
export function contextQuery(filters: ReturnType<typeof filtersFrom>) {
  return browseUrl(filters).split("?")[1] ?? "";
}
export function loadState(scenario: string): LoadState {
  return scenario === "loading" || scenario === "error" ? scenario : "ready";
}
export function availability(scenario: string): Availability {
  return ({ soldout: "품절", ended: "판매 종료", unavailable: "재고 확인 불가" } as const)[scenario as "soldout" | "ended" | "unavailable"] ?? "판매 중";
}
export function reservationMatches(status: string, filter: string) {
  const active = status === "승인 대기" || status === "예약 승인";
  return filter === "전체" || (filter === "진행 중" ? active : !active);
}

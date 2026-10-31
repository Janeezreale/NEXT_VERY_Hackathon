import type { ProductView } from "./product-view";

export type Position = { latitude: number; longitude: number };

export const PRODUCT_SORTS = ["latest", "distance", "store", "name"] as const;
export type ProductSort = (typeof PRODUCT_SORTS)[number];
export const SORT_LABELS: Record<ProductSort, string> = {
  latest: "최신순",
  distance: "거리순",
  store: "가게명순",
  name: "상품명순",
};

const EARTH_RADIUS_KM = 6371;
const radians = (degrees: number) => (degrees * Math.PI) / 180;

/** 두 좌표 사이의 직선 거리(km). 실제 이동 거리가 아니다. */
export function distanceKm(from: Position, to: Position) {
  const latitude = radians(to.latitude - from.latitude);
  const longitude = radians(to.longitude - from.longitude);
  const a = Math.sin(latitude / 2) ** 2 + Math.cos(radians(from.latitude)) * Math.cos(radians(to.latitude)) * Math.sin(longitude / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(a));
}

export function formatDistance(km: number) {
  return km < 1 ? `${Math.round(km * 100) * 10}m` : `${km.toFixed(1)}km`;
}

function storePosition({ latitude, longitude }: ProductView): Position | null {
  return latitude === null || longitude === null ? null : { latitude, longitude };
}

/** 내 위치에서 상품 가게까지의 거리. 위치나 가게 좌표를 모르면 null이다. */
export function productDistance(product: ProductView, position: Position | null) {
  const store = storePosition(product);
  return position && store ? distanceKm(position, store) : null;
}

const byName = (a: string, b: string) => a.localeCompare(b, "ko");

/** 받은 순서가 최신순이다. 같은 값은 그 순서를 유지하고, 거리를 모르는 상품은 뒤로 보낸다. */
export function sortProducts(products: ProductView[], sort: ProductSort, position: Position | null) {
  const sorted = [...products];
  if (sort === "store") return sorted.sort((a, b) => byName(a.store, b.store));
  if (sort === "name") return sorted.sort((a, b) => byName(a.name, b.name));
  if (sort === "distance" && position) {
    const distance = (product: ProductView) => productDistance(product, position) ?? Infinity;
    return sorted.sort((a, b) => {
      const [left, right] = [distance(a), distance(b)];
      return left === right ? 0 : left - right;
    });
  }
  return sorted;
}

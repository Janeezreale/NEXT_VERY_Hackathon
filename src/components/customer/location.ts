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

export type DistrictBounds = Record<string, number[][][]>;

/** 점이 경계 안에 있는지 본다. 경계의 각 점은 [경도, 위도]다. */
function isInside({ latitude, longitude }: Position, ring: number[][]) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [x1, y1] = ring[i];
    const [x2, y2] = ring[j];
    if (y1 > latitude !== y2 > latitude && longitude < ((x2 - x1) * (latitude - y1)) / (y2 - y1) + x1) inside = !inside;
  }
  return inside;
}

/** 위치가 속한 구. 서울 밖이면 null이다. */
export function districtAt(bounds: DistrictBounds, position: Position) {
  return Object.keys(bounds).find((district) => bounds[district].some((ring) => isInside(position, ring))) ?? null;
}

/** 위치를 켤 때만 경계 파일을 받는다. 계산은 기기 안에서 끝나고 위치는 밖으로 나가지 않는다. */
export async function findDistrict(position: Position) {
  const { default: bounds } = await import("@/src/lib/seoul-district-bounds.json");
  return districtAt(bounds, position);
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

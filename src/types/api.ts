/**
 * 서버와 UI가 공유하는 API 타입. 계약은 docs/API_CONTRACT.md를 따른다.
 * 화면별로 같은 타입을 복제하지 않고 여기서 가져다 쓴다.
 */

export const USER_ROLES = ["consumer", "seller"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const FRESHNESS_LEVELS = ["fresh", "sell_today", "discard_tomorrow"] as const;
export type Freshness = (typeof FRESHNESS_LEVELS)[number];
export const FRESHNESS_LABELS: Record<Freshness, string> = {
  fresh: "싱싱",
  sell_today: "오늘 안에 판매 권장",
  discard_tomorrow: "내일 폐기 예정",
};

export const RESERVATION_STATUSES = ["pending", "approved", "rejected", "cancelled", "completed"] as const;
export type ReservationStatus = (typeof RESERVATION_STATUSES)[number];

export type ApiErrorCode =
  | "VALIDATION_ERROR"
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "OUT_OF_STOCK"
  | "SALE_ENDED"
  | "INVALID_TRANSITION"
  | "STORE_EXISTS"
  | "PRICE_CHANGED"
  | "IMAGE_TOO_LARGE"
  | "UNSUPPORTED_IMAGE"
  | "AI_RESULT_INVALID"
  | "AI_UNAVAILABLE"
  | "MAP_UNAVAILABLE"
  | "INTERNAL_ERROR";

export type FieldErrors = Record<string, string[]>;

export type ApiFailure = {
  error: { code: ApiErrorCode; message: string; fieldErrors?: FieldErrors };
};
export type ApiSuccess<T> = { data: T };
export type Page<T> = { items: T[]; nextCursor: string | null };

export type Me = {
  id: string;
  role: UserRole;
  regionCode: string | null;
  hasStore: boolean;
};

export type Store = {
  id: string;
  name: string;
  regionCode: string;
  address: string;
  /** 매일 마감 시각. "HH:mm" */
  closingTime: string;
  /** 주소 검색을 쓰지 못한 매장은 null이고 지도에 표시되지 않는다. */
  latitude: number | null;
  longitude: number | null;
};

export type MappedStore = Store & { latitude: number; longitude: number };

export type AddressResult = {
  roadAddress: string;
  jibunAddress: string;
  regionCode: string;
  latitude: number;
  longitude: number;
};

export type Product = {
  id: string;
  storeId: string;
  name: string;
  category: string;
  unit: string;
  availableQuantity: number;
  basePrice: number;
  minPrice: number;
  currentPrice: number;
  discountRate: number;
  freshness: Freshness;
  saleEndsAt: string;
  imageUrls: string[];
  pricedAt: string;
};

/** 판매자가 게시한 상품. 현재가는 가격 엔진이 계산하므로 여기에 넣지 않는다. */
export type SellerProduct = Pick<
  Product,
  "id" | "storeId" | "name" | "category" | "unit" | "availableQuantity" | "basePrice" | "minPrice" | "freshness" | "saleEndsAt"
> & { createdAt: string };

/** AI 제안. 불확실한 값은 null로 두고 판매자가 게시 전에 확인한다. */
export type Analysis = {
  name: string;
  estimatedQuantity: number | null;
  unit: string | null;
  freshness: Freshness;
  needsConfirmation: boolean;
  uncertaintyReason: string | null;
};

export type Reservation = {
  id: string;
  productId: string;
  quantity: number;
  confirmedUnitPrice: number;
  totalPrice: number;
  pickupAt: string;
  status: ReservationStatus;
  createdAt: string;
  store: Pick<Store, "id" | "name" | "address">;
};

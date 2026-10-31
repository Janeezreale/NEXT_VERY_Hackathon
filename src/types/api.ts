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

/** 판매자가 고르는 상품 단위. 수량은 정수이므로 무게는 kg만 둔다. */
export const PRODUCT_UNITS = ["개", "봉지", "팩", "박스", "송이", "단", "통", "kg"] as const;

/** 예약은 생성 즉시 approved로 확정된다. rejected·expired는 승인 제도가 있던 때의 이력이다. */
export const RESERVATION_STATUSES = ["approved", "rejected", "cancelled", "completed", "expired", "no_show"] as const;
export type ReservationStatus = (typeof RESERVATION_STATUSES)[number];

export type ApiErrorCode =
  | "VALIDATION_ERROR"
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "OUT_OF_STOCK"
  | "SALE_ENDED"
  | "STORE_CLOSED"
  | "INVALID_TRANSITION"
  | "STORE_EXISTS"
  | "STOCK_CHANGED"
  | "PRODUCT_HAS_RESERVATIONS"
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
  /** 매일 영업 시작 시각. "HH:mm", 06:00 이후 */
  openingTime: string;
  /** 매일 마감 시각. "HH:mm" */
  closingTime: string;
  /** 가게 프로필. 입력하지 않으면 null이다. */
  description: string | null;
  phone: string | null;
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

/** 소비자에게 보여줄 판매 상태. on_sale일 때만 예약할 수 있다. */
export type SaleStatus = "on_sale" | "sold_out" | "before_open" | "store_closed" | "sale_ended";

export type Product = {
  id: string;
  storeId: string;
  name: string;
  unit: string;
  availableQuantity: number;
  basePrice: number;
  currentPrice: number;
  discountRate: number;
  freshness: Freshness;
  saleEndsAt: string;
  /** 판매 종료와 오늘 가게 마감 30분 전 중 이른 시각. 이 시각부터 예약을 막는다. */
  saleDeadline: string;
  imageUrls: string[];
  pricedAt: string;
  saleStatus: SaleStatus;
  /** saleStatus가 on_sale이면 true */
  saleOpen: boolean;
};

/** 소비자 목록 항목. 카드에 매장 이름과 주소가 필요하다. */
export type ProductListing = Product & { store: Pick<Store, "id" | "name" | "address" | "openingTime" | "closingTime" | "latitude" | "longitude"> };

/** 판매자가 게시한 상품. 현재가는 가격 엔진이 계산하므로 여기에 넣지 않는다. */
export type SellerProduct = Pick<
  Product,
  "id" | "storeId" | "name" | "unit" | "availableQuantity" | "basePrice" | "freshness" | "saleEndsAt"
> & { minPrice: number; createdAt: string };

export type Report = {
  days: number;
  from: string;
  to: string;
  registeredProducts: number;
  requestedReservations: number;
  /** 지금 픽업을 기다리는 예약 수 */
  currentApproved: number;
  completedSales: number;
  revenue: number;
  series: { date: string; revenue: number; completed: number }[];
  products: { id: string; name: string; unit: string; soldQuantity: number; remainingQuantity: number }[];
};

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
  productName: string;
  unit: string;
  quantity: number;
  confirmedUnitPrice: number;
  totalPrice: number;
  pickupAt: string;
  status: ReservationStatus;
  createdAt: string;
  /** 취소한 쪽. 취소가 아니면 null이다. */
  cancelledBy: UserRole | null;
  /** 판매자가 진행 중 예약을 볼 때만 값이 있다. */
  contact: { name: string; phone: string } | null;
  store: Pick<Store, "id" | "name" | "address">;
};

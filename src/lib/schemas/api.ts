import { z } from "zod";

import { FRESHNESS_LEVELS, RESERVATION_STATUSES, USER_ROLES } from "../../types/api";

const text = z.string("입력해 주세요.").trim().min(1, "입력해 주세요.");
const won = z.number("금액을 입력해 주세요.").int("원 단위로 입력해 주세요.").positive("1원 이상 입력해 주세요.");
const timestamp = z.iso.datetime({ offset: true, error: "시각을 입력해 주세요." });
const imagePath = z.string().regex(/^[0-9a-f-]{36}\/[0-9a-f-]{36}\.(jpg|png|webp)$/, "사진을 다시 올려 주세요.");

export const userRoleSchema = z.enum(USER_ROLES);
export const freshnessSchema = z.enum(FRESHNESS_LEVELS);
export const reservationStatusSchema = z.enum(RESERVATION_STATUSES);

export const listQuerySchema = z.object({
  cursor: z.string().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

const hasBothOrNeitherCoordinate = ({ latitude, longitude }: { latitude?: number | null; longitude?: number | null }) =>
  (latitude === undefined) === (longitude === undefined) && (latitude === null) === (longitude === null);
const coordinateError = { path: ["latitude"], message: "위치를 다시 선택해 주세요." };

const storeFields = z.object({
  name: text,
  regionCode: text,
  address: text,
  closingTime: z.string("마감 시각을 입력해 주세요.").regex(/^([01]\d|2[0-3]):[0-5]\d$/, "마감 시각을 입력해 주세요."),
  latitude: z.number().min(-90).max(90).nullable().optional(),
  longitude: z.number().min(-180).max(180).nullable().optional(),
});

export const analysisRequestSchema = z.object({ imagePath });

export const productListQuerySchema = listQuerySchema.extend({ region: text });

export const reservationListQuerySchema = listQuerySchema.extend({ status: reservationStatusSchema.optional() });

export const storeCreateSchema = storeFields.refine(hasBothOrNeitherCoordinate, coordinateError);

export const storeUpdateSchema = storeFields
  .partial()
  .refine((value) => Object.values(value).some((field) => field !== undefined), "변경할 내용을 입력해 주세요.")
  .refine(hasBothOrNeitherCoordinate, coordinateError);

export const geocodeQuerySchema = z.object({ query: text.max(100, "100자 이내로 입력해 주세요.") });

export const productCreateSchema = z
  .object({
    name: text,
    quantity: z.number("수량을 입력해 주세요.").int("정수로 입력해 주세요.").positive("1 이상 입력해 주세요."),
    unit: text,
    basePrice: won,
    minPrice: won,
    freshness: freshnessSchema,
    saleEndsAt: timestamp,
    imagePath: imagePath.optional(),
    sellerConfirmed: z.literal(true, "내용을 확인했다고 표시해 주세요."),
  })
  .refine((value) => new Date(value.saleEndsAt) > new Date(), {
    path: ["saleEndsAt"],
    message: "판매 종료 시각은 지금 이후여야 해요.",
  })
  .refine((value) => value.minPrice <= value.basePrice, {
    path: ["minPrice"],
    message: "최저가는 기준가보다 클 수 없어요.",
  });

const productFields = {
  name: text,
  unit: text,
  basePrice: won,
  minPrice: won,
  freshness: freshnessSchema,
  saleEndsAt: timestamp,
};

export const productUpdateSchema = z
  .object({
    ...productFields,
    quantity: z.number("수량을 입력해 주세요.").int("정수로 입력해 주세요.").min(0, "0 이상 입력해 주세요."),
    expectedQuantity: z.number().int().min(0),
  })
  .refine((value) => value.minPrice <= value.basePrice, {
    path: ["minPrice"],
    message: "최저가는 기준가보다 클 수 없어요.",
  });

const phone = z
  .string("휴대폰 번호를 입력해 주세요.")
  .transform((value) => value.replace(/\D/g, ""))
  .pipe(z.string().regex(/^01\d{8,9}$/, "휴대폰 번호를 확인해 주세요."));

export const reportQuerySchema = z.object({
  days: z.coerce.number().refine((value) => [1, 7, 30].includes(value), "기간을 다시 선택해 주세요.").default(7),
});

export const reservationCreateSchema = z.object({
  productId: z.uuid(),
  contactName: text.max(30, "30자 이내로 입력해 주세요."),
  contactPhone: phone,
  quantity: z.number().int().positive(),
  pickupAt: timestamp,
  idempotencyKey: z.uuid(),
  expectedUnitPrice: won,
});

export const analysisSchema = z.object({
  name: text,
  estimatedQuantity: z.number().int().positive().nullable(),
  unit: text.nullable(),
  freshness: freshnessSchema,
  needsConfirmation: z.boolean(),
  uncertaintyReason: text.nullable(),
});

export type ListQuery = z.infer<typeof listQuerySchema>;
export type StoreCreateInput = z.infer<typeof storeCreateSchema>;
export type ProductCreateInput = z.infer<typeof productCreateSchema>;
export type ProductUpdateInput = z.infer<typeof productUpdateSchema>;
export type ReservationCreateInput = z.infer<typeof reservationCreateSchema>;

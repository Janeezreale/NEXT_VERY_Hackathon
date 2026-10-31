import { z } from "zod";

import { FRESHNESS_LEVELS, RESERVATION_STATUSES, USER_ROLES } from "../../types/api";

const text = z.string("입력해 주세요.").trim().min(1, "입력해 주세요.");
const won = z.number().int().positive();
const timestamp = z.iso.datetime({ offset: true });

export const userRoleSchema = z.enum(USER_ROLES);
export const freshnessSchema = z.enum(FRESHNESS_LEVELS);
export const reservationStatusSchema = z.enum(RESERVATION_STATUSES);

export const listQuerySchema = z.object({
  cursor: z.string().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export const storeCreateSchema = z.object({
  name: text,
  regionCode: text,
  address: text,
  closingTime: z.string("마감 시각을 입력해 주세요.").regex(/^([01]\d|2[0-3]):[0-5]\d$/, "마감 시각을 입력해 주세요."),
});

export const storeUpdateSchema = storeCreateSchema
  .partial()
  .refine((value) => Object.values(value).some((field) => field !== undefined), "변경할 내용을 입력해 주세요.");

export const productCreateSchema = z
  .object({
    name: text,
    category: text,
    quantity: z.number().int().positive(),
    unit: text,
    basePrice: won,
    minPrice: won,
    freshness: freshnessSchema,
    saleEndsAt: timestamp,
    imagePaths: z.array(text),
    sellerConfirmed: z.literal(true),
  })
  .refine((value) => value.minPrice <= value.basePrice, {
    path: ["minPrice"],
    message: "최저가는 기준가보다 클 수 없어요.",
  });

export const reservationCreateSchema = z.object({
  productId: z.uuid(),
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
export type ReservationCreateInput = z.infer<typeof reservationCreateSchema>;

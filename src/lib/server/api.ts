import "server-only";

import { NextResponse } from "next/server";
import { z } from "zod";

import type { ApiErrorCode, ApiFailure, ApiSuccess, FieldErrors } from "../../types/api";

const STATUS: Record<ApiErrorCode, number> = {
  VALIDATION_ERROR: 400,
  UNAUTHENTICATED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  OUT_OF_STOCK: 409,
  SALE_ENDED: 409,
  INVALID_TRANSITION: 409,
  STORE_EXISTS: 409,
  PRICE_CHANGED: 409,
  IMAGE_TOO_LARGE: 413,
  UNSUPPORTED_IMAGE: 415,
  AI_RESULT_INVALID: 422,
  AI_UNAVAILABLE: 503,
  MAP_UNAVAILABLE: 503,
  INTERNAL_ERROR: 500,
};

export class ApiError extends Error {
  constructor(
    readonly code: ApiErrorCode,
    message: string,
    readonly fieldErrors?: FieldErrors,
  ) {
    super(message);
  }
}

export function ok<T>(data: T, status = 200) {
  return NextResponse.json<ApiSuccess<T>>({ data }, { status });
}

function failure(error: ApiError) {
  const { code, message, fieldErrors } = error;
  return NextResponse.json<ApiFailure>(
    { error: { code, message, ...(fieldErrors ? { fieldErrors } : {}) } },
    { status: STATUS[code] },
  );
}

/** Route Handler의 오류를 공통 형식으로 바꾼다. 예상하지 못한 오류의 내용은 응답에 넣지 않는다. */
export function route<Context = unknown>(
  handler: (request: Request, context: Context) => Promise<Response>,
) {
  return async (request: Request, context: Context): Promise<Response> => {
    try {
      return await handler(request, context);
    } catch (error) {
      if (error instanceof ApiError) return failure(error);
      console.error("Unhandled API error", error);
      return failure(new ApiError("INTERNAL_ERROR", "요청을 처리하지 못했어요. 잠시 후 다시 시도해 주세요."));
    }
  };
}

export function parseInput<Schema extends z.ZodType>(schema: Schema, input: unknown): z.output<Schema> {
  const result = schema.safeParse(input);
  if (result.success) return result.data;
  const { fieldErrors } = z.flattenError(result.error);
  throw new ApiError("VALIDATION_ERROR", "입력한 내용을 확인해 주세요.", fieldErrors as FieldErrors);
}

export async function parseJson<Schema extends z.ZodType>(request: Request, schema: Schema): Promise<z.output<Schema>> {
  const body: unknown = await request.json().catch(() => {
    throw new ApiError("VALIDATION_ERROR", "요청 형식이 올바르지 않아요.");
  });
  return parseInput(schema, body);
}

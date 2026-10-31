import type { ApiErrorCode, ApiFailure, ApiSuccess, FieldErrors } from "../../types/api";

export class ApiClientError extends Error {
  constructor(
    /** NETWORK_ERROR는 응답을 받지 못한 경우다. 요청의 성공 여부를 알 수 없다. */
    readonly code: ApiErrorCode | "NETWORK_ERROR",
    message: string,
    readonly status?: number,
    readonly fieldErrors?: FieldErrors,
  ) {
    super(message);
  }
}

/** UI용 API 호출. 성공하면 data를 반환하고 실패하면 ApiClientError를 던진다. */
export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(path, init);
  } catch {
    throw new ApiClientError("NETWORK_ERROR", "서버에 연결하지 못했어요. 연결을 확인하고 다시 시도해 주세요.");
  }

  const body = (await response.json().catch(() => null)) as ApiSuccess<T> | ApiFailure | null;
  if (body && "data" in body && response.ok) return body.data;
  if (body && "error" in body) {
    const { code, message, fieldErrors } = body.error;
    throw new ApiClientError(code, message, response.status, fieldErrors);
  }
  throw new ApiClientError("INTERNAL_ERROR", "요청을 처리하지 못했어요. 잠시 후 다시 시도해 주세요.", response.status);
}

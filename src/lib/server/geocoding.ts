import "server-only";

import { z } from "zod";

import type { AddressResult } from "../../types/api";
import { ApiError } from "./api";

const GEOCODE_URL = "https://maps.apigw.ntruss.com/map-geocode/v2/geocode";
const TIMEOUT_MS = 5000;
const RESULT_COUNT = 5;

const responseSchema = z.object({
  addresses: z.array(
    z.object({
      roadAddress: z.string(),
      jibunAddress: z.string(),
      addressElements: z.array(z.object({ types: z.array(z.string()), longName: z.string() })),
      x: z.coerce.number(),
      y: z.coerce.number(),
    }),
  ),
});

type NaverAddress = z.infer<typeof responseSchema>["addresses"][number];

function unavailable() {
  return new ApiError("MAP_UNAVAILABLE", "주소 검색을 사용할 수 없어요. 주소를 직접 입력해 주세요.");
}

function element(address: NaverAddress, type: string) {
  return address.addressElements.find((item) => item.types.includes(type))?.longName;
}

function toResult(address: NaverAddress): AddressResult {
  return {
    roadAddress: address.roadAddress,
    jibunAddress: address.jibunAddress,
    // 세종시처럼 시군구가 비어 있는 주소는 시도를 지역으로 쓴다.
    regionCode: element(address, "SIGUGUN") || element(address, "SIDO") || "",
    latitude: address.y,
    longitude: address.x,
  };
}

/** 주소를 좌표로 바꾼다. 비밀 키를 쓰므로 서버에서만 호출한다. 상호명 검색은 지원하지 않는다. */
export async function searchAddress(query: string): Promise<AddressResult[]> {
  const keyId = process.env.NEXT_PUBLIC_NAVER_MAPS_CLIENT_ID;
  const key = process.env.NAVER_MAPS_CLIENT_SECRET;
  if (!keyId || !key) throw unavailable();

  const params = new URLSearchParams({ query, count: String(RESULT_COUNT) });
  let body: unknown;
  try {
    const response = await fetch(`${GEOCODE_URL}?${params}`, {
      headers: { Accept: "application/json", "x-ncp-apigw-api-key-id": keyId, "x-ncp-apigw-api-key": key },
      signal: AbortSignal.timeout(TIMEOUT_MS),
      cache: "no-store",
    });
    if (!response.ok) throw new Error(`Naver geocoding responded ${response.status}`);
    body = await response.json();
  } catch (error) {
    console.error("Naver geocoding failed", error);
    throw unavailable();
  }

  const parsed = responseSchema.safeParse(body);
  if (!parsed.success) {
    console.error("Naver geocoding returned an unexpected body", parsed.error.issues);
    throw unavailable();
  }
  return parsed.data.addresses.map(toResult).filter((result) => result.regionCode);
}

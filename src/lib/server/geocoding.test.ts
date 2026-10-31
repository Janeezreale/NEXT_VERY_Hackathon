import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { searchAddress } from "./geocoding";

vi.mock("server-only", () => ({}));

const address = (elements: Record<string, string>) => ({
  roadAddress: "서울특별시 성북구 안암로 145",
  jibunAddress: "서울특별시 성북구 안암동5가 1-2",
  addressElements: Object.entries(elements).map(([type, longName]) => ({ types: [type], longName })),
  x: "127.0316",
  y: "37.5894",
});

const respond = (body: unknown, status = 200) =>
  vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify(body), { status })));

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_NAVER_MAPS_CLIENT_ID", "key-id");
  vi.stubEnv("NAVER_MAPS_CLIENT_SECRET", "secret");
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("searchAddress", () => {
  it("maps x to longitude, y to latitude and SIGUGUN to the region", async () => {
    respond({ addresses: [address({ SIDO: "서울특별시", SIGUGUN: "성북구" })] });
    expect(await searchAddress("안암로 145")).toEqual([
      {
        roadAddress: "서울특별시 성북구 안암로 145",
        jibunAddress: "서울특별시 성북구 안암동5가 1-2",
        regionCode: "성북구",
        latitude: 37.5894,
        longitude: 127.0316,
      },
    ]);
  });

  it("sends the secret only in server request headers", async () => {
    respond({ addresses: [] });
    await searchAddress("안암로");
    const [url, init] = vi.mocked(fetch).mock.calls[0];
    expect(String(url)).not.toContain("secret");
    expect(init?.headers).toMatchObject({ "x-ncp-apigw-api-key-id": "key-id", "x-ncp-apigw-api-key": "secret" });
  });

  it("uses the province when a city has no SIGUGUN", async () => {
    respond({ addresses: [address({ SIDO: "세종특별자치시", SIGUGUN: "" })] });
    expect((await searchAddress("한누리대로"))[0].regionCode).toBe("세종특별자치시");
  });

  it("returns an empty list when nothing matches", async () => {
    respond({ addresses: [] });
    await expect(searchAddress("없는 주소")).resolves.toEqual([]);
  });

  it.each([
    ["an error status", () => respond({}, 401)],
    ["an unexpected body", () => respond({ addresses: "x" })],
    ["a network failure", () => vi.stubGlobal("fetch", vi.fn(async () => { throw new TypeError("failed"); }))],
    ["missing keys", () => vi.stubEnv("NAVER_MAPS_CLIENT_SECRET", "")],
  ])("reports %s as unavailable instead of inventing results", async (_, arrange) => {
    arrange();
    await expect(searchAddress("안암로")).rejects.toMatchObject({ code: "MAP_UNAVAILABLE" });
  });
});

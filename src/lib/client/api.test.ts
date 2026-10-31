import { afterEach, describe, expect, it, vi } from "vitest";

import { ApiClientError, apiFetch } from "./api";

const respond = (body: BodyInit, status = 200) => vi.stubGlobal("fetch", vi.fn(async () => new Response(body, { status })));
const failure = () => apiFetch("/api/test").catch((error: ApiClientError) => error);

afterEach(() => vi.unstubAllGlobals());

describe("apiFetch", () => {
  it("returns data", async () => {
    respond(JSON.stringify({ data: { id: "1" } }));
    await expect(apiFetch("/api/test")).resolves.toEqual({ id: "1" });
  });

  it("returns null data without treating it as a failure", async () => {
    respond(JSON.stringify({ data: null }));
    await expect(apiFetch("/api/test")).resolves.toBeNull();
  });

  it("throws the server error", async () => {
    const fieldErrors = { quantity: ["확인해 주세요."] };
    respond(JSON.stringify({ error: { code: "VALIDATION_ERROR", message: "안내", fieldErrors } }), 400);
    expect(await failure()).toMatchObject({ code: "VALIDATION_ERROR", message: "안내", status: 400, fieldErrors });
  });

  it("does not treat a non-JSON response as success", async () => {
    respond("<html>", 502);
    expect(await failure()).toMatchObject({ code: "INTERNAL_ERROR", status: 502 });
  });

  it("reports a failed connection separately", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => { throw new TypeError("failed"); }));
    expect(await failure()).toMatchObject({ code: "NETWORK_ERROR" });
  });
});

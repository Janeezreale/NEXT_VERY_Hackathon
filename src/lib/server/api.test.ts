import { afterEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";

import { ApiError, ok, parseJson, route } from "./api";

vi.mock("server-only", () => ({}));

const request = (body: string) => new Request("http://test/api", { method: "POST", body });
const handle = (run: () => Promise<Response>) => route(run)(request("{}"), undefined);

afterEach(() => vi.restoreAllMocks());

describe("route", () => {
  it("returns successful data in data", async () => {
    const response = await handle(async () => ok({ id: "1" }, 201));
    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({ data: { id: "1" } });
  });

  it.each([
    ["UNAUTHENTICATED", 401],
    ["FORBIDDEN", 403],
    ["OUT_OF_STOCK", 409],
    ["AI_UNAVAILABLE", 503],
  ] as const)("maps %s to %i", async (code, status) => {
    const response = await handle(async () => {
      throw new ApiError(code, "안내");
    });
    expect(response.status).toBe(status);
    expect(await response.json()).toEqual({ error: { code, message: "안내" } });
  });

  it("does not expose unexpected error details", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const response = await handle(async () => {
      throw new Error("secret connection string");
    });
    expect(response.status).toBe(500);
    expect(JSON.stringify(await response.json())).not.toContain("secret");
  });
});

describe("parseJson", () => {
  const schema = z.object({ quantity: z.number() });

  it("returns field errors for invalid values", async () => {
    const response = await handle(async () => ok(await parseJson(request('{"quantity":"x"}'), schema)));
    const { error } = await response.json();
    expect(response.status).toBe(400);
    expect(error.code).toBe("VALIDATION_ERROR");
    expect(error.fieldErrors.quantity).toHaveLength(1);
  });

  it("treats malformed JSON as a validation error", async () => {
    const response = await handle(async () => ok(await parseJson(request("{"), schema)));
    expect(response.status).toBe(400);
  });
});

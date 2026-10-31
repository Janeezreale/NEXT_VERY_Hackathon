import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET } from "./route";

vi.mock("server-only", () => ({}));

const auth = vi.hoisted(() => ({
  user: null as { id: string } | null,
  profile: { data: null as unknown, error: null as unknown },
  store: { data: null as unknown, error: null as unknown },
}));

vi.mock("../../../lib/supabase/server", () => ({
  createClient: async () => ({
    auth: { getClaims: async () => ({ data: auth.user ? { claims: { sub: auth.user.id } } : null }) },
    from: (table: string) => ({
      select: () => ({
        eq: () => ({
          single: async () => auth.profile,
          maybeSingle: async () => (table === "stores" ? auth.store : auth.profile),
        }),
      }),
    }),
  }),
}));

const get = () => GET(new Request("http://test/api/me"), undefined);

beforeEach(() => {
  auth.user = { id: "user-1" };
  auth.profile = { data: { role: "consumer", region_code: "seoul" }, error: null };
  auth.store = { data: null, error: null };
});

describe("GET /api/me", () => {
  it("rejects anonymous requests", async () => {
    auth.user = null;
    const response = await get();
    expect(response.status).toBe(401);
    expect((await response.json()).error.code).toBe("UNAUTHENTICATED");
  });

  it("returns a consumer", async () => {
    const response = await get();
    expect(await response.json()).toEqual({
      data: { id: "user-1", role: "consumer", regionCode: "seoul", hasStore: false },
    });
  });

  it.each([
    [{ id: "store-1" }, true],
    [null, false],
  ])("reports whether a seller has a store", async (store, hasStore) => {
    auth.profile = { data: { role: "seller", region_code: null }, error: null };
    auth.store = { data: store, error: null };
    expect((await (await get()).json()).data.hasStore).toBe(hasStore);
  });

  it("fails instead of guessing when the profile cannot be read", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    auth.profile = { data: null, error: new Error("db down") };
    const response = await get();
    expect(response.status).toBe(500);
    expect(JSON.stringify(await response.json())).not.toContain("db down");
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";

import { DELETE, PATCH } from "./route";

vi.mock("server-only", () => ({}));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));

const db = vi.hoisted(() => ({
  user: "seller-1" as string | null,
  role: "seller",
  rpcError: null as unknown,
  calls: [] as [string, Record<string, unknown>][],
}));

const ID = "00000000-0000-4000-8000-000000000001";
const row = { id: ID, store_id: "store-1", name: "사과", unit: "개", available_quantity: 2, base_price: 1000, min_price: 500, freshness: "fresh", sale_ends_at: "2099-01-01T00:00:00Z", created_at: "2099-01-01T00:00:00Z" };

vi.mock("../../../../../lib/supabase/server", () => ({
  createClient: async () => ({
    auth: { getClaims: async () => ({ data: db.user ? { claims: { sub: db.user } } : null }) },
    from: () => ({
      select: () => ({
        eq: () => ({
          single: async () => ({ data: { role: db.role, region_code: null }, error: null }),
          maybeSingle: async () => ({ data: { id: "store-1", name: "마켓", region_code: "성북구", address: "주소", closing_time: "23:00:00", latitude: null, longitude: null }, error: null }),
        }),
      }),
    }),
    rpc: async (name: string, args: Record<string, unknown>) => {
      db.calls.push([name, args]);
      return { data: row, error: db.rpcError };
    },
  }),
}));

const input = { name: "사과", quantity: 2, expectedQuantity: 5, unit: "개", basePrice: 1000, minPrice: 500, freshness: "fresh", saleEndsAt: "2099-01-01T00:00:00Z" };
const context = (id = ID) => ({ params: Promise.resolve({ id }) });
const patch = (body: unknown = input, id = ID) =>
  PATCH(new Request("http://test", { method: "PATCH", body: JSON.stringify(body) }), context(id));
const remove = () => DELETE(new Request("http://test", { method: "DELETE" }), context());

beforeEach(() => {
  db.user = "seller-1";
  db.role = "seller";
  db.rpcError = null;
  db.calls = [];
});

describe("PATCH /api/seller/products/:id", () => {
  it("sends the stock the seller saw", async () => {
    expect((await patch()).status).toBe(200);
    expect(db.calls[0]).toEqual(["update_product", expect.objectContaining({ p_product_id: ID, p_quantity: 2, p_expected_quantity: 5 })]);
  });

  it("allows setting stock to zero", async () => {
    expect((await patch({ ...input, quantity: 0 })).status).toBe(200);
  });

  it.each([
    ["anonymous users", () => (db.user = null), 401],
    ["consumers", () => (db.role = "consumer"), 403],
  ])("rejects %s", async (_, arrange, status) => {
    arrange();
    expect((await patch()).status).toBe(status);
    expect(db.calls).toEqual([]);
  });

  it("rejects a sale end after the reservation cutoff", async () => {
    const response = await patch({ ...input, saleEndsAt: "2099-01-01T22:31:00+09:00" });
    expect(response.status).toBe(400);
    expect((await response.json()).error.fieldErrors.saleEndsAt[0]).toContain("22:30까지만");
    expect(db.calls).toEqual([]);
  });

  it("allows the exact cutoff", async () => {
    expect((await patch({ ...input, saleEndsAt: "2099-01-01T22:30:00+09:00" })).status).toBe(200);
  });

  it("rejects a minimum price above the base price", async () => {
    expect((await patch({ ...input, minPrice: 2000 })).status).toBe(400);
  });

  it("reports stock changed by a reservation", async () => {
    db.rpcError = { message: "STOCK_CHANGED" };
    const response = await patch();
    expect(response.status).toBe(409);
    expect((await response.json()).error.code).toBe("STOCK_CHANGED");
  });

  it("returns 404 for a malformed id", async () => {
    expect((await patch(input, "x")).status).toBe(404);
  });
});

describe("DELETE /api/seller/products/:id", () => {
  it("deletes through the database function", async () => {
    expect((await remove()).status).toBe(200);
    expect(db.calls[0]).toEqual(["delete_product", { p_product_id: ID }]);
  });

  it("refuses a product with reservations", async () => {
    db.rpcError = { message: "PRODUCT_HAS_RESERVATIONS" };
    const response = await remove();
    expect(response.status).toBe(409);
    expect((await response.json()).error.code).toBe("PRODUCT_HAS_RESERVATIONS");
  });

  it("maps another seller to 403", async () => {
    db.rpcError = { message: "FORBIDDEN" };
    expect((await remove()).status).toBe(403);
  });
});

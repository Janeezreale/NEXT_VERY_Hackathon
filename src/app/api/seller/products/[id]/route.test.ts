import { beforeEach, describe, expect, it, vi } from "vitest";

import { DELETE, PATCH } from "./route";

vi.mock("server-only", () => ({}));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));

const db = vi.hoisted(() => ({
  user: "seller-1" as string | null,
  role: "seller",
  rpcError: null as unknown,
  calls: [] as [string, Record<string, unknown>][],
  images: [] as string[],
  removeError: null as unknown,
  steps: [] as unknown[][],
}));

const ID = "00000000-0000-4000-8000-000000000001";
const STORE_ID = "00000000-0000-4000-8000-00000000000a";
const OLD = `${STORE_ID}/00000000-0000-4000-8000-0000000000b1.jpg`;
const NEW = `${STORE_ID}/00000000-0000-4000-8000-0000000000b2.png`;
const OTHER = `00000000-0000-4000-8000-00000000000f/00000000-0000-4000-8000-0000000000b3.png`;
const row = { id: ID, store_id: "store-1", name: "사과", unit: "개", available_quantity: 2, base_price: 1000, min_price: 500, freshness: "fresh", sale_ends_at: "2099-01-01T00:00:00Z", created_at: "2099-01-01T00:00:00Z" };

vi.mock("../../../../../lib/supabase/server", () => ({
  createClient: async () => ({
    auth: { getClaims: async () => ({ data: db.user ? { claims: { sub: db.user } } : null }) },
    storage: {
      from: () => ({
        list: async () => ({ data: [], error: null }),
        remove: async (paths: string[]) => (db.steps.push(["remove", paths]), { error: db.removeError }),
      }),
    },
    from: (table: string) => table === "product_images" ? ({
      select: () => ({ eq: async () => ({ data: db.images.map((storage_path) => ({ storage_path })), error: null }) }),
      insert: async (value: { storage_path: string }) => (db.steps.push(["insert", value.storage_path]), { error: null }),
      delete: () => ({ eq: () => ({ in: async (_: string, paths: string[]) => (db.steps.push(["unlink", paths]), { error: null }) }) }),
    }) : ({
      select: () => ({
        eq: () => ({
          single: async () => ({ data: { role: db.role, region_code: null }, error: null }),
          maybeSingle: async () => ({ data: { id: STORE_ID, name: "마켓", region_code: "성북구", address: "주소", opening_time: "06:00:00", closing_time: "23:00:00", description: null, phone: null, latitude: null, longitude: null }, error: null }),
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
  db.images = [];
  db.removeError = null;
  db.steps = [];
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

describe("product photo", () => {
  it("leaves the photo alone when none is sent", async () => {
    db.images = [OLD];
    expect((await patch()).status).toBe(200);
    expect(db.steps).toEqual([]);
  });

  it("links the new photo before removing the old one", async () => {
    db.images = [OLD];
    expect((await patch({ ...input, imagePath: NEW })).status).toBe(200);
    expect(db.steps).toEqual([["insert", NEW], ["unlink", [OLD]], ["remove", [OLD]]]);
  });

  it("adds a photo to a product without one", async () => {
    expect((await patch({ ...input, imagePath: NEW })).status).toBe(200);
    expect(db.steps).toEqual([["insert", NEW]]);
  });

  it("removes the photo with null", async () => {
    db.images = [OLD];
    expect((await patch({ ...input, imagePath: null })).status).toBe(200);
    expect(db.steps).toEqual([["unlink", [OLD]], ["remove", [OLD]]]);
  });

  it("does nothing when the same photo is sent again", async () => {
    db.images = [OLD];
    expect((await patch({ ...input, imagePath: OLD })).status).toBe(200);
    expect(db.steps).toEqual([]);
  });

  it("rejects a file from another store", async () => {
    expect((await patch({ ...input, imagePath: OTHER })).status).toBe(403);
    expect(db.calls).toEqual([]);
  });

  it("keeps the photo when the product update fails", async () => {
    db.images = [OLD];
    db.rpcError = { message: "STOCK_CHANGED" };
    expect((await patch({ ...input, imagePath: NEW })).status).toBe(409);
    expect(db.steps).toEqual([]);
  });

  it("still saves when the old file cannot be removed", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    db.images = [OLD];
    db.removeError = new Error("storage down");
    expect((await patch({ ...input, imagePath: NEW })).status).toBe(200);
  });
});

describe("DELETE /api/seller/products/:id", () => {
  it("deletes through the database function", async () => {
    expect((await remove()).status).toBe(200);
    expect(db.calls[0]).toEqual(["delete_product", { p_product_id: ID }]);
  });

  it("removes the photo file after deleting the product", async () => {
    db.images = [OLD];
    expect((await remove()).status).toBe(200);
    expect(db.steps).toEqual([["remove", [OLD]]]);
  });

  it("still succeeds when the file cannot be removed", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    db.images = [OLD];
    db.removeError = new Error("storage down");
    expect((await remove()).status).toBe(200);
  });

  it("refuses a product with reservations", async () => {
    db.images = [OLD];
    db.rpcError = { message: "PRODUCT_HAS_RESERVATIONS" };
    const response = await remove();
    expect(response.status).toBe(409);
    expect((await response.json()).error.code).toBe("PRODUCT_HAS_RESERVATIONS");
    expect(db.steps).toEqual([]);
  });

  it("maps another seller to 403", async () => {
    db.rpcError = { message: "FORBIDDEN" };
    expect((await remove()).status).toBe(403);
  });
});

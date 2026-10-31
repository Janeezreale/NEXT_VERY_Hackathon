import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET, POST } from "./route";

vi.mock("server-only", () => ({}));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));

const db = vi.hoisted(() => ({
  user: null as { id: string } | null,
  role: "seller",
  store: null as unknown,
  rows: [] as unknown[],
  written: null as unknown,
  storeFilter: null as unknown,
  deletedFilter: null as unknown,
  limit: 0,
  or: null as string | null,
  writeError: null as unknown,
}));

vi.mock("../../../../lib/supabase/server", () => ({
  createClient: async () => ({
    auth: { getClaims: async () => ({ data: db.user ? { claims: { sub: db.user.id } } : null }) },
    storage: { from: () => ({ list: async () => ({ data: [], error: null }) }) },
    from: (table: string) => {
      if (table === "profiles") {
        return { select: () => ({ eq: () => ({ single: async () => ({ data: { role: db.role, region_code: null }, error: null }) }) }) };
      }
      if (table === "stores") {
        return { select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: db.store, error: null }) }) }) };
      }
      const query = {
        select: () => query,
        insert: (row: unknown) => ((db.written = row), query),
        eq: (_: string, value: unknown) => ((db.storeFilter = value), query),
        is: (...args: unknown[]) => ((db.deletedFilter = args), query),
        order: () => query,
        limit: (value: number) => ((db.limit = value), query),
        or: (value: string) => ((db.or = value), query),
        single: async () => ({ data: db.writeError ? null : row(), error: db.writeError }),
        then: (resolve: (value: unknown) => void) => resolve({ data: db.rows, error: null }),
      };
      return query;
    },
  }),
}));

const row = (index = 1) => ({
  id: `00000000-0000-4000-8000-00000000000${index}`,
  store_id: "store-1",
  name: "사과",
  unit: "봉지",
  available_quantity: 3,
  base_price: 10000,
  min_price: 7000,
  freshness: "fresh",
  sale_ends_at: "2099-11-01T09:00:00+00:00",
  created_at: `2026-10-31T0${index}:00:00+00:00`,
});

const input = {
  name: "사과",
  quantity: 3,
  unit: "봉지",
  basePrice: 10000,
  minPrice: 7000,
  freshness: "fresh",
  saleEndsAt: "2099-11-01T18:00:00+09:00",
  sellerConfirmed: true,
};

const post = (body: unknown) =>
  POST(new Request("http://test/api/seller/products", { method: "POST", body: JSON.stringify(body) }), undefined);
const list = (query = "") => GET(new Request(`http://test/api/seller/products${query}`), undefined);

beforeEach(() => {
  db.user = { id: "seller-1" };
  db.role = "seller";
  db.store = { id: "store-1", name: "초록가게", region_code: "마포구", address: "주소", opening_time: "06:00:00", closing_time: "21:00:00", description: null, phone: null };
  db.rows = [];
  db.written = null;
  db.storeFilter = null;
  db.or = null;
  db.writeError = null;
});

describe("POST /api/seller/products", () => {
  it("publishes a product without images to the seller's own store", async () => {
    const response = await post({ ...input, store_id: "other-store" });
    expect(response.status).toBe(201);
    expect(db.written).toEqual({
      store_id: "store-1",
      name: "사과",
      unit: "봉지",
      available_quantity: 3,
      base_price: 10000,
      min_price: 7000,
      freshness: "fresh",
      sale_ends_at: "2099-11-01T18:00:00+09:00",
    });
    const { data } = await response.json();
    expect(data).toMatchObject({ storeId: "store-1", availableQuantity: 3, basePrice: 10000 });
    expect(data).not.toHaveProperty("currentPrice");
  });

  it.each([
    ["anonymous users", () => (db.user = null), 401],
    ["consumers", () => (db.role = "consumer"), 403],
    ["sellers without a store", () => (db.store = null), 404],
  ])("rejects %s before writing", async (_, arrange, status) => {
    arrange();
    expect((await post(input)).status).toBe(status);
    expect(db.written).toBeNull();
  });

  it.each([
    ["an unconfirmed product", { sellerConfirmed: false }, "sellerConfirmed"],
    ["a minimum price above the base price", { minPrice: 10001 }, "minPrice"],
    ["a past end time", { saleEndsAt: "2000-11-01T18:00:00+09:00" }, "saleEndsAt"],
    ["a missing price", { basePrice: undefined }, "basePrice"],
    ["a sale end after the reservation cutoff", { saleEndsAt: "2099-11-01T20:31:00+09:00" }, "saleEndsAt"],
  ])("rejects %s", async (_, change, field) => {
    const response = await post({ ...input, ...change });
    const { error } = await response.json();
    expect(response.status).toBe(400);
    expect(error.fieldErrors[field][0]).toMatch(/[가-힣]/);
    expect(db.written).toBeNull();
  });

  it("does not report success when the insert fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    db.writeError = { code: "42501" };
    expect((await post(input)).status).toBe(500);
  });
});

describe("GET /api/seller/products", () => {
  it("lists only the seller's store", async () => {
    db.rows = [row()];
    const { data } = await (await list()).json();
    expect(db.storeFilter).toBe("store-1");
    expect(data.items).toHaveLength(1);
    expect(data.nextCursor).toBeNull();
  });

  it("continues from the last row of a full page", async () => {
    db.rows = [row(3), row(2), row(1)];
    const first = (await (await list("?limit=2")).json()).data;
    expect(db.limit).toBe(3);
    expect(first.items).toHaveLength(2);
    expect(first.nextCursor).not.toBeNull();

    db.rows = [row(1)];
    await list(`?limit=2&cursor=${first.nextCursor}`);
    expect(db.or).toContain(`id.lt.${row(2).id}`);
  });

  it("hides deleted products", async () => {
    await list();
    expect(db.deletedFilter).toEqual(["deleted_at", null]);
  });

  it("rejects a tampered cursor", async () => {
    expect((await list("?cursor=tampered")).status).toBe(400);
    expect(db.or).toBeNull();
  });

  it("rejects an invalid limit", async () => {
    expect((await list("?limit=51")).status).toBe(400);
  });
});

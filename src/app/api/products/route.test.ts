import { beforeEach, describe, expect, it, vi } from "vitest";

import { listPublicProducts } from "../../../lib/server/product";
import { createClient } from "../../../lib/supabase/server";
import { GET as getDetail } from "./[id]/route";
import { GET as getList } from "./route";

vi.mock("server-only", () => ({}));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));

const db = vi.hoisted(() => ({
  rows: [] as unknown[],
  error: null as unknown,
  quantities: [] as unknown[],
  rpcError: null as unknown,
  filters: [] as unknown[][],
  or: null as string | null,
}));

vi.mock("../../../lib/supabase/server", () => ({
  createClient: async () => {
    const query = {
      select: () => query,
      eq: (...args: unknown[]) => (db.filters.push(["eq", ...args]), query),
      gt: (...args: unknown[]) => (db.filters.push(["gt", args[0]]), query),
      gte: (...args: unknown[]) => (db.filters.push(["gte", ...args]), query),
      order: () => query,
      limit: () => query,
      or: (value: string) => ((db.or = value), query),
      maybeSingle: async () => ({ data: db.rows[0] ?? null, error: db.error }),
      then: (resolve: (value: unknown) => void) => resolve({ data: db.rows, error: db.error }),
    };
    return {
      from: () => query,
      rpc: async () => ({ data: db.quantities, error: db.rpcError }),
    };
  },
}));

const ID = "00000000-0000-4000-8000-000000000001";
const hours = (value: number) => new Date(Date.now() + value * 3_600_000).toISOString();

const row = (change: Record<string, unknown> = {}) => ({
  id: ID,
  store_id: "store-1",
  name: "사과",
  unit: "봉지",
  available_quantity: 3,
  base_price: 10000,
  min_price: 7000,
  freshness: "fresh",
  sale_ends_at: hours(1),
  created_at: hours(-0.25),
  stores: { id: "store-1", name: "테스트 마켓", region_code: "성북구", address: "주소", opening_time: "06:00:00", closing_time: "23:59:59", description: null, phone: null, latitude: 37.5, longitude: 127 },
  ...change,
});

const list = (query = "?region=%EC%84%B1%EB%B6%81%EA%B5%AC") => getList(new Request(`http://test/api/products${query}`), undefined);
const detail = (id = ID) => getDetail(new Request("http://test"), { params: Promise.resolve({ id }) });

beforeEach(() => {
  vi.useFakeTimers({ now: new Date("2026-11-01T03:00:00Z"), toFake: ["Date"] });
  db.rows = [];
  db.error = null;
  db.quantities = [];
  db.rpcError = null;
  db.filters = [];
  db.or = null;
});

describe("GET /api/products", () => {
  it("requires a region", async () => {
    expect((await list("")).status).toBe(400);
  });

  it("returns server-calculated prices to anonymous visitors", async () => {
    db.rows = [row()];
    const { data } = await (await list()).json();
    expect(data.items[0]).toMatchObject({ currentPrice: 8800, discountRate: 12, saleStatus: "on_sale", saleOpen: true, imageUrls: [] });
    expect(data.items[0]).not.toHaveProperty("minPrice");
    expect(data.items[0].store).toEqual({ id: "store-1", name: "테스트 마켓", address: "주소", openingTime: "06:00", closingTime: "23:59", latitude: 37.5, longitude: 127 });
    expect(data.items[0].saleDeadline).toBe(new Date(row().sale_ends_at).toISOString());
    expect(data.nextCursor).toBeNull();
  });

  it("keeps today's products until the business day ends", async () => {
    await list();
    expect(db.filters).toEqual([
      ["eq", "stores.region_code", "성북구"],
      ["gt", "available_quantity"],
      ["gte", "sale_ends_at", "2026-10-31T21:00:00.000Z"],
    ]);
  });

  it("lists one store's products for its profile", async () => {
    db.rows = [row()];
    const { items } = await listPublicProducts((await createClient()) as never, { storeId: "store-1", limit: 20 });
    expect(items).toHaveLength(1);
    expect(db.filters[0]).toEqual(["eq", "store_id", "store-1"]);
  });

  it("applies recent approved quantity to the price", async () => {
    db.rows = [row({ freshness: "discard_tomorrow", sale_ends_at: hours(10), created_at: hours(-2) })];
    db.quantities = [{ product_id: ID, quantity: 2 }];
    expect((await (await list()).json()).data.items[0].currentPrice).toBe(8800);
  });

  it("keeps a closed store's products and blocks reservations", async () => {
    db.rows = [row({ sale_ends_at: hours(-3), stores: { ...row().stores, closing_time: "10:00:00", description: null, phone: null } })];
    expect((await (await list()).json()).data.items[0]).toMatchObject({ saleStatus: "store_closed", saleOpen: false });
  });

  it("marks products of a store that has not opened", async () => {
    db.rows = [row({ stores: { ...row().stores, opening_time: "13:00:00" } })];
    expect((await (await list()).json()).data.items[0]).toMatchObject({ saleStatus: "before_open", saleOpen: false });
  });

  it("fails instead of pricing without demand data", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    db.rows = [row()];
    db.rpcError = new Error("rpc down");
    expect((await list()).status).toBe(500);
  });

  it("continues from a cursor and rejects a tampered one", async () => {
    db.rows = [row(), row({ id: "00000000-0000-4000-8000-000000000002" })];
    const { data } = await (await list("?region=x&limit=1")).json();
    expect(data.nextCursor).not.toBeNull();
    await list(`?region=x&limit=1&cursor=${data.nextCursor}`);
    expect(db.or).toContain(`id.lt.${ID}`);
    expect((await list("?region=x&cursor=tampered")).status).toBe(400);
  });
});

describe("GET /api/products/:id", () => {
  it("returns the product with its store", async () => {
    db.rows = [row()];
    const { data } = await (await detail()).json();
    expect(data.product).toMatchObject({ id: ID, currentPrice: 8800, saleOpen: true });
    expect(data.product).not.toHaveProperty("minPrice");
    expect(data.store).toMatchObject({ name: "테스트 마켓", openingTime: "06:00", closingTime: "23:59" });
    expect(data.store).not.toHaveProperty("owner_id");
  });

  it.each([
    ["sold out", { available_quantity: 0 }],
    ["ended", { sale_ends_at: hours(-1) }],
  ])("reports a %s product as closed", async (_, change) => {
    db.rows = [row(change)];
    expect((await (await detail()).json()).data.product.saleOpen).toBe(false);
  });

  it("returns 404 for a missing product and a malformed id", async () => {
    expect((await detail()).status).toBe(404);
    expect((await detail("preview-1")).status).toBe(404);
  });
});

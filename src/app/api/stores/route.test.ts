import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET } from "./route";

vi.mock("server-only", () => ({}));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));

const db = vi.hoisted(() => ({ rows: [] as unknown[], error: null as unknown, columns: "", notNull: [] as string[] }));

vi.mock("../../../lib/supabase/server", () => ({
  createClient: async () => {
    const query = {
      select: (columns: string) => ((db.columns = columns), query),
      not: (column: string) => (db.notNull.push(column), query),
      order: () => query,
      limit: () => query,
      then: (resolve: (value: unknown) => void) => resolve({ data: db.rows, error: db.error }),
    };
    return { from: () => query };
  },
}));

const row = {
  id: "store-1",
  name: "테스트 마켓",
  region_code: "성북구",
  address: "서울 성북구 안암로 145",
  opening_time: "06:00:00", closing_time: "23:00:00", description: null, phone: null,
  latitude: 37.5894,
  longitude: 127.0316,
};

beforeEach(() => {
  db.rows = [];
  db.error = null;
  db.notNull = [];
});

describe("GET /api/stores", () => {
  it("returns stores to anonymous visitors without the owner", async () => {
    db.rows = [row];
    const response = await GET(new Request("http://test/api/stores"), undefined);
    expect(response.status).toBe(200);
    expect((await response.json()).data.items).toEqual([
      { id: "store-1", name: "테스트 마켓", regionCode: "성북구", address: row.address, openingTime: "06:00", closingTime: "23:00", description: null, phone: null, latitude: row.latitude, longitude: row.longitude },
    ]);
    expect(db.columns).not.toContain("owner_id");
  });

  it("excludes stores without coordinates", async () => {
    await GET(new Request("http://test/api/stores"), undefined);
    expect(db.notNull).toEqual(["latitude"]);
  });

  it("reports a database failure", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    db.error = new Error("db down");
    expect((await GET(new Request("http://test/api/stores"), undefined)).status).toBe(500);
  });
});

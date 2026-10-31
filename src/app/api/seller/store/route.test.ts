import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET, PATCH, POST } from "./route";

vi.mock("server-only", () => ({}));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));

const db = vi.hoisted(() => ({
  user: null as { id: string } | null,
  role: "seller",
  result: { data: null as unknown, error: null as unknown },
  written: null as unknown,
  filter: null as unknown,
}));

vi.mock("../../../../lib/supabase/server", () => ({
  createClient: async () => ({
    auth: { getClaims: async () => ({ data: db.user ? { claims: { sub: db.user.id } } : null }) },
    from: (table: string) => {
      if (table === "profiles") {
        return { select: () => ({ eq: () => ({ single: async () => ({ data: { role: db.role, region_code: null }, error: null }) }) }) };
      }
      const query = {
        select: () => query,
        insert: (row: unknown) => ((db.written = row), query),
        update: (row: unknown) => ((db.written = row), query),
        eq: (column: string, value: unknown) => ((db.filter = [column, value]), query),
        single: async () => db.result,
        maybeSingle: async () => db.result,
      };
      return query;
    },
  }),
}));

const row = { id: "store-1", name: "초록가게", region_code: "마포구", address: "서울 마포구", opening_time: "06:00:00", closing_time: "21:00:00", latitude: 37.5, longitude: 127 };
const store = { id: "store-1", name: "초록가게", regionCode: "마포구", address: "서울 마포구", openingTime: "06:00", closingTime: "21:00", latitude: 37.5, longitude: 127 };
const input = { name: "초록가게", regionCode: "마포구", address: "서울 마포구", openingTime: "09:00", closingTime: "21:00" };
const send = (method: string, body: unknown) =>
  new Request("http://test/api/seller/store", { method, body: JSON.stringify(body) });

beforeEach(() => {
  db.user = { id: "seller-1" };
  db.role = "seller";
  db.result = { data: row, error: null };
  db.written = null;
  db.filter = null;
});

describe("/api/seller/store", () => {
  it("rejects anonymous users", async () => {
    db.user = null;
    expect((await GET(new Request("http://test"), undefined)).status).toBe(401);
  });

  it("checks sign-in before validating the body", async () => {
    db.user = null;
    expect((await POST(send("POST", {}), undefined)).status).toBe(401);
    expect((await PATCH(send("PATCH", {}), undefined)).status).toBe(401);
  });

  it("reports missing fields in Korean", async () => {
    const { error } = await (await POST(send("POST", { name: "초록가게" }), undefined)).json();
    expect(error.fieldErrors).toEqual({
      regionCode: ["입력해 주세요."],
      address: ["입력해 주세요."],
      openingTime: ["오픈 시각을 입력해 주세요."],
      closingTime: ["마감 시각을 입력해 주세요."],
    });
  });

  it("rejects consumers before writing", async () => {
    db.role = "consumer";
    expect((await POST(send("POST", input), undefined)).status).toBe(403);
    expect(db.written).toBeNull();
  });

  it("returns the seller's store with HH:mm closing time", async () => {
    const response = await GET(new Request("http://test"), undefined);
    expect(await response.json()).toEqual({ data: store });
    expect(db.filter).toEqual(["owner_id", "seller-1"]);
  });

  it("reports a seller without a store as not found", async () => {
    db.result = { data: null, error: null };
    expect((await GET(new Request("http://test"), undefined)).status).toBe(404);
  });

  it("creates the store for the signed-in seller, ignoring a sent owner", async () => {
    const response = await POST(send("POST", { ...input, owner_id: "someone-else" }), undefined);
    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({ data: store });
    expect(db.written).toEqual({ owner_id: "seller-1", name: "초록가게", region_code: "마포구", address: "서울 마포구", opening_time: "09:00", closing_time: "21:00", latitude: null, longitude: null });
  });

  it("returns a validation error in Korean for a blank address", async () => {
    const response = await POST(send("POST", { ...input, address: " " }), undefined);
    const { error } = await response.json();
    expect(response.status).toBe(400);
    expect(error.fieldErrors.address).toEqual(["입력해 주세요."]);
  });

  it("refuses a second store", async () => {
    db.result = { data: null, error: { code: "23505" } };
    const response = await POST(send("POST", input), undefined);
    expect(response.status).toBe(409);
    expect((await response.json()).error.code).toBe("STORE_EXISTS");
  });

  it("updates only the seller's own store", async () => {
    const response = await PATCH(send("PATCH", { address: "새 주소" }), undefined);
    expect(response.status).toBe(200);
    expect(db.filter).toEqual(["owner_id", "seller-1"]);
    expect(JSON.parse(JSON.stringify(db.written))).toEqual({ address: "새 주소", latitude: null, longitude: null });
  });

  it("keeps coordinates when the address does not change", async () => {
    await PATCH(send("PATCH", { openingTime: "09:00", closingTime: "22:00" }), undefined);
    expect(JSON.parse(JSON.stringify(db.written))).toEqual({ opening_time: "09:00", closing_time: "22:00" });
  });

  it("saves coordinates sent with a new address", async () => {
    await PATCH(send("PATCH", { address: "새 주소", latitude: 37.6, longitude: 127.1 }), undefined);
    expect(db.written).toMatchObject({ address: "새 주소", latitude: 37.6, longitude: 127.1 });
  });

  it("rejects an empty update", async () => {
    expect((await PATCH(send("PATCH", {}), undefined)).status).toBe(400);
  });

  it("reports an update without a store as not found", async () => {
    db.result = { data: null, error: null };
    expect((await PATCH(send("PATCH", { address: "새 주소" }), undefined)).status).toBe(404);
  });
});

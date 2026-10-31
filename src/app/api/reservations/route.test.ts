import { beforeEach, describe, expect, it, vi } from "vitest";

import { POST as sellerAction } from "../seller/reservations/[id]/[action]/route";
import { POST as cancel } from "./[id]/cancel/route";
import { POST } from "./route";

vi.mock("server-only", () => ({}));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));

const db = vi.hoisted(() => ({
  user: null as { id: string } | null,
  role: "consumer",
  existing: null as unknown,
  product: null as unknown,
  rpcError: null as unknown,
  rpcCalls: [] as [string, unknown][],
}));

const ID = "00000000-0000-4000-8000-000000000001";
const reservationRow = {
  id: ID,
  product_id: ID,
  quantity: 1,
  confirmed_unit_price: 8800,
  total_price: 8800,
  pickup_at: "2099-01-01T00:00:00Z",
  status: "approved",
  created_at: "2099-01-01T00:00:00Z",
  cancelled_by: null,
  products: { name: "사과", unit: "개", store_id: "store-1", stores: { id: "store-1", name: "마켓", address: "주소" }, product_images: [{ storage_path: "store-1/a.jpg" }] },
};

function client() {
  const query = (table: string) => {
    const chain = {
      select: () => chain,
      eq: () => chain,
      single: async () => ({
        data: table === "profiles" ? { role: db.role, region_code: null } : reservationRow,
        error: null,
      }),
      maybeSingle: async () => ({ data: table === "products" ? db.product : db.existing, error: null }),
    };
    return chain;
  };
  return {
    auth: { getClaims: async () => ({ data: db.user ? { claims: { sub: db.user.id } } : null }) },
    from: query,
    rpc: async (name: string, args: unknown) => {
      db.rpcCalls.push([name, args]);
      if (name === "recent_approved_quantities") return { data: [], error: null };
      if (name === "reservation_contacts") return { data: [], error: null };
      return { data: { id: ID }, error: db.rpcError };
    },
  };
}

vi.mock("../../../lib/supabase/server", () => ({ createClient: async () => client() }));
vi.mock("../../../lib/supabase/admin", () => ({ createAdminClient: () => client() }));

const hours = (value: number) => new Date(Date.now() + value * 3_600_000).toISOString();
const productRow = (change: Record<string, unknown> = {}) => ({
  id: ID,
  store_id: "store-1",
  name: "사과",
  unit: "개",
  available_quantity: 3,
  base_price: 10000,
  min_price: 7000,
  freshness: "fresh",
  sale_ends_at: hours(1),
  created_at: hours(-0.25),
  stores: { id: "store-1", name: "마켓", region_code: "성북구", address: "주소", opening_time: "06:00:00", closing_time: "23:59:59", description: null, phone: null, latitude: null, longitude: null },
  ...change,
});

const input = {
  productId: ID,
  quantity: 1,
  pickupAt: "2099-01-01T00:00:00Z",
  idempotencyKey: "00000000-0000-4000-8000-000000000002",
  expectedUnitPrice: 8800,
  contactName: "홍길동",
  contactPhone: "010-1234-5678",
};
const reserve = (body: unknown = input) =>
  POST(new Request("http://test/api/reservations", { method: "POST", body: JSON.stringify(body) }), undefined);
const rpcNames = () => db.rpcCalls.map(([name]) => name);

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://project.supabase.co");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "key");
  vi.useFakeTimers({ now: new Date("2026-11-01T03:00:00Z"), toFake: ["Date"] });
  db.user = { id: "consumer-1" };
  db.role = "consumer";
  db.existing = null;
  db.product = productRow();
  db.rpcError = null;
  db.rpcCalls = [];
});

describe("POST /api/reservations", () => {
  it("requires sign-in", async () => {
    db.user = null;
    expect((await reserve()).status).toBe(401);
  });

  it("rejects sellers", async () => {
    db.role = "seller";
    expect((await reserve()).status).toBe(403);
    expect(rpcNames()).not.toContain("create_reservation");
  });

  it("stores the server price, not the requested one", async () => {
    const response = await reserve();
    expect(response.status).toBe(201);
    const [, args] = db.rpcCalls.find(([name]) => name === "create_reservation") as [string, Record<string, unknown>];
    expect(args).toMatchObject({ p_consumer_id: "consumer-1", p_unit_price: 8800, p_quantity: 1, p_contact_name: "홍길동", p_contact_phone: "01012345678" });
    const { data } = await response.json();
    expect(data).toMatchObject({ productName: "사과", confirmedUnitPrice: 8800, status: "approved" });
    expect(data.imageUrl).toContain("/storage/v1/object/public/product-images/store-1/a.jpg");
  });

  it("rejects a changed price before reserving", async () => {
    const response = await reserve({ ...input, expectedUnitPrice: 9000 });
    expect(response.status).toBe(409);
    expect((await response.json()).error.code).toBe("PRICE_CHANGED");
    expect(rpcNames()).not.toContain("create_reservation");
  });

  it("returns the existing reservation for a retried key, even if the price changed", async () => {
    db.existing = { id: ID };
    const response = await reserve({ ...input, expectedUnitPrice: 1 });
    expect(response.status).toBe(201);
    expect(rpcNames()).not.toContain("create_reservation");
  });

  it.each([
    ["sold out", { available_quantity: 0 }, "OUT_OF_STOCK"],
    ["ended", { sale_ends_at: hours(-1) }, "SALE_ENDED"],
    ["closed", { stores: { ...productRow().stores, closing_time: "10:00:00", description: null, phone: null } }, "STORE_CLOSED"],
    ["not yet open", { stores: { ...productRow().stores, opening_time: "13:00:00" } }, "STORE_CLOSED"],
  ])("rejects a %s product", async (_, change, code) => {
    db.product = productRow(change);
    const response = await reserve();
    expect(response.status).toBe(409);
    expect((await response.json()).error.code).toBe(code);
  });

  it("maps database errors raised during the race for stock", async () => {
    db.rpcError = { message: "OUT_OF_STOCK" };
    const response = await reserve();
    expect(response.status).toBe(409);
    expect((await response.json()).error.code).toBe("OUT_OF_STOCK");
  });

  it("hides unexpected database errors", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    db.rpcError = { message: "connection string secret" };
    const response = await reserve();
    expect(response.status).toBe(500);
    expect(JSON.stringify(await response.json())).not.toContain("secret");
  });

  it("rejects a bad phone number", async () => {
    const response = await reserve({ ...input, contactPhone: "02-123-4567" });
    expect(response.status).toBe(400);
    expect((await response.json()).error.fieldErrors.contactPhone).toEqual(["휴대폰 번호를 확인해 주세요."]);
  });

  it("requires an idempotency key", async () => {
    expect((await reserve({ ...input, idempotencyKey: undefined })).status).toBe(400);
  });
});

describe("status changes", () => {
  const act = (action: string, id = ID) =>
    sellerAction(new Request("http://test", { method: "POST" }), { params: Promise.resolve({ id, action }) });

  it.each([
    ["cancel", "seller_cancel"],
    ["no-show", "no_show"],
    ["complete", "complete"],
  ])("maps seller action %s", async (action, expected) => {
    db.role = "seller";
    expect((await act(action)).status).toBe(200);
    expect(db.rpcCalls).toContainEqual(["change_reservation_status", { p_reservation_id: ID, p_action: expected }]);
  });

  it("rejects consumers on seller actions", async () => {
    expect((await act("complete")).status).toBe(403);
  });

  it("returns 404 for an unknown action or id", async () => {
    db.role = "seller";
    expect((await act("approve")).status).toBe(404);
    expect((await act("reject")).status).toBe(404);
    expect((await act("complete", "x")).status).toBe(404);
    expect(rpcNames()).toEqual([]);
  });

  it("maps an invalid transition", async () => {
    db.role = "seller";
    db.rpcError = { message: "INVALID_TRANSITION" };
    expect((await act("complete")).status).toBe(409);
  });

  it("lets a consumer cancel", async () => {
    const response = await cancel(new Request("http://test", { method: "POST" }), { params: Promise.resolve({ id: ID }) });
    expect(response.status).toBe(200);
    expect(db.rpcCalls).toContainEqual(["change_reservation_status", { p_reservation_id: ID, p_action: "cancel" }]);
  });
});

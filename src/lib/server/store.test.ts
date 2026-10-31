import { beforeEach, describe, expect, it, vi } from "vitest";

import { ApiError } from "./api";
import { loadSellerStore } from "./store";

vi.mock("server-only", () => ({}));

const mocks = vi.hoisted(() => ({
  redirect: vi.fn((path: string) => {
    throw new Error(`redirect ${path}`);
  }),
  requireSeller: vi.fn(),
}));

vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));
vi.mock("./auth", () => ({ requireSeller: mocks.requireSeller }));
vi.mock("../supabase/server", () => ({ createClient: vi.fn() }));

beforeEach(() => vi.clearAllMocks());

describe("loadSellerStore", () => {
  it("tells a consumer why the seller screen was left", async () => {
    mocks.requireSeller.mockRejectedValue(new ApiError("FORBIDDEN", "판매자만 사용할 수 있어요."));
    await expect(loadSellerStore()).rejects.toThrow("redirect /shop?notice=seller-only");
  });

  it("sends a signed-out visitor to login", async () => {
    mocks.requireSeller.mockRejectedValue(new ApiError("UNAUTHENTICATED", "로그인이 필요해요."));
    await expect(loadSellerStore()).rejects.toThrow("redirect /login");
  });
});

import { describe, expect, it, vi } from "vitest";

import { loadRecentApprovedQuantities } from "./pricing";

vi.mock("server-only", () => ({}));

type Supabase = Parameters<typeof loadRecentApprovedQuantities>[0];
const client = (result: { data: unknown; error: unknown }) => {
  const rpc = vi.fn(async () => result);
  return { rpc, supabase: { rpc } as unknown as Supabase };
};

describe("loadRecentApprovedQuantities", () => {
  it("does not query for an empty list", async () => {
    const { rpc, supabase } = client({ data: [], error: null });
    expect((await loadRecentApprovedQuantities(supabase, [])).size).toBe(0);
    expect(rpc).not.toHaveBeenCalled();
  });

  it("maps quantities by product", async () => {
    const { rpc, supabase } = client({ data: [{ product_id: "a", quantity: 3 }], error: null });
    const result = await loadRecentApprovedQuantities(supabase, ["a", "b"]);
    expect(rpc).toHaveBeenCalledWith("recent_approved_quantities", { product_ids: ["a", "b"] });
    expect(result.get("a")).toBe(3);
    expect(result.has("b")).toBe(false);
  });

  it("does not treat a failed query as zero demand", async () => {
    const { supabase } = client({ data: null, error: new Error("db down") });
    await expect(loadRecentApprovedQuantities(supabase, ["a"])).rejects.toThrow("db down");
  });
});

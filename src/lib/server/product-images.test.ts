import { beforeEach, describe, expect, it, vi } from "vitest";

import { removeUnusedImages } from "./product";

vi.mock("server-only", () => ({}));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));

const STORE = "store-1";
const now = new Date("2026-11-03T00:00:00Z");
const OLD = "2026-11-01T00:00:00Z";
const RECENT = "2026-11-02T12:00:00Z";

const state = {
  files: [] as { name: string; created_at: string | null }[],
  linked: [] as string[],
  listError: null as unknown,
  linkedError: null as unknown,
  removed: [] as string[][],
};

const client = {
  storage: {
    from: () => ({
      list: async () => ({ data: state.files, error: state.listError }),
      remove: async (paths: string[]) => (state.removed.push(paths), { error: null }),
    }),
  },
  from: () => ({
    select: () => ({
      in: async (_: string, paths: string[]) => ({
        data: state.linked.filter((path) => paths.includes(path)).map((storage_path) => ({ storage_path })),
        error: state.linkedError,
      }),
    }),
  }),
};

const run = () => removeUnusedImages(client as unknown as Parameters<typeof removeUnusedImages>[0], STORE, now);

beforeEach(() => {
  state.files = [];
  state.linked = [];
  state.listError = null;
  state.linkedError = null;
  state.removed = [];
});

describe("removeUnusedImages", () => {
  it("removes an old file no product uses", async () => {
    state.files = [{ name: "left.jpg", created_at: OLD }];
    await run();
    expect(state.removed).toEqual([[`${STORE}/left.jpg`]]);
  });

  it("keeps a file a product uses", async () => {
    state.files = [{ name: "used.jpg", created_at: OLD }, { name: "left.jpg", created_at: OLD }];
    state.linked = [`${STORE}/used.jpg`];
    await run();
    expect(state.removed).toEqual([[`${STORE}/left.jpg`]]);
  });

  it("keeps a recent upload the seller may still be publishing", async () => {
    state.files = [{ name: "new.jpg", created_at: RECENT }];
    await run();
    expect(state.removed).toEqual([]);
  });

  it("skips entries without a date, such as folders", async () => {
    state.files = [{ name: ".emptyFolderPlaceholder", created_at: null }];
    await run();
    expect(state.removed).toEqual([]);
  });

  it("removes nothing when it cannot tell which files are used", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    state.files = [{ name: "used.jpg", created_at: OLD }];
    state.linkedError = new Error("db down");
    await expect(run()).resolves.toBeUndefined();
    expect(state.removed).toEqual([]);
  });

  it("never fails the save", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    state.listError = new Error("storage down");
    await expect(run()).resolves.toBeUndefined();
  });
});

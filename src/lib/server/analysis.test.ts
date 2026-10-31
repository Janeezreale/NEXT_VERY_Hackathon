import { beforeEach, describe, expect, it, vi } from "vitest";

import { analyzeImage } from "./analysis";

vi.mock("server-only", () => ({}));

const openai = vi.hoisted(() => ({ parse: vi.fn() }));
vi.mock("openai", () => ({ default: class { responses = { parse: openai.parse }; } }));

const result = { name: "사과", estimatedQuantity: null, unit: null, freshness: "fresh", needsConfirmation: true, uncertaintyReason: "수량이 가려져 있어요." };

beforeEach(() => {
  vi.stubEnv("OPENAI_API_KEY", "key");
  vi.stubEnv("OPENAI_VISION_MODEL", "model");
  openai.parse.mockReset();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("analyzeImage", () => {
  it("keeps uncertain values as null", async () => {
    openai.parse.mockResolvedValue({ output_parsed: result });
    await expect(analyzeImage("https://image")).resolves.toEqual(result);
  });

  it("sends the image with a prompt that excludes prices and food safety", async () => {
    openai.parse.mockResolvedValue({ output_parsed: result });
    await analyzeImage("https://image");
    const { input } = openai.parse.mock.calls[0][0];
    expect(input[0].content[1]).toMatchObject({ type: "input_image", image_url: "https://image" });
    expect(input[0].content[0].text).toContain("가격은 제안하지 않습니다");
    expect(input[0].content[0].text).toContain("식품 안전성");
  });

  it("reports a failed call instead of inventing a result", async () => {
    openai.parse.mockRejectedValue(new Error("timeout"));
    await expect(analyzeImage("https://image")).rejects.toMatchObject({ code: "AI_UNAVAILABLE" });
  });

  it("rejects an invalid result", async () => {
    openai.parse.mockResolvedValue({ output_parsed: { ...result, name: "  ", estimatedQuantity: -1 } });
    await expect(analyzeImage("https://image")).rejects.toMatchObject({ code: "AI_RESULT_INVALID" });
  });

  it("does not call OpenAI without configuration", async () => {
    vi.stubEnv("OPENAI_VISION_MODEL", "");
    await expect(analyzeImage("https://image")).rejects.toMatchObject({ code: "AI_UNAVAILABLE" });
    expect(openai.parse).not.toHaveBeenCalled();
  });
});

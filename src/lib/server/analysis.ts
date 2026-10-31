import "server-only";

import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { z } from "zod";

import { analysisSchema } from "../schemas/api";
import { FRESHNESS_LEVELS, type Analysis } from "../../types/api";
import { ApiError } from "./api";

const TIMEOUT_MS = 30_000;

const PROMPT = `사진 속 신선식품을 한국어로 분석해 주세요.
- 대표 상품 하나의 이름, 보이는 수량, 단위를 제안합니다.
- 수량이나 단위가 불확실하면 null로 두고 needsConfirmation을 true로 합니다. 추측해서 채우지 않습니다.
- freshness는 외관만 보고 제안합니다. fresh는 싱싱함, sell_today는 오늘 안에 판매 권장, discard_tomorrow는 내일 폐기 예정입니다.
- 식품 안전성이나 유통기한을 판단하지 않습니다.
- 가격은 제안하지 않습니다.`;

/** 모델 출력 형식. 길이·범위 검사는 analysisSchema가 한 번 더 한다. */
const outputSchema = z.object({
  name: z.string(),
  estimatedQuantity: z.number().int().nullable(),
  unit: z.string().nullable(),
  freshness: z.enum(FRESHNESS_LEVELS),
  needsConfirmation: z.boolean(),
  uncertaintyReason: z.string().nullable(),
});

function unavailable() {
  return new ApiError("AI_UNAVAILABLE", "사진을 분석하지 못했어요. 다시 시도하거나 직접 입력해 주세요.");
}

export async function analyzeImage(imageUrl: string): Promise<Analysis> {
  const model = process.env.OPENAI_VISION_MODEL;
  if (!model || !process.env.OPENAI_API_KEY) throw unavailable();

  const client = new OpenAI({ timeout: TIMEOUT_MS, maxRetries: 0 });
  let output: unknown;
  try {
    const response = await client.responses.parse({
      model,
      input: [
        {
          role: "user",
          content: [
            { type: "input_text", text: PROMPT },
            { type: "input_image", image_url: imageUrl, detail: "low" },
          ],
        },
      ],
      text: { format: zodTextFormat(outputSchema, "analysis") },
    });
    output = response.output_parsed;
  } catch (error) {
    console.error("Image analysis failed", error);
    throw unavailable();
  }

  const parsed = analysisSchema.safeParse(output);
  if (!parsed.success) {
    console.error("Image analysis returned an invalid result", parsed.error.issues);
    throw new ApiError("AI_RESULT_INVALID", "분석 결과를 확인하지 못했어요. 다시 분석하거나 직접 입력해 주세요.");
  }
  return parsed.data;
}

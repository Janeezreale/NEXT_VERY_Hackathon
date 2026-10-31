import { analysisRequestSchema } from "../../../../lib/schemas/api";
import { analyzeImage } from "../../../../lib/server/analysis";
import { ok, parseJson, route } from "../../../../lib/server/api";
import { assertOwnImage, imagePublicUrl } from "../../../../lib/server/product";
import { requireSellerStore } from "../../../../lib/server/store";

export const POST = route(async (request) => {
  const { store } = await requireSellerStore();
  const { imagePath } = await parseJson(request, analysisRequestSchema);
  assertOwnImage(imagePath, store.id);
  return ok(await analyzeImage(imagePublicUrl(imagePath)));
});

import ReservePreview from "../../../../../../components/customer/reserve-preview";
import { previewProducts } from "../../../../../../components/customer/preview-data";
import { PreviewShell } from "../../../../../../components/customer/preview-ui";
import { filtersFrom, contextQuery, firstValue, type SearchValues, type RequestOutcome } from "../../../../../../components/customer/preview-state";

export default async function ReservePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<SearchValues> }) {
  const { id } = await params;
  const product = previewProducts.find(item => item.id === id);
  if (!product) return <PreviewShell back="/shop"><h1>상품을 찾을 수 없어요</h1><p>시연 목록에서 상품을 선택해 주세요.</p></PreviewShell>;
  const values = await searchParams;
  const query = contextQuery(filtersFrom(values));
  const scenario = firstValue(values._preview);
  const outcome: RequestOutcome = scenario === "failure" || scenario === "unknown" || scenario === "pending" ? scenario : "unconnected";
  return <ReservePreview product={product} back={`/shop/products/${encodeURIComponent(id)}${query ? `?${query}` : ""}`} outcome={outcome} />;
}

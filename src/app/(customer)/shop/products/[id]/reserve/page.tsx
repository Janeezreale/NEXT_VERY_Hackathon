import { redirect } from "next/navigation";

import { PreviewShell } from "../../../../../../components/customer/preview-ui";
import ReservePreview from "../../../../../../components/customer/reserve-preview";
import { contextQuery, filtersFrom, type SearchValues } from "../../../../../../components/customer/preview-state";
import { loadProduct } from "../load-product";

export default async function ReservePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<SearchValues> }) {
  const { id } = await params;
  const query = contextQuery(filtersFrom(await searchParams));
  const detailUrl = `/shop/products/${encodeURIComponent(id)}${query ? `?${query}` : ""}`;
  const loaded = await loadProduct(id);

  if (loaded.status !== "ready") {
    return loaded.status === "missing"
      ? <PreviewShell back="/shop"><h1>상품을 찾을 수 없어요</h1><p>목록에서 다른 상품을 선택해 주세요.</p></PreviewShell>
      : <PreviewShell back={detailUrl}><h1>상품을 불러오지 못했어요</h1><p>잠시 후 다시 시도해 주세요.</p></PreviewShell>;
  }
  if (!loaded.saleOpen) redirect(detailUrl);
  return <ReservePreview product={loaded.view} back={detailUrl} />;
}

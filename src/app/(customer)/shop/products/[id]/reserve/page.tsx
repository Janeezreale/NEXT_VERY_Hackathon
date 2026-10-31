import ReservePreview from "../../../../../../components/customer/reserve-preview";
import { previewProducts } from "../../../../../../components/customer/preview-data";
import { PreviewShell, PreviewUnavailable } from "../../../../../../components/customer/preview-ui";

export default async function ReservePage({ params }: { params: Promise<{ id: string }> }) {
  if (process.env.NODE_ENV !== "development") return <PreviewUnavailable />;
  const { id } = await params;
  const product = previewProducts.find(item => item.id === id);
  if (!product) return <PreviewShell back="/shop"><h1>상품을 찾을 수 없어요</h1><p>시연 목록에서 상품을 선택해 주세요.</p></PreviewShell>;
  return <ReservePreview product={product} />;
}

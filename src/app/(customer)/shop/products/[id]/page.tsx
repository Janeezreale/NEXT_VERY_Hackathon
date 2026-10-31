import ProductPreview from "../../../../../components/customer/product-preview";
import { previewProducts } from "../../../../../components/customer/preview-data";
import { PreviewShell, PreviewUnavailable } from "../../../../../components/customer/preview-ui";

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  if (process.env.NODE_ENV !== "development") return <PreviewUnavailable />;
  const { id } = await params;
  const product = previewProducts.find(item => item.id === id);
  if (!product) return <PreviewShell back="/shop"><h1>상품을 찾을 수 없어요</h1><p>개발용 목록에서 상품을 다시 선택해 주세요.</p></PreviewShell>;
  return <ProductPreview product={product} />;
}

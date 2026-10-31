import ProductPreview from "../../../../../components/customer/product-preview";
import { previewProducts } from "../../../../../components/customer/preview-data";
import { PreviewUnavailable } from "../../../../../components/customer/preview-ui";
import { filtersFrom, browseUrl, contextQuery, firstValue, loadState, availability, type SearchValues } from "../../../../../components/customer/preview-state";

export default async function ProductPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<SearchValues> }) {
  if (process.env.NODE_ENV !== "development") return <PreviewUnavailable />;
  const { id } = await params;
  const values = await searchParams;
  const filters = filtersFrom(values);
  const query = contextQuery(filters);
  const scenario = firstValue(values._preview);
  const original = previewProducts.find(item => item.id === id);
  const product = scenario === "missing" ? undefined : original && { ...original, ...(scenario === "long" ? { name: "함께 나누기 좋은 아주 긴 이름의 제철 채소 꾸러미와 다양한 계절 채소 구성 안내" } : {}), ...(scenario === "photo" ? { photo: "missing-preview-photo" } : {}) };
  return <ProductPreview product={product} state={loadState(scenario)} availability={availability(scenario)} back={browseUrl(filters)} detailUrl={`/shop/products/${encodeURIComponent(id)}${query ? `?${query}` : ""}`} />;
}

import ProductPreview from "../../../../../components/customer/product-preview";
import { browseUrl, contextQuery, filtersFrom, type SearchValues } from "../../../../../components/customer/preview-state";
import { loadProduct } from "./load-product";

export default async function ProductPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<SearchValues> }) {
  const { id } = await params;
  const filters = filtersFrom(await searchParams);
  const query = contextQuery(filters);
  const loaded = await loadProduct(id);
  return (
    <ProductPreview
      product={loaded.status === "ready" ? loaded.view : undefined}
      state={loaded.status === "error" ? "error" : "ready"}
      back={browseUrl(filters)}
      detailUrl={`/shop/products/${encodeURIComponent(id)}${query ? `?${query}` : ""}`}
    />
  );
}

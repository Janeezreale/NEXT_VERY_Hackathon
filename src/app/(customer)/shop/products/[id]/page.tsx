import ProductPreview from "../../../../../components/customer/product-preview";
import { browseUrl, contextQuery, filtersFrom, type SearchValues } from "../../../../../components/customer/preview-state";
import { loadProduct } from "./load-product";

export default async function ProductPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<SearchValues> }) {
  const { id } = await params;
  const filters = filtersFrom(await searchParams);
  const query = contextQuery(filters);
  const loaded = await loadProduct(id);
  const ready = loaded.status === "ready";
  const availability = !ready || loaded.saleOpen ? "판매 중" : loaded.soldOut ? "품절" : "판매 종료";
  return (
    <ProductPreview
      product={ready ? loaded.view : undefined}
      state={loaded.status === "error" ? "error" : "ready"}
      availability={availability}
      back={browseUrl(filters)}
      detailUrl={`/shop/products/${encodeURIComponent(id)}${query ? `?${query}` : ""}`}
    />
  );
}

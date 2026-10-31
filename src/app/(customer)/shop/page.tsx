import { cookies } from "next/headers";

import BrowsePreview from "../../../components/customer/browse-preview";
import { filtersWithSavedRegion, REGION_COOKIE, type SearchValues } from "../../../components/customer/preview-state";
import { toProductView, type ProductView } from "../../../components/customer/product-view";
import { listPublicProducts } from "../../../lib/server/product";
import { createClient } from "../../../lib/supabase/server";

const LIST_LIMIT = 50;

async function loadProducts(region: string): Promise<ProductView[] | null> {
  try {
    const { items } = await listPublicProducts(await createClient(), { region, limit: LIST_LIMIT });
    const now = new Date();
    return items.map((item) => toProductView(item, item.store, now));
  } catch (error) {
    console.error("Failed to load products", error);
    return null;
  }
}

export default async function ShopPage({ searchParams }: { searchParams: Promise<SearchValues> }) {
  const filters = filtersWithSavedRegion(await searchParams, (await cookies()).get(REGION_COOKIE)?.value);
  const products = filters.region ? await loadProducts(filters.region) : [];
  return <BrowsePreview filters={filters} products={products ?? []} state={products ? "ready" : "error"} />;
}

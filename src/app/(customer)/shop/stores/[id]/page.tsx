import { toProductView, type ProductView } from "../../../../../components/customer/product-view";
import StorePreview from "../../../../../components/customer/store-preview";
import { toStoreView } from "../../../../../components/customer/store-view";
import { listPublicProducts } from "../../../../../lib/server/product";
import { findPublicStore } from "../../../../../lib/server/store";
import { createClient } from "../../../../../lib/supabase/server";

const LIST_LIMIT = 50;

async function load(id: string) {
  try {
    const supabase = await createClient();
    const store = await findPublicStore(supabase, id);
    if (!store) return { store: null, products: [] as ProductView[], state: "ready" as const };
    const { items } = await listPublicProducts(supabase, { storeId: id, limit: LIST_LIMIT });
    const now = new Date();
    return { store: toStoreView(store, now), products: items.map((item) => toProductView(item, item.store, now)), state: "ready" as const };
  } catch (error) {
    console.error("Failed to load store", error);
    return { store: null, products: [] as ProductView[], state: "error" as const };
  }
}

export default async function StorePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <StorePreview {...await load(id)} />;
}

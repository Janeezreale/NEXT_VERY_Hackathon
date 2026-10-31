import { z } from "zod";

import { toProductView, type ProductView } from "../../../../../components/customer/product-view";
import { ApiError } from "../../../../../lib/server/api";
import { findPublicProduct } from "../../../../../lib/server/product";
import { createClient } from "../../../../../lib/supabase/server";

export type LoadedProduct =
  | { status: "ready"; view: ProductView }
  | { status: "missing" | "error" };

export async function loadProduct(id: string): Promise<LoadedProduct> {
  if (!z.uuid().safeParse(id).success) return { status: "missing" };
  try {
    const { product, store } = await findPublicProduct(await createClient(), id);
    return { status: "ready", view: toProductView(product, store, new Date()) };
  } catch (error) {
    if (error instanceof ApiError && error.code === "NOT_FOUND") return { status: "missing" };
    console.error("Failed to load product", error);
    return { status: "error" };
  }
}

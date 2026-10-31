import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { buttonVariants } from "@/src/components/ui/button";
import { findProductImageUrl, findSellerProduct, loadReservedQuantities } from "@/src/lib/server/product";
import { loadSellerStore } from "@/src/lib/server/store";
import { createClient } from "@/src/lib/supabase/server";

import { SellerNav } from "../../_components/seller-nav";
import { ProductForm } from "../../publish/_components/product-form";
import { DeleteProductButton } from "./_components/delete-product-button";

export const metadata: Metadata = { title: "상품 수정" };

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const store = await loadSellerStore();
  if (!store) redirect("/store");
  const { id } = await params;
  const supabase = await createClient();
  const product = await findSellerProduct(supabase, store.id, id);
  if (!product) notFound();
  const [imageUrl, reserved] = await Promise.all([findProductImageUrl(supabase, product.id), loadReservedQuantities(supabase, [product.id])]);

  return (
    <main className="min-h-dvh bg-background px-4 pt-6 pb-12 sm:px-6 sm:pt-12">
      <div className="mx-auto mb-6 max-w-[1200px]"><SellerNav current="/seller/products" /></div>
      <div className="mx-auto flex max-w-[480px] flex-col gap-6">
        <Link href="/seller/products" className={buttonVariants({ variant: "outline", size: "compact", className: "w-fit" })}><ArrowLeft aria-hidden="true" />상품 목록으로</Link>
        <section aria-labelledby="edit-title" className="rounded-lg border border-border bg-card p-4 shadow-card sm:p-6">
          <h1 id="edit-title" className="text-2xl leading-8 font-bold tracking-[-0.02em] text-foreground">상품 수정</h1>
          <p className="mt-2 mb-6 text-sm leading-5 text-muted-foreground">이미 받은 예약의 가격과 수량은 바뀌지 않아요.</p>
          <ProductForm product={product} reservedQuantity={reserved.get(product.id) ?? 0} imageUrl={imageUrl} storeId={store.id} closingTime={store.closingTime} />
        </section>
        <DeleteProductButton id={product.id} name={product.name} />
      </div>
    </main>
  );
}

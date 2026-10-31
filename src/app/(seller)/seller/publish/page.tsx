import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { listSellerProducts } from "@/src/lib/server/product";
import { loadSellerStore } from "@/src/lib/server/store";
import { createClient } from "@/src/lib/supabase/server";
import { FRESHNESS_LABELS } from "@/src/types/api";

import { ProductForm } from "./_components/product-form";

export const metadata: Metadata = { title: "상품 게시" };

const LIST_LIMIT = 50;
const won = new Intl.NumberFormat("ko-KR");
const dateTime = new Intl.DateTimeFormat("ko-KR", { dateStyle: "short", timeStyle: "short", timeZone: "Asia/Seoul" });

export default async function PublishPage() {
  const store = await loadSellerStore();
  if (!store) redirect("/store");
  const { items, nextCursor } = await listSellerProducts(await createClient(), store.id, { limit: LIST_LIMIT });

  return (
    <main className="min-h-dvh bg-background px-4 pt-6 pb-12 sm:px-6 sm:pt-12">
      <div className="mx-auto flex max-w-[480px] flex-col gap-8 lg:gap-12">
        <Link href="/seller/dashboard" className="text-sm leading-5 text-muted-foreground underline">
          대시보드로 돌아가기
        </Link>

        <section aria-labelledby="publish-title" className="rounded-lg border border-border bg-card p-4 shadow-card sm:p-6">
          <h1 id="publish-title" className="text-2xl leading-8 font-bold tracking-[-0.02em] text-foreground">
            상품 게시
          </h1>
          <p className="mt-2 mb-6 text-sm leading-5 text-muted-foreground">{store.name}에 올릴 상품 정보를 입력해 주세요.</p>
          <ProductForm />
        </section>

        <section aria-labelledby="published-title" className="flex flex-col gap-3">
          <h2 id="published-title" className="text-lg leading-7 font-semibold text-foreground">
            게시한 상품 {items.length}
            {nextCursor ? "+" : ""}개
          </h2>
          {items.length === 0 ? (
            <p className="text-sm leading-5 text-muted-foreground">아직 게시한 상품이 없어요.</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {items.map((product) => (
                <li key={product.id} className="rounded-lg border border-border bg-card p-4 sm:p-6">
                  <p className="text-base leading-6 font-semibold text-foreground">{product.name}</p>
                  <p className="mt-1 text-sm leading-5 text-muted-foreground">
                    {FRESHNESS_LABELS[product.freshness]} · 재고 {product.availableQuantity}
                    {product.unit}
                  </p>
                  <p className="mt-1 text-sm leading-5 text-muted-foreground">
                    기준가 {won.format(product.basePrice)}원 · 최저가 {won.format(product.minPrice)}원
                  </p>
                  <p className="mt-1 text-sm leading-5 text-muted-foreground">
                    판매 종료 {dateTime.format(new Date(product.saleEndsAt))}
                  </p>
                </li>
              ))}
            </ul>
          )}
          {nextCursor ? (
            <p className="text-sm leading-5 text-muted-foreground">최근 {LIST_LIMIT}개까지 표시해요.</p>
          ) : null}
        </section>
      </div>
    </main>
  );
}

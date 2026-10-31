import type { Metadata } from "next";

import { LogoutButton, RoleLabel } from "@/src/components/common/logout-button";
import { loadSellerStore } from "@/src/lib/server/store";

import { SellerNav } from "../seller/_components/seller-nav";
import { StoreForm } from "./_components/store-form";

export const metadata: Metadata = { title: "매장 정보" };

export default async function StorePage() {
  const store = await loadSellerStore();

  return (
    <main className="min-h-dvh bg-background px-4 pt-4 pb-12 sm:px-6">
      <div className="mx-auto mb-4 flex max-w-[480px] items-center justify-end gap-3">
        <RoleLabel role="seller" />
        <LogoutButton />
      </div>
      {store ? <div className="mx-auto mb-6 max-w-[1200px]"><SellerNav current="/store" /></div> : null}
      <section
        aria-labelledby="store-title"
        className="mx-auto h-fit w-full max-w-[480px] rounded-lg border border-border bg-card p-4 shadow-card sm:p-6"
      >
        <h1
          id="store-title"
          className="text-2xl leading-8 font-bold tracking-[-0.02em] text-foreground lg:text-[32px] lg:leading-10"
        >
          {store ? "매장 정보 수정" : "매장 등록"}
        </h1>
        <p className="mt-2 mb-6 text-sm leading-5 text-muted-foreground">
          {store ? "변경한 내용은 상품과 예약 안내에 함께 쓰여요." : "상품을 올리기 전에 매장 정보를 등록해 주세요."}
        </p>
        <StoreForm store={store} />
      </section>
    </main>
  );
}

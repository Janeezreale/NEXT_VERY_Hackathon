import { redirect } from "next/navigation";

import { loadSellerStore } from "@/src/lib/server/store";

/** 매장을 등록한 판매자만 판매자 화면을 쓴다. 등록 화면 /store는 이 레이아웃 밖에 둔다. */
export default async function SellerLayout({ children }: { children: React.ReactNode }) {
  const store = await loadSellerStore();
  if (!store) redirect("/store");
  return children;
}

import { redirect } from "next/navigation";

import { LogoutButton } from "@/src/components/common/logout-button";
import { loadSellerStore } from "@/src/lib/server/store";

/** 매장을 등록한 판매자만 판매자 화면을 쓴다. 등록 화면 /store는 이 레이아웃 밖에 둔다. */
export default async function SellerLayout({ children }: { children: React.ReactNode }) {
  const store = await loadSellerStore();
  if (!store) redirect("/store");
  return (
    <>
      <div className="flex justify-end bg-background px-4 pt-4 sm:px-6 lg:px-8">
        <LogoutButton />
      </div>
      {children}
    </>
  );
}

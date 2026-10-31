import { redirect } from "next/navigation";

import { LogoutButton, RoleLabel } from "@/src/components/common/logout-button";
import { loadSellerStore } from "@/src/lib/server/store";

/** 매장을 등록한 판매자만 판매자 화면을 쓴다. 등록 화면 /store는 이 레이아웃 밖에 둔다. */
export default async function SellerLayout({ children }: { children: React.ReactNode }) {
  const store = await loadSellerStore();
  if (!store) redirect("/store");
  return (
    <>
      <div className="flex items-center justify-end gap-3 bg-background px-4 pt-4 sm:px-6 lg:px-8">
        <RoleLabel role="seller" />
        <LogoutButton />
      </div>
      {children}
    </>
  );
}

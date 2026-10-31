const LINKS = [
  { href: "/seller/dashboard", label: "대시보드" },
  { href: "/seller/products", label: "상품·재고" },
  { href: "/seller/reservations", label: "예약 관리" },
  { href: "/seller/reports", label: "판매 리포트" },
  { href: "/seller/publish", label: "상품 게시" },
  { href: "/store", label: "매장 정보" },
];

/** 실제 데이터 화면의 판매자 메뉴. */
export function SellerNav({ current }: { current: string }) {
  return (
    <nav aria-label="판매자 화면" className="flex flex-wrap gap-2">
      {LINKS.map(({ href, label }) => (
        <a
          key={href}
          href={href}
          aria-current={href === current ? "page" : undefined}
          className="inline-flex min-h-11 items-center rounded-md px-3 py-2 text-sm text-foreground hover:bg-secondary aria-[current=page]:bg-secondary aria-[current=page]:font-semibold aria-[current=page]:text-link"
        >
          {label}
        </a>
      ))}
    </nav>
  );
}

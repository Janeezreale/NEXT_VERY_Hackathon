import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  // 브랜드명 승인 전까지 DESIGN.md §0의 플레이스홀더를 사용한다.
  title: { default: "[서비스명]", template: "%s | [서비스명]" },
  description: "신선식품 마감 할인 상품을 찾고 방문 수령을 예약하는 서비스",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#F8FAF8",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="min-h-dvh bg-background font-sans text-foreground antialiased">
        {children}
      </body>
    </html>
  );
}

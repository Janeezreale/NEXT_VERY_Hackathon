/**
 * 로그인·회원가입 공통 레이아웃. DESIGN.md §6: 최대 400px, 큰 장식 히어로 생략.
 * 브랜드명·로고는 승인 전이라 플레이스홀더를 쓴다.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="flex min-h-14 items-center px-4 sm:px-6 lg:min-h-16 lg:px-8">
        <span className="flex items-center gap-2 text-base leading-6 font-bold text-foreground">
          <span className="size-6 rounded-md bg-brand" aria-hidden="true" />
          [서비스명]
        </span>
      </header>
      <main className="flex flex-1 justify-center px-4 pt-6 pb-12 sm:px-6 sm:pt-12">
        <div className="w-full max-w-[400px]">{children}</div>
      </main>
    </div>
  );
}

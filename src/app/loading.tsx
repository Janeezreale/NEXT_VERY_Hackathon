import { LoaderCircle } from "lucide-react";

/** 서버 조회가 끝나기 전 화면. 판매자 layout의 인증 대기까지 덮도록 최상위에 둔다. */
export default function Loading() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-background px-4">
      <p role="status" className="flex items-center gap-2 text-sm leading-5 text-muted-foreground">
        <LoaderCircle className="size-5 motion-safe:animate-spin" aria-hidden="true" />
        불러오는 중이에요
      </p>
    </main>
  );
}

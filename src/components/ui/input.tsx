import * as React from "react";

import { cn } from "@/src/lib/utils";

// DESIGN.md §5 입력: 높이 48px, 1px input 외곽선, 반경 8px, 입력값 16px.
function Input({ className, type = "text", ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "block h-12 w-full min-w-0 rounded-md border border-input bg-card px-3 text-base leading-6 text-foreground",
        "placeholder:text-muted-foreground",
        "transition-colors duration-150",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
        "aria-invalid:border-2 aria-invalid:border-destructive",
        "disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground",
        "read-only:bg-muted",
        className,
      )}
      {...props}
    />
  );
}

export { Input };

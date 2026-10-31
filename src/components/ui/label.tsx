import * as React from "react";

import { cn } from "@/src/lib/utils";

function Label({ className, ...props }: React.ComponentProps<"label">) {
  return (
    <label
      data-slot="label"
      className={cn("text-sm leading-5 font-semibold text-foreground", className)}
      {...props}
    />
  );
}

export { Label };

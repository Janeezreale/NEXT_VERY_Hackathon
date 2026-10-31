import * as React from "react";
import { CircleAlert, Info } from "lucide-react";

import { cn } from "@/src/lib/utils";

type FormAlertProps = {
  tone?: "error" | "info";
  title?: string;
  children: React.ReactNode;
  className?: string;
} & Omit<React.ComponentProps<"div">, "title" | "children">;

/** 폼 상단의 오류 요약·안내. 오류는 role="alert", 안내는 role="status". */
const FormAlert = React.forwardRef<HTMLDivElement, FormAlertProps>(function FormAlert(
  { tone = "error", title, children, className, ...props },
  ref,
) {
  const Icon = tone === "error" ? CircleAlert : Info;
  return (
    <div
      ref={ref}
      role={tone === "error" ? "alert" : "status"}
      className={cn(
        "flex gap-2 rounded-md border px-3 py-3 text-sm leading-5",
        tone === "error"
          ? "border-destructive/30 bg-danger-bg text-destructive"
          : "border-info/30 bg-info-bg text-info",
        className,
      )}
      {...props}
    >
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <div className="flex flex-col gap-1">
        {title ? <p className="font-semibold">{title}</p> : null}
        <div>{children}</div>
      </div>
    </div>
  );
});

export { FormAlert };

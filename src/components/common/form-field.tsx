import * as React from "react";
import { CircleAlert } from "lucide-react";

import { Label } from "@/src/components/ui/label";
import { cn } from "@/src/lib/utils";

type FieldControlProps = {
  id: string;
  "aria-describedby"?: string;
  "aria-invalid"?: true;
  "aria-required"?: true;
};

type FormFieldProps = {
  id: string;
  label: string;
  required?: boolean;
  hint?: React.ReactNode;
  error?: string;
  className?: string;
  /** 라벨·도움말·오류를 연결하는 접근성 속성을 받아 입력 컨트롤을 그린다. */
  children: (control: FieldControlProps) => React.ReactNode;
};

/**
 * 라벨은 항상 위에 노출하고 도움말·오류를 aria-describedby로 연결한다(DESIGN.md §5, §9).
 */
function FormField({ id, label, required, hint, error, className, children }: FormFieldProps) {
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [errorId, hintId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <Label htmlFor={id}>
        {label}
        {required ? (
          <span className="ml-1 text-xs leading-[18px] font-medium text-muted-foreground">(필수)</span>
        ) : null}
      </Label>
      {children({
        id,
        "aria-describedby": describedBy,
        "aria-invalid": error ? true : undefined,
        "aria-required": required ? true : undefined,
      })}
      {error ? (
        <p id={errorId} className="flex items-start gap-1.5 text-sm leading-5 text-destructive">
          <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </p>
      ) : null}
      {hint ? (
        <p id={hintId} className="text-sm leading-5 text-muted-foreground">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export { FormField, type FieldControlProps };

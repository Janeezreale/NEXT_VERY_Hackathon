import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { LoaderCircle } from "lucide-react";

import { cn } from "@/src/lib/utils";

// DESIGN.md §5 버튼: 기본 높이 48px, 반경 8px, hover/pressed는 색으로만 표현.
const buttonVariants = cva(
  [
    "inline-flex min-h-12 items-center justify-center gap-2 rounded-md px-4 text-sm leading-5 font-semibold",
    "transition-colors duration-150 select-none",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
    "disabled:cursor-not-allowed disabled:border-transparent disabled:bg-muted disabled:text-muted-foreground",
    "[&_svg]:size-5 [&_svg]:shrink-0",
  ],
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:bg-primary-hover active:bg-primary-active",
        secondary: "bg-secondary text-secondary-foreground hover:bg-[#dcefe3]",
        outline: "border border-input bg-card text-foreground hover:bg-muted",
        ghost: "text-link hover:bg-secondary",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-[#991b1b] active:bg-[#7f1d1d]",
      },
      size: {
        default: "min-h-12 px-4",
        compact: "min-h-11 px-3",
        icon: "size-11 min-h-11 px-0",
      },
      fullWidth: { true: "w-full" },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

type ButtonProps = React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    /** 처리 중: 폭을 유지하고 스피너와 안내 문구를 보여주며 중복 제출을 막는다. */
    loading?: boolean;
    loadingText?: string;
  };

function Button({
  className,
  variant,
  size,
  fullWidth,
  loading = false,
  loadingText = "요청 중…",
  disabled,
  children,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      data-slot="button"
      className={cn(buttonVariants({ variant, size, fullWidth }), className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? (
        <>
          <LoaderCircle className="animate-spin" aria-hidden="true" />
          <span>{loadingText}</span>
        </>
      ) : (
        children
      )}
    </button>
  );
}

export { Button, buttonVariants };

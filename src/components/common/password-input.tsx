"use client";

import * as React from "react";
import { Eye, EyeOff } from "lucide-react";

import { Input } from "@/src/components/ui/input";
import { cn } from "@/src/lib/utils";

type PasswordInputProps = Omit<React.ComponentProps<"input">, "type">;

/**
 * 비밀번호 표시 토글. 상태를 aria-pressed와 버튼 이름으로 읽어 주고
 * 입력·자동완성·붙여넣기를 막지 않는다(DESIGN.md §6 로그인).
 */
function PasswordInput({ className, ...props }: PasswordInputProps) {
  const [visible, setVisible] = React.useState(false);

  return (
    <div className="relative">
      <Input
        {...props}
        type={visible ? "text" : "password"}
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        className={cn("pr-12", className)}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-pressed={visible}
        aria-label={visible ? "비밀번호 숨기기" : "비밀번호 표시"}
        aria-controls={props.id}
        className={cn(
          "absolute inset-y-0 right-0 flex w-12 items-center justify-center rounded-r-md text-muted-foreground",
          "hover:text-foreground focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring",
        )}
      >
        {visible ? (
          <EyeOff className="size-5" aria-hidden="true" />
        ) : (
          <Eye className="size-5" aria-hidden="true" />
        )}
      </button>
    </div>
  );
}

export { PasswordInput };

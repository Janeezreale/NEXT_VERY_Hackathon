"use client";

import { X } from "lucide-react";
import * as React from "react";

const ISSUE_MS = 8000;
const STATUS_MS = 4000;
const MAX_VISIBLE = 3;

type Kind = "issue" | "status";
type Notification = { id: number; kind: Kind; message: string };

/** issue는 대응이 필요한 문제로 위에, status는 상태 변화로 아래에 잠깐 보여준다. */
const NotifyContext = React.createContext<Record<Kind, (message: string) => void>>({ issue: () => {}, status: () => {} });

export const useNotify = () => React.useContext(NotifyContext);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = React.useState<Notification[]>([]);
  const nextId = React.useRef(0);

  const dismiss = React.useCallback((id: number) => setItems((current) => current.filter((item) => item.id !== id)), []);

  const notify = React.useMemo(() => {
    const push = (kind: Kind, message: string) => {
      const id = nextId.current++;
      setItems((current) => {
        const others = current.filter((item) => !(item.kind === kind && item.message === message));
        return [...others.filter((item) => item.kind !== kind), ...others.filter((item) => item.kind === kind).slice(1 - MAX_VISIBLE), { id, kind, message }];
      });
      setTimeout(() => dismiss(id), kind === "issue" ? ISSUE_MS : STATUS_MS);
    };
    return { issue: (message: string) => push("issue", message), status: (message: string) => push("status", message) };
  }, [dismiss]);

  return (
    <NotifyContext.Provider value={notify}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-0 z-50 flex flex-col items-center gap-2 p-4">
        {items.filter((item) => item.kind === "issue").map((item) => (
          <div key={item.id} role="alert" className="pointer-events-auto flex w-full max-w-md items-start justify-between gap-2 rounded-lg border border-destructive bg-danger-bg p-3 text-sm leading-5 text-destructive shadow-card">
            <p>{item.message}</p>
            <button type="button" aria-label="알림 닫기" className="-m-1 inline-flex size-7 shrink-0 items-center justify-center rounded-md" onClick={() => dismiss(item.id)}>
              <X size={16} aria-hidden="true" />
            </button>
          </div>
        ))}
      </div>
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex flex-col items-center gap-2 px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        {items.filter((item) => item.kind === "status").map((item) => (
          <p key={item.id} role="status" className="max-w-sm rounded-md bg-foreground px-3 py-2 text-sm leading-5 text-background shadow-card">
            {item.message}
          </p>
        ))}
      </div>
    </NotifyContext.Provider>
  );
}

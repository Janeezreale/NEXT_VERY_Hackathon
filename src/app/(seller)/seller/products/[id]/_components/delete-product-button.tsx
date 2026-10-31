"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { FormAlert } from "@/src/components/common/form-alert";
import { Button } from "@/src/components/ui/button";
import { apiFetch, ApiClientError } from "@/src/lib/client/api";

export function DeleteProductButton({ id, name }: { id: string; name: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function remove() {
    if (busy || !window.confirm(`${name} 상품을 삭제할까요?`)) return;
    setBusy(true);
    setError("");
    try {
      await apiFetch(`/api/seller/products/${id}`, { method: "DELETE" });
      router.replace("/seller/products");
      router.refresh();
    } catch (failure) {
      if (!(failure instanceof ApiClientError)) throw failure;
      setError(failure.message);
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {error ? <FormAlert>{error}</FormAlert> : null}
      <Button variant="destructive" fullWidth loading={busy} loadingText="삭제 중…" onClick={remove}>상품 삭제</Button>
    </div>
  );
}

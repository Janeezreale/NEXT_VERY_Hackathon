"use client";

import { useRouter } from "next/navigation";
import * as React from "react";
import { z } from "zod";

import { FormAlert } from "@/src/components/common/form-alert";
import { FormField } from "@/src/components/common/form-field";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { apiFetch, ApiClientError } from "@/src/lib/client/api";
import { storeCreateSchema, type StoreCreateInput } from "@/src/lib/schemas/api";
import type { Store } from "@/src/types/api";

import { AddressField } from "./address-field";

type StoreErrors = Partial<Record<keyof StoreCreateInput, string>>;

function firstErrors(fieldErrors: Record<string, string[] | undefined>): StoreErrors {
  return Object.fromEntries(Object.entries(fieldErrors).map(([key, messages]) => [key, messages?.[0]]));
}

export function StoreForm({ store }: { store: Store | null }) {
  const router = useRouter();
  const [values, setValues] = React.useState<StoreCreateInput>({
    name: store?.name ?? "",
    regionCode: store?.regionCode ?? "",
    address: store?.address ?? "",
    closingTime: store?.closingTime ?? "",
  });
  const [errors, setErrors] = React.useState<StoreErrors>({});
  const [formError, setFormError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  function update(patch: Partial<StoreCreateInput>) {
    setValues((current) => ({ ...current, ...patch }));
    setErrors((current) => ({ ...current, ...Object.fromEntries(Object.keys(patch).map((key) => [key, undefined])) }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    setFormError(null);

    const parsed = storeCreateSchema.safeParse(values);
    if (!parsed.success) {
      setErrors(firstErrors(z.flattenError(parsed.error).fieldErrors));
      return;
    }

    setSubmitting(true);
    try {
      await apiFetch<Store>("/api/seller/store", {
        method: store ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      router.replace("/seller/dashboard");
      router.refresh();
    } catch (error) {
      if (!(error instanceof ApiClientError)) throw error;
      setFormError(error.message);
      if (error.fieldErrors) setErrors(firstErrors(error.fieldErrors));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
      {formError ? <FormAlert>{formError}</FormAlert> : null}

      <FormField id="store-name" label="매장 이름" required error={errors.name}>
        {(control) => (
          <Input
            {...control}
            name="name"
            autoComplete="organization"
            value={values.name}
            onChange={(e) => update({ name: e.target.value })}
          />
        )}
      </FormField>

      <AddressField
        value={{ regionCode: values.regionCode, address: values.address }}
        errors={{ regionCode: errors.regionCode, address: errors.address }}
        onChange={update}
      />

      <FormField
        id="store-closing-time"
        label="마감 시각"
        required
        hint="한국 시간 기준으로 입력해 주세요."
        error={errors.closingTime}
      >
        {(control) => (
          <Input
            {...control}
            type="time"
            name="closingTime"
            value={values.closingTime}
            onChange={(e) => update({ closingTime: e.target.value })}
          />
        )}
      </FormField>

      <Button type="submit" fullWidth loading={submitting} loadingText="저장 중…" className="mt-1">
        {store ? "저장하기" : "매장 등록하기"}
      </Button>
    </form>
  );
}

"use client";

import { useRouter } from "next/navigation";
import * as React from "react";
import { z } from "zod";

import { FormAlert } from "@/src/components/common/form-alert";
import { FormField } from "@/src/components/common/form-field";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { apiFetch, ApiClientError, firstFieldErrors } from "@/src/lib/client/api";
import { saleEndError } from "@/src/lib/pricing/price";
import { productCreateSchema, productUpdateSchema, type ProductCreateInput, type ProductUpdateInput } from "@/src/lib/schemas/api";
import { FRESHNESS_LABELS, FRESHNESS_LEVELS, PRODUCT_UNITS, type Analysis, type Freshness, type SellerProduct } from "@/src/types/api";

import { ImagePicker } from "./image-picker";

type ProductErrors = Partial<Record<keyof ProductCreateInput | keyof ProductUpdateInput, string>>;

const toLocalInput = (iso: string) =>
  new Intl.DateTimeFormat("sv-SE", { dateStyle: "short", timeStyle: "short", timeZone: "Asia/Seoul" }).format(new Date(iso)).replace(" ", "T");

const EMPTY = {
  name: "",
  quantity: "",
  unit: "",
  basePrice: "",
  minPrice: "",
  freshness: "fresh" as Freshness,
  saleEndsAt: "",
  sellerConfirmed: false,
};

/** 입력값을 API 형식으로 바꾼다. 비어 있는 숫자·시각은 검증에서 걸러지도록 undefined로 둔다. */
function toInput(values: typeof EMPTY) {
  const number = (value: string) => (value === "" ? undefined : Number(value));
  return {
    ...values,
    quantity: number(values.quantity),
    basePrice: number(values.basePrice),
    minPrice: number(values.minPrice),
    saleEndsAt: values.saleEndsAt ? new Date(values.saleEndsAt).toISOString() : undefined,
  };
}

export function ProductForm({ product, reservedQuantity = 0, imageUrl = null, storeId, closingTime }: { product?: SellerProduct; reservedQuantity?: number; imageUrl?: string | null; storeId?: string; closingTime: string }) {
  const router = useRouter();
  const [values, setValues] = React.useState(
    product
      ? {
          name: product.name,
          quantity: String(product.availableQuantity),
          unit: product.unit,
          basePrice: String(product.basePrice),
          minPrice: String(product.minPrice),
          freshness: product.freshness,
          saleEndsAt: toLocalInput(product.saleEndsAt),
          sellerConfirmed: true,
        }
      : EMPTY,
  );
  const [errors, setErrors] = React.useState<ProductErrors>({});
  const [formError, setFormError] = React.useState<string | null>(null);
  /** 수정할 때 undefined는 그대로 두기, null은 지우기다. */
  const [imagePath, setImagePath] = React.useState<string | null>();
  const [formKey, setFormKey] = React.useState(0);
  const [aiNote, setAiNote] = React.useState<string | null>(null);
  const [notice, setNotice] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  function update(patch: Partial<typeof EMPTY>) {
    setValues((current) => ({ ...current, ...patch }));
    setErrors((current) => ({ ...current, ...Object.fromEntries(Object.keys(patch).map((key) => [key, undefined])) }));
    setNotice(null);
  }

  function applyAnalysis(analysis: Analysis) {
    update({
      name: analysis.name,
      quantity: analysis.estimatedQuantity === null ? "" : String(analysis.estimatedQuantity),
      unit: analysis.unit ?? "",
      freshness: analysis.freshness,
    });
    setAiNote(analysis.needsConfirmation ? analysis.uncertaintyReason ?? "AI가 확신하지 못한 항목이 있어요." : null);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    setFormError(null);
    setNotice(null);

    const saleEnd = values.saleEndsAt ? saleEndError(new Date(values.saleEndsAt), closingTime) : null;
    if (saleEnd) {
      setErrors((current) => ({ ...current, saleEndsAt: saleEnd }));
      return;
    }

    const parsed = product
      ? productUpdateSchema.safeParse({ ...toInput(values), expectedQuantity: product.availableQuantity, imagePath })
      : productCreateSchema.safeParse({ ...toInput(values), imagePath: imagePath ?? undefined });
    if (!parsed.success) {
      const issues: z.ZodError = parsed.error;
      setErrors(firstFieldErrors(z.flattenError(issues).fieldErrors));
      return;
    }

    setSubmitting(true);
    try {
      const saved = await apiFetch<SellerProduct>(product ? `/api/seller/products/${product.id}` : "/api/seller/products", {
        method: product ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      if (product) {
        router.replace("/seller/products");
        router.refresh();
        return;
      }
      setValues(EMPTY);
      setImagePath(undefined);
      setAiNote(null);
      setFormKey((key) => key + 1);
      setNotice(`${saved.name} 상품을 게시했어요.`);
      router.refresh();
    } catch (error) {
      if (!(error instanceof ApiClientError)) throw error;
      setFormError(error.message);
      if (error.fieldErrors) setErrors(firstFieldErrors(error.fieldErrors));
      if (error.code === "STOCK_CHANGED") router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
      {formError ? <FormAlert>{formError}</FormAlert> : null}
      {notice ? <FormAlert tone="info">{notice}</FormAlert> : null}

      {storeId ? <ImagePicker key={formKey} storeId={storeId} editing={Boolean(product)} currentUrl={imageUrl} onUploaded={setImagePath} onAnalyzed={applyAnalysis} /> : null}
      {aiNote ? <FormAlert tone="info" title="확인이 필요해요">{aiNote}</FormAlert> : null}
      {storeId && !product ? <p className="text-sm leading-5 text-muted-foreground">AI 제안은 사진의 겉모습만 본 결과예요. 게시 전에 꼭 확인해 주세요.</p> : null}

      <FormField id="product-name" label="상품 이름" required error={errors.name}>
        {(control) => <Input {...control} name="name" value={values.name} onChange={(e) => update({ name: e.target.value })} />}
      </FormField>

      <div className="grid grid-cols-2 gap-4">
        <FormField
          id="product-quantity"
          label={product ? "남은 재고" : "수량"}
          required
          error={errors.quantity}
        >
          {(control) => (
            <Input
              {...control}
              type="number"
              inputMode="numeric"
              min={product ? 0 : 1}
              step={1}
              name="quantity"
              value={values.quantity}
              onChange={(e) => update({ quantity: e.target.value })}
            />
          )}
        </FormField>
        <FormField id="product-unit" label="단위" required error={errors.unit}>
          {(control) => (
            <select
              {...control}
              name="unit"
              value={values.unit}
              onChange={(e) => update({ unit: e.target.value })}
              className="block h-12 w-full rounded-md border border-input bg-card px-3 text-base leading-6 text-foreground"
            >
              <option value="">선택</option>
              {PRODUCT_UNITS.map((unit) => (
                <option key={unit}>{unit}</option>
              ))}
            </select>
          )}
        </FormField>
        {product ? <p className="col-span-2 text-sm leading-5 text-muted-foreground">예약 수량 {reservedQuantity}{product.unit}: 따로 확보되어 바뀌지 않아요.</p> : null}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <FormField id="product-base-price" label="기준가(원)" required error={errors.basePrice}>
          {(control) => (
            <Input
              {...control}
              type="number"
              inputMode="numeric"
              min={1}
              step={1}
              name="basePrice"
              value={values.basePrice}
              onChange={(e) => update({ basePrice: e.target.value })}
            />
          )}
        </FormField>
        <FormField id="product-min-price" label="최저가(원)" required error={errors.minPrice}>
          {(control) => (
            <Input
              {...control}
              type="number"
              inputMode="numeric"
              min={1}
              step={1}
              name="minPrice"
              value={values.minPrice}
              onChange={(e) => update({ minPrice: e.target.value })}
            />
          )}
        </FormField>
      </div>

      <FormField id="product-freshness" label="신선도" required error={errors.freshness}>
        {(control) => (
          <select
            {...control}
            name="freshness"
            value={values.freshness}
            onChange={(e) => update({ freshness: e.target.value as Freshness })}
            className="block h-12 w-full rounded-md border border-input bg-card px-3 text-base leading-6 text-foreground"
          >
            {FRESHNESS_LEVELS.map((level) => (
              <option key={level} value={level}>
                {FRESHNESS_LABELS[level]}
              </option>
            ))}
          </select>
        )}
      </FormField>

      <FormField id="product-sale-ends-at" label="판매 종료 시각" required hint={`한국 시간 기준이에요. 가게 마감(${closingTime}) 30분 전까지 설정할 수 있어요.`} error={errors.saleEndsAt}>
        {(control) => (
          <Input
            {...control}
            type="datetime-local"
            name="saleEndsAt"
            value={values.saleEndsAt}
            onChange={(e) => {
              update({ saleEndsAt: e.target.value });
              const message = e.target.value ? saleEndError(new Date(e.target.value), closingTime) : null;
              if (message) setErrors((current) => ({ ...current, saleEndsAt: message }));
            }}
          />
        )}
      </FormField>

      {product ? null : <div className="flex flex-col gap-2">
        <label className="flex items-start gap-2 text-sm leading-5 text-foreground">
          <input
            type="checkbox"
            name="sellerConfirmed"
            className="mt-0.5 size-4"
            checked={values.sellerConfirmed}
            aria-invalid={errors.sellerConfirmed ? true : undefined}
            aria-describedby={errors.sellerConfirmed ? "product-confirmed-error" : undefined}
            onChange={(e) => update({ sellerConfirmed: e.target.checked })}
          />
          입력한 상품 정보와 가격을 확인했어요.
        </label>
        {errors.sellerConfirmed ? (
          <p id="product-confirmed-error" className="text-sm leading-5 text-destructive">
            {errors.sellerConfirmed}
          </p>
        ) : null}
      </div>}

      <Button type="submit" fullWidth loading={submitting} loadingText={product ? "저장 중…" : "게시 중…"} className="mt-1">
        {product ? "저장하기" : "상품 게시하기"}
      </Button>
    </form>
  );
}

"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Minus, Plus } from "lucide-react";
import { reservationCreateSchema } from "@/src/lib/schemas/api";
import { apiFetch, ApiClientError } from "@/src/lib/client/api";
import { money, type PickupSlot, type ProductView } from "./product-view";
import { CurrentPrice, PreviewShell, ProductPhoto } from "./preview-ui";
import styles from "../../app/(customer)/shop/shop.module.css";

export default function ReservePreview({ product, back }: { product: ProductView; back: string }) {
  const router = useRouter();
  const [quantity, setQuantity] = useState(1);
  const [slot, setSlot] = useState<PickupSlot | null>(null);
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactError, setContactError] = useState("");
  const [step, setStep] = useState<"input" | "review">("input");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [requestError, setRequestError] = useState("");
  const [loginRequired, setLoginRequired] = useState(false);
  const requestLock = useRef(false);
  /** 결과를 모르는 재시도는 같은 키를 보내 중복을 막는다. 내용이 바뀌면 새 키를 쓴다. */
  const requestKey = useRef<string | null>(null);
  const firstSlot = useRef<HTMLInputElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const focusResult = () => requestAnimationFrame(() => resultRef.current?.focus());

  async function submit() {
    if (requestLock.current || !slot) return;
    requestLock.current = true;
    requestKey.current ??= crypto.randomUUID();
    setSubmitting(true);
    setRequestError("");
    try {
      await apiFetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product.id, contactName, contactPhone, quantity, pickupAt: slot.at, idempotencyKey: requestKey.current, expectedUnitPrice: product.price }),
      });
      router.push("/shop/reservations");
      router.refresh();
    } catch (failure) {
      if (!(failure instanceof ApiClientError)) throw failure;
      const outcomeUnknown = failure.code === "NETWORK_ERROR" || failure.code === "INTERNAL_ERROR";
      if (!outcomeUnknown) requestKey.current = null;
      setLoginRequired(failure.code === "UNAUTHENTICATED");
      setRequestError(outcomeUnknown ? "결과를 확인하지 못했어요. 다시 눌러도 예약이 중복되지 않아요." : failure.message);
      if (failure.code === "PRICE_CHANGED" || failure.code === "OUT_OF_STOCK") router.refresh();
      setSubmitting(false);
      requestLock.current = false;
    }
  }

  return <PreviewShell back={back}><div className={styles.formWidth}>
    <header className={styles.sectionHeading}><p className={styles.eyebrow}>PICK UP</p><h1>픽업 예약</h1><p className={styles.description}>수량과 방문 시간을 고르고 내용을 확인해 주세요.</p></header>
    <ol className={styles.steps} aria-label="예약 단계">{["선택", "내용 확인"].map((label, index) => <li key={label} aria-current={index === ["input", "review"].indexOf(step) ? "step" : undefined}><span>{index + 1}</span>{label}</li>)}</ol>
    <section className={styles.miniProduct}><ProductPhoto product={product} /><div><p className={styles.store}>{product.store}</p><h2>{product.name}</h2><CurrentPrice product={product} /></div></section>
    {step === "input" ? <form onSubmit={event => { event.preventDefault(); if (!slot) { setError("픽업 시간을 하나 선택해 주세요."); firstSlot.current?.focus(); return; } setError(""); const contact = reservationCreateSchema.shape; const invalid = contact.contactName.safeParse(contactName).error ?? contact.contactPhone.safeParse(contactPhone).error; if (invalid) { setContactError(invalid.issues[0].message); return; } setContactError(""); setStep("review"); focusResult(); }}>
      <section className={styles.panel}><h2>얼마나 필요하세요?</h2><p className={styles.description}>남은 수량 {product.stock}{product.unit}</p><div className={styles.quantity}><button type="button" aria-label="수량 줄이기" disabled={quantity <= 1} onClick={() => setQuantity(value => value - 1)}><Minus size={18} aria-hidden="true" /></button><output aria-live="polite">{quantity}<span>{product.unit}</span></output><button type="button" aria-label="수량 늘리기" disabled={quantity >= product.stock} onClick={() => setQuantity(value => value + 1)}><Plus size={18} aria-hidden="true" /></button></div></section>
      <fieldset className={styles.panel}><legend>언제 방문하실까요?</legend><p className={styles.description}>{product.dateLabel} · {product.pickup}</p><div className={styles.slotGrid}>{product.slots.map((option, index) => <label className={styles.slot} key={option.at}><input ref={index === 0 ? firstSlot : undefined} type="radio" name="pickup" value={option.at} checked={slot?.at === option.at} onChange={() => { setSlot(option); setError(""); }} aria-describedby={error ? "pickup-error" : "pickup-help"} />{option.label}</label>)}</div><p id="pickup-help" className={styles.description}>방문 가능한 시간을 선택해 주세요.</p>{error && <p id="pickup-error" className={styles.error} role="alert">{error}</p>}</fieldset>
      <section className={styles.panel}><h2>연락받을 정보</h2><p className={styles.description}>판매자가 예약 확인과 수령에만 사용해요.</p><label className={styles.contactField}><span>이름</span><input name="contactName" autoComplete="name" value={contactName} onChange={event => setContactName(event.target.value)} /></label><label className={styles.contactField}><span>휴대폰 번호</span><input name="contactPhone" type="tel" inputMode="tel" autoComplete="tel" placeholder="010-1234-5678" value={contactPhone} onChange={event => setContactPhone(event.target.value)} /></label>{contactError && <p className={styles.error} role="alert">{contactError}</p>}</section>
      <button className={styles.primary} type="submit">예약 내용 확인하기</button>
    </form> : <div ref={resultRef} tabIndex={-1}>

      <section className={styles.panel}><h2>예약 내용을 확인해 주세요</h2><dl className={styles.details}><div><dt>상품 수량</dt><dd>{quantity}{product.unit}</dd></div><div><dt>픽업 일시</dt><dd>{product.dateLabel} {slot?.label}</dd></div><div><dt>예약자</dt><dd>{contactName} · {contactPhone}</dd></div><div><dt>픽업 장소</dt><dd>{product.store}</dd></div><div><dt>주소</dt><dd>{product.address}</dd></div><div><dt>현재가</dt><dd>{money(product.price)} / {product.unit}</dd></div></dl><div className={styles.total}><span>예상 총액</span><strong>{money(product.price * quantity)}</strong></div><p className={styles.description}>예약 요청 전 예상 금액이에요.</p></section>
      <p className={styles.info}>판매자 승인 후 예약이 확정돼요. 결제와 수령은 매장에서 진행해요.</p>
      <div className={styles.actions}><button className={styles.detailButton} disabled={submitting} onClick={() => { setStep("input"); setRequestError(""); requestKey.current = null; }}>선택 수정</button><button className={styles.primary} disabled={submitting} onClick={submit}>{submitting ? "요청 중…" : "예약 요청하기"}</button></div>
      <div aria-live="polite" aria-atomic="true">
        {submitting && <p className={styles.info} role="status">요청 처리 중이에요. 잠시 기다려 주세요.</p>}
        {requestError && <div className={styles.info} role="alert"><p>{requestError}</p>{loginRequired && <Link className={styles.back} href="/login">로그인하기</Link>}</div>}
      </div>
      <Link className={styles.back} href="/shop/reservations">예약 내역 보기</Link>
    </div>}
  </div></PreviewShell>;
}

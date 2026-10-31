"use client";
import Link from "next/link";
import { useRef, useState } from "react";
import { Minus, Plus } from "lucide-react";
import { money, previewRequest } from "./preview-data";
import type { ProductView } from "./product-view";
import { CurrentPrice, PreviewShell, ProductPhoto } from "./preview-ui";
import type { RequestOutcome } from "./preview-state";
import styles from "../../app/(customer)/shop/shop.module.css";

export default function ReservePreview({ product, back, outcome = "unconnected" }: { product: ProductView; back: string; outcome?: RequestOutcome }) {
  const [quantity, setQuantity] = useState(1);
  const [slot, setSlot] = useState("");
  const [step, setStep] = useState<"input" | "review">("input");
  const [error, setError] = useState("");
  const [requestState, setRequestState] = useState<"idle" | RequestOutcome>("idle");
  const requestLock = useRef(false);
  const firstSlot = useRef<HTMLInputElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const focusResult = () => requestAnimationFrame(() => resultRef.current?.focus());
  async function submitPreview() {
    if (requestLock.current) return;
    requestLock.current = true;
    setRequestState("pending");
    try {
      const next = await previewRequest(outcome);
      setRequestState(next);
      if (next !== "pending" && next !== "unknown") requestLock.current = false;
    } catch {
      setRequestState("failure");
      requestLock.current = false;
    }
  }
  const blocked = requestState === "pending" || requestState === "unknown";
  return <PreviewShell back={back}><div className={styles.formWidth}>
    <header className={styles.sectionHeading}><p className={styles.eyebrow}>PICK UP</p><h1>픽업 예약</h1><p className={styles.description}>수량과 방문 시간을 고르고 내용을 확인해 주세요.</p></header>
    <ol className={styles.steps} aria-label="예약 단계">{["선택", "내용 확인"].map((label, index) => <li key={label} aria-current={index === ["input", "review"].indexOf(step) ? "step" : undefined}><span>{index + 1}</span>{label}</li>)}</ol>
    <section className={styles.miniProduct}><ProductPhoto product={product} /><div><p className={styles.store}>{product.store}</p><h2>{product.name}</h2><CurrentPrice product={product} /></div></section>
    {step === "input" ? <form onSubmit={event => { event.preventDefault(); if (!slot) { setError("픽업 시간을 하나 선택해 주세요."); firstSlot.current?.focus(); return; } setError(""); setStep("review"); focusResult(); }}>
      <section className={styles.panel}><h2>얼마나 필요하세요?</h2><p className={styles.description}>남은 수량 {product.stock}{product.unit}</p><div className={styles.quantity}><button type="button" aria-label="수량 줄이기" disabled={quantity <= 1} onClick={() => setQuantity(value => value - 1)}><Minus size={18} aria-hidden="true" /></button><output aria-live="polite">{quantity}<span>{product.unit}</span></output><button type="button" aria-label="수량 늘리기" disabled={quantity >= product.stock} onClick={() => setQuantity(value => value + 1)}><Plus size={18} aria-hidden="true" /></button></div></section>
      <fieldset className={styles.panel}><legend>언제 방문하실까요?</legend><p className={styles.description}>{product.dateLabel} · {product.pickup}</p><div className={styles.slotGrid}>{product.slots.map((time, index) => <label className={styles.slot} key={time}><input ref={index === 0 ? firstSlot : undefined} type="radio" name="pickup" value={time} checked={slot === time} onChange={() => { setSlot(time); setError(""); }} aria-describedby={error ? "pickup-error" : "pickup-help"} />{time}</label>)}</div><p id="pickup-help" className={styles.description}>방문 가능한 시간을 선택해 주세요.</p>{error && <p id="pickup-error" className={styles.error} role="alert">{error}</p>}</fieldset>
      <button className={styles.primary} type="submit">예약 내용 확인하기</button>
    </form> : <div ref={resultRef} tabIndex={-1}>

      <section className={styles.panel}><h2>예약 내용을 확인해 주세요</h2><dl className={styles.details}><div><dt>상품 수량</dt><dd>{quantity}{product.unit}</dd></div><div><dt>픽업 일시</dt><dd>{product.dateLabel} {slot}</dd></div><div><dt>픽업 장소</dt><dd>{product.store}</dd></div><div><dt>주소</dt><dd>{product.address}</dd></div><div><dt>현재가</dt><dd>{money(product.price)} / {product.unit}</dd></div></dl><div className={styles.total}><span>예상 총액</span><strong>{money(product.price * quantity)}</strong></div><p className={styles.description}>예약 요청 전 예상 금액이에요.</p></section>
      <p className={styles.info}>판매자 승인 후 예약이 확정돼요. 결제와 수령은 매장에서 진행해요.</p>
      <div className={styles.actions}><button className={styles.detailButton} disabled={blocked} onClick={() => { setStep("input"); setRequestState("idle"); }}>선택 수정</button><button className={styles.primary} disabled={blocked} onClick={submitPreview}>{requestState === "pending" ? "요청 중…" : "요청 상태 확인하기"}</button></div>
      <div aria-live="polite" aria-atomic="true">
        {requestState === "pending" && <p className={styles.info} role="status">요청 처리 중이에요. 다시 누르지 말고 잠시 기다려 주세요.</p>}
        {requestState === "unconnected" && <p className={styles.info}>현재는 선택 내용만 확인할 수 있어요. 예약 요청은 전송되지 않았어요.</p>}
        {requestState === "failure" && <div className={styles.info} role="alert"><p>요청하지 못했어요. 선택한 수량과 시간은 유지돼요.</p><button className={styles.reset} onClick={submitPreview}>다시 시도</button></div>}
        {requestState === "unknown" && <p className={styles.info} role="status">처리 결과를 확인할 수 없어요. 중복 요청을 막기 위해 재전송을 중단했어요. 결과 조회 연결이 필요해요.</p>}
      </div>
      <Link className={styles.back} href="/shop/reservations">예약 내역 보기</Link>
    </div>}
  </div></PreviewShell>;
}

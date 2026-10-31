"use client";
import Link from "next/link";
import { useRef, useState } from "react";
import { CheckCircle2, Minus, Plus } from "lucide-react";
import { money, type PreviewProduct } from "./preview-data";
import { CurrentPrice, PreviewShell, ProductPhoto } from "./preview-ui";
import styles from "../../app/(customer)/shop/shop.module.css";

export default function ReservePreview({ product }: { product: PreviewProduct }) {
  const [quantity, setQuantity] = useState(1);
  const [slot, setSlot] = useState("");
  const [step, setStep] = useState<"input" | "review" | "done">("input");
  const [error, setError] = useState("");
  const resultRef = useRef<HTMLDivElement>(null);
  const focusResult = () => requestAnimationFrame(() => resultRef.current?.focus());
  return <PreviewShell back={`/shop/products/${product.id}`}><div className={styles.formWidth}>
    <header className={styles.sectionHeading}><p className={styles.eyebrow}>PICK UP</p><h1>픽업 예약</h1><p className={styles.description}>수량과 방문 시간을 고르고 내용을 확인해 주세요.</p></header>
    <ol className={styles.steps} aria-label="예약 단계">{["선택", "내용 확인", "요청 화면"].map((label, index) => <li key={label} aria-current={index === ["input", "review", "done"].indexOf(step) ? "step" : undefined}><span>{index + 1}</span>{label}</li>)}</ol>
    <section className={styles.miniProduct}><ProductPhoto product={product} /><div><p className={styles.store}>{product.store}</p><h2>{product.name}</h2><CurrentPrice product={product} /></div></section>
    {step === "input" ? <form onSubmit={event => { event.preventDefault(); if (!slot) { setError("픽업 시간을 하나 선택해 주세요."); return; } setError(""); setStep("review"); focusResult(); }}>
      <section className={styles.panel}><h2>얼마나 필요하세요?</h2><p className={styles.description}>남은 수량 {product.stock}{product.unit}</p><div className={styles.quantity}><button type="button" aria-label="수량 줄이기" disabled={quantity <= 1} onClick={() => setQuantity(value => value - 1)}><Minus size={18} aria-hidden="true" /></button><output aria-live="polite">{quantity}<span>{product.unit}</span></output><button type="button" aria-label="수량 늘리기" disabled={quantity >= product.stock} onClick={() => setQuantity(value => value + 1)}><Plus size={18} aria-hidden="true" /></button></div></section>
      <fieldset className={styles.panel}><legend>언제 방문하실까요?</legend><p className={styles.description}>11월 1일 · {product.pickup}</p><div className={styles.slotGrid}>{product.slots.map(time => <label className={styles.slot} key={time}><input type="radio" name="pickup" value={time} checked={slot === time} onChange={() => { setSlot(time); setError(""); }} aria-describedby={error ? "pickup-error" : "pickup-help"} />{time}</label>)}</div><p id="pickup-help" className={styles.description}>방문 가능한 시간을 선택해 주세요.</p>{error && <p id="pickup-error" className={styles.error} role="alert">{error}</p>}</fieldset>
      <button className={styles.primary} type="submit">예약 내용 확인하기</button>
    </form> : <div ref={resultRef} tabIndex={-1}>
      {step === "done" && <section className={styles.successPanel} role="status"><CheckCircle2 size={40} aria-hidden="true" /><h2>선택 내용을 확인했어요</h2><p>선택한 수량과 픽업 시간을 확인해 주세요.</p></section>}
      <section className={styles.panel}><h2>{step === "review" ? "예약 내용을 확인해 주세요" : "선택한 예약 내용"}</h2><dl className={styles.details}><div><dt>상품 수량</dt><dd>{quantity}{product.unit}</dd></div><div><dt>픽업 일시</dt><dd>11월 1일 {slot}</dd></div><div><dt>픽업 장소</dt><dd>{product.store}</dd></div><div><dt>주소</dt><dd>{product.address}</dd></div><div><dt>현재가</dt><dd>{money(product.price)} / {product.unit}</dd></div></dl><div className={styles.total}><span>예상 총액</span><strong>{money(product.price * quantity)}</strong></div><p className={styles.description}>예약 요청 전 예상 금액이에요.</p></section>
      <p className={styles.info}>판매자 승인 후 예약이 확정돼요. 결제와 수령은 매장에서 진행해요.</p>
      {step === "review" ? <div className={styles.actions}><button className={styles.detailButton} onClick={() => setStep("input")}>선택 수정</button><button className={styles.primary} onClick={() => { setStep("done"); focusResult(); }}>선택 내용 확인하기</button></div> : <><Link className={styles.primary} href="/shop/reservations">예약 내역 보기</Link></>}
    </div>}
  </div></PreviewShell>;
}

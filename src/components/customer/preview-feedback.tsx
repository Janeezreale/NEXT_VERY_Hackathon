"use client";
import { AlertCircle, LoaderCircle, ShoppingBasket } from "lucide-react";
import type { LoadState } from "./preview-state";
import styles from "../../app/(customer)/shop/shop.module.css";

export function LoadFeedback({ state, subject, onRetry }: { state: Exclude<LoadState, "ready">; subject: string; onRetry: () => void }) {
  if (state === "loading") return <section className={styles.feedback} aria-busy="true" aria-label={`${subject} 로딩`}><p role="status"><LoaderCircle size={20} aria-hidden="true" />{subject} 불러오는 중</p><div className={styles.loadingRows} aria-hidden="true"><div /><div /><div /></div></section>;
  return <section className={styles.empty} role="alert"><AlertCircle size={32} aria-hidden="true" /><h2>{subject} 불러오지 못했어요</h2><p>잠시 후 다시 시도해 주세요.</p><button type="button" className={styles.primary} onClick={onRetry}>다시 시도</button></section>;
}
export function EmptyFeedback({ title, description, action, onAction }: { title: string; description: string; action?: string; onAction?: () => void }) {
  return <section className={styles.empty}><ShoppingBasket size={32} aria-hidden="true" /><h2>{title}</h2><p>{description}</p>{action && <button type="button" className={styles.primary} onClick={onAction}>{action}</button>}</section>;
}

"use client";

import { ArrowRight, Clock, MapPin, Phone, Store as StoreIcon } from "lucide-react";
import Link from "next/link";
import * as React from "react";

import { NaverMap } from "@/src/components/common/naver-map";
import { apiFetch } from "@/src/lib/client/api";
import { SEOUL_DISTRICTS } from "@/src/lib/regions";
import type { MappedStore } from "@/src/types/api";

import { EmptyFeedback, LoadFeedback } from "./preview-feedback";
import type { Position } from "./location";
import { toStoreView } from "./store-view";
import styles from "../../app/(customer)/shop/shop.module.css";

/** 실제 등록된 매장 지도. 서울 밖 매장의 지역은 목록 뒤에 덧붙인다. */
const MY_POSITION = "my-position";
const MY_POSITION_ICON = '<div style="width:18px;height:18px;margin:-9px 0 0 -9px;border-radius:50%;background:#176b49;border:3px solid #fff;box-shadow:0 0 0 2px #176b49"></div>';

export default function StoreMap({ position }: { position: Position | null }) {
  const [stores, setStores] = React.useState<MappedStore[]>([]);
  const [state, setState] = React.useState<"loading" | "error" | "ready">("loading");
  const [region, setRegion] = React.useState("");
  const [selectedId, setSelectedId] = React.useState<string | null>(null);

  const [attempt, setAttempt] = React.useState(0);

  React.useEffect(() => {
    let active = true;
    apiFetch<{ items: MappedStore[] }>("/api/stores")
      .then(({ items }) => {
        if (!active) return;
        setStores(items);
        setState("ready");
      })
      .catch(() => {
        if (active) setState("error");
      });
    return () => {
      active = false;
    };
  }, [attempt]);

  function retry() {
    setState("loading");
    setAttempt((count) => count + 1);
  }

  const regions = React.useMemo(
    () => [...new Set([...SEOUL_DISTRICTS, ...stores.map((store) => store.regionCode)])],
    [stores],
  );
  const visible = React.useMemo(
    () => stores.filter((store) => !region || store.regionCode === region),
    [stores, region],
  );
  const markers = React.useMemo(
    () => [
      ...visible.map((store) => ({ id: store.id, latitude: store.latitude, longitude: store.longitude, title: store.name })),
      ...(position ? [{ id: MY_POSITION, ...position, title: "내 위치", icon: MY_POSITION_ICON }] : []),
    ],
    [visible, position],
  );
  const selectStore = React.useCallback((id: string) => {
    if (id !== MY_POSITION) setSelectedId(id);
  }, []);
  const found = visible.find((store) => store.id === selectedId);
  const selected = found ? toStoreView(found, new Date()) : null;

  if (state !== "ready") return <LoadFeedback state={state} subject="매장을" onRetry={retry} />;
  if (stores.length === 0) {
    return <EmptyFeedback title="지도에 표시할 매장이 없어요" description="매장이 위치를 등록하면 여기에 나타나요." />;
  }

  return (
    <section aria-label="매장 지도" className="flex w-full flex-col gap-4">
      <label className={styles.region}>
        <span>
          <MapPin size={18} aria-hidden="true" />
          매장 지역
        </span>
        <select
          value={region}
          onChange={(event) => {
            setRegion(event.target.value);
            setSelectedId(null);
          }}
        >
          <option value="">전체 지역</option>
          {regions.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
      </label>
      <p role="status">매장 {visible.length}곳</p>
      {visible.length === 0 ? (
        <EmptyFeedback title={`${region}에 등록된 매장이 없어요`} description="다른 지역을 선택해 보세요." />
      ) : (
        <NaverMap markers={markers} onSelect={selectStore} label="매장 위치 지도" className="h-80" />
      )}
      {visible.length === 0 ? null : selected ? (
        <article className={`${styles.panel} ${styles.storePanel}`}>
          <p className={styles.store}>
            <StoreIcon size={14} aria-hidden="true" />
            {selected.region}
          </p>
          <h3>{selected.name}</h3>
          {selected.description ? <p className={styles.description}>{selected.description}</p> : null}
          <div className={styles.storeFacts}>
            <p className={styles.address}>
              <Clock size={18} aria-hidden="true" />
              {selected.status} · 영업시간 {selected.hours}
            </p>
            <p className={styles.address}>
              <MapPin size={18} aria-hidden="true" />
              {selected.address}
            </p>
            {selected.phone ? (
              <p className={styles.address}>
                <Phone size={18} aria-hidden="true" />
                <Link href={`tel:${selected.phone}`}>{selected.phoneLabel}</Link>
              </p>
            ) : null}
          </div>
          <Link href={`/shop/stores/${selected.id}`} className={styles.detailButton}>
            가게 프로필과 판매 상품 보기
            <ArrowRight size={18} aria-hidden="true" />
          </Link>
        </article>
      ) : (
        <p>지도의 표시를 누르면 매장 정보를 볼 수 있어요.</p>
      )}
    </section>
  );
}

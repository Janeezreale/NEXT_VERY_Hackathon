"use client";

import * as React from "react";

import type { Position } from "./location";

export type LocationStatus = "off" | "locating" | "on" | "denied" | "unavailable";

/** 약 100m 단위. 작은 흔들림으로 지도와 목록이 다시 그려지지 않게 한다. */
const round = (value: number) => Math.round(value * 1000) / 1000;

const subscribeNever = () => () => {};
const hasGeolocation = () => "geolocation" in navigator;
/** Node에도 navigator가 있어 서버에서 직접 확인하면 브라우저 첫 렌더링과 달라진다. */
const assumeGeolocation = () => true;

/**
 * 화면을 보는 동안 내 위치를 따라간다. 위치는 브라우저 안에서만 쓰고 서버로 보내거나 저장하지 않는다.
 * 권한 요청은 사용자가 위치 기능을 고른 뒤에만 나간다.
 */
export function useLocation(autoStart: boolean) {
  /** 다시 시도할 때마다 늘어난다. 0이면 꺼진 상태다. */
  const [attempt, setAttempt] = React.useState(autoStart ? 1 : 0);
  const [position, setPosition] = React.useState<Position | null>(null);
  const [failure, setFailure] = React.useState<"denied" | "unavailable" | null>(null);

  React.useEffect(() => {
    if (attempt === 0) return;
    const { geolocation } = navigator;
    const watch = geolocation?.watchPosition(
      ({ coords }) => {
        setFailure(null);
        const next = { latitude: round(coords.latitude), longitude: round(coords.longitude) };
        setPosition((current) => (current?.latitude === next.latitude && current.longitude === next.longitude ? current : next));
      },
      (error) => setFailure(error.code === error.PERMISSION_DENIED ? "denied" : "unavailable"),
      { maximumAge: 30_000, timeout: 15_000 },
    );
    return () => {
      if (watch !== undefined) geolocation.clearWatch(watch);
    };
  }, [attempt]);

  const supported = React.useSyncExternalStore(subscribeNever, hasGeolocation, assumeGeolocation);
  const status: LocationStatus = attempt === 0 ? "off" : !supported ? "unavailable" : position ? "on" : (failure ?? "locating");

  return {
    position,
    status,
    start: () => {
      setFailure(null);
      setAttempt((count) => count + 1);
    },
    stop: () => {
      setAttempt(0);
      setPosition(null);
      setFailure(null);
    },
  };
}

"use client";

import Script from "next/script";
import * as React from "react";

import { FormAlert } from "@/src/components/common/form-alert";
import { cn } from "@/src/lib/utils";

type LatLng = object;
type MapEvents = { addListener(target: object, event: string, handler: () => void): void };
type NaverMaps = {
  LatLng: new (latitude: number, longitude: number) => LatLng;
  LatLngBounds: new (southWest: LatLng, northEast: LatLng) => { extend(position: LatLng): void };
  Map: new (element: HTMLElement, options: { center: LatLng; zoom: number }) => {
    fitBounds(bounds: object): void;
    destroy(): void;
  };
  Marker: new (options: { position: LatLng; map: object; title?: string }) => { setMap(map: null): void };
  Event: MapEvents;
};

declare global {
  interface Window {
    naver?: { maps: NaverMaps };
    navermap_authFailure?: () => void;
  }
}

export type MapMarker = { id: string; latitude: number; longitude: number; title: string };

type NaverMapProps = {
  markers: MapMarker[];
  onSelect?: (id: string) => void;
  label: string;
  className?: string;
};

const SINGLE_MARKER_ZOOM = 16;
const SCRIPT_URL = "https://oapi.map.naver.com/openapi/v3/maps.js";

export function NaverMap({ markers, onSelect, label, className }: NaverMapProps) {
  const keyId = process.env.NEXT_PUBLIC_NAVER_MAPS_CLIENT_ID;
  const container = React.useRef<HTMLDivElement>(null);
  const [status, setStatus] = React.useState<"loading" | "ready" | "failed">(keyId ? "loading" : "failed");

  React.useEffect(() => {
    window.navermap_authFailure = () => setStatus("failed");
    return () => {
      delete window.navermap_authFailure;
    };
  }, []);

  React.useEffect(() => {
    const maps = window.naver?.maps;
    const element = container.current;
    if (status !== "ready" || !maps || !element || markers.length === 0) return;

    const positions = markers.map((marker) => new maps.LatLng(marker.latitude, marker.longitude));
    const map = new maps.Map(element, { center: positions[0], zoom: SINGLE_MARKER_ZOOM });
    const pins = markers.map((marker, index) => {
      const pin = new maps.Marker({ position: positions[index], map, title: marker.title });
      if (onSelect) maps.Event.addListener(pin, "click", () => onSelect(marker.id));
      return pin;
    });
    if (positions.length > 1) {
      const bounds = new maps.LatLngBounds(positions[0], positions[0]);
      positions.forEach((position) => bounds.extend(position));
      map.fitBounds(bounds);
    }

    return () => {
      pins.forEach((pin) => pin.setMap(null));
      map.destroy();
    };
  }, [status, markers, onSelect]);

  if (status === "failed") return <FormAlert>지도를 불러오지 못했어요.</FormAlert>;

  return (
    <>
      <Script
        src={`${SCRIPT_URL}?ncpKeyId=${keyId}`}
        strategy="afterInteractive"
        onReady={() => setStatus("ready")}
        onError={() => setStatus("failed")}
      />
      <div
        ref={container}
        role="application"
        aria-label={label}
        aria-busy={status === "loading"}
        className={cn("h-64 w-full overflow-hidden rounded-md border border-border bg-muted", className)}
      />
    </>
  );
}

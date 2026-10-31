"use client";

import { Search } from "lucide-react";
import * as React from "react";

import { FormAlert } from "@/src/components/common/form-alert";
import { FormField } from "@/src/components/common/form-field";
import { NaverMap } from "@/src/components/common/naver-map";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { apiFetch, ApiClientError } from "@/src/lib/client/api";
import { SEOUL_DISTRICTS } from "@/src/lib/regions";
import type { AddressResult } from "@/src/types/api";

export type StoreLocation = {
  regionCode: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
};

type AddressFieldProps = {
  value: StoreLocation;
  errors: Partial<Record<"regionCode" | "address", string>>;
  onChange: (patch: Partial<StoreLocation>) => void;
};

/** 네이버 주소 검색으로 위치를 고른다. 검색을 쓸 수 없으면 직접 입력하고 좌표는 비워 둔다(D11). */
export function AddressField({ value, errors, onChange }: AddressFieldProps) {
  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<AddressResult[] | null>(null);
  const [searchError, setSearchError] = React.useState<string | null>(null);
  const [searching, setSearching] = React.useState(false);
  const located = value.latitude !== null && value.longitude !== null;
  const markers = React.useMemo(
    () =>
      value.latitude !== null && value.longitude !== null
        ? [{ id: "store", latitude: value.latitude, longitude: value.longitude, title: value.address }]
        : [],
    [value.latitude, value.longitude, value.address],
  );

  async function search() {
    const text = query.trim();
    if (!text || searching) return;
    setSearching(true);
    setSearchError(null);
    setResults(null);
    try {
      const { items } = await apiFetch<{ items: AddressResult[] }>(`/api/seller/geocode?query=${encodeURIComponent(text)}`);
      setResults(items);
    } catch (error) {
      if (!(error instanceof ApiClientError)) throw error;
      setSearchError(error.message);
    } finally {
      setSearching(false);
    }
  }

  function select(result: AddressResult) {
    onChange({
      address: result.roadAddress || result.jibunAddress,
      regionCode: result.regionCode,
      latitude: result.latitude,
      longitude: result.longitude,
    });
    setResults(null);
  }

  return (
    <>
      <FormField id="store-address-search" label="주소 검색" hint="도로명이나 지번 주소로 찾아 주세요. 예: 안암로 145">
        {(control) => (
          <div className="flex gap-2">
            <Input
              {...control}
              name="addressQuery"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key !== "Enter") return;
                e.preventDefault();
                void search();
              }}
            />
            <Button type="button" variant="outline" loading={searching} loadingText="검색 중…" onClick={search}>
              <Search className="size-4" aria-hidden="true" />
              검색
            </Button>
          </div>
        )}
      </FormField>

      {searchError ? <FormAlert>{searchError}</FormAlert> : null}
      {results?.length === 0 ? (
        <FormAlert tone="info">찾은 주소가 없어요. 상호명이 아니라 주소로 검색해 주세요.</FormAlert>
      ) : null}
      {results?.length ? (
        <ul aria-label="주소 검색 결과" className="flex flex-col gap-2">
          {results.map((result) => (
            <li key={`${result.longitude},${result.latitude},${result.jibunAddress}`}>
              <button
                type="button"
                onClick={() => select(result)}
                className="w-full rounded-md border border-border bg-card p-3 text-left text-sm leading-5 text-foreground"
              >
                {result.roadAddress || result.jibunAddress}
                {result.roadAddress ? <span className="block text-muted-foreground">{result.jibunAddress}</span> : null}
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <FormField
        id="store-address"
        label="주소"
        required
        hint="검색한 주소 뒤에 상세 주소를 덧붙일 수 있어요."
        error={errors.address}
      >
        {(control) => (
          <Input
            {...control}
            name="address"
            autoComplete="street-address"
            value={value.address}
            onChange={(e) => onChange({ address: e.target.value })}
          />
        )}
      </FormField>

      <FormField
        id="store-region"
        label="지역"
        required
        hint={located ? "검색한 주소에서 자동으로 정해져요." : "소비자가 매장을 찾을 때 쓰는 지역이에요."}
        error={errors.regionCode}
      >
        {(control) =>
          located ? (
            <Input {...control} name="regionCode" readOnly value={value.regionCode} />
          ) : (
            <select
              {...control}
              name="regionCode"
              value={value.regionCode}
              onChange={(e) => onChange({ regionCode: e.target.value })}
              className="block h-12 w-full rounded-md border border-input bg-card px-3 text-base leading-6 text-foreground"
            >
              <option value="">지역을 선택해 주세요</option>
              {[...new Set([...SEOUL_DISTRICTS, ...(value.regionCode ? [value.regionCode] : [])])].map((region) => (
                <option key={region}>{region}</option>
              ))}
            </select>
          )
        }
      </FormField>

      {located ? (
        <NaverMap markers={markers} label="선택한 매장 위치" />
      ) : (
        <p className="text-sm leading-5 text-muted-foreground">주소를 검색해서 고르면 소비자 지도에 매장이 표시돼요.</p>
      )}
    </>
  );
}

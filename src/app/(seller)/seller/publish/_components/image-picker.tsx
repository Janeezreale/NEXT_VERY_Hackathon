"use client";

import Image from "next/image";
import * as React from "react";

import { FormAlert } from "@/src/components/common/form-alert";
import { Button } from "@/src/components/ui/button";
import { apiFetch, ApiClientError } from "@/src/lib/client/api";
import { createClient } from "@/src/lib/supabase/client";
import type { Analysis } from "@/src/types/api";

const BUCKET = "product-images";
const MAX_BYTES = 5 * 1024 * 1024;
const EXTENSIONS: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

type ImagePickerProps = {
  storeId: string;
  /** 상품 수정 화면. 입력한 내용을 덮어쓰지 않도록 AI 분석을 하지 않는다. */
  editing?: boolean;
  currentUrl?: string | null;
  onUploaded: (path: string | null | undefined) => void;
  onAnalyzed: (analysis: Analysis) => void;
};

/** 사진은 선택 사항이다. 분석이 실패해도 직접 입력해 게시할 수 있다. */
export function ImagePicker({ storeId, editing = false, currentUrl = null, onUploaded, onAnalyzed }: ImagePickerProps) {
  const [preview, setPreview] = React.useState<string | null>(null);
  const [removed, setRemoved] = React.useState(false);
  const input = React.useRef<HTMLInputElement>(null);
  /** 올렸지만 아직 저장하지 않은 파일. 다른 사진을 고르거나 지우면 남기지 않는다. */
  const unsaved = React.useRef<string | null>(null);
  const [status, setStatus] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => () => {
    if (preview) URL.revokeObjectURL(preview);
  }, [preview]);

  function discardUnsaved() {
    if (unsaved.current) void createClient().storage.from(BUCKET).remove([unsaved.current]);
    unsaved.current = null;
  }

  function remove() {
    discardUnsaved();
    if (input.current) input.current.value = "";
    setPreview(null);
    setRemoved(true);
    setError(null);
    onUploaded(null);
  }

  async function select(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setError(null);
    onUploaded(undefined);
    const extension = EXTENSIONS[file.type];
    if (!extension) return setError("JPG, PNG, WEBP 사진만 올릴 수 있어요.");
    if (file.size > MAX_BYTES) return setError("사진은 5MB 이하로 올려 주세요.");

    discardUnsaved();
    setPreview(URL.createObjectURL(file));
    setRemoved(false);
    setStatus("사진을 올리는 중이에요");
    const path = `${storeId}/${crypto.randomUUID()}.${extension}`;
    const { error: uploadError } = await createClient().storage.from(BUCKET).upload(path, file, { contentType: file.type });
    if (uploadError) {
      setStatus(null);
      setPreview(null);
      return setError("사진을 올리지 못했어요. 다시 시도해 주세요.");
    }
    unsaved.current = path;
    onUploaded(path);
    if (editing) return setStatus(null);

    setStatus("사진을 분석하는 중이에요");
    try {
      onAnalyzed(
        await apiFetch<Analysis>("/api/seller/analyses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imagePath: path }),
        }),
      );
    } catch (failure) {
      if (!(failure instanceof ApiClientError)) throw failure;
      setError(failure.message);
    } finally {
      setStatus(null);
    }
  }

  const shown = preview ?? (removed ? null : currentUrl);

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor="product-image" className="text-sm leading-5 font-medium text-foreground">상품 사진 (선택)</label>
      <input
        ref={input}
        id="product-image"
        name="image"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={select}
        className="block w-full text-sm text-foreground file:mr-3 file:min-h-11 file:rounded-md file:border file:border-input file:bg-card file:px-3 file:text-sm file:font-semibold"
      />
      <p className="text-sm leading-5 text-muted-foreground">
        {editing ? "새 사진을 고르면 저장할 때 바뀌어요." : "사진을 올리면 상품 이름과 수량을 제안해요."} JPG·PNG·WEBP, 5MB 이하.
      </p>
      {shown ? (
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-md border border-border">
          <Image src={shown} alt="상품 사진" fill unoptimized className="object-cover" />
        </div>
      ) : null}
      {editing && shown ? (
        <Button type="button" variant="outline" size="compact" className="w-fit" onClick={remove}>
          사진 삭제
        </Button>
      ) : null}
      {editing && removed && currentUrl ? <p role="status" className="text-sm leading-5 text-muted-foreground">저장하면 사진이 삭제돼요.</p> : null}
      {status ? <p role="status" className="text-sm leading-5 text-muted-foreground">{status}</p> : null}
      {error ? <FormAlert>{error}</FormAlert> : null}
    </div>
  );
}

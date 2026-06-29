"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";

import { uploadPhotos } from "./actions";

/** 브라우저에서 이미지를 webp로 축소 — 전송량(서버/Vercel 본문 한도) 회피 */
async function downscale(file: File, max = 1600, quality = 0.85): Promise<File> {
  if (!file.type.startsWith("image/")) return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
    const w = Math.round(bitmap.width * scale);
    const h = Math.round(bitmap.height * scale);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, w, h);
    bitmap.close?.();
    const blob = await new Promise<Blob | null>((res) =>
      canvas.toBlob(res, "image/webp", quality),
    );
    if (!blob) return file;
    return new File([blob], file.name.replace(/\.\w+$/, "") + ".webp", {
      type: "image/webp",
    });
  } catch {
    return file;
  }
}

export function PhotoUpload({
  slug,
  remaining,
}: {
  slug: string;
  remaining: number;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [pending, start] = useTransition();

  const submit = () => {
    setError(null);
    setDone(false);
    if (!files.length) {
      setError("사진을 선택해 주세요.");
      return;
    }
    start(async () => {
      try {
        const fd = new FormData();
        for (const f of files.slice(0, remaining)) {
          fd.append("photos", await downscale(f));
        }
        await uploadPhotos(slug, fd);
        setFiles([]);
        if (inputRef.current) inputRef.current.value = "";
        setDone(true);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "업로드에 실패했습니다.");
      }
    });
  };

  return (
    <div className="mt-4">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={(e) => {
          setDone(false);
          setError(null);
          setFiles(Array.from(e.target.files ?? []));
        }}
        className="block w-full text-sm text-neutral file:mr-3 file:rounded-lg file:border-0 file:bg-brand-weak file:px-4 file:py-2 file:text-sm file:font-bold file:text-brand"
      />
      <button
        type="button"
        onClick={submit}
        disabled={pending}
        className="mt-3 rounded-lg bg-[#1E5BD6] px-5 py-2 text-sm font-bold text-white hover:bg-[#1a4fbb] disabled:opacity-60"
      >
        {pending ? "저장 중…" : "저장"}
      </button>

      {error && <p className="mt-2 text-sm text-warning">{error}</p>}
      {done && <p className="mt-2 text-sm text-brand">사진이 저장되었습니다.</p>}

      <p className="mt-2 text-xs text-subtle">
        최대 {remaining}장 추가 가능. 업로드 전 자동으로 축소돼 빠르게 전송됩니다.
      </p>
    </div>
  );
}

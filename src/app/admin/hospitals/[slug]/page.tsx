import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getSupabaseAdmin } from "@/lib/supabase/admin";

import { deletePhoto, setPrimaryPhoto } from "./actions";
import { PhotoUpload } from "./photo-upload";

export const metadata: Metadata = {
  title: "병원 편집 · 관리자",
  robots: { index: false, follow: false },
};

type Params = Promise<{ slug: string }>;
type SP = Promise<{ saved?: string }>;

export default async function AdminHospitalEditPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SP;
}) {
  const { slug: raw } = await params;
  const slug = decodeURIComponent(raw);
  const { saved } = await searchParams;
  const sb = getSupabaseAdmin();
  const { data: h } = await sb
    .from("hospitals")
    .select(
      "id, name, slug, type, sido, sigungu, road_address, address, phone, description, homepage_url, booking_url",
    )
    .eq("slug", slug)
    .maybeSingle();
  if (!h) notFound();

  const { data: photos } = await sb
    .from("hospital_photos")
    .select("id, url, is_primary, sort_order")
    .eq("hospital_id", h.id)
    .order("sort_order");
  const photoList = photos ?? [];

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Link href="/admin" className="text-sm font-medium text-brand">
        ← 관리자 홈
      </Link>
      <h1 className="mt-3 text-2xl font-bold text-neutral">{h.name}</h1>
      <p className="mt-1 text-sm text-muted">
        {h.type} · {h.sido} {h.sigungu} · {h.road_address ?? h.address}
      </p>
      <Link
        href={`/hospitals/${h.slug}`}
        target="_blank"
        className="mt-1 inline-block text-sm text-brand"
      >
        상세페이지 보기 ↗
      </Link>

      {saved && (
        <p className="mt-4 rounded-lg border border-[#1E5BD6]/30 bg-brand-weak px-4 py-2.5 text-sm font-medium text-brand">
          {saved === "photos" ? "사진이 저장되었습니다." : "정보가 저장되었습니다."}
        </p>
      )}

      {/* 사진 관리 */}
      <section className="mt-8 rounded-2xl border border-line p-6">
        <h2 className="text-lg font-bold text-neutral">
          병원 사진 <span className="text-sm font-normal text-muted">({photoList.length}/5)</span>
        </h2>

        {photoList.length > 0 && (
          <ul className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-5">
            {photoList.map((p) => (
              <li key={p.id} className="flex flex-col gap-1.5">
                <div className="relative aspect-square overflow-hidden rounded-lg border border-line">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={p.url}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                  {p.is_primary && (
                    <span className="absolute left-1 top-1 rounded bg-[#1E5BD6] px-1.5 py-0.5 text-[10px] font-bold text-white">
                      대표
                    </span>
                  )}
                </div>
                <div className="flex gap-1">
                  {!p.is_primary && (
                    <form
                      action={setPrimaryPhoto.bind(null, slug, h.id, p.id)}
                      className="flex-1"
                    >
                      <button className="w-full rounded border border-line py-1 text-[11px] text-neutral hover:bg-neutral-weak">
                        대표
                      </button>
                    </form>
                  )}
                  <form
                    action={deletePhoto.bind(null, slug, p.id)}
                    className="flex-1"
                  >
                    <button className="w-full rounded border border-line py-1 text-[11px] text-warning hover:bg-neutral-weak">
                      삭제
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}

        {photoList.length < 5 && (
          <PhotoUpload slug={slug} remaining={5 - photoList.length} />
        )}
      </section>
    </div>
  );
}

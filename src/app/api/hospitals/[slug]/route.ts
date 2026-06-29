import { type NextRequest, NextResponse } from "next/server";

import { getHospitalBySlug } from "@/api/hospital";

/** 단일 병원 상세 — /map 좌측 상세 패널용(클라이언트 fetch) */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const hospital = await getHospitalBySlug(decodeURIComponent(slug));
  if (!hospital) {
    return NextResponse.json({ error: "찾을 수 없습니다" }, { status: 404 });
  }
  return NextResponse.json({ hospital });
}

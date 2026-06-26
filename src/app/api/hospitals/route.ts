import { type NextRequest, NextResponse } from "next/server";

import { getHospitals } from "@/api/hospital";
import { MEDICAL_DEPARTMENTS, type MedicalDepartment } from "@/constants/hospital";
import type { HospitalSearchFilters } from "@/types/hospital";

const PAGE_SIZE = 24;

/** 무한스크롤용 병원 목록 API. searchParams로 필터 + page 받아 Paginated<Hospital> 반환. */
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const dep = sp.get("department");
  const lat = sp.get("lat");
  const lng = sp.get("lng");
  const radius = sp.get("radius");

  const filters: HospitalSearchFilters = {
    q: sp.get("q") ?? undefined,
    department:
      dep && (MEDICAL_DEPARTMENTS as readonly string[]).includes(dep)
        ? (dep as MedicalDepartment)
        : undefined,
    sido: sp.get("sido") ?? undefined,
    region: sp.get("region") ?? undefined,
    openNow: sp.get("open") === "1" || undefined,
    center: lat && lng ? { lat: Number(lat), lng: Number(lng) } : undefined,
    radiusKm: radius ? Number(radius) : undefined,
    page: sp.get("page") ? Number(sp.get("page")) : 1,
    pageSize: PAGE_SIZE,
  };

  const result = await getHospitals(filters);
  return NextResponse.json(result);
}

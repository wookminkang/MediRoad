import { type NextRequest, NextResponse } from "next/server";

import { getRegionClusters } from "@/api/hospital";
import {
  HOSPITAL_TYPES,
  MEDICAL_DEPARTMENTS,
  type HospitalType,
  type MedicalDepartment,
} from "@/constants/hospital";

/** 지도 축소 시 지역(시도/시군구) 집계 — /map 클러스터 라벨 */
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const num = (k: string) => Number(sp.get(k));
  const minLat = num("minLat");
  const minLng = num("minLng");
  const maxLat = num("maxLat");
  const maxLng = num("maxLng");
  if ([minLat, minLng, maxLat, maxLng].some((n) => Number.isNaN(n))) {
    return NextResponse.json({ error: "bounds 필요" }, { status: 400 });
  }
  const level = sp.get("level") === "sido" ? "sido" : "sigungu";
  const dep = sp.get("department");
  const typ = sp.get("type");

  const clusters = await getRegionClusters(
    level,
    { minLat, minLng, maxLat, maxLng },
    {
      type:
        typ && (HOSPITAL_TYPES as readonly string[]).includes(typ)
          ? (typ as HospitalType)
          : undefined,
      q: sp.get("q") ?? undefined,
      department:
        dep && (MEDICAL_DEPARTMENTS as readonly string[]).includes(dep)
          ? (dep as MedicalDepartment)
          : undefined,
      openNow: sp.get("open") === "1",
      night: sp.get("night") === "1",
    },
  );
  return NextResponse.json({ clusters });
}

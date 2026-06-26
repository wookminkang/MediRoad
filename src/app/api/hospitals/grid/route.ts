import { type NextRequest, NextResponse } from "next/server";

import { getGridClusters } from "@/api/hospital";
import {
  HOSPITAL_TYPES,
  MEDICAL_DEPARTMENTS,
  type HospitalType,
  type MedicalDepartment,
} from "@/constants/hospital";

/** 중간 줌 그리드 카운트 버블 — /map */
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const num = (k: string) => Number(sp.get(k));
  const minLat = num("minLat");
  const minLng = num("minLng");
  const maxLat = num("maxLat");
  const maxLng = num("maxLng");
  const step = num("step");
  if ([minLat, minLng, maxLat, maxLng, step].some((n) => Number.isNaN(n))) {
    return NextResponse.json({ error: "bounds/step 필요" }, { status: 400 });
  }
  const dep = sp.get("department");
  const typ = sp.get("type");
  const clusters = await getGridClusters(
    { minLat, minLng, maxLat, maxLng },
    step,
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

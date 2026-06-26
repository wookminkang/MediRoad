/**
 * 지하철역 적재 — 도시철도역사정보.xlsx → subway_stations.
 * 실행: node --env-file=.env.local --import tsx scripts/load-subway.mts
 */
import { readFileSync } from "node:fs";

import { createClient } from "@supabase/supabase-js";
import * as XLSX from "xlsx";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } },
);

type Row = {
  역번호: string | number;
  역사명: string;
  노선번호: string;
  노선명: string;
  역위도: number | null;
  역경도: number | null;
};

const buf = readFileSync("도시철도역사정보.xlsx");
const wb = XLSX.read(buf, { type: "buffer" });
const ws = wb.Sheets[wb.SheetNames[0]];
const rows = XLSX.utils.sheet_to_json<Row>(ws, { defval: null });

const seen = new Set<string>();
const records = rows
  .filter((r) => r.역위도 != null && r.역경도 != null && r.역사명)
  .map((r) => ({
    id: `${r.역번호}-${r.노선번호}`,
    name: String(r.역사명).trim(),
    line: r.노선명 ? String(r.노선명).trim() : null,
    lat: Number(r.역위도),
    lng: Number(r.역경도),
  }))
  .filter((r) => {
    if (seen.has(r.id)) return false; // 중복 id 제거
    seen.add(r.id);
    return true;
  });

console.log(`적재 대상: ${records.length}개 역`);

for (let i = 0; i < records.length; i += 500) {
  const chunk = records.slice(i, i + 500);
  const { error } = await sb.from("subway_stations").upsert(chunk, { onConflict: "id" });
  if (error) throw error;
}
console.log("적재 완료.");

// 검증: 강남역 근처 최근접 역
const { data, error } = await sb.rpc("nearest_subway", { p_lat: 37.4979, p_lng: 127.0276 });
console.log("강남역(37.4979,127.0276) 최근접:", error?.message ?? JSON.stringify(data));

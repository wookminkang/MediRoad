/**
 * 최근접 지하철역 사전계산 → hospitals.station_* 저장 (런타임 RPC 제거).
 * 역/좌표는 정적이라 1회 계산해 캐싱. 신규 동기화 후 재실행하면 됨.
 * 실행: node --env-file=.env.local --import tsx scripts/precompute-stations.mts
 */
import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } },
);

const MAX_M = 1500; // 도보권 1.5km 이내만
const toR = Math.PI / 180;
function haversine(lat1: number, lng1: number, lat2: number, lng2: number) {
  const dLat = (lat2 - lat1) * toR;
  const dLng = (lng2 - lng1) * toR;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * toR) * Math.cos(lat2 * toR) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371000 * Math.asin(Math.sqrt(a));
}

// 역 전체 메모리 적재 (max-rows=1000 → 페이지네이션)
const ST: { name: string; line: string | null; lat: number; lng: number }[] = [];
for (let from = 0; ; from += 1000) {
  const { data, error } = await sb
    .from("subway_stations")
    .select("name,line,lat,lng")
    .not("lat", "is", null)
    .order("id")
    .range(from, from + 999);
  if (error) throw error;
  if (!data?.length) break;
  ST.push(...(data as typeof ST));
  if (data.length < 1000) break;
}
console.log(`역 ${ST.length}개 로드`);

let after = "";
let scanned = 0;
const updates: { id: string; station_name: string; station_line: string | null; station_distance_m: number }[] = [];

while (true) {
  const { data, error } = await sb
    .from("hospitals")
    .select("id,lat,lng")
    .gt("id", after)
    .order("id")
    .limit(2000);
  if (error) throw error;
  if (!data?.length) break;
  after = data[data.length - 1].id;

  for (const h of data) {
    if (h.lat == null || h.lng == null) continue;
    // 근사 랭킹(lng는 cos 보정) → 최근접 1곳만 골라 정확 거리 계산
    let best = -1;
    let bestApprox = Infinity;
    const cos = Math.cos(h.lat * toR);
    for (let i = 0; i < ST.length; i++) {
      const dLat = ST[i].lat - h.lat;
      const dLng = (ST[i].lng - h.lng) * cos;
      const d = dLat * dLat + dLng * dLng;
      if (d < bestApprox) {
        bestApprox = d;
        best = i;
      }
    }
    if (best < 0) continue;
    const s = ST[best];
    const dist = Math.round(haversine(h.lat, h.lng, s.lat, s.lng));
    if (dist <= MAX_M) {
      updates.push({
        id: h.id,
        station_name: s.name,
        station_line: s.line,
        station_distance_m: dist,
      });
    }
  }
  scanned += data.length;
  if (scanned % 10000 < 2000) console.log(`스캔 ${scanned}…`);
}

console.log(`사전계산 완료. 역 1.5km 이내 병원 ${updates.length}곳 업데이트 시작…`);
const CONC = 20;
let done = 0;
for (let i = 0; i < updates.length; i += CONC) {
  const chunk = updates.slice(i, i + CONC);
  await Promise.all(
    chunk.map((u) =>
      sb
        .from("hospitals")
        .update({
          station_name: u.station_name,
          station_line: u.station_line,
          station_distance_m: u.station_distance_m,
        })
        .eq("id", u.id)
        .then(({ error }) => {
          if (error) console.error(`  ${u.id} 실패: ${error.message}`);
        }),
    ),
  );
  done += chunk.length;
  if (done % 5000 < CONC) console.log(`업데이트 ${done}/${updates.length}`);
}
console.log("완료.");

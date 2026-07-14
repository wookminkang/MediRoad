/**
 * 병원 포스트 예약 발행.
 *
 * status='published' 하나만 보면 미래 날짜로 넣어둔 글이 즉시 노출된다.
 * 그래서 published_at이 지난 글만 보이도록 기준 시각을 한 곳에서 만든다.
 *
 * 글을 미리 다 써두고 published_at만 하루 간격으로 박아두면 매일 하나씩 뜬다.
 * 사람이 매일 손댈 필요가 없다.
 *
 * ── 반드시 5곳 전부에 적용해야 한다 ──
 *   getHospitalPosts / getHospitalPost / getLatestHospitalPosts (api/hospital-post.ts)
 *   getSitemapHospitals / getSitemapPosts (api/hospital.ts)
 * 한 곳이라도 빠지면 아직 안 뜬 글이 새거나(단건 URL 직접 접근),
 * 사이트맵에 404 URL이 실려 색인 신뢰도를 깎는다.
 *
 * ── 노출 시각 ──
 * published_at을 날짜만 넣으면 그날 00:00Z에 저장된다. 한국은 UTC+9라
 * 실제 노출은 그날 아침 9시다. 오전에 하나씩 뜨는 셈이라 의도한 대로다.
 */
export function publishedCutoff(): string {
  return new Date().toISOString();
}

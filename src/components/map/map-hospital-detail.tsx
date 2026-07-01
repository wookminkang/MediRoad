"use client";

import Link from "next/link";

import { OpeningHoursTable } from "@/components/hospital/opening-hours-table";
import { isPartnerHospital } from "@/constants/partners";
import { lineColor } from "@/lib/station";
import type { Hospital } from "@/types/hospital";

/**
 * 지도 좌측 상세 패널 — 리스트에서 병원 클릭 시 표시(PC).
 * 네이버 지도 장소 패널과 유사한 구성: 헤더 → 액션 → 사진 → 정보.
 */
export function MapHospitalDetail({
  hospital: h,
  loading,
  onBack,
  onClose,
}: {
  hospital: Hospital;
  loading: boolean;
  onBack: () => void;
  onClose: () => void;
}) {
  const addr = h.roadAddress ?? h.address;
  const st = h.nearestStation;
  const stWalk = st ? Math.max(1, Math.round(st.distanceM / 80)) : 0;
  const photos = [...(h.photos ?? [])]
    .sort((a, b) => (b.isPrimary ? 1 : 0) - (a.isPrimary ? 1 : 0))
    .slice(0, 8);
  const naverUrl = `https://map.naver.com/p/search/${encodeURIComponent(h.name)}`;

  return (
    <div className="flex h-full flex-col bg-white">
      {/* 헤더 */}
      <div className="flex shrink-0 items-center justify-between border-b border-line px-3 py-2.5">
        <button
          type="button"
          onClick={onBack}
          aria-label="목록으로"
          className="flex h-9 w-9 items-center justify-center rounded-full text-neutral transition-colors hover:bg-neutral-weak"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="m15 18-6-6 6-6" />
          </svg>
        </button>
        <div className="flex items-center gap-1">
          <Link
            href={`/hospitals/${h.slug}`}
            target="_blank"
            className="rounded-full px-3 py-1.5 text-sm font-medium text-brand transition-colors hover:bg-brand-weak"
          >
            상세페이지 ↗
          </Link>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="flex h-9 w-9 items-center justify-center rounded-full text-neutral transition-colors hover:bg-neutral-weak"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* 본문 스크롤 */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="px-4 pt-4">
          <div className="flex items-center gap-1.5">
            <h2 className="text-xl font-bold text-neutral">{h.name}</h2>
            {isPartnerHospital(h.id) && (
              <span className="shrink-0 rounded bg-[#1E5BD6] px-1.5 py-0.5 text-[11px] font-bold text-white">
                제휴
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-muted">
            <span className="font-semibold text-neutral">{h.type}</span>
            {" · "}
            {h.region.sigungu}
            {h.isOpenNow != null && (
              <>
                {" · "}
                <span className={h.isOpenNow ? "font-semibold text-brand" : "text-subtle"}>
                  {h.isOpenNow ? "영업중" : "영업종료"}
                </span>
              </>
            )}
          </p>

          {/* 액션 버튼 */}
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
            {h.phone && (
              <ActionChip href={`tel:${h.phone}`} label="전화" tone="solid" icon={<PhoneIcon />} />
            )}
            <ActionChip href={naverUrl} external label="길찾기" icon={<RouteIcon />} />
            {h.links?.naverBooking && (
              <ActionChip href={h.links.naverBooking} external label="예약" icon={<CalIcon />} />
            )}
            {h.links?.homepage && (
              <ActionChip href={h.links.homepage} external label="홈페이지" icon={<GlobeIcon />} />
            )}
          </div>
        </div>

        {/* 사진 */}
        {photos.length > 0 && (
          <div className="mt-3 flex gap-2 overflow-x-auto px-4 pb-1">
            {photos.map((p, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={i}
                src={p.url}
                alt={p.alt ?? `${h.name} 사진 ${i + 1}`}
                className="h-40 w-56 shrink-0 rounded-xl object-cover"
              />
            ))}
          </div>
        )}

        {/* 정보 */}
        <div className="mt-4 flex flex-col gap-5 border-t border-line px-4 py-5">
          {/* 주소 + 지하철 */}
          <Row icon={<PinIcon />}>
            <p className="text-[15px] text-neutral">{addr}</p>
            {st && (
              <p className="mt-1 flex flex-wrap items-center gap-1.5 text-sm">
                {st.line && <LineBadge line={st.line} />}
                <span className="font-bold text-neutral">{st.name}</span>
                <span className="text-muted">
                  {st.exit && `${st.exit}번 출구 `}도보 약 {stWalk}분 ({st.distanceM}m)
                </span>
              </p>
            )}
          </Row>

          {/* 진료시간 */}
          {h.hours && h.hours.length > 0 && (
            <Row icon={<ClockIcon />}>
              <p className="mb-2 text-sm font-bold text-neutral">진료시간</p>
              <OpeningHoursTable hours={h.hours} holidayClosed={h.holidayClosed} />
            </Row>
          )}

          {/* 링크 */}
          {(h.links?.homepage || h.links?.naverBooking || h.links?.kakaoChannel) && (
            <Row icon={<GlobeIcon />}>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
                {h.links?.homepage && (
                  <a href={h.links.homepage} target="_blank" rel="noreferrer" className="break-all text-brand hover:underline">
                    홈페이지
                  </a>
                )}
                {h.links?.naverBooking && (
                  <a href={h.links.naverBooking} target="_blank" rel="noreferrer" className="text-brand hover:underline">
                    예약
                  </a>
                )}
                {h.links?.kakaoChannel && (
                  <a href={h.links.kakaoChannel} target="_blank" rel="noreferrer" className="text-brand hover:underline">
                    카카오채널
                  </a>
                )}
              </div>
            </Row>
          )}

          {/* 진료과목 */}
          {h.departments && h.departments.length > 0 && (
            <Row icon={<DeptIcon />}>
              <p className="mb-2 text-sm font-bold text-neutral">진료과목</p>
              <div className="flex flex-wrap gap-1.5">
                {h.departments.map((d) => (
                  <span key={d} className="rounded-full bg-neutral-weak px-2.5 py-1 text-[13px] text-neutral">
                    {d}
                  </span>
                ))}
              </div>
            </Row>
          )}

          {/* 소개 */}
          {h.description && (
            <Row icon={<DocIcon />}>
              <p className="whitespace-pre-line text-[14px] leading-relaxed text-neutral">
                {h.description}
              </p>
            </Row>
          )}

          {loading && (
            <p className="py-2 text-center text-sm text-muted">정보를 불러오는 중…</p>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <span className="mt-0.5 shrink-0 text-subtle">{icon}</span>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

function ActionChip({
  href,
  label,
  icon,
  external,
  tone = "neutral",
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
  external?: boolean;
  tone?: "solid" | "neutral";
}) {
  const cls =
    tone === "solid"
      ? "bg-[#1E5BD6] text-white hover:bg-[#1a4fbb]"
      : "border border-line text-neutral hover:bg-neutral-weak";
  return (
    <a
      href={href}
      {...(external ? { target: "_blank", rel: "noreferrer" } : {})}
      className={`flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-[13px] font-bold transition-colors ${cls}`}
    >
      {icon}
      {label}
    </a>
  );
}

function LineBadge({ line }: { line: string }) {
  const color = lineColor(line);
  return (
    <span
      className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-bold text-white"
      style={{ backgroundColor: color }}
    >
      {line}
    </span>
  );
}

const ic = {
  width: 18,
  height: 18,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

function PhoneIcon() {
  return (
    <svg {...ic} width={15} height={15}>
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92Z" />
    </svg>
  );
}
function RouteIcon() {
  return (
    <svg {...ic} width={15} height={15}>
      <circle cx="6" cy="19" r="2" />
      <circle cx="18" cy="5" r="2" />
      <path d="M8 19h7a4 4 0 0 0 0-8H9a4 4 0 0 1 0-8h7" />
    </svg>
  );
}
function CalIcon() {
  return (
    <svg {...ic} width={15} height={15}>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  );
}
function GlobeIcon() {
  return (
    <svg {...ic}>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3a15 15 0 0 1 0 18 15 15 0 0 1 0-18Z" />
    </svg>
  );
}
function PinIcon() {
  return (
    <svg {...ic}>
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}
function ClockIcon() {
  return (
    <svg {...ic}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}
function DeptIcon() {
  return (
    <svg {...ic}>
      <path d="M12 4v16M4 12h16" />
    </svg>
  );
}
function DocIcon() {
  return (
    <svg {...ic}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6M8 13h8M8 17h6" />
    </svg>
  );
}

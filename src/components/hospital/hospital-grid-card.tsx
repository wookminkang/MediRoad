import Link from "next/link";

import { Badge } from "@seed-design/react";

import { isPartnerHospital } from "@/constants/partners";
import type { Hospital } from "@/types/hospital";

/** 검색결과 그리드 카드 — 썸네일 없는 정보형 카드(아이콘 타일 + 핵심 정보). */
export function HospitalGridCard({ hospital: h }: { hospital: Hospital }) {
  const st = h.nearestStation;
  const walk = st ? Math.max(1, Math.round(st.distanceM / 67)) : 0;

  return (
    <Link
      href={`/hospitals/${h.slug}`}
      className="group flex h-full flex-col rounded-2xl p-4 transition-colors hover:bg-neutral-weak"
    >
      <div className="flex items-start justify-between gap-2">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-weak text-brand">
          <BuildingIcon />
        </span>
        <div className="flex flex-wrap justify-end gap-1">
          {isPartnerHospital(h.id) && (
            <Badge variant="solid" tone="brand">
              제휴
            </Badge>
          )}
          {h.isOpenNow != null && (
            <Badge variant="weak" tone={h.isOpenNow ? "positive" : "neutral"}>
              {h.isOpenNow ? "영업중" : "영업종료"}
            </Badge>
          )}
        </div>
      </div>

      <h3 className="mt-3 line-clamp-2 text-[15px] font-bold text-neutral">
        {h.name}
      </h3>
      <p className="mt-1 line-clamp-1 text-[13px] text-muted">
        {h.type}
        {h.departments.length > 0 && ` · ${h.departments.slice(0, 3).join("·")}`}
      </p>
      <p className="mt-0.5 line-clamp-1 text-xs text-subtle">
        {h.region.sigungu}
        {st && ` · ${st.name} 도보 ${walk}분`}
      </p>
      <p className="mt-2 line-clamp-1 text-xs text-subtle">
        {h.roadAddress ?? h.address}
      </p>

      <span className="mt-auto inline-flex items-center gap-1 pt-3 text-[13px] font-bold text-brand">
        상세 보기
        <svg
          className="transition-transform group-hover:translate-x-0.5"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="m9 18 6-6-6-6" />
        </svg>
      </span>
    </Link>
  );
}

function BuildingIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M3 21h18M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16" />
      <path d="M9 7h2M13 7h2M9 11h2M13 11h2M9 15h2M13 15h2" />
    </svg>
  );
}

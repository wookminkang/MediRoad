import Link from "next/link";

import { Badge } from "@seed-design/react";

import { isPartnerHospital } from "@/constants/partners";
import { walkMinutes } from "@/lib/hospital";
import {
  latestWeekdayCloseClock,
  numToClock,
  sundayLabelClock,
} from "@/lib/open-hours";
import type { Hospital } from "@/types/hospital";

/**
 * 검색결과 카드 — 썸네일이 없는 정보형이라 모바일은 1열 가로 로우, sm 이상은 그리드 카드.
 *
 * 2열 그리드는 썸네일이 있을 때(당근 상품 카드) 유효하다. 병원은 사용자가 스캔하는 정보가
 * 이미지가 아니라 주소·지하철·진료과 텍스트인데, 좁은 2열에서는 그게 전부 잘린다.
 * 그래서 모바일은 전폭 로우로 두고 주소를 온전히 보여준다.
 */
export function HospitalGridCard({
  hospital: h,
  openLate,
}: {
  hospital: Hospital;
  /** 야간·일요일 목록에서 해당 진료시간을 뱃지로 강조 */
  openLate?: "night" | "sunday";
}) {
  const st = h.nearestStation;
  const walk = st ? walkMinutes(st.distanceM) : 0;

  // 야간·일요일 목록이면 그 시간을 뱃지로 보여준다 — 사용자가 이 페이지에서 궁금한 값
  let hoursBadge: string | null = null;
  if (openLate === "night") {
    const c = latestWeekdayCloseClock(h.hours ?? []);
    // 자정(2400)·자정 넘김은 "24:00까지"보다 "밤 12시 이후"가 자연스럽다
    if (c != null) {
      hoursBadge = c >= 2400 ? "평일 밤 12시 이후" : `평일 ${numToClock(c)}까지`;
    }
  } else if (openLate === "sunday") {
    const s = sundayLabelClock(h.hours ?? []);
    if (s) hoursBadge = `일 ${s}`;
  }

  const badges = (
    <div className="flex shrink-0 flex-wrap justify-end gap-1">
      {isPartnerHospital(h.id) && (
        <Badge variant="solid" tone="brand">
          제휴
        </Badge>
      )}
      {hoursBadge ? (
        <Badge variant="weak" tone="brand">
          {hoursBadge}
        </Badge>
      ) : (
        h.isOpenNow != null && (
          <Badge variant="weak" tone={h.isOpenNow ? "positive" : "neutral"}>
            {h.isOpenNow ? "영업중" : "영업종료"}
          </Badge>
        )
      )}
    </div>
  );

  return (
    <Link
      href={`/hospitals/${h.slug}`}
      className="group flex h-full gap-3 rounded-2xl px-2 py-2.5 transition-colors hover:bg-neutral-weak sm:flex-col sm:gap-0 sm:p-4"
    >
      {/* 아이콘 (sm 이상에선 배지와 같은 줄) */}
      <div className="flex shrink-0 items-start justify-between sm:w-full">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-weak text-brand">
          <BuildingIcon />
        </span>
        <div className="hidden sm:block">{badges}</div>
      </div>

      <div className="min-w-0 flex-1 sm:mt-2.5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-2 text-[15px] font-bold text-neutral">
            {h.name}
          </h3>
          {/* 모바일은 이름 옆에 배지 */}
          <div className="sm:hidden">{badges}</div>
        </div>

        <p className="mt-0.5 line-clamp-1 text-[13px] text-muted sm:mt-1">
          {h.type}
          {h.departments.length > 0 && ` · ${h.departments.slice(0, 3).join("·")}`}
        </p>

        {/*
         * 모바일은 전폭이라 지역·역·주소를 한 줄에 합친다(행 높이 ↓ → 화면당 병원 수 ↑).
         * 좁은 그리드 카드(sm~)에서는 한 줄에 다 넣으면 잘리므로 두 줄로 나눈다.
         */}
        <p className="mt-0.5 line-clamp-1 text-xs text-subtle sm:hidden">
          {[
            h.region.sigungu,
            st ? `${st.name} 도보 ${walk}분` : null,
            h.roadAddress ?? h.address,
          ]
            .filter(Boolean)
            .join(" · ")}
        </p>

        <p className="mt-0.5 hidden line-clamp-1 text-xs text-subtle sm:block">
          {h.region.sigungu}
          {st && ` · ${st.name} 도보 ${walk}분`}
        </p>
        <p className="mt-1 hidden line-clamp-1 text-xs text-subtle sm:block">
          {h.roadAddress ?? h.address}
        </p>
      </div>
    </Link>
  );
}

function BuildingIcon() {
  return (
    <svg
      width="20"
      height="20"
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

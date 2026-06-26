import Link from "next/link";

import { Badge, Text } from "@seed-design/react";

import { isPartnerHospital } from "@/constants/partners";

import { PhotoFrame } from "@/components/ui/photo-frame";
import type { Hospital } from "@/types/hospital";
import { formatDistance } from "@/utils/format";

type Props = {
  hospital: Hospital;
  /** 기준점 대비 거리(m). 있으면 메타에 표시 */
  distanceM?: number;
};

/**
 * 병원 카드 — 홈·검색·랜딩 공통 재사용. (WIREFRAME 4-1/4-2/4-4)
 * Server Component. 색·radius는 Seed 토큰, 레이아웃은 Tailwind(4px 그리드). (DESIGN_SYSTEM)
 */
export function HospitalCard({ hospital, distanceM }: Props) {
  const { slug, name, type, departments, region, isOpenNow } = hospital;
  const photo =
    hospital.photos?.find((p) => p.isPrimary) ?? hospital.photos?.[0];

  return (
    <Link
      href={`/hospitals/${slug}`}
      className="flex w-full gap-3 p-4 transition-colors"
      style={{
        backgroundColor: "var(--seed-color-bg-neutral-weak)",
        borderRadius: "var(--seed-radius-r4)",
      }}
    >
      {/* 썸네일 — 로고/사진 없으면 플레이스홀더 */}
      <PhotoFrame
        src={photo?.url}
        alt={photo?.alt ?? name}
        ratio={1}
        borderRadius="r3"
        className="w-20 shrink-0"
      />

      <div className="flex min-w-0 flex-col gap-1">
        <div className="flex min-w-0 items-center gap-2">
          <Text as="h3" textStyle="t5Bold" className="truncate">
            {name}
          </Text>
          {isPartnerHospital(hospital.id) && (
            <Badge variant="solid" tone="brand">
              제휴
            </Badge>
          )}
          {isOpenNow != null && (
            <Badge variant="weak" tone={isOpenNow ? "positive" : "neutral"}>
              {isOpenNow ? "영업중" : "영업종료"}
            </Badge>
          )}
        </div>

        <Text as="span" textStyle="t4Regular" className="text-muted">
          {region.sigungu} · {type}
          {departments.length > 0 && ` · ${departments.join(", ")}`}
          {distanceM != null && ` · ${formatDistance(distanceM)}`}
        </Text>
      </div>
    </Link>
  );
}

import Link from "next/link";

import { Badge, Text } from "@seed-design/react";

import { isPartnerHospital } from "@/constants/partners";
import { PhotoFrame } from "@/components/ui/photo-frame";
import type { Hospital } from "@/types/hospital";

/** 검색결과 그리드 카드 — 이미지 상단형 (당근 검색결과 레이아웃). */
export function HospitalGridCard({ hospital: h }: { hospital: Hospital }) {
  const photo = h.photos?.find((p) => p.isPrimary) ?? h.photos?.[0];

  return (
    <Link href={`/hospitals/${h.slug}`} className="flex w-full flex-col gap-2">
      <PhotoFrame
        src={photo?.url}
        alt={photo?.alt ?? h.name}
        ratio={4 / 3}
        borderRadius="r4"
      />

      <div className="flex flex-col gap-1">
        <div className="flex flex-wrap gap-1">
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

        <Text as="h3" textStyle="t5Bold" className="line-clamp-2">
          {h.name}
        </Text>

        <Text as="span" textStyle="t4Regular" className="text-muted">
          {h.type}
          {h.departments.length > 0 && ` · ${h.departments.join("·")}`}
        </Text>

        <Text as="span" textStyle="t3Regular" className="text-subtle">
          {h.region.sigungu}
          {h.nearestStation &&
            ` · ${h.nearestStation.name} ${h.nearestStation.distanceM}m`}
        </Text>
      </div>
    </Link>
  );
}

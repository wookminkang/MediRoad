"use client";

import { ActionButton, Badge } from "@seed-design/react";

/** Seed Design 동작 확인용 스모크 컴포넌트 (검증 후 제거 가능) */
export function SeedSmoke() {
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: 12,
        alignItems: "center",
        padding: 24,
      }}
    >
      <ActionButton variant="brandSolid" size="medium">
        Seed 버튼
      </ActionButton>
      <ActionButton variant="neutralWeak" size="medium">
        보조
      </ActionButton>
      <ActionButton variant="criticalSolid" size="medium">
        삭제
      </ActionButton>
      <Badge variant="solid" tone="brand">
        브랜드
      </Badge>
      <Badge variant="weak" tone="positive">
        영업중
      </Badge>
    </div>
  );
}

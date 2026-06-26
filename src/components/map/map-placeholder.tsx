import { Text } from "@seed-design/react";

/**
 * 지도 자리 — 네이버지도 실연동 전 플레이스홀더. (WIREFRAME 4-2/4-3, 지도는 추후 client)
 */
export function MapPlaceholder({
  className = "min-h-[28rem]",
}: {
  className?: string;
}) {
  return (
    <div
      className={`flex w-full items-center justify-center ${className}`}
      style={{
        backgroundColor: "var(--seed-color-bg-layer-fill)",
        borderRadius: "var(--seed-radius-r4)",
      }}
    >
      <Text textStyle="t4Regular" className="text-muted">
        지도 준비 중
      </Text>
    </div>
  );
}

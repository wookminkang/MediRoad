import type { ReactNode } from "react";

import { Text } from "@seed-design/react";

type Props = {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
};

/** 빈 상태 (결과 없음·소프트404 방지 안내) — 목록·검색 공통 */
export function EmptyState({ icon, title, description, action }: Props) {
  return (
    <div
      className="flex w-full flex-col items-center justify-center gap-2 py-16 text-center"
      style={{ minHeight: "40vh" }}
    >
      {icon && (
        <div className="text-4xl" aria-hidden>
          {icon}
        </div>
      )}
      <Text as="p" textStyle="t6Bold">
        {title}
      </Text>
      {description && (
        <Text as="p" textStyle="t4Regular" className="text-muted">
          {description}
        </Text>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

import Link from "next/link";

import { ActionButton } from "@seed-design/react";

import { EmptyState } from "@/components/ui/empty-state";
import { PageContainer } from "@/components/ui/page-container";

/** 없는 병원 — soft-404 방지(메타 noindex는 page generateMetadata가 처리). (WIREFRAME 4-5) */
export default function NotFound() {
  return (
    <PageContainer>
      <EmptyState
        title="병원을 찾을 수 없어요"
        description="삭제되었거나 주소가 잘못되었을 수 있어요."
        action={
          <div className="flex gap-2">
            <ActionButton asChild variant="brandSolid" size="medium">
              <Link href="/hospitals">병원 검색</Link>
            </ActionButton>
            <ActionButton asChild variant="neutralWeak" size="medium">
              <Link href="/">홈으로</Link>
            </ActionButton>
          </div>
        }
      />
    </PageContainer>
  );
}

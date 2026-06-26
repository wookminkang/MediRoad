import Link from "next/link";

import { Badge } from "@seed-design/react";

import { PhotoFrame } from "@/components/ui/photo-frame";
import { categoryLabel } from "@/constants/column";
import type { Column } from "@/types/column";
import { formatDate } from "@/utils/format";

/** 칼럼 카드 — 목록 재사용. 썸네일은 PhotoFrame(없으면 플레이스홀더). (WIREFRAME 4-6) */
export function ColumnCard({ column: c }: { column: Column }) {
  return (
    <Link href={`/health/${c.id}`} className="flex w-full flex-col gap-2">
      <PhotoFrame src={c.thumbnail} alt={c.title} ratio={1} borderRadius="r4" />

      <div>
        <Badge variant="weak" tone="brand">
          {categoryLabel(c.category)}
        </Badge>
      </div>

      <h3 className="text-base font-bold text-neutral">{c.title}</h3>

      <p className="line-clamp-2 text-sm text-muted">{c.excerpt}</p>

      <p className="flex items-center gap-1.5 text-xs text-subtle">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/m_logo.svg" alt="" width={14} height={14} />
        <span>
          {c.author} · {formatDate(c.publishedAt)}
        </span>
      </p>
    </Link>
  );
}

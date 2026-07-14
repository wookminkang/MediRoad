"use client";

import { MEDICAL_DEPARTMENTS } from "@/constants/hospital";
import { SIDO_LIST } from "@/constants/region";

/**
 * 바텀시트 안의 필터 폼 — "임시 담기 후 한 번에 적용" 방식.
 *
 * 데스크톱 사이드바(FilterSidebar)는 각 항목이 <Link>라 누르는 즉시 이동한다.
 * 그대로 시트에 넣으면 항목을 고르는 순간 결과가 바뀌고 시트가 닫힌다. 사용자는
 * 여러 조건을 골라놓고 "결과 보기"를 눌러 한 번에 적용하길 원한다.
 *
 * 그래서 시트에서는 링크 대신 로컬 상태(draft)에 담는다. URL은 부모가 "결과 보기"를
 * 누를 때만 바꾼다. 이 컴포넌트는 draft와 그 변경 함수를 통째로 부모에게서 받는다
 * (상태를 부모가 들고 있어야 "결과 보기" 버튼도 같은 값을 커밋할 수 있다).
 */

export type FilterDraft = {
  openNow: boolean;
  radius?: string;
  sido?: string;
  department?: string;
};

const RADIUS_OPTIONS = ["1", "3", "5", "10"] as const;

export function FilterSheetForm({
  draft,
  onChange,
  hasLocation,
}: {
  draft: FilterDraft;
  onChange: (next: FilterDraft) => void;
  /** 내 위치/기준 좌표가 있을 때만 반경 필터가 의미 있다 */
  hasLocation: boolean;
}) {
  const set = (patch: Partial<FilterDraft>) => onChange({ ...draft, ...patch });

  return (
    <div className="flex flex-col gap-5">
      {/* 영업중만 보기 */}
      <button
        type="button"
        onClick={() => set({ openNow: !draft.openNow })}
        className="flex items-center gap-2.5 text-left"
      >
        <Check checked={draft.openNow} />
        <span className="text-[15px] text-neutral">영업중만 보기</span>
      </button>

      {hasLocation && (
        <Section title="반경">
          <Choice
            label="전체"
            active={!draft.radius}
            onClick={() => set({ radius: undefined })}
          />
          {RADIUS_OPTIONS.map((r) => (
            <Choice
              key={r}
              label={`${r}km`}
              active={draft.radius === r}
              onClick={() => set({ radius: r })}
            />
          ))}
        </Section>
      )}

      <Section title="지역">
        <Choice
          label="전체"
          active={!draft.sido}
          onClick={() => set({ sido: undefined })}
        />
        {SIDO_LIST.map((s) => (
          <Choice
            key={s}
            label={s}
            active={draft.sido === s}
            onClick={() => set({ sido: s })}
          />
        ))}
      </Section>

      <Section title="진료과목">
        <Choice
          label="전체"
          active={!draft.department}
          onClick={() => set({ department: undefined })}
        />
        {MEDICAL_DEPARTMENTS.map((d) => (
          <Choice
            key={d}
            label={d}
            active={draft.department === d}
            onClick={() => set({ department: d })}
          />
        ))}
      </Section>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2.5">
      <span className="text-[13px] font-bold text-subtle">{title}</span>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

/** 칩 형태 선택 — 즉시 이동하지 않고 로컬 상태만 바꾼다 */
function Choice({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-full px-3.5 py-2 text-sm font-medium transition-colors ${
        active
          ? "bg-brand text-white"
          : "bg-[#F3F5FB] text-neutral hover:bg-[#E9EDF7]"
      }`}
    >
      {label}
    </button>
  );
}

function Check({ checked }: { checked: boolean }) {
  return (
    <span
      aria-hidden
      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 ${
        checked ? "border-brand bg-brand text-white" : "border-black/20"
      }`}
    >
      {checked && (
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M20 6 9 17l-5-5" />
        </svg>
      )}
    </span>
  );
}

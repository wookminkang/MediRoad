/**
 * FAQ 아코디언 — <details>/<summary> 기반이라 JS 없이 동작하고,
 * 접힌 답변도 DOM에 그대로 남아 크롤러·FAQPage JSON-LD와 어긋나지 않는다.
 *
 * 톤: 보더 없는 소프트 필(fill) 행 + 메디컬 블루 액센트. 열리면 브랜드 틴트로 전환.
 */
export function FaqAccordion({ faqs }: { faqs: { q: string; a: string }[] }) {
  return (
    <ul className="flex flex-col gap-2">
      {faqs.map((f) => (
        <li key={f.q}>
          <details className="group rounded-2xl bg-[#F4F6FB] transition-colors open:bg-brand-weak hover:bg-[#EDF1F9] open:hover:bg-brand-weak">
            <summary className="flex cursor-pointer list-none items-start gap-3 px-4 py-3.5 [&::-webkit-details-marker]:hidden">
              <span
                aria-hidden
                className="mt-px flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-white text-[13px] font-extrabold text-brand shadow-[0_1px_3px_rgba(30,91,214,0.12)] transition-colors group-open:bg-brand group-open:text-white"
              >
                Q
              </span>
              <h3 className="flex-1 text-[15px] font-bold leading-relaxed text-neutral transition-colors group-open:text-brand">
                {f.q}
              </h3>
              <span
                aria-hidden
                className="mt-1 shrink-0 text-subtle transition-transform duration-200 group-open:rotate-180 group-open:text-brand"
              >
                <ChevronDownIcon />
              </span>
            </summary>
            {/* 좌측 여백 = px-4(16) + Q배지(24) + gap-3(12) → 답변이 질문과 나란히 정렬 */}
            <div className="pb-4 pl-[3.25rem] pr-4">
              <p className="text-[15px] leading-[1.75] text-subtle">{f.a}</p>
            </div>
          </details>
        </li>
      ))}
    </ul>
  );
}

function ChevronDownIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

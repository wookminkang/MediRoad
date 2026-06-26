/** 빈 이미지 자리표시자 — 실제 이미지 준비 전까지 영역을 채움 */
export function ImagePlaceholder({
  className = "",
  rounded = "rounded-2xl",
  label,
}: {
  className?: string;
  rounded?: string;
  label?: string;
}) {
  return (
    <div
      aria-hidden
      className={`flex flex-col items-center justify-center gap-2 bg-neutral-weak text-subtle ${rounded} ${className}`}
    >
      <svg
        width="32"
        height="32"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <path d="m21 15-5-5L5 21" />
      </svg>
      {label && <span className="text-xs">{label}</span>}
    </div>
  );
}

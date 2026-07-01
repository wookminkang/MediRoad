"use client";

import { type ReactNode, useEffect, useState } from "react";

/** 포스트 액션 — AI요약(모달) + 음성·공유·인쇄 (뉴스룸 헤더 스타일, 블루 아웃라인) */
export function PostActions({
  title,
  summary,
  bodyText,
  showSpeak = true,
  showPrint = true,
}: {
  title: string;
  summary: string[];
  bodyText: string;
  showSpeak?: boolean;
  showPrint?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const anyModal = open || shareOpen;

  // 모달: ESC 닫기 + 스크롤 잠금
  useEffect(() => {
    if (!anyModal) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        setShareOpen(false);
      }
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [anyModal]);

  // 언마운트 시 음성 정지
  useEffect(
    () => () => {
      if (typeof window !== "undefined") window.speechSynthesis?.cancel();
    },
    [],
  );

  const toggleSpeak = () => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }
    const u = new SpeechSynthesisUtterance(bodyText.slice(0, 4500));
    u.lang = "ko-KR";
    u.onend = () => setSpeaking(false);
    u.onerror = () => setSpeaking(false);
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
    setSpeaking(true);
  };

  const openShare = () => {
    setShareUrl(window.location.href);
    setCopied(false);
    setShareOpen(true);
  };

  const copyUrl = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const enc = encodeURIComponent;
  const targets = [
    {
      label: "페이스북",
      href: `https://www.facebook.com/sharer/sharer.php?u=${enc(shareUrl)}`,
      icon: <FacebookIcon />,
    },
    {
      label: "X",
      href: `https://twitter.com/intent/tweet?url=${enc(shareUrl)}&text=${enc(title)}`,
      icon: <XLogoIcon />,
    },
    {
      label: "링크드인",
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${enc(shareUrl)}`,
      icon: <LinkedinIcon />,
    },
    {
      label: "메일",
      href: `mailto:?subject=${enc(title)}&body=${enc(shareUrl)}`,
      icon: <MailIcon />,
    },
  ];

  return (
    <div className="flex items-center gap-2">
      {summary.length > 0 && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex items-center gap-1.5 rounded-full border border-[#1E5BD6] px-3.5 py-1.5 text-sm font-semibold text-[#1E5BD6] transition-colors hover:bg-brand-weak"
        >
          <SparkleIcon />
          AI 요약
        </button>
      )}

      {showSpeak && (
        <CircleBtn label={speaking ? "음성 정지" : "음성 듣기"} onClick={toggleSpeak}>
          <SpeakerIcon muted={!speaking} />
        </CircleBtn>
      )}
      <CircleBtn label="공유" onClick={openShare}>
        <ShareIcon />
      </CircleBtn>
      {showPrint && (
        <CircleBtn label="인쇄" onClick={() => window.print()}>
          <PrintIcon />
        </CircleBtn>
      )}

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="AI 요약"
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          <button
            type="button"
            aria-label="닫기"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          />
          <div
            className="relative w-full max-w-2xl rounded-3xl bg-white p-7 ring-2 ring-[#1E5BD6] sm:p-9"
            style={{ boxShadow: "0 0 60px rgba(30,91,214,.4)" }}
          >
            <div className="flex items-start justify-between">
              <h2 className="flex items-center gap-2 text-xl font-bold text-neutral">
                <SparkleIcon />
                AI 요약
              </h2>
              <button
                type="button"
                aria-label="닫기"
                onClick={() => setOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-line text-neutral transition-colors hover:bg-neutral-weak"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
            <p className="mt-6 text-[15px] font-medium leading-relaxed text-neutral">
              {summary.join(" ")}
            </p>
            <hr className="my-6 border-line" />
            <p className="text-sm text-subtle">
              요약문은 AI를 활용한 것으로 일부 내용이 누락되거나 부정확할 수 있습니다. 반드시
              본문과 함께 확인해주세요.
            </p>
          </div>
        </div>
      )}

      {/* 공유하기 모달 */}
      {shareOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="공유하기"
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          <button
            type="button"
            aria-label="닫기"
            onClick={() => setShareOpen(false)}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          />
          <div className="relative w-full max-w-lg rounded-3xl bg-white p-7 shadow-2xl sm:p-9">
            <div className="flex items-start justify-between">
              <h2 className="text-xl font-bold text-neutral">공유하기</h2>
              <button
                type="button"
                aria-label="닫기"
                onClick={() => setShareOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-line text-neutral transition-colors hover:bg-neutral-weak"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mt-8 grid grid-cols-3 gap-y-6">
              {targets.map((t) => (
                <a
                  key={t.label}
                  href={t.href}
                  target="_blank"
                  rel="noreferrer"
                  className="flex flex-col items-center gap-2.5"
                >
                  <span className="flex h-16 w-16 items-center justify-center rounded-full bg-neutral-weak text-neutral transition-colors hover:bg-[#1E5BD6] hover:text-white">
                    {t.icon}
                  </span>
                  <span className="text-sm font-bold text-neutral">{t.label}</span>
                </a>
              ))}
            </div>

            <div className="mt-8 flex items-center gap-2 rounded-full border border-line py-1.5 pl-5 pr-1.5">
              <span className="flex-1 truncate text-sm text-muted">{shareUrl}</span>
              <button
                type="button"
                onClick={copyUrl}
                className="shrink-0 rounded-full border border-[#1E5BD6] px-4 py-2 text-sm font-bold text-[#1E5BD6] transition-colors hover:bg-brand-weak"
              >
                {copied ? "복사됨" : "주소복사"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CircleBtn({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="flex h-9 w-9 items-center justify-center rounded-full border border-[#1E5BD6] text-[#1E5BD6] transition-colors hover:bg-brand-weak"
    >
      {children}
    </button>
  );
}

const ip = {
  width: 17,
  height: 17,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.9,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

function SparkleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2l1.6 4.8L18 8.4l-4.4 1.6L12 15l-1.6-5L6 8.4l4.4-1.6L12 2z" />
      <path d="M19 14l.8 2.2L22 17l-2.2.8L19 20l-.8-2.2L16 17l2.2-.8L19 14z" />
    </svg>
  );
}
function SpeakerIcon({ muted }: { muted: boolean }) {
  return (
    <svg {...ip} aria-hidden>
      <path d="M11 5 6 9H3v6h3l5 4V5z" />
      {muted ? (
        <path d="M22 9l-6 6M16 9l6 6" />
      ) : (
        <path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a9 9 0 0 1 0 14" />
      )}
    </svg>
  );
}
function ShareIcon() {
  return (
    <svg {...ip} aria-hidden>
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4" />
    </svg>
  );
}
function PrintIcon() {
  return (
    <svg {...ip} aria-hidden>
      <path d="M6 9V2h12v7" />
      <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
      <rect x="6" y="14" width="12" height="8" rx="1" />
    </svg>
  );
}

/* 공유 대상 아이콘 (24px, currentColor) */
function FacebookIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M13.5 21v-7h2.4l.4-2.8h-2.8V9.3c0-.8.2-1.4 1.4-1.4h1.5V5.4c-.3 0-1.2-.1-2.2-.1-2.2 0-3.7 1.3-3.7 3.8v2.1H8v2.8h2.5V21h3z" />
    </svg>
  );
}
function XLogoIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M17.5 3h3l-6.6 7.5L21.7 21h-5.9l-4.6-6-5.3 6H3l7-8L2.5 3h6l4.2 5.5L17.5 3zm-1 16h1.6L7.6 4.7H5.9L16.5 19z" />
    </svg>
  );
}
function LinkedinIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M6.94 7.5a1.94 1.94 0 1 1 0-3.88 1.94 1.94 0 0 1 0 3.88zM5.3 20.5h3.28V9.25H5.3V20.5zM10.5 9.25h3.15v1.54h.04c.44-.83 1.5-1.7 3.1-1.7 3.32 0 3.93 2.18 3.93 5.02v6.39h-3.28v-5.67c0-1.35-.02-3.1-1.88-3.1-1.89 0-2.18 1.47-2.18 2.99v5.78H10.5V9.25z" />
    </svg>
  );
}
function MailIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </svg>
  );
}

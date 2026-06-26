"use client";

import { useEffect, useRef, useState } from "react";

import Link from "next/link";

type SymptomResult = {
  relevant: boolean;
  summary: string;
  departments: string[];
  conditions: string[];
  urgency: "보통" | "주의" | "응급";
  redFlags: string[];
};

type Msg =
  | { role: "user"; text: string }
  | { role: "ai"; result: SymptomResult };

const EXAMPLES = [
  "교통사고가 나서 목과 허리가 아파요",
  "머리가 깨질 듯이 아파요",
  "잠이 안 와요",
];

/** AI 증상 도우미 — 라이트 채팅형 UI (각 질문은 독립 단발 호출) */
export function SymptomChecker() {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [messages, setMessages] = useState<Msg[]>([]);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [messages, loading]);

  const ask = async (q: string) => {
    const input = q.trim();
    if (input.length < 2 || loading) return;
    setText("");
    setError("");
    setMessages((m) => [...m, { role: "user", text: input }]);
    setLoading(true);
    try {
      const res = await fetch("/api/symptom", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: input }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "분석에 실패했어요.");
        return;
      }
      setMessages((m) => [...m, { role: "ai", result: json as SymptomResult }]);
    } catch {
      setError("네트워크 오류가 발생했어요.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl text-left">
      {/* 대화 스레드 */}
      {messages.length > 0 && (
        <div className="mb-4 flex flex-col gap-6">
          {messages.map((m, i) =>
            m.role === "user" ? (
              <div
                key={i}
                className="max-w-[85%] self-end"
                style={{ animation: "mediroad-rise 0.35s ease-out both" }}
              >
                <div className="rounded-2xl bg-neutral-weak px-4 py-2.5 text-[15px] text-neutral">
                  {m.text}
                </div>
              </div>
            ) : (
              <div
                key={i}
                className="flex gap-3"
                style={{ animation: "mediroad-rise 0.4s ease-out both" }}
              >
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-weak">
                  <Sparkle className="text-brand" size={15} />
                </span>
                <div className="min-w-0 flex-1">
                  <AiMessage result={m.result} />
                </div>
              </div>
            ),
          )}
          {loading && (
            <div className="flex items-center gap-1.5 pl-10">
              {[0, 0.15, 0.3].map((d) => (
                <span
                  key={d}
                  className="h-2 w-2 animate-bounce rounded-full bg-subtle"
                  style={{ animationDelay: `${d}s` }}
                />
              ))}
            </div>
          )}
          <div ref={endRef} />
        </div>
      )}

      {/* 처음 진입 시 예시 */}
      {messages.length === 0 && (
        <div className="mb-4">
          <p className="mb-2 text-center text-xs text-subtle">이렇게 입력해보세요</p>
          <div className="flex flex-wrap justify-center gap-2">
            {EXAMPLES.map((ex) => (
              <button
                key={ex}
                type="button"
                onClick={() => ask(ex)}
                className="rounded-full bg-brand-weak px-4 py-2 text-sm font-medium text-brand transition-opacity hover:opacity-80"
              >
                {ex}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 입력 */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          ask(text);
        }}
        className="flex items-center gap-2 rounded-full border border-line bg-white py-1.5 pl-5 pr-1.5 shadow-md transition-shadow focus-within:border-[#1E5BD6] focus-within:shadow-[0_0_30px_rgba(30,91,214,0.25)]"
      >
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={200}
          placeholder="증상을 입력해보세요 (예: 목과 허리가 아파요)"
          className="flex-1 bg-transparent text-sm text-neutral placeholder:text-subtle focus:outline-none"
        />
        <button
          type="submit"
          disabled={loading || text.trim().length < 2}
          aria-label="전송"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#1E5BD6] text-white transition-colors hover:bg-[#1a4fbb] disabled:opacity-40"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M12 19V5M5 12l7-7 7 7" />
          </svg>
        </button>
      </form>

      {error && <p className="mt-3 text-center text-sm text-warning">{error}</p>}

      {messages.length > 0 && (
        <p className="mt-3 text-center text-xs text-subtle">
          AI가 제공하는 일반 정보로 진단이 아니며, 정확한 진단·치료는 의료진과 상담하세요.
        </p>
      )}
    </div>
  );
}

/** AI 답변 메시지 (라이트) */
function AiMessage({ result }: { result: SymptomResult }) {
  if (!result.relevant) {
    return (
      <p className="text-[15px] text-muted">
        {result.summary || "건강·증상에 대한 내용을 입력해주세요."}
      </p>
    );
  }
  return (
    <div className="flex flex-col gap-3">
      {result.urgency === "응급" && (
        <div className="rounded-xl bg-[#FBEAEA] p-3.5 text-sm font-bold text-[#C9372C]">
          ⚠ 위험 신호가 의심돼요. 지체 말고 <b>즉시 119 또는 응급실</b>로 가세요.
        </div>
      )}
      {result.urgency === "주의" && (
        <div className="rounded-xl bg-[#FFF4E5] p-3.5 text-sm font-bold text-[#B9670E]">
          증상에 따라 빠른 진료가 필요할 수 있어요.
        </div>
      )}

      <p className="text-[15px] leading-relaxed text-neutral">{result.summary}</p>

      {result.redFlags.length > 0 && (
        <div>
          <p className="text-[15px] text-neutral">
            아래 증상이 있으면 빨리 진료를 받아보는 것이 좋아요.
          </p>
          <ul className="mt-1.5 flex list-disc flex-col gap-1 pl-5 text-[15px] text-muted">
            {result.redFlags.map((f, i) => (
              <li key={i}>{f}</li>
            ))}
          </ul>
        </div>
      )}

      {result.departments.length > 0 && (
        <div>
          <p className="text-[15px] text-neutral">
            <b>{result.departments.join(", ")}</b> 등에서 진료받을 수 있어요.
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {result.departments.map((d) => (
              <Link
                key={d}
                href={`/hospitals?department=${encodeURIComponent(d)}`}
                className="rounded-full border border-[#1E5BD6] px-3.5 py-1.5 text-sm font-medium text-brand transition-colors hover:bg-brand-weak"
              >
                {d} 병원
              </Link>
            ))}
            <Link
              href={`/map?department=${encodeURIComponent(result.departments[0])}&near=1`}
              className="rounded-full bg-[#1E5BD6] px-3.5 py-1.5 text-sm font-medium text-white transition-colors hover:bg-[#1a4fbb]"
            >
              내 주변에서 찾기
            </Link>
          </div>
        </div>
      )}

      {result.conditions.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {result.conditions.map((c) => (
            <Link
              key={c}
              href={`/conditions/${encodeURIComponent(c)}`}
              className="rounded-full border border-line px-3.5 py-1.5 text-sm text-neutral transition-colors hover:bg-neutral-weak"
            >
              {c} 자세히 보기
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function Sparkle({ className = "", size = 16 }: { className?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M12 2l1.6 4.8L18 8.4l-4.4 1.6L12 15l-1.6-5L6 8.4l4.4-1.6L12 2z" />
      <path d="M19 14l.8 2.2L22 17l-2.2.8L19 20l-.8-2.2L16 17l2.2-.8L19 14z" />
    </svg>
  );
}

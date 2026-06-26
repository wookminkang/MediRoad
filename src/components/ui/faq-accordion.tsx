import { Text } from "@seed-design/react";

/**
 * FAQ 목록 — 박스 없이 Q/A 마커로 질문·답변을 표시.
 * FAQPage JSON-LD는 별도 존재 → SEO/GEO 안전.
 */
export function FaqAccordion({ faqs }: { faqs: { q: string; a: string }[] }) {
  return (
    <ul className="flex flex-col gap-6">
      {faqs.map((f) => (
        <li key={f.q}>
          <div className="flex gap-2.5">
            <Text as="span" textStyle="t5Bold" className="w-4 shrink-0 text-brand">
              Q
            </Text>
            <Text as="h3" textStyle="t5Bold">
              {f.q}
            </Text>
          </div>
          <div className="mt-2 flex gap-2.5">
            <Text
              as="span"
              textStyle="t5Bold"
              className="w-4 shrink-0 text-subtle"
              style={{ lineHeight: 1.7 }}
            >
              A
            </Text>
            <Text
              as="p"
              textStyle="t5Regular"
              className="text-subtle"
              style={{ lineHeight: 1.7 }}
            >
              {f.a}
            </Text>
          </div>
        </li>
      ))}
    </ul>
  );
}

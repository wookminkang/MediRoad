import type { ReactNode } from "react";

import ReactMarkdown from "react-markdown";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import remarkGfm from "remark-gfm";

import { makeSlugger } from "@/lib/headings";

/** sanitize 스키마 — 중요문장 하이라이트용 <mark> 허용 */
const sanitizeSchema = {
  ...defaultSchema,
  tagNames: [...(defaultSchema.tagNames ?? []), "mark"],
};

/** React children를 평문으로 평탄화 (헤딩 id 생성용) */
function textOf(node: ReactNode): string {
  if (node == null || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textOf).join("");
  if (typeof node === "object" && "props" in node) {
    return textOf((node as { props: { children?: ReactNode } }).props.children);
  }
  return "";
}

/**
 * 칼럼·포스트 본문 마크다운 렌더 (서버 컴포넌트). GFM 지원 + sanitize(XSS 방지).
 * H2/H3에 앵커 id 부여(TOC·딥링크용 — lib/headings의 슬러거와 동일 규칙).
 * 스타일은 globals.css의 `.markdown` 스코프(Seed 토큰)로 적용.
 * 이미지는 ![alt](url) → <img>로 렌더(SEO: alt 보존).
 */
export function Markdown({ children }: { children: string }) {
  const slug = makeSlugger();
  return (
    <div className="markdown">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[[rehypeSanitize, sanitizeSchema]]}
        components={{
          h2: ({ children }) => <h2 id={slug(textOf(children))}>{children}</h2>,
          h3: ({ children }) => <h3 id={slug(textOf(children))}>{children}</h3>,
          // 표: 좁은 화면에서 넘칠 때 가로 스크롤(레이아웃 깨짐 방지)
          table: ({ children }) => (
            <div className="md-table-wrap">
              <table>{children}</table>
            </div>
          ),
          // 이미지: 가운데 정렬 + alt를 캡션(▲)으로 (뉴스룸 스타일).
          // <p> 안에 들어가도 유효하도록 span 기반(블록 스타일은 CSS).
          img: ({ src, alt }) => (
            <span className="md-figure">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={typeof src === "string" ? src : ""} alt={alt ?? ""} />
              {alt && <span className="md-figcaption">▲ {alt}</span>}
            </span>
          ),
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}

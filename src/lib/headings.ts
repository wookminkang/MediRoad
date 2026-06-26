/** 헤딩 텍스트 → URL 앵커 슬러그 (한글 보존) */
export function slugifyHeading(s: string): string {
  return (
    s
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9가-힣-]/g, "")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "") || "section"
  );
}

/** 문서 순서대로 중복 슬러그에 -1, -2 접미를 붙이는 슬러거 (마크다운 렌더와 TOC가 공유) */
export function makeSlugger(): (text: string) => string {
  const seen = new Map<string, number>();
  return (text: string) => {
    const base = slugifyHeading(text);
    const n = seen.get(base) ?? 0;
    seen.set(base, n + 1);
    return n === 0 ? base : `${base}-${n}`;
  };
}

export type TocItem = { id: string; text: string; level: 2 | 3 };

/** 마크다운 본문에서 H2/H3 추출 (TOC용). 펜스 코드블록 내부는 제외. */
export function extractHeadings(md: string): TocItem[] {
  const slug = makeSlugger();
  const out: TocItem[] = [];
  let inFence = false;
  for (const line of md.split("\n")) {
    if (/^\s*```/.test(line)) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;
    const m = /^(#{2,3})\s+(.+?)\s*$/.exec(line);
    if (!m) continue;
    const level = m[1].length as 2 | 3;
    const text = m[2].replace(/\*\*/g, "").replace(/`/g, "").trim();
    out.push({ level, text, id: slug(text) });
  }
  return out;
}

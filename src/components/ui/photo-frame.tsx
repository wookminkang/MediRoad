import {
  ContentPlaceholderAsset,
  ContentPlaceholderRoot,
  ImageFrame,
} from "@seed-design/react";

type Radius = "r1" | "r2" | "r3" | "r4" | "r5" | "r6" | "full";

type Props = {
  /** 이미지 URL. 없으면 플레이스홀더만 렌더(빈 src로 인한 경고 방지) */
  src?: string;
  alt: string;
  /** 가로/세로 비율 (width/height) */
  ratio: number;
  borderRadius?: Radius;
  className?: string;
};

function Placeholder() {
  return (
    <ContentPlaceholderRoot type="image" className="h-full w-full">
      <ContentPlaceholderAsset />
    </ContentPlaceholderRoot>
  );
}

/**
 * 사진 프레임 — src 있으면 Seed ImageFrame, 없으면 ContentPlaceholder.
 * (ImageFrame에 빈 문자열 src를 넘기면 브라우저 경고 → 분기 처리)
 */
export function PhotoFrame({
  src,
  alt,
  ratio,
  borderRadius = "r4",
  className,
}: Props) {
  if (src) {
    return (
      <ImageFrame
        src={src}
        alt={alt}
        ratio={ratio}
        borderRadius={borderRadius}
        className={className}
        fallback={<Placeholder />}
      />
    );
  }
  return (
    <div
      className={className}
      style={{
        aspectRatio: String(ratio),
        borderRadius: `var(--seed-radius-${borderRadius})`,
        overflow: "hidden",
      }}
    >
      <Placeholder />
    </div>
  );
}

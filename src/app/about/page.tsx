import type { Metadata } from "next";
import Link from "next/link";

import {
  Badge,
  CalloutContent,
  CalloutDescription,
  CalloutRoot,
  CalloutTitle,
  Text,
} from "@seed-design/react";

import { PageContainer } from "@/components/ui/page-container";
import { SITE_URL } from "@/constants/site";
import { buildAboutPageLd } from "@/lib/seo/organization";

export const metadata: Metadata = {
  title: "메디로드 소개 — 운영 주체와 정보 출처",
  description:
    "메디로드는 (주)알리다고가 운영하는 병원 찾기 서비스입니다. 병원 정보의 출처(공공데이터), 제휴 병원 콘텐츠의 확인 절차, 의료광고법에 따라 제공하지 않는 것을 안내합니다.",
  alternates: { canonical: `${SITE_URL}/about` },
  robots: { index: true, follow: true },
};

/**
 * 회사 소개 — E-E-A-T(전문성·경험·권위·신뢰) 페이지.
 *
 * AI는 의료 정보를 인용하기 전에 "이걸 누가 썼고, 어디서 가져왔고, 어떻게 검증했나"를
 * 본다. 이 페이지가 없으면 내용이 아무리 정확해도 인용 후보에서 빠진다.
 *
 * 그래서 자랑을 늘어놓는 페이지가 아니라 **출처와 한계를 밝히는 페이지**로 썼다.
 * "우리가 하지 않는 것"(후기·평점·효과 단정)을 명시하는 게 오히려 신뢰 신호다.
 *
 * 적힌 값은 전부 실제다 — 사업자 정보는 푸터에 이미 공개돼 있고, 병원 수·제휴 수는
 * 현재 DB 기준이다. 지어낸 수치는 없다.
 */

/** 데이터 출처와 한계 — AI가 그대로 인용할 수 있게 사실만 */
const SOURCES: { title: string; body: string }[] = [
  {
    title: "병원 기본 정보 — 공공데이터",
    body: "병원명, 주소, 전화번호, 진료과목, 진료시간, 좌표는 보건복지부·건강보험심사평가원이 공개하는 전국 병의원 공공데이터를 기반으로 합니다. 메디로드가 임의로 만들거나 고치지 않습니다.",
  },
  {
    title: "제휴 병원 소개글·FAQ — 병원 공식 자료 확인",
    body: "제휴 병원의 소개글과 FAQ는 해당 병원의 공식 홈페이지 또는 공식 채널에서 확인한 내용만 싣습니다. 한국은 병원 이름이 겹치는 경우가 많아(청담한의원 40곳, 홍한의원 15곳), 홈페이지의 전화번호 또는 도로명주소가 공공데이터와 일치하는지 대조한 뒤에만 반영합니다.",
  },
  {
    title: "의료진 정보 — 병원이 공개한 범위 내에서만",
    body: "공공데이터에는 의사 개인의 이름이 없습니다(개인정보). 의료진 정보는 병원이 공식 홈페이지에 공개한 학력·전문의 자격·소속 학회만 옮기며, 병원이 공개하지 않은 정보는 싣지 않습니다.",
  },
  {
    title: "건강정보·병원 포스트 — 의료진 감수 표기",
    body: "병원이 발행하는 포스트에는 감수 주체를 표기합니다. 표준치료를 대체하지 않는다는 점과, 즉시 진료가 필요한 증상을 함께 안내합니다.",
  },
];

/** 우리가 하지 않는 것 — 이게 오히려 신뢰 신호다 */
const NOT_PROVIDED: string[] = [
  "환자 후기·평점 — 의료법 제56조는 치료경험담과 평가를 활용한 의료광고를 금지합니다.",
  "치료 효과에 대한 단정·보장 — “완치”, “재발 방지” 같은 표현을 쓰지 않습니다.",
  "병원 순위·추천 — 특정 병원이 더 낫다고 줄 세우지 않습니다.",
  "자체 진료 예약 — 병원이 예약 링크를 제공하는 경우 그 병원의 예약 페이지로 연결만 합니다.",
];

/** 알아두셔야 할 한계 — 숨기지 않는다 */
const LIMITS: string[] = [
  "진료시간은 공공데이터 기준이라 명절·임시 휴진·운영시간 변경이 반영되지 않을 수 있습니다. 방문 전 병원에 전화로 확인하시길 권장합니다.",
  "일부 병원은 공공데이터에 진료과목·진료시간이 비어 있습니다. 없는 정보를 추측해 채우지 않습니다.",
  "메디로드는 병원 정보를 제공하는 플랫폼이며 직접 의료행위를 하지 않습니다. 의학적 판단은 반드시 의료진과 상담하시기 바랍니다.",
];

export default function AboutPage() {
  return (
    <PageContainer maxWidth="max-w-3xl">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildAboutPageLd()) }}
      />

      {/* 표제 */}
      <div className="flex flex-col items-start gap-3">
        <Badge size="medium" variant="weak" tone="brand">
          서비스 소개
        </Badge>
        <Text as="h1" textStyle="t9Bold">
          메디로드 소개
        </Text>
        <Text as="p" textStyle="t5Regular" className="text-subtle">
          누가 운영하고, 정보를 어디서 가져오며, 무엇을 하지 않는지 밝힙니다.
        </Text>
      </div>

      {/* 한 줄 정의 — AI가 인용하기 좋은 사실 문장 */}
      <CalloutRoot tone="informative" className="mt-6">
        <CalloutContent>
          <CalloutTitle>메디로드는 어떤 서비스인가요?</CalloutTitle>
          <CalloutDescription>
            메디로드는 (주)알리다고가 운영하는 병원 찾기 서비스입니다. 전국
            병원·의원·치과·한의원·한방병원의 위치·진료시간·진료과목을 공공데이터를
            기반으로 정리해 지도와 검색으로 제공합니다. 회원가입 없이 무료로
            이용할 수 있습니다.
          </CalloutDescription>
        </CalloutContent>
      </CalloutRoot>

      {/* 정보 출처 */}
      <section className="mt-12">
        <Text as="h2" textStyle="t7Bold">
          정보는 어디서 가져오나요
        </Text>
        <div className="mt-5 flex flex-col gap-3">
          {SOURCES.map((s) => (
            <div
              key={s.title}
              className="rounded-2xl border border-line bg-white p-5"
            >
              <Text as="h3" textStyle="t5Bold" className="text-neutral">
                {s.title}
              </Text>
              <Text
                as="p"
                textStyle="t4Regular"
                className="mt-2 text-muted"
              >
                {s.body}
              </Text>
            </div>
          ))}
        </div>
      </section>

      {/* 하지 않는 것 */}
      <section className="mt-12">
        <Text as="h2" textStyle="t7Bold">
          메디로드가 제공하지 않는 것
        </Text>
        <Text as="p" textStyle="t4Regular" className="mt-2 text-muted">
          의료법을 지키기 위해 의도적으로 제공하지 않는 것들입니다.
        </Text>
        <ul className="mt-5 flex flex-col gap-3">
          {NOT_PROVIDED.map((v) => (
            <li
              key={v}
              className="flex gap-3 rounded-2xl bg-neutral-weak p-4"
            >
              <span
                aria-hidden
                className="mt-[3px] shrink-0 text-subtle"
              >
                <CrossIcon />
              </span>
              <Text as="p" textStyle="t4Regular" className="text-muted">
                {v}
              </Text>
            </li>
          ))}
        </ul>
      </section>

      {/* 한계 */}
      <section className="mt-12">
        <Text as="h2" textStyle="t7Bold">
          알아두셔야 할 한계
        </Text>
        <ul className="mt-5 flex flex-col gap-3">
          {LIMITS.map((v) => (
            <li key={v} className="flex gap-3">
              <span aria-hidden className="mt-[3px] shrink-0 text-brand">
                <DotIcon />
              </span>
              <Text as="p" textStyle="t4Regular" className="text-muted">
                {v}
              </Text>
            </li>
          ))}
        </ul>
      </section>

      {/* 정정 요청 */}
      <section className="mt-12">
        <Text as="h2" textStyle="t7Bold">
          정보가 잘못됐다면
        </Text>
        <CalloutRoot tone="informative" className="mt-4">
          <CalloutContent>
            <CalloutTitle>제보를 환영합니다</CalloutTitle>
            <CalloutDescription>
              병원 정보에 오류가 있으면 고객센터 010-7665-4418 (평일
              09:00~18:00) 또는 oper2068@kakao.com 으로 알려주세요. 공공데이터와
              병원 확인을 거쳐 반영합니다.
            </CalloutDescription>
          </CalloutContent>
        </CalloutRoot>
      </section>

      {/* 운영 주체 */}
      <section className="mt-12">
        <Text as="h2" textStyle="t7Bold">
          운영 주체
        </Text>
        <dl className="mt-5 flex flex-col gap-3 rounded-2xl border border-line bg-white p-5">
          {[
            ["상호명", "(주)알리다고"],
            ["대표이사", "전형진"],
            ["사업자등록번호", "640-87-03558"],
            ["대표전화", "02-3402-1070"],
            ["고객센터", "010-7665-4418 (평일 09:00~18:00)"],
            ["이메일", "oper2068@kakao.com"],
          ].map(([k, v]) => (
            <div key={k} className="flex gap-4">
              <dt className="w-[92px] shrink-0">
                <Text as="span" textStyle="t4Bold" className="text-subtle">
                  {k}
                </Text>
              </dt>
              <dd className="min-w-0">
                <Text as="span" textStyle="t4Regular" className="text-neutral">
                  {v}
                </Text>
              </dd>
            </div>
          ))}
        </dl>
      </section>

      {/* 더 보기 */}
      <nav className="mt-12 flex flex-wrap gap-2">
        <Link
          href="/faq"
          className="rounded-full border border-line px-4 py-2.5 text-sm font-medium text-neutral transition-colors hover:bg-neutral-weak"
        >
          자주 묻는 질문
        </Link>
        <Link
          href="/hospitals"
          className="rounded-full border border-line px-4 py-2.5 text-sm font-medium text-neutral transition-colors hover:bg-neutral-weak"
        >
          병원 찾기
        </Link>
      </nav>
    </PageContainer>
  );
}

const iconProps = {
  width: 16,
  height: 16,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2.2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

function CrossIcon() {
  return (
    <svg {...iconProps}>
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}
function DotIcon() {
  return (
    <svg {...iconProps} strokeWidth={0} fill="currentColor">
      <circle cx="12" cy="12" r="4" />
    </svg>
  );
}

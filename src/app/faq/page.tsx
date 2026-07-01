import type { Metadata } from "next";

import {
  Badge,
  CalloutContent,
  CalloutDescription,
  CalloutRoot,
  CalloutTitle,
  Text,
} from "@seed-design/react";

import { PageContainer } from "@/components/ui/page-container";
import { buildFaqLd } from "@/lib/seo/faq";

import { FaqGroups } from "./faq-groups";

export const metadata: Metadata = {
  title: "자주 묻는 질문",
  description:
    "메디로드 이용 방법, 병원 정보 출처와 정확도, 진료시간·진료과목·예약 관련 자주 묻는 질문을 안내합니다.",
  alternates: { canonical: "https://mediroad.io/faq" },
};

/** FAQ 그룹 — 카테고리별 질문/답변. JSON-LD는 전체를 평탄화해 1개 FAQPage로. */
const FAQ_GROUPS: { category: string; items: { q: string; a: string }[] }[] = [
  {
    category: "메디로드 소개",
    items: [
      {
        q: "메디로드는 어떤 서비스인가요?",
        a: "전국의 병원·의원·치과·한의원·한방병원을 지도에서 찾고, 위치·진료시간·진료과목·연락처를 한눈에 확인할 수 있는 병원 찾기 플랫폼입니다. 기준이 분명한 정보로 가까운 병원을 쉽게 찾도록 돕습니다.",
      },
      {
        q: "이용 요금이 있나요?",
        a: "없습니다. 회원가입 없이 병원 검색, 지도 탐색, 상세 정보 확인을 모두 무료로 이용할 수 있습니다.",
      },
    ],
  },
  {
    category: "병원 정보",
    items: [
      {
        q: "병원 정보는 어디서 가져오나요?",
        a: "보건복지부·건강보험심사평가원 등에서 제공하는 공공데이터(전국 병의원 정보)를 기반으로 합니다. 위치, 진료과목, 진료시간 등 공개된 객관적 정보를 정리해 보여드립니다.",
      },
      {
        q: "진료시간이 실제와 다를 수 있나요?",
        a: "공공데이터에 등록된 시간을 기준으로 표시하기 때문에, 명절·임시 휴진·운영시간 변경 등은 실제와 다를 수 있습니다. 방문 전 병원에 전화로 확인하시길 권장합니다.",
      },
      {
        q: "진료과목 정보는 정확한가요?",
        a: "공공데이터에 신고된 진료과목을 표시합니다. 일부 병원은 데이터가 비어 있을 수 있으며, 순차적으로 보강하고 있습니다.",
      },
      {
        q: "병원 정보가 잘못되어 있어요. 어떻게 수정하나요?",
        a: "문의 채널로 알려주시면 공공데이터 및 병원 확인을 거쳐 반영합니다. 정확한 정보 제공을 위해 제보를 환영합니다.",
      },
    ],
  },
  {
    category: "이용 방법",
    items: [
      {
        q: "내 주변 병원은 어떻게 찾나요?",
        a: "지도에서 보고 싶은 지역으로 이동하거나, ‘내 위치’ 버튼을 눌러 현재 위치 주변의 병원을 확인할 수 있습니다. 위치 권한을 허용하면 더 정확하게 안내됩니다.",
      },
      {
        q: "특정 진료과목만 보고 싶어요.",
        a: "병원 찾기 페이지 상단의 진료과목 카테고리를 선택하거나, 지도 화면의 필터에서 원하는 과목을 골라 결과를 좁힐 수 있습니다.",
      },
      {
        q: "지금 영업 중인 병원만 보고 싶어요.",
        a: "필터의 ‘영업중’ 옵션을 켜면 현재 진료 중인 병원만 표시됩니다. 공공데이터의 진료시간을 기준으로 계산하므로 실제와 차이가 있을 수 있습니다.",
      },
      {
        q: "길찾기는 어떻게 하나요?",
        a: "병원 상세 화면이나 지도 패널에서 ‘길찾기’를 누르면 네이버 지도 길안내로 연결됩니다.",
      },
    ],
  },
  {
    category: "예약 · 후기",
    items: [
      {
        q: "메디로드에서 바로 예약할 수 있나요?",
        a: "병원이 예약 링크를 제공하는 경우, 상세 화면에서 해당 병원의 외부 예약 페이지로 연결해 드립니다. 메디로드 자체 예약 기능은 제공하지 않습니다.",
      },
      {
        q: "병원 후기나 평점은 왜 없나요?",
        a: "의료법(의료광고 관련 규정)을 준수하기 위해 환자 후기·평점은 제공하지 않습니다. 대신 위치·진료시간·진료과목 등 객관적인 정보를 중심으로 안내합니다.",
      },
    ],
  },
];

const ALL_FAQS = FAQ_GROUPS.flatMap((g) => g.items);

export default function FaqPage() {
  return (
    <PageContainer maxWidth="max-w-3xl">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildFaqLd(ALL_FAQS)) }}
      />

      {/* 헤더 */}
      <div className="flex flex-col items-start gap-3">
        <Badge size="medium" variant="weak" tone="brand">
          도움말
        </Badge>
        <Text as="h1" textStyle="t9Bold">
          자주 묻는 질문
        </Text>
        <Text as="p" textStyle="t5Regular" className="text-subtle">
          메디로드 이용에 대해 가장 많이 묻는 질문을 모았습니다.
        </Text>
      </div>

      {/* 안내 Callout */}
      <CalloutRoot tone="informative" className="mt-6">
        <CalloutContent>
          <CalloutTitle>찾는 답이 없으신가요?</CalloutTitle>
          <CalloutDescription>
            고객센터 010-7665-4418 (평일 09:00~18:00) 으로 문의해 주세요.
            병원 정보 오류 제보도 환영합니다.
          </CalloutDescription>
        </CalloutContent>
      </CalloutRoot>

      {/* 카테고리별 아코디언 */}
      <div className="mt-10">
        <FaqGroups groups={FAQ_GROUPS} />
      </div>
    </PageContainer>
  );
}

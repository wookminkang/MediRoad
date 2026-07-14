import type { ReactNode } from "react";

import Link from "next/link";

import { ActionButton, Text } from "@seed-design/react";

/**
 * 전역 푸터 (contentinfo) — 고객센터·소셜 / 링크 컬럼 / 약관 / 회사정보.
 * Server Component.
 */
export function Footer() {
  return (
    <footer className="mt-auto border-t border-line bg-neutral-weak">
      <div className="mx-auto w-full px-4 py-10">
        {/* 고객센터 + 소셜 */}
        <div className="flex flex-col gap-6">
          <div>
            <Text as="p" textStyle="t6Bold">
              고객센터 010-7665-4418
            </Text>
            <div className="mt-1">
              <Text as="p" textStyle="t4Regular" className="text-muted">
                운영시간 : 평일 09:00 ~ 18:00 (점심시간 12:30 ~ 13:30 제외)
              </Text>
            </div>
            <div className="mt-4 flex gap-2">
              <ActionButton asChild variant="brandSolid" size="medium">
                <Link href="/faq">FAQ</Link>
              </ActionButton>
            </div>
          </div>

          <nav aria-label="소셜 채널" className="flex gap-2">
            <SocialIcon href="https://pf.kakao.com/_UxlxbGG" label="카카오톡 채널">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M12 3C6.5 3 2 6.6 2 11c0 2.8 1.9 5.3 4.7 6.7-.2.7-.7 2.6-.8 3-.1.5.2.5.4.4.2-.1 2.6-1.8 3.6-2.5.7.1 1.4.2 2.1.2 5.5 0 10-3.6 10-8S17.5 3 12 3z" />
              </svg>
            </SocialIcon>
            <SocialIcon
              href="https://www.youtube.com/channel/UCIZQCaOSbryp7pGe0aRz9mQ"
              label="유튜브"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M21.6 7.2a2.7 2.7 0 00-1.9-1.9C18 5 12 5 12 5s-6 0-7.7.3A2.7 2.7 0 002.4 7.2 28 28 0 002 12a28 28 0 00.4 4.8 2.7 2.7 0 001.9 1.9C6 19 12 19 12 19s6 0 7.7-.3a2.7 2.7 0 001.9-1.9A28 28 0 0022 12a28 28 0 00-.4-4.8zM10 15V9l5 3-5 3z" />
              </svg>
            </SocialIcon>
            <SocialIcon href="https://blog.naver.com/announce-go" label="블로그">
              <Text as="span" textStyle="t3Regular" className="text-white">
                blog
              </Text>
            </SocialIcon>
          </nav>
        </div>

        <Divider className="mt-8" />

        {/* 링크 컬럼 */}
        <div className="mt-8 grid gap-8 sm:grid-cols-2">
          <FooterCol title="병원·건강정보">
            <FooterLink href="/hospitals">병원 찾기</FooterLink>
            <FooterLink href="/area/강남구">지역별 병원</FooterLink>
            <FooterLink href="/near">지하철역으로 찾기</FooterLink>
            <FooterLink href="/hospitals?department=내과">진료과목별 병원</FooterLink>
            <FooterLink href="/health">건강정보</FooterLink>
            <FooterLink href="/briefing">메디브리핑</FooterLink>
          </FooterCol>

          <FooterCol title="고객지원">
            <FooterLink href="/about">메디로드 소개</FooterLink>
            <FooterLink href="/faq">자주 묻는 질문(FAQ)</FooterLink>
            <FooterLink href="mailto:kangmu238@gmail.com?subject=%5B메디로드%5D%20문의">
              문의하기
            </FooterLink>
          </FooterCol>
        </div>

        <Divider className="mt-8" />

        {/* 회사정보 */}
        <div className="mt-6 flex flex-col gap-1">
          <Text as="p" textStyle="t3Regular" className="text-subtle">
            상호명 : (주)알리다고 · 대표이사 : 전형진 · 사업자등록번호 : 640-87-03558
          </Text>
          <Text as="p" textStyle="t3Regular" className="text-subtle">
            TEL : 02-3402-1070 · MOBILE : 010-8782-1285 · 이메일 : oper2068@kakao.com / oper2068@announcego.com
          </Text>
          <div className="mt-2">
            <Text as="p" textStyle="t3Regular" className="text-subtle">
              메디로드는 병원·의료기관 정보를 제공하는 플랫폼이며 직접 의료행위를 하지 않습니다. 제공되는 정보는 참고용이며, 의학적 판단은 반드시 전문의와 상담하시기 바랍니다.
            </Text>
          </div>
          <Text as="p" textStyle="t3Regular" className="text-subtle">
            © 2026 MediRoad. All rights reserved.
          </Text>
        </div>
      </div>
    </footer>
  );
}

function Divider({ className = "" }: { className?: string }) {
  return (
    <span aria-hidden className={`block h-px w-full bg-line ${className}`} />
  );
}

function SocialIcon({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      target="_blank"
      rel="noopener noreferrer"
      className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-solid text-white"
    >
      {children}
    </Link>
  );
}

function FooterCol({ title, children }: { title: string; children: ReactNode }) {
  return (
    <nav aria-label={title} className="flex flex-col gap-3">
      <Text as="span" textStyle="t4Bold">
        {title}
      </Text>
      <div className="flex flex-col gap-2">{children}</div>
    </nav>
  );
}

function FooterLink({
  href,
  children,
  strong,
}: {
  href: string;
  children: ReactNode;
  strong?: boolean;
}) {
  return (
    <Link href={href}>
      <Text
        as="span"
        textStyle={strong ? "t4Bold" : "t4Regular"}
        className={strong ? "text-neutral" : "text-muted"}
      >
        {children}
      </Text>
    </Link>
  );
}

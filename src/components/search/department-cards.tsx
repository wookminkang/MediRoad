import Link from "next/link";

import {
  ContentPlaceholderAsset,
  ContentPlaceholderRoot,
  ImageFrame,
  Text,
} from "@seed-design/react";

import type { MedicalDepartment } from "@/constants/hospital";

/** 대표 진료과목 (홈 카드) — icon 지정 시 우선, 없으면 /icons/departments/{slug}.png */
const DEPARTMENT_CARDS: {
  dept: MedicalDepartment;
  slug: string;
  icon?: string;
}[] = [
  { dept: "내과", slug: "internal-medicine", icon: "/internal-medicine.svg" },
  { dept: "정형외과", slug: "orthopedics" },
  { dept: "소아청소년과", slug: "pediatrics" },
  { dept: "치과", slug: "dentistry", icon: "/dentistry.svg" },
];

/** 진료과목 바로가기 카드 (4열) — /hospitals?department=… 로 이동 */
export function DepartmentCards() {
  return (
    <ul className="grid grid-cols-4 gap-3">
      {DEPARTMENT_CARDS.map(({ dept, slug, icon }) => (
        <li key={dept}>
          <Link
            href={`/hospitals?department=${encodeURIComponent(dept)}`}
            className="flex flex-col items-center gap-2 p-4"
            style={{
              backgroundColor: "var(--seed-color-bg-neutral-weak)",
              borderRadius: "var(--seed-radius-r4)",
            }}
          >
            <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-xl bg-white">
              <ImageFrame
                src={icon ?? `/icons/departments/${slug}.png`}
                alt={dept}
                ratio={1}
                borderRadius="r3"
                className="w-12"
                fallback={
                  <ContentPlaceholderRoot type="image" className="h-full w-full">
                    <ContentPlaceholderAsset />
                  </ContentPlaceholderRoot>
                }
              />
            </div>
            <Text as="span" textStyle="t4Medium">
              {dept}
            </Text>
          </Link>
        </li>
      ))}
    </ul>
  );
}

import Link from "next/link";

import { ActionChip } from "@seed-design/react";

import type { MedicalDepartment } from "@/constants/hospital";

/** 홈 노출 주요 진료과목 (WIREFRAME 4-1) */
const HOME_DEPARTMENTS: MedicalDepartment[] = [
  "내과",
  "소아청소년과",
  "정형외과",
  "치과",
  "한방",
  "안과",
];

/**
 * 진료과목 칩 — /hospitals?department=… 로 가는 링크. (WIREFRAME 4-1)
 * Server Component. ActionChip을 asChild로 Link 렌더.
 */
export function CategoryChips() {
  return (
    <ul className="flex flex-wrap justify-center gap-2">
      {HOME_DEPARTMENTS.map((dept) => (
        <li key={dept}>
          <ActionChip asChild size="small">
            <Link href={`/hospitals?department=${encodeURIComponent(dept)}`}>
              {dept}
            </Link>
          </ActionChip>
        </li>
      ))}
    </ul>
  );
}

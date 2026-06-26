import type { ReactNode } from "react";

import { Text } from "@seed-design/react";

type Row = { label: ReactNode; value: ReactNode };

/**
 * 정보 테이블 — 라벨(회색 배경, 볼드) | 값 행. (29CM 상품정보 스타일)
 */
export function InfoTable({ rows }: { rows: Row[] }) {
  return (
    <table className="w-full table-fixed border-collapse">
      <tbody>
        {rows.map((r, i) => (
          <tr key={i} className="border-b border-line">
            <th
              scope="row"
              className="w-28 bg-neutral-weak px-4 py-3 text-left align-top md:w-36"
            >
              <Text as="span" textStyle="t4Bold">
                {r.label}
              </Text>
            </th>
            <td className="px-4 py-3 align-top">
              <Text as="span" textStyle="t4Regular">
                {r.value}
              </Text>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

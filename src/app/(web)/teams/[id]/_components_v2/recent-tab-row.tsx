"use client";

/* ============================================================
 * RecentTabRow — recent-tab-v2 의 행 클라이언트 래퍼
 *   (4단계 C 박제 — TeamLink 와 nested anchor 회피)
 *
 * 이유 (왜):
 *  - recent-tab-v2.tsx 는 서버 컴포넌트 (prisma 직접) 라 onClick 사용 불가.
 *  - 행 전체가 `<Link href="/tournaments/{id}">` 인 패턴 유지 + 상대팀명에 TeamLink 적용 시
 *    nested `<a>` 발생 → HTML 위반 + Next.js Link warning.
 *  - 본 클라이언트 행 래퍼로 래핑: `<div role="button" + onClick router.push>` + 상대팀명 TeamLink + stopPropagation.
 *
 * 어떻게:
 *  - 부모 카드 동작(대회 페이지 이동) = router.push 로 보존
 *  - 상대팀 셀(자식)에 TeamLink + onClick stopPropagation = 부모 router.push 회피, 팀페이지만 이동
 *  - 키보드 접근성 보존 — Enter/Space 도 router.push
 * ============================================================ */

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";

type Props = {
  /** 행 전체 클릭 시 이동할 대회 페이지 경로 (없으면 클릭 비활성) */
  href: string;
  /** 행 자식 — 5열 셀 (날짜/상대/스코어/결과/대회) */
  children: ReactNode;
  /** 행 className (board__row data-table__row) */
  className?: string;
  /** 행 inline style (gridTemplateColumns 등) */
  style?: React.CSSProperties;
};

export function RecentTabRow({ href, children, className, style }: Props) {
  const router = useRouter();

  // href 가 "#" (대회 ID 없음) 이면 클릭 비활성 — 키보드/마우스 모두
  const enabled = href !== "#" && href !== "";

  return (
    <div
      role={enabled ? "button" : undefined}
      tabIndex={enabled ? 0 : undefined}
      onClick={enabled ? () => router.push(href) : undefined}
      onKeyDown={
        enabled
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                router.push(href);
              }
            }
          : undefined
      }
      // cursor-pointer 는 enabled 일 때만. text-inherit 으로 색상 보존 (기존 Link 의 inherit 동등)
      className={`${enabled ? "cursor-pointer" : ""} ${className ?? ""}`}
      style={style}
    >
      {children}
    </div>
  );
}

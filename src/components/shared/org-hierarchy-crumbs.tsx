/**
 * OrgHierarchyCrumbs — 단체 위계 표시 공용 컴포넌트
 *
 * 이유(왜):
 *  - 시안(OrganizationDetail.jsx BO2 / OO2 4C-8)은 "단체 → 시리즈 → 회차 → 대회"
 *    위계를 한 줄 칩으로 보여준다. 일반 Breadcrumb(홈>단체>단체명)와 달리
 *    "위계 레벨" 자체를 강조하는 별도 시각 패턴이라 공용 컴포넌트로 분리한다.
 *  - OO2(단체 관리 대시보드)에서도 동일 위계를 재사용할 예정 → 도메인 독립적으로
 *    src/components/shared/ 에 둔다.
 *
 * 방법(어떻게):
 *  - 각 노드는 { label, level, href?, active? } 구조. level 에 따라 아이콘/색상 변경.
 *  - 노드 사이는 chevron_right 구분자. 맨 앞에 account_tree 위계 안내 아이콘.
 *  - href 있으면 Link, 없으면 텍스트 칩. active 노드는 강조.
 *  - 색상은 var(--color-*) 토큰만 사용 (하드코딩 금지 컨벤션).
 */

import Link from "next/link";

// 위계 레벨 — 단체 / 시리즈 / 대회(회차)
export type OrgHierarchyLevel = "org" | "series" | "tournament";

export interface OrgHierarchyNode {
  label: string;
  level: OrgHierarchyLevel;
  href?: string;
  // 현재 보고 있는 노드 (강조)
  active?: boolean;
}

interface OrgHierarchyCrumbsProps {
  trail: OrgHierarchyNode[];
  // 앞쪽 "위계:" 안내 라벨 노출 여부 (기본 true)
  showLabel?: boolean;
  className?: string;
}

// 레벨별 아이콘 (Material Symbols Outlined — lucide 금지 컨벤션)
const LEVEL_ICON: Record<OrgHierarchyLevel, string> = {
  org: "apartment",
  series: "collections_bookmark",
  tournament: "emoji_events",
};

export function OrgHierarchyCrumbs({
  trail,
  showLabel = true,
  className = "",
}: OrgHierarchyCrumbsProps) {
  if (trail.length === 0) return null;

  return (
    <div
      className={`flex flex-wrap items-center gap-1.5 text-[12.5px] ${className}`}
      style={{ color: "var(--color-text-muted)" }}
    >
      {/* 앞쪽 위계 안내 아이콘 + 라벨 */}
      {showLabel && (
        <span className="inline-flex items-center gap-1">
          <span
            className="material-symbols-outlined text-sm"
            style={{ color: "var(--color-info)" }}
          >
            account_tree
          </span>
          위계:
        </span>
      )}

      {trail.map((node, idx) => {
        const isLast = idx === trail.length - 1;
        // 노드 내용 (아이콘 + 라벨). active 거나 마지막이면 강조 색상.
        const emphasized = node.active || isLast;
        const content = (
          <span className="inline-flex items-center gap-1">
            <span
              className="material-symbols-outlined text-sm"
              style={{
                color: emphasized
                  ? "var(--color-text-primary)"
                  : "var(--color-text-muted)",
              }}
            >
              {LEVEL_ICON[node.level]}
            </span>
            {node.label}
          </span>
        );

        return (
          <span key={idx} className="inline-flex items-center gap-1.5">
            {/* 구분자 (첫 노드 앞에는 없음) */}
            {idx > 0 && (
              <span
                className="material-symbols-outlined text-xs"
                style={{ color: "var(--color-text-muted)" }}
              >
                chevron_right
              </span>
            )}

            {/* href 있고 active 아니면 링크, 아니면 텍스트 */}
            {node.href && !node.active ? (
              <Link
                href={node.href}
                className="transition-colors hover:underline"
                style={{ color: "var(--color-text-secondary)" }}
              >
                {content}
              </Link>
            ) : (
              <span
                className={emphasized ? "font-bold" : ""}
                style={{
                  color: emphasized
                    ? "var(--color-text-primary)"
                    : "var(--color-text-muted)",
                }}
              >
                {content}
              </span>
            )}
          </span>
        );
      })}
    </div>
  );
}

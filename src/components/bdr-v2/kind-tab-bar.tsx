"use client";

/* ============================================================
 * KindTabBar — BDR-current Games 상단 종류 탭 (Phase B 박제)
 *
 * 왜 이 컴포넌트가 있는가:
 * BDR-current/screens/Games.jsx 시안의 segmented control 4탭
 * (전체 / 픽업 / 게스트 모집 / 연습경기) + 우측 filter 아이콘 버튼.
 * 이전 구현은 밑줄 탭이었는데, Phase B 박제로 segmented + filter
 * 토글 패턴으로 전환. 시안 CSS 클래스명 (.games-toolbar /
 * .games-segmented / .games-filter-btn) 그대로 사용.
 *
 * 동작:
 * - URL `?type=0|1|2` 로 탭 상태 관리. "all" 은 ?type 삭제.
 * - 활성 탭은 `.is-active` 클래스 (accent 배경 + 흰 텍스트)
 * - filter 토글 버튼은 부모(GamesClient) 의 collapsible 상태를 위탁
 * - activeFilterCount > 0 시 dot 카운트 뱃지 표시 (정사각형 원형 50%)
 *
 * 데이터/API 변경 0 — URL 라우팅만 처리.
 * ============================================================ */

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback } from "react";

// 탭 정의 — value 는 URL ?type 값과 동일. "all" 은 type 쿼리 삭제.
const TABS: Array<{ value: "all" | "0" | "1" | "2"; label: string }> = [
  { value: "all", label: "전체" },
  { value: "0", label: "픽업" },
  { value: "1", label: "게스트" }, // 시안 카피: "게스트 모집" → 시안에서 segmented 좁아 "게스트" 로 축약 (CLAUDE.md 시안 우선)
  { value: "2", label: "연습" }, // 시안 카피: "연습경기" → 시안에서 "연습" 으로 축약
];

export interface KindTabBarCounts {
  "0": number;
  "1": number;
  "2": number;
  all: number;
}

export interface KindTabBarProps {
  counts?: KindTabBarCounts;
  /** filter 토글 버튼 — 부모의 chips 영역 펼침 상태 */
  filterOpen?: boolean;
  /** 활성 필터 개수 — dot 뱃지 표시용 */
  activeFilterCount?: number;
  /** filter 토글 콜백 — 부모(GamesClient) 가 chips 영역 펼침/접힘 관리 */
  onToggleFilter?: () => void;
}

export function KindTabBar({
  counts,
  filterOpen = false,
  activeFilterCount = 0,
  onToggleFilter,
}: KindTabBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  // 현재 활성 탭 — ?type 이 유효값이면 해당, 아니면 "all"
  const rawType = params.get("type");
  const currentType: "all" | "0" | "1" | "2" =
    rawType === "0" || rawType === "1" || rawType === "2" ? rawType : "all";

  // 탭 클릭 → URL ?type 교체 (다른 쿼리는 보존)
  const handleClick = useCallback(
    (value: "all" | "0" | "1" | "2") => {
      const sp = new URLSearchParams(params.toString());
      if (value === "all") sp.delete("type");
      else sp.set("type", value);
      const qs = sp.toString();
      router.push(qs ? `${pathname}?${qs}` : pathname);
    },
    [router, pathname, params],
  );

  // filter 버튼 활성 상태 (스타일 클래스 결정용)
  // - is-open: chips 영역이 펼쳐진 상태
  // - has-active: 활성 필터가 1개 이상 있는 상태
  const filterBtnClasses = [
    "games-filter-btn",
    filterOpen ? "is-open" : "",
    activeFilterCount > 0 ? "has-active" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    // 시안 .games-toolbar — flex 행 (segmented 좌측 flex:1 + filter 버튼 우측 고정)
    <div className="games-toolbar" role="tablist">
      <div className="games-segmented">
        {TABS.map((tab) => {
          const isActive = currentType === tab.value;
          const count =
            counts === undefined
              ? undefined
              : tab.value === "all"
                ? counts.all
                : counts[tab.value as "0" | "1" | "2"];

          return (
            <button
              key={tab.value}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-pressed={isActive}
              onClick={() => handleClick(tab.value)}
              className={
                isActive
                  ? "games-segmented__btn is-active"
                  : "games-segmented__btn"
              }
            >
              <span className="games-segmented__label">{tab.label}</span>
              {count !== undefined && (
                <span className="games-segmented__count">{count}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Filter 토글 버튼 — 부모가 onToggleFilter 를 안 주면 렌더 X */}
      {onToggleFilter && (
        <button
          type="button"
          className={filterBtnClasses}
          onClick={onToggleFilter}
          aria-label="필터"
          aria-expanded={filterOpen}
          title="필터"
        >
          {/* Material Symbols Outlined `tune` — 시안 Icon.filter 대체 */}
          <span className="material-symbols-outlined" aria-hidden="true">
            tune
          </span>
          {activeFilterCount > 0 && (
            <span className="games-filter-btn__dot">{activeFilterCount}</span>
          )}
        </button>
      )}
    </div>
  );
}

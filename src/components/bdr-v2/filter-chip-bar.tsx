"use client";

/* ============================================================
 * FilterChipBar — BDR-current Games 필터 칩 7종 (Phase B 박제)
 *
 * 왜 이 컴포넌트가 있는가:
 * BDR-current/screens/Games.jsx 시안의
 * ['오늘','이번주','주말','서울','경기','무료','초보환영'] 7개 필터 칩.
 * Phase B 박제로 collapsible 영역 안에 들어가는 구조 (시안 동일).
 * 펼침/접힘 상태는 부모(GamesClient) 가 관리. 본 컴포넌트는 칩 자체와
 * "전체 해제" 버튼만 담당. 컨테이너 .games-filter-chips 박스 안에 렌더.
 *
 * DQ2 확정안에 따라 동작을 2종류로 나눠 처리:
 *   A. URL 조작 칩 (서버 재요청): 오늘 / 이번주 / 서울 / 경기
 *   B. 클라이언트 필터 칩 (부모 state): 주말 / 무료 / 초보환영
 *
 * 활성 칩 N개 이상일 때 우측 끝에 "전체 해제" 버튼 표시.
 * 전체 해제는 URL 칩 + 클라 칩 모두 한번에 초기화.
 * ============================================================ */

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback } from "react";

/** 클라이언트 전용 필터 키 — 부모가 상태로 관리 */
export type ClientFilterKey = "weekend" | "free" | "beginner";

export interface FilterChipBarProps {
  /** 부모에서 관리하는 현재 활성 클라 필터 집합 */
  activeClientFilters: Set<ClientFilterKey>;
  /** 클라 필터 토글 콜백 — 부모가 Set 업데이트 */
  onToggleClientFilter: (key: ClientFilterKey) => void;
  /** 전체 클라 필터 초기화 콜백 (전체 해제 버튼용) */
  onClearClientFilters?: () => void;
}

// 칩 타입 식별용 상수.
type ChipDef =
  | {
      kind: "url";
      label: string;
      param: "date" | "city";
      value: string;
    }
  | {
      kind: "client";
      label: string;
      key: ClientFilterKey;
    };

// 시안 원본 순서: 오늘 · 이번주 · 주말 · 서울 · 경기 · 무료 · 초보환영
const CHIPS: ChipDef[] = [
  { kind: "url", label: "오늘", param: "date", value: "today" },
  { kind: "url", label: "이번주", param: "date", value: "week" },
  { kind: "client", label: "주말", key: "weekend" },
  { kind: "url", label: "서울", param: "city", value: "서울" },
  { kind: "url", label: "경기", param: "city", value: "경기" },
  { kind: "client", label: "무료", key: "free" },
  { kind: "client", label: "초보환영", key: "beginner" },
];

// URL 칩 활성 판정 시 검사할 param 키 목록 (전체 해제 시 일괄 삭제 용도)
const URL_PARAMS_TO_CLEAR: Array<"date" | "city"> = ["date", "city"];

export function FilterChipBar({
  activeClientFilters,
  onToggleClientFilter,
  onClearClientFilters,
}: FilterChipBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  // URL 칩 활성 판정 — city 는 부분 매칭 허용 (예: ?city=서울특별시 → "서울" 칩 활성)
  const isUrlChipActive = useCallback(
    (param: "date" | "city", value: string): boolean => {
      const current = params.get(param);
      if (!current) return false;
      if (param === "city") {
        return current.includes(value);
      }
      return current === value;
    },
    [params],
  );

  // URL 칩 클릭 — 활성이면 param 삭제(토글), 아니면 주입
  const handleUrlChipClick = useCallback(
    (param: "date" | "city", value: string) => {
      const sp = new URLSearchParams(params.toString());
      const active = isUrlChipActive(param, value);
      if (active) sp.delete(param);
      else sp.set(param, value);
      const qs = sp.toString();
      router.push(qs ? `${pathname}?${qs}` : pathname);
    },
    [router, pathname, params, isUrlChipActive],
  );

  // 전체 해제 — URL 칩 (date/city 둘 다 삭제) + 클라 칩 한꺼번에 초기화
  // 왜: 시안에서 "전체 해제" 는 펼친 영역 내 모든 활성 칩을 즉시 비우는 동작.
  const handleClearAll = useCallback(() => {
    const sp = new URLSearchParams(params.toString());
    let urlChanged = false;
    for (const p of URL_PARAMS_TO_CLEAR) {
      if (sp.has(p)) {
        sp.delete(p);
        urlChanged = true;
      }
    }
    if (urlChanged) {
      const qs = sp.toString();
      router.push(qs ? `${pathname}?${qs}` : pathname);
    }
    onClearClientFilters?.();
  }, [router, pathname, params, onClearClientFilters]);

  // 활성 필터 개수 — 전체 해제 버튼 표시 여부 결정용
  // (URL 칩은 isUrlChipActive 로 검사, 클라 칩은 Set 크기)
  const activeUrlCount = CHIPS.filter(
    (chip) => chip.kind === "url" && isUrlChipActive(chip.param, chip.value),
  ).length;
  const totalActiveCount = activeUrlCount + activeClientFilters.size;

  return (
    // 시안 .games-filter-chips — collapsible 박스 (펼침 시 부모가 렌더)
    <div className="games-filter-chips">
      {CHIPS.map((chip) => {
        const isActive =
          chip.kind === "url"
            ? isUrlChipActive(chip.param, chip.value)
            : activeClientFilters.has(chip.key);

        const handleClick = () => {
          if (chip.kind === "url") {
            handleUrlChipClick(chip.param, chip.value);
          } else {
            onToggleClientFilter(chip.key);
          }
        };

        return (
          <button
            key={chip.label}
            type="button"
            onClick={handleClick}
            // 시안: 활성 칩은 .btn--primary, 비활성은 .btn.btn--sm
            className={isActive ? "btn btn--sm btn--primary" : "btn btn--sm"}
            aria-pressed={isActive}
          >
            {chip.label}
          </button>
        );
      })}

      {/* 전체 해제 — 활성 필터 1개 이상일 때만 노출 */}
      {totalActiveCount > 0 && (
        <button
          type="button"
          className="btn btn--sm games-filter-clear"
          onClick={handleClearAll}
        >
          전체 해제
        </button>
      )}
    </div>
  );
}

"use client";

/**
 * UA2 시안 — 종별 selector chip row (B2 갭 해소)
 *
 * 시안: Dev/design/BDR-current/screens/TournamentDetail.jsx L132~154
 *
 * 동작:
 *  - divisions.length <= 1 이면 미노출 (시안 L134 동일)
 *  - "전체" 칩 (__all) + 종별 N개
 *  - 선택 상태는 URL 쿼리(?div=xxx) 와 동기화하지 않고 클라이언트 state 만 보유
 *    → 운영 page.tsx 가 SSR 로 종별별 데이터를 이미 모두 내려주므로 (categories/divCaps/divCounts)
 *      클라이언트는 시각 필터만 담당. 향후 별 PR 로 페이지네이션 결합 가능.
 *
 * 부모(page.tsx)는 onChange 콜백으로 active div 를 받아 탭 콘텐츠 props 에 전달 가능 — 본 PR 에서는
 * 시각 칩 노출만 박제 (운영 탭들이 이미 종별 보존된 데이터를 렌더하므로 즉시 영향 없음).
 *
 * 시안 css: tournament-detail.css `.td-divsel` / `.td-divchip` 박제
 */

import { useState } from "react";

interface Props {
  /** 시안 mock `T.divisions` 매핑 — page.tsx 가 categories 에서 추출해서 전달 */
  divisions: string[];

  /** 종별 변경 콜백 — '__all' | 종별명. 부모는 받아도 되고 무시해도 됨 */
  onChange?: (division: string) => void;
}

export function TournamentDivisionChips({ divisions, onChange }: Props) {
  // 시안 L408: 초기 종별 = '__all' (전체)
  const [value, setValue] = useState<string>("__all");

  // 시안 L134: divisions.length <= 1 이면 미노출 — chip 없는 단일 종별 대회
  if (divisions.length <= 1) return null;

  // 칩 선택 핸들러 — 시각 state + 외부 콜백 (있으면) 동시 호출
  const handleSelect = (div: string) => {
    setValue(div);
    onChange?.(div);
  };

  return (
    <div className="td-divsel" role="tablist" aria-label="종별 선택">
      {/* "종별" 라벨 — 모노스페이스 소형 캡션 (시안 L113~117) */}
      <span className="td-divsel__lbl">종별</span>
      <div className="td-divsel__chips">
        {/* 전체 칩 — 항상 첫 번째 */}
        <button
          type="button"
          role="tab"
          aria-selected={value === "__all"}
          className={"td-divchip" + (value === "__all" ? " is-on" : "")}
          onClick={() => handleSelect("__all")}
        >
          전체
        </button>
        {/* 종별 N개 칩 */}
        {divisions.map((d) => (
          <button
            key={d}
            type="button"
            role="tab"
            aria-selected={value === d}
            className={"td-divchip" + (value === d ? " is-on" : "")}
            onClick={() => handleSelect(d)}
          >
            {d}
          </button>
        ))}
      </div>
    </div>
  );
}

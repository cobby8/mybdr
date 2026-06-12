"use client";

/**
 * 대회 종료 — 운영자 컴팩트 바 (B안 §5 / isInsider 한정)
 *
 * 시안 원본: td-completed.jsx OperatorBar L448~456 (tdc-opbar)
 *
 * 왜 신규 분리인가 (TournamentOperatorPreview 재사용 ❌):
 *   시안 tdc-opbar = 가로 컴팩트 바(헤더 + 세그 토글), 운영 TournamentOperatorPreview =
 *   세로 사이드 카드(td-side__preview) → 마크업 다름. 신규 소형 컴포넌트가 회귀 0.
 *
 * 동작:
 *   세그 토글(관리자 / 사용자 미리보기)은 시안 정적 데모 — 운영 실제 화면 전환 로직은
 *   본 PR 범위 밖(시각 박제만). 토글 상태는 로컬 state 로 시각 표시만.
 *
 * 강조색: 활성 세그 = var(--bdr-navy) (시안 동일 의미색) / 바 배경 = cafe-blue 계열 (시안 동일)
 */

import { useState } from "react";

export function TournamentCompletedOperatorBar() {
  const [mode, setMode] = useState<"admin" | "user">("admin");

  return (
    <div className="tdc-opbar">
      <div className="tdc-opbar__l">
        <span className="ico material-symbols-outlined">visibility</span>
        <b>운영자 화면 전환</b>
        <span className="tdc-opbar__d">publish 상태로 사용자 화면을 미리 확인합니다.</span>
      </div>
      <div className="tdc-opbar__seg">
        <button
          type="button"
          className={mode === "admin" ? "on" : ""}
          onClick={() => setMode("admin")}
        >
          관리자
        </button>
        <button
          type="button"
          className={mode === "user" ? "on" : ""}
          onClick={() => setMode("user")}
        >
          사용자 (미리보기)
        </button>
      </div>
    </div>
  );
}

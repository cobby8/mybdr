"use client";

/**
 * 2026-05-12 — 기록 모드 설정 트리거 (버튼 + 플로팅 모달).
 *
 * 변경 (사용자 요청):
 *   - 기존: RecordingModeCard 가 큰 카드로 페이지 차지
 *   - 변경: 작은 버튼 1개 + 클릭 시 플로팅 모달 (RecordingModeCard 그대로 모달 안)
 *
 * server props 그대로 전달 (matchStats / defaultMode).
 */

import { useState } from "react";
import { RecordingModeCard } from "./recording-mode-card";

type Mode = "flutter" | "paper";

interface Props {
  tournamentId: string;
  defaultMode: Mode;
  matchStats: {
    total: number;
    paper: number;
    flutter: number;
    inProgress: number;
  };
}

export function RecordingModeTriggerClient({ tournamentId, defaultMode, matchStats }: Props) {
  const [open, setOpen] = useState(false);

  const modeLabel = defaultMode === "paper" ? "종이 기록지" : "Flutter 기록앱";

  return (
    <>
      {/* 압축 버튼 — 우측 정렬 + accent 톤 */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <p
            className="text-xs font-semibold uppercase"
            style={{ color: "var(--color-text-muted)", letterSpacing: "0.04em" }}
          >
            기록 모드
          </p>
          <p className="text-sm">
            대회 기본: <span className="font-semibold">{modeLabel}</span>{" "}
            <span style={{ color: "var(--color-text-muted)" }}>
              · 총 {matchStats.total}건 (Flutter {matchStats.flutter} / 종이 {matchStats.paper}
              {matchStats.inProgress > 0 && ` / 진행중 ${matchStats.inProgress}`})
            </span>
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="btn btn--sm"
        >
          <span className="material-symbols-outlined text-base align-middle mr-1">tune</span>
          기록 모드 설정
        </button>
      </div>

      {/* 플로팅 모달 */}
      {open && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4"
          style={{ background: "rgba(0,0,0,0.5)" }}
          onClick={() => setOpen(false)}
        >
          <div
            className="relative my-4 w-full max-w-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute right-3 top-3 z-10 rounded-[4px] p-2 text-[var(--color-text-muted)] hover:bg-[var(--color-surface)]"
              aria-label="닫기"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
            {/* RecordingModeCard 그대로 wrap — 기능 100% 보존 */}
            <RecordingModeCard
              tournamentId={tournamentId}
              defaultMode={defaultMode}
              matchStats={matchStats}
            />
          </div>
        </div>
      )}
    </>
  );
}

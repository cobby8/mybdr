/**
 * PbpEditModal — PBP 조회/수정 플로팅 모달 (2026-05-16 / PR-PBP-Edit Phase 2).
 *
 * 왜 (이유):
 *   paper 매치 운영자가 잘못 마킹한 PBP (점수/선수) 를 한꺼번에 수정한 뒤 form 의 "저장"
 *   흐름에서 BFF 재제출. 새 BFF endpoint 0 / runningScore state 단일 source.
 *
 * 데이터 흐름 (planner-architect 결정 plan §1~§5):
 *   1. form 이 runningScore.{home/away} marks 전달 (props.marks).
 *   2. 모달 안에서 임시 state (draftMarks) 로 deep clone (수정/삭제는 임시 state 만 변경).
 *   3. 운영자가 "저장" 클릭 → onApply(draftMarks) 콜백 → form 이 setRunningScore() 호출.
 *   4. "취소" / ESC / backdrop → 변경 0 (임시 state 폐기).
 *   5. 즉시 BFF 호출 X — form 의 자연 흐름 ("쿼터 종료" / "경기 종료") 에서 기존 submit BFF 재사용.
 *
 * 수정 가능 필드 (planner-architect §3):
 *   - 점수 (1↔2↔3 segmented toggle)
 *   - 선수 (양 팀 라인업 선수 dropdown / 같은 팀 안에서만 변경)
 *   - 삭제 (✕ 버튼 + confirm)
 *
 *   ❌ 쿼터 / position 변경 = Phase 2 범위 제외 (cross-check 노이즈 + FIBA 양식 룰 위반 위험).
 *
 * 절대 룰:
 *   - lucide-react ❌ / Material Symbols Outlined 만
 *   - var(--color-*) 토큰만 / 빨강 본문 텍스트 ❌ — destructive 버튼만 `--color-warning` (삭제)
 *   - 터치 영역 44px+
 *   - no-print = 인쇄 시 모달 완전히 제거 (FIBA 양식 정합)
 *   - radius 4px (BDR 디자인 13 룰)
 */

"use client";

import { useEffect, useMemo, useState } from "react";
import type { RunningScoreState, ScoreMark } from "@/lib/score-sheet/running-score-types";
import {
  updateMarkPoints,
  removeMark,
} from "@/lib/score-sheet/running-score-helpers";
import type { RosterItem } from "./team-section-types";

interface PbpEditModalProps {
  open: boolean;
  // 현재 marks state (form 의 runningScore — 모달 닫기 시 변경 0 보장 위해 deep clone)
  marks: RunningScoreState;
  // 양 팀 선수 명단 (선수 변경 dropdown 옵션 + 표시 이름 lookup)
  homeRoster: RosterItem[];
  awayRoster: RosterItem[];
  homeTeamName: string;
  awayTeamName: string;
  // "저장" 클릭 시 호출 — caller 가 setRunningScore({ ...prev, home, away }) 흐름.
  // currentPeriod 는 변경 X (caller 가 prev 의 currentPeriod 유지).
  onApply: (next: { home: ScoreMark[]; away: ScoreMark[] }) => void;
  // "취소" / ESC / backdrop / X 버튼
  onClose: () => void;
}

// 표시용 tagged mark — side 부착 (한 팀씩 분리해 list 표시)
type TaggedMark = {
  index: number; // 같은 team 의 배열 인덱스 (updateMarkPoints / removeMark 호출용)
  side: "home" | "away";
  mark: ScoreMark;
};

export function PbpEditModal({
  open,
  marks,
  homeRoster,
  awayRoster,
  homeTeamName,
  awayTeamName,
  onApply,
  onClose,
}: PbpEditModalProps) {
  // 모달 안 임시 state (deep clone — 외부 marks 변경 0 보장).
  // 모달 open 시점에 props.marks 로 초기화 (모달 닫고 재오픈 시 최신 source 반영).
  const [draft, setDraft] = useState<RunningScoreState>(marks);

  // open 토글 시 draft 동기화 (모달 재오픈 시 외부 marks 변경분 반영)
  useEffect(() => {
    if (open) {
      // 깊은 복사 — array spread + mark spread (ScoreMark 는 primitive 필드만)
      setDraft({
        home: marks.home.map((m) => ({ ...m })),
        away: marks.away.map((m) => ({ ...m })),
        currentPeriod: marks.currentPeriod,
      });
    }
  }, [open, marks]);

  // ESC 키 닫기 (다른 모달과 동일 패턴)
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  // 선수 이름 lookup — playerId → "#10 김선수" (잘 안 찾힘 시 "선수 ID {id}" fallback)
  const playerNameMap = useMemo(() => {
    const map = new Map<string, string>();
    [...homeRoster, ...awayRoster].forEach((p) => {
      const jersey = p.jerseyNumber !== null ? `#${p.jerseyNumber} ` : "";
      map.set(p.tournamentTeamPlayerId, `${jersey}${p.displayName}`);
    });
    return map;
  }, [homeRoster, awayRoster]);

  // 양 팀 marks 합쳐서 period asc → position asc 정렬 (시간순 표시)
  const sortedMarks = useMemo<TaggedMark[]>(() => {
    const merged: TaggedMark[] = [];
    draft.home.forEach((m, i) =>
      merged.push({ index: i, side: "home", mark: m }),
    );
    draft.away.forEach((m, i) =>
      merged.push({ index: i, side: "away", mark: m }),
    );
    // period 1차 → position 2차 (같은 period 안에서 누적 점수 낮은 순)
    merged.sort((a, b) => {
      if (a.mark.period !== b.mark.period) return a.mark.period - b.mark.period;
      return a.mark.position - b.mark.position;
    });
    return merged;
  }, [draft]);

  // 점수 변경 핸들러 — updateMarkPoints (helper) 호출 + position 자동 재정렬
  function handleChangePoints(
    side: "home" | "away",
    index: number,
    newPoints: 1 | 2 | 3,
  ) {
    setDraft((prev) => updateMarkPoints(prev, side, index, newPoints));
  }

  // 선수 변경 핸들러 — playerId 만 교체 (position / period / points 보존)
  function handleChangePlayer(
    side: "home" | "away",
    index: number,
    newPlayerId: string,
  ) {
    setDraft((prev) => {
      const arr = side === "home" ? prev.home : prev.away;
      if (index < 0 || index >= arr.length) return prev;
      const updated = arr.map((m, i) =>
        i === index ? { ...m, playerId: newPlayerId } : m,
      );
      if (side === "home") return { ...prev, home: updated };
      return { ...prev, away: updated };
    });
  }

  // 삭제 핸들러 — confirm 후 removeMark (helper) 호출 + position 자동 재정렬
  function handleDelete(side: "home" | "away", index: number) {
    // 단순 window.confirm — 모달 안 nested 모달 회피 (UX 단순)
    const ok =
      typeof window !== "undefined" &&
      window.confirm(
        "이 마크를 삭제하면 같은 팀의 이후 점수 위치가 자동 재정렬됩니다.\n계속하시겠습니까?",
      );
    if (!ok) return;
    setDraft((prev) => removeMark(prev, side, index));
  }

  // "저장" — onApply 콜백으로 next marks 전달 → form 이 setRunningScore() 박제
  function handleApply() {
    onApply({ home: draft.home, away: draft.away });
    onClose();
  }

  if (!open) return null;

  return (
    // 풀스크린 backdrop. no-print = 인쇄 시 모달 제거 (FIBA 양식 정합).
    <div
      className="no-print fixed inset-0 z-50 flex items-stretch justify-stretch"
      style={{ backgroundColor: "rgba(0,0,0,0.55)" }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="기록 수정"
    >
      <div
        // 모달 본체 — backdrop 전파 차단 + xl size (lineup modal 패턴 정합)
        className="m-auto flex max-h-[92vh] w-[min(720px,94vw)] flex-col rounded-[4px] shadow-2xl"
        style={{
          backgroundColor: "var(--color-background)",
          border: "1px solid var(--color-border)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 — 타이틀 + 닫기 버튼 */}
        <div
          className="flex items-center justify-between rounded-t-[4px] px-4 py-3"
          style={{
            backgroundColor: "var(--color-surface)",
            borderBottom: "1px solid var(--color-border)",
          }}
        >
          <div className="flex flex-col">
            <div className="text-xs uppercase tracking-wider text-[var(--color-text-muted)]">
              PBP EDIT
            </div>
            <div
              className="mt-0.5 text-base font-semibold"
              style={{ color: "var(--color-text-primary)" }}
            >
              기록 수정 — 점수 / 선수 / 삭제
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            // 터치 영역 44px+
            className="inline-flex h-11 min-w-11 items-center justify-center rounded-[4px] px-3 text-sm font-medium"
            style={{
              border: "1px solid var(--color-border)",
              color: "var(--color-text-primary)",
              touchAction: "manipulation",
            }}
            aria-label="닫기 (변경 사항 폐기)"
          >
            <span className="material-symbols-outlined text-base">close</span>
            <span className="ml-1">취소</span>
          </button>
        </div>

        {/* 본문 — 마크 list (period asc / position asc 정렬) */}
        <div className="flex-1 overflow-y-auto p-3">
          {sortedMarks.length === 0 ? (
            <div className="flex h-32 items-center justify-center text-sm text-[var(--color-text-muted)]">
              아직 기록된 득점이 없습니다.
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {sortedMarks.map((tm) => {
                const teamLabel =
                  tm.side === "home" ? homeTeamName : awayTeamName;
                const teamRoster =
                  tm.side === "home" ? homeRoster : awayRoster;
                const periodLabel =
                  tm.mark.period <= 4
                    ? `Q${tm.mark.period}`
                    : `OT${tm.mark.period - 4}`;
                const playerLabel =
                  playerNameMap.get(tm.mark.playerId) ??
                  `선수 ID ${tm.mark.playerId}`;
                // 고유 key — side + index + period (재정렬 안정성)
                const rowKey = `${tm.side}-${tm.index}-${tm.mark.period}-${tm.mark.position}`;

                return (
                  <div
                    key={rowKey}
                    className="flex flex-wrap items-center gap-2 rounded-[4px] px-3 py-2"
                    style={{
                      border: "1px solid var(--color-border)",
                      backgroundColor: "var(--color-surface)",
                    }}
                  >
                    {/* 좌측 — 쿼터 라벨 + 팀 + 누적 점수 위치 */}
                    <div className="flex min-w-[140px] flex-col">
                      <div className="flex items-center gap-1.5">
                        <span
                          className="inline-flex items-center justify-center rounded-[4px] px-1.5 py-0.5 text-[10px] font-bold"
                          style={{
                            backgroundColor: "var(--color-accent)",
                            color: "#fff",
                          }}
                        >
                          {periodLabel}
                        </span>
                        <span
                          className="text-xs"
                          style={{ color: "var(--color-text-muted)" }}
                        >
                          {tm.side === "home" ? "HOME" : "AWAY"} · 누적 {tm.mark.position}점
                        </span>
                      </div>
                      <div
                        className="mt-0.5 text-xs font-medium"
                        style={{ color: "var(--color-text-primary)" }}
                      >
                        {teamLabel}
                      </div>
                    </div>

                    {/* 중앙 — 선수 dropdown (같은 팀 안에서만 변경) */}
                    <div className="flex flex-1 flex-col gap-0.5">
                      <label
                        className="text-[10px] uppercase tracking-wide"
                        style={{ color: "var(--color-text-muted)" }}
                      >
                        선수
                      </label>
                      <select
                        value={tm.mark.playerId}
                        onChange={(e) =>
                          handleChangePlayer(tm.side, tm.index, e.target.value)
                        }
                        // 모르는 선수 (DB 조회 실패) 도 select 에는 currentPlayerId 가 있도록 추가
                        className="min-h-[40px] rounded-[4px] px-2 py-1 text-sm"
                        style={{
                          backgroundColor: "var(--color-background)",
                          color: "var(--color-text-primary)",
                          border: "1px solid var(--color-border)",
                        }}
                        aria-label={`${teamLabel} 선수 변경`}
                      >
                        {/* roster 안 선수 — 양 팀 라인업 선수 */}
                        {teamRoster.map((p) => (
                          <option
                            key={p.tournamentTeamPlayerId}
                            value={p.tournamentTeamPlayerId}
                          >
                            {p.jerseyNumber !== null
                              ? `#${p.jerseyNumber} ${p.displayName}`
                              : p.displayName}
                          </option>
                        ))}
                        {/* fallback — 현재 playerId 가 roster 에 없으면 추가 (자가 노출) */}
                        {!teamRoster.some(
                          (p) => p.tournamentTeamPlayerId === tm.mark.playerId,
                        ) && (
                          <option value={tm.mark.playerId}>
                            {playerLabel} (명단 외)
                          </option>
                        )}
                      </select>
                    </div>

                    {/* 우측 — 점수 1/2/3 segmented + 삭제 버튼 */}
                    <div className="flex flex-col gap-0.5">
                      <label
                        className="text-[10px] uppercase tracking-wide"
                        style={{ color: "var(--color-text-muted)" }}
                      >
                        점수
                      </label>
                      <div className="flex items-center gap-1">
                        {/* 1/2/3 segmented buttons */}
                        {[1, 2, 3].map((p) => {
                          const isActive = tm.mark.points === p;
                          return (
                            <button
                              key={p}
                              type="button"
                              onClick={() =>
                                handleChangePoints(
                                  tm.side,
                                  tm.index,
                                  p as 1 | 2 | 3,
                                )
                              }
                              // 터치 영역 40px (좁은 segment — 본문 룰 충족)
                              className="inline-flex h-10 w-10 items-center justify-center rounded-[4px] text-sm font-bold"
                              style={
                                isActive
                                  ? {
                                      // 활성 = accent fill
                                      backgroundColor: "var(--color-accent)",
                                      color: "#fff",
                                      border: "1px solid var(--color-accent)",
                                    }
                                  : {
                                      backgroundColor:
                                        "var(--color-background)",
                                      color: "var(--color-text-primary)",
                                      border: "1px solid var(--color-border)",
                                    }
                              }
                              aria-label={`${p}점으로 변경`}
                              aria-pressed={isActive}
                            >
                              {p}
                            </button>
                          );
                        })}

                        {/* 삭제 버튼 — warning 토큰 (빨강 본문 텍스트 ❌ 룰 예외 = 위험 액션) */}
                        <button
                          type="button"
                          onClick={() => handleDelete(tm.side, tm.index)}
                          className="ml-1 inline-flex h-10 w-10 items-center justify-center rounded-[4px]"
                          style={{
                            border: "1px solid var(--color-warning)",
                            color: "var(--color-warning)",
                            backgroundColor: "transparent",
                          }}
                          aria-label="이 마크 삭제"
                          title="삭제 (같은 팀의 이후 점수 자동 재정렬)"
                        >
                          <span className="material-symbols-outlined text-base">
                            delete
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 푸터 — 저장 / 취소 버튼 (모바일 column / 데스크탑 row) */}
        <div
          className="rounded-b-[4px] px-4 py-3"
          style={{
            backgroundColor: "var(--color-surface)",
            borderTop: "1px solid var(--color-border)",
          }}
        >
          <p
            className="mb-2 text-[11px]"
            style={{ color: "var(--color-text-muted)" }}
          >
            ※ "저장" 클릭 시 변경 사항이 양식에 반영됩니다. DB 반영은 이후 "쿼터 종료" /
            "경기 종료" 등 자연 흐름에서 자동 박제됩니다. 즉시 BFF 호출 ❌.
          </p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 text-sm font-semibold"
              style={{
                backgroundColor: "var(--color-surface)",
                color: "var(--color-text-primary)",
                border: "1px solid var(--color-border)",
                touchAction: "manipulation",
                borderRadius: "4px",
              }}
              aria-label="취소 (변경 사항 폐기)"
            >
              취소
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="flex-1 py-3 text-sm font-semibold"
              style={{
                backgroundColor: "var(--color-accent)",
                color: "#fff",
                border: "1px solid var(--color-accent)",
                touchAction: "manipulation",
                borderRadius: "4px",
              }}
              aria-label="저장 (변경 사항 양식에 반영)"
            >
              저장
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * LineupSelectionModal — Phase 7-B (2026-05-12).
 *
 * 왜 (이유):
 *   FIBA 양식 = 12 행 자동 fill 운영 사고 (오늘 출전 X 선수 포함) 방지.
 *   기록자가 score-sheet 진입 시점에 (1) 오늘 출전 명단 다중 체크 + (2) 선발 5인 선택.
 *   MatchLineupConfirmed (Flutter 앱 단일 source) 박제 → 향후 팀장 사전 제출 기능과 통합.
 *
 *   사용자 결재 (2026-05-12):
 *   - §2 로스터 선택 = MatchLineupConfirmed 활용 + 팀장 사전 제출 기능 (향후) 와 통합
 *   - §3 데이터 source = MatchLineupConfirmed
 *   - §4 선발 5인 = 행 굵게 + "S" 라벨
 *
 * 동작:
 *   1. 양 팀 (Team A / Team B) 출전 명단 다중 체크 (체크박스)
 *   2. 체크된 명단 중 선발 5인 선택 (선발 라디오/체크)
 *   3. 양 팀 각각 (a) 출전 ≥ 5명 + (b) 선발 = 5명 만족 시 "라인업 확정" 활성
 *   4. 확정 → onConfirm(home, away) callback → caller 가 BFF 호출 + 양식 표시
 *
 * 절대 룰:
 *   - var(--*) 토큰만 / lucide-react ❌ / Material Symbols Outlined 만
 *   - 빨강 본문 텍스트 ❌
 *   - 터치 영역 44px+ (체크박스 영역)
 *   - FIBA 양식 정합 = border 1px + rounded-0 (Phase 7-A 정합)
 */

"use client";

import { useEffect, useState } from "react";
import type { RosterItem } from "./team-section-types";

// 한 팀의 선택 결과 — Phase 7-B 산출물
// 이유: MatchLineupConfirmed.starters (BigInt[]) + substitutes (BigInt[]) 박제 source.
//   client 단에서는 string id 로 운영 (직렬화 단순화).
export interface TeamLineupSelection {
  starters: string[]; // 선발 5인 (ttp.id string)
  substitutes: string[]; // 후보 (출전 명단 - 선발 5인)
}

export interface LineupSelectionResult {
  home: TeamLineupSelection;
  away: TeamLineupSelection;
}

interface LineupSelectionModalProps {
  open: boolean;
  homeTeamName: string;
  awayTeamName: string;
  homePlayers: RosterItem[];
  awayPlayers: RosterItem[];
  // 사전 라인업이 있으면 초기값으로 prefill (수정 가능)
  initialHome?: TeamLineupSelection;
  initialAway?: TeamLineupSelection;
  onConfirm: (result: LineupSelectionResult) => void;
  // 모달 취소 = score-sheet 자체 진입 차단 (양식 표시 안 함). 운영자가 다시 trigger 가능.
  onCancel?: () => void;
}

/**
 * 한 팀의 출전 명단 / 선발 5인 선택 패널.
 *
 * 룰:
 *   - 출전 체크 해제 시 = 선발 5인 에서도 자동 제거 (불일치 방지)
 *   - 선발 5인 = 5명 강제 (FIBA 표준). 4명 이하 / 6명 이상 시 "라인업 확정" 비활성
 *   - 출전 ≥ 5명 강제 (선발 5명을 채우려면 최소 5명 필요)
 *
 * 시각:
 *   - 출전 체크 = 큰 체크박스 (44px touch)
 *   - 선발 선택 = "S" 토글 버튼 (출전 체크된 선수만 활성)
 *   - 선발 행 = 글자 굵게 + 배경 강조 (이유: 사용자 결재 §4)
 */
function TeamLineupPanel({
  teamLabel,
  teamName,
  players,
  selection,
  onChange,
}: {
  teamLabel: "Team A" | "Team B";
  teamName: string;
  players: RosterItem[];
  selection: TeamLineupSelection;
  onChange: (next: TeamLineupSelection) => void;
}) {
  // 출전 체크된 선수 id set (빠른 조회용)
  const lineupSet = new Set([...selection.starters, ...selection.substitutes]);
  const starterSet = new Set(selection.starters);

  // 출전 체크 토글 — 체크 해제 시 선발에서도 제거
  function toggleInLineup(playerId: string, next: boolean) {
    if (next) {
      // 출전 체크 → substitutes 에 추가 (선발 5인이 채워지면 starters 로 이동)
      if (!lineupSet.has(playerId)) {
        onChange({
          starters: selection.starters,
          substitutes: [...selection.substitutes, playerId],
        });
      }
    } else {
      // 출전 해제 → starters/substitutes 모두에서 제거 (불일치 방지)
      onChange({
        starters: selection.starters.filter((id) => id !== playerId),
        substitutes: selection.substitutes.filter((id) => id !== playerId),
      });
    }
  }

  // 선발 5인 토글 (출전 체크된 선수만 활성)
  // 룰: 선발이 이미 5명인데 추가 선택 시도 → 무시 (caller 안내)
  function toggleStarter(playerId: string, next: boolean) {
    if (!lineupSet.has(playerId)) return; // 출전 미체크 = 차단
    if (next) {
      if (starterSet.has(playerId)) return; // 이미 선발
      if (selection.starters.length >= 5) return; // 5명 초과 차단
      // substitutes → starters 이동
      onChange({
        starters: [...selection.starters, playerId],
        substitutes: selection.substitutes.filter((id) => id !== playerId),
      });
    } else {
      if (!starterSet.has(playerId)) return; // 이미 미선발
      // starters → substitutes 이동
      onChange({
        starters: selection.starters.filter((id) => id !== playerId),
        substitutes: [...selection.substitutes, playerId],
      });
    }
  }

  const lineupCount = lineupSet.size;
  const starterCount = selection.starters.length;
  // 운영 안내 — 출전 ≥ 5명 + 선발 = 5명 정확히
  const lineupOk = lineupCount >= 5;
  const starterOk = starterCount === 5;

  return (
    <section
      className="p-3"
      style={{
        border: "1px solid var(--color-border)",
      }}
    >
      <div className="mb-2 flex items-baseline justify-between">
        <h3
          className="text-sm font-bold uppercase tracking-wider"
          style={{ color: "var(--color-text-primary)" }}
        >
          {teamLabel}
        </h3>
        <p
          className="text-base font-semibold"
          style={{ color: "var(--color-text-primary)" }}
        >
          {teamName}
        </p>
      </div>

      {/* 상태 안내 — 출전 / 선발 카운트 */}
      <div
        className="mb-2 flex justify-between text-[11px]"
        style={{ color: "var(--color-text-muted)" }}
      >
        <span style={{ color: lineupOk ? "var(--color-success)" : "var(--color-warning)" }}>
          출전 {lineupCount}명 {lineupOk ? "✓" : "(최소 5명)"}
        </span>
        <span style={{ color: starterOk ? "var(--color-success)" : "var(--color-warning)" }}>
          선발 {starterCount}/5명 {starterOk ? "✓" : ""}
        </span>
      </div>

      {/* 선수 목록 */}
      {players.length === 0 ? (
        <p
          className="py-4 text-center text-xs"
          style={{ color: "var(--color-text-muted)" }}
        >
          명단 미배정 — 운영자에게 문의해주세요.
        </p>
      ) : (
        <ul className="flex flex-col gap-1">
          {players.map((p) => {
            const isInLineup = lineupSet.has(p.tournamentTeamPlayerId);
            const isStarter = starterSet.has(p.tournamentTeamPlayerId);
            // 선발 5명 채워진 상태에서 미선발 선수 = 선발 버튼 비활성
            const starterDisabled =
              !isStarter && selection.starters.length >= 5;

            return (
              <li
                key={p.tournamentTeamPlayerId}
                className="flex items-center justify-between gap-2 px-1 py-1"
                style={{
                  borderBottom: "1px solid var(--color-border)",
                  // 선발 행 = 배경 강조 (사용자 결재 §4)
                  backgroundColor: isStarter
                    ? "color-mix(in srgb, var(--color-accent) 12%, transparent)"
                    : "transparent",
                }}
              >
                {/* 출전 체크 — 큰 터치 영역 */}
                <label
                  className="flex flex-1 cursor-pointer items-center gap-2"
                  style={{ minHeight: 36, touchAction: "manipulation" }}
                >
                  <input
                    type="checkbox"
                    checked={isInLineup}
                    onChange={(e) =>
                      toggleInLineup(p.tournamentTeamPlayerId, e.target.checked)
                    }
                    className="h-5 w-5 cursor-pointer"
                    aria-label={`${p.displayName} 출전`}
                  />
                  <span
                    className="text-xs font-mono"
                    style={{
                      color: "var(--color-text-muted)",
                      minWidth: 24,
                    }}
                  >
                    #{p.jerseyNumber ?? "—"}
                  </span>
                  <span
                    // 선발 = 굵게 (사용자 결재 §4)
                    className={`text-sm ${isStarter ? "font-bold" : ""}`}
                    style={{
                      color: isInLineup
                        ? "var(--color-text-primary)"
                        : "var(--color-text-muted)",
                    }}
                  >
                    {p.displayName}
                  </span>
                  {/* 사전 라인업에 포함되어 있던 선수 표시 (운영자 참고) */}
                  {p.isStarter && (
                    <span
                      className="text-[10px]"
                      style={{ color: "var(--color-accent)" }}
                      aria-label="사전 등록 선발"
                    >
                      (사전 ◉)
                    </span>
                  )}
                </label>

                {/* 선발 5인 토글 버튼 — 출전 체크된 선수만 활성 */}
                <button
                  type="button"
                  onClick={() =>
                    toggleStarter(p.tournamentTeamPlayerId, !isStarter)
                  }
                  disabled={!isInLineup || starterDisabled}
                  className="flex h-9 w-9 items-center justify-center text-xs font-bold disabled:cursor-default disabled:opacity-30"
                  style={{
                    border: "1px solid var(--color-border)",
                    backgroundColor: isStarter
                      ? "var(--color-accent)"
                      : "transparent",
                    color: isStarter
                      ? "var(--color-on-accent, #fff)"
                      : "var(--color-text-muted)",
                    touchAction: "manipulation",
                  }}
                  aria-label={
                    isStarter
                      ? `${p.displayName} 선발 해제`
                      : `${p.displayName} 선발 5인 추가`
                  }
                  title={isStarter ? "선발 5인" : "선발 5인 추가"}
                >
                  S
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

export function LineupSelectionModal({
  open,
  homeTeamName,
  awayTeamName,
  homePlayers,
  awayPlayers,
  initialHome,
  initialAway,
  onConfirm,
  onCancel,
}: LineupSelectionModalProps) {
  // 초기값 — 사전 라인업 있으면 prefill / 없으면 빈 selection
  // 이유: page.tsx 가 hasConfirmedLineup 시 starters[]/substitutes[] 전달 → caller 가 그대로 prefill.
  //   미확정 시 빈 selection 시작 → 기록자가 직접 입력.
  const [homeSel, setHomeSel] = useState<TeamLineupSelection>(
    initialHome ?? { starters: [], substitutes: [] }
  );
  const [awaySel, setAwaySel] = useState<TeamLineupSelection>(
    initialAway ?? { starters: [], substitutes: [] }
  );

  // open 토글 시 초기값 재적용 (모달 재오픈 케이스)
  useEffect(() => {
    if (open) {
      setHomeSel(initialHome ?? { starters: [], substitutes: [] });
      setAwaySel(initialAway ?? { starters: [], substitutes: [] });
    }
    // initialHome / initialAway 변경 시는 모달 재오픈 trigger 시에만 반영
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  // 라인업 확정 조건 — 양 팀 각각 (출전 ≥ 5 + 선발 = 5)
  function isValid(sel: TeamLineupSelection): boolean {
    const lineupCount = sel.starters.length + sel.substitutes.length;
    return lineupCount >= 5 && sel.starters.length === 5;
  }

  const canConfirm = isValid(homeSel) && isValid(awaySel);

  function handleConfirm() {
    if (!canConfirm) return;
    onConfirm({ home: homeSel, away: awaySel });
  }

  return (
    // Phase 7 — `no-print` = 인쇄 시 모달 제거 (FIBA 양식 정합)
    <div
      className="no-print fixed inset-0 z-50 flex items-center justify-center px-2 py-4"
      style={{ backgroundColor: "color-mix(in srgb, #000 60%, transparent)" }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="lineup-selection-modal-title"
    >
      <div
        className="max-h-full w-full max-w-3xl overflow-auto p-4"
        style={{
          backgroundColor: "var(--color-background)",
          border: "1px solid var(--color-border)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          id="lineup-selection-modal-title"
          className="text-base font-bold"
          style={{ color: "var(--color-text-primary)" }}
        >
          오늘 출전 명단 선택
        </h2>
        <p
          className="mt-1 text-xs"
          style={{ color: "var(--color-text-muted)" }}
        >
          오늘 출전할 선수를 양 팀 각각 체크하고, 선발 5인을 선택해주세요.
          출전 미체크 선수는 양식에 표시되지 않습니다.
        </p>

        {/* 양 팀 패널 — md 이상 = 2 컬럼 / 미만 = 1 컬럼 (모바일 stack) */}
        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
          <TeamLineupPanel
            teamLabel="Team A"
            teamName={homeTeamName}
            players={homePlayers}
            selection={homeSel}
            onChange={setHomeSel}
          />
          <TeamLineupPanel
            teamLabel="Team B"
            teamName={awayTeamName}
            players={awayPlayers}
            selection={awaySel}
            onChange={setAwaySel}
          />
        </div>

        {/* 버튼 영역 */}
        <div className="mt-4 flex gap-2">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 py-2 text-sm font-medium"
              style={{
                border: "1px solid var(--color-border)",
                color: "var(--color-text-primary)",
                touchAction: "manipulation",
              }}
              aria-label="라인업 선택 취소"
            >
              취소
            </button>
          )}
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!canConfirm}
            className="flex-1 py-2 text-sm font-semibold disabled:opacity-40"
            style={{
              backgroundColor: "var(--color-accent)",
              color: "var(--color-on-accent, #fff)",
              touchAction: "manipulation",
            }}
            aria-label={
              canConfirm
                ? "라인업 확정"
                : "라인업 확정 — 양 팀 모두 출전 5명 + 선발 5명 필요"
            }
          >
            라인업 확정
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * 라인업 selection 검증 헬퍼 — vitest 회귀 가드용 export.
 *
 * 룰:
 *   - 출전 ≥ 5명 (선발 5명을 채우려면 최소 5명 필요)
 *   - 선발 = 5명 정확히 (FIBA 표준)
 *   - starters + substitutes 중복 0 (UI 가 보장하지만 안전망)
 */
export function isLineupSelectionValid(sel: TeamLineupSelection): boolean {
  const lineupCount = sel.starters.length + sel.substitutes.length;
  if (sel.starters.length !== 5) return false;
  if (lineupCount < 5) return false;
  // 중복 검증 — starters + substitutes 합집합 크기 = 합 크기
  const merged = new Set([...sel.starters, ...sel.substitutes]);
  if (merged.size !== lineupCount) return false;
  return true;
}

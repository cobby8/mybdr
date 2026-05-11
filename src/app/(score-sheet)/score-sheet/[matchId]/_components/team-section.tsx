/**
 * FIBA SCORESHEET TeamSection — Team A 또는 B 의 좌 절반 영역 박제.
 *
 * 2026-05-11 — Phase 1 신규 (planner-architect §작업 4).
 *
 * 왜 (이유):
 *   FIBA 양식 좌 절반 = Team A 상 / Team B 하 분할. 각 팀 영역 안에
 *   Time-outs (5칸) + Team fouls (Period 별 1-4 + Extra) + Players 12명
 *   (Licence / 선수명 / No / Player in / Fouls 1-5) + Coach·Asst Coach 입력.
 *   Phase 1 범위 = Players 표 + Coach 입력 실작동 + Time-outs/Team fouls 골조.
 *
 * 방법 (어떻게):
 *   - Players 12 행 (사전 라인업 + TTP fallback 데이터 그대로):
 *       Licence no. (text input) / 선수명 (read-only) / 등번호 (read-only)
 *       Player in 체크 (출전 여부) / Fouls 1-5 (Phase 3 골조 placeholder)
 *   - Coach / Asst Coach (text input) — settings.coaches JSON 박제 예정 (Phase 5)
 *   - Time-outs 5칸 박스 (Phase 4 placeholder — read-only 격자)
 *   - Team fouls Period ①~④ × 1-2-3-4 + Extra 박스 (Phase 3 placeholder — read-only 격자)
 *
 * 터치 최적화:
 *   - Player in 체크 영역 = 44px+ (row 전체 클릭 가능)
 *   - input 패딩 충분 (px-2 py-2)
 *
 * 절대 룰:
 *   - lucide-react ❌ / Material Symbols Outlined 만
 *   - 빨강 본문 텍스트 ❌ — 강조는 var(--color-accent)
 *   - 입력 = border-bottom only (FIBA underscore 정합)
 */

"use client";

import type { ChangeEvent } from "react";
import type { RosterItem } from "./team-section-types";
import type { FoulMark, FoulType } from "@/lib/score-sheet/foul-types";
import {
  getPlayerFoulCount,
  getTeamFoulCountByPeriod,
  getEjectionReason,
} from "@/lib/score-sheet/foul-helpers";
import type { TimeoutMark } from "@/lib/score-sheet/timeout-types";
import {
  getGamePhase,
  getUsedTimeouts,
} from "@/lib/score-sheet/timeout-helpers";

// Phase 3.5 — 파울 종류별 글자 색상 (P=text-primary / T=warning / U=accent / D=primary)
// 이유: P/T/U/D 약자를 칸 안에 직접 표시 — 종류별 색 차이로 한눈에 인지.
//   D = primary 빨강 (위험 액션 = 빨강 예외 허용 / 본문 텍스트 X)
const FOUL_TYPE_COLOR: Record<FoulType, string> = {
  P: "var(--color-text-primary)",
  T: "var(--color-warning)",
  U: "var(--color-accent)",
  D: "var(--color-primary)",
};

export interface TeamSectionPlayerState {
  // 키 = tournamentTeamPlayerId (string)
  // Phase 3.5 — licence 필드는 더 이상 사용자 입력 X (User.id 자동 fill).
  //   draft 호환 위해 필드 유지하되 UI 에서 미노출.
  licence: string;
  playerIn: boolean; // 출전 여부 마킹
  // Phase 3 — fouls 는 FoulsState (props.fouls) 로 분리. 본 state 에는 미포함.
}

export interface TeamSectionInputs {
  // 팀 전역 입력
  coach: string;
  asstCoach: string;
  // 선수별 상태 (TTP id → state)
  players: Record<string, TeamSectionPlayerState>;
}

interface TeamSectionProps {
  sideLabel: "Team A" | "Team B";
  teamName: string;
  players: RosterItem[]; // 사전 라인업 + TTP fallback (server prop)
  values: TeamSectionInputs;
  onChange: (next: TeamSectionInputs) => void;
  disabled?: boolean;
  // Phase 3 — 파울 상태 (이 팀 전용 FoulMark[] — home/away 한쪽만 전달)
  fouls: FoulMark[];
  // Phase 3.5 — 파울 추가 요청 (다음 빈 칸 클릭) — caller 가 FoulTypeModal open 처리
  //   - 모달에서 종류 선택 후 caller 가 addFoul 호출
  onRequestAddFoul: (playerId: string) => void;
  // Phase 3.5 — 파울 마지막 1건 해제 (마지막 마킹 칸 클릭)
  onRequestRemoveFoul: (playerId: string) => void;
  // 현재 진행 Period (Player Fouls 마킹 시점 기록용 — Running Score 와 같은 값)
  currentPeriod: number;
  // Phase 4 — Time-outs 상태 (이 팀 전용 TimeoutMark[])
  timeouts: TimeoutMark[];
  // Phase 4 — 타임아웃 추가 요청 (빈 칸 클릭) — caller 가 Article 18-19 검증 + 마킹
  onRequestAddTimeout: () => void;
  // Phase 4 — 타임아웃 마지막 1건 해제 (마지막 마킹 칸 클릭)
  onRequestRemoveTimeout: () => void;
}

/**
 * 12 행을 보장하는 헬퍼 — 실제 명단이 12 미만이면 빈 row 채워서 FIBA 양식 정합.
 * 명단이 12 초과면 그대로 표시 (FIBA 5x5 는 12명이 표준이지만 운영 안정성 우선).
 */
export function fillRowsTo12(players: RosterItem[]): (RosterItem | null)[] {
  const TARGET = 12;
  const rows: (RosterItem | null)[] = [...players];
  while (rows.length < TARGET) {
    rows.push(null);
  }
  return rows;
}

export function TeamSection({
  sideLabel,
  teamName,
  players,
  values,
  onChange,
  disabled,
  fouls,
  onRequestAddFoul,
  onRequestRemoveFoul,
  currentPeriod,
  timeouts,
  onRequestAddTimeout,
  onRequestRemoveTimeout,
}: TeamSectionProps) {
  // 선수 행 (12 보장)
  const rows = fillRowsTo12(players);

  // 선수별 state 갱신 helper
  const updatePlayer = (
    playerId: string,
    patch: Partial<TeamSectionPlayerState>
  ) => {
    const prev = values.players[playerId] ?? {
      licence: "",
      playerIn: false,
    };
    onChange({
      ...values,
      players: {
        ...values.players,
        [playerId]: { ...prev, ...patch },
      },
    });
  };

  // Coach / Asst Coach 갱신
  const updateCoach =
    (key: "coach" | "asstCoach") => (e: ChangeEvent<HTMLInputElement>) => {
      onChange({ ...values, [key]: e.target.value });
    };

  return (
    <section
      className="w-full p-3"
      style={{
        border: "1px solid var(--color-border)",
        borderRadius: 4,
      }}
    >
      {/* 헤더 — Team A/B 라벨 + 팀명 */}
      <div className="mb-2 flex items-baseline justify-between">
        <h2
          className="text-sm font-bold uppercase tracking-wider"
          style={{ color: "var(--color-text-primary)" }}
        >
          {sideLabel}
        </h2>
        <p
          className="text-base font-semibold"
          style={{ color: "var(--color-text-primary)" }}
        >
          {teamName}
        </p>
      </div>

      {/* Phase 4 — Time-outs (FIBA Article 18-19 — 전반 2 + 후반 3 + OT 1 각각).
          박스 = 전반칸 2개 + 후반칸 3개 = 기본 5칸. OT 진입 시 (currentPeriod >= 5)
          OT 1칸 동적 추가 (각 OT 별도 1칸).
          UX:
            - 빈 칸 클릭 → caller 가 canAddTimeout 검증 + 마킹
            - 마지막 마킹 칸 클릭 → 1건 해제
            - 채운 칸 = ● (text-primary) / 빈 칸 = 숫자 (text-muted)
          시각: foul 5칸과 같은 톤 (border 1px / 36px 정사각 큰 터치영역) */}
      <div className="mb-3">
        <div
          className="mb-1 flex items-baseline justify-between text-[10px] font-semibold uppercase tracking-wider"
          style={{ color: "var(--color-text-muted)" }}
        >
          <span>Time-outs</span>
          {(() => {
            // 현재 phase 표시 (운영자 인지 도움 — 전반/후반/OTn 잔여)
            const phase = getGamePhase(currentPeriod);
            const used = getUsedTimeouts(
              timeouts,
              phase,
              phase === "overtime" ? currentPeriod : undefined
            );
            const max =
              phase === "first_half" ? 2 : phase === "second_half" ? 3 : 1;
            const phaseLabel =
              phase === "first_half"
                ? "전반"
                : phase === "second_half"
                  ? "후반"
                  : `OT${currentPeriod - 4}`;
            return (
              <span style={{ color: "var(--color-text-muted)" }}>
                {phaseLabel} {used}/{max}
              </span>
            );
          })()}
        </div>
        <div className="flex flex-wrap gap-1">
          {(() => {
            // 표시할 칸 수 산정:
            //   기본 5칸 (전반 2 + 후반 3)
            //   + OT 진입 시 (currentPeriod >= 5) 각 OT 별 1칸 누적
            //     → currentPeriod=5 시 6칸 / 6 시 7칸 / 7 시 8칸
            const totalCells = currentPeriod <= 4 ? 5 : 5 + (currentPeriod - 4);
            // 현재까지 사용된 총 타임아웃 수 = 채워진 칸 수
            const totalUsed = timeouts.length;

            return Array.from({ length: totalCells }).map((_, i) => {
              const filled = i < totalUsed;
              const isLastFilled = filled && i === totalUsed - 1;
              const isNextEmpty = !filled && i === totalUsed;
              // 칸 라벨 — 위치별 phase 안내 (1~2=전반 / 3~5=후반 / 6+=OT)
              //   marked 칸이 어느 period 인지는 timeouts[i].period 로 알 수 있음
              const cellLabel = filled
                ? `Period ${timeouts[i].period} 타임아웃`
                : i < 2
                  ? `전반 타임아웃 ${i + 1}`
                  : i < 5
                    ? `후반 타임아웃 ${i - 1}`
                    : `OT${i - 4} 타임아웃`;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    if (disabled) return;
                    if (isLastFilled) {
                      onRequestRemoveTimeout();
                    } else if (isNextEmpty) {
                      onRequestAddTimeout();
                    }
                  }}
                  disabled={disabled || (!isLastFilled && !isNextEmpty)}
                  className="flex h-9 w-9 items-center justify-center text-sm font-bold disabled:cursor-default"
                  style={{
                    border: "1px solid var(--color-border)",
                    // 채운 칸 = text-primary 배경 (foul P 색과 일관) / 빈 칸 = transparent
                    backgroundColor: filled
                      ? "var(--color-text-primary)"
                      : "var(--color-elevated)",
                    color: filled
                      ? "var(--color-bg, #000)"
                      : "var(--color-text-muted)",
                    cursor:
                      isLastFilled || isNextEmpty ? "pointer" : "default",
                    touchAction: "manipulation",
                    borderRadius: 4,
                  }}
                  aria-label={
                    filled
                      ? `${cellLabel} 마킹됨${isLastFilled ? " (클릭 시 해제)" : ""}`
                      : `${cellLabel} 빈 칸${isNextEmpty ? " (클릭 시 마킹)" : ""}`
                  }
                  title={cellLabel}
                >
                  {filled ? "●" : i + 1}
                </button>
              );
            });
          })()}
        </div>
      </div>

      {/* Team fouls — Player Fouls 자동 합산 (read-only, 사용자 결재 §3 (a)) */}
      {/* 이유: 1-4 마킹은 Player Fouls 마킹에서 자동 산출 — 1=●○○○ / 4=●●●● / 5+=●●●●● + 자유투 안내 */}
      <div className="mb-3">
        <div
          className="mb-1 text-[10px] font-semibold uppercase tracking-wider"
          style={{ color: "var(--color-text-muted)" }}
        >
          Team fouls
        </div>
        <div className="grid grid-cols-1 gap-1">
          {[1, 2, 3, 4].map((period) => {
            // 이 Period 의 팀 파울 누적 (Player Fouls 합산)
            const teamCount = getTeamFoulCountByPeriod(fouls, period);
            // 5+ 도달 = 자유투 부여 (UI 강조)
            const ftAwarded = teamCount >= 5;
            return (
              <div key={period} className="flex items-center gap-1">
                <span
                  className="w-12 text-[10px] uppercase"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  Period {period}
                </span>
                {/* 1-4 칸 — teamCount 만큼 채움 */}
                {[1, 2, 3, 4].map((n) => {
                  const filled = teamCount >= n;
                  return (
                    <div
                      key={n}
                      className="flex h-5 w-5 items-center justify-center text-[10px]"
                      style={{
                        border: "1px solid var(--color-border)",
                        // 채운 칸 = accent / 빈 칸 = muted
                        backgroundColor: filled
                          ? "var(--color-accent)"
                          : "transparent",
                        color: filled
                          ? "var(--color-on-accent, #fff)"
                          : "var(--color-text-muted)",
                      }}
                      aria-label={`Period ${period} 팀 파울 ${n} ${filled ? "마킹됨" : "빈 칸"}`}
                    >
                      {filled ? "●" : n}
                    </div>
                  );
                })}
                {/* 5+ 도달 시 자유투 부여 표시 (사용자 결재 §4 alert toast 와 별도 — 영구 표시 차원) */}
                {ftAwarded && (
                  <span
                    className="ml-1 inline-flex items-center gap-0.5 text-[9px] font-semibold"
                    style={{ color: "var(--color-warning)" }}
                    aria-label={`Period ${period} 자유투 부여 (Team fouls ${teamCount}건)`}
                  >
                    <span
                      className="material-symbols-outlined text-[12px]"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      warning
                    </span>
                    FT (+{teamCount - 4})
                  </span>
                )}
              </div>
            );
          })}
          {/* Extra periods (OT) — period 5+ 합산 */}
          <div className="flex items-center gap-1">
            <span
              className="w-12 text-[10px] uppercase"
              style={{ color: "var(--color-text-muted)" }}
            >
              Extra
            </span>
            {/* OT 파울 (period 5~7 모두 합산) */}
            {(() => {
              const otCount = fouls.filter((f) => f.period >= 5).length;
              return [1, 2, 3, 4].map((n) => {
                const filled = otCount >= n;
                return (
                  <div
                    key={n}
                    className="flex h-5 w-5 items-center justify-center text-[10px]"
                    style={{
                      borderBottom: "1px solid var(--color-border)",
                      backgroundColor: filled
                        ? "var(--color-accent)"
                        : "transparent",
                      color: filled
                        ? "var(--color-on-accent, #fff)"
                        : "var(--color-text-muted)",
                    }}
                    aria-label={`Extra (OT) 팀 파울 ${n}`}
                  >
                    {filled ? "●" : ""}
                  </div>
                );
              });
            })()}
          </div>
        </div>
      </div>

      {/* Players 12 행 — FIBA 양식 핵심 */}
      <div className="mb-3 overflow-x-auto">
        <table
          className="w-full border-collapse text-xs"
          style={{ color: "var(--color-text-primary)" }}
        >
          <thead>
            <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
              <th
                className="w-20 px-1 py-1 text-left text-[10px] font-semibold uppercase"
                style={{ color: "var(--color-text-muted)" }}
                title="Licence = User ID (자동 fill)"
              >
                Licence (UID)
              </th>
              <th
                className="px-1 py-1 text-left text-[10px] font-semibold uppercase"
                style={{ color: "var(--color-text-muted)" }}
              >
                Player
              </th>
              <th
                className="w-10 px-1 py-1 text-center text-[10px] font-semibold uppercase"
                style={{ color: "var(--color-text-muted)" }}
              >
                No.
              </th>
              <th
                className="w-12 px-1 py-1 text-center text-[10px] font-semibold uppercase"
                style={{ color: "var(--color-text-muted)" }}
              >
                P in
              </th>
              <th
                className="w-32 px-1 py-1 text-center text-[10px] font-semibold uppercase"
                style={{ color: "var(--color-text-muted)" }}
              >
                Fouls 1-5
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p, idx) => {
              if (!p) {
                // 빈 row — FIBA 양식 12 행 정합용 placeholder
                return (
                  <tr
                    key={`empty-${idx}`}
                    style={{
                      borderBottom: "1px solid var(--color-border)",
                    }}
                  >
                    <td className="px-1 py-2">&nbsp;</td>
                    <td className="px-1 py-2">&nbsp;</td>
                    <td className="px-1 py-2 text-center">&nbsp;</td>
                    <td className="px-1 py-2 text-center">&nbsp;</td>
                    <td className="px-1 py-2 text-center">&nbsp;</td>
                  </tr>
                );
              }

              const state = values.players[p.tournamentTeamPlayerId] ?? {
                licence: "",
                playerIn: false,
              };

              // Phase 3 — 파울 카운트 + Phase 3.5 Article 41 퇴장 판정
              const foulCount = getPlayerFoulCount(
                fouls,
                p.tournamentTeamPlayerId
              );
              const ejection = getEjectionReason(
                fouls,
                p.tournamentTeamPlayerId
              );
              const ejected = ejection.ejected;
              // Phase 3.5 — 해당 선수의 파울 마킹 순서대로 type 배열 (UI 칸 표시용)
              //   예: [P, P, T, U] → 칸 1=P / 칸 2=P / 칸 3=T / 칸 4=U
              const playerFoulMarks = fouls.filter(
                (f) => f.playerId === p.tournamentTeamPlayerId
              );

              return (
                <tr
                  key={p.tournamentTeamPlayerId}
                  style={{
                    borderBottom: "1px solid var(--color-border)",
                    // 사용자 결재 §2 (a) — 5반칙 도달 시 행 전체 회색 처리
                    backgroundColor: ejected
                      ? "var(--color-elevated)"
                      : "transparent",
                    color: ejected
                      ? "var(--color-text-muted)"
                      : "var(--color-text-primary)",
                  }}
                  aria-label={
                    ejected
                      ? `${p.displayName} 5반칙 퇴장`
                      : `${p.displayName}`
                  }
                >
                  {/* Phase 3.5 — Licence = User.id 자동 fill (Read-only).
                      이유: 사용자 결재 §3 — 운영자 입력 부담 0, User.id 가 영구 식별자.
                      미연결 (게스트) 선수 = "—" 표시. */}
                  <td className="px-1 py-1">
                    <span
                      className="block w-full text-xs font-mono"
                      style={{
                        color: ejected
                          ? "var(--color-text-muted)"
                          : "var(--color-text-primary)",
                      }}
                      aria-label={`${p.displayName} licence ${p.userId ?? "미연결"}`}
                    >
                      {p.userId ?? "—"}
                    </span>
                  </td>
                  {/* 선수명 — read-only / 사전 라인업 starter ◉ + 캡틴 ★ + 5반칙 시 "퇴장" 안내 */}
                  <td className="px-1 py-1">
                    {p.isStarter && !ejected && (
                      <span
                        className="mr-1"
                        style={{ color: "var(--color-accent)" }}
                      >
                        ◉
                      </span>
                    )}
                    {p.displayName}
                    {p.role === "captain" && !ejected && (
                      <span
                        className="ml-1"
                        style={{ color: "var(--color-warning)" }}
                      >
                        ★
                      </span>
                    )}
                    {/* Phase 3.5 — Article 41 퇴장 안내 (사유 분기).
                        Material Symbols `block` + 사유 라벨 (5반칙/T2/U2/D 즉시) */}
                    {ejected && ejection.reason && (
                      <span
                        className="ml-1 inline-flex items-center gap-0.5 text-[10px] font-semibold"
                        style={{ color: "var(--color-warning)" }}
                        aria-label={`퇴장 사유 ${ejection.reason}`}
                      >
                        <span
                          className="material-symbols-outlined text-[12px]"
                          style={{ fontVariationSettings: "'FILL' 1" }}
                        >
                          block
                        </span>
                        {ejection.reason === "5_fouls"
                          ? "5반칙"
                          : ejection.reason === "2_technical"
                            ? "T×2"
                            : ejection.reason === "2_unsportsmanlike"
                              ? "U×2"
                              : "D 퇴장"}
                      </span>
                    )}
                  </td>
                  {/* 등번호 — read-only */}
                  <td className="px-1 py-1 text-center">
                    {p.jerseyNumber ?? "—"}
                  </td>
                  {/* Player in 체크 — 큰 터치 영역 (44px+) */}
                  <td className="px-1 py-1 text-center">
                    <label
                      className="inline-flex h-9 w-9 cursor-pointer items-center justify-center"
                      style={{ touchAction: "manipulation" }}
                    >
                      <input
                        type="checkbox"
                        checked={state.playerIn}
                        onChange={(e) =>
                          updatePlayer(p.tournamentTeamPlayerId, {
                            playerIn: e.target.checked,
                          })
                        }
                        disabled={disabled}
                        className="h-5 w-5 cursor-pointer disabled:opacity-50"
                        aria-label={`${p.displayName} player in`}
                      />
                    </label>
                  </td>
                  {/* Phase 3.5 — Fouls 1-5 칸 = P/T/U/D 글자 직접 표시.
                      UX:
                        - 빈 칸 클릭 → caller 가 FoulTypeModal open (종류 선택 후 추가)
                        - 마지막 마킹 칸 클릭 → 1건 해제
                        - Article 41 퇴장 도달 시 추가 차단 (단 마지막 칸 해제 허용)
                      MAX_PLAYER_FOULS 상한 폐기 — Article 41 합산 ≥ 5 차단으로 대체 */}
                  <td className="px-1 py-1">
                    <div className="flex justify-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((n) => {
                        // 해당 칸 위치의 파울 마킹 (있으면 type 추출)
                        const mark =
                          n <= foulCount ? playerFoulMarks[n - 1] : null;
                        const filled = mark !== null;
                        const isLastFilled = filled && n === foulCount;
                        const isNextEmpty = !filled && n === foulCount + 1;
                        // 종류별 색상 (filled 만)
                        const typeColor = mark
                          ? FOUL_TYPE_COLOR[mark.type]
                          : "var(--color-text-muted)";
                        return (
                          <button
                            key={n}
                            type="button"
                            onClick={() => {
                              if (disabled) return;
                              // 퇴장 도달 후 6번째 칸 클릭 = 차단 (마지막 칸 해제는 허용)
                              if (ejected && !isLastFilled) {
                                return;
                              }
                              if (isLastFilled) {
                                onRequestRemoveFoul(p.tournamentTeamPlayerId);
                              } else if (isNextEmpty) {
                                // 모달 open 요청 (종류 선택 후 caller 가 addFoul)
                                onRequestAddFoul(p.tournamentTeamPlayerId);
                              }
                            }}
                            disabled={
                              disabled || (!isLastFilled && !isNextEmpty)
                            }
                            // 칸 = 5x5 작지만 버튼 자체 클릭 영역 + touchAction
                            className="flex h-5 w-5 items-center justify-center text-[10px] font-bold disabled:cursor-default"
                            style={{
                              border: "1px solid var(--color-border)",
                              backgroundColor: filled
                                ? "color-mix(in srgb, " +
                                  typeColor +
                                  " 18%, transparent)"
                                : "transparent",
                              color: filled ? typeColor : "var(--color-text-muted)",
                              cursor:
                                isLastFilled || isNextEmpty
                                  ? "pointer"
                                  : "default",
                              touchAction: "manipulation",
                            }}
                            aria-label={
                              mark
                                ? `${p.displayName} ${n}번째 파울 ${mark.type} 마킹됨${isLastFilled ? " (클릭 시 해제)" : ""}`
                                : `${p.displayName} ${n}번째 파울 빈 칸${isNextEmpty ? " (클릭 시 종류 선택)" : ""}`
                            }
                            title={`Period ${currentPeriod} 마킹`}
                          >
                            {mark ? mark.type : n}
                          </button>
                        );
                      })}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Coach / Asst Coach 입력 — settings.coaches JSON 박제 예정 */}
      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span
            className="block text-[10px] font-semibold uppercase tracking-wider"
            style={{ color: "var(--color-text-muted)" }}
          >
            Coach
          </span>
          <input
            type="text"
            value={values.coach}
            onChange={updateCoach("coach")}
            disabled={disabled}
            maxLength={40}
            className="w-full bg-transparent pb-0.5 pt-1 text-sm focus:outline-none disabled:opacity-50"
            style={{
              color: "var(--color-text-primary)",
              borderBottom: "1px solid var(--color-border)",
            }}
          />
        </label>
        <label className="block">
          <span
            className="block text-[10px] font-semibold uppercase tracking-wider"
            style={{ color: "var(--color-text-muted)" }}
          >
            Asst. Coach
          </span>
          <input
            type="text"
            value={values.asstCoach}
            onChange={updateCoach("asstCoach")}
            disabled={disabled}
            maxLength={40}
            className="w-full bg-transparent pb-0.5 pt-1 text-sm focus:outline-none disabled:opacity-50"
            style={{
              color: "var(--color-text-primary)",
              borderBottom: "1px solid var(--color-border)",
            }}
          />
        </label>
      </div>
    </section>
  );
}

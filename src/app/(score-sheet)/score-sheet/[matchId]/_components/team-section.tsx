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
import type { FoulMark } from "@/lib/score-sheet/foul-types";
import {
  getPlayerFoulCount,
  getTeamFoulCountByPeriod,
  isPlayerEjected,
} from "@/lib/score-sheet/foul-helpers";
import { MAX_PLAYER_FOULS } from "@/lib/score-sheet/foul-types";

export interface TeamSectionPlayerState {
  // 키 = tournamentTeamPlayerId (string)
  licence: string; // Licence no. (settings JSON 박제)
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
  // Phase 3 — 파울 토글 콜백
  //   - action="add" → 다음 빈 칸 채움 (caller 가 5반칙 차단 + 5+ FT alert)
  //   - action="remove" → 마지막 마킹 1건 해제
  onToggleFoul: (playerId: string, action: "add" | "remove") => void;
  // 현재 진행 Period (Player Fouls 마킹 시점 기록용 — Running Score 와 같은 값)
  currentPeriod: number;
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
  onToggleFoul,
  currentPeriod,
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

      {/* Time-outs (Phase 4 placeholder — 5칸 격자) */}
      <div className="mb-3">
        <div
          className="mb-1 text-[10px] font-semibold uppercase tracking-wider"
          style={{ color: "var(--color-text-muted)" }}
        >
          Time-outs
        </div>
        <div className="flex gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="flex h-7 w-7 items-center justify-center text-xs"
              style={{
                border: "1px solid var(--color-border)",
                color: "var(--color-text-muted)",
              }}
              aria-label={`Time-out ${i + 1} (Phase 4 활성화 예정)`}
            >
              {/* Phase 4 = 1탭 마킹 → ✕ 표시 / 현재는 빈 칸 */}
            </div>
          ))}
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
              >
                Licence
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

              // Phase 3 — 파울 카운트 + 5반칙(퇴장) 판정
              const foulCount = getPlayerFoulCount(
                fouls,
                p.tournamentTeamPlayerId
              );
              const ejected = isPlayerEjected(fouls, p.tournamentTeamPlayerId);

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
                  {/* Licence no. (text) — settings JSON 박제 */}
                  <td className="px-1 py-1">
                    <input
                      type="text"
                      value={state.licence}
                      onChange={(e) =>
                        updatePlayer(p.tournamentTeamPlayerId, {
                          licence: e.target.value,
                        })
                      }
                      disabled={disabled}
                      maxLength={20}
                      className="w-full bg-transparent text-xs focus:outline-none disabled:opacity-50"
                      style={{
                        color: ejected
                          ? "var(--color-text-muted)"
                          : "var(--color-text-primary)",
                      }}
                      aria-label={`${p.displayName} licence`}
                    />
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
                    {/* 5반칙 퇴장 안내 — Material Symbols `block` + 텍스트 */}
                    {ejected && (
                      <span
                        className="ml-1 inline-flex items-center gap-0.5 text-[10px] font-semibold"
                        style={{ color: "var(--color-warning)" }}
                        aria-label="5반칙 퇴장"
                      >
                        <span
                          className="material-symbols-outlined text-[12px]"
                          style={{ fontVariationSettings: "'FILL' 1" }}
                        >
                          block
                        </span>
                        퇴장
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
                  {/* Fouls 1-5 — 토글 마킹 (사용자 결재 §1 (a)) */}
                  {/* UX:
                        - 빈 칸 클릭 = 다음 빈 칸 채움 (add)
                        - 가장 우측 마킹 (마지막) 클릭 = 해제 (remove)
                        - 5반칙 후 셀 클릭 = 차단 (caller toast)
                  */}
                  <td className="px-1 py-1">
                    <div className="flex justify-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((n) => {
                        const filled = foulCount >= n;
                        const isLastFilled = filled && n === foulCount;
                        // 다음 빈 칸 = 다음 클릭 시 채워질 위치
                        const isNextEmpty = !filled && n === foulCount + 1;
                        return (
                          <button
                            key={n}
                            type="button"
                            onClick={() => {
                              if (disabled) return;
                              // 5반칙(퇴장) 도달 후 6번째 시도 = caller toast 차단 처리
                              if (ejected && !isLastFilled) {
                                // 마지막 마킹(5번째) 해제는 허용 / 그 외 셀 = 무반응
                                // (이론상 다 채움 5건이면 isNextEmpty=false 라 add 호출 0)
                                return;
                              }
                              if (isLastFilled) {
                                // 마지막 1건 해제
                                onToggleFoul(p.tournamentTeamPlayerId, "remove");
                              } else if (isNextEmpty) {
                                // 다음 빈 칸 채움
                                onToggleFoul(p.tournamentTeamPlayerId, "add");
                              }
                              // 그 외 (중간 빈 칸, 중간 마킹) = 무반응
                            }}
                            disabled={
                              disabled || (!isLastFilled && !isNextEmpty)
                            }
                            // 터치 영역 — 칸은 작지만 button 자체 클릭 영역 + touchAction
                            className="flex h-5 w-5 items-center justify-center text-[9px] disabled:cursor-default"
                            style={{
                              border: "1px solid var(--color-border)",
                              backgroundColor: filled
                                ? "var(--color-accent)"
                                : "transparent",
                              color: filled
                                ? "var(--color-on-accent, #fff)"
                                : "var(--color-text-muted)",
                              cursor:
                                isLastFilled || isNextEmpty
                                  ? "pointer"
                                  : "default",
                              touchAction: "manipulation",
                            }}
                            aria-label={
                              filled
                                ? `${p.displayName} ${n}번째 파울 마킹됨${isLastFilled ? " (클릭 시 해제)" : ""}`
                                : `${p.displayName} ${n}번째 파울 빈 칸${isNextEmpty ? " (다음 클릭 시 마킹)" : ""}`
                            }
                            title={`Period ${currentPeriod} 마킹`}
                          >
                            {filled ? "●" : n}
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

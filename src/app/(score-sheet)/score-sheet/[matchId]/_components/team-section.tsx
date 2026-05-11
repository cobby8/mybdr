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

export interface TeamSectionPlayerState {
  // 키 = tournamentTeamPlayerId (string)
  licence: string; // Licence no. (settings JSON 박제)
  playerIn: boolean; // 출전 여부 마킹
  // Phase 3 확장: fouls 1-5 (현재 골조만)
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

      {/* Team fouls (Phase 3 placeholder — Period ①~④ × 1-4 + Extra) */}
      <div className="mb-3">
        <div
          className="mb-1 text-[10px] font-semibold uppercase tracking-wider"
          style={{ color: "var(--color-text-muted)" }}
        >
          Team fouls
        </div>
        <div className="grid grid-cols-1 gap-1">
          {[1, 2, 3, 4].map((period) => (
            <div key={period} className="flex items-center gap-1">
              <span
                className="w-12 text-[10px] uppercase"
                style={{ color: "var(--color-text-muted)" }}
              >
                Period {period}
              </span>
              {[1, 2, 3, 4].map((n) => (
                <div
                  key={n}
                  className="flex h-5 w-5 items-center justify-center text-[10px]"
                  style={{
                    border: "1px solid var(--color-border)",
                    color: "var(--color-text-muted)",
                  }}
                >
                  {n}
                </div>
              ))}
            </div>
          ))}
          {/* Extra periods */}
          <div className="flex items-center gap-1">
            <span
              className="w-12 text-[10px] uppercase"
              style={{ color: "var(--color-text-muted)" }}
            >
              Extra
            </span>
            {[1, 2, 3, 4].map((n) => (
              <div
                key={n}
                className="h-5 w-5"
                style={{ borderBottom: "1px solid var(--color-border)" }}
                aria-label={`Extra ${n}`}
              />
            ))}
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

              return (
                <tr
                  key={p.tournamentTeamPlayerId}
                  style={{ borderBottom: "1px solid var(--color-border)" }}
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
                        color: "var(--color-text-primary)",
                      }}
                      aria-label={`${p.displayName} licence`}
                    />
                  </td>
                  {/* 선수명 — read-only / 사전 라인업 starter ◉ + 캡틴 ★ */}
                  <td className="px-1 py-1">
                    {p.isStarter && (
                      <span
                        className="mr-1"
                        style={{ color: "var(--color-accent)" }}
                      >
                        ◉
                      </span>
                    )}
                    {p.displayName}
                    {p.role === "captain" && (
                      <span
                        className="ml-1"
                        style={{ color: "var(--color-warning)" }}
                      >
                        ★
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
                  {/* Fouls 1-5 placeholder — Phase 3 활성화 */}
                  <td className="px-1 py-1">
                    <div className="flex justify-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <div
                          key={n}
                          className="flex h-5 w-5 items-center justify-center text-[9px]"
                          style={{
                            border: "1px solid var(--color-border)",
                            color: "var(--color-text-muted)",
                          }}
                          aria-label={`${p.displayName} foul ${n} (Phase 3 활성화 예정)`}
                        >
                          {n}
                        </div>
                      ))}
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

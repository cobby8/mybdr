/**
 * 2026-05-16 PR-Public-1 — 종별 매치 일정 표 (시안 사진 2~4 패턴).
 *
 * 이유(왜):
 *   - 강남구협회장배 같은 다종별 대회의 공개 페이지에서 종별별 예선/순위전 매치 시간순 표시.
 *   - admin /playoffs 의 PlayoffMatchRow 와 패턴은 비슷하지만:
 *     - admin = "관리자가 결과 입력" 시각 → 콤팩트 행 (#매치번호 강조)
 *     - 공개 = "관전자가 일정 확인" 시각 → 시간 / HOME / AWAY / 점수 컬럼 표 (시안 사진 2~4)
 *
 * 입력:
 *   - title: 표 제목 (예: "예선 일정", "순위결정전")
 *   - matches: 표시할 매치 (이미 부모에서 종별 + 분류 필터링됨)
 *   - emptyMessage: 매치 0건 시 안내 (없으면 표 자체 미렌더)
 *
 * placeholder 매치:
 *   - homeTeamName / awayTeamName 이 null 이면 settings.homeSlotLabel / awaySlotLabel 폴백
 *   - 폴백도 없으면 "미정" 표시
 *   - PR-G5 룰 준수 (placeholder-helpers 의존 0 / generator 박제 슬롯 라벨 그대로 사용)
 *
 * 디자인 룰 (BDR 13):
 *   - var(--color-info) Navy 헤더 / var(--color-card) 행 배경 / rounded-[4px]
 *   - material-symbols-outlined / lucide-react ❌
 *   - 모바일 카드 스택 / PC 표 (720px 분기) — schedule-timeline 패턴 답습
 */

"use client";

// 매치 페이로드 — leagueMatches 응답 shape (route.ts:386~404 정의 기준)
export type DivisionMatch = {
  id: string;
  homeTeamId: string | null;
  awayTeamId: string | null;
  homeTeamName: string | null;
  awayTeamName: string | null;
  homeScore: number | null;
  awayScore: number | null;
  status: string | null;
  scheduledAt: string | null;
  courtNumber: string | null;
  roundName: string | null;
  venueName: string | null;
  division: string | null;
  homeSlotLabel: string | null;
  awaySlotLabel: string | null;
};

type Props = {
  title: string;
  matches: DivisionMatch[];
  emptyMessage?: string;
};

const STATUS_LABEL: Record<string, string> = {
  pending: "대기",
  scheduled: "예정",
  in_progress: "진행 중",
  live: "LIVE",
  completed: "종료",
  cancelled: "취소",
  bye: "부전승",
};

// 슬롯 라벨 — 팀 확정이면 팀명 / 아니면 settings 슬롯 라벨 / 그래도 없으면 "미정"
// admin /playoffs:102 동등 패턴 (단일 source 룰 일관)
function slotLabel(teamName: string | null, fallback: string | null): string {
  if (teamName) return teamName;
  if (fallback && fallback.trim()) return fallback;
  return "미정";
}

// KST 일정 표시 — yyyy.MM.dd HH:mm
function formatSchedule(iso: string | null): string {
  if (!iso) return "일정 미정";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "일정 미정";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getMonth() + 1)}.${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function DivisionScheduleTable({ title, matches, emptyMessage }: Props) {
  // 매치 0건 + emptyMessage 미박제 = 미렌더 (회귀 0)
  if (matches.length === 0 && !emptyMessage) return null;

  return (
    <section>
      {/* 섹션 헤더 — 표 제목 + 매치 수 뱃지 */}
      <div className="mb-4 flex items-center gap-2">
        <span
          className="w-1.5 h-6 rounded-sm"
          style={{ backgroundColor: "var(--color-info)" }}
          aria-hidden="true"
        />
        <h3
          className="text-base font-bold sm:text-lg"
          style={{ color: "var(--color-text-primary)" }}
        >
          {title}
        </h3>
        <span
          className="ml-2 rounded-[4px] px-2 py-0.5 text-xs"
          style={{
            backgroundColor: "var(--color-elevated)",
            color: "var(--color-text-muted)",
          }}
        >
          {matches.length}경기
        </span>
      </div>

      {matches.length === 0 ? (
        // 빈 상태 — 카드 스타일 안내
        <div
          className="rounded-[4px] border p-6 text-center text-sm"
          style={{
            borderColor: "var(--color-border)",
            backgroundColor: "var(--color-surface)",
            color: "var(--color-text-muted)",
          }}
        >
          {emptyMessage}
        </div>
      ) : (
        <>
          {/* PC 표 (sm+) — 시간 / HOME / 점수 / AWAY / 코트 / 상태 */}
          <div
            className="hidden sm:block rounded-[4px] overflow-hidden border"
            style={{
              borderColor: "var(--color-border)",
              backgroundColor: "var(--color-card)",
            }}
          >
            <table className="w-full text-left border-collapse">
              <thead>
                <tr
                  className="text-xs font-bold uppercase tracking-wide"
                  style={{
                    backgroundColor: "var(--color-surface)",
                    color: "var(--color-text-muted)",
                    borderBottom: "1px solid var(--color-border)",
                  }}
                >
                  <th className="px-4 py-3">시간</th>
                  <th className="px-4 py-3">HOME</th>
                  <th className="px-4 py-3 text-center w-24">점수</th>
                  <th className="px-4 py-3">AWAY</th>
                  <th className="px-4 py-3 text-center w-20">코트</th>
                  <th className="px-4 py-3 text-center w-20">상태</th>
                </tr>
              </thead>
              <tbody>
                {matches.map((m) => {
                  const completed = m.status === "completed";
                  const homeWon =
                    completed && (m.homeScore ?? 0) > (m.awayScore ?? 0);
                  const awayWon =
                    completed && (m.awayScore ?? 0) > (m.homeScore ?? 0);
                  const homeText = slotLabel(m.homeTeamName, m.homeSlotLabel);
                  const awayText = slotLabel(m.awayTeamName, m.awaySlotLabel);
                  const isHomeUndecided = m.homeTeamName == null;
                  const isAwayUndecided = m.awayTeamName == null;

                  return (
                    <tr
                      key={m.id}
                      style={{ borderBottom: "1px solid var(--color-border)" }}
                    >
                      {/* 시간 */}
                      <td
                        className="px-4 py-3 text-sm tabular-nums"
                        style={{ color: "var(--color-text-secondary)" }}
                      >
                        {formatSchedule(m.scheduledAt)}
                      </td>
                      {/* HOME — 우승 시 bold / placeholder 면 italic muted */}
                      <td
                        className={`px-4 py-3 text-sm ${
                          isHomeUndecided
                            ? "italic"
                            : homeWon
                              ? "font-bold"
                              : "font-medium"
                        }`}
                        style={{
                          color: isHomeUndecided
                            ? "var(--color-text-muted)"
                            : "var(--color-text-primary)",
                        }}
                      >
                        {homeText}
                      </td>
                      {/* 점수 — completed 만 표시 / 아니면 "-" */}
                      <td className="px-4 py-3 text-center text-sm tabular-nums">
                        {completed ? (
                          <span
                            style={{
                              color: "var(--color-text-primary)",
                            }}
                          >
                            <span className={homeWon ? "font-bold" : ""}>
                              {m.homeScore ?? 0}
                            </span>
                            <span
                              className="mx-1"
                              style={{ color: "var(--color-text-muted)" }}
                            >
                              :
                            </span>
                            <span className={awayWon ? "font-bold" : ""}>
                              {m.awayScore ?? 0}
                            </span>
                          </span>
                        ) : (
                          <span style={{ color: "var(--color-text-muted)" }}>
                            -
                          </span>
                        )}
                      </td>
                      {/* AWAY */}
                      <td
                        className={`px-4 py-3 text-sm ${
                          isAwayUndecided
                            ? "italic"
                            : awayWon
                              ? "font-bold"
                              : "font-medium"
                        }`}
                        style={{
                          color: isAwayUndecided
                            ? "var(--color-text-muted)"
                            : "var(--color-text-primary)",
                        }}
                      >
                        {awayText}
                      </td>
                      {/* 코트 */}
                      <td
                        className="px-4 py-3 text-center text-xs"
                        style={{ color: "var(--color-text-muted)" }}
                      >
                        {m.courtNumber ?? "-"}
                      </td>
                      {/* 상태 — 완료/진행 중 색상 강조 */}
                      <td className="px-4 py-3 text-center">
                        <span
                          className="inline-block rounded-[4px] px-2 py-0.5 text-[11px]"
                          style={{
                            backgroundColor: completed
                              ? "color-mix(in srgb, var(--color-success) 15%, transparent)"
                              : m.status === "in_progress" || m.status === "live"
                                ? "color-mix(in srgb, var(--color-info) 15%, transparent)"
                                : "var(--color-surface)",
                            color: completed
                              ? "var(--color-success)"
                              : m.status === "in_progress" || m.status === "live"
                                ? "var(--color-info)"
                                : "var(--color-text-muted)",
                          }}
                        >
                          {STATUS_LABEL[m.status ?? "pending"] ?? m.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* 모바일 카드 스택 (720px 미만) — schedule-timeline 패턴 답습 */}
          <div className="sm:hidden space-y-2">
            {matches.map((m) => {
              const completed = m.status === "completed";
              const homeWon =
                completed && (m.homeScore ?? 0) > (m.awayScore ?? 0);
              const awayWon =
                completed && (m.awayScore ?? 0) > (m.homeScore ?? 0);
              const homeText = slotLabel(m.homeTeamName, m.homeSlotLabel);
              const awayText = slotLabel(m.awayTeamName, m.awaySlotLabel);
              const isHomeUndecided = m.homeTeamName == null;
              const isAwayUndecided = m.awayTeamName == null;

              return (
                <div
                  key={m.id}
                  className="rounded-[4px] border p-3"
                  style={{
                    borderColor: "var(--color-border)",
                    backgroundColor: "var(--color-card)",
                  }}
                >
                  {/* 헤더 — 시간 / 코트 / 상태 */}
                  <div className="mb-2 flex items-center justify-between gap-2 text-xs">
                    <div
                      className="flex items-center gap-2"
                      style={{ color: "var(--color-text-muted)" }}
                    >
                      <span className="tabular-nums">
                        {formatSchedule(m.scheduledAt)}
                      </span>
                      {m.courtNumber && <span>· {m.courtNumber}</span>}
                    </div>
                    <span
                      className="rounded-[4px] px-2 py-0.5 text-[11px]"
                      style={{
                        backgroundColor: completed
                          ? "color-mix(in srgb, var(--color-success) 15%, transparent)"
                          : m.status === "in_progress" || m.status === "live"
                            ? "color-mix(in srgb, var(--color-info) 15%, transparent)"
                            : "var(--color-surface)",
                        color: completed
                          ? "var(--color-success)"
                          : m.status === "in_progress" || m.status === "live"
                            ? "var(--color-info)"
                            : "var(--color-text-muted)",
                      }}
                    >
                      {STATUS_LABEL[m.status ?? "pending"] ?? m.status}
                    </span>
                  </div>

                  {/* HOME / 점수 / AWAY 한 줄 */}
                  <div className="flex items-center gap-2">
                    <span
                      className={`flex-1 text-sm truncate ${
                        isHomeUndecided
                          ? "italic"
                          : homeWon
                            ? "font-bold"
                            : "font-medium"
                      }`}
                      style={{
                        color: isHomeUndecided
                          ? "var(--color-text-muted)"
                          : "var(--color-text-primary)",
                      }}
                      title={homeText}
                    >
                      {homeText}
                    </span>
                    <span
                      className="text-sm tabular-nums whitespace-nowrap"
                      style={{ color: "var(--color-text-primary)" }}
                    >
                      {completed ? (
                        <>
                          <span className={homeWon ? "font-bold" : ""}>
                            {m.homeScore ?? 0}
                          </span>
                          <span
                            className="mx-1"
                            style={{ color: "var(--color-text-muted)" }}
                          >
                            :
                          </span>
                          <span className={awayWon ? "font-bold" : ""}>
                            {m.awayScore ?? 0}
                          </span>
                        </>
                      ) : (
                        <span style={{ color: "var(--color-text-muted)" }}>
                          vs
                        </span>
                      )}
                    </span>
                    <span
                      className={`flex-1 text-sm truncate text-right ${
                        isAwayUndecided
                          ? "italic"
                          : awayWon
                            ? "font-bold"
                            : "font-medium"
                      }`}
                      style={{
                        color: isAwayUndecided
                          ? "var(--color-text-muted)"
                          : "var(--color-text-primary)",
                      }}
                      title={awayText}
                    >
                      {awayText}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </section>
  );
}

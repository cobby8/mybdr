"use client";
/* ============================================================
 * OverviewTab — /users/[id] v2 "개요" 탭
 *
 * 왜:
 * - v2 PlayerProfile.jsx L139~229 overview 탭 재현. PM 확정 D-P6:
 *   슛존/스카우팅 섹션 제거. 시즌 스탯 + 소속 팀 aside + 뱃지 aside 로 구성.
 *
 * 어떻게:
 * - 좌측 main: 시즌 스탯 카드 (8열 — 경기/승률/PPG/RPG/APG/MIN/FG%/3P%) — Q4=C-3 (5/9).
 *   카드 우상단 [더보기] 버튼 → StatsDetailModal (Phase 2 Q3=A 모달).
 * - 우측 aside: 소속 팀 카드 + 활동 로그 카드 + 뱃지 카드.
 *   · 활동 로그: ActivityLog 컴포넌트 (Phase 2 Q1=A 5종 통합 — match/mvp/team/jersey/signup).
 * - 전체 grid: 1fr 320px (main / aside).
 *
 * 5/9 Phase 2 변경:
 * - "use client" 전환 — 통산 [더보기] 모달 useState 필요. 기존 props 모두 직렬화 OK
 *   (string/number/boolean — Date/BigInt 미포함).
 * - activity prop 시그니처 변경: gamesPlayed=Number (Q2 fix matchPlayerStat 통일) 유지.
 *   신규 prop: events (활동 로그) + allStatsRows (모달 prefetch raw).
 * ============================================================ */

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

// 2026-05-02: 모바일 분기 CSS — grid 인라인 모바일 깨짐 해소
import "./overview-tab.css";

// 5/9 Phase 2: 활동 로그 + 통산 모달
import { ActivityLog, type ActivityEvent } from "./activity-log";
import { StatsDetailModal, type AllStatsRow } from "./stats-detail-modal";

// 외부 import 로 export 통과
export type { ActivityEvent, AllStatsRow };

/** 시즌 스탯 셀 데이터 — overview 탭 전용 8열 (5/9 Q4=C-3)
 *  변경: 6열(경기/승률/PPG/APG/RPG/BPG) → 8열(경기/승률/PPG/RPG/APG/MIN/FG%/3P%)
 *  사유: BPG 우선순위 낮음. NBA 핵심 지표 (FG%/3P%/MIN) 추가. 모바일 4×2 grid 일관성 ↑ */
export interface OverviewSeasonStats {
  games: number;
  winRate: number | null;
  ppg: number | null;
  rpg: number | null;
  apg: number | null;
  /** MIN — career avg minutesPlayed */
  mpg: number | null;
  /** FG% — career avg field_goal_percentage (이미 0~100 범위) */
  fgPct: number | null;
  /** 3P% — career avg three_point_percentage (이미 0~100 범위) */
  threePct: number | null;
}

export interface OverviewTeam {
  id: string;
  name: string;
  primaryColor: string | null;
  logoUrl: string | null;
}

export interface OverviewBadge {
  id: string;
  badgeType: string;
  badgeName: string;
  earnedAt: string;
}

export interface OverviewActivitySummary {
  /** 가입일 ISO */
  joinedAt: string | null;
  /** 통산 경기 참가 수 */
  gamesPlayed: number;
  /** 주최 경기 수 */
  gamesHosted: number;
  /** 지난 로그인 (없으면 "-") */
  lastSeen: string | null;
}

export interface OverviewTabProps {
  stats: OverviewSeasonStats;
  teams: OverviewTeam[];
  badges: OverviewBadge[];
  activity: OverviewActivitySummary;
  /** 자기소개 (PlayerHero 에서 이전 — 카드 비대화 해소, 2026-05-02) */
  bio?: string | null;
  /** 5/9 Phase 2 — 활동 로그 5종 통합 (최신 5건). 빈 배열이면 fallback 메시지 */
  events?: ActivityEvent[];
  /** 5/9 Phase 2 — 통산 모달 prefetch raw rows (Q7=A 클라 groupBy) */
  allStatsRows?: AllStatsRow[];
}

// badge_type → emoji (profile 쪽과 동일 매핑, 중복 수용)
const BADGE_EMOJI: Record<string, string> = {
  court_explorer: "🏟️",
  streak_3: "🔥",
  streak_7: "🔥",
  streak_30: "🔥",
  level_up: "⬆️",
  first_game: "🏀",
  first_win: "🏆",
  winner: "🏆",
  mvp: "⭐",
  three_pointer: "🎯",
  assist_master: "🤝",
  rebound_king: "🛡️",
  all_star: "⭐",
};

function fmtAvg(v: number | null | undefined, digits = 1): string {
  if (v == null) return "-";
  return v.toFixed(digits);
}

function fmtWinRate(v: number | null): string {
  if (v == null) return "-";
  return `${Math.round(v)}%`;
}

// 5/9 신규: FG%/3P% 표시용 (DB 값이 이미 0~100 범위 % 값)
// 0 이면 "-" (경기 1건도 없는 상태) / 표시 시 소수 1자리 + %
function fmtPct(v: number | null): string {
  if (v == null || v === 0) return "-";
  return `${v.toFixed(1)}%`;
}

function fmtYearMonthDay(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "-";
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

function fmtYearMonth(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "-";
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function OverviewTab({
  stats,
  teams,
  badges,
  activity,
  bio,
  events = [],
  allStatsRows = [],
}: OverviewTabProps) {
  // 5/9 Phase 2: 통산 [더보기] 모달 open state (Q3=A 모달 채택)
  const [statsModalOpen, setStatsModalOpen] = useState(false);

  // 5/9 Q4=C-3: 8열 (경기/승률/PPG/RPG/APG/MIN/FG%/3P%) — NBA 충실 + BPG 제거
  // FG%/3P% 는 이미 0~100 범위 % 값 (Decimal field) — fmtPct 로 % 추가
  const seasonCells = [
    { label: "경기", value: stats.games > 0 ? stats.games.toString() : "-" },
    { label: "승률", value: fmtWinRate(stats.winRate) },
    { label: "PPG", value: fmtAvg(stats.ppg) },
    { label: "RPG", value: fmtAvg(stats.rpg) },
    { label: "APG", value: fmtAvg(stats.apg) },
    { label: "MIN", value: fmtAvg(stats.mpg) },
    { label: "FG%", value: fmtPct(stats.fgPct) },
    { label: "3P%", value: fmtPct(stats.threePct) },
  ];

  return (
    <div className="overview-tab__layout">
      {/* ========== 좌측 main ========== */}
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {/* 자기소개 — 2026-05-02: PlayerHero 에서 이전 (카드 비대화 해소). bio 있을 때만 노출 */}
        {bio && (
          <div className="card" style={{ padding: "18px 22px" }}>
            <h2 style={{ margin: "0 0 10px", fontSize: 16, fontWeight: 700, color: "var(--ink)" }}>
              자기소개
            </h2>
            <p
              style={{
                margin: 0,
                fontSize: 14,
                lineHeight: 1.7,
                color: "var(--ink-soft)",
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
              }}
            >
              {bio}
            </p>
          </div>
        )}
        <div className="card" style={{ padding: "22px 24px" }}>
          {/* 5/9 Phase 2: 통산 헤더 + [더보기] 버튼 (Q3=A 모달 채택)
              버튼 = border 0 텍스트 버튼 (CLAUDE.md §디자인 핵심 — 절제된 톤) */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 14,
            }}
          >
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "var(--ink)" }}>
              통산 스탯
            </h2>
            {/* allStatsRows 있을 때만 노출 — 데이터 0 인 사용자는 모달도 무의미 */}
            {allStatsRows.length > 0 && (
              <button
                type="button"
                onClick={() => setStatsModalOpen(true)}
                style={{
                  background: "transparent",
                  border: 0,
                  cursor: "pointer",
                  fontSize: 12,
                  fontWeight: 500,
                  color: "var(--ink-dim)",
                  padding: "4px 6px",
                  borderRadius: 4,
                  transition: "color 120ms ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "var(--ink)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "var(--ink-dim)";
                }}
                aria-label="통산 스탯 상세 보기"
              >
                더보기 →
              </button>
            )}
          </div>
          <div className="overview-tab__season-grid">
            {seasonCells.map((s, i) => (
              <div
                key={s.label}
                style={{
                  padding: "14px 8px",
                  textAlign: "center",
                  borderLeft: i > 0 ? "1px solid var(--border)" : 0,
                  background: "var(--bg-alt)",
                }}
              >
                <div
                  style={{
                    fontFamily: "var(--ff-display)",
                    fontWeight: 900,
                    fontSize: 24,
                    letterSpacing: "-0.01em",
                    color: "var(--ink)",
                  }}
                >
                  {s.value}
                </div>
                <div
                  style={{
                    fontSize: 10.5,
                    color: "var(--ink-dim)",
                    fontWeight: 600,
                    letterSpacing: ".04em",
                    marginTop: 2,
                  }}
                >
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ========== 우측 aside ========== */}
      <aside style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {/* 소속 팀 — 1개 이상일 때만 */}
        {teams.length > 0 && (
          <div className="card" style={{ padding: "18px 20px" }}>
            <div
              style={{
                fontSize: 11,
                color: "var(--ink-dim)",
                fontWeight: 700,
                letterSpacing: ".08em",
                textTransform: "uppercase",
                marginBottom: 10,
              }}
            >
              소속 팀
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {teams.map((t) => {
                const tagInitial = t.name.trim().slice(0, 3).toUpperCase();
                const bg = t.primaryColor ?? "var(--accent)";
                return (
                  <Link
                    key={t.id}
                    href={`/teams/${t.id}`}
                    style={{
                      display: "flex",
                      gap: 10,
                      alignItems: "center",
                      padding: 10,
                      background: "var(--bg-alt)",
                      borderRadius: 6,
                      textDecoration: "none",
                      color: "inherit",
                    }}
                  >
                    <span
                      style={{
                        width: 36,
                        height: 36,
                        background: bg,
                        color: "#fff",
                        display: "grid",
                        placeItems: "center",
                        fontFamily: "var(--ff-mono)",
                        fontSize: 11,
                        fontWeight: 700,
                        borderRadius: 4,
                        overflow: "hidden",
                        flexShrink: 0,
                      }}
                    >
                      {t.logoUrl ? (
                        <Image
                          src={t.logoUrl}
                          alt={t.name}
                          width={36}
                          height={36}
                          // 팀 로고는 비율이 제각각 — contain 으로 잘림 방지 (2026-05-02)
                          style={{ width: "100%", height: "100%", objectFit: "contain" }}
                        />
                      ) : (
                        tagInitial
                      )}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontWeight: 700,
                          fontSize: 13,
                          color: "var(--ink)",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {t.name}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* 5/9 Phase 2: 활동 카드 — 단순 메타 4줄 → 활동 로그 5건 (Q1=A)
            상단 메타 (가입일 / 경기참가 / 주최) 압축 + 활동 로그 (ActivityLog 컴포넌트) */}
        <div className="card" style={{ padding: "18px 20px" }}>
          <div
            style={{
              fontSize: 11,
              color: "var(--ink-dim)",
              fontWeight: 700,
              letterSpacing: ".08em",
              textTransform: "uppercase",
              marginBottom: 8,
            }}
          >
            활동
          </div>
          {/* 압축 메타 — 가입일 / 경기참가 / 주최 (lastSeen 은 Hero 에 위임) */}
          <div
            style={{
              fontSize: 12,
              lineHeight: 1.7,
              color: "var(--ink-dim)",
              marginBottom: 10,
              paddingBottom: 10,
              borderBottom: "1px solid var(--border)",
            }}
          >
            {activity.joinedAt && (
              <>
                가입{" "}
                <span style={{ fontFamily: "var(--ff-mono)", color: "var(--ink-soft)" }}>
                  {fmtYearMonthDay(activity.joinedAt)}
                </span>
                {" · "}
              </>
            )}
            {/* Q2 fix: matchPlayerStat 통일 (page.tsx 에서 statAgg._count.id) */}
            경기 <b style={{ color: "var(--ink)" }}>{activity.gamesPlayed.toLocaleString()}</b>
            {activity.gamesHosted > 0 && (
              <>
                {" · "}주최{" "}
                <b style={{ color: "var(--ink)" }}>{activity.gamesHosted.toLocaleString()}</b>
              </>
            )}
          </div>
          {/* 활동 로그 5건 (ActivityLog 컴포넌트) */}
          <ActivityLog events={events} />
        </div>

        {/* 뱃지 — 1개 이상일 때만 */}
        {badges.length > 0 && (
          <div className="card" style={{ padding: "18px 20px" }}>
            <div
              style={{
                fontSize: 11,
                color: "var(--ink-dim)",
                fontWeight: 700,
                letterSpacing: ".08em",
                textTransform: "uppercase",
                marginBottom: 10,
              }}
            >
              획득 뱃지
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {badges.slice(0, 4).map((b) => (
                <div
                  key={b.id}
                  style={{
                    padding: "12px 8px",
                    background: "var(--bg-alt)",
                    borderRadius: 6,
                    textAlign: "center",
                  }}
                  title={b.badgeName}
                >
                  <div style={{ fontSize: 22 }}>{BADGE_EMOJI[b.badgeType] ?? "🏅"}</div>
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      marginTop: 2,
                      color: "var(--ink)",
                      lineHeight: 1.3,
                      overflow: "hidden",
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                    }}
                  >
                    {b.badgeName}
                  </div>
                  <div
                    style={{
                      fontSize: 10,
                      color: "var(--ink-dim)",
                      fontFamily: "var(--ff-mono)",
                      marginTop: 2,
                    }}
                  >
                    {fmtYearMonth(b.earnedAt)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </aside>

      {/* 5/9 Phase 2: 통산 더보기 모달 (Q3=A) — open 시에만 마운트 (StatsDetailModal 내부 가드) */}
      <StatsDetailModal
        open={statsModalOpen}
        onClose={() => setStatsModalOpen(false)}
        allStatsRows={allStatsRows}
      />
    </div>
  );
}

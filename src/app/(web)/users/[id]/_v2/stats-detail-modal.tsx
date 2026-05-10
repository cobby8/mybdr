"use client";

/* ============================================================
 * StatsDetailModal — /users/[id] v2 통산 더보기 모달 (Phase 2 — 5/9)
 *
 * 왜 (사용자 결정):
 *  - Q3=A: 모달 (인라인 펼침) — 페이지 이동 0 / 탭 변경 0 (Q1=A 2탭 보존)
 *  - Q6=A: 페이지 한정 (`_v2/`) — 데이터 형식이 공개프로필 한정
 *  - Q7=A: findMany 1건 + 클라 groupBy (UserSeasonStat cron 미동작 / Prisma groupBy 한계)
 *  - Q8=A: 최신 우선 (연도 desc / 대회 startDate desc) + 커리어 평균 마지막
 *
 * 어떻게:
 *  - props.allStatsRows: 서버에서 prefetch 한 raw matchPlayerStat 행 배열
 *  - 3 탭: 전체 / 연도별 / 대회별
 *  - groupBy 함수: 연도 = scheduledAt.getFullYear() / 대회 = tournamentId
 *  - 모바일 풀스크린 (≤720px) + 8열 가로 스크롤
 *  - ESC 키 close + 외부 클릭 close + body scroll lock
 * ============================================================ */

import { useEffect, useState } from "react";

// page.tsx 가 raw rows 변환 후 전달하는 타입 (BigInt → string 변환 후)
// 2026-05-10 NBA 표준 fix — fgPct/threePct 단순 % 필드 제거 → made/attempted raw 로 대체
//   사유: 그룹별 sum/sum 계산을 위해 (매치별 % 평균 X). 정환조 매치별 [100,40,0,50,9.1] 평균 39.8% vs 9÷29 = 31.0% 정답
//   minutes 단위 = 분 (page.tsx 가 /60 변환 후 전달)
//   won = winner_team_id 기반 (라이브 매치 winner null 은 false / 확정 매치만 분자·분모)
export type AllStatsRow = {
  points: number;
  rebounds: number;
  assists: number;
  steals: number;
  minutes: number; // 분 (page.tsx 에서 /60 변환 후 전달)
  // NBA 표준 % 계산용 raw made/attempted (sum/sum)
  fgMade: number;
  fgAttempted: number;
  threeMade: number;
  threeAttempted: number;
  ftMade: number;
  ftAttempted: number;
  scheduledAt: string | null; // ISO
  won: boolean; // winner_team_id 기반
  tournamentId: string | null;
  tournamentName: string | null;
  tournamentShortCode: string | null;
};

// 그룹 분해 행 (전체 / 연도별 / 대회별 공용)
type SeasonRow = {
  key: string; // "2026" 또는 tournamentId 또는 "career"
  label: string; // "2026 시즌" 또는 "몰텐배 21회 (MD21)" 또는 "커리어 평균"
  games: number;
  wins: number;
  ppg: number;
  rpg: number;
  apg: number;
  mpg: number;
  fgPct: number; // sum/sum NBA 표준
  threePct: number; // sum/sum NBA 표준
};

type TabKey = "all" | "year" | "tournament";

type Props = {
  open: boolean;
  onClose: () => void;
  allStatsRows: AllStatsRow[];
};

// 누적 평균 헬퍼 — sum / count 후 toFixed(1) 까지 포함된 SeasonRow 생성
// 2026-05-10 NBA 표준 fix:
//   FG%/3P% — 매치별 % 평균 → 누적 메이드/시도 (sum/sum) 변경
//   시도 0 매치도 weight 동등 = 왜곡 회피 (정환조 39.8% vs 31.0% 케이스)
function buildRow(key: string, label: string, rows: AllStatsRow[]): SeasonRow {
  const games = rows.length;
  const wins = rows.filter((r) => r.won).length;
  if (games === 0) {
    return { key, label, games: 0, wins: 0, ppg: 0, rpg: 0, apg: 0, mpg: 0, fgPct: 0, threePct: 0 };
  }
  // 산술 평균 (각 경기 == 1 weight) — counting stats 만
  const sumPts = rows.reduce((s, r) => s + r.points, 0);
  const sumReb = rows.reduce((s, r) => s + r.rebounds, 0);
  const sumAst = rows.reduce((s, r) => s + r.assists, 0);
  const sumMin = rows.reduce((s, r) => s + r.minutes, 0);
  // NBA 표준 % = 누적 made / 누적 attempted (sum/sum) — 매치별 % 평균 X
  const sumFgM = rows.reduce((s, r) => s + r.fgMade, 0);
  const sumFgA = rows.reduce((s, r) => s + r.fgAttempted, 0);
  const sum3pM = rows.reduce((s, r) => s + r.threeMade, 0);
  const sum3pA = rows.reduce((s, r) => s + r.threeAttempted, 0);
  return {
    key,
    label,
    games,
    wins,
    ppg: sumPts / games,
    rpg: sumReb / games,
    apg: sumAst / games,
    mpg: sumMin / games,
    fgPct: sumFgA > 0 ? (sumFgM / sumFgA) * 100 : 0,
    threePct: sum3pA > 0 ? (sum3pM / sum3pA) * 100 : 0,
  };
}

// 연도별 그룹 (Q8: 연도 desc) — scheduledAt NULL 행 제외
function groupByYear(rows: AllStatsRow[]): SeasonRow[] {
  const map = new Map<number, AllStatsRow[]>();
  for (const r of rows) {
    if (!r.scheduledAt) continue;
    const yr = new Date(r.scheduledAt).getFullYear();
    if (isNaN(yr)) continue;
    if (!map.has(yr)) map.set(yr, []);
    map.get(yr)!.push(r);
  }
  return Array.from(map.entries())
    .sort((a, b) => b[0] - a[0]) // 최신 연도 우선
    .map(([yr, list]) => buildRow(String(yr), `${yr} 시즌`, list));
}

// 대회별 그룹 (Q8: tournamentId 기준 / 동일 tournamentId 내 startsAt desc 의미는 약함 — 최신 매치 우선 정렬 후 추출)
function groupByTournament(rows: AllStatsRow[]): SeasonRow[] {
  const map = new Map<string, { name: string; shortCode: string | null; rows: AllStatsRow[]; latestDate: string }>();
  for (const r of rows) {
    if (!r.tournamentId) continue;
    if (!r.scheduledAt) continue;
    const cur = map.get(r.tournamentId);
    if (cur) {
      cur.rows.push(r);
      // 최신 매치 일자 갱신 (정렬 키)
      if (r.scheduledAt > cur.latestDate) cur.latestDate = r.scheduledAt;
    } else {
      map.set(r.tournamentId, {
        name: r.tournamentName ?? "대회",
        shortCode: r.tournamentShortCode,
        rows: [r],
        latestDate: r.scheduledAt,
      });
    }
  }
  return Array.from(map.entries())
    .sort((a, b) => b[1].latestDate.localeCompare(a[1].latestDate)) // 최신 대회 우선
    .map(([tid, v]) =>
      buildRow(tid, v.shortCode ? `${v.name} (${v.shortCode})` : v.name, v.rows),
    );
}

// 표시 헬퍼
function fmtNum(v: number, digits = 1): string {
  if (v === 0) return "-";
  return v.toFixed(digits);
}
function fmtPct(v: number): string {
  if (v === 0) return "-";
  return `${v.toFixed(1)}%`;
}
function fmtWinRate(games: number, wins: number): string {
  if (games === 0) return "-";
  return `${Math.round((wins / games) * 100)}%`;
}

export function StatsDetailModal({ open, onClose, allStatsRows }: Props) {
  const [tab, setTab] = useState<TabKey>("all");

  // 모달 열릴 때 body scroll lock + ESC 핸들러
  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(ev: KeyboardEvent) {
      if (ev.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  // 데이터 가공 (모달 매번 열릴 때마다 — 데이터 100건 미만 가정으로 메모이제이션 생략)
  const careerRow = buildRow("career", "커리어 평균", allStatsRows);
  const yearRows = groupByYear(allStatsRows);
  const tournamentRows = groupByTournament(allStatsRows);

  // 현재 탭에 해당하는 행 + 커리어 평균 (마지막에 강조)
  let displayRows: SeasonRow[] = [];
  if (tab === "all") {
    displayRows = [careerRow];
  } else if (tab === "year") {
    displayRows = [...yearRows, careerRow];
  } else {
    displayRows = [...tournamentRows, careerRow];
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="stats-modal-title"
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.55)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="stats-detail-modal__panel"
        style={{
          background: "var(--color-card, var(--bg))",
          borderRadius: 8,
          maxWidth: 720,
          width: "100%",
          maxHeight: "90vh",
          overflowY: "auto",
          border: "1px solid var(--color-border, var(--border))",
          color: "var(--color-text-primary, var(--ink))",
        }}
      >
        {/* ===== Header ===== */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 20px",
            borderBottom: "1px solid var(--color-border, var(--border))",
            position: "sticky",
            top: 0,
            background: "var(--color-card, var(--bg))",
            zIndex: 1,
          }}
        >
          <h2
            id="stats-modal-title"
            style={{
              margin: 0,
              fontSize: 16,
              fontWeight: 700,
              color: "var(--ink)",
            }}
          >
            통산 스탯 상세
          </h2>
          <button
            onClick={onClose}
            aria-label="닫기"
            style={{
              background: "transparent",
              border: 0,
              cursor: "pointer",
              padding: 4,
              color: "var(--ink-soft)",
              fontSize: 20,
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>

        {/* ===== Tabs ===== */}
        <div
          role="tablist"
          aria-label="통산 분해 보기"
          style={{
            display: "flex",
            gap: 4,
            padding: "12px 20px 0",
            borderBottom: "1px solid var(--color-border, var(--border))",
          }}
        >
          {(
            [
              { key: "all", label: "전체" },
              { key: "year", label: "연도별" },
              { key: "tournament", label: "대회별" },
            ] as { key: TabKey; label: string }[]
          ).map((t) => {
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                role="tab"
                aria-selected={active}
                onClick={() => setTab(t.key)}
                style={{
                  padding: "8px 14px",
                  fontSize: 13,
                  fontWeight: active ? 700 : 500,
                  color: active ? "var(--ink)" : "var(--ink-dim)",
                  background: "transparent",
                  border: 0,
                  borderBottom: active
                    ? "2px solid var(--accent, var(--bdr-red))"
                    : "2px solid transparent",
                  cursor: "pointer",
                  marginBottom: -1,
                }}
              >
                {t.label}
              </button>
            );
          })}
        </div>

        {/* ===== Content ===== */}
        <div style={{ padding: "16px 20px 20px" }}>
          {allStatsRows.length === 0 ? (
            <div
              style={{
                padding: "32px 0",
                textAlign: "center",
                color: "var(--ink-dim)",
                fontSize: 13,
              }}
            >
              집계할 경기 기록이 없어요.
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table
                style={{
                  width: "100%",
                  minWidth: 640,
                  borderCollapse: "collapse",
                  fontSize: 12,
                }}
              >
                <thead>
                  <tr
                    style={{
                      borderBottom: "1px solid var(--color-border, var(--border))",
                      color: "var(--ink-dim)",
                    }}
                  >
                    <th style={thStyle("left")}>구분</th>
                    <th style={thStyle()}>경기</th>
                    <th style={thStyle()}>승률</th>
                    <th style={thStyle()}>PPG</th>
                    <th style={thStyle()}>RPG</th>
                    <th style={thStyle()}>APG</th>
                    <th style={thStyle()}>MIN</th>
                    <th style={thStyle()}>FG%</th>
                    <th style={thStyle()}>3P%</th>
                  </tr>
                </thead>
                <tbody>
                  {displayRows.map((r, i) => {
                    const isCareer = r.key === "career";
                    return (
                      <tr
                        key={r.key}
                        style={{
                          borderBottom:
                            i === displayRows.length - 1
                              ? 0
                              : "1px solid var(--color-border, var(--border))",
                          fontWeight: isCareer ? 700 : 500,
                          background: isCareer ? "var(--bg-alt)" : undefined,
                          color: isCareer ? "var(--ink)" : "var(--ink-soft)",
                        }}
                      >
                        <td style={tdStyle("left")}>{r.label}</td>
                        <td style={tdStyle()}>{r.games > 0 ? r.games : "-"}</td>
                        <td style={tdStyle()}>{fmtWinRate(r.games, r.wins)}</td>
                        <td style={tdStyle()}>{fmtNum(r.ppg)}</td>
                        <td style={tdStyle()}>{fmtNum(r.rpg)}</td>
                        <td style={tdStyle()}>{fmtNum(r.apg)}</td>
                        <td style={tdStyle()}>{fmtNum(r.mpg)}</td>
                        <td style={tdStyle()}>{fmtPct(r.fgPct)}</td>
                        <td style={tdStyle()}>{fmtPct(r.threePct)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// 표 cell 공통 스타일
function thStyle(align: "left" | "right" = "right"): React.CSSProperties {
  return {
    padding: "8px 6px",
    textAlign: align,
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: ".04em",
    textTransform: "uppercase",
    whiteSpace: "nowrap",
  };
}
function tdStyle(align: "left" | "right" = "right"): React.CSSProperties {
  return {
    padding: "10px 6px",
    textAlign: align,
    fontFamily: align === "right" ? "var(--ff-mono)" : undefined,
    whiteSpace: "nowrap",
  };
}

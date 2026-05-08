/* ============================================================
 * CareerStatsGrid — 통산 8열 카드 그리드 (글로벌 컴포넌트)
 *
 * 왜 (사용자 결정 Q5=Y-2):
 * - 공개 프로필 (`/users/[id]` Phase 1) 의 8열 통산 그리드를 글로벌 추출.
 * - 마이페이지 내 농구 (`/profile/basketball`) 에서도 같은 그리드 재사용.
 * - 두 페이지 동일 컴포넌트 → 정합성 자동 보장 + 유지보수 1곳.
 *
 * 어떻게:
 * - props: stats 8열 (games/winRate/ppg/rpg/apg/mpg/fgPct/threePct) + onShowMore 옵션
 * - onShowMore 있으면 우상단 [더보기 →] 버튼 노출 (StatsDetailModal trigger 부모에서 wire-up)
 * - PC 8열 / 모바일 4×2 (overview-tab.css 의 `.overview-tab__season-grid` 클래스 그대로 사용)
 * - "use client" 불필요 — onShowMore 는 부모 client wrapper 에서 wire-up
 *
 * 5/9 추출 작업 (overview-tab.tsx 안 grid → 글로벌 컴포넌트화)
 *  - props 시그니처 = 기존 OverviewSeasonStats 와 동일 (호환성 보장)
 *  - JSX 동등 변경 (회귀 0 검증)
 * ============================================================ */

// 모바일 4×2 분기용 — 글로벌 컴포넌트 전용 css (overview-tab.css 와 동일 룰)
import "./career-stats-grid.css";

// 통산 8열 (5/9 Q4=C-3) — BPG 제거 + MIN/FG%/3P% 추가
// FG%/3P% 는 이미 0~100 범위 % 값 (Decimal field) — fmtPct 로 % 표기
export interface CareerStats {
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

export interface CareerStatsGridProps {
  stats: CareerStats;
  /** 클릭 시 통산 더보기 모달 (StatsDetailModal) trigger. 없으면 [더보기 →] 버튼 미렌더링 */
  onShowMore?: () => void;
  /** 헤더 타이틀 — 기본 "통산 스탯". 다른 컨텍스트에서 변경 가능 */
  title?: string;
}

// 평균값 포맷 — null 시 "-"
function fmtAvg(v: number | null | undefined, digits = 1): string {
  if (v == null) return "-";
  return v.toFixed(digits);
}

// 승률 포맷 — null 시 "-"
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

export function CareerStatsGrid({ stats, onShowMore, title = "통산 스탯" }: CareerStatsGridProps) {
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
    <div className="card" style={{ padding: "22px 24px" }}>
      {/* 헤더 + [더보기 →] 버튼 (onShowMore 있을 때만) */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 14,
        }}
      >
        <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "var(--ink)" }}>
          {title}
        </h2>
        {/* 더보기 버튼 — onShowMore 콜백 + 데이터 0 아닐 때만 (의미 있을 때만) */}
        {onShowMore && stats.games > 0 && (
          <button
            type="button"
            onClick={onShowMore}
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
      {/* 8열 grid — overview-tab.css 의 모바일 4×2 분기 그대로 활용 */}
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
  );
}

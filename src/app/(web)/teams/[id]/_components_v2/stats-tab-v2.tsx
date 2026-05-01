/**
 * StatsTabV2
 * ─────────────────────────────────────────────────────────
 * v2 시안 `TeamDetail.jsx` tab === 'stats' 재현.
 *
 * 이유(왜): 시안의 기록 탭은 "2026 시즌 평균" 단일 h2 + 4카드 grid
 * (득점 / 실점 / 리바 / 어시). 기존 프로젝트엔 대응 탭이 없었다.
 *
 * 방법(어떻게):
 * - `.card` 안에 `<h2>` + 4열 grid (PC) / 2열 grid (모바일 ≤720px).
 * - 각 카드: `var(--bg-alt)` 배경 + `var(--radius-chip)` radius
 *   + 라벨(11px ff-display 700 uppercase) + 값(28px ff-display 900).
 *
 * 2026-05-02 Phase C 갱신 (사용자 결정 2=A):
 * - 인라인 `gridTemplateColumns: repeat(4, 1fr)` → `.team-stats-grid` className 교체.
 * - 별도 `stats-tab-v2.css` 에서 모바일 ≤720px `repeat(2, 1fr)` 분기 정의.
 * - errors.md 04-29 8건 재발 회귀 패턴 차단 (인라인 grid 안티패턴).
 *
 * DB 매핑 / 미지원:
 * - 팀 시즌 평균 집계 쿼리는 추후 추가 (match_player_stat 집계).
 *   현재는 전부 "—" placeholder. 섹션 상단에 "준비 중" 안내 문구 추가.
 */

import "./stats-tab-v2.css";

export function StatsTabV2() {
  // 시안 샘플 라벨 4종. 실데이터 붙이기 전까진 값=null.
  const stats: { label: string; value: string | null }[] = [
    { label: "득점", value: null },
    { label: "실점", value: null },
    { label: "리바", value: null },
    { label: "어시", value: null },
  ];

  return (
    <div className="card" style={{ padding: 22 }}>
      <div
        className="flex items-baseline justify-between"
        style={{ marginBottom: 16 }}
      >
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>
          2026 시즌 평균
        </h2>
        {/* 준비 중 안내 — 데이터가 없다는 걸 명시적으로 커뮤니케이션 */}
        <span
          style={{
            fontSize: 12,
            color: "var(--ink-mute)",
            fontFamily: "var(--ff-display)",
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            fontWeight: 700,
          }}
        >
          준비 중
        </span>
      </div>
      {/* className 분기 — stats-tab-v2.css 에서 PC repeat(4,1fr) / 모바일 ≤720px repeat(2,1fr) */}
      <div className="team-stats-grid">
        {stats.map((s) => (
          <div
            key={s.label}
            style={{
              padding: "14px 16px",
              background: "var(--bg-alt)",
              borderRadius: "var(--radius-chip)",
            }}
          >
            <div
              style={{
                fontSize: 11,
                color: "var(--ink-dim)",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                fontWeight: 700,
              }}
            >
              {s.label}
            </div>
            <div
              style={{
                fontFamily: "var(--ff-display)",
                fontWeight: 900,
                fontSize: 28,
                marginTop: 4,
                letterSpacing: "-0.02em",
                color: s.value ? "var(--ink)" : "var(--ink-mute)",
              }}
            >
              {s.value ?? "—"}
            </div>
          </div>
        ))}
      </div>
      {/* 하단 footnote — 왜 값이 없는지 사용자에게 설명 */}
      <p
        style={{
          margin: "14px 0 0",
          fontSize: 12,
          color: "var(--ink-mute)",
          lineHeight: 1.6,
        }}
      >
        팀 시즌 평균 집계는 경기 기록이 충분히 쌓이면 자동으로 표시됩니다.
      </p>
    </div>
  );
}

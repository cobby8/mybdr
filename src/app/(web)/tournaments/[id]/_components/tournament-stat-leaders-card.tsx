/**
 * 대회 종료 — 카드 03 스탯 리더 (B안 §3)
 *
 * 시안 원본: td-completed.jsx ResultPane L204~223 (tc-card--leaders / tdc-leaders)
 *
 * 운영 데이터 매핑:
 *   - getStatLeaders(tournamentId) 의 4부문 TOP3 (대회 누적 합) — match_player_stats 집계
 *   - 시안 mock C_LEADERS 박제 ❌ → props leaders 와이어
 *
 * Hide 조건:
 *   - leaders === null (스탯 미기록 대회 / 부문 전부 0) → 카드 자체 미렌더
 *
 * 시안 css: tournament-completed.css `.tdc-leaders*` 박제 (append)
 *   강조색: is-top 행 = var(--cafe-blue) 계열 (시안 --accent 빨강 → 치환됨)
 */

import type { StatLeaders } from "@/lib/tournaments/stat-leaders";

interface Props {
  /** getStatLeaders 결과 — null 이면 카드 hide */
  leaders: StatLeaders | null;
}

/** 팀명/선수명 이니셜 (TeamDot 대체 — 시안 mock 색조 대신 운영 이니셜 dot) */
function getInitial(name: string): string {
  const trimmed = name.trim();
  return trimmed ? trimmed.slice(0, 1) : "?";
}

export function TournamentStatLeadersCard({ leaders }: Props) {
  // 데이터 0 → 카드 미렌더 (UB1 패턴)
  if (!leaders || leaders.length === 0) return null;

  return (
    <article className="tc-card tc-card--leaders">
      <header className="tc-card__head">
        <span className="tc-card__num">03</span>
        <h2 className="tc-card__h">스탯 리더</h2>
        <span className="tc-card__sub">대회 누적 · 부문별 TOP 3</span>
      </header>
      <div className="tdc-leaders">
        {leaders.map((cat) => (
          <div key={cat.cat} className="tdc-leadcat">
            <div className="tdc-leadcat__h">
              <span className="tdc-leadcat__cat">{cat.cat}</span>
              <span className="tdc-leadcat__unit">{cat.unit}</span>
            </div>
            <ol className="tdc-leadlist">
              {cat.rows.map((r, i) => (
                <li
                  key={`${r.ttpId}-${i}`}
                  className={"tdc-leadrow" + (i === 0 ? " is-top" : "")}
                >
                  <span className="tdc-leadrow__rk">{i + 1}</span>
                  {/* TeamDot 대체 — 팀명 이니셜 dot (시안 mock hsl 색조 미사용) */}
                  <span
                    className="tdc-leadrow__dot"
                    style={{ width: i === 0 ? 30 : 24, height: i === 0 ? 30 : 24 }}
                  >
                    {getInitial(r.teamName ?? r.playerName)}
                  </span>
                  <span className="tdc-leadrow__id">
                    <b>{r.playerName}</b>
                    <small>{r.teamName ?? "-"}</small>
                  </span>
                  <span className="tdc-leadrow__v">{r.value}</span>
                </li>
              ))}
            </ol>
          </div>
        ))}
      </div>
    </article>
  );
}

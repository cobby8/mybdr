/**
 * UB1 시안 — 카드 01 최종 순위
 *
 * 시안 원본: Dev/design/BDR-current/screens/TournamentCompleted.jsx L66~92
 *
 * 운영 데이터 매핑:
 *  - TournamentTeam.final_rank (1=우승, 2=준우승, 3=공동 3위) + team relation
 *  - 종별 (division) 표시는 시안 sub 라인. 단일 종별이면 그대로, 복수 종별이면 "전체" 또는 첫 종별 라벨
 *
 * Hide 조건:
 *  - standings.length === 0 (final_rank 미설정 대회) → 카드 자체 미렌더 (부모가 가드)
 *
 * 시안 css: tournament-completed.css `.tc-stand*` 박제
 */

import Link from "next/link";

interface StandingEntry {
  /** 최종 순위 (1/2/3) */
  rank: number;
  /** 팀 ID (Team.id BigInt → string) — Link 라우팅용 */
  teamId: string;
  /** 팀명 */
  teamName: string;
  /** 팀 로고 URL (null 시 이니셜 fallback) */
  teamLogoUrl: string | null;
}

interface Props {
  /** standings (rank 1,2,3 만) — final_rank null 제외하고 정렬된 배열 */
  standings: StandingEntry[];
  /** 종별 라벨 (예: "일반부" / "전체") — 카드 sub 라인 */
  divisionLabel: string;
}

/**
 * 시안 라벨 매핑: rank → 한국어 라벨 + 메달 이모지
 * rank=3 은 시안에서 "공동 3위" 로 표기 (4강 진출 2팀 동률 의도)
 */
function getRankLabel(rank: number): string {
  if (rank === 1) return "🥇 우승";
  if (rank === 2) return "🥈 준우승";
  if (rank === 3) return "🥉 공동 3위";
  // 4 이상 — 4강 진출 등. 시안 의도 외이지만 운영 데이터 안전성 위해 fallback
  return `${rank}위`;
}

function getInitials(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return "?";
  const words = trimmed.split(/\s+/);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return trimmed.slice(0, 2).toUpperCase();
}

export function TournamentFinalStandingsCard({
  standings,
  divisionLabel,
}: Props) {
  // 부모(page.tsx)가 standings.length === 0 이면 본 컴포넌트 미렌더한다는 가정
  // 안전 가드 — 빈 배열이면 null
  if (standings.length === 0) return null;

  return (
    <article className="tc-card tc-card--standings">
      <header className="tc-card__head">
        <span className="tc-card__num">01</span>
        <h2 className="tc-card__h">최종 순위</h2>
        <span className="tc-card__sub">{divisionLabel} 종별</span>
      </header>
      <ol className="tc-stand">
        {standings.map((s, i) => (
          <li
            key={`${s.teamId}-${i}`}
            className={"tc-stand__row" + (s.rank === 1 ? " is-champ" : "")}
          >
            <span className="tc-stand__label">{getRankLabel(s.rank)}</span>
            <span className="tc-stand__logo">
              {s.teamLogoUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={s.teamLogoUrl} alt={s.teamName} />
              ) : (
                getInitials(s.teamName)
              )}
            </span>
            <span className="tc-stand__team">{s.teamName}</span>
          </li>
        ))}
      </ol>
      {/* 시안 "전체 8강 보기" 라우트는 운영 미지원 → bracket 탭 이동으로 대체 */}
      <Link
        href="?tab=bracket"
        scroll={false}
        className="btn btn--ghost btn--sm tc-card__more"
      >
        전체 대진표 보기 →
      </Link>
    </article>
  );
}

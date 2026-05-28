/**
 * UB1 시안 — 카드 04 대회 알기자 (스토리)
 *
 * 시안 원본: Dev/design/BDR-current/screens/TournamentCompleted.jsx L144~160
 *
 * 운영 데이터 매핑:
 *  - tournament.description (자유 텍스트) → title 자동 추출 + excerpt 본문
 *  - description 길이 ≥ 60자 일 때만 노출 (너무 짧으면 hero 정보와 중복)
 *
 * Hide 조건:
 *  - description null / 빈 문자열 / 60자 미만 → 카드 미렌더
 *
 * 시안 css: tournament-completed.css `.tc-story*` 박제
 */

interface Props {
  /** 대회 description — null/빈 시 카드 미렌더 */
  description: string | null;
  /** 대회명 — title 폴백용 (description 안에 제목 분리 안 되어 있을 때) */
  tournamentName: string;
}

const MIN_LENGTH = 60; // 너무 짧은 description = 의미 없는 hero 중복 → 안 띄움

export function TournamentStoryCard({ description, tournamentName }: Props) {
  // 가드: 의미있는 본문이 있을 때만 렌더
  if (!description || description.trim().length < MIN_LENGTH) return null;

  const trimmed = description.trim();

  // 시안 title/excerpt 분리:
  //  - description 첫 줄 ≤ 50자 = 제목으로 인식
  //  - 그 외 = "{대회명} 결산" 폴백 제목 + 전체 description = excerpt
  const lines = trimmed.split(/\n/).map((l) => l.trim()).filter(Boolean);
  let title: string;
  let excerpt: string;
  if (lines.length >= 2 && lines[0].length <= 50) {
    title = lines[0];
    excerpt = lines.slice(1).join("\n");
  } else {
    // 폴백: "{대회명} 결산"
    title = `${tournamentName} 결산`;
    excerpt = trimmed;
  }

  // excerpt 너무 길면 시안 카드 균형 위해 잘라서 표시 (overlay scroll ❌)
  const MAX_EXCERPT = 240;
  const excerptShown =
    excerpt.length > MAX_EXCERPT ? excerpt.slice(0, MAX_EXCERPT) + "…" : excerpt;

  return (
    <article className="tc-card tc-card--story">
      <header className="tc-card__head">
        <span className="tc-card__num">04</span>
        <h2 className="tc-card__h">대회 알기자</h2>
        <span className="tc-card__sub">결산</span>
      </header>
      <div className="tc-story">
        <div className="tc-story__chip">📰 종료 발표문</div>
        <h3 className="tc-story__title">{title}</h3>
        {/* whitespace pre-line 으로 description 줄바꿈 보존 */}
        <p className="tc-story__excerpt">{excerptShown}</p>
        {/* 시안 "전문 보기" 버튼은 운영 별도 상세 페이지 없으므로 보류 — 카드 내 전체 노출로 갈음 */}
      </div>
    </article>
  );
}

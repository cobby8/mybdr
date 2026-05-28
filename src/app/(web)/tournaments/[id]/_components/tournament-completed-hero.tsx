/**
 * UB1 시안 — 종료 발표 Hero band (champion + 메타 + 통계)
 *
 * 시안 원본: Dev/design/BDR-current/screens/TournamentCompleted.jsx L19~64
 *
 * 노출 조건:
 *  - tournament.status === 'completed' 일 때만 page.tsx 가 렌더 (분기 책임은 부모)
 *
 * 데이터 매핑:
 *  - champion null (champion_team_id 미설정 대회) → 우승팀 영역 hide, 헤더만 "종료된 대회"
 *  - 4 통계 카드 (엔트리/무패/평균득점/평균마진) → 운영 데이터 부재
 *    · 엔트리 = team_count (정원 참가팀 수) — 진짜
 *    · 무패/평균득점/평균마진 = 운영 미지원 → hide (mock 사용 ❌, 의뢰서 §3 제약)
 *
 * 시안 css: tournament-completed.css `.tc-hero*` 박제
 */

interface Champion {
  /** 우승 팀명 */
  name: string;
  /** 팀 로고 URL (null이면 이니셜 fallback) */
  logoUrl: string | null;
  /** 엔트리 (참가 선수 수). null 시 통계 카드 hide */
  rosterCount: number | null;
}

interface Props {
  /** 대회명 (eyebrow 라인에 표시: "{name} · {edition} CHAMPION") */
  tournamentName: string;
  /** 회차 라벨 (예: "Vol.21"). null 시 "CHAMPION" 만 표시 */
  editionLabel: string | null;
  /** 우승팀 정보. null 시 fallback "종료된 대회" 헤더만 노출 (carousel/hero 부분만 변경) */
  champion: Champion | null;
  /** 종료일 (KR 포맷) — meta line 좌측 */
  endedAt: Date | null;
  /** 개최 장소 — meta line 중앙 */
  venueName: string | null;
  /** 종별 배열 (예: ["일반부", "마스터즈"]) — meta line 우측. join(' · ') */
  divisions: string[];
}

/**
 * 팀명 이니셜 추출 — 로고 이미지 없을 때 시안 hero__logo 안 텍스트 폴백
 * 한글 첫 글자 또는 영문 단어 이니셜 2자.
 */
function getInitials(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return "?";
  // 영문 / 한글 혼용 — 첫 1~2 글자 추출
  const words = trimmed.split(/\s+/);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  // 한 단어 — 앞 2자
  return trimmed.slice(0, 2).toUpperCase();
}

export function TournamentCompletedHero({
  tournamentName,
  editionLabel,
  champion,
  endedAt,
  venueName,
  divisions,
}: Props) {
  // 시안 eyebrow 라인: "🏆 {name} · {edition} CHAMPION"
  // edition 없으면 "🏆 {name} · CHAMPION"
  const eyebrowTrail = editionLabel
    ? `${tournamentName} · ${editionLabel} CHAMPION`
    : `${tournamentName} · CHAMPION`;

  // 종료일 한국어 포맷 — 시안 mock "2026.10.20" 같이 yyyy.MM.dd
  const endedAtText = endedAt
    ? endedAt.toLocaleDateString("ko-KR", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).replace(/\./g, ".").replace(/\s/g, "")
    : null;

  // meta line 조각들 — 비어있는 항목은 sep 함께 제외
  const metaParts: string[] = [];
  if (endedAtText) metaParts.push(endedAtText);
  if (venueName) metaParts.push(venueName);
  if (divisions.length > 0) metaParts.push(divisions.join(" · "));

  return (
    <div className="tc-hero">
      {/* 배경: radial-gradient 2 layer + 베이스 그라데이션 */}
      <div className="tc-hero__bg" />
      {/* 패턴: 45도 + -45도 라인 오버레이 */}
      <div className="tc-hero__pattern" />
      <div className="tc-hero__content">
        {/* eyebrow — 🏆 트로피 + 대회명 + CHAMPION */}
        <div className="tc-hero__eyebrow">
          <span className="tc-hero__trophy">🏆</span>
          <span>{champion ? eyebrowTrail : `${tournamentName} · 종료`}</span>
        </div>

        {/* 우승팀 영역 — champion null 시 fallback 텍스트로 대체 (logo box 미노출) */}
        {champion ? (
          <div className="tc-hero__team">
            <div className="tc-hero__logo">
              {/* 로고 이미지 있으면 img, 없으면 이니셜 */}
              {champion.logoUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={champion.logoUrl} alt={champion.name} />
              ) : (
                getInitials(champion.name)
              )}
            </div>
            <h1 className="tc-hero__name">{champion.name}</h1>
          </div>
        ) : (
          // 우승팀 미지정 대회 = 헤더만 노출 ("종료된 대회") — 시안 변형 (placeholder mock ❌)
          <div className="tc-hero__team">
            <h1 className="tc-hero__name">종료된 대회</h1>
          </div>
        )}

        {/* meta line — 종료일 · 장소 · 종별 */}
        {metaParts.length > 0 && (
          <div className="tc-hero__meta">
            {metaParts.map((p, i) => (
              <span key={i}>
                {i > 0 && <span className="tc-hero__sep" style={{ marginRight: 8 }}>·</span>}
                {p}
              </span>
            ))}
          </div>
        )}

        {/* 통계 카드 4종 — champion 의 roster_count 만 진짜 (엔트리). 나머지 3종 (무패/평균득점/평균마진) 운영 데이터 X → hide */}
        {champion && champion.rosterCount !== null && (
          <div className="tc-hero__stats">
            <div className="tc-hero__stat">
              <span className="tc-hero__stat-v">{champion.rosterCount}</span>
              <span className="tc-hero__stat-l">엔트리</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

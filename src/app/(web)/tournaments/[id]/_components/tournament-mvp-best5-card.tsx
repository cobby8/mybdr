/**
 * UB1 시안 — 카드 02 MVP · 베스트5
 *
 * 시안 원본: Dev/design/BDR-current/screens/TournamentCompleted.jsx L94~121
 *
 * 운영 데이터 매핑:
 *  - tournament.mvp_player_id + users relation (nickname / profile_image)
 *  - 베스트5 운영 미지원 → MVP only fallback (시안 best5 영역 미렌더)
 *
 * Hide 조건:
 *  - mvp null → 카드 전체 미렌더 (부모 page.tsx 가드)
 *
 * 시안 css: tournament-completed.css `.tc-mvp*` / `.tc-best5*` 박제
 */

interface MvpPlayer {
  /** 선수 이름 (nickname > name > 이메일 폴백) */
  name: string;
  /** 소속팀 (선수의 사용자 프로필상 팀 — null 시 미표시) */
  teamName: string | null;
  /** 프로필 이미지 URL (null 시 ⭐ 이모지) */
  profileImageUrl: string | null;
  /** 통계 텍스트 (운영 미지원 → null. 운영 미지원이라 시안 mock "평균 24.8 PTS · 6.4 AST" 안 함) */
  statText: string | null;
}

interface Props {
  /** MVP 정보 — null 시 부모가 본 카드 미렌더 */
  mvp: MvpPlayer | null;
}

export function TournamentMvpBest5Card({ mvp }: Props) {
  // 부모(page.tsx) 가 mvp null 시 미렌더하지만 안전 가드
  if (!mvp) return null;

  return (
    <article className="tc-card tc-card--mvp">
      <header className="tc-card__head">
        <span className="tc-card__num">02</span>
        <h2 className="tc-card__h">MVP{/* 베스트5 운영 미지원 → 시안 헤더 "MVP · 베스트5" 에서 ·베스트5 제외 */}</h2>
      </header>
      {/* MVP 강조 카드 — gradient 배경 + 좌측 아바타 + 우측 정보 */}
      <div className="tc-mvp">
        <div className="tc-mvp__av">
          {mvp.profileImageUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={mvp.profileImageUrl} alt={mvp.name} />
          ) : (
            // 시안 mock 이모지 "⭐" — 사진 없을 때 그대로 사용
            <span aria-hidden>⭐</span>
          )}
        </div>
        <div className="tc-mvp__body">
          <div className="tc-mvp__title">MVP {mvp.name}</div>
          {mvp.teamName && <div className="tc-mvp__team">{mvp.teamName}</div>}
          {/* 통계 운영 미지원 → statText null 일 때 hide. mock 사용 ❌ (의뢰서 §3 제약) */}
          {mvp.statText && <div className="tc-mvp__stat">{mvp.statText}</div>}
        </div>
      </div>
      {/* 베스트5 영역 — 운영 데이터 X → 미렌더 (mock 사용 ❌). 향후 best5 API 확장 시 자연 흡수 가능 */}
    </article>
  );
}

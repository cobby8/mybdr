// ============================================================
// AdminCompletedHero — PR-1C-13 PA7 (D1 · 종료 후 hub 신규 라우트)
//   시안 BDR-current/screens/AdminTournamentCompleted.jsx 의 acp-hero 박제.
//   우승팀 + MVP + 종료 일자 hero. champion null 시 fallback (트로피 + 미확정).
//
// 이유 (왜):
//   - UB1 (사용자 측 종료) 와 동일한 champion_team_id / mvp 데이터를 관리자
//     측에서도 재사용. 새 query 0 — page.tsx 가 relation 으로 넘긴 값만 표시.
//   - mock 점수("78:65") / mock MVP 스탯("평균 24.3득점") 은 운영 미보유 →
//     hide (가짜 데이터 ❌). 우승팀명 / MVP명 / 종료일만 진짜 데이터.
// ============================================================

interface AdminCompletedHeroProps {
  tournamentName: string; // 대회명
  edition?: string | null; // 회차 라벨 (예: "Vol.7") — 없으면 미표시
  championName?: string | null; // 우승팀명 (champion_team_id relation) — null 시 fallback
  mvpName?: string | null; // MVP 선수명 (mvp_player_id relation) — null 시 hide
  endedAt?: Date | null; // 종료 일자 (endDate) — null 시 hide
}

export function AdminCompletedHero({
  tournamentName,
  edition,
  championName,
  mvpName,
  endedAt,
}: AdminCompletedHeroProps) {
  // 우승팀 확정 여부 — null 이면 fallback 문구 (mock 채움 ❌)
  const hasChampion = !!championName;

  // 종료 일자 분리 표기 (시안 acp-hero__date — "03·16" / "2026")
  //   운영 KST 기준 월·일 / 연도. null 이면 date 블록 hide.
  const dateMonthDay = endedAt
    ? `${String(endedAt.getMonth() + 1).padStart(2, "0")}·${String(
        endedAt.getDate()
      ).padStart(2, "0")}`
    : null;
  const dateYear = endedAt ? endedAt.getFullYear() : null;

  return (
    <div className="acp-hero">
      {/* 🏆 트로피 — 우승 확정/미확정 무관 항상 표시 (hub 의 상징) */}
      <div className="acp-hero__trophy">
        <span style={{ fontSize: 40 }}>🏆</span>
      </div>

      <div className="acp-hero__body">
        <div className="acp-hero__eyebrow">
          CHAMPION · {tournamentName}
          {edition ? ` ${edition}` : ""}
        </div>
        {hasChampion ? (
          <>
            {/* 우승팀 확정 — 진짜 데이터 */}
            <div className="acp-hero__title">{championName}</div>
            <div className="acp-hero__name">우승</div>
            {/* MVP — 있을 때만 (mock 스탯 미표시) */}
            {mvpName && (
              <div className="acp-hero__mvp">
                <span
                  style={{
                    fontFamily: "var(--ff-mono)",
                    fontSize: 10.5,
                    opacity: 0.7,
                    letterSpacing: "0.06em",
                  }}
                >
                  MVP
                </span>
                <b>{mvpName}</b>
              </div>
            )}
          </>
        ) : (
          <>
            {/* 우승팀 미확정 fallback — mock 채움 회피 */}
            <div className="acp-hero__title">우승팀 미확정</div>
            <div className="acp-hero__name">
              결과 박제에서 우승팀·MVP를 확정하면 여기에 표시돼요.
            </div>
          </>
        )}
      </div>

      {/* 종료 일자 — endDate 있을 때만 */}
      {dateMonthDay && (
        <div className="acp-hero__date">
          종료
          <b>{dateMonthDay}</b>
          {dateYear}
        </div>
      )}
    </div>
  );
}

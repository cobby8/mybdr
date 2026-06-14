/* ============================================================
 * /calendar — 내 일정 (My Calendar) · 준비중 빈상태 (Phase 12 Batch B v2.31)
 *
 * 왜 빈상태로 바꾸는가:
 *  - 본인 일정 통합 집계는 game_applications + guest_applications +
 *    tournament_matches + scrim 다종 join API 가 필요한데 부재 → 대형 신규 로직 = Stop condition.
 *  - 기존 더미(EVENTS 17건 + 하드코딩 TODAY + 월그리드 계산/필터/뷰토글)는 mock 이므로 전량 삭제.
 *
 * 어떻게:
 *  - "use client" 제거 → 서버 컴포넌트(인터랙션 0). useState/useEffect/달력계산 전부 제거.
 *  - 공용 .ex-* 셸(crumb/head/empty) 재사용. DB 호출 0 / API 0.
 *  - active 탭(more)은 app-nav 의 pathname 자동판정(/calendar) → prop 조작 0.
 * ============================================================ */

import Link from "next/link";

export default function CalendarPage() {
  return (
    <div className="page">
      <div className="ex-page-w">
        {/* 브레드크럼 — 홈 › 내 일정 */}
        <div className="ex-crumb">
          <Link href="/">홈</Link>
          <span className="sep">›</span>
          <span className="cur">내 일정</span>
        </div>

        {/* 페이지 헤더 */}
        <div className="ex-head">
          <div>
            <div className="eyebrow">CALENDAR · 내 일정</div>
            <h1 className="ex-head__title">내 일정</h1>
            <p className="ex-head__sub">
              참가 예정 경기·대회·코트 예약을 한 달력에서 모아 보는 기능입니다.
            </p>
          </div>
        </div>

        {/* 준비중 빈상태 */}
        <div className="card">
          <div className="ex-empty">
            <span className="ico material-symbols-outlined">calendar_month</span>
            <div className="ex-empty__t">내 일정 준비 중</div>
            <div className="ex-empty__d">
              참가 예정 경기·대회·코트 예약을 한 달력에서 관리하는 기능을 준비 중입니다.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

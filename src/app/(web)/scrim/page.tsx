/* ============================================================
 * /scrim — 스크림 매칭 (Scrimmage) · 준비중 빈상태 (Phase 12 Batch B v2.31)
 *
 * 왜 빈상태로 바꾸는가:
 *  - scrim_* 테이블 부재(grep 0). 스크림 매칭 모델 신규 = Stop condition.
 *  - 기존 더미(OPEN_REQS/INCOMING/OUTGOING/HISTORY 4상수 + 3탭 + me-bar +
 *    ResponsiveTable)는 mock 이므로 전량 삭제.
 *
 * 어떻게:
 *  - "use client" 제거 → 서버 컴포넌트(인터랙션 0). useState/탭/테이블 전부 제거.
 *  - 공용 .ex-* 셸(crumb/head/empty) 재사용. DB 호출 0 / API 0.
 *  - active 탭(games)은 app-nav 의 pathname 자동판정(/scrim) → prop 조작 0.
 * ============================================================ */

import Link from "next/link";

export default function ScrimPage() {
  return (
    <div className="page">
      <div className="ex-page-w">
        {/* 브레드크럼 — 홈 › 스크림 매칭 */}
        <div className="ex-crumb">
          <Link href="/">홈</Link>
          <span className="sep">›</span>
          <span className="cur">스크림 매칭</span>
        </div>

        {/* 페이지 헤더 */}
        <div className="ex-head">
          <div>
            <div className="eyebrow">스크림 · SCRIMMAGE</div>
            <h1 className="ex-head__title">스크림 매칭</h1>
            <p className="ex-head__sub">
              내 팀 레이팅에 맞는 상대를 찾고, 팀 vs 팀 연습경기 제안을 주고받는 기능입니다.
            </p>
          </div>
        </div>

        {/* 준비중 빈상태 */}
        <div className="card">
          <div className="ex-empty">
            <span className="ico material-symbols-outlined">handshake</span>
            <div className="ex-empty__t">스크림 매칭 준비 중</div>
            <div className="ex-empty__d">
              팀 vs 팀 연습경기 상대를 찾고 제안을 주고받는 기능을 준비 중입니다.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

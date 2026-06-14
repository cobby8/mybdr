/* ============================================================
 * TeamInviteClient — 팀 초대 · 준비중 빈상태 (Phase 12 Batch B v2.31)
 *
 * 왜 빈상태로 바꾸는가:
 *  - TeamInvitation 테이블 부재(grep 0). 초대코드/만료/메시지/등번호 필드 없음.
 *    초대 흐름 모델 신규 = Stop condition.
 *  - 시안 카드를 실데이터 없이 박제하면 가짜 초대(MONKEYZ 1812 등) 노출 위험(mock)
 *    이므로, 기존 인라인 더미(team/inviter/invite/ROSTER 등)를 전량 삭제하고
 *    .ex-empty 빈상태로 정직 처리.
 *
 * 어떻게:
 *  - "use client" 제거 → 서버 컴포넌트(인터랙션 0). useState/수락·거절 분기 전부 제거.
 *  - page.tsx(metadata 보존)에서 그대로 import 되어 렌더됨.
 *  - 공용 .ex-* 셸(crumb/head/empty) 재사용. DB 호출 0 / API 0.
 *  - active 탭(team)은 app-nav 의 pathname 자동판정(/team-invite) → prop 조작 0.
 * ============================================================ */

import Link from "next/link";

export default function TeamInviteClient() {
  return (
    <div className="page">
      <div className="ex-page-w">
        {/* 브레드크럼 — 홈 › 팀 › 팀 초대 */}
        <div className="ex-crumb">
          <Link href="/">홈</Link>
          <span className="sep">›</span>
          <Link href="/teams">팀</Link>
          <span className="sep">›</span>
          <span className="cur">팀 초대</span>
        </div>

        {/* 페이지 헤더 */}
        <div className="ex-head">
          <div>
            <div className="eyebrow">팀 초대 · TEAM INVITATION</div>
            <h1 className="ex-head__title">팀 초대</h1>
            <p className="ex-head__sub">
              팀장이 보낸 초대를 확인하고 수락·거절하는 기능입니다.
            </p>
          </div>
        </div>

        {/* 준비중 빈상태 */}
        <div className="card">
          <div className="ex-empty">
            <span className="ico material-symbols-outlined">group_add</span>
            <div className="ex-empty__t">팀 초대 준비 중</div>
            <div className="ex-empty__d">
              팀장이 보낸 초대를 수락하는 기능을 준비 중입니다.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

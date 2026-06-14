/* ============================================================
 * /stats — 시즌 스탯 분석 (Stats) · 준비중 빈상태 (Phase 12 Batch B v2.31)
 *
 * 왜 빈상태로 바꾸는가:
 *  - 시안(Stats.jsx)이 요구하는 "본인 시즌 집계"는 출전 ttp 매핑 / 시즌 경계 /
 *    슈팅존·스플릿·클럽랭킹 모델이 모두 부재 → 신규 집계 로직·모델 = Stop condition.
 *  - 기존 더미 상수(TOTALS/SPLITS/ZONES/GAME_LOG/TREND/RANKINGS)는 mock 이므로 전량 삭제.
 *  - 시즌 리더(득점/어시/리바)는 AW1 어워드 페이지가 이미 운영 노출 중 → /awards CTA 안내.
 *
 * 어떻게:
 *  - "use client" 제거 → 서버 컴포넌트(인터랙션 0). useState/SVG/탭 전부 제거.
 *  - 공용 .ex-* 셸(crumb/head/empty) 재사용. DB 호출 0 / API 0.
 *  - active 탭(rank)은 app-nav 의 pathname 자동판정(/stats) → prop 조작 0.
 * ============================================================ */

import Link from "next/link";

export default function StatsPage() {
  return (
    <div className="page">
      <div className="ex-page-w">
        {/* 브레드크럼 — 홈 › 프로필 › 스탯 분석 */}
        <div className="ex-crumb">
          <Link href="/">홈</Link>
          <span className="sep">›</span>
          <Link href="/profile">프로필</Link>
          <span className="sep">›</span>
          <span className="cur">스탯 분석</span>
        </div>

        {/* 페이지 헤더 */}
        <div className="ex-head">
          <div>
            <div className="eyebrow">ADVANCED STATS</div>
            <h1 className="ex-head__title">시즌 스탯 분석</h1>
            <p className="ex-head__sub">
              슈팅 존, 스플릿, 경기 로그까지 — 한 시즌을 숫자로 되짚어보는 개인 스탯 대시보드입니다.
            </p>
          </div>
        </div>

        {/* 준비중 빈상태 — 실데이터 미지원이므로 정직한 안내 + 어워드 CTA */}
        <div className="card">
          <div className="ex-empty">
            <span className="ico material-symbols-outlined">query_stats</span>
            <div className="ex-empty__t">시즌 스탯 분석 준비 중</div>
            <div className="ex-empty__d">
              경기 기록이 쌓이면 개인 스탯 대시보드를 제공합니다.
              <br />
              현재 시즌 순위는 어워드 페이지에서 확인할 수 있어요.
            </div>
            <div style={{ marginTop: 18 }}>
              <Link href="/awards" className="btn btn--accent">
                시즌 어워드 보기
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

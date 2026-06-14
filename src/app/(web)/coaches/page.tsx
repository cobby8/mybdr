"use client";

/* ============================================================
 * /coaches — 코치 찾기 (Coaches) v2.31 시안 박제 — CC1
 *
 * 이유(왜):
 *   기존 COACHES 6건·BOOKED 2건은 전량 더미였고(DB coaches/
 *   coach_bookings/coach_reviews 모델 0), 운영 실측 결과 레슨 코치
 *   도메인 데이터가 전무함(TTP.role=coach 4건은 대회 코칭스태프이지
 *   레슨 코치가 아님). → mock 박제 금지, 준비중 빈상태가 정답.
 *
 * 구조 결정:
 *   시안 셸(ex-head + 카테고리 chip)은 유지하되 코치 그리드 mock 은
 *   삭제하고 ex-empty "코치 매칭 준비 중" 으로 대체. 카테고리 chip 은
 *   인터랙션(useState)을 보존하므로 "use client" 유지(단 결과는 빈상태).
 *
 * 시안 출처: Dev/design/BDR-current/screens/Coaches.jsx (+ extras-pages.css .co-*)
 *
 * 원칙: API/Prisma/서비스 0 변경 / 데이터 0 / mock 0 / 토큰 var(--*) 만 /
 *       라우트 /coaches 불변. AppNav active: pathname 자동 판정(→ more).
 * ============================================================ */

import Link from "next/link";
import { useState } from "react";

// 카테고리 chip — 시안 cats. 동작 미구현(빈상태 셸이므로 표시만 토글)
const CATS: [string, string][] = [
  ["all", "전체"],
  ["skill", "개인 스킬"],
  ["team", "팀 지도"],
  ["youth", "유소년"],
  ["shoot", "슈팅"],
];

export default function CoachesPage() {
  // 카테고리 선택 상태 — 시안 인터랙션 보존(결과는 빈상태)
  const [cat, setCat] = useState("all");

  return (
    <div className="page">
      <div className="page__inner ex-page-w">
        {/* 브레드크럼 */}
        <div className="ex-crumb">
          <Link href="/">홈</Link>
          <span className="sep">›</span>
          <span className="cur">코치 찾기</span>
        </div>

        {/* 헤더 — eyebrow + h1 + 설명 + 코치 등록 신청(UI만) */}
        <div className="ex-head">
          <div>
            <div className="eyebrow">코치 · COACHES</div>
            <h1 className="ex-head__title">나에게 맞는 코치 찾기</h1>
            <p className="ex-head__sub">
              개인 스킬부터 팀 전술, 유소년 지도까지 — 검증된 코치와 1:1 또는 그룹으로 실력을 키우세요.
            </p>
          </div>
          <div className="ex-head__actions">
            {/* 코치 등록 신청 — DB 미지원, UI 셸만(동작 미구현) */}
            <button className="btn btn--accent" type="button">
              <span className="ico material-symbols-outlined">add</span>코치 등록 신청
            </button>
          </div>
        </div>

        {/* 카테고리 chip — 인터랙션 보존(빈상태이므로 결과 변화 없음) */}
        <div className="ex-chips">
          {CATS.map(([k, l]) => (
            <button
              key={k}
              type="button"
              className={"ex-chip" + (cat === k ? " is-on" : "")}
              onClick={() => setCat(k)}
            >
              {l}
            </button>
          ))}
        </div>

        {/* 빈상태 — 코치 매칭 준비 중. mock 그리드 금지 */}
        <div className="card">
          <div className="ex-empty">
            <span className="ico material-symbols-outlined">sports_basketball</span>
            <div className="ex-empty__t">코치 매칭 준비 중</div>
            <div className="ex-empty__d">검증된 코치·트레이너 매칭 기능을 준비하고 있습니다. 곧 만나보실 수 있어요.</div>
          </div>
        </div>
      </div>
    </div>
  );
}

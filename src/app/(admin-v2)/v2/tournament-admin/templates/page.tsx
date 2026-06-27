// =====================================================================
// (admin-v2)/v2/tournament-admin/templates/page.tsx — 대회 템플릿(M3 파일럿 4/5)
//   정본: ta-pages.jsx Templates (카드 그리드)
//
//   데이터 배선: ❌ 실 source 없음.
//   - 레거시 templates 페이지도 "준비 중"(DB 테이블/엔드포인트 부재).
//   - 정본 카드는 mock(TA_TEMPLATES)뿐 → 시안에만 두지 않고 준비 상태로 표시(mock 0).
//   서버 컴포넌트(데이터 fetch 없음). M4 이후 템플릿 모델 도입 시 실배선.
// =====================================================================

import Link from "next/link";
import { PageHead } from "@/components/admin-v2/blocks";
import { Empty } from "@/components/admin-toss";

export default function TaTemplatesPage() {
  return (
    <div>
      <PageHead
        eyebrow="대회 관리자"
        title="대회 템플릿"
        sub="자주 쓰는 대회 구성을 템플릿으로 저장해 새 대회를 빠르게 만듭니다."
      />
      <Empty
        icon="layout-template"
        title="템플릿 준비 중"
        desc="대회 구성을 템플릿으로 저장하는 기능을 준비하고 있습니다. 지금은 새 대회 만들기에서 구성할 수 있어요."
      >
        <Link href="/tournament-admin/tournaments/new/wizard" className="ts-btn ts-btn--primary" style={{ textDecoration: "none" }}>
          새 대회 만들기
        </Link>
      </Empty>
    </div>
  );
}

// ============================================================
// ta/templates/page.tsx — 대회 템플릿 (정본 ta-pages Templates)
//   ★백엔드 모델 부재(템플릿 저장소 미존재) → 정본 Empty "준비 중"으로 표시.
//   mock 카드 0(데이터 없는 요소 가짜 채움 금지·보고). 모델 신설 시 카드 그리드 배선.
//   PageHead/Empty 는 직렬화 가능 props 만 → 순수 서버 컴포넌트(클라 불필요).
// ============================================================

import { PageHead, Empty } from "@/components/admin-v2";

export const dynamic = "force-dynamic";

export default function TaTemplates() {
  return (
    <div>
      <PageHead
        eyebrow="대회 관리자"
        title="대회 템플릿"
        sub="자주 쓰는 대회 구성을 템플릿으로 저장해 새 대회를 빠르게 만듭니다."
      />
      <Empty
        icon="layout-template"
        title="템플릿 기능 준비 중"
        desc="자주 쓰는 대회 구성을 템플릿으로 저장하는 기능을 준비하고 있습니다. 곧 제공될 예정입니다."
      />
    </div>
  );
}

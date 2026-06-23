// =====================================================================
// page-head.tsx — 통합 콘솔 페이지 헤더 (v2.40 A2 박제)
//   박제 source: Dev/design/BDR v2.40/_admin-unified/au-kit.jsx (PageHead)
//   eyebrow(아이콘+라벨) + 제목 + 보조설명 + 우측 액션 슬롯.
//
//   서버 컴포넌트 — 순수 표시(props만). actions 에 client 버튼을 children 으로
//   주입할 수 있으므로 'use client' 불필요(시안 동일 구조).
//   클래스 .au-* 는 toss-admin.css([data-skin="toss"] 스코프)에 흡수돼 있음.
// =====================================================================

import React from "react";
// Icon 은 lucide-react 래퍼(kit.tsx). 시안 name="users" 같은 kebab 문자열 호출 유지.
import { Icon } from "@/components/admin-toss";

export type PageHeadProps = {
  eyebrow?: React.ReactNode; // 제목 위 작은 라벨(옵션)
  icon?: string; // eyebrow 좌측 아이콘 name(옵션)
  title: React.ReactNode; // 필수 — 페이지 제목
  sub?: React.ReactNode; // 제목 아래 보조 설명(옵션)
  actions?: React.ReactNode; // 우측 액션 영역(버튼 등, 옵션)
};

export function PageHead({ eyebrow, icon, title, sub, actions }: PageHeadProps) {
  return (
    <div className="au-head">
      <div className="au-head__row">
        {/* minWidth:0 — flex 자식 말줄임 보장(시안 동일) */}
        <div style={{ minWidth: 0 }}>
          {eyebrow && (
            <div className="au-head__eyebrow">
              {icon && <Icon name={icon} size={15} />}
              {eyebrow}
            </div>
          )}
          <h1>{title}</h1>
          {sub && <div className="au-head__sub">{sub}</div>}
        </div>
        {actions && <div className="au-head__actions">{actions}</div>}
      </div>
    </div>
  );
}

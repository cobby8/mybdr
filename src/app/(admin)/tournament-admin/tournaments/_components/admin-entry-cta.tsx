"use client";

import Link from "next/link";
import { Icon } from "@/components/admin-toss";

/* ============================================================
 * AdminEntryCta — PR-3 3-A §6-1 대회 생성 입구 단일화 (2026-06-27)
 *
 * 변경: 기존 4옵션 진입 패널(quick/legacy/prospectus/association = aen-grid/aen-panel/aen-opt
 *       + ENTRY_OPTIONS + panelOpen 토글)을 제거하고, 단일 "새 대회 만들기" CTA →
 *       5단계 마법사(/tournament-admin/tournaments/new/wizard) 직행으로 단일화한다.
 *
 * ⚠ 라우트/컴포넌트 보존: prospectus(/new/wizard/prospectus)·association(/wizard/association)·
 *   legacy(?legacy=1 / LegacyWizardForm) 는 전부 그대로 살아있다. 여기선 입구 패널의 href 만
 *   제거할 뿐 기능/라우트 삭제가 아니다. 5단계 마법사 내부에 prospectus·association 진입 안내가
 *   이미 있어 해당 경로는 마법사 안에서 계속 도달 가능(§6-1 = 단일 진입 + 보존).
 * ============================================================ */

// 5단계 마법사 단일 진입 경로(§6-1 확정). 내부 단계: 단체/시리즈/대회정보/참가설정/확인생성.
const NEW_WIZARD_HREF = "/tournament-admin/tournaments/new/wizard";

// isSuperAdmin prop 은 부모(page.tsx)가 계속 전달하므로 시그니처 유지.
//   단일화 후 분기 불필요(협회 옵션 제거)라 미사용 — `_` 표기로 unused 가드.
export function AdminEntryCta({ isSuperAdmin: _isSuperAdmin = false }: { isSuperAdmin?: boolean }) {
  return (
    <div className="aen-hero">
      <div>
        <div className="aen-hero__eyebrow">대회 만들기</div>
        <div className="aen-hero__title">새 대회를 만들어 보세요</div>
        <p className="aen-hero__sub">
          5단계 마법사로 대회 정보부터 종별·일정·발행까지 한 번에 설정합니다.
        </p>
      </div>
      {/* 단일 CTA — 5단계 마법사 직행(button 토글 → Link). aen-hero__cta 스킨 재사용. */}
      <Link href={NEW_WIZARD_HREF} className="aen-hero__cta">
        <Icon name="circle-plus" size={18} className="ico" />
        새 대회 만들기
      </Link>
    </div>
  );
}

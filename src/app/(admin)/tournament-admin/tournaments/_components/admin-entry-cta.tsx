"use client";

import { useState } from "react";
import Link from "next/link";

/* ============================================================
 * AdminEntryCta — A1 (PR-1C-7 박제 2026-05-28)
 *
 * 박제 source: Dev/design/BDR-current/screens/AdminTournamentAdminList.jsx
 *              (aen-hero / aen-panel / aen-grid / aen-opt)
 * 박제 target: 본 파일 (admin 대회 목록 진입점)
 *
 * 이유 (왜):
 *   - 시안 A1 = 단일 hero CTA → 4 옵션 인라인 panel 전환.
 *     panel 펼침 토글은 클라이언트 상태(panelOpen)가 필요 →
 *     server component(page.tsx)에서 분리해 클라이언트 컴포넌트로 추출.
 *   - 4 옵션 = 운영 실제 라우트로만 매핑 (가짜링크 ❌).
 *     panel 닫혀있을 때 hero CTA 만 노출 → 클릭 시 4 옵션 panel 펼침.
 *
 * 어떻게:
 *   1. aen-hero + aen-hero__cta (펼침 토글 버튼).
 *   2. panelOpen 시 aen-panel + aen-grid 안에 4 옵션 카드.
 *   3. 각 옵션 = <Link>(button 대신) → 운영 라우트 직접 이동.
 *   4. admin(협회) 옵션은 isSuperAdmin=true 일 때만 노출.
 * ============================================================ */

// 4 옵션 진입 정의 — href 는 운영 실제 라우트만 (가짜링크 ❌)
interface EntryOption {
  key: string;
  name: string;
  icon: string; // Material Symbols Outlined
  time: string;
  case: string;
  sub: string;
  href: string;
  rec?: boolean; // 추천 chip
  admin?: boolean; // super_admin 전용
}

const ENTRY_OPTIONS: EntryOption[] = [
  {
    key: "quick",
    name: "Quick · 빠르게 시작",
    icon: "flash_on",
    time: "1분",
    case: "이전 대회 비슷하게",
    sub: "이름·시작일만 입력. 셋업은 hub 에서 차근차근.",
    // Quick = 운영 wizard 1-step 진입 (기존 라우트)
    href: "/tournament-admin/tournaments/new/wizard",
    rec: true,
  },
  {
    key: "legacy",
    name: "단계별 설정",
    icon: "list_alt",
    time: "5분",
    case: "처음부터 꼼꼼히",
    sub: "3-step 마법사 — 대회정보 / 참가설정 / 확인.",
    // Legacy = 동일 wizard 페이지 (legacy 쿼리로 단계별 모드)
    href: "/tournament-admin/tournaments/new/wizard?legacy=1",
  },
  {
    key: "prospectus",
    name: "PDF 요강",
    icon: "description",
    time: "3분",
    case: "협회 요강 PDF 가 있을 때",
    sub: "PDF 업로드 → AI 가 종별·신청정책 자동 추출.",
    // Prospectus = 운영 prospectus wizard (기존 라우트)
    href: "/tournament-admin/tournaments/new/wizard/prospectus",
  },
  {
    key: "association",
    name: "협회 대회",
    icon: "workspace_premium",
    time: "7분",
    case: "협회 등록 + 종별 위임",
    sub: "협회 단체 등록 + 시리즈 + 권한 위임 4-step.",
    // 협회 = 운영 association wizard (super_admin 전용 라우트)
    href: "/tournament-admin/wizard/association",
    admin: true,
  },
];

export function AdminEntryCta({ isSuperAdmin = false }: { isSuperAdmin?: boolean }) {
  // panel 펼침 상태 — 시안과 동일 (기본 닫힘)
  const [panelOpen, setPanelOpen] = useState(false);

  return (
    <>
      {/* Hero CTA — 단일 진입점 (navy 그라데이션) */}
      <div className="aen-hero">
        <div>
          <div className="aen-hero__eyebrow">대회 만들기 · 4 가지 방법</div>
          <div className="aen-hero__title">새 대회를 어떻게 만들까요?</div>
          <p className="aen-hero__sub">
            이전 대회 빠르게 복제 · 처음부터 꼼꼼히 · PDF 요강에서 자동 · 협회 등록.
          </p>
        </div>
        {/* 펼침 토글 — panelOpen 따라 expand_more/less 아이콘 전환 */}
        <button
          type="button"
          className="aen-hero__cta"
          onClick={() => setPanelOpen((v) => !v)}
        >
          <span className="ico material-symbols-outlined">add_circle</span>
          새 대회 만들기
          <span className="ico material-symbols-outlined">
            {panelOpen ? "expand_less" : "expand_more"}
          </span>
        </button>
      </div>

      {/* 4 옵션 panel (펼침) */}
      {panelOpen && (
        <div className="aen-panel">
          <div className="aen-panel__head">
            <h3 className="aen-panel__title">생성 방식 선택</h3>
            <button
              type="button"
              className="aen-panel__close"
              onClick={() => setPanelOpen(false)}
              aria-label="닫기"
            >
              <span className="ico material-symbols-outlined">close</span>
            </button>
          </div>
          <div className="aen-grid">
            {ENTRY_OPTIONS.map((o) => {
              // 협회 옵션 = super_admin 만 노출 (운영 권한 가드 시각 반영)
              if (o.admin && !isSuperAdmin) return null;
              const cls =
                "aen-opt" +
                (o.rec ? " aen-opt--rec" : "") +
                (o.admin ? " aen-opt--admin" : "");
              return (
                // button → Link 로 박제: 옵션 클릭 = 운영 실제 라우트 이동
                <Link key={o.key} href={o.href} className={cls}>
                  {o.rec && <span className="aen-opt__rec-chip">추천</span>}
                  <div className="aen-opt__head">
                    <span className="aen-opt__icon ico material-symbols-outlined">
                      {o.icon}
                    </span>
                    <h4 className="aen-opt__name">{o.name}</h4>
                  </div>
                  <p className="aen-opt__sub">{o.sub}</p>
                  <div className="aen-opt__meta">
                    <span className="aen-opt__time">
                      <span className="ico material-symbols-outlined">schedule</span>
                      예상 {o.time}
                    </span>
                    <span className="aen-opt__case">{o.case}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}

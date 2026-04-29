"use client";

/* ============================================================
 * SettingsSideNavV2 — Settings 좌측 sticky 네비게이션
 *
 * 왜:
 *  - BDR v2 시안 Settings.jsx의 좌측 220px sticky 네비를 그대로 이식.
 *  - 6개 섹션 버튼 (account / profile / notify / privacy / billing / danger).
 *  - URL 쿼리 ?section=... 으로 활성 상태 결정 → 새로고침/공유/뒤로가기 보존.
 *
 * 어떻게:
 *  - 부모(page.tsx)가 activeSection 과 onChange 핸들러를 내려줌.
 *  - 클릭 시 router.replace 로 ?section= 만 갱신 (히스토리 누적 X).
 *  - 시안과 동일하게 active 시 var(--bg-alt) 배경 + ink primary, 비활성은 투명 + ink-soft.
 *  - 아이콘은 Material Symbols Outlined (CLAUDE.md 규칙: lucide-react 금지).
 * ============================================================ */

import type { SectionKey } from "./section-key";

// 시안에서 절제된 6개 섹션. 라벨/아이콘은 시안 그대로.
export const SECTIONS: ReadonlyArray<{
  id: SectionKey;
  label: string;
  // Material Symbols Outlined 아이콘 키 (lucide-react 금지)
  icon: string;
}> = [
  { id: "account", label: "계정", icon: "person" },
  { id: "profile", label: "프로필", icon: "sports_basketball" },
  { id: "notify", label: "알림", icon: "notifications" },
  { id: "privacy", label: "개인정보·공개", icon: "lock" },
  { id: "billing", label: "결제·멤버십", icon: "credit_card" },
  { id: "danger", label: "계정 관리", icon: "warning" },
] as const;

interface Props {
  activeSection: SectionKey;
  onSectionChange: (id: SectionKey) => void;
}

export function SettingsSideNavV2({ activeSection, onSectionChange }: Props) {
  return (
    <>
      {/* ============================================================
       * PC 좌측 사이드바 (lg 이상) — 시안 그대로 유지
       * - 220px sticky 카드 + var(--bg-alt) 활성 배경
       * - 사용자 지시: PC 사이드바는 무수정
       * ============================================================ */}
      <nav
        // 시안: 220px 고정 폭, 카드 형태(padding 8), sticky (top:120 — mybdr 헤더 고려해 96 사용)
        className="card hidden lg:block"
        style={{
          padding: 8,
          position: "sticky",
          top: 96,
          // 시안 네비는 토큰 css 의 .card 패턴 사용
        }}
        aria-label="설정 카테고리"
      >
        {SECTIONS.map((s) => {
          const active = activeSection === s.id;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => onSectionChange(s.id)}
              // 시안 그대로의 인라인 스타일. 토큰 변수만 사용 (하드코딩 색 금지)
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                width: "100%",
                padding: "10px 12px",
                background: active ? "var(--bg-alt)" : "transparent",
                border: 0,
                cursor: "pointer",
                textAlign: "left",
                borderRadius: 6,
                fontWeight: active ? 700 : 500,
                fontSize: 14,
                color: active ? "var(--ink)" : "var(--ink-soft)",
              }}
              aria-current={active ? "page" : undefined}
            >
              <span
                className="material-symbols-outlined"
                // 시안의 16px 이모지 자리에 동등한 비주얼 — 시각적 무게 동일하게
                style={{ fontSize: 18, color: active ? "var(--ink)" : "var(--ink-mute)" }}
                aria-hidden
              >
                {s.icon}
              </span>
              {s.label}
            </button>
          );
        })}
      </nav>

      {/* ============================================================
       * 모바일 상단 탭 네비 (lg 미만) — v2 탭 패턴
       *
       * 왜:
       *  - 모바일에서 PC 세로 사이드바를 그대로 노출하면 6개 카테고리가 화면을 점유해
       *    설정 본문 도달이 늦어짐 + 시각적 노이즈 큼
       *  - /profile 모바일 탭과 동일 v2 패턴(텍스트 + 하단 강조선)으로 일관성 확보
       *
       * 어떻게:
       *  - sticky top-14 (web 헤더 56px 바로 아래)
       *  - 가로 스크롤 + 텍스트 only + 하단 2px BDR Red 강조선
       * ============================================================ */}
      <nav
        className="sticky top-14 z-30 -mx-4 mb-4 border-b border-[var(--border)] bg-[var(--bg)] lg:hidden"
        aria-label="설정 카테고리 (모바일)"
      >
        <div className="flex gap-1 overflow-x-auto px-4 scrollbar-none">
          {SECTIONS.map((s) => {
            const active = activeSection === s.id;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => onSectionChange(s.id)}
                aria-current={active ? "page" : undefined}
                /* v2 탭 패턴:
                 * - 아이콘 제거 (텍스트만)
                 * - px-3 py-3 → 약 44px 터치 타겟
                 * - 활성: 하단 3px accent border + font-semibold + ink primary (TeamTabsV2 일관)
                 * - 비활성: 투명 border + font-medium + ink-soft
                 * 토큰 매핑 정정 (2026-04-29):
                 *   --color-primary 는 v2 미정의 → --accent (BDR Red) */
                className={`flex shrink-0 items-center px-3 py-3 text-sm border-b-[3px] transition-colors bg-transparent cursor-pointer ${
                  active
                    ? "border-[var(--accent)] text-[var(--ink)] font-semibold"
                    : "border-transparent text-[var(--ink-soft)] hover:text-[var(--ink)] font-medium"
                }`}
              >
                {s.label}
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}

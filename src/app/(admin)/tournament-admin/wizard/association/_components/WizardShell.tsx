"use client";

/**
 * WizardShell — 협회 마법사 progress bar + nav 버튼 (Phase 6 PR2, 2026-05-15).
 *
 * 왜:
 *   - 4 step 진행률 + 이전/다음/생성 버튼을 단일 컴포넌트가 책임 → page.tsx 100 LOC 룰 보호.
 *   - BDR-current 토큰 (`var(--color-*)` / `rounded-md` / `font-bold`) — admin 빨강 본문 금지 룰 의무.
 *
 * 어떻게:
 *   - props: currentStep (1~4) / isLastStep / onPrev / onNext / onSubmit / canProceed / submitting / children
 *   - progress = 현재 step 까지 색칠 (var(--color-info) — admin 빨강 본문 금지 룰).
 *   - 이전 버튼은 step > 1 시만 활성, 마지막 step 은 onSubmit (생성), 그 외 onNext.
 */

import Link from "next/link";
import { useRouter } from "next/navigation";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { ASSOCIATION_WIZARD_STEPS } from "@/lib/tournaments/association-wizard-constants";

export interface WizardShellProps {
  // PR3: 5 step 확장 (4=Referee 사전 등록 / 5=확인).
  currentStep: 1 | 2 | 3 | 4 | 5;
  // canProceed = 현재 step 검증 통과 여부 — false 면 다음/생성 버튼 비활성.
  canProceed: boolean;
  // submitting = 마지막 step "생성" 클릭 후 API 호출 중 (true 면 버튼 비활성 + 라벨 변경).
  submitting?: boolean;
  // error = 마지막 step 생성 실패 시 표시할 에러 메시지 (있을 때만 노출).
  error?: string | null;
  onPrev: () => void;
  onNext: () => void;
  onSubmit: () => void;
  children: React.ReactNode;
}

export function WizardShell({
  currentStep,
  canProceed,
  submitting = false,
  error,
  onPrev,
  onNext,
  onSubmit,
  children,
}: WizardShellProps) {
  // 마지막 step 판정 — PR3: 5 = 확인 및 생성.
  const isLastStep = currentStep === 5;
  const isFirstStep = currentStep === 1;
  // Admin-9 박제 (2026-05-16) — 종료 버튼 confirm 후 /admin 으로 라우팅.
  const router = useRouter();

  return (
    <div className="mx-auto max-w-3xl">
      {/* === 헤더 — Admin-9 박제: AdminPageHeader (eyebrow + breadcrumbs + actions) === */}
      <AdminPageHeader
        eyebrow="협회 마법사 · 진행 중"
        title="새 협회 만들기"
        subtitle="super_admin 전용 — 협회 본체 + 사무국장 + 단가표를 차례로 등록합니다."
        breadcrumbs={[
          { label: "ADMIN" },
          { label: "대회 운영자 도구" },
          { label: "협회 마법사" },
        ]}
        actions={
          <>
            {/* 일반 대회 마법사로 이동 — Link (페이지 전환) */}
            <Link
              href="/tournament-admin/tournaments/new/wizard"
              className="btn btn--sm"
            >
              일반 대회 마법사로
            </Link>
            {/* 종료 버튼 — confirm 후 /admin 으로 라우팅 (작성 중단) */}
            <button
              type="button"
              onClick={() => {
                if (confirm("진행 중인 작성을 종료하시겠습니까?")) {
                  router.push("/admin");
                }
              }}
              className="btn btn--sm"
              aria-label="작성 종료"
            >
              <span
                className="material-symbols-outlined"
                style={{ fontSize: 16 }}
              >
                close
              </span>
              종료
            </button>
          </>
        }
      />

      {/* === Progress bar (4 step) === */}
      <div className="mb-6">
        <ol className="flex items-center justify-between gap-2">
          {ASSOCIATION_WIZARD_STEPS.map((step) => {
            // 현재 step 이상은 회색 / 미만은 info 색칠 / 동일 step 은 강조.
            const isActive = step.id === currentStep;
            const isCompleted = step.id < currentStep;
            return (
              <li key={step.id} className="flex flex-1 items-center gap-2">
                {/* 단계 원형 — 정사각 50% (pill 9999px 금지, 정사각 원형 50% 허용 — CLAUDE.md 13 룰) */}
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-[50%] text-sm font-bold ${
                    isActive
                      ? "bg-[var(--color-info)] text-white"
                      : isCompleted
                        ? "bg-[var(--color-info)]/30 text-[var(--color-info)]"
                        : "bg-[var(--color-border)] text-[var(--color-text-muted)]"
                  }`}
                >
                  {/* 완료된 step 은 체크 아이콘, 그 외 step 번호 */}
                  {isCompleted ? (
                    <span className="material-symbols-outlined text-base">
                      check
                    </span>
                  ) : (
                    step.id
                  )}
                </span>
                {/* 라벨 — 모바일에서는 숨김 (≤sm) 으로 단계 원형만 노출 */}
                <span
                  className={`hidden text-sm sm:inline ${
                    isActive
                      ? "font-bold text-[var(--color-text-primary)]"
                      : "text-[var(--color-text-muted)]"
                  }`}
                >
                  {step.label}
                </span>
              </li>
            );
          })}
        </ol>
      </div>

      {/* === Step 본문 === */}
      <div className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:p-6">
        {children}
      </div>

      {/* === 에러 (있을 때만) — color-mix 토큰 (admin 빨강 본문 금지 룰) === */}
      {error && (
        <div className="mt-4 rounded-md bg-[color-mix(in_srgb,var(--color-error)_10%,transparent)] px-4 py-3 text-sm text-[var(--color-error)]">
          {error}
        </div>
      )}

      {/* === Nav 버튼 === */}
      <div className="mt-6 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onPrev}
          disabled={isFirstStep || submitting}
          className="rounded-[4px] border border-[var(--color-border)] px-4 py-2 text-sm text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-border)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          이전
        </button>

        {isLastStep ? (
          // 마지막 step = 생성 버튼 (API 3 호출)
          <button
            type="button"
            onClick={onSubmit}
            disabled={!canProceed || submitting}
            className="rounded-[4px] bg-[var(--color-info)] px-5 py-2 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? "생성 중..." : "협회 생성"}
          </button>
        ) : (
          // Step 1~3 = 다음 버튼
          <button
            type="button"
            onClick={onNext}
            disabled={!canProceed || submitting}
            className="rounded-[4px] bg-[var(--color-info)] px-5 py-2 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            다음
          </button>
        )}
      </div>
    </div>
  );
}

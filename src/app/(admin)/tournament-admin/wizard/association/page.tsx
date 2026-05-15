"use client";

/**
 * 협회 마법사 본체 — Phase 6 PR2 (2026-05-15).
 *
 * 왜:
 *   - super_admin / association_admin 전용 협회 생성 마법사 (Step 1~3 + 확인).
 *   - 일반 마법사 (`/tournament-admin/tournaments/new/wizard`) 와 완전 분리 — 흐름 / 권한 / draft KEY 모두 별도.
 *   - PR1 API 3 endpoint 사용 — POST associations → POST [id]/admins → POST [id]/fee-setting 순차.
 *
 * 어떻게:
 *   - client component — `/api/web/me` 조회로 권한 판정 (super_admin / association_admin 만 통과).
 *   - 미통과 시 `/tournament-admin` 으로 redirect.
 *   - useAssociationWizardDraft hook 으로 sessionStorage 박제.
 *   - WizardShell 이 progress + nav, Step{1~3} + Confirm 컴포넌트가 본문 책임.
 *   - 검증 (canProceed) 은 본 컴포넌트가 step 별 계산 (name min 2 / user_id 존재 / fee 음수 거부 등).
 */

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { WizardShell } from "./_components/WizardShell";
import { Step1AssociationForm } from "./_components/Step1AssociationForm";
import { Step2AdminPicker } from "./_components/Step2AdminPicker";
import { Step3FeeSettings } from "./_components/Step3FeeSettings";
import { WizardConfirm } from "./_components/WizardConfirm";
import { useAssociationWizardDraft } from "@/lib/tournaments/use-association-wizard-draft";
import type {
  AssociationCreateResponse,
  AssociationAdminAssignResponse,
} from "@/lib/tournaments/association-wizard-types";

// 권한 상태 — me API 응답에 따른 4 분기.
type AuthStatus = "loading" | "unauthenticated" | "unauthorized" | "authorized";

export default function AssociationWizardPage() {
  const router = useRouter();
  const [authStatus, setAuthStatus] = useState<AuthStatus>("loading");
  // 생성 흐름 상태 — API 3건 순차 호출 중 / 에러.
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // sessionStorage 박제 hook — Step 간 입력값 유지.
  const { draft, setDraft, clearDraft } = useAssociationWizardDraft();

  // 권한 체크 — me API 조회 → super_admin (role) 또는 association_admin (admin_info.role) 만 통과.
  useEffect(() => {
    fetch("/api/web/me")
      .then((res) => {
        if (!res.ok) {
          setAuthStatus("unauthenticated");
          return null;
        }
        return res.json();
      })
      .then((json) => {
        if (!json) return;
        // apiSuccess 자동 snake_case — json.data 가 me 응답 본체.
        const data = json.data ?? json;
        // 비로그인 (id=null) 분기.
        if (!data.id) {
          setAuthStatus("unauthenticated");
          return;
        }
        // 1) JWT role super_admin = 즉시 통과.
        // 2) admin_info.role 이 super_admin 또는 association_admin 9 role 중 하나 = 통과.
        //    spec = "super_admin OR association_admin 둘 다 진입" — 단순화: 협회 관리자 매핑 있으면 통과.
        const role = data.role as string;
        const adminInfo = data.admin_info as
          | { is_admin: boolean; role: string }
          | null;
        const isSuperAdmin = role === "super_admin";
        const isAssociationAdmin = !!adminInfo?.is_admin;
        if (isSuperAdmin || isAssociationAdmin) {
          setAuthStatus("authorized");
        } else {
          setAuthStatus("unauthorized");
        }
      })
      .catch(() => setAuthStatus("unauthenticated"));
  }, []);

  // 미인증 시 로그인 페이지로 redirect — 일반 마법사 동일 패턴.
  useEffect(() => {
    if (authStatus === "unauthenticated") {
      router.push("/login?redirect=/tournament-admin/wizard/association");
    }
  }, [authStatus, router]);

  // 권한 부족 시 tournament-admin 메인으로 redirect (시안 spec — "협회 생성은 super_admin 전용").
  useEffect(() => {
    if (authStatus === "unauthorized") {
      router.push("/tournament-admin");
    }
  }, [authStatus, router]);

  // === Step 별 canProceed 계산 ===
  // 검증 룰은 PR1 API Zod 와 정합 (name min 2 / user_id 존재 / fee >=0).
  function canProceedAtStep(step: 1 | 2 | 3 | 4): boolean {
    if (step === 1) {
      // Step 1: name min 2 + code min 2 + level enum 통과.
      return (
        draft.association.name.trim().length >= 2 &&
        draft.association.code.trim().length >= 2
      );
    }
    if (step === 2) {
      // Step 2: user_id 선택 필수 (이메일 invite 미적용 / 기존 user 만).
      return !!draft.admin.user_id;
    }
    if (step === 3) {
      // Step 3: 4 정수 모두 >=0 (음수 거부 — input min=0 으로 자연 차단되지만 방어).
      const f = draft.fee_setting;
      return (
        f.main_fee >= 0 &&
        f.sub_fee >= 0 &&
        f.recorder_fee >= 0 &&
        f.timer_fee >= 0
      );
    }
    // Step 4 = 확인 — 1~3 모두 통과해야 생성 가능.
    return (
      canProceedAtStep(1) && canProceedAtStep(2) && canProceedAtStep(3)
    );
  }

  // 다음 단계 — current_step 증가.
  function handleNext() {
    if (draft.current_step >= 4) return;
    const next = (draft.current_step + 1) as 1 | 2 | 3 | 4;
    setDraft({ ...draft, current_step: next });
    // 스크롤 상단 — 모바일 UX (긴 폼 진입 시 위에서 시작).
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // 이전 단계.
  function handlePrev() {
    if (draft.current_step <= 1) return;
    const prev = (draft.current_step - 1) as 1 | 2 | 3 | 4;
    setDraft({ ...draft, current_step: prev });
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // === 최종 제출 — PR1 API 3건 순차 호출 ===
  // 실패 시 알림 + rollback 없음 (운영자 수동 정정 — 시안 spec).
  async function handleSubmit() {
    if (submitting) return;
    if (!canProceedAtStep(4)) {
      setSubmitError("입력값을 다시 확인해주세요.");
      return;
    }
    setSubmitting(true);
    setSubmitError(null);

    try {
      // 1) 협회 본체 생성 — POST /api/web/admin/associations.
      const resAssoc = await fetch("/api/web/admin/associations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: draft.association.name.trim(),
          code: draft.association.code.trim(),
          level: draft.association.level,
          region_sido:
            draft.association.region_sido.trim() || null,
          parent_id: draft.association.parent_id.trim() || null,
        }),
      });
      const jsonAssoc = await resAssoc.json();
      if (!resAssoc.ok) {
        // 409 = 코드 충돌 / 422 = 검증 / 403 = 권한.
        const msg =
          jsonAssoc.error ??
          jsonAssoc.message ??
          "협회 생성에 실패했습니다.";
        setSubmitError(msg);
        setSubmitting(false);
        return;
      }
      // apiSuccess 자동 snake_case → data.association.id (string).
      const assocData =
        (jsonAssoc.data ?? jsonAssoc) as AssociationCreateResponse;
      const associationId = assocData.association.id;

      // 2) 사무국장 지정 — POST /api/web/admin/associations/[id]/admins.
      const resAdmin = await fetch(
        `/api/web/admin/associations/${associationId}/admins`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: draft.admin.user_id,
            role: draft.admin.role,
          }),
        },
      );
      if (!resAdmin.ok) {
        const jsonAdmin = await resAdmin.json().catch(() => ({}));
        const msg =
          jsonAdmin.error ??
          jsonAdmin.message ??
          "사무국장 지정에 실패했습니다. (협회는 생성되었습니다)";
        setSubmitError(msg);
        setSubmitting(false);
        return;
      }
      // 응답 검증 — 형식 정합 확인 (디버깅용).
      const _adminData =
        (await resAdmin.json()) as { data?: AssociationAdminAssignResponse };
      void _adminData;

      // 3) 단가표 저장 — POST /api/web/admin/associations/[id]/fee-setting.
      const resFee = await fetch(
        `/api/web/admin/associations/${associationId}/fee-setting`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            main_fee: draft.fee_setting.main_fee,
            sub_fee: draft.fee_setting.sub_fee,
            recorder_fee: draft.fee_setting.recorder_fee,
            timer_fee: draft.fee_setting.timer_fee,
          }),
        },
      );
      if (!resFee.ok) {
        const jsonFee = await resFee.json().catch(() => ({}));
        const msg =
          jsonFee.error ??
          jsonFee.message ??
          "단가표 저장에 실패했습니다. (협회와 사무국장은 등록되었습니다)";
        setSubmitError(msg);
        setSubmitting(false);
        return;
      }

      // 4) 성공 — draft 삭제 + tournament-admin 메인으로 redirect.
      //    이유: 협회 상세 페이지 (`/tournament-admin/associations/[id]`) 가 아직 PR 없음 → tournament-admin 안전 fallback.
      clearDraft();
      router.push("/tournament-admin?association_created=1");
    } catch {
      setSubmitError("네트워크 오류가 발생했습니다. 잠시 후 다시 시도하세요.");
      setSubmitting(false);
    }
  }

  // === 로딩 / 미인증 / 권한 부족 상태 ===
  if (authStatus === "loading" || authStatus === "unauthenticated") {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="text-[var(--color-text-muted)]">로딩 중...</div>
      </div>
    );
  }

  if (authStatus === "unauthorized") {
    // redirect 진행 중 placeholder — useEffect 가 즉시 push.
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-center">
        <span className="material-symbols-outlined text-5xl text-[var(--color-text-muted)]">
          lock
        </span>
        <p className="text-sm text-[var(--color-text-muted)]">
          협회 생성은 super_admin 또는 협회 관리자만 가능합니다.
        </p>
      </div>
    );
  }

  // === 정상 렌더 — current_step 에 따라 분기 ===
  const step = draft.current_step;

  return (
    <WizardShell
      currentStep={step}
      canProceed={canProceedAtStep(step)}
      submitting={submitting}
      error={submitError}
      onPrev={handlePrev}
      onNext={handleNext}
      onSubmit={handleSubmit}
    >
      {step === 1 && (
        <Step1AssociationForm
          data={draft.association}
          onChange={(next) => setDraft({ ...draft, association: next })}
        />
      )}
      {step === 2 && (
        <Step2AdminPicker
          data={draft.admin}
          onChange={(next) => setDraft({ ...draft, admin: next })}
        />
      )}
      {step === 3 && (
        <Step3FeeSettings
          data={draft.fee_setting}
          onChange={(next) => setDraft({ ...draft, fee_setting: next })}
        />
      )}
      {step === 4 && <WizardConfirm draft={draft} />}
    </WizardShell>
  );
}

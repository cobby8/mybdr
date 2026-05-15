"use client";

/**
 * Step3FeeSettings — 배정비 단가표 4 정수 입력 (Phase 6 PR2, 2026-05-15).
 *
 * 왜:
 *   - 협회 마법사 Step 3 — main_fee/sub_fee/recorder_fee/timer_fee (Q4 결재 = schema 그대로 4 정수).
 *   - 시안 grid (종별×등급×시간) 형식 미적용 — 후속 별도 PR.
 *   - PR1 `POST /api/web/admin/associations/[id]/fee-setting` Zod 와 정합 (>=0 정수).
 *
 * 어떻게:
 *   - 4 number input — min=0, step=1000 (천원 단위 UX).
 *   - 부모가 canProceed 계산 (음수 거부) — 본 컴포넌트는 입력 UI 책임만.
 */

import type { AssociationStep3Data } from "@/lib/tournaments/association-wizard-types";

export interface Step3FeeSettingsProps {
  data: AssociationStep3Data;
  onChange: (next: AssociationStep3Data) => void;
}

// 토스 스타일 인풋 — 일반 마법사와 동일 토큰.
const inputCls =
  "w-full rounded-md border-none bg-[var(--color-border)] px-4 py-3 text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-info)]/50";
const labelCls = "mb-1 block text-sm text-[var(--color-text-muted)]";

// 4 필드 메타 — 입력 라벨/설명/key 단일 source.
const FEE_FIELDS: ReadonlyArray<{
  key: keyof AssociationStep3Data;
  label: string;
  icon: string;
  hint: string;
}> = [
  {
    key: "main_fee",
    label: "주심 배정비",
    icon: "sports",
    hint: "주심 1인당 1경기 배정비 (원)",
  },
  {
    key: "sub_fee",
    label: "부심 배정비",
    icon: "sports_basketball",
    hint: "부심 1인당 1경기 배정비 (원)",
  },
  {
    key: "recorder_fee",
    label: "기록 배정비",
    icon: "edit_note",
    hint: "기록원 1인당 1경기 배정비 (원)",
  },
  {
    key: "timer_fee",
    label: "타이머 배정비",
    icon: "timer",
    hint: "타이머 1인당 1경기 배정비 (원)",
  },
];

export function Step3FeeSettings({ data, onChange }: Step3FeeSettingsProps) {
  // 부분 갱신 헬퍼 — 한 필드만 변경 시 다른 필드 보존.
  function update(key: keyof AssociationStep3Data, raw: string) {
    // 빈 문자열 → 0 박제 (Zod min 0 통과).
    // parseInt fallback 시 NaN 방어 — 음수/소수 입력 시 0 박제 (canProceed 가드 보조).
    const num = raw === "" ? 0 : Number.parseInt(raw, 10);
    const safe = Number.isFinite(num) && num >= 0 ? num : 0;
    onChange({ ...data, [key]: safe });
  }

  return (
    <div className="space-y-4">
      <h2 className="flex items-center gap-2 text-base font-bold text-[var(--color-text-primary)]">
        <span className="material-symbols-outlined text-lg text-[var(--color-info)]">
          payments
        </span>
        배정비 단가
      </h2>

      <p className="text-sm text-[var(--color-text-muted)]">
        역할별 1경기 기본 배정비. 0 원으로 두면 배정 시 별도 안내됩니다.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        {FEE_FIELDS.map((field) => (
          <div key={field.key}>
            <label className={`${labelCls} flex items-center gap-1.5`}>
              <span className="material-symbols-outlined text-base text-[var(--color-info)]">
                {field.icon}
              </span>
              {field.label}
            </label>
            <input
              type="number"
              value={data[field.key]}
              onChange={(e) => update(field.key, e.target.value)}
              className={inputCls}
              placeholder="0"
              min={0}
              step={1000}
              inputMode="numeric"
            />
            <p className="mt-1 text-xs text-[var(--color-text-muted)]">
              {field.hint}
            </p>
          </div>
        ))}
      </div>

      {/* 안내 — 후속 grid 형식 박제 */}
      <div className="rounded-md border border-[var(--color-border)] bg-[var(--color-elevated)] p-3 text-xs text-[var(--color-text-muted)]">
        <p className="flex items-start gap-1.5">
          <span className="material-symbols-outlined text-base text-[var(--color-info)]">
            info
          </span>
          <span>
            종별·등급·시간별 세부 단가표는 추후 별도 화면에서 등록 예정입니다.
            여기서는 협회 기본 단가만 박제합니다.
          </span>
        </p>
      </div>
    </div>
  );
}

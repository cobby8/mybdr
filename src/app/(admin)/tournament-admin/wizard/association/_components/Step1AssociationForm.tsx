"use client";

/**
 * Step1AssociationForm — 협회 본체 입력 (Phase 6 PR2, 2026-05-15).
 *
 * 왜:
 *   - 협회 마법사 Step 1 — name/code/level/region_sido/parent_id/description 입력.
 *   - PR1 `POST /api/web/admin/associations` Zod 와 정합 (name min 2 / code min 2 / level enum 3).
 *
 * 어떻게:
 *   - props: draft (Step1Data) / onChange (입력 변경 시 호출 — 부모가 setDraft 박제).
 *   - 검증은 부모 (page.tsx) 가 canProceed 계산 — 본 컴포넌트는 입력 UI 책임만.
 *   - BDR-current 토큰 (`var(--color-*)` / `rounded-md`) — 빨강 본문 금지 룰.
 */

import type { AssociationStep1Data } from "@/lib/tournaments/association-wizard-types";
import { ASSOCIATION_LEVEL_OPTIONS } from "@/lib/tournaments/association-wizard-constants";

export interface Step1AssociationFormProps {
  data: AssociationStep1Data;
  onChange: (next: AssociationStep1Data) => void;
}

// 토스 스타일 인풋 토큰 — 일반 마법사 (`new/wizard/page.tsx`) 와 동일 패턴.
const inputCls =
  "w-full rounded-md border-none bg-[var(--color-border)] px-4 py-3 text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-info)]/50";
const labelCls = "mb-1 block text-sm text-[var(--color-text-muted)]";

export function Step1AssociationForm({
  data,
  onChange,
}: Step1AssociationFormProps) {
  // 부분 갱신 헬퍼 — 한 필드만 변경 시 다른 필드 보존.
  function update<K extends keyof AssociationStep1Data>(
    key: K,
    value: AssociationStep1Data[K],
  ) {
    onChange({ ...data, [key]: value });
  }

  // level=sido 일 때만 region_sido 활성 — UI 가이드.
  const isSido = data.level === "sido";

  return (
    <div className="space-y-4">
      <h2 className="flex items-center gap-2 text-base font-bold text-[var(--color-text-primary)]">
        <span className="material-symbols-outlined text-lg text-[var(--color-info)]">
          domain
        </span>
        협회 정보
      </h2>

      {/* 협회 이름 (필수) */}
      <div>
        <label className={labelCls}>협회 이름 *</label>
        <input
          type="text"
          value={data.name}
          onChange={(e) => update("name", e.target.value)}
          className={inputCls}
          placeholder="예: 서울특별시농구협회"
          minLength={2}
          maxLength={100}
          autoFocus
          required
        />
      </div>

      {/* 협회 코드 (필수, @unique) */}
      <div>
        <label className={labelCls}>협회 코드 *</label>
        <input
          type="text"
          value={data.code}
          onChange={(e) => update("code", e.target.value)}
          className={inputCls}
          placeholder="예: KBA-11 (서울) / KBA-26 (부산)"
          minLength={2}
          maxLength={20}
          required
        />
        <p className="mt-1 text-xs text-[var(--color-text-muted)]">
          중복 시 저장이 거부됩니다. 행정안전부 시도 코드 권장.
        </p>
      </div>

      {/* 협회 단계 (필수) — select 3 종 */}
      <div>
        <label className={labelCls}>협회 단계 *</label>
        <select
          value={data.level}
          onChange={(e) =>
            update("level", e.target.value as AssociationStep1Data["level"])
          }
          className={inputCls}
        >
          {ASSOCIATION_LEVEL_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* 시·도 지역 (level=sido 시 권장 — 검증 없음, 선택값) */}
      {isSido && (
        <div>
          <label className={labelCls}>시·도 지역</label>
          <input
            type="text"
            value={data.region_sido}
            onChange={(e) => update("region_sido", e.target.value)}
            className={inputCls}
            placeholder="예: 서울특별시"
            maxLength={20}
          />
        </div>
      )}

      {/* 상위 협회 ID (선택 — 시·도 협회가 전국 협회에 종속될 때) */}
      <div>
        <label className={labelCls}>상위 협회 ID (선택)</label>
        <input
          type="text"
          value={data.parent_id}
          onChange={(e) => update("parent_id", e.target.value)}
          className={inputCls}
          placeholder="숫자 ID — 비워두면 최상위 협회"
          inputMode="numeric"
        />
        <p className="mt-1 text-xs text-[var(--color-text-muted)]">
          이미 존재하는 협회의 ID. 모르면 비워두세요.
        </p>
      </div>

      {/* 메모 (선택 — DB 미박제, 운영자 인지용) */}
      <div>
        <label className={labelCls}>메모 (선택)</label>
        <textarea
          value={data.description}
          onChange={(e) => update("description", e.target.value)}
          className={`${inputCls} min-h-[80px] resize-y`}
          placeholder="협회 소개나 운영 메모 (저장되지 않음)"
          maxLength={500}
        />
      </div>
    </div>
  );
}

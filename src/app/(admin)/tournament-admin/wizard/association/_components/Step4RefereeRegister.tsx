"use client";

/**
 * Step4RefereeRegister — 협회 마법사 Step 4 (옵션) Referee 사전 등록 (Phase 6 PR3, 2026-05-15).
 *
 * 왜:
 *   - 협회가 심판/기록원/타이머를 사전 등록 — 매칭 후 user_id 채워지면 활성 심판.
 *   - 옵션 단계 (Q2 결재 = PR3 후속) — 빈 배열 허용 (skip 진행).
 *   - Q7 결재 = 자격번호 검증 0 (1차 미검증 박제, 운영자 책임 입력).
 *
 * 어떻게:
 *   - 동적 row 배열 UI — "심판 추가" 버튼 클릭 시 빈 row append.
 *   - 각 row: name (필수) / license_number / region / contact (선택).
 *   - 행 삭제 버튼 — row 1건 단위.
 *   - 검증: row 1건 이상 있으면 모든 row 의 name 길이 >= 2 필요 (canProceed 부모 계산).
 *   - PR1 API 컨벤션 정합: snake_case key + 빈 배열 = skip 의도.
 */

import type {
  AssociationWizardDraft,
  RefereeInput,
} from "@/lib/tournaments/association-wizard-types";

export interface Step4RefereeRegisterProps {
  // 부모 draft 의 referees 만 받음 (Step1~3 와 동일 인터페이스).
  data: AssociationWizardDraft["referees"];
  onChange: (next: AssociationWizardDraft["referees"]) => void;
}

// 동일 input 토큰 — Step1~3 와 정합 (admin 빨강 본문 금지 룰).
const inputCls =
  "w-full rounded-md border-none bg-[var(--color-border)] px-3 py-2 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-info)]/50";
const labelCls = "mb-1 block text-xs text-[var(--color-text-muted)]";

// 빈 referee row template — "심판 추가" 클릭 시 append.
const EMPTY_ROW: RefereeInput = {
  name: "",
  license_number: "",
  region: "",
  contact: "",
};

export function Step4RefereeRegister({
  data,
  onChange,
}: Step4RefereeRegisterProps) {
  // === row 조작 헬퍼 ===
  function addRow() {
    onChange([...data, { ...EMPTY_ROW }]);
  }

  function removeRow(index: number) {
    onChange(data.filter((_, i) => i !== index));
  }

  function updateRow(index: number, field: keyof RefereeInput, value: string) {
    // 단일 row 부분 갱신 — 다른 row 보존.
    onChange(
      data.map((row, i) =>
        i === index ? { ...row, [field]: value } : row,
      ),
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="flex items-center gap-2 text-base font-bold text-[var(--color-text-primary)]">
        <span className="material-symbols-outlined text-lg text-[var(--color-info)]">
          sports
        </span>
        심판 사전 등록 <span className="text-xs font-normal text-[var(--color-text-muted)]">(선택)</span>
      </h2>

      <p className="text-sm text-[var(--color-text-muted)]">
        협회에 소속된 심판/기록원/타이머를 사전 등록합니다. 회원가입 후 매칭되면
        자동 활성화됩니다. <strong>지금 등록하지 않아도 됩니다</strong> —
        나중에 협회 관리 페이지에서 추가할 수 있습니다.
      </p>

      {/* === 등록된 row 목록 === */}
      {data.length === 0 ? (
        // 빈 상태 안내 — skip 가능 강조.
        <div className="rounded-md border border-dashed border-[var(--color-border)] bg-[var(--color-elevated)] p-6 text-center">
          <span className="material-symbols-outlined text-3xl text-[var(--color-text-muted)]">
            person_off
          </span>
          <p className="mt-2 text-sm text-[var(--color-text-muted)]">
            아직 등록된 심판이 없습니다.
          </p>
          <p className="mt-1 text-xs text-[var(--color-text-muted)]">
            아래 &quot;심판 추가&quot; 버튼으로 1건씩 등록하거나, 등록 없이 다음 단계로 진행하세요.
          </p>
        </div>
      ) : (
        // row 리스트 — 각 row 4 input + 삭제 버튼.
        <div className="space-y-3">
          {data.map((row, index) => (
            <div
              key={index}
              className="rounded-md border border-[var(--color-border)] bg-[var(--color-elevated)] p-3"
            >
              {/* row 헤더 — 번호 + 삭제 버튼 */}
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-bold text-[var(--color-text-muted)]">
                  심판 #{index + 1}
                </span>
                <button
                  type="button"
                  onClick={() => removeRow(index)}
                  className="flex items-center gap-1 rounded-[4px] px-2 py-1 text-xs text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-border)] hover:text-[var(--color-error)]"
                  aria-label={`심판 #${index + 1} 삭제`}
                >
                  <span className="material-symbols-outlined text-base">
                    delete
                  </span>
                  삭제
                </button>
              </div>

              {/* 입력 grid — 2 column (sm 이상) */}
              <div className="grid gap-2 sm:grid-cols-2">
                <div>
                  <label className={labelCls}>
                    이름 <span className="text-[var(--color-error)]">*</span>
                  </label>
                  <input
                    type="text"
                    value={row.name}
                    onChange={(e) => updateRow(index, "name", e.target.value)}
                    className={inputCls}
                    placeholder="홍길동"
                    maxLength={50}
                  />
                </div>
                <div>
                  <label className={labelCls}>자격번호 (선택)</label>
                  <input
                    type="text"
                    value={row.license_number ?? ""}
                    onChange={(e) =>
                      updateRow(index, "license_number", e.target.value)
                    }
                    className={inputCls}
                    placeholder="예: KBA-R-12345"
                    maxLength={50}
                  />
                </div>
                <div>
                  <label className={labelCls}>지역 (선택)</label>
                  <input
                    type="text"
                    value={row.region ?? ""}
                    onChange={(e) => updateRow(index, "region", e.target.value)}
                    className={inputCls}
                    placeholder="예: 서울특별시"
                    maxLength={20}
                  />
                </div>
                <div>
                  <label className={labelCls}>연락처 (선택)</label>
                  <input
                    type="tel"
                    value={row.contact ?? ""}
                    onChange={(e) =>
                      updateRow(index, "contact", e.target.value)
                    }
                    className={inputCls}
                    placeholder="010-0000-0000"
                    maxLength={50}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* === 심판 추가 버튼 === */}
      <button
        type="button"
        onClick={addRow}
        className="flex w-full items-center justify-center gap-2 rounded-[4px] border border-dashed border-[var(--color-info)]/50 bg-[var(--color-info)]/5 px-4 py-3 text-sm font-bold text-[var(--color-info)] transition-colors hover:bg-[var(--color-info)]/10"
      >
        <span className="material-symbols-outlined text-base">add</span>
        심판 추가
      </button>

      {/* 안내 — Q7 결재 박제 (1차 미검증) */}
      <div className="rounded-md border border-[var(--color-border)] bg-[var(--color-elevated)] p-3 text-xs text-[var(--color-text-muted)]">
        <p className="flex items-start gap-1.5">
          <span className="material-symbols-outlined text-base text-[var(--color-info)]">
            info
          </span>
          <span>
            자격번호는 1차 미검증 박제입니다 (운영자 책임 입력). 추후 협회 API
            연동 또는 OCR 검증 기능이 추가될 예정입니다. 등록하지 않고 진행해도
            마법사는 정상 완료됩니다.
          </span>
        </p>
      </div>
    </div>
  );
}

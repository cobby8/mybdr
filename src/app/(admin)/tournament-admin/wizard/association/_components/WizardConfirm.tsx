"use client";

/**
 * WizardConfirm — 협회 마법사 최종 확인 (Phase 6 PR2, 2026-05-15).
 *
 * 왜:
 *   - 마법사 Step 4 — 3 step 입력값 미리보기 + 생성 트리거.
 *   - 실제 API 호출은 부모 (page.tsx) 가 책임 — 본 컴포넌트는 표시 UI 만.
 *
 * 어떻게:
 *   - props: draft (전체) — Step1~3 데이터 표시.
 *   - 가독성 우선: 라벨 + 값 grid (2 column).
 *   - 검증 실패 시 안내 메시지 (부모가 canProceed=false 박제 시 다음 단계 가드).
 */

import type { AssociationWizardDraft } from "@/lib/tournaments/association-wizard-types";
import {
  ASSOCIATION_ADMIN_ROLE_OPTIONS,
  ASSOCIATION_LEVEL_OPTIONS,
} from "@/lib/tournaments/association-wizard-constants";

export interface WizardConfirmProps {
  draft: AssociationWizardDraft;
}

// 한국어 라벨 헬퍼 — enum value → label 변환.
function getRoleLabel(value: string): string {
  return (
    ASSOCIATION_ADMIN_ROLE_OPTIONS.find((opt) => opt.value === value)?.label ??
    value
  );
}

function getLevelLabel(value: string): string {
  return (
    ASSOCIATION_LEVEL_OPTIONS.find((opt) => opt.value === value)?.label ?? value
  );
}

// 천 단위 콤마 표시 — 운영자 가독성.
function formatKRW(value: number): string {
  return `${value.toLocaleString("ko-KR")} 원`;
}

// 라벨/값 row — 미리보기 표.
function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1 border-b border-[var(--color-border)] py-2 last:border-b-0 sm:flex-row sm:items-center sm:gap-4">
      <div className="w-full text-xs text-[var(--color-text-muted)] sm:w-32">
        {label}
      </div>
      <div className="flex-1 text-sm font-bold text-[var(--color-text-primary)]">
        {value || (
          <span className="text-[var(--color-text-muted)] font-normal">
            (없음)
          </span>
        )}
      </div>
    </div>
  );
}

export function WizardConfirm({ draft }: WizardConfirmProps) {
  return (
    <div className="space-y-5">
      <h2 className="flex items-center gap-2 text-base font-bold text-[var(--color-text-primary)]">
        <span className="material-symbols-outlined text-lg text-[var(--color-info)]">
          check_circle
        </span>
        확인 및 생성
      </h2>

      <p className="text-sm text-[var(--color-text-muted)]">
        아래 내용으로 협회를 생성합니다. 잘못 입력된 항목이 있다면 이전 단계로
        돌아가 수정하세요.
      </p>

      {/* === Step 1: 협회 정보 === */}
      <section className="rounded-md border border-[var(--color-border)] bg-[var(--color-elevated)] p-4">
        <h3 className="mb-2 flex items-center gap-1.5 text-sm font-bold text-[var(--color-text-primary)]">
          <span className="material-symbols-outlined text-base text-[var(--color-info)]">
            domain
          </span>
          협회 정보
        </h3>
        <Row label="이름" value={draft.association.name} />
        <Row label="코드" value={draft.association.code} />
        <Row label="단계" value={getLevelLabel(draft.association.level)} />
        {draft.association.level === "sido" && (
          <Row label="시·도" value={draft.association.region_sido} />
        )}
        <Row label="상위 협회 ID" value={draft.association.parent_id} />
      </section>

      {/* === Step 2: 사무국장 === */}
      <section className="rounded-md border border-[var(--color-border)] bg-[var(--color-elevated)] p-4">
        <h3 className="mb-2 flex items-center gap-1.5 text-sm font-bold text-[var(--color-text-primary)]">
          <span className="material-symbols-outlined text-base text-[var(--color-info)]">
            person_add
          </span>
          사무국장
        </h3>
        <Row label="회원" value={draft.admin.user_label} />
        <Row label="역할" value={getRoleLabel(draft.admin.role)} />
      </section>

      {/* === Step 3: 단가표 === */}
      <section className="rounded-md border border-[var(--color-border)] bg-[var(--color-elevated)] p-4">
        <h3 className="mb-2 flex items-center gap-1.5 text-sm font-bold text-[var(--color-text-primary)]">
          <span className="material-symbols-outlined text-base text-[var(--color-info)]">
            payments
          </span>
          배정비 단가
        </h3>
        <Row label="주심" value={formatKRW(draft.fee_setting.main_fee)} />
        <Row label="부심" value={formatKRW(draft.fee_setting.sub_fee)} />
        <Row
          label="기록"
          value={formatKRW(draft.fee_setting.recorder_fee)}
        />
        <Row label="타이머" value={formatKRW(draft.fee_setting.timer_fee)} />
      </section>

      {/* === Step 4: 심판 사전 등록 (옵션) === PR3 추가 */}
      <section className="rounded-md border border-[var(--color-border)] bg-[var(--color-elevated)] p-4">
        <h3 className="mb-2 flex items-center gap-1.5 text-sm font-bold text-[var(--color-text-primary)]">
          <span className="material-symbols-outlined text-base text-[var(--color-info)]">
            sports
          </span>
          심판 사전 등록
          <span className="ml-1 text-xs font-normal text-[var(--color-text-muted)]">
            ({draft.referees.length}건)
          </span>
        </h3>
        {draft.referees.length === 0 ? (
          // 빈 배열 = skip 표시 — 운영자 인지 명확.
          <p className="py-2 text-sm text-[var(--color-text-muted)]">
            등록 없이 진행합니다. 협회 관리 페이지에서 추후 추가할 수 있습니다.
          </p>
        ) : (
          // 등록된 referee 목록 미리보기 — 이름 + 자격번호 한 줄.
          <ul className="space-y-1">
            {draft.referees.map((r, i) => (
              <li
                key={i}
                className="flex items-center gap-2 border-b border-[var(--color-border)] py-2 text-sm last:border-b-0"
              >
                <span className="text-[var(--color-text-muted)]">
                  #{i + 1}
                </span>
                <span className="font-bold text-[var(--color-text-primary)]">
                  {r.name}
                </span>
                {r.license_number && (
                  <span className="text-xs text-[var(--color-text-muted)]">
                    ({r.license_number})
                  </span>
                )}
                {r.region && (
                  <span className="ml-auto text-xs text-[var(--color-text-muted)]">
                    {r.region}
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* 안내 — 생성 후 흐름 */}
      <div className="rounded-md border border-[var(--color-border)] bg-[var(--color-elevated)] p-3 text-xs text-[var(--color-text-muted)]">
        <p className="flex items-start gap-1.5">
          <span className="material-symbols-outlined text-base text-[var(--color-info)]">
            info
          </span>
          <span>
            생성 버튼을 누르면 협회 본체 → 사무국장 → 단가표
            {draft.referees.length > 0 ? " → 심판 사전 등록" : ""} 순으로
            저장됩니다. 도중에 실패하면 알림이 표시되며, 완료된 단계는 그대로
            보존됩니다.
          </span>
        </p>
      </div>
    </div>
  );
}

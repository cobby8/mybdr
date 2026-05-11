/**
 * 종이 기록지 헤더 — 대회/매치/심판/기록원/타임키퍼 입력 + 표시.
 *
 * 2026-05-11 — Phase 1-B-2 신규.
 *
 * 자동 fill (server prop):
 *   - 대회명 / 매치 round_label / 코트 / 일시
 *
 * 입력 (Phase 1-B-2 = 표시 텍스트만, audit/인쇄용):
 *   - 심판 1심·2심·3심 / 기록원 / 타임키퍼
 *   - 본 turn 은 폼 상태만 보관 (DB 박제 X) — submit 시 BFF 로 전달 → audit context 에만 포함.
 *   - Phase 4 (작전 타임아웃) 또는 인쇄 PDF (Phase 6) 단계에서 정식 DB 컬럼 검토.
 */

"use client";

import type { ChangeEvent } from "react";

export interface HeaderInputs {
  refereeMain: string;
  refereeSub1: string;
  refereeSub2: string;
  recorder: string;
  timekeeper: string;
}

interface ScoreSheetHeaderProps {
  tournamentName: string;
  matchLabel: string; // "결승" / "8강 #1" 등
  matchCode: string | null;
  scheduledAtLabel: string | null;
  courtLabel: string | null;
  values: HeaderInputs;
  onChange: (next: HeaderInputs) => void;
  disabled?: boolean;
}

export function ScoreSheetHeader({
  tournamentName,
  matchLabel,
  matchCode,
  scheduledAtLabel,
  courtLabel,
  values,
  onChange,
  disabled,
}: ScoreSheetHeaderProps) {
  // 단일 update 패턴 — values 전체 spread + key 갱신
  const update = (key: keyof HeaderInputs) => (e: ChangeEvent<HTMLInputElement>) => {
    onChange({ ...values, [key]: e.target.value });
  };

  return (
    <div
      className="mb-6 rounded-[12px] p-4"
      style={{
        backgroundColor: "var(--color-surface)",
        border: "1px solid var(--color-border)",
      }}
    >
      {/* 매치 메타 정보 (server prop — 자동 fill) */}
      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div>
          <div className="text-xs text-[var(--color-text-muted)]">대회</div>
          <div className="text-sm font-medium text-[var(--color-text-primary)]">
            {tournamentName}
          </div>
        </div>
        <div>
          <div className="text-xs text-[var(--color-text-muted)]">매치</div>
          <div className="text-sm font-medium text-[var(--color-text-primary)]">
            {matchLabel}
            {matchCode && (
              <span className="ml-1 text-xs text-[var(--color-text-muted)]">
                ({matchCode})
              </span>
            )}
          </div>
        </div>
        <div>
          <div className="text-xs text-[var(--color-text-muted)]">일시</div>
          <div className="text-sm font-medium text-[var(--color-text-primary)]">
            {scheduledAtLabel ?? "—"}
          </div>
        </div>
        <div>
          <div className="text-xs text-[var(--color-text-muted)]">코트</div>
          <div className="text-sm font-medium text-[var(--color-text-primary)]">
            {courtLabel ?? "—"}
          </div>
        </div>
      </div>

      {/* 심판 / 기록원 / 타임키퍼 입력 */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <HeaderInput
          label="1심"
          value={values.refereeMain}
          onChange={update("refereeMain")}
          disabled={disabled}
        />
        <HeaderInput
          label="2심"
          value={values.refereeSub1}
          onChange={update("refereeSub1")}
          disabled={disabled}
        />
        <HeaderInput
          label="3심"
          value={values.refereeSub2}
          onChange={update("refereeSub2")}
          disabled={disabled}
        />
        <HeaderInput
          label="기록원"
          value={values.recorder}
          onChange={update("recorder")}
          disabled={disabled}
        />
        <HeaderInput
          label="타임키퍼"
          value={values.timekeeper}
          onChange={update("timekeeper")}
          disabled={disabled}
        />
      </div>
    </div>
  );
}

function HeaderInput({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs text-[var(--color-text-muted)]">
        {label}
      </span>
      <input
        type="text"
        value={value}
        onChange={onChange}
        disabled={disabled}
        maxLength={30}
        className="w-full rounded-[4px] border-none bg-[var(--color-elevated)] px-2 py-1.5 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] disabled:opacity-50"
        placeholder="이름"
      />
    </label>
  );
}

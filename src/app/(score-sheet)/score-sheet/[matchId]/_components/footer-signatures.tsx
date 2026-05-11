/**
 * FooterSignatures — Phase 5 (2026-05-12).
 *
 * 왜 (이유):
 *   FIBA PDF 양식 풋터 영역 (Scorer / Assistant scorer / Timer / Shot clock operator
 *   + Referee / Umpire 1 / Umpire 2 + Captain's signature in case of protest) + 매치 노트
 *   박제. FIBA 양식 1 페이지 A4 세로의 풋터 영역 정합 (underscore border-bottom 라인).
 *
 * 동작:
 *   - 8 입력 텍스트 (서명 = 텍스트 입력 / 사용자 결재 §2)
 *   - 헤더 자동 prefill: 마운트 시 헤더 referee / umpire1 / umpire2 값을 풋터 refereeSign /
 *     umpire1Sign / umpire2Sign 의 초기값으로 prefill. 사용자가 풋터를 수정하면 dirty flag
 *     박제 → 이후 헤더 변경은 풋터에 미반영 (사용자 의도 보존).
 *   - 노트 textarea (선택 — 부상 / 사고 / 특이사항)
 *
 * 절대 룰:
 *   - var(--*) 토큰만 / lucide-react ❌ / Material Symbols Outlined 만
 *   - 빨강 본문 텍스트 ❌
 *   - 입력 = border-bottom only (FIBA 양식 underscore 정합)
 *   - placeholder 5단어 이내 (룰 12) — 본 컴포넌트는 placeholder 미사용 (FIBA 양식 정합 — 빈 underscore)
 *   - 터치 영역 44px+ (input min-height 44px)
 */

"use client";

import { useEffect, useRef } from "react";
import type { ChangeEvent } from "react";
import type { SignaturesState } from "@/lib/score-sheet/signature-types";
import {
  SIGNATURE_MAX_LENGTH,
  CAPTAIN_SIGNATURE_MAX_LENGTH,
  NOTES_MAX_LENGTH,
} from "@/lib/score-sheet/signature-types";

interface FooterSignaturesProps {
  // 풋터 상태 (8 입력 + notes)
  values: SignaturesState;
  onChange: (next: SignaturesState) => void;
  // 헤더 자동 prefill source — FibaHeader 와 별개 박제. 마운트 시 1회 복사.
  headerReferee?: string;
  headerUmpire1?: string;
  headerUmpire2?: string;
  disabled?: boolean;
}

export function FooterSignatures({
  values,
  onChange,
  headerReferee,
  headerUmpire1,
  headerUmpire2,
  disabled,
}: FooterSignaturesProps) {
  // 헤더 → 풋터 자동 prefill (mount 1회).
  //
  // 이유: FIBA 양식 풋터의 Referee / Umpire 1 / Umpire 2 는 헤더와 같은 사람일 가능성 99%.
  //   사용자가 또 입력하면 중복 부담 → 헤더 값을 풋터 초기값으로 복사.
  //
  // dirty flag 패턴:
  //   - 풋터 값이 빈 문자열 = 아직 사용자 미입력 → 헤더 값 prefill 안전
  //   - 풋터 값이 비어있지 않음 = 사용자가 이미 입력 (draft 복원 또는 수동 수정) → prefill skip
  //   - 사용자 입력 후에는 헤더 변경이 풋터에 미반영 (의도 보존)
  const didPrefillRef = useRef(false);
  useEffect(() => {
    if (didPrefillRef.current) return;
    // 1회만 시도 — draft 복원 후 mount 라면 풋터 이미 값 보유 → skip
    didPrefillRef.current = true;
    const patch: Partial<SignaturesState> = {};
    if (!values.refereeSign && headerReferee) {
      patch.refereeSign = headerReferee;
    }
    if (!values.umpire1Sign && headerUmpire1) {
      patch.umpire1Sign = headerUmpire1;
    }
    if (!values.umpire2Sign && headerUmpire2) {
      patch.umpire2Sign = headerUmpire2;
    }
    if (Object.keys(patch).length > 0) {
      onChange({ ...values, ...patch });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 단일 update 패턴 — values 전체 spread + key 갱신
  const update =
    (key: keyof SignaturesState) =>
    (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      onChange({ ...values, [key]: e.target.value });
    };

  return (
    <section
      className="mt-4 w-full px-4 py-3"
      style={{
        backgroundColor: "var(--color-surface)",
        borderTop: "1px solid var(--color-border)",
        borderBottom: "1px solid var(--color-border)",
      }}
    >
      <h2
        className="mb-3 text-[10px] font-semibold uppercase tracking-wider"
        style={{ color: "var(--color-text-muted)" }}
      >
        Signatures
      </h2>

      {/* 좌측 (운영자 측) — Scorer / Asst Scorer / Timer / Shot Clock Operator */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <SigInput
          label="Scorer"
          value={values.scorer}
          onChange={update("scorer")}
          maxLength={SIGNATURE_MAX_LENGTH}
          disabled={disabled}
        />
        <SigInput
          label="Assistant scorer"
          value={values.asstScorer}
          onChange={update("asstScorer")}
          maxLength={SIGNATURE_MAX_LENGTH}
          disabled={disabled}
        />
        <SigInput
          label="Timer"
          value={values.timer}
          onChange={update("timer")}
          maxLength={SIGNATURE_MAX_LENGTH}
          disabled={disabled}
        />
        <SigInput
          label="Shot clock operator"
          value={values.shotClockOperator}
          onChange={update("shotClockOperator")}
          maxLength={SIGNATURE_MAX_LENGTH}
          disabled={disabled}
        />
      </div>

      {/* 구분선 — FIBA 양식 풋터의 좌·우 영역 분할 */}
      <div
        className="my-3 h-px w-full"
        style={{ backgroundColor: "var(--color-border)" }}
      />

      {/* 우측 (심판진) — Referee / Umpire 1 / Umpire 2 */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <SigInput
          label="Referee"
          value={values.refereeSign}
          onChange={update("refereeSign")}
          maxLength={SIGNATURE_MAX_LENGTH}
          disabled={disabled}
        />
        <SigInput
          label="Umpire 1"
          value={values.umpire1Sign}
          onChange={update("umpire1Sign")}
          maxLength={SIGNATURE_MAX_LENGTH}
          disabled={disabled}
        />
        <SigInput
          label="Umpire 2"
          value={values.umpire2Sign}
          onChange={update("umpire2Sign")}
          maxLength={SIGNATURE_MAX_LENGTH}
          disabled={disabled}
        />
      </div>

      {/* 구분선 */}
      <div
        className="my-3 h-px w-full"
        style={{ backgroundColor: "var(--color-border)" }}
      />

      {/* 하단 (주장 서명 — 항의 시에만 박제) */}
      <SigInput
        label="Captain's signature in case of protest"
        value={values.captainSignature}
        onChange={update("captainSignature")}
        maxLength={CAPTAIN_SIGNATURE_MAX_LENGTH}
        disabled={disabled}
      />

      {/* 매치 노트 (선택 — 부상 / 사고 / 특이사항) */}
      <div className="mt-4">
        <label className="block">
          <span
            className="block text-[10px] font-semibold uppercase tracking-wider"
            style={{ color: "var(--color-text-muted)" }}
          >
            Notes (선택)
          </span>
          <textarea
            value={values.notes}
            onChange={update("notes")}
            disabled={disabled}
            maxLength={NOTES_MAX_LENGTH}
            rows={3}
            className="mt-1 w-full rounded-[4px] bg-transparent px-2 py-2 text-sm focus:outline-none disabled:opacity-50"
            style={{
              color: "var(--color-text-primary)",
              border: "1px solid var(--color-border)",
              minHeight: 88,
              resize: "vertical",
            }}
          />
          {/* 글자수 카운터 — NOTES_MAX_LENGTH 가 보이도록 */}
          <div
            className="mt-1 text-right text-[10px]"
            style={{ color: "var(--color-text-muted)" }}
          >
            {values.notes.length} / {NOTES_MAX_LENGTH}
          </div>
        </label>
      </div>
    </section>
  );
}

/**
 * 서명 입력 1행 — FIBA 양식 underscore (border-bottom only).
 *
 * 이유: PDF 양식과 동일한 시각적 정합 — 박스/배경 없이 underscore 한 줄.
 *   터치 영역 보장 위해 input min-height 44px.
 */
function SigInput({
  label,
  value,
  onChange,
  maxLength,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  maxLength: number;
  disabled?: boolean;
}) {
  return (
    <label className="block">
      <span
        className="block text-[10px] font-semibold uppercase tracking-wider"
        style={{ color: "var(--color-text-muted)" }}
      >
        {label}
      </span>
      <input
        type="text"
        value={value}
        onChange={onChange}
        disabled={disabled}
        maxLength={maxLength}
        className="w-full bg-transparent px-1 pb-0.5 pt-2 text-sm focus:outline-none disabled:opacity-50"
        style={{
          color: "var(--color-text-primary)",
          borderBottom: "1px solid var(--color-border)",
          minHeight: 44, // 터치 영역 (FIBA 룰 13)
          touchAction: "manipulation",
        }}
      />
    </label>
  );
}

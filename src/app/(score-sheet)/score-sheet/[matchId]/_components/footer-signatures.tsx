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
  // Phase 8 — frameless 모드. 단일 외곽 박스 안에서 자체 border 제거.
  frameless?: boolean;
}

export function FooterSignatures({
  values,
  onChange,
  headerReferee,
  headerUmpire1,
  headerUmpire2,
  disabled,
  frameless,
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

  // Phase 8 — frameless 모드: 단일 외곽 박스 안에서 자체 border 제거.
  //   가로 펼침 = Scorer/Asst/Timer/Shot Clock 한 줄 (4 컬럼) + Referee/Umpire 1·2 한 줄 (3 컬럼)
  //   + Captain 한 줄 → FIBA PDF 정합.
  const sectionStyle: React.CSSProperties = frameless
    ? {}
    : {
        backgroundColor: "var(--color-surface)",
        border: "1px solid var(--color-border)",
      };
  // Phase 11 — 풋터 영역 ~9% (목표 ~104px) 운영진 세로 4줄 fit. px-2 py-0.5 컴팩트.
  //   계산: 운영진 4줄 × 26px = 104px + 심판 1줄 26 + 주장 1줄 26 = ~156px (A4 fit OK).
  const sectionClass = frameless
    ? "fiba-frameless w-full px-2 py-0.5"
    : "mt-4 w-full px-4 py-3";

  return (
    // Phase 7-A → Phase 8 — 디자인 정합 (FIBA PDF 1:1): rounded-0 / shadow X / frameless 옵션
    <section className={sectionClass} style={sectionStyle}>
      {/* Phase 8 — Signatures 헤더 제거 (FIBA PDF 정합 — 헤더 없이 라벨만).
          frameless 모드에서 라벨 만으로 충분. */}

      {/* Phase 11 §3 (2026-05-12) — 운영진 4 컬럼 가로 → 세로 4줄 (FIBA 정합 / reviewer Major).
          이유: FIBA 종이기록지 풋터 = 운영진 4 라벨이 세로 4줄 배치
          (Scorer: ____ / Assistant scorer: ____ / Timer: ____ / Shot Clock Operator: ____).
          frameless=true (단일 박스 / FIBA PDF 정합) = 세로 4줄 / frameless=false (회귀) = 기존 grid 유지. */}
      {frameless ? (
        <div className="flex flex-col gap-0">
          <SigInput
            label="Scorer"
            value={values.scorer}
            onChange={update("scorer")}
            maxLength={SIGNATURE_MAX_LENGTH}
            disabled={disabled}
            inline
            labelWidth={140}
          />
          <SigInput
            label="Assistant scorer"
            value={values.asstScorer}
            onChange={update("asstScorer")}
            maxLength={SIGNATURE_MAX_LENGTH}
            disabled={disabled}
            inline
            labelWidth={140}
          />
          <SigInput
            label="Timer"
            value={values.timer}
            onChange={update("timer")}
            maxLength={SIGNATURE_MAX_LENGTH}
            disabled={disabled}
            inline
            labelWidth={140}
          />
          <SigInput
            label="Shot clock operator"
            value={values.shotClockOperator}
            onChange={update("shotClockOperator")}
            maxLength={SIGNATURE_MAX_LENGTH}
            disabled={disabled}
            inline
            labelWidth={140}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-x-2 gap-y-0 sm:grid-cols-4">
          <SigInput
            label="Scorer"
            value={values.scorer}
            onChange={update("scorer")}
            maxLength={SIGNATURE_MAX_LENGTH}
            disabled={disabled}
            inline={false}
          />
          <SigInput
            label="Assistant scorer"
            value={values.asstScorer}
            onChange={update("asstScorer")}
            maxLength={SIGNATURE_MAX_LENGTH}
            disabled={disabled}
            inline={false}
          />
          <SigInput
            label="Timer"
            value={values.timer}
            onChange={update("timer")}
            maxLength={SIGNATURE_MAX_LENGTH}
            disabled={disabled}
            inline={false}
          />
          <SigInput
            label="Shot clock operator"
            value={values.shotClockOperator}
            onChange={update("shotClockOperator")}
            maxLength={SIGNATURE_MAX_LENGTH}
            disabled={disabled}
            inline={false}
          />
        </div>
      )}

      {/* Phase 8 — 심판진 3 컬럼 가로 1줄 (FIBA PDF 정합).
          Referee / Umpire 1 / Umpire 2 — frameless 시 구분선 X (단일 외곽 박스 안).
          Phase 9 — mt-0.5 / gap-x-2 gap-y-0 컴팩트 */}
      <div className="mt-0.5 grid grid-cols-1 gap-x-2 gap-y-0 sm:grid-cols-3">
        <SigInput
          label="Referee"
          value={values.refereeSign}
          onChange={update("refereeSign")}
          maxLength={SIGNATURE_MAX_LENGTH}
          disabled={disabled}
          inline={frameless}
        />
        <SigInput
          label="Umpire 1"
          value={values.umpire1Sign}
          onChange={update("umpire1Sign")}
          maxLength={SIGNATURE_MAX_LENGTH}
          disabled={disabled}
          inline={frameless}
        />
        <SigInput
          label="Umpire 2"
          value={values.umpire2Sign}
          onChange={update("umpire2Sign")}
          maxLength={SIGNATURE_MAX_LENGTH}
          disabled={disabled}
          inline={frameless}
        />
      </div>

      {/* Phase 8 — 주장 서명 (항의 시) — Phase 9: 한 줄 full-width / mt-0.5 */}
      <div className="mt-0.5">
        <SigInput
          label="Captain's signature in case of protest"
          value={values.captainSignature}
          onChange={update("captainSignature")}
          maxLength={CAPTAIN_SIGNATURE_MAX_LENGTH}
          disabled={disabled}
          inline={frameless}
        />
      </div>

      {/* Phase 9 — Notes textarea (선택).
          frameless=true (단일 박스 / A4 1 페이지 fit) = Notes 숨김 (A4 fit 보장).
          frameless=false (legacy 박스 모드) = Notes 유지 (회귀 안전망).
          이유: FIBA PDF 양식에는 Notes 영역 없음 + A4 fit 필요. 운영자가 필요 시 외부 메모 사용. */}
      {!frameless && (
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
              className="mt-1 w-full bg-transparent px-2 py-2 text-sm focus:outline-none disabled:opacity-50"
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
      )}
    </section>
  );
}

/**
 * 서명 입력 1행 — FIBA 양식 underscore (border-bottom only).
 *
 * 이유: PDF 양식과 동일한 시각적 정합 — 박스/배경 없이 underscore 한 줄.
 *   터치 영역 보장 위해 input min-height 44px.
 *
 * Phase 8 — inline 모드 추가:
 *   true = "Scorer: ___________" 같이 라벨 + underscore input 가 한 줄 (FIBA PDF 정합).
 *   false = 라벨 위 + input 아래 (기존 박스 모드).
 */
function SigInput({
  label,
  value,
  onChange,
  maxLength,
  disabled,
  inline,
  labelWidth,
}: {
  label: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  maxLength: number;
  disabled?: boolean;
  inline?: boolean;
  // Phase 11 §3 — 운영진 세로 4줄에서 라벨 정렬을 맞추기 위한 고정 width (px).
  //   "Shot clock operator" 가 가장 긴 라벨 → 140px 정합.
  //   미지정 시 자동 (기존 동작).
  labelWidth?: number;
}) {
  if (inline) {
    // Phase 8 inline (FIBA PDF 정합) — 라벨 + underscore input 한 줄.
    // Phase 9 — 행 22px 컴팩트 (A4 1 페이지 fit). 터치 영역 보완은 inline 행 전체 click 가능.
    // Phase 11 §3 — 라벨 width 고정 (labelWidth) 시 운영진 4줄 라벨 우측 정렬 통일.
    return (
      <label className="flex items-baseline gap-1 overflow-hidden">
        <span
          className="shrink-0 text-[10px] font-semibold uppercase tracking-wider"
          style={{
            color: "var(--color-text-muted)",
            width: labelWidth ? `${labelWidth}px` : undefined,
          }}
        >
          {label}
        </span>
        <input
          type="text"
          value={value}
          onChange={onChange}
          disabled={disabled}
          maxLength={maxLength}
          className="min-w-0 flex-1 bg-transparent pb-0 text-xs focus:outline-none disabled:opacity-50"
          style={{
            color: "var(--color-text-primary)",
            borderBottom: "1px solid var(--color-text-primary)",
            // Phase 11 — 행 높이 26px (운영진 세로 4줄 = 4 × 26 = 104px / A4 1 페이지 fit).
            //   Phase 9 = 22px → Phase 11 = 26px (FIBA 정합 정렬 가독성 ↑).
            minHeight: 26,
            touchAction: "manipulation",
          }}
        />
      </label>
    );
  }
  // 기존 박스 모드 (frameless=false / 회귀 안전망)
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

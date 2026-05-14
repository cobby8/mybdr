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
 *
 * 2026-05-12 — Phase 13 푸터 운영진 가로 1줄 (사용자 결재 §5 / 이미지 30).
 *   frameless=true 일 때 운영진 4명 (Scorer/Assistant scorer/Timer/Shot clock operator)
 *   = 세로 4줄 → 가로 1줄 (4 컬럼 grid). 라벨 9px / labelWidth 제거. 공간 절약 우선
 *   (FIBA 정합보다 A4 fit 우선 — 사용자 결재).
 *   심판진 (Referee/Umpire 1·2) + 주장 = 기존 유지 (변경 0).
 *
 * 2026-05-12 — Phase 14 푸터 운영진 세로 4줄 복원 (사용자 결재 §2 / 이미지 33).
 *   이유: Phase 13 가로 1줄 = 공간 절약은 좋았으나 FIBA 종이기록지 표준 위반.
 *     사용자 직접 결재 (이미지 33) — FIBA 정합 세로 4줄 복원.
 *     A4 정확 비율 강제 (_print.css aspect-ratio) 로 fit 자동 보장 → 공간 절약 우선순위 ↓.
 *   복원 사항:
 *     - `grid-cols-4` 가로 1줄 → `flex flex-col gap-0` 세로 4줄
 *     - `compact` prop 제거 (SigInput compact 모드 사용 안 함)
 *     - `labelWidth=140` 복원 (Phase 11 — "Shot Clock Operator" 가장 긴 라벨 정렬)
 *   심판진 + 주장 = 변경 0 (Phase 13 유지).
 *
 * 2026-05-12 — Phase 15 풋터 좌측 50% 안 fit 압축 (사용자 결재 §1 §2 / 이미지 35).
 *   이유: 풋터가 frame 가로 펼침 (잘못된 위치 / Phase 14) → score-sheet-form.tsx 에서
 *     좌측 col 안 Team B 아래로 이동 (FIBA PDF 정합). 풋터 가로 폭 100% → 50% 로 축소되므로
 *     라벨/심판진 압축 필요.
 *   변경:
 *     - frameless 모드 운영진 labelWidth=140 → 100 (좁은 50% 컬럼 안 fit)
 *     - frameless 모드 심판진 grid-cols-3 → flex flex-col gap-0 (가로 3컬럼 → 세로 3줄)
 *     - frameless 모드 심판진 + 주장도 labelWidth=100 통일 (운영진과 시각 일관)
 *   frameless=false (회귀) = 변경 0.
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
  // Phase 19 (2026-05-13) — padding 강화 (사용자 결재 §5 / 여백 일관 4~6px).
  //   px-2 py-0.5 → px-3 py-1 (좌우 12px / 상하 4px / 시인성 ↑).
  //   계산: 운영진 4줄 × 28px = 112px + 심판 1줄 28 + Umpire 1·2 가로 묶음 28 + 주장 1줄 28 = ~196px.
  const sectionClass = frameless
    ? "fiba-frameless w-full px-3 py-1"
    : "mt-4 w-full px-4 py-3";

  return (
    // Phase 7-A → Phase 8 — 디자인 정합 (FIBA PDF 1:1): rounded-0 / shadow X / frameless 옵션
    <section className={sectionClass} style={sectionStyle}>
      {/* Phase 8 — Signatures 헤더 제거 (FIBA PDF 정합 — 헤더 없이 라벨만).
          frameless 모드에서 라벨 만으로 충분. */}

      {/* Phase 14 → Phase 15 (2026-05-12) — 운영진 4명 세로 4줄 (사용자 결재 §2 / 이미지 33+35).
          이유: FIBA PDF 정합 세로 4줄 복원 (Phase 14) + 좌측 50% 컬럼 안 fit (Phase 15).
          labelWidth=140 → 100 (좁은 50% 컬럼 안 fit / "Shot clock operator" 라벨은 글자 줄임 또는 줄바꿈).
          frameless=false (회귀) = 기존 grid 4컬럼 유지. */}
      {frameless ? (
        <div className="flex flex-col gap-0">
          <SigInput
            label="Scorer"
            value={values.scorer}
            onChange={update("scorer")}
            maxLength={SIGNATURE_MAX_LENGTH}
            disabled={disabled}
            inline
            labelWidth={100}
          />
          <SigInput
            label="Assistant scorer"
            value={values.asstScorer}
            onChange={update("asstScorer")}
            maxLength={SIGNATURE_MAX_LENGTH}
            disabled={disabled}
            inline
            labelWidth={100}
          />
          <SigInput
            label="Timer"
            value={values.timer}
            onChange={update("timer")}
            maxLength={SIGNATURE_MAX_LENGTH}
            disabled={disabled}
            inline
            labelWidth={100}
          />
          <SigInput
            label="Shot clock operator"
            value={values.shotClockOperator}
            onChange={update("shotClockOperator")}
            maxLength={SIGNATURE_MAX_LENGTH}
            disabled={disabled}
            inline
            labelWidth={100}
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

      {/* Phase 8 → Phase 15 → Phase 16 (2026-05-13) — 심판진 (Referee / Umpire 1 / Umpire 2).
          Phase 16 사용자 결재 §6 (이미지 40-41 / FIBA PDF 정합):
            - frameless=true:
                Referee = 단독 한 줄 (라벨 100 + underscore full)
                Umpire 1 + Umpire 2 = 같은 한 줄 가로 묶음 (각 50% / 라벨 더 짧게)
                상단 = mt-1 + border-top (운영진 영역과 분리)
            - frameless=false (legacy): 변경 0 (기존 grid-cols-3 가로 유지). */}
      {frameless ? (
        <div
          className="mt-1 flex flex-col gap-0 pt-0.5"
          style={{ borderTop: "1px solid var(--color-border)" }}
        >
          <SigInput
            label="Referee"
            value={values.refereeSign}
            onChange={update("refereeSign")}
            maxLength={SIGNATURE_MAX_LENGTH}
            disabled={disabled}
            inline
            labelWidth={100}
          />
          {/* Umpire 1 + Umpire 2 가로 묶음 (사용자 결재 §6 / FIBA PDF 정합).
              각 50% 폭 / 라벨 width 60 (좁은 폭 안 fit). */}
          <div className="flex items-baseline gap-2">
            <div className="min-w-0 flex-1">
              <SigInput
                label="Umpire 1"
                value={values.umpire1Sign}
                onChange={update("umpire1Sign")}
                maxLength={SIGNATURE_MAX_LENGTH}
                disabled={disabled}
                inline
                labelWidth={60}
              />
            </div>
            <div className="min-w-0 flex-1">
              <SigInput
                label="Umpire 2"
                value={values.umpire2Sign}
                onChange={update("umpire2Sign")}
                maxLength={SIGNATURE_MAX_LENGTH}
                disabled={disabled}
                inline
                labelWidth={60}
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-0.5 grid grid-cols-1 gap-x-2 gap-y-0 sm:grid-cols-3">
          <SigInput
            label="Referee"
            value={values.refereeSign}
            onChange={update("refereeSign")}
            maxLength={SIGNATURE_MAX_LENGTH}
            disabled={disabled}
            inline={false}
          />
          <SigInput
            label="Umpire 1"
            value={values.umpire1Sign}
            onChange={update("umpire1Sign")}
            maxLength={SIGNATURE_MAX_LENGTH}
            disabled={disabled}
            inline={false}
          />
          <SigInput
            label="Umpire 2"
            value={values.umpire2Sign}
            onChange={update("umpire2Sign")}
            maxLength={SIGNATURE_MAX_LENGTH}
            disabled={disabled}
            inline={false}
          />
        </div>
      )}

      {/* Phase 8 → Phase 15 → Phase 16 (2026-05-13) — 주장 서명 한 줄 컴팩트.
          사용자 결재 §6 (이미지 40 FIBA PDF 정합):
            - 라벨 = Title case "Captain's signature in case of protest" 한 줄 (줄바꿈 X)
            - 라벨 width = 200 (좌측 50% 컬럼 안 fit / Phase 15 의 100 → 200 늘려 한 줄 유지)
            - 상단 = mt-1 + border-top (심판진 영역과 분리 / FIBA PDF 정합)
            - whiteSpace: nowrap = 줄바꿈 절대 방지 */}
      <div
        className="mt-1 pt-0.5"
        style={{
          borderTop: frameless ? "1px solid var(--color-border)" : undefined,
        }}
      >
        <SigInput
          label="Captain's signature in case of protest"
          value={values.captainSignature}
          onChange={update("captainSignature")}
          maxLength={CAPTAIN_SIGNATURE_MAX_LENGTH}
          disabled={disabled}
          inline={frameless}
          labelWidth={frameless ? 200 : undefined}
          labelNoWrap
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
  labelNoWrap,
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
  // Phase 14 — Phase 13 의 compact prop 제거 (운영진 세로 4줄 복원 / 사용처 0).
  labelWidth?: number;
  // Phase 16 (2026-05-13) — 라벨 줄바꿈 금지 옵션 (Captain's signature ... 한 줄 강제용).
  labelNoWrap?: boolean;
}) {
  if (inline) {
    // Phase 8 inline (FIBA PDF 정합) — 라벨 + underscore input 한 줄.
    // Phase 16 (2026-05-13) — uppercase 제거 → Title case 보존 (FIBA PDF 정합 / 사용자 결재 §6).
    // Phase 19 (2026-05-13) — 라벨 font-semibold → font-bold (FIBA 정합 / 사용자 결재 §2 / bold 10px 통일).
    //   - 라벨 10px bold tracking-wider (Title case 유지 = FIBA PDF 정합 Phase 16).
    //   - input minHeight 22 → 24px (시인성 ↑ / 사용자 결재 §3 데이터 영역 확장).
    // PR-S8 (2026-05-15 rev2) — .pap-lbl (라벨) + .pap-u (input underscore) 클래스 병행.
    //   rev2 ScoreSheet.bottom.jsx L114~115 정합. Tailwind 운영 룰 + 시안 .pap-* 룰 양립.
    const labelClass = "pap-lbl shrink-0 text-[10px] font-bold tracking-wider";
    const inputMinHeight = 24;
    return (
      <label className="flex items-baseline gap-1 overflow-hidden">
        <span
          className={labelClass}
          style={{
            color: "var(--color-text-muted)",
            width: labelWidth ? `${labelWidth}px` : undefined,
            // Phase 16 (2026-05-13) — Captain 라벨 한 줄 강제 (사용자 결재 §6).
            whiteSpace: labelNoWrap ? "nowrap" : undefined,
            overflow: labelNoWrap ? "hidden" : undefined,
            textOverflow: labelNoWrap ? "ellipsis" : undefined,
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
          className="pap-u min-w-0 flex-1 bg-transparent pb-0 text-xs focus:outline-none disabled:opacity-50"
          style={{
            color: "var(--color-text-primary)",
            borderBottom: "1px solid var(--color-text-primary)",
            // Phase 11 — 행 높이 26px / Phase 13 compact = 22px (가로 1줄 / A4 fit).
            minHeight: inputMinHeight,
            touchAction: "manipulation",
          }}
        />
      </label>
    );
  }
  // 기존 박스 모드 (frameless=false / 회귀 안전망).
  // Phase 19 — 라벨 font-semibold → font-bold (Inline 모드와 룰 일관 / 사용자 결재 §2).
  return (
    <label className="block">
      <span
        className="block text-[10px] font-bold uppercase tracking-wider"
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

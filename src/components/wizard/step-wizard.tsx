"use client";

import type { ReactElement, ReactNode } from "react";
import { StepIndicator, type StepWizardStep } from "./step-indicator";

/* ============================================================
 * StepWizard (BDR v2 다단계 입력 위저드 셸)
 *
 * 이유(왜):
 *   Onboarding/CourtAdd/RefereeRequest/GameReport/SeriesCreate 등
 *   "여러 단계 입력 → 마지막에 제출" 흐름이 시안마다 반복된다.
 *   각 페이지가 독자적으로 step state + progress bar + prev/next
 *   버튼 마크업을 복붙하는 대신, 공용 셸로 위임해 시안 일관성을
 *   확보한다.
 *
 * 동작 모델:
 *   - currentStep 은 호출자(부모)가 useState 로 보유하고
 *     onStepChange 콜백으로 전파 (controlled component)
 *   - 본문(children)은 호출자가 currentStep 으로 분기해서 그린다
 *   - "다음" 버튼은 마지막 단계에서만 finishLabel 로 바뀌고
 *     onFinish 콜백을 호출 (마지막 클릭 = 제출 트리거)
 *
 * 시안 매핑 (Dev/design/BDR v2 (1)/screens/OnboardingV2.jsx):
 *   - StepIndicator: 시안 L60~L68 progress bar 박제 + 단계 번호/라벨 추가
 *   - 푸터 prev/next: 시안 L238~L244 의 .btn / .btn--primary / .btn--lg
 *     2버튼 좌우 배치 그대로
 *   - 시안은 본문+푸터를 .card 로 감싼다. 공용 컴포넌트는 카드 외피를
 *     호출자에게 위임 (className 으로 외피 결정 가능)
 *
 * 디자인 토큰: var(--ink-mute) / var(--ff-display) / var(--border)
 * ============================================================ */

// 외부 사용처가 step-wizard 모듈만 import 해도 되도록 타입 재export
export type { StepWizardStep } from "./step-indicator";

export interface StepWizardProps {
  steps: StepWizardStep[];
  currentStep: number; // 0-based 인덱스
  onStepChange: (index: number) => void;
  children: ReactNode; // 현재 단계 본문 (호출자가 currentStep 으로 분기)

  // 푸터 버튼 커스터마이즈
  prevLabel?: string; // 기본 "이전"
  nextLabel?: string; // 기본 "다음"
  finishLabel?: string; // 기본 "완료"
  onFinish?: () => void; // 마지막 단계에서 "완료" 클릭 시 호출
  canGoNext?: boolean; // 기본 true (false 면 next 버튼 disabled)
  hidePrev?: boolean; // 첫 단계는 자동 숨김. 명시적 강제 가능

  className?: string;
  title?: string; // 헤더 제목 (선택)
  subtitle?: string; // 헤더 부제 (선택)
}

export function StepWizard({
  steps,
  currentStep,
  onStepChange,
  children,
  prevLabel = "이전",
  nextLabel = "다음",
  finishLabel = "완료",
  onFinish,
  canGoNext = true,
  hidePrev,
  className,
  title,
  subtitle,
}: StepWizardProps): ReactElement {
  const total = steps.length;
  const isFirst = currentStep === 0;
  const isLast = currentStep === total - 1;
  // 첫 단계에선 자동으로 이전 버튼 숨김. hidePrev=true 면 명시적으로 항상 숨김
  const showPrev = hidePrev !== true && !isFirst;

  // "다음" 클릭: 마지막 단계면 onFinish, 아니면 다음 인덱스로 이동
  const handleNext = () => {
    if (isLast) {
      onFinish?.();
    } else {
      onStepChange(currentStep + 1);
    }
  };

  // "이전" 클릭: 첫 단계면 동작 차단 (showPrev 가 false 라 사실상 호출 안 됨)
  const handlePrev = () => {
    if (!isFirst) {
      onStepChange(currentStep - 1);
    }
  };

  return (
    <div className={className}>
      {/* 헤더 (title 또는 subtitle 가 있을 때만 노출) */}
      {(title || subtitle) && (
        <div style={{ marginBottom: 24 }}>
          {title && (
            <h1
              style={{
                fontFamily: "var(--ff-display)",
                fontSize: 24,
                fontWeight: 800,
                margin: 0,
                letterSpacing: "-0.01em",
              }}
            >
              {title}
            </h1>
          )}
          {subtitle && (
            <p
              style={{
                color: "var(--ink-mute)",
                fontSize: 14,
                marginTop: 6,
                marginBottom: 0,
              }}
            >
              {subtitle}
            </p>
          )}
        </div>
      )}

      {/* 진행 표시 (progress bar + 단계 번호/라벨) */}
      <StepIndicator steps={steps} currentStep={currentStep} />

      {/* 본문: 호출자가 currentStep 으로 분기해서 그린다 */}
      <div style={{ minHeight: 280, marginBottom: 32 }}>{children}</div>

      {/* 푸터: 좌측 prev (선택), 우측 next/finish */}
      <div
        style={{
          display: "flex",
          gap: 8,
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        {showPrev ? (
          // 시안 L239 의 .btn 클래스 그대로
          <button type="button" className="btn" onClick={handlePrev}>
            {prevLabel}
          </button>
        ) : (
          // prev 가 없을 때도 우측 버튼이 항상 우측에 붙도록 빈 자리만 차지
          <span />
        )}
        <button
          type="button"
          className="btn btn--primary"
          onClick={handleNext}
          disabled={!canGoNext}
          // disabled 시각 피드백: 시안 L141 (스타일 칩) opacity 0.3 패턴 절충
          style={{ opacity: canGoNext ? 1 : 0.5 }}
        >
          {isLast ? finishLabel : nextLabel}
        </button>
      </div>
    </div>
  );
}

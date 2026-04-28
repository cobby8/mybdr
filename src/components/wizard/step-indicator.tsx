"use client";

import type { ReactElement } from "react";

/* ============================================================
 * StepIndicator (BDR v2 위저드 진행 표시)
 *
 * 이유(왜):
 *   Onboarding/CourtAdd/RefereeRequest/GameReport/SeriesCreate 등
 *   다단계 입력 화면이 늘어나면서 "현재 몇 단계인지" 보여주는 패턴이
 *   시안마다 흩어져 있다. 시안 OnboardingV2 의 progress bar 패턴
 *   (`.step-indicator__bar-track` 4px 트랙 + `var(--accent)` 채움)을
 *   기준으로 박제하고, 각 단계 번호+라벨을 추가해 공용으로 쓴다.
 *
 * 시안 매핑:
 *   - 시안 OnboardingV2 L65~L67 progress bar (높이 4 / var(--bg-alt) /
 *     var(--accent) / 0.3s 트랜지션) 그대로
 *   - 시안에는 "STEP X / Y" 텍스트 한 줄만 있지만, 본 컴포넌트는
 *     공용으로 쓰이도록 단계별 번호 동그라미 + 라벨까지 노출
 *
 * 디자인 토큰: var(--accent) / var(--bg-alt) / var(--ink) /
 *   var(--ink-mute) / var(--ink-dim) / var(--ok) / var(--ff-mono)
 * ============================================================ */

// 위저드 단계 정의 (StepWizard 와 공유). 본 파일이 단일 진실 원천.
export interface StepWizardStep {
  id: string;
  label: string;
  optional?: boolean;
}

export interface StepIndicatorProps {
  steps: StepWizardStep[];
  currentStep: number; // 0-based 인덱스
}

export function StepIndicator({
  steps,
  currentStep,
}: StepIndicatorProps): ReactElement {
  const total = steps.length;
  // 진행률 계산: 현재 단계까지 채워진 비율 (0-based 이므로 +1)
  const progress = total > 0 ? ((currentStep + 1) / total) * 100 : 0;

  return (
    <div className="step-indicator">
      {/* progress bar (시안 OnboardingV2 L65~L67 박제) */}
      <div className="step-indicator__bar-track">
        <div
          className="step-indicator__bar-fill"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* 단계별 번호 + 라벨 */}
      <div className="step-indicator__steps">
        {steps.map((step, i) => {
          const isCurrent = i === currentStep;
          const isDone = i < currentStep; // 지나간 단계 (체크 표시)
          // 클래스명 조합: 현재/완료 상태별 스타일 분기
          const numClass = [
            "step-indicator__num",
            isCurrent ? "step-indicator__num--current" : "",
            isDone ? "step-indicator__num--done" : "",
          ]
            .filter(Boolean)
            .join(" ");
          return (
            <div key={step.id} className="step-indicator__step">
              <div className={numClass}>{isDone ? "✓" : i + 1}</div>
              <div className="step-indicator__label">
                {step.label}
                {step.optional && (
                  <span className="step-indicator__optional">(선택)</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <style jsx>{`
        .step-indicator {
          margin-bottom: 28px;
        }
        .step-indicator__bar-track {
          height: 4px;
          background: var(--bg-alt);
          border-radius: 2px;
          margin-bottom: 12px;
          overflow: hidden;
        }
        .step-indicator__bar-fill {
          height: 100%;
          background: var(--accent);
          transition: width 0.3s ease;
        }
        .step-indicator__steps {
          display: flex;
          gap: 4px;
          justify-content: space-between;
        }
        .step-indicator__step {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          flex: 1;
          min-width: 0;
        }
        .step-indicator__num {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: var(--bg-alt);
          color: var(--ink-mute);
          display: grid;
          place-items: center;
          font-family: var(--ff-mono);
          font-size: 12px;
          font-weight: 700;
        }
        .step-indicator__num--current {
          background: var(--accent);
          color: #fff;
        }
        .step-indicator__num--done {
          background: var(--ok);
          color: #fff;
        }
        .step-indicator__label {
          font-size: 11px;
          color: var(--ink-mute);
          text-align: center;
          line-height: 1.3;
          /* 좁은 영역에서 라벨이 잘리지 않도록 워드브레이크 허용 */
          word-break: keep-all;
        }
        .step-indicator__optional {
          color: var(--ink-dim);
          font-size: 10px;
          margin-left: 2px;
        }
        @media (max-width: 720px) {
          .step-indicator__label {
            font-size: 10px;
          }
          .step-indicator__num {
            width: 24px;
            height: 24px;
            font-size: 11px;
          }
        }
      `}</style>
    </div>
  );
}

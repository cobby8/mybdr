/**
 * EnrollStepper — Track B Phase4 StepDots 박제 (Toss 룩)
 *
 * 왜 바꿨나(이유):
 *  기존은 32px 원 + 라벨 + 연결선의 5-step 인디케이터였다.
 *  시안 Apply.jsx 는 단순한 점 3칸(StepDots step total) 형태로 축소됐다.
 *  → 작은 점 + 현재 단계만 길쭉한 알약으로 표시하는 Toss StepDots 로 교체.
 *
 *  StepDef 타입은 page.tsx 가 계속 쓰므로 시그니처 보존(라벨 l 은 미사용해도 유지).
 */

export interface StepDef {
  // 1부터 시작하는 단계 번호
  n: number;
  // 한글 라벨 (StepDots 에서는 미표시 — 시그니처 호환용 보존)
  l: string;
}

interface EnrollStepperProps {
  steps: StepDef[];
  // 현재 활성 단계 번호 (1-based)
  current: number;
}

export function EnrollStepper({ steps, current }: EnrollStepperProps) {
  // 점 N칸 — adaptive(부문 없으면 2칸) 그대로 steps.length 만큼
  return (
    <div className="ts-steps">
      {steps.map((s) => {
        // 이미 지났거나 현재면 채워진 점(data-on), 현재면 길쭉한 알약(data-cur)
        const on = current >= s.n;
        const cur = current === s.n;
        return (
          <span
            key={s.n}
            className="ts-steps__dot"
            data-on={on ? "true" : "false"}
            data-cur={cur ? "true" : "false"}
          />
        );
      })}
    </div>
  );
}

/**
 * OnboardingStepper — Phase 7C-4 (AU2 시안 AuStepper 박제)
 *
 * 이유 (왜):
 *   시안 AU2 Onboarding 은 카드 상단에 5단계 진행 표시기(AuStepper)를 둔다.
 *   운영은 5개 별도 라우트(identity/environment/basketball/preferences/setup)라
 *   wizard 전체 통합은 라우팅 변경(stop) → 각 page 의 단조로운 eyebrow 텍스트
 *   ("STEP N / 10")를 본 시각 stepper 로 교체하여 시안 톤만 반영.
 *
 * 어떻게:
 *   - server component (no client hook) — page header 에서 current 만 주입.
 *   - 시안 ONB_STEPS 순서를 운영 실제 진입 순서로 매핑:
 *       0 본인인증 → 1 활동환경 → 2 농구정보 → 3 선호 → 4 완료
 *   - 각 단계 상태: i < current = done(체크) / i === current = on(강조) / 나머지 todo.
 *   - 시안 .au-stepper/.au-sstep 스타일을 onboarding.css 에 ob2- prefix 로 박제
 *     (au-* prefix 충돌 0 / globals.css 토큰만 사용).
 *
 * lock: 라우팅·가드·데이터 0 변경. 순수 표시용.
 */

// 운영 진입 순서 기준 5단계 (시안 ONB_STEPS 라벨 답습)
const ONBOARDING_STEPS = [
  { label: "본인 인증" },
  { label: "활동 환경" },
  { label: "농구 정보" },
  { label: "선호" },
  { label: "완료" },
] as const;

export function OnboardingStepper({ current }: { current: number }) {
  return (
    // ordered list — 단계 진행은 의미상 순서 목록
    <ol className="ob2-stepper" aria-label="온보딩 단계 진행">
      {ONBOARDING_STEPS.map((st, i) => {
        // 현재 단계 기준 done / on / todo 3-state 산정 (시안 동일 로직)
        const state = i < current ? "done" : i === current ? "on" : "todo";
        return (
          <li key={st.label} className="ob2-sstep" data-s={state}>
            {/* dot — 완료 단계는 체크 아이콘, 그 외 단계 번호 */}
            <span className="ob2-sstep__dot">
              {state === "done" ? (
                <span className="ico material-symbols-outlined">check</span>
              ) : (
                i + 1
              )}
            </span>
            <span className="ob2-sstep__lbl">{st.label}</span>
          </li>
        );
      })}
    </ol>
  );
}

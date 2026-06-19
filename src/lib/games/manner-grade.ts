/**
 * [M4 wave2] 매너 등급 파생 유틸 — route·page 공용 (로직 중복 0)
 *
 * 왜 별도 파일로 추출하나:
 *   - GET /api/web/users/[id]/profile-trust(라우트)와 /users/[id]/page.tsx(서버 컴포넌트
 *     prisma 직접 파생) 두 곳이 "같은 manner_score → 같은 등급" 으로 일치해야 한다.
 *     한쪽만 임계값을 바꾸면 화면(page)과 API(다른 소비자)가 어긋남 → 단일 소스로 묶는다.
 *
 * ⚠️ manner_score "숫자" 는 이 함수 안에서만 쓰이고 반환값(label/key)에는 절대 들어가지 않는다.
 *    소비자는 등급 라벨 + 토큰 키만 받는다(점수 숫자 비노출 — 낙인/직접 비교 방지).
 *
 * 임계값(DATA-BINDING §2-4 / 01-user-design-decisions §3):
 *   ≥4.5 아주 좋음(excellent) / 4.0~4.4 좋음(good) / 3.0~3.9 보통(normal) / <3.0 주의 필요(caution)
 *   평가 0건(count<=0) 또는 score null → 등급 없음(둘 다 null).
 */

// 등급 키 — 프론트 색상/배지 매핑용 토큰 키. null = 평가 없음.
export type MannerGradeKey = "excellent" | "good" | "normal" | "caution" | null;

export interface MannerGrade {
  /** 등급 라벨("아주 좋음"/"좋음"/"보통"/"주의 필요"). 평가 0건이면 null. */
  label: string | null;
  /** 등급 토큰 키. 프론트가 색상(--ok/--cafe-blue/--ink-mute/--warn)으로 매핑. */
  key: MannerGradeKey;
}

/**
 * manner_score(Decimal→number) + manner_count → 등급 라벨/키.
 * score 숫자는 여기서만 소비되고 반환에 새어나가지 않는다.
 */
export function deriveMannerGrade(
  score: number | null,
  count: number,
): MannerGrade {
  // 평가 0건이면 등급 자체가 없음(점수도 null 가능) → 라벨/키 모두 null.
  if (count <= 0 || score === null) {
    return { label: null, key: null };
  }
  if (score >= 4.5) return { label: "아주 좋음", key: "excellent" };
  if (score >= 4.0) return { label: "좋음", key: "good" };
  if (score >= 3.0) return { label: "보통", key: "normal" };
  return { label: "주의 필요", key: "caution" };
}

/**
 * 등급 키 → CSS 색상 토큰 매핑(시안 D / DATA-BINDING §2-4 표 그대로).
 *   excellent→--ok / good→--cafe-blue / normal→--ink-mute / caution→--warn / null→--ink-mute.
 * 신뢰 카드(점·라벨·게이지 색)가 이 단일 매핑을 쓴다(키→토큰 중복 정의 0).
 */
export function mannerGradeColor(key: MannerGradeKey): string {
  switch (key) {
    case "excellent":
      return "var(--ok)";
    case "good":
      return "var(--cafe-blue)";
    case "normal":
      return "var(--ink-mute)";
    case "caution":
      return "var(--warn)";
    default:
      return "var(--ink-mute)";
  }
}

/**
 * 등급 키 → 게이지 채움 step(1~4). 시안 D 의 4칸 게이지(step 이하 채움)용.
 *   caution=1 / normal=2 / good=3 / excellent=4 / null=0(전부 빈칸).
 */
export function mannerGradeStep(key: MannerGradeKey): number {
  switch (key) {
    case "excellent":
      return 4;
    case "good":
      return 3;
    case "normal":
      return 2;
    case "caution":
      return 1;
    default:
      return 0;
  }
}

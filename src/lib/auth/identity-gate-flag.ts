/**
 * 본인인증 가드 활성화 여부 판정 (PR3 — 2026-05-08).
 *
 * 이유 (왜):
 *   PortOne 콘솔 채널 발급 + Vercel `NEXT_PUBLIC_PORTONE_IDENTITY_CHANNEL_KEY`
 *   환경변수 추가 = 외부 작업 1회 = 가드 자동 ON.
 *   채널 키 없으면 PortOne SDK 호출 자체가 "본인인증 설정이 완료되지 않았습니다"
 *   에러 → 가드를 켜면 사용자가 onboarding 진입해도 인증 불가능.
 *   따라서 채널 키 존재 여부 = 가드 활성 여부 (단일 신호).
 *
 * 어떻게:
 *   `process.env.NEXT_PUBLIC_PORTONE_IDENTITY_CHANNEL_KEY` 가 비어있지 않은 문자열이면 ON.
 *   undefined / 빈 문자열 / whitespace = OFF (mock 모드 = 가드 noop).
 *
 * 보장:
 *   - Next.js 15 App Router 에서 `NEXT_PUBLIC_*` 는 server component 도 접근 가능 (build 시 inline).
 *   - 환경변수 변경 = Vercel 재배포 필요. 런타임 hot swap 불가.
 *   - 롤백 = 환경변수 제거 → 즉시 mock 모드 복귀 (코드 revert 0).
 *
 * 결정 근거: decisions.md [2026-05-08] PR3 layout 가드 mock flag — 옵션 a.
 */
export function isIdentityGateEnabled(): boolean {
  // 환경변수 raw 값 — 빈/undefined/공백 모두 false 처리
  const key = process.env.NEXT_PUBLIC_PORTONE_IDENTITY_CHANNEL_KEY;
  return typeof key === "string" && key.trim().length > 0;
}

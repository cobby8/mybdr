/**
 * 2026-05-11 Phase 1 — 코치 신청 토큰 (apply_token) 발급 유틸.
 *
 * 이유(왜): 코치가 비로그인 상태로 자기 팀 명단을 입력할 수 있게 하려면
 *   외부에 노출되는 URL 토큰이 필요. 짧은 ID(BigInt) 노출 시 brute-force 위험 + IDOR.
 *   → randomBytes(32) = 256bit → hex 64자 → 충돌 확률 사실상 0.
 *
 * 사용처:
 *   - POST /api/web/admin/tournaments/[id]/team-applications (Phase 1)
 *   - 토큰 URL = `${origin}/team-apply/${token}` (Phase 2 의 코치 입력 페이지 진입 URL)
 *
 * 보안 룰:
 *   - 토큰은 DB UNIQUE — 동일 토큰 발급 충돌 0.
 *   - 만료 = TournamentTeam.apply_token_expires_at 별도 컬럼 (라우트에서 계산).
 *   - IP 레이트리밋은 Phase 2 의 코치 라우트에서 적용 (본 유틸은 발급만 담당).
 */

import { randomBytes } from "crypto";

// 64자 hex (256bit) — Node crypto 의 CSPRNG 사용
export const newApplyToken = (): string => randomBytes(32).toString("hex");

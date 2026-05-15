/**
 * isRecorderAdmin — 전역 기록원 관리자 (recorder_admin) 권한 판정 단일 진입점.
 *
 * 2026-05-15 — PR1 (recorder_admin 역할 신설) 신규.
 *
 * 이유 (왜):
 *   - 기존 권한 매트릭스에 "모든 대회 점수 기록 + 모든 대회 기록원 배정" 권한을 보유한
 *     "전역 기록원 관리자" 등급이 부재. tournament_recorders 는 본인 배정 대회만 / organizer
 *     는 본인 대회만 / super_admin 은 전능. recorder_admin = "기록실 마스터키" (점수+기록원만).
 *   - DB schema 변경 0 — User.admin_role 컬럼 (이미 존재, String?) 에 "recorder_admin"
 *     문자열 박제로 표현. super_admin 분기 패턴 그대로 카피 + 자동 흡수 OR.
 *
 * 어떻게:
 *   - isSuperAdmin 패턴 카피 (느슨한 시그니처 — JwtPayload / web 세션 / null/undefined 허용).
 *   - DB 조회 0 (JWT/세션 payload 만 평가).
 *   - **Q1 결재 = super_admin 자동 흡수**: 내부에서 isSuperAdmin 도 OR 평가 → super_admin
 *     사용자가 recorder_admin 가드에 막히는 회귀 차단 (전능 정책 일관).
 *
 * 통과 조건 (어느 하나라도 true):
 *   - isSuperAdmin(session) === true   (super_admin 자동 흡수 — Q1 결재)
 *   - session.admin_role === "recorder_admin" (DB User.admin_role 명시 박제)
 *
 * 사용 예:
 *   import { isRecorderAdmin } from "@/lib/auth/is-recorder-admin";
 *   if (isRecorderAdmin(session)) return true; // 모든 대회 점수기록/기록원 배정 통과
 *
 * 권한 매트릭스 (scratchpad §1 참조):
 *   - Flutter 점수입력 / 매치목록 / 웹 종이 기록지 → 모든 대회 통과
 *   - 기록원 배정/해제 (`/api/web/tournaments/:id/recorders`) → 모든 대회 통과
 *   - `/referee/admin/*` 진입 + 협회 12 permission → sentinel 자동 통과 (PR3)
 *   - 대회 생성/운영 (Tournament CUD) / 사용자 관리 → ❌ (super_admin 만)
 */

import { isSuperAdmin, type SuperAdminSession } from "./is-super-admin";

// 시그니처: isSuperAdmin 과 호환 (admin_role 옵션 + role 옵션) — JwtPayload / 세션 모두 허용.
// 이유: org-permission 의 JwtPayload (role 필수) + match-stream/lineup 의 {role?, admin_role?}
// 둘 다 호환해야 함. super_admin 자동 흡수를 위해 SuperAdminSession 재사용.
export type RecorderAdminSession = SuperAdminSession;

/**
 * 세션이 recorder_admin 권한 (또는 자동 흡수 super_admin) 을 보유하는지 판정.
 *
 * @param session JWT payload 또는 web 세션 (null/undefined 허용 — 미로그인 false)
 * @returns admin_role === "recorder_admin" 또는 super_admin 이면 true
 *
 * 안전 가드:
 *   - session 자체가 null/undefined 면 false (미로그인 처리)
 *   - super_admin (role 또는 admin_role) 은 자동 통과 — Q1 결재
 */
export function isRecorderAdmin(
  session: RecorderAdminSession | null | undefined,
): boolean {
  // 1) 미로그인 즉시 false (방어)
  if (!session) return false;

  // 2) Q1 결재 — super_admin 자동 흡수 (전능 정책 일관)
  // 사유: super_admin 이 recorder_admin 가드에 막히면 운영 혼선. 모든 super_admin 권한 OR 분기 = 표준.
  if (isSuperAdmin(session)) return true;

  // 3) DB User.admin_role 명시 박제 케이스
  return session.admin_role === "recorder_admin";
}

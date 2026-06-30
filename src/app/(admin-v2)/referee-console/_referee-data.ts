// ============================================================
// referee-console/_referee-data.ts — 심판 콘솔 서버 데이터 헬퍼 (R6-B)
//   ★스코프 = 글로벌 super-admin. 레거시 심판 admin 은 association_id 로 협회별
//     필터하지만, 본 콘솔은 super 전역 → 협회 필터 0 (전 협회 통합 READ).
//   - getRefereeAdminContext: 세션 → super 여부 + 표시용 닉네임. (협회 스코프 키 없음)
//   - 표시 헬퍼(snake DB 값 → 표시 도메인 단일 매핑 · snake 함정 차단).
//   ★백엔드/DB/Prisma 0변경 — READ/집계용 select 만. 레거시 0 import.
// ============================================================

import { getWebSession } from "@/lib/auth/web-session";
import { isSuperAdmin } from "@/lib/auth/is-super-admin";
import { prisma } from "@/lib/db/prisma";

// ★순수 표시/포맷 헬퍼는 _referee-format.ts 로 분리(RSC 경계 위반 빌드 블로커 수정).
//   기존 서버측 import(이 모듈에서 가져오던 곳)가 깨지지 않도록 그대로 re-export.
//   (client 컴포넌트는 _referee-format.ts 를 직접 import — server 전용 prisma/세션 비유입.)
export type { Tone } from "./_referee-format";
export {
  AV,
  avColor,
  fmtDate,
  fmtDateTime,
  won,
  n,
  refereeName,
  levelBadge,
  refereeStatus,
  roleTypeLabel,
  regionLabel,
  assignRoleLabel,
  assignStatusBadge,
  matchLabel,
  settleStatusBadge,
  evalStatusBadge,
  certVerifyBadge,
  docTypeLabel,
  ocrStatusBadge,
} from "./_referee-format";

export type RefereeAdminContext = {
  userId: bigint;
  isSuper: boolean;
  name: string; // 셸 UserChip 표시명(닉네임 또는 "관리자")
};

// 세션 → 콘솔 컨텍스트. 미로그인/비-super 는 호출부(layout)에서 차단.
//   ★협회 스코프 키(associationId) 없음 — READ 는 전역(협회 필터 제거)이므로 불필요.
export async function getRefereeAdminContext(): Promise<RefereeAdminContext | null> {
  const session = await getWebSession();
  if (!session) return null;

  const userId = BigInt(session.sub);
  const isSuper = isSuperAdmin(session);

  // 표시용 닉네임만 조회(권한 판정은 isSuperAdmin 으로 끝 — DB 역할조회 불필요).
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { nickname: true },
  });

  return {
    userId,
    isSuper,
    name: user?.nickname || "심판 운영",
  };
}

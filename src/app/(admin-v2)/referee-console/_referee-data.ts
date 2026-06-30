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
  // ★스코프 키(4-1 토대) — null = 전역(전 협회 통합 READ). super 전용인 현 콘솔은 항상 null.
  //   4-2 에서 협회 admin 개방 시 이 값에 소속 협회 id 를 담아 page 들이 협회별 필터하도록 확장 예정.
  //   ⚠ 현재는 어떤 page 도 이 값을 소비하지 않음 → 추가해도 동작 변화 0.
  associationId: bigint | null;
  name: string; // 셸 UserChip 표시명(닉네임 또는 "관리자")
};

// 세션 → 콘솔 컨텍스트. 미로그인/비-super 는 호출부(layout)에서 차단.
//   ★현재 스코프 = 글로벌 super → associationId = null(협회 필터 0, 전역 READ).
export async function getRefereeAdminContext(): Promise<RefereeAdminContext | null> {
  const session = await getWebSession();
  if (!session) return null;

  const userId = BigInt(session.sub);
  const isSuper = isSuperAdmin(session);

  // ── 4-2 협회 스코핑 분기 자리(현재 미사용) ──────────────────────────────
  //   향후 협회 admin 도 본 콘솔에 진입시키려면 여기서 getAssociationAdmin()(admin-guard.ts)
  //   을 호출해 super 가 아닐 때 admin.associationId 를 associationId 로 채운다.
  //   지금은 layout 이 super 만 통과시키므로 호출 불필요 — 전역(null) 고정.
  const associationId: bigint | null = null;

  // 표시용 닉네임만 조회(권한 판정은 isSuperAdmin 으로 끝 — DB 역할조회 불필요).
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { nickname: true },
  });

  return {
    userId,
    isSuper,
    associationId,
    name: user?.nickname || "심판 운영",
  };
}

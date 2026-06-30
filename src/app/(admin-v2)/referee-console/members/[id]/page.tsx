// ============================================================
// referee-console/members/[id]/page.tsx — 심판 상세 (서버 Prisma 직접 READ)
//   레거시 (referee)/referee/admin/members/[id] 포팅(4-4b).
//   ★READ = 서버 Prisma 직접(전역·협회 필터 0).
//     사유: 레거시 GET /api/web/admin/associations/members/[id] 는 getAssociationAdmin
//           IDOR 가드(referee.association_id === admin.associationId)라 super 가 타 협회
//           심판 상세 조회 시 403. → verify/settlements/members 목록과 동일하게 Prisma 직접
//           READ 로 전 협회 통합 조회(snake 함정도 서버에서 차단·camel 변환 직접).
//   ★백엔드/DB/Prisma 0변경 — READ 용 select 만. resident_id_enc(민감) 미조회.
//   ★mutation(매칭/검증 토글)은 클라(_detail)에서 adminFetch 로 기존 API 호출.
//   - 잘못된 id/없는 심판 → notFound().
// ============================================================

import { notFound } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import {
  fmtDate,
  refereeName,
  levelBadge,
  roleTypeLabel,
  refereeStatus,
  regionLabel,
  assignRoleLabel,
  assignStatusBadge,
  settleStatusBadge,
  certVerifyBadge,
  won,
} from "../../_referee-data";
import { MemberDetail, type RfDetailData } from "./_detail";

export const dynamic = "force-dynamic";

export default async function RefereeMemberDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  // BigInt 변환 전 숫자 검증(비숫자 → 404).
  if (!/^\d+$/.test(id)) notFound();
  const refereeId = BigInt(id);

  // 전역 심판 상세(협회 필터 0) — 표시 필드만 select. 민감 컬럼(resident_id_enc) 제외.
  const referee = await prisma.referee.findUnique({
    where: { id: refereeId },
    select: {
      id: true,
      user_id: true,
      registered_name: true,
      registered_phone: true,
      registered_birth_date: true,
      verified_name: true,
      level: true,
      license_number: true,
      role_type: true,
      status: true,
      region_sido: true,
      region_sigungu: true,
      match_status: true,
      matched_at: true,
      joined_at: true,
      // 자격증(전체·최근 발급 우선).
      certificates: {
        orderBy: { issued_at: "desc" },
        select: {
          id: true,
          cert_type: true,
          cert_grade: true,
          issuer: true,
          cert_number: true,
          issued_at: true,
          expires_at: true,
          verified: true,
        },
      },
      // 최근 배정 10건.
      assignments: {
        orderBy: { assigned_at: "desc" },
        take: 10,
        select: {
          id: true,
          role: true,
          status: true,
          assigned_at: true,
          memo: true,
        },
      },
      // 최근 정산 10건.
      settlements: {
        orderBy: { created_at: "desc" },
        take: 10,
        select: {
          id: true,
          amount: true,
          status: true,
          paid_at: true,
          created_at: true,
          memo: true,
        },
      },
    },
  });

  if (!referee) notFound();

  // 매칭된 유저 정보(있으면). user_id null = 사전등록 미매칭 → 등록 정보 사용.
  const user = referee.user_id
    ? await prisma.user.findUnique({
        where: { id: referee.user_id },
        select: { name: true, phone: true, email: true, birth_date: true },
      })
    : null;

  const lv = levelBadge(referee.level);
  const stt = refereeStatus(referee.status);

  // ★클라 props 직렬화 — BigInt→string, Date→표시 문자열로 변환(경계 직렬화 안전).
  const data: RfDetailData = {
    id: referee.id.toString(),
    name: refereeName(referee),
    matchStatus: referee.match_status === "matched" ? "matched" : "unmatched",
    // 프로필 표시 필드(매칭 유저 우선 → 사전등록 fallback).
    profile: {
      userName: user?.name ?? referee.registered_name ?? null,
      userPhone: user?.phone ?? referee.registered_phone ?? null,
      userEmail: user?.email ?? null,
      userBirthDate: fmtDate(user?.birth_date ?? referee.registered_birth_date),
      levelLabel: lv.label,
      levelTone: lv.tone,
      licenseNumber: referee.license_number,
      roleLabel: roleTypeLabel(referee.role_type),
      statusLabel: stt.st,
      statusTone: stt.sttone,
      region: regionLabel(referee.region_sido, referee.region_sigungu),
      joinedAt: fmtDate(referee.joined_at),
    },
    // 매칭 섹션(사전등록 정보).
    matching: {
      registeredName: referee.registered_name,
      registeredPhone: referee.registered_phone,
      matchedAt: referee.matched_at ? fmtDate(referee.matched_at) : null,
    },
    certificates: referee.certificates.map((c) => {
      const vb = certVerifyBadge(c.verified, c.expires_at);
      return {
        id: c.id.toString(),
        title: `${c.cert_grade} ${c.cert_type === "game_official" ? "경기원" : "심판"} 자격증`,
        issuer: c.issuer,
        certNumber: c.cert_number,
        issued: fmtDate(c.issued_at),
        expire: fmtDate(c.expires_at),
        verified: c.verified,
        badge: vb.label,
        tone: vb.tone,
      };
    }),
    assignments: referee.assignments.map((a) => {
      const ab = assignStatusBadge(a.status);
      return {
        id: a.id.toString(),
        role: assignRoleLabel(a.role),
        statusLabel: ab.label,
        statusTone: ab.tone,
        assignedAt: fmtDate(a.assigned_at),
        memo: a.memo,
      };
    }),
    settlements: referee.settlements.map((s) => {
      const sb = settleStatusBadge(s.status);
      return {
        id: s.id.toString(),
        amount: won(s.amount),
        statusLabel: sb.label,
        statusTone: sb.tone,
        date: fmtDate(s.paid_at ?? s.created_at),
        memo: s.memo,
      };
    }),
  };

  return <MemberDetail data={data} />;
}

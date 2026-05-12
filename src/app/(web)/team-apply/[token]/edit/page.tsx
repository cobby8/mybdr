/**
 * 2026-05-12 — 코치 명단 수정 페이지 (사용자 요청).
 * 2026-05-13 — manager_* 미등록 팀 가드 제거 + hasCoachInfo prop 전달 (최초 1회 setup 흐름).
 *
 * 흐름:
 *   1. URL: /team-apply/[token]/edit
 *   2. server fetch: 토큰 + applied_via='coach_token' 검증 (이미 제출된 토큰만)
 *   3. client: 코치 이름 + 전화번호 인증 (hasCoachInfo=false 면 setup 흐름)
 *   4. 인증 통과 시 → 기존 명단 fetch (POST /players) → 수정 폼 (TeamApplyForm)
 *   5. 저장 → PUT /api/web/team-apply/[token] (DELETE + INSERT 트랜잭션)
 */

import { notFound } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { EditFlow } from "./edit-flow";

export const dynamic = "force-dynamic";

const TOKEN_REGEX = /^[a-f0-9]{64}$/;

type PageProps = { params: Promise<{ token: string }> };

export default async function TeamApplyEditPage({ params }: PageProps) {
  const { token } = await params;
  if (!TOKEN_REGEX.test(token)) notFound();

  const tt = await prisma.tournamentTeam.findUnique({
    where: { apply_token: token },
    include: {
      team: { select: { name: true } },
      tournament: {
        select: { id: true, name: true, startDate: true, endDate: true, venue_name: true },
      },
      _count: { select: { players: true } },
    },
  });

  if (!tt) {
    return (
      <ErrorView title="유효하지 않은 링크" message="존재하지 않는 토큰입니다." />
    );
  }

  const now = new Date();
  if (tt.apply_token_expires_at && tt.apply_token_expires_at < now) {
    return (
      <ErrorView
        title="만료된 링크"
        message={`이 링크는 ${tt.apply_token_expires_at.toLocaleDateString("ko-KR")} 까지였습니다. 운영자에게 재발급을 요청하세요.`}
      />
    );
  }

  if (tt.applied_via !== "coach_token") {
    return (
      <ErrorView
        title="아직 명단 미제출"
        message={`이 팀은 아직 명단을 제출하지 않았습니다. 먼저 명단을 제출하세요.`}
      />
    );
  }

  // 2026-05-13 — manager_* 미등록 팀 가드 제거.
  //   기존: ErrorView 로 페이지 진입 차단 (의도와 정반대)
  //   변경: hasCoachInfo prop 으로 EditFlow 에 위임 — 미등록 팀은 setup 흐름 진입
  const hasCoachInfo = !!(tt.manager_name && tt.manager_phone);

  // 종별 룰 fetch (수정 시에도 동일 검증)
  const divisionRule = tt.category
    ? await prisma.tournamentDivisionRule.findFirst({
        where: { tournamentId: tt.tournament.id, code: tt.category },
        select: {
          code: true, label: true,
          birthYearMin: true, birthYearMax: true,
          gradeMin: true, gradeMax: true,
        },
      })
    : null;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
      {/* 헤더 */}
      <div
        className="mb-6 rounded-[4px] border p-4 sm:p-5"
        style={{
          borderColor: "var(--color-border)",
          background: "var(--color-elevated)",
        }}
      >
        <p
          className="text-xs font-semibold uppercase"
          style={{ color: "var(--color-text-muted)", letterSpacing: "0.04em" }}
        >
          명단 수정
        </p>
        <h1
          className="mt-1 text-xl font-bold sm:text-2xl"
          style={{ color: "var(--color-text-primary)" }}
        >
          {tt.team?.name ?? "(이름 없음)"}
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--color-text-muted)" }}>
          {tt.tournament.name} · 종별 {tt.category ?? "—"} · 현재 등록 {tt._count.players}명
        </p>
        <p className="mt-3 text-xs" style={{ color: "var(--color-text-muted)" }}>
          {hasCoachInfo
            ? "최초 등록한 코치 이름과 연락처로 인증 후 수정 가능합니다."
            : "이 팀은 아직 코치 정보가 등록되지 않았습니다. 입력하신 이름·연락처가 본인 인증 정보로 저장됩니다."}
        </p>
      </div>

      <EditFlow
        token={token}
        teamName={tt.team?.name ?? "(이름 없음)"}
        hasCoachInfo={hasCoachInfo}
        divisionRule={
          divisionRule
            ? {
                code: divisionRule.code,
                label: divisionRule.label,
                birthYearMin: divisionRule.birthYearMin,
                birthYearMax: divisionRule.birthYearMax,
                gradeMin: divisionRule.gradeMin,
                gradeMax: divisionRule.gradeMax,
              }
            : null
        }
      />
    </div>
  );
}

function ErrorView({ title, message }: { title: string; message: string }) {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12 text-center">
      <h1 className="text-xl font-bold" style={{ color: "var(--color-text-primary)" }}>
        {title}
      </h1>
      <p className="mt-2 text-sm" style={{ color: "var(--color-text-muted)" }}>
        {message}
      </p>
    </div>
  );
}

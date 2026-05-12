/**
 * 2026-05-11 Phase 3-A — 코치 비로그인 명단 입력 페이지.
 *
 * 진입: 운영자가 카톡/SMS로 발송한 토큰 URL.
 * 흐름:
 *   1) 토큰 server 검증 (만료 / 일회용 / 종별 룰 fetch)
 *   2) 정상 → 안내 + 선수 명단 form (TeamApplyForm — client)
 *   3) 에러 (만료 / 미존재 / 이미 제출) → 메시지 분기 표시
 */

import { notFound } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { gradeToKorean } from "@/lib/utils/korean-grade";
import { TeamApplyForm } from "./team-apply-form";

export const dynamic = "force-dynamic";

const TOKEN_REGEX = /^[a-f0-9]{64}$/;

type PageProps = { params: Promise<{ token: string }> };

export default async function TeamApplyPage({ params }: PageProps) {
  const { token } = await params;
  if (!TOKEN_REGEX.test(token)) notFound();

  const tt = await prisma.tournamentTeam.findUnique({
    where: { apply_token: token },
    include: {
      team: { select: { name: true } },
      tournament: {
        select: {
          id: true, name: true, startDate: true, endDate: true,
          venue_name: true, city: true, district: true,
        },
      },
      _count: { select: { players: true } },
    },
  });

  if (!tt) {
    return (
      <ErrorView
        title="유효하지 않은 링크"
        message="존재하지 않거나 만료된 토큰입니다. 운영자에게 재발급을 요청하세요."
      />
    );
  }

  const now = new Date();

  if (tt.apply_token_expires_at && tt.apply_token_expires_at < now) {
    return (
      <ErrorView
        title="만료된 링크"
        message={`이 링크는 ${formatDate(tt.apply_token_expires_at)} 까지였습니다. 운영자에게 재발급을 요청하세요.`}
      />
    );
  }

  if (tt.applied_via === "coach_token") {
    return (
      <ErrorView
        title="이미 제출된 링크"
        message="이미 명단이 제출되었습니다. 코치 인증 후 수정 가능합니다."
        existingPlayerCount={tt._count.players}
        editLink={`/team-apply/${token}/edit`}
      />
    );
  }

  // 종별 룰 fetch
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
      {/* 헤더: 대회 정보 + 팀 + 만료 */}
      <div className="mb-6 rounded-[4px] border bg-[var(--color-elevated)] p-4 sm:p-5"
        style={{ borderColor: "var(--color-border)" }}>
        <p className="text-xs font-semibold uppercase" style={{ color: "var(--color-text-muted)", letterSpacing: "0.04em" }}>
          참가 신청
        </p>
        <h1 className="mt-1 text-xl font-bold sm:text-2xl" style={{ color: "var(--color-text-primary)" }}>
          {tt.tournament.name}
        </h1>
        <div className="mt-3 grid grid-cols-1 gap-1 text-sm sm:grid-cols-2">
          <div>
            <span style={{ color: "var(--color-text-muted)" }}>팀</span>{" "}
            <span className="font-semibold">{tt.team?.name ?? "-"}</span>
          </div>
          {tt.manager_name && (
            <div>
              <span style={{ color: "var(--color-text-muted)" }}>코치</span>{" "}
              <span className="font-semibold">{tt.manager_name}</span>
            </div>
          )}
          {divisionRule && (
            <div>
              <span style={{ color: "var(--color-text-muted)" }}>종별</span>{" "}
              <span className="font-semibold">{divisionRule.label}</span>
              {/* 2026-05-12 룰 변경 (사용자 요청): 어린 학년 자유 참가 / gradeMax · birthYearMin 안내만 표시.
                  - "N학년 이하" + "N년생 이후 출생" (나이 많은 경우 차단 기준) */}
              {(divisionRule.birthYearMin || divisionRule.gradeMax) && (
                <span style={{ color: "var(--color-text-muted)" }}>
                  {" "}({[
                    divisionRule.gradeMax && `${gradeToKorean(divisionRule.gradeMax)} 이하`,
                    divisionRule.birthYearMin && `${divisionRule.birthYearMin}년생 이후`,
                  ].filter(Boolean).join(" / ")})
                </span>
              )}
            </div>
          )}
          {tt.tournament.startDate && (
            <div>
              <span style={{ color: "var(--color-text-muted)" }}>일정</span>{" "}
              <span>
                {formatDate(tt.tournament.startDate)}
                {tt.tournament.endDate && ` ~ ${formatDate(tt.tournament.endDate)}`}
              </span>
            </div>
          )}
          {tt.tournament.venue_name && (
            <div>
              <span style={{ color: "var(--color-text-muted)" }}>경기장</span>{" "}
              <span>{tt.tournament.venue_name}</span>
            </div>
          )}
          {tt.apply_token_expires_at && (
            <div className="sm:col-span-2">
              <span style={{ color: "var(--color-text-muted)" }}>링크 만료</span>{" "}
              <span style={{ color: "var(--color-warning)" }}>
                {formatDate(tt.apply_token_expires_at)} 까지
              </span>
            </div>
          )}
        </div>
      </div>

      {/* 폼 (client) */}
      <TeamApplyForm
        token={token}
        divisionRule={divisionRule}
      />
    </div>
  );
}

function ErrorView({
  title,
  message,
  existingPlayerCount,
  editLink,
}: {
  title: string;
  message: string;
  existingPlayerCount?: number;
  editLink?: string;
}) {
  return (
    <div className="mx-auto max-w-md px-4 py-12 sm:py-16">
      <div
        className="rounded-[4px] border p-6 text-center"
        style={{ borderColor: "var(--color-border)", background: "var(--color-elevated)" }}
      >
        <span className="material-symbols-outlined text-4xl" style={{ color: "var(--color-warning)" }}>
          info
        </span>
        <h1 className="mt-2 text-lg font-bold" style={{ color: "var(--color-text-primary)" }}>
          {title}
        </h1>
        <p className="mt-2 text-sm" style={{ color: "var(--color-text-muted)" }}>
          {message}
        </p>
        {existingPlayerCount != null && existingPlayerCount > 0 && (
          <p className="mt-3 text-xs" style={{ color: "var(--color-text-muted)" }}>
            등록된 선수: {existingPlayerCount}명
          </p>
        )}
        {editLink && (
          <a href={editLink} className="btn btn--primary mt-4 inline-block">
            수정하기
          </a>
        )}
      </div>
    </div>
  );
}

function formatDate(d: Date): string {
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

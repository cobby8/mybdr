import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";

import { parseMatchCode } from "@/lib/tournaments/match-code";
import { prisma } from "@/lib/db/prisma";

interface PageProps {
  params: Promise<{ code: string }>;
}

/**
 * 매치 코드 v4 deep link — `/match/26-GG-MD21-001` 형식 URL 을
 * `/live/[matchId]` 로 redirect.
 *
 * 외부 링크 / SNS 공유 / QR 인쇄 시 사용 (사용자가 매치 코드만 알아도 라이브로 진입 가능).
 *
 * 동작:
 * 1. URL params.code 추출 (Next.js 15 async params)
 * 2. 대소문자 관용 — `code.toUpperCase()` 후 검증 (URL 은 보통 소문자, 코드는 영대 표준)
 * 3. parseMatchCode 정규식 검증 (형식 오류 → 404)
 * 4. tournament_matches.match_code UNIQUE 조회
 * 5. 매치 발견 → /live/[matchId] redirect (302)
 * 6. 매치 미발견 → 404
 *
 * 의존성:
 * - parseMatchCode (Phase 2 산출물, src/lib/tournaments/match-code.ts) — 순수 함수, DB 의존 0
 * - prisma.tournamentMatch.findFirst (UNIQUE 인덱스 활용 — 빠름)
 *
 * 참조:
 * - 매치 코드 v4 결정: knowledge/decisions.md "매치 코드 v4 체계 채택"
 * - plan: ~/.claude/plans/silvery-prowling-falcon-match-code-v4-feasibility.md (Phase 7)
 */
export default async function MatchCodePage({ params }: PageProps) {
  // Next.js 15 — params 는 Promise (App Router async API)
  const { code } = await params;

  // 대소문자 관용: URL 소문자 입력도 정상 동작 (`/match/26-gg-md21-001` → `26-GG-MD21-001`)
  // 매치 코드는 영대 표준 (`generateMatchCode` 출력) 이므로 정규화 후 검증 필요
  const upperCode = code.toUpperCase();

  // 형식 검증 (정규식만, DB 조회 전 — 잘못된 입력은 빠르게 404)
  const parsed = parseMatchCode(upperCode);
  if (!parsed) {
    notFound();
  }

  // DB 조회 — match_code 가 UNIQUE 컬럼이라 findFirst 도 빠름
  // findUnique 가 아닌 findFirst 인 이유: NULL 안전 (NULL match_code 매치는 자동으로 미일치)
  const match = await prisma.tournamentMatch.findFirst({
    where: { match_code: upperCode },
    select: { id: true },
  });

  if (!match) {
    notFound();
  }

  // 라이브 페이지로 302 redirect (Next.js redirect 는 throw — return 안 됨)
  redirect(`/live/${match.id}`);
}

/**
 * SNS 공유 / 외부 링크 미리보기용 메타데이터
 *
 * 형식 오류 시 일반 fallback 제목 (404 페이지에서도 노출되므로 안전).
 * 매치 발견 여부는 metadata 에서 조회하지 않음 (DB 호출 1회로 절약).
 */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { code } = await params;
  const upperCode = code.toUpperCase();
  const parsed = parseMatchCode(upperCode);

  if (!parsed) {
    return {
      title: "매치를 찾을 수 없습니다 | BDR",
      description: "올바르지 않은 매치 코드입니다.",
    };
  }

  return {
    title: `매치 ${upperCode} | BDR`,
    description: `${parsed.year}년 매치 코드 ${upperCode} 라이브 결과 보기`,
  };
}

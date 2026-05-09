"use client";

/* ============================================================
 * TeamLink — 팀명 → 팀 페이지 (`/teams/[id]`) 글로벌 링크 컴포넌트
 *   (5/10 박제 — 사용자 결정: 매치카드/박스스코어/매치결과 등에서 팀명 클릭 시 팀 페이지 이동)
 *
 * 이유 (왜):
 *  - 매치 카드 / 박스스코어 헤더 / MVP 시상 / 대회 대진표 등 다수 컨텍스트에서
 *    팀명 클릭 → 팀 페이지 이동 패턴 표준화 필요.
 *  - PlayerLink 와 짝을 이뤄 단일 글로벌 패턴 유지 (점진 마이그 옵션 C).
 *  - 게스트 팀 등 Team.id 가 없는 경우 (예: 임시 팀명 표시) 링크 비활성 fallback.
 *
 * 어떻게:
 *  - teamId 없거나 null → `<span>` (단순 텍스트, 클릭 비활성)
 *  - teamId 존재 → `<Link href="/teams/{id}">` + hover 시 underline + opacity 80%
 *
 * 사용 예:
 *   <TeamLink teamId={220} name="아울스" />
 *   // 게스트 팀 / 미등록 팀
 *   <TeamLink teamId={null} name="게스트팀" />
 * ============================================================ */

import Link from "next/link";
import type { CSSProperties } from "react";

type TeamLinkProps = {
  /** Team.id (BigInt → string 또는 number 허용). null/undefined = 미등록/게스트 팀 → 링크 비활성 */
  teamId?: string | number | bigint | null;
  /** 표시 이름 */
  name: string;
  /** 추가 className */
  className?: string;
  /** 추가 inline style */
  style?: CSSProperties;
  /** 새 탭 열기 (기본 false) */
  newTab?: boolean;
};

export function TeamLink({ teamId, name, className, style, newTab }: TeamLinkProps) {
  // teamId 없거나 null → 미등록/게스트 팀 → 링크 비활성 (span)
  if (!teamId) {
    return (
      <span className={className} style={style}>
        {name}
      </span>
    );
  }

  // BigInt → string 변환
  const href = `/teams/${teamId.toString()}`;

  return (
    <Link
      href={href}
      // hover 시에만 underline + opacity-80 — PlayerLink 와 동일 패턴
      className={`transition-colors hover:underline hover:opacity-80 ${className ?? ""}`}
      style={style}
      target={newTab ? "_blank" : undefined}
      rel={newTab ? "noopener noreferrer" : undefined}
    >
      {name}
    </Link>
  );
}

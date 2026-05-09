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
 *  - children prop 우선 (있으면 name 무시) — 시드뱃지+팀명 같은 복합 자식 지원 (4단계 박제)
 *
 * 사용 예:
 *   <TeamLink teamId={220} name="아울스" />
 *   // 게스트 팀 / 미등록 팀
 *   <TeamLink teamId={null} name="게스트팀" />
 *   // children 패턴 — 시드뱃지 + 팀명 등 복합 자식 (대진표 카드)
 *   <TeamLink teamId={220}>
 *     <SeedBadge seed={1} />
 *     <span>아울스</span>
 *   </TeamLink>
 *
 * children 안 nested anchor 회피 주의 — 자식에 또 다른 <Link>/<a> 금지.
 * ============================================================ */

import Link from "next/link";
import type { CSSProperties, MouseEventHandler, ReactNode } from "react";

type TeamLinkProps = {
  /** Team.id (BigInt → string 또는 number 허용). null/undefined = 미등록/게스트 팀 → 링크 비활성 */
  teamId?: string | number | bigint | null;
  /** 표시 이름 (children 미지정 시 사용) */
  name?: string;
  /** 자식 노드 (있으면 name 무시 — 시드뱃지+팀명 등 복합 노드) */
  children?: ReactNode;
  /** 추가 className */
  className?: string;
  /** 추가 inline style */
  style?: CSSProperties;
  /** 새 탭 열기 (기본 false) */
  newTab?: boolean;
  /** 클릭 핸들러 (예: 부모 카드 Link 와 nested 회피용 e.stopPropagation) */
  onClick?: MouseEventHandler<HTMLAnchorElement>;
};

export function TeamLink({ teamId, name, children, className, style, newTab, onClick }: TeamLinkProps) {
  // 표시할 콘텐츠 — children 우선, 없으면 name
  const content = children ?? name ?? "";

  // teamId 없거나 null → 미등록/게스트 팀 → 링크 비활성 (span)
  if (!teamId) {
    return (
      <span className={className} style={style}>
        {content}
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
      onClick={onClick}
    >
      {content}
    </Link>
  );
}

"use client";

/* ============================================================
 * PlayerLink — 선수명 → 공개프로필 (`/users/[id]`) 글로벌 링크 컴포넌트
 *   (5/10 박제 — 사용자 결정: 박스스코어/매치카드/매치결과 등에서 선수명 클릭 시 공개프로필 이동)
 *
 * 이유 (왜):
 *  - 박스스코어/PBP/MVP/매치 결과 등 공식 기록 컨텍스트에서 선수명을 클릭 시
 *    공개프로필로 이동하는 패턴이 다수 도입됨 → 글로벌 컴포넌트 단일 진입점이 필요.
 *  - 옵션 C (글로벌 컴포넌트 + 점진 마이그) — 1단계 = 박제만, 사용처 마이그는 후속 PR.
 *  - placeholder user (`ttp.userId IS NULL` / `player_name` 만 존재) 케이스 일관 처리:
 *    링크 비활성 + 텍스트만 표시 (잘못된 라우트 이동 차단).
 *
 * 어떻게:
 *  - userId 없거나 null → `<span>` (단순 텍스트, 클릭 비활성)
 *  - userId 존재 → `<Link href="/users/{id}">` + Tailwind hover 시 underline + opacity 80%
 *  - hover 시에만 underline (기본 underline 적용 시 표/리스트 안 시각 산만)
 *  - target="_blank" 옵션 제공 (newTab prop) — 일부 컨텍스트에서 새 탭 선호 시
 *
 * 사용 예:
 *   // 일반: User.id 가 BigInt
 *   <PlayerLink userId={3400} name="김용우" />
 *   // ttp placeholder 대응 (userId null)
 *   <PlayerLink userId={null} name="이하성" />
 *   // 새 탭
 *   <PlayerLink userId="3162" name="이하성" newTab />
 * ============================================================ */

import Link from "next/link";
import type { CSSProperties, MouseEventHandler, ReactNode } from "react";

type PlayerLinkProps = {
  /** User.id (BigInt → string 또는 number 허용). null/undefined = placeholder ttp → 링크 비활성 */
  userId?: string | number | bigint | null;
  /** 표시 이름 (실명 / 닉네임 / 등번호 / fallback — 호출 측에서 `getDisplayName()` 헬퍼 결과 전달 권장) */
  name?: string;
  /** 자식 노드 (있으면 name 무시 — 아바타+이름 등 복합 노드) */
  children?: ReactNode;
  /** 추가 className (사용처에서 폰트/사이즈 제어) */
  className?: string;
  /** 추가 inline style (color override 등 — hover 색상은 컴포넌트 내장 처리) */
  style?: CSSProperties;
  /** 새 탭 열기 (기본 false — 같은 탭 이동) */
  newTab?: boolean;
  /** 클릭 핸들러 (예: 부모 카드 Link 와 nested 회피용 e.stopPropagation) */
  onClick?: MouseEventHandler<HTMLAnchorElement>;
};

export function PlayerLink({ userId, name, children, className, style, newTab, onClick }: PlayerLinkProps) {
  // 표시할 콘텐츠 — children 우선, 없으면 name
  const content = children ?? name ?? "";

  // userId 없거나 null → placeholder user → 링크 비활성 (단순 span)
  // BigInt 0 (`0n`) 도 falsy 처리 (실제 운영 User.id 는 1+ 시작이므로 안전)
  if (!userId) {
    return (
      <span className={className} style={style}>
        {content}
      </span>
    );
  }

  // BigInt → string 변환 (URL path 안전 변환)
  const href = `/users/${userId.toString()}`;

  return (
    <Link
      href={href}
      // hover 시에만 underline + opacity-80 — 표/리스트 안 시각 산만 방지
      // transition-colors — hover 진입/이탈 시 부드러운 색상 전환
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

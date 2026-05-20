/* ============================================================
 * ApplyRibbon — BDR v2.16 경기 상세 hero 바로 아래 빠른 액션 띠
 *
 * 박제 source: Dev/design/v2.16-cli-bake-2026-05-20.md §3-1
 *   "hero 아래 빠른 액션 ribbon (정원 progress + 신청 CTA + 주최자 미니카드)"
 *
 * 구조:
 *   [progress 좌] | [host mini 중] | [apply CTA 우]
 *   ├ progress: label "모집 현황" + bar + count-pill (filled/total · 잔여)
 *   ├ host mini: 28px 아바타 + 닉네임 + "주최자" 라벨
 *   └ apply CTA: 상태별 분기
 *       · 비로그인 / 미신청 → "참가 신청" (cafe-blue) → #apply-panel anchor
 *       · 대기 중 (status=0) → "신청 확인 중" (회색 disabled)
 *       · 승인됨 (status=1) → "참가 확정" (green)
 *       · 거부됨 (status=2) → "다시 신청" (회색)
 *       · 호스트 → "내가 호스트" (회색 disabled)
 *       · 마감 (status=2~4 of game) → "모집 마감" (회색)
 *       · 종료 (status=3) → "경기 종료" (회색)
 *
 * 서버 컴포넌트 — Link 만 사용 (실 신청 액션은 ApplyPanel form).
 * Ribbon click → #apply-panel anchor 로 ApplyPanel 로 스크롤.
 * ============================================================ */

import Link from "next/link";
import { decodeHtmlEntities } from "@/lib/utils/decode-html";

const KIND_CLASS: Record<number, string> = {
  0: "kind-pickup",
  1: "kind-guest",
  2: "kind-scrimmage",
};

export interface RibbonOrganizer {
  id: string | bigint;
  nickname: string | null;
  name: string | null;
}

export interface ApplyRibbonProps {
  gameType: number;
  /** 게임 status — 0=대기/1=모집중/2=마감/3=종료/4=취소 */
  gameStatus: number;
  /** 정원 현황 */
  maxParticipants: number;
  currentParticipants: number;
  /** 호스트 정보 (organizer) */
  organizer: RibbonOrganizer | null;
  /** 로그인 여부 */
  isLoggedIn: boolean;
  /** 본인이 호스트인지 (organizer_id === user.id) */
  isHost: boolean;
  /**
   * [v2.16 Phase 3-1c fix] super_admin 여부.
   * 카페 크롤링 게임의 organizer 가 모두 admin master(id=1) 라서 admin 계정에서
   * 모든 게임이 isHost=true 가 됨 → "내가 호스트" 라벨이 부적절. admin 우선 분기.
   */
  isAdmin: boolean;
  /** 본인 신청 상태 — 0=대기/1=승인/2=거부, 또는 null=미신청 */
  myApplicationStatus: number | null;
  /** 신청 패널 anchor id (page.tsx 의 ApplyPanel div) */
  applyAnchorId: string;
}

function nicknameInitials(name: string | null): string {
  if (!name) return "?";
  const t = name.trim();
  if (!t) return "?";
  const parts = t.split(/[\s_\-.]+/).filter(Boolean);
  if (parts.length >= 2) {
    return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? ""))
      .toUpperCase()
      .slice(0, 2);
  }
  return t.slice(0, 1).toUpperCase();
}

/** CTA 분기 — (텍스트, 변형 클래스, 비활성 여부) 결정.
 *
 * [v2.16 Phase 3-1c fix] admin 우선 분기 — 카페 크롤링 게임의 organizer 가 모두
 * admin master(id=1) 라서 admin 계정에서 isHost=true 가 되는 운영 데이터 특성 대응.
 * admin 은 "내가 호스트" 라벨 대신 "관리자 view" 노출 (편집 권한은 별도 UI).
 */
function resolveCta(
  gameStatus: number,
  isLoggedIn: boolean,
  isHost: boolean,
  isAdmin: boolean,
  myApplicationStatus: number | null,
): { label: string; variant: string; disabled: boolean } {
  // 게임 종료/취소 → 우선 분기
  if (gameStatus === 3) {
    return { label: "경기 종료", variant: "is-closed", disabled: true };
  }
  if (gameStatus === 4) {
    return { label: "취소된 경기", variant: "is-closed", disabled: true };
  }
  // 게임 마감 (status=2)
  if (gameStatus === 2) {
    return { label: "모집 마감", variant: "is-closed", disabled: true };
  }
  // [v2.16 fix] admin 우선 — host 라벨 숨김 (admin master organizer 카페 크롤링 대응)
  if (isAdmin) {
    return { label: "관리자 view", variant: "is-admin", disabled: true };
  }
  // 호스트 본인 (admin 외)
  if (isHost) {
    return { label: "내가 호스트", variant: "is-host", disabled: true };
  }
  // 본인 신청 상태별
  if (myApplicationStatus === 1) {
    return { label: "참가 확정 ✓", variant: "is-approved", disabled: true };
  }
  if (myApplicationStatus === 0) {
    return { label: "신청 확인 중", variant: "is-pending", disabled: true };
  }
  if (myApplicationStatus === 2) {
    return { label: "다시 신청", variant: "is-primary", disabled: false };
  }
  // 비로그인 + 미신청
  if (!isLoggedIn) {
    return { label: "로그인 후 신청", variant: "is-primary", disabled: false };
  }
  // 로그인 + 미신청 (모집중)
  return { label: "참가 신청", variant: "is-primary", disabled: false };
}

export function ApplyRibbon({
  gameType,
  gameStatus,
  maxParticipants,
  currentParticipants,
  organizer,
  isLoggedIn,
  isHost,
  isAdmin,
  myApplicationStatus,
  applyAnchorId,
}: ApplyRibbonProps) {
  const kindClass = KIND_CLASS[gameType] ?? KIND_CLASS[0];
  const pct =
    maxParticipants > 0
      ? Math.min((currentParticipants / maxParticipants) * 100, 100)
      : 0;
  const remain = Math.max(maxParticipants - currentParticipants, 0);
  const cta = resolveCta(
    gameStatus,
    isLoggedIn,
    isHost,
    isAdmin,
    myApplicationStatus,
  );

  const hostName =
    decodeHtmlEntities(organizer?.nickname) ||
    decodeHtmlEntities(organizer?.name) ||
    "호스트";
  const hostInitial = nicknameInitials(hostName);

  return (
    <section className={`gd-ribbon ${kindClass}`}>
      <div className="gd-ribbon__inner">
        {/* 진행 게이지 */}
        <div className="gd-ribbon__progress">
          <div className="gd-ribbon__progress-head">
            <span className="gd-ribbon__progress-lbl">모집 현황</span>
            <span className="gd-ribbon__progress-count">
              <strong>{currentParticipants}</strong>
              <span className="gd-ribbon__progress-den">
                /{maxParticipants}
              </span>
              <span className="gd-ribbon__progress-remain">
                · 잔여 <strong>{remain}</strong>
              </span>
            </span>
          </div>
          <div className="gd-ribbon__progress-bar">
            <div
              className="gd-ribbon__progress-fill"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        {/* 호스트 미니카드 */}
        {organizer && (
          <div className="gd-ribbon__host">
            <div className="gd-ribbon__host-av" aria-hidden>
              {hostInitial}
            </div>
            <div className="gd-ribbon__host-meta">
              <div className="gd-ribbon__host-lbl">주최자</div>
              <div className="gd-ribbon__host-name">{hostName}</div>
            </div>
          </div>
        )}

        {/* CTA */}
        {cta.disabled ? (
          <span className={`gd-ribbon__cta ${cta.variant} is-disabled`}>
            {cta.label}
          </span>
        ) : (
          <Link
            href={`#${applyAnchorId}`}
            className={`gd-ribbon__cta ${cta.variant}`}
          >
            {cta.label}
          </Link>
        )}
      </div>
    </section>
  );
}

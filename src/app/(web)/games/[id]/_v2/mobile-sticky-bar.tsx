/* ============================================================
 * MobileStickyBar — BDR v2.16 경기 상세 모바일 하단 고정 신청 바
 *
 * 박제 source: 작업지시서 §3-1
 *   "모바일 = hero 그대로 + 본문 1-column + 하단 fixed sticky bar (정원 + 신청 버튼)"
 *
 * 구조 (모바일 ≤720px 만 표시):
 *   [정원 좌] | [신청 CTA 우]
 *
 * 동작:
 *   - position: fixed; bottom: 0; left: 0; right: 0
 *   - 데스크톱 (>720px) 에서는 display:none
 *   - 신청 버튼 = ApplyRibbon 과 동일 anchor (#apply-panel)
 *   - 호스트 / 마감 / 종료 시 버튼 변형
 *
 * 서버 컴포넌트 — Link 만 사용. JS 인터랙션 0.
 * ============================================================ */

import Link from "next/link";

const KIND_CLASS: Record<number, string> = {
  0: "kind-pickup",
  1: "kind-guest",
  2: "kind-scrimmage",
};

export interface MobileStickyBarProps {
  gameType: number;
  gameStatus: number;
  maxParticipants: number;
  currentParticipants: number;
  isLoggedIn: boolean;
  isHost: boolean;
  /**
   * [v2.16 Phase 3-1c fix] super_admin 여부 — admin 계정은 "내 경기" 대신 "관리자" 노출.
   * (카페 크롤링 게임의 organizer 가 모두 admin master 라서 모든 게임이 isHost=true 되는 운영 특성 대응)
   */
  isAdmin: boolean;
  myApplicationStatus: number | null;
  applyAnchorId: string;
}

function resolveCta(
  gameStatus: number,
  isLoggedIn: boolean,
  isHost: boolean,
  isAdmin: boolean,
  myApplicationStatus: number | null,
): { label: string; disabled: boolean; variant: string } {
  if (gameStatus === 3)
    return { label: "경기 종료", disabled: true, variant: "is-closed" };
  if (gameStatus === 4)
    return { label: "취소됨", disabled: true, variant: "is-closed" };
  if (gameStatus === 2)
    return { label: "모집 마감", disabled: true, variant: "is-closed" };
  // [v2.16 fix] admin 우선 — host 라벨 숨김
  if (isAdmin)
    return { label: "관리자", disabled: true, variant: "is-admin" };
  if (isHost)
    return { label: "내 경기", disabled: true, variant: "is-host" };
  if (myApplicationStatus === 1)
    return { label: "참가 확정 ✓", disabled: true, variant: "is-approved" };
  if (myApplicationStatus === 0)
    return { label: "확인 중", disabled: true, variant: "is-pending" };
  if (myApplicationStatus === 2)
    return { label: "다시 신청", disabled: false, variant: "is-primary" };
  if (!isLoggedIn)
    return { label: "로그인 후 신청", disabled: false, variant: "is-primary" };
  return { label: "참가 신청", disabled: false, variant: "is-primary" };
}

export function MobileStickyBar({
  gameType,
  gameStatus,
  maxParticipants,
  currentParticipants,
  isLoggedIn,
  isHost,
  isAdmin,
  myApplicationStatus,
  applyAnchorId,
}: MobileStickyBarProps) {
  const kindClass = KIND_CLASS[gameType] ?? KIND_CLASS[0];
  const remain = Math.max(maxParticipants - currentParticipants, 0);
  const cta = resolveCta(
    gameStatus,
    isLoggedIn,
    isHost,
    isAdmin,
    myApplicationStatus,
  );

  return (
    <div className={`gd-mobile-bar ${kindClass}`} role="region" aria-label="경기 신청">
      <div className="gd-mobile-bar__info">
        <div className="gd-mobile-bar__count">
          <span className="gd-mobile-bar__filled">{currentParticipants}</span>
          <span className="gd-mobile-bar__den">/{maxParticipants}</span>
        </div>
        <div className="gd-mobile-bar__remain">
          잔여 <strong>{remain}</strong>명
        </div>
      </div>
      {cta.disabled ? (
        <span className={`gd-mobile-bar__cta ${cta.variant} is-disabled`}>
          {cta.label}
        </span>
      ) : (
        <Link
          href={`#${applyAnchorId}`}
          className={`gd-mobile-bar__cta ${cta.variant}`}
        >
          {cta.label}
        </Link>
      )}
    </div>
  );
}

/* ============================================================
 * ParticipantsSlotBoard — BDR v2.16 경기 상세 Concept B 10인 슬롯 보드
 *
 * 박제 source: Dev/design/BDR-current/screens-gd/ConceptB.jsx (B.slotGrid / B.slotFilled / B.slotEmpty / FilledSlot / EmptySlot)
 * 사용자 결정 §11: Concept B (10인 슬롯 보드) 채택
 *   - 5×2 슬롯 그리드 (정원 N 가변 — 6/10 모두 동작)
 *   - filled = 풍부한 카드 (슬롯 번호 + 호스트 태그 + 아바타 + 닉/포지션/레벨)
 *   - empty = "이 자리에 들어오기" CTA (점선 border + accent +)
 *
 * 데이터 매핑 (운영 → 시안):
 *   - 슬롯 1 = 호스트 (organizer) — 항상 첫 자리
 *   - 슬롯 2~N = 승인된 신청자 (status=1)
 *   - 빈 슬롯 = max_participants - filled
 *   - rating/badge/handle = 운영 DB 미보유 → 폴백 (사용자 결정: 시안 박제 + 임시 폴백)
 *     · rating = 미노출 (DB 없음)
 *     · handle = nickname (영문 닉) 또는 이름 (한글)
 *     · badge = 미노출
 *     · color = 종별 컬러 그라데이션 — kind 클래스 토큰 활용
 *
 * 서버 컴포넌트 — 빈 슬롯 click = anchor (#apply-panel) 또는 신청 페이지.
 *   Phase 3-1c 에서 ApplyRibbon 으로 통합 시 anchor 동작 갱신.
 * ============================================================ */

import Link from "next/link";
import { decodeHtmlEntities } from "@/lib/utils/decode-html";
import { PlayerLink } from "@/components/links/player-link";

/** 슬롯 1인 — 호스트 또는 승인된 신청자 */
export interface SlotMember {
  /** User.id (string 직렬화) — PlayerLink 라우팅용 */
  user_id: string | null;
  nickname: string | null;
  name: string | null;
  position: string | null;
  skill_level: string | null;
  /** 호스트 여부 — true 이면 슬롯에 HOST 태그 노출 */
  isHost: boolean;
}

export interface ParticipantsSlotBoardProps {
  /** 슬롯 정원 (max_participants, 기본 10) */
  spotsTotal: number;
  /** 슬롯 멤버 배열 — 호스트 + 승인 신청자 순서. spotsTotal 보다 적으면 나머지는 EmptySlot */
  members: SlotMember[];
  /** 종별 코드 — kind-* 클래스로 슬롯 아바타 그라데이션 결정 */
  gameType: number;
  /** 신청 패널 anchor id — 빈 슬롯 클릭 시 이동. 없으면 신청 페이지로 */
  applyAnchorId?: string;
  /** 신청 페이지 href (anchor 미사용 시 폴백) */
  applyHref?: string;
}

// 종별 → kind 클래스 매핑 (GameCard 와 동일)
const KIND_CLASS: Record<number, string> = {
  0: "kind-pickup",
  1: "kind-guest",
  2: "kind-scrimmage",
};

// skill_level 코드 → 1자리 라벨
const SKILL_BADGE: Record<string, string> = {
  beginner: "초급",
  lowest: "초급",
  low: "초급",
  intermediate: "중급",
  high: "상급",
  advanced: "상급",
  all: "전체",
};

/* -- 닉네임/이름 → 이니셜 (GameCard 와 동일 규칙) -- */
function toInitials(name: string | null): string {
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

/* -- 슬롯 번호 padding (01, 02, ...) -- */
function slotNumLabel(n: number): string {
  return String(n).padStart(2, "0");
}

export function ParticipantsSlotBoard({
  spotsTotal,
  members,
  gameType,
  applyAnchorId,
  applyHref,
}: ParticipantsSlotBoardProps) {
  const kindClass = KIND_CLASS[gameType] ?? KIND_CLASS[0];
  const safeTotal = spotsTotal > 0 ? spotsTotal : 10;
  const filled = Math.min(members.length, safeTotal);

  // 슬롯 배열 — null = empty
  const slots: Array<SlotMember | null> = [];
  for (let i = 0; i < safeTotal; i++) {
    slots.push(members[i] ?? null);
  }

  // 빈 슬롯 클릭 시 이동 — anchor 우선, 폴백 신청 페이지
  const emptyHref = applyAnchorId
    ? `#${applyAnchorId}`
    : applyHref ?? undefined;

  return (
    <section className={`gd-slots ${kindClass}`}>
      <div className="gd-slots__head">
        <div>
          <div className="gd-slots__eyebrow">로스터 · {safeTotal}인</div>
          <h2 className="gd-slots__title">지금 모인 사람들</h2>
        </div>
        <div className="gd-slots__count">
          <span className="gd-slots__count-num">{filled}</span>
          <span className="gd-slots__count-den">/ {safeTotal}</span>
        </div>
      </div>

      <div className="gd-slots__grid">
        {slots.map((m, i) => (
          <div key={i}>
            {m ? (
              <FilledSlot member={m} slotNum={i + 1} />
            ) : (
              <EmptySlot slotNum={i + 1} href={emptyHref} />
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

function FilledSlot({
  member,
  slotNum,
}: {
  member: SlotMember;
  slotNum: number;
}) {
  const display =
    decodeHtmlEntities(member.nickname) ||
    decodeHtmlEntities(member.name) ||
    "익명";
  const initial = toInitials(display);
  const handle = decodeHtmlEntities(member.nickname) || null;
  const lv = member.skill_level?.trim();
  const lvLabel = lv ? SKILL_BADGE[lv] ?? null : null;
  const pos = member.position?.trim() || null;

  // PlayerLink 가 user_id 없으면 자동 span fallback (게스트 등)
  return (
    <div className="gd-slot gd-slot--filled">
      <div className="gd-slot__num">{slotNumLabel(slotNum)}</div>
      {member.isHost && <div className="gd-slot__host-tag">HOST</div>}
      <div className="gd-slot__avatar" aria-hidden>
        {initial}
      </div>
      <div className="gd-slot__name">
        <PlayerLink userId={member.user_id} name={display} />
      </div>
      {handle && handle !== display && (
        <div className="gd-slot__handle">@{handle}</div>
      )}
      <div className="gd-slot__meta">
        {pos && <span className="gd-slot__pos">{pos}</span>}
        {lvLabel && <span className="gd-slot__lvl">{lvLabel}</span>}
      </div>
    </div>
  );
}

function EmptySlot({
  slotNum,
  href,
}: {
  slotNum: number;
  href?: string;
}) {
  const content = (
    <>
      <div className="gd-slot__num gd-slot__num--empty">
        {slotNumLabel(slotNum)}
      </div>
      <div className="gd-slot__empty-icon" aria-hidden>
        +
      </div>
      <div className="gd-slot__empty-title">
        이 자리에<br />
        들어오기
      </div>
      <div className="gd-slot__empty-sub">탭하여 신청</div>
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="gd-slot gd-slot--empty"
        style={{ textDecoration: "none" }}
      >
        {content}
      </Link>
    );
  }
  return <div className="gd-slot gd-slot--empty gd-slot--empty-disabled">{content}</div>;
}

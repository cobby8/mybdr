/* ============================================================
 * ParticipantList — BDR v2 경기 참가자 목록 (승인된 신청자)
 *
 * 왜 이 컴포넌트가 있는가:
 * 기존 ParticipantsGrid 는 10~12열 아바타 격자로 닉네임만 보였지만,
 * v2 시안은 "리스트 행: 이니셜 아바타 + 닉네임 + level·position"
 * 구조를 요구.
 *
 * Phase C (2026-05-02) 갱신 — 사용자 결정 3 = C Hybrid:
 *   - 모바일 (≤720px): 1열 list (운영 안전망 유지)
 *   - 데스크톱 (>720px): grid 카드 (auto-fill minmax(200px, 1fr)) — 시안 정합
 *   - 인라인 grid 안티패턴 회귀 방지 → 별도 .css + @media 분기 (player-hero.css 패턴)
 *   - skill_level 메타 노출 (시안 "L.5 · 가드"). users.skill_level 이 있으면 "L.{n}",
 *     position 과 함께 점(·) 구분으로 1줄 노출
 *
 * 데이터 방침(PM 확정):
 *   - 이름/닉네임: 닉네임 > 이름 > "익명" 순으로 폴백
 *   - position  : users.position (없으면 메타에서 생략)
 *   - level     : users.skill_level (없으면 메타에서 생략)
 *
 * 서버 컴포넌트 — 상호작용 없음.
 * ============================================================ */

import { decodeHtmlEntities } from "@/lib/utils/decode-html";
// 4단계 A — 참가자명 → 공개프로필 (`/users/[id]`) 글로벌 PlayerLink
import { PlayerLink } from "@/components/links/player-link";
import "./participant-list.css";

export interface ParticipantListItem {
  id: string;
  /** 4단계 A: User.id (참가자 닉네임 클릭 → 공개프로필 이동용). null = placeholder/게스트 → span fallback */
  user_id?: string | null;
  nickname: string | null;
  name: string | null;
  position: string | null;
  /** Phase C: 시안 메타 (L.5 등) — users.skill_level 그대로. null/빈문자열은 미노출 */
  skill_level?: string | null;
}

export interface ParticipantListProps {
  participants: ParticipantListItem[];
  maxParticipants: number | null;
}

export function ParticipantList({
  participants,
  maxParticipants,
}: ParticipantListProps) {
  const cur = participants.length;
  const max = maxParticipants ?? 0;

  return (
    <section className="card" style={{ padding: 0, overflow: "hidden" }}>
      {/* 헤더 — "참가자 N/M명" 형식. 카운트는 mono 폰트로 강조 */}
      <div
        style={{
          padding: "14px 20px",
          borderBottom: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ fontWeight: 700, fontSize: 15, color: "var(--ink)" }}>
          참가자
        </div>
        <span
          style={{
            fontFamily: "var(--ff-mono)",
            fontWeight: 700,
            fontSize: 13,
            color: "var(--ink-soft)",
          }}
        >
          {cur}/{max || "?"}명
        </span>
      </div>

      {/* 본문 — 참가자 없으면 안내 문구, 있으면 그리드/리스트 */}
      {cur === 0 ? (
        <div
          style={{
            padding: "28px 20px",
            textAlign: "center",
            fontSize: 13,
            color: "var(--ink-dim)",
          }}
        >
          아직 참가자가 없습니다.
        </div>
      ) : (
        // .participant-list__body — PC: grid auto-fill / 모바일: 1열 (CSS @media 분기)
        <ul className="participant-list__body">
          {participants.map((p) => (
            <ParticipantRow key={p.id} participant={p} />
          ))}
        </ul>
      )}
    </section>
  );
}

// 1행 렌더 — 이니셜 아바타 + 닉네임/이름 + meta(level · position)
function ParticipantRow({ participant }: { participant: ParticipantListItem }) {
  const display =
    decodeHtmlEntities(participant.nickname) ||
    decodeHtmlEntities(participant.name) ||
    "익명";
  // 이니셜: 한글/영문 첫 글자. 공백일 경우 "?" fallback
  const initial = display.trim().charAt(0) || "?";

  // skill_level / position 조합. 시안: "L.5 · 가드". 둘 중 하나만 있어도 노출
  // skill_level 가 숫자 문자열 ("5") 이면 "L.5" 형태로 prefix, 아니면 그대로 (이미 "L.5" 형태일 수도)
  const lvRaw = participant.skill_level?.trim();
  const lvLabel = lvRaw
    ? /^\d+$/.test(lvRaw)
      ? `L.${lvRaw}`
      : lvRaw // 이미 "L.5" 등 prefix 가 있으면 그대로
    : null;
  const metaParts = [lvLabel, participant.position].filter(Boolean);

  return (
    <li className="participant-list__row">
      {/* 이니셜 아바타 — 32x32 원형 */}
      <div aria-hidden className="participant-list__avatar">
        {initial}
      </div>

      {/* 닉네임/이름 + meta (level · position) */}
      {/* 4단계 A: 참가자명 → 공개프로필 PlayerLink. user_id 없으면 자동 span fallback (게스트 등) */}
      <div className="participant-list__main">
        <div className="participant-list__name">
          <PlayerLink userId={participant.user_id} name={display} />
        </div>
        {metaParts.length > 0 && (
          <div className="participant-list__meta">{metaParts.join(" · ")}</div>
        )}
      </div>
    </li>
  );
}

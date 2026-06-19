/* ============================================================
 * GameCard — BDR v2.16 "경기" 카드 (픽업/게스트/연습경기)
 *
 * [2026-05-20 v2.16 리디자인]
 * 시안: Dev/design/BDR-current/_games_card_final.html
 * 마크업: <article class="gcard kind-{pickup|guest|scrimmage}">
 *   <gcard__main>
 *     <dt> Date Tile — 좌측 세로 (종별 라벨 + 날짜 + 시간 start~end)
 *     <gcard__content> Area chip + 무료/마감임박 chip + 타이틀 + meta
 *   <gcard__foot>
 *     <host> 이니셜 아바타 + 닉네임 + "주최자"
 *     <gcard__progress> 정원 progress + count-pill
 *     <btn-apply> 신청 버튼
 *
 * 종별 컬러 (시안 _games_card_final.html L224~226):
 *   pickup    = #1B3C87 (BDR Navy 더 깊은 톤)
 *   guest     = #8B0E15 (deep crimson)
 *   scrimmage = #0A5132 (forest green)
 * 토큰: globals.css [v2.16] .kind-pickup/.kind-guest/.kind-scrimmage
 *
 * 데이터 패칭 변경 0 — listGames select 에 duration_hours 만 추가됨 (Date Tile 종료시간 계산용)
 * ============================================================ */

import Link from "next/link";
import { decodeHtmlEntities } from "@/lib/utils/decode-html";

export interface GameCardProps {
  /** 상세 페이지 이동용 경로 */
  href: string;
  /** 경기 종류 코드 — 0=픽업, 1=게스트, 2=연습경기 */
  gameType: number;
  /** 상태 코드 — 3=완료/라이브 등 (마감/만석 판단용) */
  status: number;
  /** 타이틀 — DB 원문 그대로(HTML 엔티티 디코드는 내부에서 수행) */
  title: string | null;
  /** 장소 — venue_name 우선, 없으면 city */
  venueName: string | null;
  /** 노출용 지역 (Area chip — city 혹은 city+district) */
  areaLabel: string;
  /** 일시 ISO 문자열 — 없으면 "일정 미정" 표기 */
  scheduledAt: string | null;
  /** [v2.16] 경기 시간 (시간 단위) — Date Tile 종료 시간 = scheduledAt + durationHours */
  durationHours: number | null;
  /** 실력 수준 코드 — (v2.16에서는 meta 미사용, prop 보존) */
  skillLevel: string | null;
  /** 참가비 원문(decimal string) — 0/null 이면 "무료" 강조 */
  feePerPerson: string | null;
  /** 현재 참가자 수 — 진행바용 */
  currentParticipants: number | null;
  /** 최대 참가자 수 — 진행바/인원 표기용 */
  maxParticipants: number | null;
  /** 호스트 닉네임 */
  authorNickname: string | null;
  /** [2026-05-29 Phase 2C·BG4] 종료 경기 최종 MVP 닉네임 — 종료(status=3) + 값 있을 때만 "🏆 MVP" 라인 노출. 없으면 hide */
  finalMvpNickname?: string | null;
  /** 자동 파생 태그 — v2.16에서는 row1 칩으로 일부만 표시 (무료/마감임박만) */
  tags: string[];
}

/* -- 종별 클래스 매핑 --
 * DB game_type 코드(0/1/2) → 시안 kind 클래스명
 *   0 → kind-pickup     (픽업)
 *   1 → kind-guest      (게스트)
 *   2 → kind-scrimmage  (연습경기)
 */
const KIND_CLASS: Record<number, string> = {
  0: "kind-pickup",
  1: "kind-guest",
  2: "kind-scrimmage",
};
const KIND_LABEL: Record<number, string> = {
  0: "픽업",
  1: "게스트",
  2: "연습경기",
};

/* -- ISO → Date Tile 표시 포맷 --
 * 반환:
 *   md   = "4/25"
 *   day  = "(목)"
 *   start = "20:30"
 *   end   = "~22:30" (durationHours 없으면 null)
 *   isWeekend = 토/일 강조 (dt__date.is-weekend)
 */
const KO_WEEKDAY = ["일", "월", "화", "수", "목", "금", "토"] as const;
interface DateTileParts {
  md: string;
  day: string;
  start: string;
  end: string | null;
  isWeekend: boolean;
}
function parseDateTile(
  iso: string | null,
  durationHours: number | null,
): DateTileParts | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const m = d.getMonth() + 1;
  const day = d.getDate();
  const dow = d.getDay();
  const w = KO_WEEKDAY[dow];
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");

  let end: string | null = null;
  if (typeof durationHours === "number" && durationHours > 0) {
    const endD = new Date(d.getTime() + durationHours * 3_600_000);
    const eh = String(endD.getHours()).padStart(2, "0");
    const em = String(endD.getMinutes()).padStart(2, "0");
    end = `~${eh}:${em}`;
  }

  return {
    md: `${m}/${day}`,
    day: `(${w})`,
    start: `${hh}:${mi}`,
    end,
    isWeekend: dow === 0 || dow === 6,
  };
}

/* -- 마감임박 판단 (v1 유지) --
 * 시안 .gcard__chip--closing 적용 기준.
 */
function isClosingSoon(
  scheduledAt: string | null,
  cur: number,
  max: number,
): boolean {
  if (max > 0 && cur / max >= 0.8) return true;
  if (!scheduledAt) return false;
  const diff = new Date(scheduledAt).getTime() - Date.now();
  return diff > 0 && diff <= 24 * 60 * 60 * 1000;
}

/* -- 닉네임 → 이니셜 1-2자 (시안 host__av 폴백) --
 * 한글: 첫 글자 1자 / 영문: 단어 앞글자 최대 2자.
 * 예) "huk_master" → "HM" / "관악대장" → "관"
 */
function nicknameToInitials(name: string | null): string {
  if (!name) return "?";
  const trimmed = name.trim();
  if (!trimmed) return "?";
  // 영문/숫자 단어 분리 (언더스코어/공백/대시 기준)
  const parts = trimmed.split(/[\s_\-.]+/).filter(Boolean);
  if (parts.length >= 2) {
    const a = parts[0]?.[0] ?? "";
    const b = parts[1]?.[0] ?? "";
    return (a + b).toUpperCase().slice(0, 2);
  }
  // 한글 또는 단일 단어 — 앞 1자
  return trimmed.slice(0, 1).toUpperCase();
}

export function GameCard({
  href,
  gameType,
  status,
  title,
  venueName,
  areaLabel,
  scheduledAt,
  durationHours,
  feePerPerson,
  currentParticipants,
  maxParticipants,
  authorNickname,
  finalMvpNickname,
  tags,
}: GameCardProps) {
  const kindClass = KIND_CLASS[gameType] ?? KIND_CLASS[0];
  const kindLabel = KIND_LABEL[gameType] ?? KIND_LABEL[0];

  // 참가자 계산
  const cur = currentParticipants ?? 0;
  const max = maxParticipants ?? 0;
  const pct = max > 0 ? Math.min((cur / max) * 100, 100) : 0;

  // 상태 플래그
  const isFull = max > 0 && cur >= max;
  const isClosing = !isFull && isClosingSoon(scheduledAt, cur, max);
  const isDisabled = isFull || status === 3 || status === 4;

  // [M2 wave2] 정원 마감 시 대기열 가능 여부 분기.
  //   - 픽업(0)/게스트(1) 이면서 아직 모집중(status=1) 이면 정원이 차도 "대기 가능"
  //     (백엔드 apply 가 status=3 으로 자동 대기 등록). 연습경기(2)는 대기열 대상 아님.
  //   - status≥2(확정/완료/취소) 이면 신규 신청·대기 불가 → "마감".
  const allowsWaitlist = gameType === 0 || gameType === 1;
  const canWaitlist = isFull && status === 1 && allowsWaitlist;
  // 만석 마감 칩 노출 여부: 만석이고 대기열도 불가(status≥2 또는 연습경기) 일 때.
  const isClosedFull = isFull && !canWaitlist;

  // 참가비
  const feeNum = feePerPerson ? Number(feePerPerson) : 0;
  const isFree = !feePerPerson || feeNum === 0;
  const feeText = isFree ? "무료" : `₩${feeNum.toLocaleString()}`;

  // 장소 (Area chip 따로, gcard__place 는 venue 명)
  const placeName = decodeHtmlEntities(venueName ?? "") || areaLabel || "";

  // Date Tile parts
  const tile = parseDateTile(scheduledAt, durationHours);

  // 호스트 이니셜
  const hostInitials = nicknameToInitials(authorNickname);

  // [BG4] 종료 경기 MVP 라인 노출 판정.
  //   종료 = status 3 (listGames 가 날짜 지난 모집/확정도 3 으로 override) + 4(취소)도 포함.
  //   픽업 games 엔 우승팀 개념이 없어(의뢰서 §7 가정) MVP 닉네임만 표시.
  //   finalMvpNickname 없으면 라인 자체를 렌더하지 않음(mock 금지 — 사용자 결재 2026-05-29).
  const mvpName = finalMvpNickname?.trim();
  const showChampLine = (status === 3 || status === 4) && !!mvpName;

  // 자동 태그 — v2.16 row1은 "무료" / "마감임박" / "주말" / "초보환영" 4종만 표시
  // (시안에서 자주 보이는 칩은 무료/마감임박 — 나머지는 기존 tags에서 가져옴)
  const showFreeChip = isFree;
  const showWeekendChip = tags.includes("주말");
  const showBeginnerChip = tags.includes("초보환영");

  return (
    <Link
      href={href}
      className={`gcard ${kindClass}`}
      style={{
        textDecoration: "none",
        color: "inherit",
        // [M2 wave2] 대기 가능 카드는 흐리지 않음 — 만석이어도 대기 신청 유도.
        opacity: canWaitlist ? 1 : isDisabled ? 0.6 : 1,
      }}
    >
      <div className="gcard__main">
        {/* Date Tile — 좌측 세로 */}
        {tile ? (
          <div className="dt">
            <div className="dt__kind">{kindLabel}</div>
            <div className={`dt__date${tile.isWeekend ? " is-weekend" : ""}`}>
              <span className="dt__date-md">{tile.md}</span>
              <span className="dt__date-day">{tile.day}</span>
            </div>
            <div className="dt__time">
              <div className="dt__t">{tile.start}</div>
              {tile.end && <div className="dt__t-end">{tile.end}</div>}
            </div>
          </div>
        ) : (
          <div className="dt">
            <div className="dt__kind">{kindLabel}</div>
            <div className="dt__date">
              <span className="dt__date-md" style={{ fontSize: 14 }}>
                일정 미정
              </span>
            </div>
            <div className="dt__time" />
          </div>
        )}

        {/* Content — 우측 */}
        <div className="gcard__content">
          <div className="gcard__row1">
            {areaLabel && (
              <span className="gcard__area-chip">
                <span className="ico material-symbols-outlined" aria-hidden="true">
                  place
                </span>
                {areaLabel}
              </span>
            )}
            {/* [M2 wave2] 정원 마감 우선 칩 — 대기 가능 / 마감 (만석일 때만, 무료 칩보다 우선) */}
            {canWaitlist && (
              <span
                className="gcard__chip gcard__chip--closing"
                // 대기 가능 = warn 톤 강조 (closing 칩 토큰 재사용)
              >
                대기 가능
              </span>
            )}
            {isClosedFull && (
              <span
                className="gcard__chip"
                style={{ color: "var(--ink-mute)" }}
              >
                마감
              </span>
            )}
            {/* 우측 칩 영역 — 무료/마감임박/주말/초보환영 (만석이 아닐 때만) */}
            {showFreeChip && !isFull && (
              <span className="gcard__chip gcard__chip--free">무료</span>
            )}
            {isClosing && !showFreeChip && !isFull && (
              <span className="gcard__chip gcard__chip--closing">마감임박</span>
            )}
            {showWeekendChip && !showFreeChip && !isClosing && !isFull && (
              <span className="gcard__chip">주말</span>
            )}
            {showBeginnerChip &&
              !showFreeChip &&
              !isClosing &&
              !showWeekendChip &&
              !isFull && (
                <span className="gcard__chip">초보환영</span>
              )}
          </div>
          <h4 className="gcard__title">
            {decodeHtmlEntities(title) || "제목 없음"}
          </h4>
          <div className="gcard__meta">
            {placeName && (
              <span className="item">
                <span className="ico material-symbols-outlined" aria-hidden="true">
                  sports_basketball
                </span>
                <span className="gcard__place">{placeName}</span>
              </span>
            )}
            <span className="item">
              <span className="ico material-symbols-outlined" aria-hidden="true">
                payments
              </span>
              <span className={`gcard__fee${isFree ? " is-free" : ""}`}>
                {feeText}
              </span>
            </span>
          </div>
        </div>
      </div>

      {/* [BG4] 종료 카드 우승/MVP 라인 — gcard__main 과 footer 사이 (시안 ga-card__champ 위치).
       * 픽업 games 우승팀 개념 없음(의뢰서 §7) → "🏆 MVP [닉네임]" 1줄로 단순화.
       * MVP 없으면 showChampLine=false → 라인 미렌더 (mock 금지).
       * 색상 = var(--accent) 톤 (의뢰서 §3-UA1-2 지정) / 인라인 토큰만 (하드코딩 hex 금지). */}
      {showChampLine && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "6px 14px",
            fontSize: 12.5,
            fontWeight: 700,
            // accent 톤 강조 배경 (라이트/다크 모두 대응 — color-mix 로 8% 틴트)
            background: "color-mix(in srgb, var(--accent) 8%, var(--bg-elev))",
            borderTop: "1px solid var(--border)",
            color: "var(--accent)",
          }}
        >
          {/* 🏆 = 유니코드 이모지 (색상 토큰 룰 무관 — 시안 ga-card__champ-trophy 동일) */}
          <span aria-hidden="true">🏆</span>
          <span>
            MVP <strong>{mvpName}</strong>
          </span>
        </div>
      )}

      {/* Footer — 호스트 + progress + 신청 버튼 */}
      <div className="gcard__foot">
        <div className="host">
          <span className="host__av" aria-hidden="true">
            {hostInitials}
          </span>
          <span className="host__name">
            {authorNickname ?? "호스트"}
            <small>주최자</small>
          </span>
        </div>
        <div className="gcard__progress">
          <div className="gcard__progress-row">
            <span
              className={`gcard__progress-label${isClosing ? " is-warn" : ""}`}
            >
              {isClosing ? "마감임박" : "정원"}
            </span>
            <span className={`count-pill${isClosing ? " is-closing" : ""}`}>
              {cur}/{max || "?"}
            </span>
          </div>
          {max > 0 && (
            <div className="gcard__progress-bar">
              <div
                className="gcard__progress-fill"
                style={{ width: `${pct}%` }}
              />
            </div>
          )}
        </div>
        {/* [M2 wave2] 만석이어도 대기 가능(픽업/게스트 + 모집중)이면 "대기" 라벨 + 활성 톤.
         *  status≥2(완료/취소)·연습경기 만석은 "마감"(흐림). */}
        <span
          className="btn-apply"
          style={{
            pointerEvents: "none",
            // 대기 가능은 정상 톤 유지, 그 외 마감/완료/취소는 흐림
            opacity: canWaitlist ? 1 : isDisabled ? 0.55 : 1,
          }}
        >
          {canWaitlist ? "대기" : isDisabled ? "마감" : "신청"}
        </span>
      </div>
    </Link>
  );
}

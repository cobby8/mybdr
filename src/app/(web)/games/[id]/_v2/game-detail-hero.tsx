/* ============================================================
 * GameDetailHero — BDR v2.16 경기 상세 풀폭 다크 hero band
 *
 * 박제 source: Dev/design/BDR-current/screens-gd/ConceptB.jsx (B.hero / B.heroLeft / B.heroMeta / B.heroProgWrap)
 * 사용자 결정 §11: V2 (Hero-led) 채택 + Concept B 슬롯 보드 (다음 PR)
 *
 * 구조:
 *   [다크 hero band — 네이비 그라데이션]
 *     ├ breadcrumb: 경기 모집 › 종별
 *     ├ badges: 종별 badge + 모집상태 badge + countdown (D-N)
 *     ├ title: 32px 900 (Pretendard)
 *     ├ meta: 4-col grid (코트/일시/회비/레벨)
 *     └ progress: 큰 진행 게이지 + 최소인원 ✓ 마커
 *
 * 데이터 매핑 (운영 DB → 시안 ConceptB):
 *   - g.kind = game_type (0=픽업, 1=게스트, 2=연습경기)
 *   - g.status = "모집 중" (status 0/1=대기/모집중) / "마감" (2) / "종료" (3) / "취소" (4)
 *   - g.countdown = scheduled_at 까지 D-N 또는 D-day / 종료 후 비활성
 *   - g.spotsMin = min_participants (DB default 4)
 *   - g.spotsTotal = max_participants (DB default 10)
 *
 * 서버 컴포넌트 — Date 계산은 서버 시각 기준 (KST 변환 없음 — toISOString → 클라 변환 안 함).
 *   countdown 은 SSR 시각 기준. 사용자 진입 시점 ≈ 서버 시각이므로 D-N 표시 충분 OK.
 *
 * 회귀 0: 기존 page.tsx 의 SummaryCard 위에 추가하는 형식. 기존 컴포넌트 시그니처 변경 0.
 * ============================================================ */

import { decodeHtmlEntities } from "@/lib/utils/decode-html";

// 종별 라벨 (GameCard 와 동일 키)
const KIND_LABEL: Record<number, string> = {
  0: "픽업",
  1: "게스트",
  2: "연습경기",
};

// status 코드 → 한글 라벨
//   0: 대기 / 1: 모집중 / 2: 마감 / 3: 종료 / 4: 취소
const STATUS_LABEL: Record<number, string> = {
  0: "모집 전",
  1: "모집 중",
  2: "모집 마감",
  3: "경기 종료",
  4: "취소",
};

export interface GameDetailHeroProps {
  /** 경기 종류 코드 — 0=픽업, 1=게스트, 2=연습경기 */
  gameType: number;
  /** 모집 상태 코드 */
  status: number;
  /** 타이틀 — DB 원문 (내부에서 엔티티 디코드) */
  title: string | null;
  /** 코트명 (venue_name) — 없으면 city 폴백 */
  venueName: string | null;
  /** 지역 라벨 (city + district) */
  areaLabel: string;
  /** 일시 (Date object — 서버 SSR 시점 기준) */
  scheduledAt: Date | null;
  /** 경기 시간 (시간 단위) — Hero 일시 끝시각 계산용 */
  durationHours: number | null;
  /** 참가비 (number) — 0/null 이면 "무료" */
  feePerPerson: number | null;
  /** 실력 수준 코드 — "전체 환영" 등 표시 */
  skillLevel: string | null;
  /** 게스트 허용 여부 */
  allowGuests: boolean;
  /** 정원 현황 */
  maxParticipants: number;
  minParticipants: number;
  currentParticipants: number;
}

/* -- skill_level 코드 → 시안 라벨 매핑 -- */
const SKILL_HERO_LABEL: Record<string, string> = {
  all: "전체 환영",
  beginner: "초급 환영",
  lowest: "초급 환영",
  low: "초급 환영",
  intermediate: "중급",
  high: "상급",
  advanced: "상급",
};

/* -- countdown 계산 (서버 SSR 시점 기준) --
 * 예) D-2 / D-day / 종료
 */
function calcCountdown(scheduledAt: Date | null, status: number): string | null {
  if (!scheduledAt) return null;
  if (status === 3 || status === 4) return null; // 종료/취소 → countdown 미노출
  const now = Date.now();
  const target = scheduledAt.getTime();
  const diffMs = target - now;
  if (diffMs <= 0) return "진행 중";
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "D-day";
  return `D-${diffDays}`;
}

/* -- 일시 포맷 (시안 "2026.04.26 (일)" + "09:00 – 11:00") -- */
const KO_WEEKDAY = ["일", "월", "화", "수", "목", "금", "토"] as const;
function formatHeroDate(d: Date | null): string {
  if (!d) return "일정 미정";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const w = KO_WEEKDAY[d.getDay()];
  return `${y}.${m}.${day} (${w})`;
}
function formatHeroTime(d: Date | null, durationHours: number | null): string {
  if (!d) return "";
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  if (!durationHours || durationHours <= 0) return `${hh}:${mi}`;
  const endD = new Date(d.getTime() + durationHours * 3_600_000);
  const eh = String(endD.getHours()).padStart(2, "0");
  const em = String(endD.getMinutes()).padStart(2, "0");
  return `${hh}:${mi} – ${eh}:${em}`;
}

export function GameDetailHero({
  gameType,
  status,
  title,
  venueName,
  areaLabel,
  scheduledAt,
  durationHours,
  feePerPerson,
  skillLevel,
  allowGuests,
  maxParticipants,
  minParticipants,
  currentParticipants,
}: GameDetailHeroProps) {
  const kindLabel = KIND_LABEL[gameType] ?? KIND_LABEL[0];
  const statusLabel = STATUS_LABEL[status] ?? "모집 중";
  const countdown = calcCountdown(scheduledAt, status);
  const isOpen = status === 0 || status === 1;
  const isClosed = status === 2 || status === 3 || status === 4;

  const dateText = formatHeroDate(scheduledAt);
  const timeText = formatHeroTime(scheduledAt, durationHours);

  const feeText =
    feePerPerson === null || feePerPerson === 0
      ? "무료"
      : `₩${feePerPerson.toLocaleString()}`;
  const isFree = feePerPerson === null || feePerPerson === 0;

  const skillText =
    (skillLevel && SKILL_HERO_LABEL[skillLevel]) || "전체 환영";
  const guestText = allowGuests ? "게스트 참여 가능" : "게스트 불가";

  // 진행도
  const pct =
    maxParticipants > 0
      ? Math.min((currentParticipants / maxParticipants) * 100, 100)
      : 0;
  const minPct =
    maxParticipants > 0 ? (minParticipants / maxParticipants) * 100 : 0;
  const reachedMin = currentParticipants >= minParticipants;
  const remain = Math.max(maxParticipants - currentParticipants, 0);

  return (
    <section className="gd-hero">
      <div className="gd-hero__inner">
        <div className="gd-hero__breadcrumb">
          <span>경기 모집</span>
          <span className="gd-hero__breadcrumb-sep">›</span>
          <span className="gd-hero__breadcrumb-kind">{kindLabel}</span>
        </div>

        <div className="gd-hero__badges">
          <span className="gd-hero__badge gd-hero__badge--kind">{kindLabel}</span>
          <span
            className={`gd-hero__badge gd-hero__badge--status${
              isOpen ? " is-open" : isClosed ? " is-closed" : ""
            }`}
          >
            {isOpen && <span className="gd-hero__badge-dot" aria-hidden>●</span>}
            {statusLabel}
          </span>
          {countdown && (
            <span className="gd-hero__countdown">{countdown}</span>
          )}
        </div>

        <h1 className="gd-hero__title">
          {decodeHtmlEntities(title) || "제목 없음"}
        </h1>

        <div className="gd-hero__meta">
          <div className="gd-hero__meta-item">
            <span
              className="gd-hero__meta-icon material-symbols-outlined"
              aria-hidden
            >
              place
            </span>
            <div>
              <div className="gd-hero__meta-val">
                {decodeHtmlEntities(venueName) || areaLabel || "장소 미정"}
              </div>
              <div className="gd-hero__meta-sub">{areaLabel || ""}</div>
            </div>
          </div>
          <div className="gd-hero__meta-item">
            <span
              className="gd-hero__meta-icon material-symbols-outlined"
              aria-hidden
            >
              event
            </span>
            <div>
              <div className="gd-hero__meta-val">{dateText}</div>
              <div className="gd-hero__meta-sub">{timeText}</div>
            </div>
          </div>
          <div className="gd-hero__meta-item">
            <span
              className="gd-hero__meta-icon material-symbols-outlined"
              aria-hidden
            >
              payments
            </span>
            <div>
              <div
                className={`gd-hero__meta-val${isFree ? " is-free" : ""}`}
              >
                {feeText}
              </div>
              <div className="gd-hero__meta-sub">참가비</div>
            </div>
          </div>
          <div className="gd-hero__meta-item">
            <span
              className="gd-hero__meta-icon material-symbols-outlined"
              aria-hidden
            >
              groups
            </span>
            <div>
              <div className="gd-hero__meta-val">{skillText}</div>
              <div className="gd-hero__meta-sub">{guestText}</div>
            </div>
          </div>
        </div>

        {maxParticipants > 0 && (
          <div className="gd-hero__progress">
            <div className="gd-hero__progress-row">
              <div>
                <div className="gd-hero__progress-lbl">모집 현황</div>
                <div className="gd-hero__progress-val">
                  <span className="gd-hero__progress-num">
                    {currentParticipants}
                  </span>
                  <span className="gd-hero__progress-den">
                    / {maxParticipants} 명
                  </span>
                </div>
              </div>
              <div className="gd-hero__progress-right">
                <div className="gd-hero__progress-lbl">잔여</div>
                <div className="gd-hero__progress-num gd-hero__progress-num--accent">
                  {remain}
                </div>
              </div>
            </div>
            <div className="gd-hero__progress-bar">
              <div
                className="gd-hero__progress-fill"
                style={{ width: `${pct}%` }}
              />
              {minParticipants > 0 && minParticipants < maxParticipants && (
                <div
                  className="gd-hero__progress-min"
                  style={{ left: `${minPct}%` }}
                >
                  <div className="gd-hero__progress-min-tick" />
                  <div className="gd-hero__progress-min-lbl">
                    최소 {minParticipants}명 {reachedMin ? "✓" : ""}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

/* ============================================================
 * GameCard — BDR v2 "경기" 카드 (픽업/게스트/연습경기)
 *
 * 왜 이 컴포넌트가 있는가:
 * v2 Games.jsx 시안의 카드 1장 구조를 충실히 재현.
 *   [상단 kind stripe 4px]
 *   [padding 18px / 종류 배지 + 마감임박 배지 + 우측 지역]
 *   [타이틀 15px bold]
 *   [4행 info grid: 장소/일시/레벨/비용]
 *   [자동 파생 태그(최대 3개)]
 *   [푸터: 호스트 + 진행바 + 신청 버튼]
 *
 * 서버 컴포넌트 — Link만 사용. 서버/클라 양쪽에서 렌더 가능.
 *
 * DQ3 방침 — 태그는 props.tags로 받지 않고 DB 필드에서 자동 파생:
 *   - fee=0/null → "무료"
 *   - skill_level ∈ {beginner, lowest, low} → "초보환영"
 *   - scheduled_at 이 토/일 → "주말"
 * 파생은 상위(games-client)에서 수행해 props로 주입한다. (SSR 안전:
 * 서버가 계산해 직렬화된 문자열 배열로 내려준다.)
 *
 * [2026-04-22 시안 100% 매칭 재작업]
 *   - TYPE_BADGE 의 --color-badge-* 토큰 대신 v2 원본 토큰(--cafe-blue / --bdr-red / --ok) 직접 참조
 *   - 라벨 한글화: "픽업" / "게스트" / "연습경기" (프로젝트 용어 통일, help/glossary 기준)
 *   - 날짜 포맷: "YYYY.MM.DD (요일) · HH:mm" (시안 원본은 종료시각 포함 "– HH:mm" 이지만
 *     현 listGames select 에 duration_hours/ended_at 이 없어 단일 시각으로 표시 — Prisma select 비변경 방침)
 *   - 비용 포맷: 무료는 "무료" + ok 색상 + bold / 유료는 "₩5,000" (toLocaleString)
 * ============================================================ */

import Link from "next/link";
import { decodeHtmlEntities } from "@/lib/utils/decode-html";
import { SKILL_LABEL } from "@/lib/constants/game-status";

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
  /** 노출용 지역(우상단 monospace) — city 혹은 city+district */
  areaLabel: string;
  /** 일시 ISO 문자열 — 없으면 "일정 미정" 표기 */
  scheduledAt: string | null;
  /** 실력 수준 코드 — SKILL_LABEL 한글로 변환해 표시 */
  skillLevel: string | null;
  /** 참가비 원문(decimal string) — 0/null 이면 "무료" 강조 */
  feePerPerson: string | null;
  /** 현재 참가자 수 — 진행바용 */
  currentParticipants: number | null;
  /** 최대 참가자 수 — 진행바/인원 표기용 */
  maxParticipants: number | null;
  /** 호스트 닉네임 */
  authorNickname: string | null;
  /** 자동 파생 태그(최대 3개) — 상위에서 계산해 주입 */
  tags: string[];
}

/* -- v2 시안 kind 색상/라벨 매핑 --
 * 왜: v2 Games.jsx L5~L6 원본 그대로 이식하되, 라벨은 프로젝트 도메인 용어
 *   (help/glossary 단일 소스)에 맞춰 "연습경기"로 표시.
 *   conventions.md [2026-04-20] 도메인 용어 정의 참조.
 * DB game_type 코드(0/1/2)를 시안 kind 키로 매핑한 뒤 같은 테이블을 참조한다.
 *   0 → pickup    (픽업)
 *   1 → guest     (게스트 모집)
 *   2 → practice  (DB상 PRACTICE = 연습경기)
 */
const KIND_COLOR: Record<number, string> = {
  0: "var(--cafe-blue)",
  1: "var(--bdr-red)",
  2: "var(--ok)",
};
const KIND_LABEL: Record<number, string> = {
  0: "픽업",
  1: "게스트",
  2: "연습경기",
};

/* -- ISO → "YYYY.MM.DD (요일) · HH:mm" 포맷 --
 * 왜: 시안은 "2026.04.25 (목) · 20:30 – 22:30" 형식이지만, 현재 listGames select 에
 * duration_hours / ended_at 이 포함돼 있지 않아 종료 시각 계산을 생략한다.
 * (Prisma select 변경 금지 방침 — 기획 "⚠️ 주의: Prisma 0 변경")
 * 종료 시각 데이터가 인입되면 "– HH:mm" 을 이어 붙이는 확장 지점이다.
 */
const KO_WEEKDAY = ["일", "월", "화", "수", "목", "금", "토"] as const;
function formatScheduleFull(iso: string | null): string {
  if (!iso) return "일정 미정";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "일정 미정";
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const dow = KO_WEEKDAY[d.getDay()];
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  // 예) 2026.04.25 (목) · 20:30
  return `${yyyy}.${mm}.${dd} (${dow}) · ${hh}:${mi}`;
}

/* -- 마감임박 판단 --
 * 왜: 시안의 badge--red "마감임박" 은 정량 기준이 없으므로,
 * 현실 데이터에 맞춰 (1) scheduled_at 이 24h 이내 OR (2) 진행률 80%+ 인 경우로 한다. */
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

export function GameCard({
  href,
  gameType,
  status,
  title,
  venueName,
  areaLabel,
  scheduledAt,
  skillLevel,
  feePerPerson,
  currentParticipants,
  maxParticipants,
  authorNickname,
  tags,
}: GameCardProps) {
  // 시안 원본 KIND_COLOR/LABEL 매핑 사용 — 기본값은 픽업(파랑)
  const kindColor = KIND_COLOR[gameType] ?? KIND_COLOR[0];
  const kindLabel = KIND_LABEL[gameType] ?? KIND_LABEL[0];

  // 참가자 계산 — null 안전
  const cur = currentParticipants ?? 0;
  const max = maxParticipants ?? 0;
  const pct = max > 0 ? Math.min((cur / max) * 100, 100) : 0;

  // 상태 플래그
  const isFull = max > 0 && cur >= max;
  const isClosing = !isFull && isClosingSoon(scheduledAt, cur, max);
  // status 3(종료/취소) 혹은 만석이면 신청 비활성화 UI
  const isDisabled = isFull || status === 3 || status === 4;

  // 참가비: "무료" 강조 (시안: 무료면 green bold + ok 색상)
  // 유료는 "₩5,000" 형식 (시안 기준 toLocaleString + ₩ 기호)
  const feeNum = feePerPerson ? Number(feePerPerson) : 0;
  const isFree = !feePerPerson || feeNum === 0;
  const feeText = isFree ? "무료" : `₩${feeNum.toLocaleString()}`;

  // 실력 한글 라벨 (없으면 "전체")
  const skillText =
    skillLevel && SKILL_LABEL[skillLevel] ? SKILL_LABEL[skillLevel] : "전체";

  // 장소 — venue 우선, HTML 엔티티 디코드
  const place = decodeHtmlEntities(venueName ?? areaLabel ?? "");

  // 2026-05-03: 컴팩트 카드 — tournaments 카드 패턴 적용 (1열 4행)
  // 기존: 4행 info grid (장소/일시/레벨/비용) + 푸터 분리 → 카드 높이 큼
  // 신규: 메타 1행 (날짜 · 장소 · 비용) + 칩(태그)/CTA 한 줄 통합

  // 짧은 날짜 포맷 — "M/D(요일)" 또는 "M/D HH:mm" (오늘 이내면 시간만)
  const dateShort = (() => {
    if (!scheduledAt) return null;
    const d = new Date(scheduledAt);
    if (isNaN(d.getTime())) return null;
    const m = d.getMonth() + 1;
    const day = d.getDate();
    const w = KO_WEEKDAY[d.getDay()];
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    return `${m}/${day}(${w}) ${hh}:${mm}`;
  })();

  return (
    <Link
      href={href}
      className="card game-card"
      style={{
        padding: 0,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        textDecoration: "none",
        color: "inherit",
        opacity: isDisabled ? 0.6 : 1,
        minWidth: 0,
      }}
    >
      {/* kind stripe */}
      <div style={{ height: 4, background: kindColor }} />

      <div
        style={{
          padding: 14,
          display: "flex",
          flexDirection: "column",
          gap: 8,
          minWidth: 0,
        }}
      >
        {/* 1행: 종류 칩 + 마감/만석 + 자동 태그 + 우측 지역 */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            flexWrap: "wrap",
          }}
        >
          <span
            className="badge"
            style={{
              background: kindColor,
              color: "#fff",
              borderColor: kindColor,
            }}
          >
            {kindLabel}
          </span>
          {isClosing && <span className="badge badge--red">마감임박</span>}
          {isFull && <span className="badge">만석</span>}
          {tags.slice(0, 2).map((t) => (
            <span
              key={t}
              style={{
                fontSize: 10,
                padding: "2px 6px",
                color: "var(--ink-mute)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-chip, 6px)",
              }}
            >
              {t}
            </span>
          ))}
          <span
            style={{
              marginLeft: "auto",
              fontSize: 11,
              fontFamily: "var(--ff-mono)",
              color: "var(--ink-dim)",
            }}
          >
            {areaLabel || "-"}
          </span>
        </div>

        {/* 2행: 타이틀 1줄 ellipsis */}
        <div
          style={{
            fontWeight: 700,
            fontSize: 15,
            letterSpacing: "-0.005em",
            color: "var(--ink)",
            lineHeight: 1.3,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {decodeHtmlEntities(title) || "제목 없음"}
        </div>

        {/* 3행: 메타 (날짜 · 장소 · 비용 · 레벨) */}
        <div
          style={{
            fontSize: 12,
            color: "var(--ink-mute)",
            display: "flex",
            gap: 6,
            alignItems: "center",
            flexWrap: "wrap",
            minHeight: 16,
          }}
        >
          {dateShort && <span>{dateShort}</span>}
          {dateShort && place && <span style={{ opacity: 0.4 }}>·</span>}
          {place && (
            <span
              style={{
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                maxWidth: 120,
              }}
            >
              {place}
            </span>
          )}
          {(dateShort || place) && <span style={{ opacity: 0.4 }}>·</span>}
          <span
            style={{
              fontWeight: isFree ? 700 : 600,
              color: isFree ? "var(--ok)" : "var(--ink-soft)",
            }}
          >
            {feeText}
          </span>
          {skillText && skillText !== "-" && (
            <>
              <span style={{ opacity: 0.4 }}>·</span>
              <span>{skillText}</span>
            </>
          )}
        </div>

        {/* 4행: 진행바 + 카운트 + CTA (한 줄 통합) */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginTop: "auto",
            paddingTop: 4,
          }}
        >
          {max > 0 ? (
            <>
              <div
                style={{
                  flex: 1,
                  height: 4,
                  background: "var(--bg-alt)",
                  borderRadius: 2,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${pct}%`,
                    height: "100%",
                    background: isClosing ? "var(--accent)" : kindColor,
                  }}
                />
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: isClosing ? "var(--accent)" : "var(--ink-mute)",
                  fontFamily: "var(--ff-mono)",
                  fontWeight: 700,
                  whiteSpace: "nowrap",
                }}
              >
                {cur}/{max}
              </div>
            </>
          ) : (
            <div style={{ flex: 1 }} />
          )}
          {isDisabled ? (
            <span
              className="btn btn--sm"
              style={{
                pointerEvents: "none",
                opacity: 0.7,
                fontSize: 12,
                padding: "4px 12px",
              }}
            >
              마감
            </span>
          ) : (
            <span
              className="btn btn--sm btn--primary"
              style={{
                pointerEvents: "none",
                fontSize: 12,
                padding: "4px 12px",
              }}
            >
              신청
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

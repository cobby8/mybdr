/* ============================================================
 * ActivityLog — /users/[id] v2 활동 로그 (Phase 2 — 5/9)
 *
 * 왜 (사용자 결정):
 *  - Q1=A: 5종 통합 (match + mvp + team_joined/left/transferred + jersey_changed + signup)
 *  - Q4=A: 페이지 한정 컴포넌트 (`_v2/` 산하) — 글로벌 재사용 시점 별도 결정
 *  - Q5=A: match/mvp 클릭 → /live/[id] / team_* 클릭 → /teams/[id] / signup 0
 *
 * 어떻게:
 *  - props.events: page.tsx 가 5종 source 합산 후 최신 5건만 전달
 *  - 각 항목 = 아이콘 + title + date (오른쪽)
 *  - Material Symbols Outlined (lucide-react 금지 — CLAUDE.md §디자인 핵심)
 *  - 빈 상태: "아직 활동 기록이 없어요"
 * ============================================================ */

import Link from "next/link";

// ActivityEvent 타입 — page.tsx 변환 로직에서 import 사용
export type ActivityEvent =
  | {
      type: "match";
      date: string; // ISO
      matchId: string;
      matchCode: string | null;
      title: string; // "MONKEYS vs REDEEM"
      subtitle: string; // "21:17"
      result: "W" | "L" | null;
    }
  | { type: "mvp"; date: string; matchId: string; tournamentName: string }
  | { type: "team_joined"; date: string; teamId: string; teamName: string }
  | { type: "team_left"; date: string; teamId: string; teamName: string }
  | {
      type: "team_transferred";
      direction: "in" | "out";
      date: string;
      teamId: string;
      teamName: string;
    }
  | {
      type: "jersey_changed";
      date: string;
      teamId: string;
      teamName: string;
      oldJersey: number | null;
      newJersey: number | null;
    }
  | { type: "signup"; date: string };

// type → Material Symbol 매핑 (CLAUDE.md §디자인 핵심 — Material Symbols Outlined 사용)
function getIcon(e: ActivityEvent): string {
  switch (e.type) {
    case "match":
      return "sports_basketball";
    case "mvp":
      return "emoji_events";
    case "team_joined":
      return "group_add";
    case "team_left":
      return "logout";
    case "team_transferred":
      return "swap_horiz";
    case "jersey_changed":
      return "tag"; // # 기호 비슷한 아이콘
    case "signup":
      return "person_add";
  }
}

// type → 표시 텍스트 (Q5 카피)
function getTitle(e: ActivityEvent): string {
  switch (e.type) {
    case "match":
      // "MONKEYS vs REDEEM 21:17 W"
      return `${e.title}${e.subtitle ? ` ${e.subtitle}` : ""}${e.result ? ` ${e.result}` : ""}`;
    case "mvp":
      return `${e.tournamentName} MVP 수상`;
    case "team_joined":
      return `${e.teamName} 가입`;
    case "team_left":
      return `${e.teamName} 탈퇴`;
    case "team_transferred":
      return e.direction === "in" ? `${e.teamName} 이적 (가입)` : `${e.teamName} 이적 (탈퇴)`;
    case "jersey_changed":
      // 형식 알 수 없으면 fallback
      if (e.oldJersey != null && e.newJersey != null) {
        return `${e.teamName} 등번호 #${e.oldJersey} → #${e.newJersey}`;
      }
      if (e.newJersey != null) {
        return `${e.teamName} 등번호 #${e.newJersey} 변경`;
      }
      return `${e.teamName} 등번호 변경`;
    case "signup":
      return "MyBDR 가입";
  }
}

// 날짜 포맷: 7일 이내 = "3일 전" / 그 외 = "5/2 (토)"
function fmtRelative(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "-";
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays < 0) {
    // 미래 날짜 — "예정"
    return `${d.getMonth() + 1}/${d.getDate()}`;
  }
  if (diffDays === 0) return "오늘";
  if (diffDays === 1) return "어제";
  if (diffDays < 7) return `${diffDays}일 전`;
  // 7일 이상 — 월/일 + 요일
  const dow = ["일", "월", "화", "수", "목", "금", "토"][d.getDay()];
  return `${d.getMonth() + 1}/${d.getDate()} (${dow})`;
}

// type → 클릭 라우트 (Q5=A) — match/mvp = /live/[id] / team_* = /teams/[id] / 그 외 미링크
function getHref(e: ActivityEvent): string | null {
  if (e.type === "match" || e.type === "mvp") return `/live/${e.matchId}`;
  if (e.type === "team_joined" || e.type === "team_left" || e.type === "team_transferred") {
    return `/teams/${e.teamId}`;
  }
  if (e.type === "jersey_changed") return `/teams/${e.teamId}`;
  return null;
}

export function ActivityLog({ events }: { events: ActivityEvent[] }) {
  if (events.length === 0) {
    return (
      <div
        style={{
          fontSize: 13,
          color: "var(--ink-dim)",
          padding: "12px 4px",
          fontStyle: "italic",
        }}
      >
        아직 활동 기록이 없어요
      </div>
    );
  }

  return (
    <ul
      style={{
        listStyle: "none",
        margin: 0,
        padding: 0,
        display: "flex",
        flexDirection: "column",
        gap: 2,
      }}
    >
      {events.map((e, i) => {
        const href = getHref(e);
        const inner = (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "8px 4px",
              fontSize: 13,
              color: "var(--ink-soft)",
              borderRadius: 4,
              transition: "background 120ms ease",
            }}
            className={href ? "activity-log__item--clickable" : undefined}
          >
            {/* Material Symbols Outlined — span ligature 방식 (globals.css 폰트 로드 가정) */}
            <span
              className="material-symbols-outlined"
              aria-hidden="true"
              style={{
                fontSize: 18,
                color: "var(--ink-dim)",
                flexShrink: 0,
                width: 18,
                lineHeight: 1,
              }}
            >
              {getIcon(e)}
            </span>
            <span
              style={{
                flex: 1,
                minWidth: 0,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                color: "var(--ink)",
                fontWeight: 500,
              }}
            >
              {getTitle(e)}
            </span>
            <span
              style={{
                fontSize: 11,
                color: "var(--ink-dim)",
                fontFamily: "var(--ff-mono)",
                flexShrink: 0,
              }}
            >
              {fmtRelative(e.date)}
            </span>
          </div>
        );
        return (
          <li key={i} style={{ margin: 0 }}>
            {href ? (
              <Link href={href} style={{ textDecoration: "none", color: "inherit" }}>
                {inner}
              </Link>
            ) : (
              inner
            )}
          </li>
        );
      })}
    </ul>
  );
}

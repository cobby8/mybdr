/* ============================================================
 * MySummaryHeroCard — 로그인 유저 요약 카드 (시안 3열 · PR-HOME-1)
 *
 * 왜 이 파일이 필요한가:
 *   기존 my-summary-hero.tsx(4카드 가로 스크롤·client·useSWR)와 별개로,
 *   시안 Home.jsx L277~370 의 "단일 3열 카드" 레이아웃을 서버 컴포넌트로 박제한다.
 *   데이터는 page.tsx 에서 서버 Prisma READ(prefetchMySummary)로 받아 props 로 주입 —
 *   자체 패칭(useSWR) 없이 즉시 렌더(초기 로딩 0).
 *
 * 레이아웃(시안 정본):
 *   좌 — 팀 컬러 스트립 + 아바타(팀 대표색 배경 + 팀 이니셜) + 이름/역할
 *   중 — 다음 일정(D-N) + 알림 뱃지(미응답 신청 N·알림 N) — 0건이면 해당 뱃지 생략
 *   우 — 빠른 액션(내 경기 / 프로필)
 *
 * 13룰: var(--*) 토큰만 / Material Symbols / pill 회피 / 모바일 720px 분기.
 *   팀 대표색(primary_color)은 사용자 데이터값이므로 hex 예외 허용.
 *   유색(팀색) 배경 위 이니셜 텍스트 = var(--ink-on-brand).
 * ============================================================ */

import Link from "next/link";
import type { MySummaryData } from "@/lib/services/home";

/* -- 유틸: ISO → "MM.DD (요일) HH:mm" (다음 일정 표시용) -- */
function formatGameWhen(iso: string): string {
  const d = new Date(iso);
  const week = ["일", "월", "화", "수", "목", "금", "토"][d.getDay()];
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${mm}.${dd} (${week}) ${hh}:${mi}`;
}

/* -- 유틸: 팀 역할 코드 → 한글 라벨 -- */
function roleLabel(role: string): string {
  if (role === "leader" || role === "captain") return "캡틴";
  return "멤버";
}

export function MySummaryHeroCard({ data }: { data: MySummaryData }) {
  const { display_name, team, next_game, pending_applications, unread_notifications } =
    data;

  // 아바타 배경색: 팀 대표색(데이터값 hex) 우선, 없으면 토큰 accent
  const avatarBg = team?.primary_color ?? "var(--accent)";
  // 아바타 이니셜: 팀명 첫 글자(팀 없으면 유저명 첫 글자)
  const initial = (team?.name ?? display_name).charAt(0).toUpperCase();

  return (
    <div
      className="my-summary-hero card"
      style={{
        marginBottom: 20,
        padding: 0,
        overflow: "hidden",
        display: "grid",
        gridTemplateColumns: "auto minmax(0, 1fr) auto",
        gap: 0,
        alignItems: "stretch",
      }}
    >
      {/* ── 좌 — 팀 컬러 아바타 + 이름/역할 ── */}
      <div
        className="my-summary-hero__col"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          padding: "18px 20px",
          borderRight: "1px solid var(--border)",
          background: "linear-gradient(135deg, var(--bg-alt), var(--bg-elev))",
        }}
      >
        {/* 아바타 — 52px 정사각형(radius 6, pill 아님) · 팀색 배경 위 흰 이니셜 */}
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: 6,
            background: avatarBg,
            display: "grid",
            placeItems: "center",
            flexShrink: 0,
            fontFamily: "var(--ff-display)",
            fontWeight: 900,
            fontSize: 20,
            // 유색(팀색) 배경 위 텍스트 → DS v4 ink-on-brand
            color: "var(--ink-on-brand)",
          }}
        >
          {initial}
        </div>
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              fontWeight: 700,
              fontSize: 15,
              marginBottom: 2,
              color: "var(--ink)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {display_name}
          </div>
          <div
            style={{
              fontSize: 12,
              color: "var(--ink-mute)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {team ? `${team.name} · ${roleLabel(team.role)}` : "소속 팀 없음"}
          </div>
        </div>
      </div>

      {/* ── 중 — 다음 일정 + 알림 뱃지 ── */}
      <div
        className="my-summary-hero__col"
        style={{
          padding: "16px 20px",
          display: "flex",
          flexDirection: "column",
          gap: 10,
          minWidth: 0,
          justifyContent: "center",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: 8,
            flexWrap: "wrap",
          }}
        >
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: ".08em",
              textTransform: "uppercase",
              color: "var(--ink-dim)",
            }}
          >
            다음 경기
          </span>
          {next_game && (
            <span
              style={{
                fontFamily: "var(--ff-mono)",
                fontSize: 13,
                color: "var(--cafe-blue-deep)",
                fontWeight: 700,
              }}
            >
              {next_game.d_day === 0 ? "D-DAY" : `D-${next_game.d_day}`}
            </span>
          )}
        </div>

        {/* 다음 일정 본문 (없으면 안내 문구) */}
        {next_game ? (
          <Link
            href={next_game.uuid ? `/games/${next_game.uuid}` : "/games"}
            style={{
              fontWeight: 700,
              fontSize: 15,
              color: "var(--ink)",
              textDecoration: "none",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {formatGameWhen(next_game.scheduled_at)}
            {next_game.location ? ` · ${next_game.location}` : ""}
          </Link>
        ) : (
          <div style={{ fontSize: 13, color: "var(--ink-mute)" }}>
            예정된 경기가 없어요 —{" "}
            <Link
              href="/games"
              style={{ color: "var(--accent)", textDecoration: "none", fontWeight: 600 }}
            >
              경기 찾기 →
            </Link>
          </div>
        )}

        {/* 알림 뱃지 — 각 카운트 0건이면 생략 */}
        {(pending_applications > 0 || unread_notifications > 0) && (
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {pending_applications > 0 && (
              <Link
                href="/guest-apps"
                className="badge badge--soft"
                style={{
                  textDecoration: "none",
                  padding: "4px 10px",
                }}
              >
                미응답 신청 {pending_applications}건 →
              </Link>
            )}
            {unread_notifications > 0 && (
              <Link
                href="/notifications"
                className="badge badge--red"
                style={{
                  textDecoration: "none",
                  padding: "4px 10px",
                }}
              >
                알림 {unread_notifications}건 →
              </Link>
            )}
          </div>
        )}
      </div>

      {/* ── 우 — 빠른 액션 ── */}
      <div
        className="my-summary-hero__col my-summary-hero__actions"
        style={{
          padding: "16px 20px",
          display: "flex",
          flexDirection: "column",
          gap: 6,
          borderLeft: "1px solid var(--border)",
          justifyContent: "center",
          background: "var(--bg-alt)",
        }}
      >
        <Link href="/games" className="btn btn--sm btn--primary">
          내 경기
        </Link>
        <Link href="/profile" className="btn btn--sm">
          프로필
        </Link>
      </div>

      {/* 모바일 720px 분기 — 3열 → 1열 세로 스택 (시안 정본 반응형) */}
      <style>{`
        @media (max-width: 720px) {
          .my-summary-hero {
            grid-template-columns: 1fr !important;
          }
          .my-summary-hero__col {
            border-right: 0 !important;
            border-left: 0 !important;
            border-bottom: 1px solid var(--border);
          }
          .my-summary-hero__actions {
            border-bottom: 0 !important;
            flex-direction: row !important;
          }
        }
      `}</style>
    </div>
  );
}

/* ============================================================
 * HeroSlideTournament — 대회 슬라이드 (server component)
 *
 * 2026-05-02 사용자 요청 변경:
 *  - "지금 신청하기" 버튼 — `is_registration_open === true` 일 때만 노출 (마감된 대회 X)
 *  - 진행 중 매치 정보 (팀명 + 스코어) 표시 — `live_match` 있을 때
 *  - 라이브 매치 시 LIVE 아이콘 + 클릭 시 `/live/[id]` 진입
 *
 * 라우팅 규칙:
 *  - 신청 페이지: /tournaments/{id}/join (실제 라우트, 옛 /apply 는 404)
 *  - 대회 보기:   /tournaments/{id}
 *  - 라이브 매치: /live/{matchId}
 * ============================================================ */

import Link from "next/link";
import type { HeroSlideTournament as HeroSlideTournamentType } from "./types";
import { HeroSlideShell } from "./hero-slide-shell";

interface Props {
  data: HeroSlideTournamentType["data"];
}

// 일자 포맷 헬퍼: "4월 29일" 형태. ISO 파싱 실패 시 빈 문자열.
function formatKoreanDate(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("ko-KR", { month: "long", day: "numeric" }).format(d);
}

export function HeroSlideTournament({ data }: Props) {
  // 진행 상태에 따라 라벨 분기 — 시안 카피 톤
  const badge =
    data.status === "in_progress"
      ? "NOW OPEN · 진행중"
      : "REGISTRATION · 접수중";

  // 메타: "경기 · 4월 29일 · 접수 3/8팀" — 누락 정보는 자연스럽게 생략
  const dateStr = formatKoreanDate(data.start_date);
  const teamsStr =
    data.max_teams != null
      ? `접수 ${data.teams_count}/${data.max_teams}팀`
      : `접수 ${data.teams_count}팀`;

  // 메타를 dot(·)으로 join — 빈 항목은 거른다
  const metaParts = ["경기", dateStr, teamsStr].filter(Boolean);
  const metaText = metaParts.join(" · ");

  // 2026-05-02 v4: 매치 카드 한 줄 pill (SYBC 47 vs 28 셋업) + 대회 보기와 inline
  //   - 매치 카드 + 대회 보기 + (선택)지금 신청하기 = 한 줄 row 배치
  //   - 매치 카드 화살표 제거 + 높이 = 버튼과 동일
  //   - LIVE 배지는 우측 상단 그대로 (corner)
  const matchHref = data.live_match ? `/live/${data.live_match.id}` : null;

  // meta = 메타 텍스트 한 줄 + 인라인 액션 row (매치 + 버튼들)
  const meta = (
    <>
      <div className="hero-carousel__meta-line">{metaText}</div>
      <div className="hero-carousel__action-row">
        {/* 매치 카드 — 한 줄 pill: SYBC 47 vs 28 셋업 (라이브/종료 모두 노출) */}
        {data.live_match && matchHref && (
          <Link
            href={matchHref}
            className="hero-carousel__match-pill"
            aria-label={`${data.live_match.home_team_name} ${data.live_match.home_score} 대 ${data.live_match.away_score} ${data.live_match.away_team_name} 라이브 보기`}
          >
            <span className="hero-carousel__match-team" title={data.live_match.home_team_name}>
              {data.live_match.home_team_name}
            </span>
            <strong className="hero-carousel__match-score">
              {data.live_match.home_score}
            </strong>
            <span className="hero-carousel__match-vs">vs</span>
            <strong className="hero-carousel__match-score">
              {data.live_match.away_score}
            </strong>
            <span className="hero-carousel__match-team" title={data.live_match.away_team_name}>
              {data.live_match.away_team_name}
            </span>
          </Link>
        )}
        {/* 지금 신청하기 — 접수 중일 때만 */}
        {data.is_registration_open && (
          <Link
            href={`/tournaments/${data.id}/join`}
            className="btn btn--accent"
          >
            지금 신청하기
          </Link>
        )}
        {/* 대회 보기 — 항상 노출 */}
        <Link
          href={`/tournaments/${data.id}`}
          className="btn"
          style={{
            background: "rgba(255,255,255,.12)",
            color: "#fff",
            borderColor: "rgba(255,255,255,.3)",
          }}
        >
          대회 보기
        </Link>
      </div>
    </>
  );

  // 2026-05-02: 라이브 배지 — 우측 상단 topRightSlot (Link 자체)
  const topRightSlot = data.live_match?.is_live ? (
    <Link
      href={`/live/${data.live_match.id}`}
      className="hero-carousel__live-badge--corner"
      aria-label="라이브 페이지로 이동"
    >
      <span className="hero-carousel__live-dot live-air-dot" />
      <span className="hero-carousel__live-label">LIVE</span>
    </Link>
  ) : null;

  return (
    <HeroSlideShell
      accentVar="var(--cafe-blue)"
      accentDeepVar="var(--cafe-blue-deep)"
      badge={badge}
      title={data.name}
      meta={meta}
      // CTA 영역 미사용 — meta 안에 인라인 배치 (사용자 요청)
      topRightSlot={topRightSlot}
    />
  );
}

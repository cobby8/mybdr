/* ============================================================
 * HeroSlideTournament — 대회 슬라이드 (server component)
 *
 * 왜 이 컴포넌트가 있는가:
 * hero 카로셀 첫 슬롯에 "지금 신청 가능한/진행 중인 대회"를 강조 노출하기 위함.
 * 시안 톤(파란색 = 신뢰감)에 맞춰 cafe-blue 그라디언트.
 *
 * 라우팅 규칙:
 *  - 신청 페이지: /tournaments/{id} (현 시점 mybdr는 [id] 라우트에서 신청 처리)
 *  - 전체 보기:  /tournaments
 *
 * 데이터 가공:
 *  - start_date(ISO) → "M월 D일" 짧은 한국어 표기
 *  - status === "in_progress" 면 "NOW OPEN · 진행중", 그 외 "REGISTRATION · 접수중"
 * ============================================================ */

import type { HeroSlideTournament as HeroSlideTournamentType } from "./types";
import { HeroSlideShell } from "./hero-slide-shell";

interface Props {
  data: HeroSlideTournamentType["data"];
}

// 일자 포맷 헬퍼: "4월 29일" 형태. ISO 파싱 실패 시 빈 문자열.
// Intl.DateTimeFormat 한 번 생성 비용이 미미하므로 모듈 상수화하지 않고 호출 시점에 생성.
function formatKoreanDate(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  // 'numeric' 으로 두면 월/일이 1자리수도 그대로 (예: 4월 9일)
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
  const meta = metaParts.join(" · ");

  return (
    <HeroSlideShell
      // 파란색 그라디언트 = 대회 (cafe-blue 토큰은 globals.css :root 정의)
      accentVar="var(--cafe-blue)"
      accentDeepVar="var(--cafe-blue-deep)"
      badge={badge}
      title={data.name}
      meta={meta}
      primaryCta={{
        label: "지금 신청하기",
        // tournament.id 가 UUID 그대로이므로 별도 uuid 변환 불필요
        href: `/tournaments/${data.id}/apply`,
      }}
      secondaryCta={{
        label: "대회 전체 보기",
        href: "/tournaments",
      }}
    />
  );
}

/* ============================================================
 * HeroSlideGame — 24시간 내 모집 게임 슬라이드 (server component)
 *
 * 왜 이 컴포넌트가 있는가:
 * "지금 곧 시작하는 픽업 게임"을 hero에 띄워 즉시 참여 동선을 만들기 위함.
 * 시안 톤(초록색 = 진행/모집)에 맞춰 ok 그린 그라디언트.
 *
 * 라우팅 규칙:
 *  - 게임 상세: /games/{uuid} (참가 신청은 상세 페이지에서 처리)
 *  - 전체 보기: /games
 *
 * 데이터 가공:
 *  - scheduled_at → "HH:mm" 24시간 표기
 *  - location 누락 시 "장소 미정"
 *  - max_count 누락 시 "현재 N명" 형태
 * ============================================================ */

import type { HeroSlideGame as HeroSlideGameType } from "./types";
import { HeroSlideShell } from "./hero-slide-shell";

interface Props {
  data: HeroSlideGameType["data"];
}

// "HH:mm" 24시간 포맷 (한국어 로케일 ko-KR + hour12: false)
function formatTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(d);
}

export function HeroSlideGame({ data }: Props) {
  // 시간/장소/인원 메타 — 빈 칸은 자연스럽게 생략하지만
  // 장소는 "장소 미정"으로 명시 (사용자가 장소 정보를 기대하는 데이터이므로)
  const timeStr = formatTime(data.scheduled_at);
  const locationStr = data.location ?? "장소 미정";
  const countStr =
    data.max_count != null
      ? `${data.current_count}/${data.max_count}명`
      : `${data.current_count}명 참여중`;

  const metaParts = [timeStr, locationStr, countStr].filter(Boolean);
  const meta = metaParts.join(" · ");

  return (
    <HeroSlideShell
      // 초록색 = 픽업 게임 모집 (ok 토큰 = #1CA05E)
      // accent 시작/끝 색상을 같은 계열로 — accentDeepVar 미지정 시 셸이 어둡게 자동 계산
      accentVar="var(--ok)"
      badge="TODAY · 곧 시작"
      title={data.title}
      meta={meta}
      primaryCta={{
        label: "참가 신청",
        // 게임 상세 페이지로 이동 (해당 페이지에서 신청/취소 동작)
        href: `/games/${data.uuid}`,
      }}
      secondaryCta={{
        label: "전체 게임 보기",
        href: "/games",
      }}
    />
  );
}

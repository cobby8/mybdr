/* ============================================================
 * HeroSlideMvp — 최근 MVP 슬라이드 (server component)
 *
 * 왜 이 컴포넌트가 있는가:
 * "최근 경기 명장면 — MVP로 뽑힌 사람"을 hero에 노출해 커뮤니티
 * 동기부여(나도 다음 MVP가 될 수 있다) + 신뢰감(실제 활동하는 플랫폼)을 줌.
 * 시안 톤(노랑/금색 = 트로피·MVP)에 맞춰 warn 그라디언트.
 *
 * 라우팅 규칙:
 *  - 경기 보기: /games/{game_uuid}
 *  - MVP 모아보기: 전용 라우트 미존재 → /games?filter=mvp 쿼리만 (목록 페이지에서 무시되어도 무방)
 *
 * 데이터 가공:
 *  - reported_at → "M월 D일"
 *  - mvp_nickname 이 null 일 수 있어 "익명 MVP" 폴백
 * ============================================================ */

import type { HeroSlideMvp as HeroSlideMvpType } from "./types";
import { HeroSlideShell } from "./hero-slide-shell";

interface Props {
  data: HeroSlideMvpType["data"];
}

// 한국어 날짜 포맷 — tournament 슬라이드와 동일 로직 (각자 보유: 슬라이드 단위 자급자족)
function formatKoreanDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("ko-KR", { month: "long", day: "numeric" }).format(d);
}

export function HeroSlideMvp({ data }: Props) {
  // 닉네임 + 경기 제목을 타이틀로 결합 → "닉네임 (경기 제목)"
  // 닉네임 누락 시 "익명 MVP" 폴백 (DB에서 user.nickname이 null일 가능성 차단)
  const nickname = data.mvp_nickname ?? "익명 MVP";
  const title = `${nickname} (${data.game_title})`;

  // 평점은 정수가 아닐 수 있어 toFixed(1) — 5.0/4.5 같은 표기
  const ratingStr = `평점 ${data.overall_rating.toFixed(1)}/5`;
  const dateStr = formatKoreanDate(data.reported_at);

  const metaParts = [ratingStr, dateStr].filter(Boolean);
  const meta = metaParts.join(" · ");

  return (
    <HeroSlideShell
      // 노란색/금색 = MVP 트로피 톤 (warn 토큰 = #E8A33B)
      accentVar="var(--warn)"
      // ★ 유니코드 별 + 라벨 — 시안 카피에 맞춤
      badge="★ MVP · 최근 명장면"
      title={title}
      meta={meta}
      primaryCta={{
        label: "경기 보기",
        href: `/games/${data.game_uuid}`,
      }}
      secondaryCta={{
        label: "MVP 모아보기",
        // 전용 라우트 미존재 → /games 로 이동, 쿼리는 추후 필터 구현 시 활용
        href: "/games?filter=mvp",
      }}
    />
  );
}

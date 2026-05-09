/**
 * 2026-05-09 PR3 — 라이브 페이지 매치 카드 가로 스크롤 패널 (네이버 농구 라이브 패턴).
 *
 * 도메인 컨텍스트 (Dev/live-match-cards-2026-05-09.md §3-1):
 *   같은 날 / 같은 대회 매치 N건 (현재 매치 포함) 가로 스크롤 row.
 *   네이버 KBL 라이브 = "오늘의 경기" 카드 row 와 같은 패턴.
 *
 * 사용자 결정 (Q1~Q9):
 *   - Q3=A 시간순 정렬 (서버에서 scheduledAt ASC 보장 / 본 컴포넌트는 그대로 map)
 *   - Q4=A 가변 N건 (빈 슬롯 placeholder 0)
 *   - Q5=A 영상 sticky 아래 + hero 위 (page.tsx 가 mount 위치 결정)
 *   - Q7=A 1컬럼 유지 (모바일/PC 동일 가로 스크롤)
 *
 * 모바일 가드 (5/9 conventions.md 4 분기점):
 *   ≤360px / ≤720px / ≤900px / ≥1024px — 카드 폭은 LiveMatchCard 가 고정 (160px) 이며
 *   본 Rail 은 가로 overflow + scroll-snap 만 책임.
 *
 * 13 디자인 룰 준수:
 *   - var(--color-*) 토큰만 / inline style + 일반 Tailwind class
 *   - Tailwind arbitrary `[var(--*)]` 0 (errors.md 2026-05-09 룰)
 *   - lucide-react ❌ (아이콘 미사용)
 *
 * 빈 list 가드 (사용자 결정 Q4=A):
 *   - matches.length === 0 → null 반환 (영역 자체 hidden)
 *   - matches.length === 1 (현재 매치 1건만) → null 반환 (다른 매치 0 = 패널 의미 0)
 *
 * 회귀 차단:
 *   - DB schema 변경 0 / 신규 import 0 (LiveMatchCard 만)
 *   - 라이브 페이지 기존 영역 (영상/hero/박스/PBP/minutes) 영향 0
 */

"use client";

import { LiveMatchCard, type LiveMatchCardData } from "./live-match-card";

interface LiveMatchCardRailProps {
  matches: LiveMatchCardData[];
}

export function LiveMatchCardRail({ matches }: LiveMatchCardRailProps) {
  // 빈 list 또는 현재 매치 1건만 = Rail 패널 자체 hidden (영역 0)
  // 사용자 결정 Q4=A 가변 N건 — 1건 만 있으면 "다른 매치 0" 의미로 미노출.
  if (!matches || matches.length <= 1) {
    return null;
  }

  // 라이브 매치 N건 카운트 — 헤더 라벨 보조 정보
  const liveCount = matches.filter((m) => m.is_live).length;

  return (
    <section
      data-print-hide
      // 영상 wrapper 와 동일 px-4 padding (page.tsx 영상 wrapper 와 시각 정렬).
      // bg = background (sticky 영상 영역과 시각 묶음 — 영상 끝나는 영역 톤 유지).
      className="px-4 pb-3"
      style={{ backgroundColor: "var(--color-background)" }}
      aria-label="같은 날 매치 카드 패널"
    >
      <div className="mx-auto w-full sm:w-3/4">
        {/* 헤더 — "오늘의 경기 N건" + 라이브 N건 보조 표시 */}
        <div className="flex items-center justify-between mb-2">
          <h3
            className="text-sm font-semibold"
            style={{ color: "var(--color-text-primary)" }}
          >
            오늘의 경기 <span className="font-normal">{matches.length}건</span>
          </h3>
          {liveCount > 0 && (
            <span
              className="text-xs flex items-center gap-1"
              style={{ color: "var(--color-accent)" }}
            >
              <span className="relative flex w-2 h-2">
                {/* 정사각형 (W=H) 원형 = borderRadius 50% (BDR-current 13룰 §C-10) */}
                <span
                  className="absolute inset-0 animate-ping opacity-75"
                  style={{
                    backgroundColor: "var(--color-accent)",
                    borderRadius: "50%",
                  }}
                />
                <span
                  className="relative w-2 h-2"
                  style={{
                    backgroundColor: "var(--color-accent)",
                    borderRadius: "50%",
                  }}
                />
              </span>
              LIVE {liveCount}
            </span>
          )}
        </div>

        {/* 가로 스크롤 컨테이너 — overflow-x-auto + snap-x mandatory.
            iOS 자연 스크롤 + 스크롤바 미노출 (모바일 가독성) — inline style 로 처리.
            -mx + px 패턴 = 좌우 여백 유지하면서 첫/마지막 카드 가장자리 닿게 (시안 inset 패턴). */}
        <div
          className="flex gap-3 overflow-x-auto pb-1"
          style={{
            scrollSnapType: "x mandatory",
            // 모바일 스크롤바 숨김 (iOS Safari) — Firefox/Webkit 기본 미사용
            scrollbarWidth: "none",
          }}
        >
          {matches.map((m) => (
            <LiveMatchCard key={m.id} match={m} />
          ))}
        </div>
      </div>
    </section>
  );
}

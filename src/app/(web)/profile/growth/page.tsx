"use client";

/**
 * 내 성장 페이지 (/profile/growth)
 *
 * BDR v2.2 P1-1 박제 — 시안 출처: Dev/design/BDR v2.2/screens/ProfileGrowth.jsx
 *
 * Why: 사용자 성장 트래킹 (경기 수 / 평점 추이 / 마일스톤)
 * Pattern: Profile.jsx 게이미피케이션 톤 + Achievements 와 일관
 *
 * 진입: /profile "내 성장" 카드 / /profile/settings 프로필 탭 링크 / 더보기 "내 활동"
 * 복귀: AppNav 뒤로 / 햄버거 → /profile
 *
 * 회귀 검수 매트릭스:
 *   기능              | 옛 페이지 | 시안 v2.2          | 진입점     | 모바일
 *   레벨·XP           | Profile ✅ | ✅ hero            | 본인 카드 | 1열
 *   경기수 추이       | -        | ✅ 12주 spark      | -        | 가로 hscroll
 *   평점 추이         | -        | ✅ 12주 line       | -        | OK
 *   마일스톤          | Achievements ✅ | ✅ 6 cards    | -        | 1→2열
 *   다음 목표         | -        | ✅ progress + CTA  | -        | 1열
 *   "준비 중" 라벨    | -        | ✅ DB 미구현 표시   | -        | OK
 *
 * 보존 (변경 0):
 *  - SWR /api/web/profile/gamification fetch 100% 동일
 *  - GamificationData 타입 변경 없음
 *  - 로딩/비로그인 분기 동일
 *  - DB에서 받는 xp/level/streak 등은 hero에 직접 매핑
 *
 * Phase 12-4 추가 (2026-04-30):
 *  - SWR /api/web/profile/season-stats 추가 호출
 *  - 4 마일스톤(누적 경기 / 평균 평점 / 시즌 MVP / 시즌 순위) 데이터 연결
 *  - avg_rating === null 시점은 isDummy:true 유지 ("데이터 수집 중" 배지)
 *  - rank_position === null 은 "집계 중" 표시
 *
 * DB 미구현 (더미 + "준비 중" 배지):
 *  - 12주 주간 경기수 spark / 평점 line — UserSeasonStat 은 시즌 누적만, 주간 집계 별도 큐
 *  - 마일스톤 중 커뮤니티 활동 (집계 미구현)
 */

import useSWR from "swr";
import Link from "next/link";
// Phase 12 §G: 모바일 백버튼 (사용자 보고)
import { PageBackButton } from "@/components/shared/page-back-button";

// 게이미피케이션 API 응답 타입 (변경 없음)
interface GamificationData {
  xp: number;
  level: number;
  title: string;
  emoji: string;
  progress: number;
  next_level_xp: number | null;
  xp_to_next_level: number;
  streak: number;
  badges: {
    id: string;
    badge_type: string;
    badge_name: string;
    earned_at: string;
  }[];
  court_stamps: {
    count: number;
    milestones: {
      count: number;
      name: string;
      icon: string;
      achieved: boolean;
    }[];
    next_milestone: {
      count: number;
      name: string;
      icon: string;
      achieved: boolean;
    } | null;
  };
}

// Phase 12-4: 시즌 통계 API 응답 타입
// stats[0]은 항상 현재 시즌(연도 매칭이 없으면 0으로 채운 빈 시즌)
interface SeasonStat {
  id: string;
  season_year: number;
  season_label: string | null;
  games_played: number;
  wins: number;
  losses: number;
  avg_rating: number | null; // null = 데이터 수집 중
  mvp_count: number;
  rank_position: number | null; // null = 집계 중
  total_minutes: number;
  total_xp: number;
}
interface SeasonStatsResponse {
  stats: SeasonStat[];
}

export default function GrowthPage() {
  // 게이미피케이션 API 호출 (기존과 동일한 엔드포인트 — 변경 0)
  const { data: gamification, isLoading } = useSWR<GamificationData>(
    "/api/web/profile/gamification",
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000,
    }
  );

  // Phase 12-4: 시즌 통계 호출 — 마일스톤 데이터 연결용
  // gamification 과 병렬로 fetch (의존 관계 없음). 실패해도 페이지는 계속 렌더 (currentSeason 이 undefined → 더미 fallback).
  const { data: seasonResp } = useSWR<SeasonStatsResponse>(
    "/api/web/profile/season-stats",
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000,
    }
  );
  // 현재 시즌은 stats[0] — API 가 누락 시 0으로 채운 빈 시즌을 항상 unshift 해줌
  const currentSeason = seasonResp?.stats?.[0];

  // 로딩 상태
  if (isLoading) {
    return (
      <div className="page mx-auto" style={{ maxWidth: 880 }}>
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="text-center">
            <div className="mb-3">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="mx-auto h-8 w-8 animate-spin"
                style={{ color: "var(--color-primary)" }}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
            </div>
            <p
              className="text-sm"
              style={{ color: "var(--color-text-muted)" }}
            >
              불러오는 중...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // 비로그인 or 에러
  if (!gamification || "error" in gamification) {
    return (
      <div className="page mx-auto" style={{ maxWidth: 880 }}>
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="text-center">
            <span
              className="material-symbols-outlined text-5xl mb-4 block"
              style={{ color: "var(--color-text-disabled)" }}
            >
              person_off
            </span>
            <p
              className="mb-4 text-sm"
              style={{ color: "var(--color-text-secondary)" }}
            >
              로그인이 필요합니다
            </p>
            <Link
              href="/login"
              className="inline-block rounded-[4px] px-8 py-3 text-sm font-bold"
              style={{
                backgroundColor: "var(--color-primary)",
                color: "var(--color-on-primary)",
              }}
            >
              로그인
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 12주 더미 데이터 — DB 집계 테이블 미구현 (시안 §4-1 박제 룰: 더미 + "준비 중" 배지)
  // 사용자에게는 "준비 중" 배지로 명시되며 실제 데이터 연결 시 API 응답으로 교체 예정
  const games = [4, 5, 3, 6, 4, 7, 5, 8, 6, 9, 7, 8];
  const ratings = [3.8, 3.9, 4.0, 4.1, 4.0, 4.2, 4.3, 4.4, 4.3, 4.5, 4.6, 4.6];
  const maxG = Math.max(...games);
  const minR = 3.5;
  const maxR = 5.0;

  // Phase 12-4: 마일스톤 6종 — 4종(누적/평점/MVP/순위) 시즌 통계 연결, 1종(연속 출석) gamification, 1종(커뮤니티) 더미
  // 누적 경기는 season.games_played 우선, fallback 으로 court_stamps.count(코트 방문 수) 사용
  const totalCourts = gamification.court_stamps.count;
  const seasonGames = currentSeason?.games_played ?? 0;
  const totalGames = seasonGames > 0 ? seasonGames : totalCourts; // 시즌 집계 0이면 코트 방문 수 fallback
  // avg_rating: null = "데이터 수집 중" 상태 (집계 cron 미실행 또는 게임 평가 데이터 없음)
  const avgRating = currentSeason?.avg_rating ?? null;
  const mvpCount = currentSeason?.mvp_count ?? 0;
  const rankPos = currentSeason?.rank_position ?? null;

  const milestones = [
    {
      icon: "🏀",
      label: "누적 경기",
      val: String(totalGames), // Phase 12-4: 시즌 집계 우선 → 코트 방문 fallback
      goal: "100",
      pct: Math.min((totalGames / 100) * 100, 100),
      tone: "var(--color-primary)",
      isDummy: false,
    },
    {
      icon: "🔥",
      label: "연속 출석",
      val: `${gamification.streak}주`, // 실제 DB (gamification)
      goal: "24주",
      pct: Math.min((gamification.streak / 24) * 100, 100),
      tone: "#F59E0B",
      isDummy: false,
    },
    {
      icon: "⭐",
      label: "평균 평점",
      // Phase 12-4: avg_rating null 이면 "수집 중" 표시 + isDummy:true 유지 (배지 노출)
      val: avgRating !== null ? avgRating.toFixed(1) : "수집 중",
      goal: "5.0",
      pct: avgRating !== null ? Math.min((avgRating / 5.0) * 100, 100) : 0,
      tone: "var(--cafe-blue)",
      isDummy: avgRating === null, // 데이터 있으면 정식 표시, 없으면 "준비 중" 배지
    },
    {
      icon: "🎯",
      label: "시즌 MVP",
      // Phase 12-4: season.mvp_count 매핑 — 0회도 정식 표시 (집계 결과)
      val: `${mvpCount}회`,
      goal: "-",
      pct: mvpCount > 0 ? 100 : 0,
      tone: "var(--ok)",
      earned: mvpCount > 0,
      isDummy: false,
    },
    {
      icon: "💬",
      label: "커뮤니티 활동",
      val: "128",
      goal: "200",
      pct: 64,
      tone: "#10B981",
      isDummy: true,
    },
    {
      icon: "🏆",
      label: "시즌 순위",
      // Phase 12-4: rank_position null = "집계 중" / 값 있으면 #N위 표시
      val: rankPos !== null ? `#${rankPos}` : "집계 중",
      goal: "-",
      pct: rankPos !== null ? 100 : 0,
      tone: "#8B5CF6",
      isDummy: rankPos === null,
    },
  ];

  return (
    // 시안 v2.2 ProfileGrowth.jsx 1:1 박제 — page 컨테이너 + max-width 880
    <div className="page mx-auto" style={{ maxWidth: 880 }}>
      {/* Phase 12 §G — 모바일 백버튼 (lg+ hidden) */}
      <PageBackButton fallbackHref="/profile" />
      {/* 빵부스러기 — 홈 › 내 프로필 › 내 성장 (시안 L40-44) */}
      <div
        style={{
          display: "flex",
          gap: 6,
          fontSize: 12,
          color: "var(--color-text-muted)",
          marginBottom: 12,
          flexWrap: "wrap",
        }}
      >
        <Link href="/" style={{ cursor: "pointer", color: "var(--color-text-muted)" }}>
          홈
        </Link>
        <span>›</span>
        <Link href="/profile" style={{ cursor: "pointer", color: "var(--color-text-muted)" }}>
          내 프로필
        </Link>
        <span>›</span>
        <span style={{ color: "var(--color-text-primary)" }}>내 성장</span>
      </div>

      {/* 헤더 — eyebrow + h1 (시안 L46-50) */}
      <div style={{ marginBottom: 20 }}>
        <div className="eyebrow">GROWTH · MY JOURNEY</div>
        <h1
          style={{
            margin: "6px 0 4px",
            fontSize: 30,
            fontWeight: 800,
            letterSpacing: "-0.015em",
            color: "var(--color-text-primary)",
          }}
        >
          내 성장 기록
        </h1>
        <div style={{ fontSize: 13, color: "var(--color-text-muted)" }}>
          지난 12주 활동 + 마일스톤 진행도
        </div>
      </div>

      {/* HERO — 레벨/XP/연속 (시안 L52-70) */}
      {/* 그라디언트 배경: accent 8% 믹스로 v2.2 톤 */}
      <div
        className="card"
        style={{
          padding: "24px 28px",
          marginBottom: 14,
          background:
            "linear-gradient(135deg, color-mix(in oklab, var(--color-primary) 8%, transparent), transparent)",
        }}
      >
        {/* auto-fit 패턴으로 모바일 자동 1열 stack (인라인 repeat(N,1fr) 위반 방지) */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(min(180px, 100%), 1fr))",
            gap: 20,
            alignItems: "center",
          }}
        >
          {/* 좌측 — 레벨 원형 뱃지 */}
          <div style={{ display: "flex", justifyContent: "center" }}>
            <div
              style={{
                width: 80,
                height: 80,
                borderRadius: "50%",
                background: "linear-gradient(135deg, var(--color-primary), #FF6B35)",
                color: "#fff",
                display: "grid",
                placeItems: "center",
                fontSize: 30,
                fontWeight: 900,
                fontFamily: "var(--ff-display)",
              }}
            >
              L{gamification.level}
            </div>
          </div>

          {/* 중앙 — XP 진행 (시안의 Lv·XP 매핑) */}
          <div>
            <div
              style={{
                fontSize: 11,
                color: "var(--color-primary)",
                fontWeight: 800,
                letterSpacing: ".12em",
                marginBottom: 4,
              }}
            >
              LEVEL {gamification.level} · {gamification.title.toUpperCase()}
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>
              {gamification.next_level_xp ? (
                <>
                  다음 레벨까지{" "}
                  <span style={{ color: "var(--color-primary)" }}>
                    {gamification.xp_to_next_level.toLocaleString()} XP
                  </span>
                </>
              ) : (
                <span style={{ color: "var(--color-primary)" }}>최대 레벨 달성</span>
              )}
            </div>
            {/* 진행 막대 (시안 L59-61) */}
            <div
              style={{
                height: 8,
                background: "var(--bg-alt)",
                borderRadius: 4,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${Math.min(gamification.progress, 100)}%`,
                  height: "100%",
                  background: "linear-gradient(90deg, var(--color-primary), #FF6B35)",
                  transition: "width .3s",
                }}
              />
            </div>
            <div
              style={{
                fontSize: 11,
                color: "var(--ink-dim)",
                marginTop: 6,
                fontFamily: "var(--ff-mono)",
              }}
            >
              {gamification.xp.toLocaleString()}
              {gamification.next_level_xp
                ? ` / ${gamification.next_level_xp.toLocaleString()}`
                : ""}{" "}
              XP
            </div>
          </div>

          {/* 우측 — 스트릭 (시안 L64-68) */}
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                fontSize: 11,
                color: "var(--ink-dim)",
                fontWeight: 700,
                letterSpacing: ".1em",
              }}
            >
              STREAK
            </div>
            <div
              style={{
                fontSize: 32,
                fontWeight: 900,
                fontFamily: "var(--ff-display)",
                color: "#F59E0B",
              }}
            >
              🔥 {gamification.streak}
            </div>
            <div style={{ fontSize: 11, color: "var(--color-text-muted)" }}>
              연속 주
            </div>
          </div>
        </div>
      </div>

      {/* 12주 추이 — 경기수 + 평점 (시안 L72-106) */}
      {/* DB 미구현 영역 → 더미 + "준비 중" 배지 표시 */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(min(280px, 100%), 1fr))",
          gap: 14,
          marginBottom: 14,
        }}
      >
        {/* 주간 경기수 spark bar */}
        <div className="card" style={{ padding: "18px 20px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "baseline",
              marginBottom: 14,
              gap: 8,
              flexWrap: "wrap",
            }}
          >
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>
              주간 경기수
            </h3>
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              {/* 준비 중 배지 — DB 집계 미구현 명시 */}
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  letterSpacing: ".12em",
                  color: "var(--ink-dim)",
                  background: "var(--bg-alt)",
                  padding: "3px 8px",
                  borderRadius: 4,
                }}
              >
                준비 중
              </span>
              <span style={{ fontSize: 11, color: "var(--ink-dim)" }}>
                최근 12주
              </span>
            </div>
          </div>
          {/* hscroll — 모바일에서 가로 스크롤 (globals.css .hscroll 룰 활용) */}
          <div
            className="hscroll"
            style={{
              display: "flex",
              alignItems: "flex-end",
              gap: 6,
              height: 80,
              overflowX: "auto",
              paddingBottom: 4,
            }}
          >
            {games.map((g, i) => (
              <div
                key={i}
                style={{
                  flex: "0 0 18px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <div
                  style={{
                    width: 14,
                    height: `${(g / maxG) * 60}px`,
                    background:
                      i === games.length - 1
                        ? "var(--color-primary)"
                        : "var(--cafe-blue-soft)",
                    borderRadius: 2,
                  }}
                />
                <div
                  style={{
                    fontSize: 9,
                    color: "var(--ink-dim)",
                    fontFamily: "var(--ff-mono)",
                  }}
                >
                  {g}
                </div>
              </div>
            ))}
          </div>
          <div
            style={{
              fontSize: 11,
              color: "var(--color-text-muted)",
              marginTop: 8,
            }}
          >
            이번 주{" "}
            <b style={{ color: "var(--color-primary)" }}>
              {games[games.length - 1]}경기
            </b>{" "}
            · 12주 평균 5.5
          </div>
        </div>

        {/* 평균 평점 추이 SVG line */}
        <div className="card" style={{ padding: "18px 20px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "baseline",
              marginBottom: 14,
              gap: 8,
              flexWrap: "wrap",
            }}
          >
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>
              평균 평점 추이
            </h3>
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  letterSpacing: ".12em",
                  color: "var(--ink-dim)",
                  background: "var(--bg-alt)",
                  padding: "3px 8px",
                  borderRadius: 4,
                }}
              >
                준비 중
              </span>
              <span style={{ fontSize: 11, color: "var(--ink-dim)" }}>
                5.0 만점
              </span>
            </div>
          </div>
          {/* SVG polyline + 점들. 마지막 점만 강조색 */}
          <svg viewBox="0 0 240 80" style={{ width: "100%", height: 80 }}>
            <polyline
              fill="none"
              stroke="var(--cafe-blue)"
              strokeWidth="2"
              points={ratings
                .map(
                  (r, i) =>
                    `${(i / (ratings.length - 1)) * 240},${
                      80 - ((r - minR) / (maxR - minR)) * 70
                    }`
                )
                .join(" ")}
            />
            {ratings.map((r, i) => (
              <circle
                key={i}
                cx={(i / (ratings.length - 1)) * 240}
                cy={80 - ((r - minR) / (maxR - minR)) * 70}
                r={i === ratings.length - 1 ? 4 : 2}
                fill={
                  i === ratings.length - 1
                    ? "var(--color-primary)"
                    : "var(--cafe-blue)"
                }
              />
            ))}
          </svg>
          <div
            style={{
              fontSize: 11,
              color: "var(--color-text-muted)",
              marginTop: 6,
            }}
          >
            현재{" "}
            <b style={{ color: "var(--cafe-blue)" }}>
              {ratings[ratings.length - 1]}
            </b>{" "}
            · 12주 +0.8 ↑
          </div>
        </div>
      </div>

      {/* 마일스톤 6개 (시안 L108-127) */}
      <h2 style={{ margin: "8px 0 12px", fontSize: 18, fontWeight: 800 }}>
        마일스톤
      </h2>
      <div
        style={{
          display: "grid",
          // auto-fit으로 모바일 1열 → 태블릿 2열 → 데스크톱 3열 자동 (인라인 repeat(3,1fr) 위반 방지)
          gridTemplateColumns:
            "repeat(auto-fit, minmax(min(220px, 100%), 1fr))",
          gap: 12,
          marginBottom: 14,
        }}
      >
        {milestones.map((m) => (
          <div key={m.label} className="card" style={{ padding: "18px 20px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 10,
              }}
            >
              <span style={{ fontSize: 24 }}>{m.icon}</span>
              <div style={{ display: "flex", gap: 4 }}>
                {m.isDummy && (
                  // 더미 데이터 표시 — DB 미구현 명시
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 800,
                      letterSpacing: ".1em",
                      color: "var(--ink-dim)",
                      background: "var(--bg-alt)",
                      padding: "3px 8px",
                      borderRadius: 4,
                    }}
                  >
                    준비 중
                  </span>
                )}
                {m.earned && (
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 800,
                      letterSpacing: ".1em",
                      color: "var(--ok)",
                      background:
                        "color-mix(in oklab, var(--ok) 12%, transparent)",
                      padding: "3px 8px",
                      borderRadius: 4,
                    }}
                  >
                    달성
                  </span>
                )}
              </div>
            </div>
            <div
              style={{
                fontSize: 12,
                color: "var(--color-text-muted)",
                marginBottom: 4,
              }}
            >
              {m.label}
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                gap: 4,
                marginBottom: 10,
              }}
            >
              <span
                style={{
                  fontSize: 24,
                  fontWeight: 900,
                  fontFamily: "var(--ff-display)",
                  color: m.tone,
                }}
              >
                {m.val}
              </span>
              {m.goal !== "-" && (
                <span style={{ fontSize: 12, color: "var(--ink-dim)" }}>
                  / {m.goal}
                </span>
              )}
            </div>
            <div
              style={{
                height: 5,
                background: "var(--bg-alt)",
                borderRadius: 4,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${m.pct}%`,
                  height: "100%",
                  background: m.tone,
                  transition: "width .3s",
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* 다음 목표 CTA (시안 L129-137) */}
      <div
        className="card"
        style={{
          padding: "18px 22px",
          marginBottom: 14,
          display: "flex",
          alignItems: "center",
          gap: 14,
          flexWrap: "wrap",
        }}
      >
        <span
          className="material-symbols-outlined"
          style={{ fontSize: 28, color: "var(--color-primary)" }}
        >
          flag
        </span>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 2 }}>
            {/* Phase 12-4: totalGames(시즌 집계 우선 → 코트 방문 fallback) 기준 통일 */}
            다음 목표 — 누적 50경기 (
            {Math.max(50 - totalGames, 0)}경기 남음)
          </div>
          <div style={{ fontSize: 12, color: "var(--color-text-muted)" }}>
            이번 주 추천 경기에 신청해 마일스톤을 달성해 보세요
          </div>
        </div>
        {/* 사이트 컨벤션 — Link로 /games 진입 */}
        <Link
          href="/games"
          className="btn btn--primary btn--sm"
          style={{
            display: "inline-flex",
            alignItems: "center",
            padding: "8px 16px",
            borderRadius: 4,
            fontSize: 13,
            fontWeight: 700,
            background: "var(--color-primary)",
            color: "#fff",
            textDecoration: "none",
          }}
        >
          경기 찾기 →
        </Link>
      </div>

      {/* 준비 중 — 구간별 상세 분석 (시안 L139-143) */}
      <div
        className="card"
        style={{
          padding: "18px 22px",
          marginBottom: 40,
          opacity: 0.65,
          display: "flex",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <span
          style={{
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: ".12em",
            color: "var(--ink-dim)",
            background: "var(--bg-alt)",
            padding: "4px 10px",
            borderRadius: 4,
          }}
        >
          준비 중
        </span>
        <div
          style={{ flex: 1, fontSize: 13, color: "var(--color-text-muted)", minWidth: 200 }}
        >
          구간별 상세 분석 (포지션별 / 코트별 / 시간대별) 곧 추가됩니다
        </div>
      </div>
    </div>
  );
}

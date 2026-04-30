"use client";

/**
 * 내 성장 페이지 (/profile/growth)
 *
 * Phase 9 D등급 박제: Profile.jsx 게이미피케이션 섹션 톤 차용
 *
 * 박제 매핑 (시안 Profile.jsx):
 *  - .page 컨테이너 + max-width 880 (시안 Profile 우측 본문 영역 톤)
 *  - 빵부스러기 (프로필 › 내 성장)
 *  - eyebrow "GROWTH · 내 성장" + h1 (시안 v2 페이지 헤더 표준)
 *  - 카드 그리드: 시안 Profile의 "활동 뱃지" / "시즌 스탯" 섹션 padding 22~24px 톤
 *  - var(--color-*) 토큰 일관 사용
 *  - section header — fontSize:18, fontWeight:700, margin:0 0 14
 *
 * 보존 원칙 (변경 0):
 *  - SWR 데이터 fetch (/api/web/profile/gamification) 100% 동일
 *  - GamificationData 타입 변경 없음
 *  - XpLevelCard / StreakCard / CourtStamps / BadgeCollection props 0 변경
 *  - 로딩/비로그인 분기 동일
 *  - 자식 컴포넌트는 그대로 재사용 (섹션 wrapper만 v2 톤으로 교체)
 */

import useSWR from "swr";
import Link from "next/link";
import { XpLevelCard } from "../_components/xp-level-card";
import { StreakCard } from "../_components/streak-card";
import { BadgeCollection } from "../_components/badge-collection";
import { CourtStamps } from "../_components/court-stamps";

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

export default function GrowthPage() {
  // 게이미피케이션 API 호출 (기존과 동일한 엔드포인트 — 변경 0)
  const { data: gamification, isLoading } = useSWR<GamificationData>(
    "/api/web/profile/gamification",
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000,
    }
  );

  // 로딩 상태 — v2 톤 일치 (page 컨테이너 + 카드 박스)
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

  return (
    // 시안 v2 Profile.jsx 우측 본문 톤 — page max-width 880, eyebrow + h1
    <div className="page mx-auto" style={{ maxWidth: 880 }}>
      {/* 시안 빵부스러기 (프로필 › 내 성장) — billing 페이지와 동일 톤 */}
      <div
        style={{
          fontSize: 12,
          color: "var(--color-text-muted)",
          marginBottom: 10,
        }}
      >
        <Link
          href="/profile"
          style={{ cursor: "pointer", color: "var(--color-text-muted)" }}
        >
          프로필
        </Link>{" "}
        ›{" "}
        <span style={{ color: "var(--color-text-primary)" }}>내 성장</span>
      </div>

      {/* 시안 eyebrow + h1 (billing/edit/settings 페이지 헤더 톤 일치) */}
      <div className="eyebrow">GROWTH · 내 성장</div>
      <h1
        style={{
          margin: "6px 0 6px",
          fontSize: 28,
          fontWeight: 800,
          letterSpacing: "-0.02em",
          color: "var(--color-text-primary)",
          fontFamily: "var(--font-heading)",
        }}
      >
        성장 지표
      </h1>
      <p
        style={{
          margin: "0 0 22px",
          fontSize: 13,
          color: "var(--color-text-muted)",
          lineHeight: 1.6,
        }}
      >
        XP·레벨, 연속 출석, 코트 도장깨기, 획득 뱃지를 한눈에 확인할 수 있어요.
      </p>

      {/* 시안 v2 Profile 우측 본문: 카드 그리드.
          섹션 카드는 자식 컴포넌트가 자체 카드 스타일을 가지고 있으므로
          섹션 헤더(eyebrow 보조) + 자식 wrapping 형태로 톤만 맞춤. */}
      <div className="space-y-6">
        {/* XP / 레벨 — 시안 "활동 뱃지" 섹션 헤더 톤 */}
        <section>
          <h2
            style={{
              margin: "0 0 10px",
              fontSize: 14,
              fontWeight: 700,
              letterSpacing: ".04em",
              color: "var(--color-text-primary)",
              textTransform: "uppercase",
              fontFamily: "var(--font-heading)",
            }}
          >
            XP · 레벨
          </h2>
          <XpLevelCard
            xp={gamification.xp}
            level={gamification.level}
            title={gamification.title}
            emoji={gamification.emoji}
            progress={gamification.progress}
            nextLevelXp={gamification.next_level_xp}
            xpToNextLevel={gamification.xp_to_next_level}
          />
        </section>

        {/* 연속 출석 */}
        <section>
          <h2
            style={{
              margin: "0 0 10px",
              fontSize: 14,
              fontWeight: 700,
              letterSpacing: ".04em",
              color: "var(--color-text-primary)",
              textTransform: "uppercase",
              fontFamily: "var(--font-heading)",
            }}
          >
            연속 출석
          </h2>
          <StreakCard streak={gamification.streak} />
        </section>

        {/* 코트 도장깨기 진행률 */}
        <section>
          <h2
            style={{
              margin: "0 0 10px",
              fontSize: 14,
              fontWeight: 700,
              letterSpacing: ".04em",
              color: "var(--color-text-primary)",
              textTransform: "uppercase",
              fontFamily: "var(--font-heading)",
            }}
          >
            코트 도장깨기
          </h2>
          <CourtStamps
            courtCount={gamification.court_stamps.count}
            milestones={gamification.court_stamps.milestones}
            nextMilestone={gamification.court_stamps.next_milestone}
          />
        </section>

        {/* 획득 뱃지 — 시안 Profile "활동 뱃지" 섹션 톤 */}
        <section>
          <h2
            style={{
              margin: "0 0 10px",
              fontSize: 14,
              fontWeight: 700,
              letterSpacing: ".04em",
              color: "var(--color-text-primary)",
              textTransform: "uppercase",
              fontFamily: "var(--font-heading)",
            }}
          >
            획득 뱃지
          </h2>
          <BadgeCollection
            badges={gamification.badges.map((b) => ({
              id: b.id,
              badgeType: b.badge_type,
              badgeName: b.badge_name,
              earnedAt: b.earned_at,
            }))}
          />
        </section>
      </div>
    </div>
  );
}

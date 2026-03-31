"use client";

/* ============================================================
 * QuickActions — 홈 히어로 빠른 액션 버튼 3개
 *
 * 비로그인/신규: 체크인 / 경기 찾기 / 픽업게임 (고정)
 * 로그인 + 대시보드 데이터: 활동 프로필에 따라 버튼 동적 생성
 *   - nextGame 있으면 "다음 경기 D-N" 버튼 (1번 위치)
 *   - dominantType === checkin → "자주 가는 코트명으로 체크인"
 *   - dominantType === pickup → "근처 픽업" 버튼
 *   - activeTournament 있으면 "대회: 대회명" (3번 위치)
 * ============================================================ */

import Link from "next/link";
import type { DashboardData } from "./home-hero";

// 액션 버튼 타입
interface ActionItem {
  label: string;
  icon: string;
  href: string;
  bgColor: string;
}

// 기본(비로그인/신규) 액션 3개
const DEFAULT_ACTIONS: ActionItem[] = [
  {
    label: "체크인",
    icon: "location_on",
    href: "/courts",
    bgColor: "var(--color-primary)",
  },
  {
    label: "경기 찾기",
    icon: "sports_basketball",
    href: "/games",
    bgColor: "var(--color-info)",
  },
  {
    label: "픽업게임",
    icon: "bolt",
    href: "/courts?tab=pickup",
    bgColor: "var(--color-navy, #1B3C87)",
  },
];

// D-Day 계산 헬퍼
function getDDay(dateStr: string): string {
  const diff = Math.ceil(
    (new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );
  if (diff <= 0) return "오늘";
  return `D-${diff}`;
}

interface QuickActionsProps {
  dashboardData?: DashboardData | null;
}

export function QuickActions({ dashboardData }: QuickActionsProps) {
  // 대시보드 데이터가 없으면 기본 버튼 표시 (비로그인/신규/로딩중)
  const actions = dashboardData
    ? buildPersonalizedActions(dashboardData)
    : DEFAULT_ACTIONS;

  return (
    <div className="flex gap-3">
      {actions.map((action) => (
        <Link
          key={action.label}
          href={action.href}
          className="flex-1 flex flex-col items-center justify-center gap-2 py-4 rounded-xl text-white transition-opacity hover:opacity-90 active:opacity-80"
          style={{ backgroundColor: action.bgColor }}
        >
          {/* Material Symbols 아이콘 (32px) */}
          <span
            className="material-symbols-outlined"
            style={{ fontSize: "32px" }}
          >
            {action.icon}
          </span>
          {/* 버튼 라벨 — 긴 텍스트 잘림 방지 */}
          <span className="text-sm font-medium text-center leading-tight px-1 truncate max-w-full">
            {action.label}
          </span>
        </Link>
      ))}
    </div>
  );
}

/** 대시보드 데이터 기반으로 개인화된 액션 3개 생성 */
function buildPersonalizedActions(data: DashboardData): ActionItem[] {
  const actions: ActionItem[] = [];

  // 1번 위치: 다음 경기가 있으면 우선 표시
  if (data.nextGame) {
    const dday = data.nextGame.scheduledAt
      ? getDDay(data.nextGame.scheduledAt)
      : "";
    actions.push({
      label: `다음 경기 ${dday}`,
      icon: "sports_basketball",
      href: `/games/${data.nextGame.uuid}`,
      bgColor: "var(--color-info)",
    });
  }

  // 2번 위치: 활동 유형에 따른 버튼
  const dominantType = data.activityProfile?.dominantType ?? "new";
  if (dominantType === "checkin" && data.frequentCourts.length > 0) {
    // 자주 가는 코트로 체크인 유도
    const court = data.frequentCourts[0];
    actions.push({
      label: `${court.name} 체크인`,
      icon: "location_on",
      href: `/courts/${court.id}`,
      bgColor: "var(--color-primary)",
    });
  } else if (dominantType === "pickup") {
    actions.push({
      label: `픽업 ${data.activityProfile.pickupCount}회`,
      icon: "bolt",
      href: "/courts?tab=pickup",
      bgColor: "var(--color-navy, #1B3C87)",
    });
  } else if (dominantType === "game") {
    actions.push({
      label: "경기 찾기",
      icon: "sports_basketball",
      href: "/games",
      bgColor: "var(--color-info)",
    });
  }

  // 3번 위치: 활성 대회가 있으면 대회 버튼
  if (data.activeTournament) {
    actions.push({
      label: data.activeTournament.name,
      icon: "emoji_events",
      href: `/tournaments/${data.activeTournament.id}`,
      bgColor: "var(--color-warning, #F59E0B)",
    });
  }

  // 3개가 안 되면 기본 버튼으로 채움
  const defaults = DEFAULT_ACTIONS.filter(
    (d) => !actions.some((a) => a.href === d.href)
  );
  while (actions.length < 3 && defaults.length > 0) {
    actions.push(defaults.shift()!);
  }

  return actions.slice(0, 3);
}

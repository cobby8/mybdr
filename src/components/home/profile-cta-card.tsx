"use client";

/**
 * 홈 CTA "프로필 완성하기" 카드 — 2026-05-04 가입 흐름 통합 (F5)
 *
 * 이유(왜):
 *   가입 흐름 1-step 단순화 (F1) 결과, 가입 직후 사용자는 포지션/지역/실력 미입력 상태.
 *   기존 5단계 진행 배너 (profile-completion-banner.tsx) 는 작은 띠 형태라 시각 임팩트 약함.
 *   홈 상단에 "프로필 완성하기" 카드를 배치 — 아이콘 + 제목 + 부제 + CTA 버튼 + 닫기 X.
 *   localStorage 기반 7일 dismiss — DB 영향 0 (본 1차 범위).
 *
 * 어떻게:
 *   - 표시 조건: useSWR("/api/web/me") → me.profile_completed === false (or undefined)
 *   - 닫기: localStorage "profile_cta_dismissed_at" 저장 → 7일 후 다시 표시
 *   - BDR-current 13룰: var(--*) 토큰 / Material Symbols / pill 9999px 회피 / 모바일 분기
 *
 * 보존:
 *   - 기존 ProfileCompletionBanner (5단계 도트 배너) 와 별개. 둘 다 mount 가능.
 *   - me API 응답 키: profile_completed (snake_case — apiSuccess 자동 변환 후)
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import useSWR from "swr";

// 닫기 키 + 억제 기간 7일 (ProfileCompletionBanner 와 동일 패턴, 별도 키)
const DISMISS_KEY = "profile_cta_dismissed_at";
const DISMISS_DURATION = 7 * 24 * 60 * 60 * 1000;

// me 응답 — CTA 표시 조건 판정에 필요한 필드만 추림
interface MeResponse {
  id?: string;
  profile_completed?: boolean;
  // 5/7 PR1.2 — 본인인증 여부 (onboarding 1/10 우선 분기)
  name_verified?: boolean;
}

// 2026-05-05 fix (옵션 A-4): 자체 fetcher 제거 → 글로벌 SWR fetcher 위임.
//   본질 (planner 보고서 §2-2 (A)): 자체 fetcher 사용 시 SWR 가 캐시 entry 를 별도로
//   인식 (cache key = url + serializeFetcher) → ProfileCompletionBanner / profile-widget
//   (글로벌 fetcher 사용) 와 캐시 entry 분리 → me API 중복 호출 = 콘솔 401 ×2 의 진짜 원인.
//   fix: 자체 fetcher (fetchMeOrNull) 제거 → useSWR 가 글로벌 fetcher (swr-provider.tsx)
//        사용 → 다른 컴포넌트와 캐시 entry 통합 → me API 1회만 호출.
//   글로벌 fetcher 가 이미 401→null + shouldRetryOnError:false + revalidateOnFocus:false 처리.
//   본 컴포넌트의 추가 옵션 (dedupingInterval 30s) 만 유지 — 비로그인 무한 폭주 차단 유지.

export function ProfileCtaCard() {
  // 2026-05-05 fix: hydration mismatch 차단 — React error #418 본질.
  //   본질: SSR 시점 useSWR data=undefined → return null / client mount 후 fetch → 렌더 불일치.
  //         Hydration 실패 → React 전체 tree reset → 페이지 응답 지연 + 비로그인 표시.
  //   fix: mounted state — SSR 시점 무조건 null 반환 → client mount 후만 useSWR 결과 반영.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // useSWR — 글로벌 fetcher 사용 (swr-provider.tsx 등록).
  // ProfileCompletionBanner / profile-widget 와 동일 캐시 entry 공유 → me API 중복 호출 0.
  // dedupingInterval 30s 만 본 컴포넌트에서 명시 (다른 컴포넌트도 동일 값 사용 → cache 통합).
  const { data: me } = useSWR<MeResponse | null>("/api/web/me", {
    dedupingInterval: 30000,
  });

  const [dismissed, setDismissed] = useState(false);

  // 마운트 시 localStorage 확인 (7일 이내면 숨김)
  useEffect(() => {
    const dismissedAt = localStorage.getItem(DISMISS_KEY);
    if (dismissedAt) {
      const elapsed = Date.now() - Number(dismissedAt);
      if (elapsed < DISMISS_DURATION) setDismissed(true);
    }
  }, []);

  // SSR 시점 무조건 숨김 (hydration mismatch 차단) — client mount 후 useSWR/localStorage 결과 반영
  if (!mounted) return null;
  // 비로그인(me 없음) / 닫힘 / 이미 완성 상태 → 숨김
  if (!me || !me.id || dismissed) return null;
  if (me.profile_completed === true) return null;

  // 5/7 PR1.2 — 본인인증 우선 분기
  // name_verified=false 면 onboarding 1/10 본인인증부터 시작 (대회 출전 게이트 의무).
  // 본인인증 완료 후 자동으로 기존 "프로필 완성하기" 안내로 전환.
  const needsIdentity = me.name_verified === false;

  // 닫기 — 현재 시각 저장 → 7일 재노출 억제
  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setDismissed(true);
  };

  return (
    // BDR-current 13룰 토큰만 — accent-soft 배경 + accent 액션
    // 모바일 분기 — flex-wrap + 버튼 풀폭 (sm 이상 고정폭)
    <div
      style={{
        position: "relative",
        marginBottom: 20,
        padding: "18px 20px",
        background: "var(--accent-soft)",
        border: "1px solid var(--border)",
        borderRadius: 4,
        display: "flex",
        alignItems: "center",
        gap: 16,
        flexWrap: "wrap",
      }}
    >
      {/* 좌측 아이콘 — needsIdentity = verified_user / 일반 = edit_note */}
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: "50%", // pill 9999px 회피 (정사각형 W=H 원형은 50% 사용)
          background: "var(--accent)",
          display: "grid",
          placeItems: "center",
          flexShrink: 0,
        }}
      >
        <span
          className="material-symbols-outlined"
          style={{ fontSize: 28, color: "#fff" }}
        >
          {needsIdentity ? "verified_user" : "edit_note"}
        </span>
      </div>

      {/* 본문 — 제목 + 부제 (flex: 1 모바일 닫기 버튼과 충돌 방지 minWidth 0) */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 16,
            fontWeight: 700,
            color: "var(--ink)",
            marginBottom: 4,
            letterSpacing: "-0.01em",
          }}
        >
          {needsIdentity ? "본인인증부터 시작하세요" : "프로필 완성하기"}
        </div>
        <div
          style={{
            fontSize: 13,
            color: "var(--ink-mute)",
            lineHeight: 1.5,
          }}
        >
          {needsIdentity
            ? "대회 출전 · 팀 활동에는 실명 인증이 필요해요"
            : "포지션·지역·실력을 설정하면 맞춤 추천을 드려요"}
        </div>
      </div>

      {/* CTA 버튼 — needsIdentity = onboarding/identity / 일반 = profile/edit */}
      <Link
        href={needsIdentity ? "/onboarding/identity" : "/profile/edit"}
        className="btn btn--primary"
        style={{
          flexShrink: 0,
          fontSize: 13,
          fontWeight: 700,
          padding: "8px 16px",
        }}
      >
        {needsIdentity ? "본인인증 →" : "완성하러 가기"}
      </Link>

      {/* 닫기 X 버튼 — 우상단 absolute (시안 패턴) */}
      <button
        type="button"
        onClick={handleDismiss}
        aria-label="배너 닫기"
        style={{
          position: "absolute",
          top: 8,
          right: 8,
          width: 28,
          height: 28,
          borderRadius: "50%", // 정사각형 W=H 원형
          background: "transparent",
          border: "none",
          color: "var(--ink-dim)",
          cursor: "pointer",
          display: "grid",
          placeItems: "center",
          padding: 0,
        }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
          close
        </span>
      </button>
    </div>
  );
}

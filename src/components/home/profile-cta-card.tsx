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
}

// 2026-05-05 fix: 비로그인 사용자는 /api/web/me 가 401 반환 → SWR 무한 재시도 폭주.
//   콘솔 GET 401 30+ 반복 + 메인 스레드 부담 + 로그인 버튼 클릭 응답 지연.
//   fix: 401 받으면 null 반환 (throw ❌) + retry/refocus 비활성.
const fetchMeOrNull = async (url: string) => {
  const res = await fetch(url, { credentials: "include" });
  if (res.status === 401) return null; // 비로그인/탈퇴 → null (재시도 ❌)
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
};

export function ProfileCtaCard() {
  // 2026-05-05 fix: hydration mismatch 차단 — React error #418 본질.
  //   본질: SSR 시점 useSWR data=undefined → return null / client mount 후 fetch → 렌더 불일치.
  //         Hydration 실패 → React 전체 tree reset → 페이지 응답 지연 + 비로그인 표시.
  //   fix: mounted state — SSR 시점 무조건 null 반환 → client mount 후만 useSWR 결과 반영.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // useSWR — ProfileCompletionBanner 와 동일 endpoint 캐시 공유 (dedupingInterval 30s)
  const { data: me } = useSWR<MeResponse | null>("/api/web/me", fetchMeOrNull, {
    dedupingInterval: 30000,
    shouldRetryOnError: false,   // 401/error 시 재시도 ❌ (비로그인 무한 폭주 차단)
    revalidateOnFocus: false,    // 포커스 시 재시도 ❌
    revalidateOnReconnect: false,// 네트워크 복귀 시 재시도 ❌
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
      {/* 좌측 아이콘 — Material Symbols Outlined edit_note (lucide-react 금지 룰 준수) */}
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
          edit_note
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
          프로필 완성하기
        </div>
        <div
          style={{
            fontSize: 13,
            color: "var(--ink-mute)",
            lineHeight: 1.5,
          }}
        >
          포지션·지역·실력을 설정하면 맞춤 추천을 드려요
        </div>
      </div>

      {/* 완성하러 가기 버튼 — /profile/edit Link (BDR-current 라우트) */}
      <Link
        href="/profile/edit"
        className="btn btn--primary"
        style={{
          flexShrink: 0,
          fontSize: 13,
          fontWeight: 700,
          padding: "8px 16px",
        }}
      >
        완성하러 가기
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

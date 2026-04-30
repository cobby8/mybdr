"use client";

/**
 * PageBackButton — 모바일 전용 뒤로가기 버튼.
 *
 * Why (사용자 직접 보고, Phase 12 §G):
 * - 사용자 보고: "프로필 영역 등 진입 후 뒤로 나가는 버튼이 없음"
 * - 모바일에서 깊은 페이지(/profile/edit, /profile/billing 등) 진입 시
 *   브라우저 뒤로가기 외에 페이지 내 복귀 동선 부재
 *
 * Pattern:
 * - 페이지 셸(예: <div className="page">) 첫 줄에 배치
 * - lg+ 데스크톱은 사이드바/breadcrumb 가 대체 → `lg:hidden` 으로 숨김
 * - history.length 1 (직진 진입) 인 경우 fallbackHref 로 이동
 *
 * Touch target: min-height 44px (Apple HIG / Material 권장, 사용자 결정 §2-7)
 * Radius: 4px (사용자 결정 §2-3 — pill 9999px 금지)
 */

import { useRouter } from "next/navigation";

interface Props {
  /** router.back() 안 되면 (history.length === 1) 갈 곳. 기본 "/" */
  fallbackHref?: string;
  /** 라벨. 기본 "뒤로" */
  label?: string;
}

export function PageBackButton({ fallbackHref = "/", label = "뒤로" }: Props) {
  const router = useRouter();

  // 직진 진입 케이스: 새 탭/북마크/리다이렉트로 들어와서 history 가 비어있는 경우
  // → router.back() 하면 외부 사이트로 나가버림 → fallbackHref 사용
  const handleClick = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      window.location.href = fallbackHref;
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      // lg:hidden — 데스크톱 1024px+ 에서 숨김 (사이드바/breadcrumb 가 대체)
      className="lg:hidden flex items-center gap-1 text-sm mb-3 -ml-1 px-2 py-2 rounded transition-colors"
      aria-label={label}
      style={{
        minHeight: 44, // 터치 타겟
        color: "var(--ink-mute)",
        borderRadius: 4, // pill 금지
        background: "transparent",
        border: "none",
        cursor: "pointer",
      }}
    >
      <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
        arrow_back
      </span>
      <span>{label}</span>
    </button>
  );
}

import { type ReactNode } from "react";

// 관리자 페이지 공통 헤더 컴포넌트 (Phase D + 디자인 시스템 통합 — 2026-05-02)
// (web) 디자인 시스템 일관성:
//  - eyebrow (대문자 + tracking-wider) + h1 (var(--ff-display) Space Grotesk)
//  - .input / .btn 글로벌 클래스 사용 (web 페이지와 동일 시각)
//  - 모바일: 검색 form 풀폭 + iOS 16px input 자동 (globals.css 룰)
interface AdminPageHeaderProps {
  title: string;
  subtitle?: string; // "전체 42개" 같은 부제
  eyebrow?: string; // (web) 패턴: title 위 작은 라벨 (예: "ADMIN · USERS")
  searchPlaceholder?: string;
  searchName?: string; // form input name (기본값 "q")
  searchDefaultValue?: string;
  actions?: ReactNode; // 우측 추가 버튼 등
}

export function AdminPageHeader({
  title,
  subtitle,
  eyebrow,
  searchPlaceholder,
  searchName = "q",
  searchDefaultValue,
  actions,
}: AdminPageHeaderProps) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-baseline sm:justify-between">
      {/* 좌측: eyebrow + 제목 + 부제 (web 디자인 시스템 패턴) */}
      <div className="min-w-0">
        {eyebrow && (
          <div
            className="mb-1 text-[10px] font-extrabold uppercase tracking-[0.12em]"
            style={{ color: "var(--color-text-muted)" }}
          >
            {eyebrow}
          </div>
        )}
        <h1
          className="text-[22px] sm:text-[28px] font-extrabold leading-tight"
          style={{
            fontFamily: "var(--ff-display)",
            letterSpacing: "-0.015em",
            color: "var(--color-text-primary)",
          }}
        >
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1 text-[13px]" style={{ color: "var(--color-text-muted)" }}>
            {subtitle}
          </p>
        )}
      </div>

      {/* 우측: 검색 + 액션 — 모바일 풀폭 / sm+ inline */}
      <div className="flex items-center gap-2 w-full sm:w-auto">
        {searchPlaceholder && (
          <form method="GET" className="flex gap-2 flex-1 sm:flex-initial">
            <input
              name={searchName}
              defaultValue={searchDefaultValue ?? ""}
              placeholder={searchPlaceholder}
              className="input flex-1 sm:flex-initial"
              style={{ minWidth: 0 }}
            />
            <button type="submit" className="btn btn--primary btn--sm shrink-0">
              검색
            </button>
          </form>
        )}
        {actions}
      </div>
    </div>
  );
}

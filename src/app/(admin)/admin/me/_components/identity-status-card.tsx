/**
 * IdentityStatusCard — admin 마이페이지 본인인증 상태 카드.
 *
 * 2026-05-11 — Phase 2 (관리 토너먼트 / 본인인증 / 최근 활동).
 *
 * 표시 분기 (decisions.md [2026-05-08] mock 본인인증 폴백 설계):
 *   - identity_method = "portone" → "본인인증 완료 (PASS)" + check_circle 아이콘
 *   - identity_method = "mock"    → "본인인증 완료 (간편 입력)" + info 아이콘 + PASS 권장 안내
 *   - identity_method = null      → "본인인증 미완료" + warning 아이콘 + "인증하기" Link
 *
 * 본인인증 진입점: `/onboarding/identity` (기존 web onboarding 경로 재사용 — grep 검증)
 *
 * 디자인 토큰만 사용 — var(--*) / Material Symbols Outlined.
 * server component (interactivity 0).
 */

import Link from "next/link";

export interface IdentityStatusCardProps {
  identityMethod: string | null;
}

// 분기별 표시 데이터 — 단일 함수로 응집
// 이유: identity_method 분기 3 케이스를 컴포넌트 본문 안에서 if/else 산개시키면 가독성 ↓
function getIdentityDisplay(method: string | null): {
  label: string;
  description: string;
  icon: string; // Material Symbols 아이콘명
  iconColor: string; // CSS color (var(--*))
  borderColor: string; // 카드 border 색 (활성 = primary / 경고 = warn / 기본 = border)
  bgColor: string; // 카드 배경
  hint?: string; // 보조 안내 (있을 때만)
  cta?: { label: string; href: string }; // 행동 유도 버튼 (있을 때만)
} {
  if (method === "portone") {
    return {
      label: "본인인증 완료 (PASS)",
      description: "PortOne 본인인증으로 검증되었습니다.",
      icon: "verified",
      iconColor: "var(--color-primary)",
      borderColor: "var(--color-primary)",
      bgColor: "var(--color-elevated)",
    };
  }
  if (method === "mock") {
    return {
      label: "본인인증 완료 (간편 입력)",
      description: "임시 자체 입력으로 등록되었습니다.",
      icon: "info",
      iconColor: "var(--color-text-secondary)",
      borderColor: "var(--color-border)",
      bgColor: "var(--color-surface)",
      hint: "PortOne PASS 본인인증 권장 (출시 후 일괄 재인증 예정)",
    };
  }
  // identity_method === null → 미인증
  return {
    label: "본인인증 미완료",
    description: "본인인증이 필요합니다.",
    icon: "warning",
    iconColor: "var(--color-text-secondary)",
    borderColor: "var(--color-border)",
    bgColor: "var(--color-surface)",
    cta: { label: "인증하기", href: "/onboarding/identity" },
  };
}

export function IdentityStatusCard({
  identityMethod,
}: IdentityStatusCardProps) {
  const display = getIdentityDisplay(identityMethod);

  return (
    <section
      className="rounded-lg border p-6"
      style={{
        borderColor: "var(--color-border)",
        backgroundColor: "var(--color-surface)",
      }}
    >
      {/* 섹션 헤더 */}
      <header className="mb-4">
        <h2
          className="text-lg font-bold"
          style={{ color: "var(--color-text-primary)" }}
        >
          본인인증 상태
        </h2>
        <p
          className="mt-1 text-xs"
          style={{ color: "var(--color-text-secondary)" }}
        >
          서비스 운영을 위해 본인인증이 필요합니다.
        </p>
      </header>

      {/* 본문 — 분기별 카드 */}
      <div
        className="rounded-md border p-3"
        style={{
          borderColor: display.borderColor,
          backgroundColor: display.bgColor,
        }}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 22, color: display.iconColor }}
            >
              {display.icon}
            </span>
            <div className="min-w-0">
              <div
                className="text-sm font-medium"
                style={{ color: "var(--color-text-primary)" }}
              >
                {display.label}
              </div>
              <div
                className="text-xs"
                style={{ color: "var(--color-text-secondary)" }}
              >
                {display.description}
              </div>
            </div>
          </div>

          {/* CTA 버튼 (미인증 케이스만) */}
          {display.cta && (
            <Link
              href={display.cta.href}
              className="rounded px-3 py-1.5 text-xs font-semibold whitespace-nowrap"
              style={{
                backgroundColor: "var(--color-primary)",
                color: "white",
                borderRadius: "4px",
              }}
            >
              {display.cta.label}
            </Link>
          )}
        </div>

        {/* 보조 안내 (mock 케이스만) */}
        {display.hint && (
          <div
            className="mt-2 flex items-center gap-1 text-xs"
            style={{ color: "var(--color-text-secondary)" }}
          >
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 14 }}
            >
              tips_and_updates
            </span>
            <span>{display.hint}</span>
          </div>
        )}
      </div>
    </section>
  );
}

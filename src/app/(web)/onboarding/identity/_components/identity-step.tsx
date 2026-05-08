"use client";

/**
 * IdentityStep — 5/7 PR1.1 클라이언트 wrapper
 *
 * 이유(왜):
 *   IdentityVerifyButton 은 다른 곳 (settings 등) 에서도 사용 — props 시그니처 변경 X.
 *   onboarding 흐름 전용 안내 박스 + 인증 후 다음 단계 라우팅을 분리하여 관심사 분리.
 *
 * 어떻게:
 *   - 인증 완료 콜백 → returnTo 있으면 그쪽으로 / 없으면 /onboarding/environment
 *   - 5/8 PR3: returnTo prop 추가 — 가드에서 보낸 원래 페이지 보존 흐름.
 */

import { useRouter } from "next/navigation";
import { IdentityVerifyButton } from "@/components/identity/identity-verify-button";

interface IdentityStepProps {
  // 5/8 PR3 — 가드에서 redirect 시 보낸 원래 페이지. 인증 완료 후 그쪽으로 복귀.
  //   server page 에서 startsWith("/") 검증 완료 → 안전한 내부 경로만 들어옴.
  //   null 이면 기존 onboarding 흐름 (/onboarding/environment).
  returnTo?: string | null;
}

export function IdentityStep({ returnTo = null }: IdentityStepProps = {}) {
  const router = useRouter();

  return (
    <div
      style={{
        background: "var(--bg-elev)",
        border: "1px solid var(--border)",
        borderRadius: 8,
        padding: 24,
        textAlign: "center",
      }}
    >
      {/* 안내 — 어떤 정보를 받는지 사용자 인지 */}
      <ul
        style={{
          listStyle: "none",
          padding: 0,
          margin: "0 0 20px",
          fontSize: 13,
          color: "var(--ink-mute)",
          lineHeight: 1.7,
          textAlign: "left",
          display: "inline-block",
        }}
      >
        <li>· 실명 (한글)</li>
        <li>· 휴대폰 번호</li>
        <li>· 생년월일 (선택)</li>
      </ul>

      <div>
        <IdentityVerifyButton
          initialVerified={false}
          onVerified={() => {
            // 5/8 PR3 — returnTo 가 있으면 가드에서 보낸 원래 페이지로 복귀,
            //   없으면 기존 onboarding 흐름 (/onboarding/environment).
            // server page 에서 이미 startsWith("/") 검증 완료 → 안전한 내부 경로만 들어옴.
            router.push(returnTo ?? "/onboarding/environment");
            router.refresh();
          }}
        />
      </div>

      <p
        style={{
          marginTop: 18,
          fontSize: 11,
          color: "var(--ink-mute)",
          lineHeight: 1.5,
        }}
      >
        Portone PASS 통합 전 임시 mock 단계입니다.
        <br />
        실제 출시 시 SMS / PASS 인증으로 자동 교체됩니다.
      </p>
    </div>
  );
}

"use client";

/**
 * IdentityStep — 5/7 PR1.1 클라이언트 wrapper
 *
 * 이유(왜):
 *   IdentityVerifyButton 은 다른 곳 (settings 등) 에서도 사용 — props 시그니처 변경 X.
 *   onboarding 흐름 전용 안내 박스 + 인증 후 다음 단계 라우팅을 분리하여 관심사 분리.
 *
 * 어떻게:
 *   - 인증 완료 콜백 → router.push("/") + refresh
 *   - PR2 완성 후 router.push("/onboarding/environment") 로 변경 예정
 */

import { useRouter } from "next/navigation";
import { IdentityVerifyButton } from "@/components/identity/identity-verify-button";

export function IdentityStep() {
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
            // 5/7 PR2.c — 인증 완료 → 다음 단계 (활동 환경) 자동 진입
            router.push("/onboarding/environment");
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

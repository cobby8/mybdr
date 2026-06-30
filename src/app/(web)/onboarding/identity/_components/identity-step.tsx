"use client";

/**
 * IdentityStep — Phase 7C-4 + PUB-1-7 시각 갭 교체
 *
 * 이유(왜):
 *   Phase 7C-4 박제: IdentityVerifyButton 단순 래퍼.
 *   BDR-current 시안(OnboardingIdentity.jsx): PASS / 휴대폰 / NICE 메서드 카드 시각.
 *   갭: 메서드 카드 UI 없음. Portone 미통합(mock 단계) 이므로 메서드 선택은 UI-only —
 *     실제 인증은 기존 IdentityVerifyButton 유지 (데이터/로직 0 변경).
 *
 * 어떻게:
 *   - selectedMethod state: 카드 선택 시각 제어 (cosmetic).
 *   - IdentityVerifyButton: 동일 props (initialVerified/onVerified) 그대로 보존.
 *   - SafetyNote: 시안 SafetyNote 1:1 박제.
 *   - returnTo prop: 그대로 보존 (PR3 open-redirect 방어).
 *
 * lock: IdentityVerifyButton props 시그니처 0 변경. API/라우팅/데이터 0 변경.
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { IdentityVerifyButton } from "@/components/identity/identity-verify-button";

interface IdentityStepProps {
  // 5/8 PR3 — 가드에서 redirect 시 보낸 원래 페이지. 인증 완료 후 그쪽으로 복귀.
  returnTo?: string | null;
}

// 시안 OnboardingIdentity.jsx 메서드 카드 3종 정의
const METHODS = [
  {
    id: "pass",
    tag: "PASS",
    tagBg: "var(--cafe-blue)",
    title: "PASS 본인확인",
    desc: "이동통신 3사 인증 앱 — 가장 빠릅니다 (~10초)",
    badge: "추천",
  },
  {
    id: "phone",
    tag: "📱",
    tagBg: "var(--ink-soft)",
    title: "휴대폰 인증",
    desc: "SMS 6자리 인증번호 입력",
    badge: null,
  },
  {
    id: "nice",
    tag: "NICE",
    tagBg: "var(--ink-dim)",
    title: "NICE 본인확인",
    desc: "공동·금융 인증서 / 신용카드 — 외국인·보호자 가능",
    badge: null,
  },
] as const;

export function IdentityStep({ returnTo = null }: IdentityStepProps = {}) {
  const router = useRouter();
  // 메서드 카드 선택 상태 (UI-only — 실제 인증은 모두 IdentityVerifyButton)
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);

  return (
    <div>
      {/* 메서드 카드 목록 (시안 OnboardingIdentity.jsx 박제) */}
      <div style={{ display: "grid", gap: 8, marginBottom: 16 }}>
        {METHODS.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => setSelectedMethod(m.id)}
            className={`ob2-method-card${selectedMethod === m.id ? " ob2-method-card--active" : ""}`}
          >
            {/* 아이콘 박스 */}
            <span
              className="ob2-method-card__icon"
              style={{ background: m.tagBg }}
              aria-hidden="true"
            >
              {m.tag}
            </span>
            {/* 텍스트 */}
            <span className="ob2-method-card__body">
              <span className="ob2-method-card__title">
                {m.title}
                {m.badge && (
                  <span
                    className="badge"
                    style={{ background: "var(--accent)", color: "#fff", borderColor: "transparent" }}
                  >
                    {m.badge}
                  </span>
                )}
              </span>
              <span className="ob2-method-card__desc">{m.desc}</span>
            </span>
            {/* 화살표 */}
            <span className="ob2-method-card__chevron" aria-hidden="true">
              chevron_right
            </span>
          </button>
        ))}
      </div>

      {/* 실제 인증 영역 — IdentityVerifyButton (Portone mock 단계 유지) */}
      <div
        style={{
          background: "var(--bg-elev)",
          border: "1px solid var(--border)",
          borderRadius: 8,
          padding: 24,
          textAlign: "center",
        }}
      >
        {/* 인증 정보 안내 */}
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
          {/* 5/8 — 모든 항목 필수 (* 표시 통일) */}
          <li>
            · 실명 (한글) <span style={{ color: "var(--err)" }}>*</span>
          </li>
          <li>
            · 휴대폰 번호 <span style={{ color: "var(--err)" }}>*</span>
          </li>
          <li>
            · 생년월일 <span style={{ color: "var(--err)" }}>*</span>
          </li>
        </ul>

        <div>
          <IdentityVerifyButton
            initialVerified={false}
            onVerified={() => {
              // 5/8 PR3 — returnTo 가 있으면 가드에서 보낸 원래 페이지로 복귀,
              //   없으면 기존 onboarding 흐름 (/onboarding/environment).
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

      {/* SafetyNote (시안 SafetyNote 박제) */}
      <div className="ob2-safety-note">
        ⓘ <b>왜 인증하나요?</b>
        <br />
        · 미성년자 보호 (18세 미만 별도 안내) · 부정 가입 방지
        <br />
        · 매칭 신뢰도 향상 — 인증된 회원만 게스트 모집·심판 신청 가능
      </div>
    </div>
  );
}

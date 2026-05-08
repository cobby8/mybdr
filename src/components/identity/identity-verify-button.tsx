"use client";

/* ============================================================
 * IdentityVerifyButton (5/7 PortOne V2 실 통합 + 5/8 mock 폴백)
 *
 * 왜:
 *  - 기존 mock 모달 (Phase 12-5) 을 PortOne V2 본인인증 SDK 호출로 교체.
 *  - PASS / 카카오 / SMS 등 PG 채널을 통해 실명·생년월일·휴대폰을 인증.
 *  - 인증 결과의 identityVerificationId 만 서버에 전송 →
 *    서버에서 PortOne V2 API 로 재조회하여 위변조 차단 (클라이언트 데이터 신뢰 X).
 *
 * 어떻게:
 *  - `@portone/browser-sdk/v2` 의 PortOne.requestIdentityVerification 호출.
 *  - 필요 환경변수:
 *    · NEXT_PUBLIC_PORTONE_STORE_ID (기존 결제와 공유)
 *    · NEXT_PUBLIC_PORTONE_IDENTITY_CHANNEL_KEY (본인인증 채널 — 콘솔 신규 발급 필요)
 *  - 결과 callback:
 *    · code 가 있으면 실패 (사용자 취소 / 채널 오류) — message 표시
 *    · code 없음 = 성공 → identityVerificationId 서버 전송
 *  - 서버 200 응답 시 onVerified 콜백 호출 + 인증완료 배지 전환
 *
 * 5/8 mock 폴백 분기 (사용자 결정 B 톤 다운):
 *  - isIdentityGateEnabled() = false (channel key 미설정) 일 때 빨간 에러 대신 MockIdentityModal 오픈
 *  - 환경변수 추가 시 자동으로 PortOne SDK 호출 모드 복귀 (코드 변경 0)
 *  - 버튼 라벨 분기: mock 모드 = "임시 정보 입력" / 활성 = "본인인증 시작"
 * ============================================================ */

import { useState } from "react";
import * as PortOne from "@portone/browser-sdk/v2";
import { isIdentityGateEnabled } from "@/lib/auth/identity-gate-flag";
import { MockIdentityModal } from "./mock-identity-modal";

interface VerifiedPayload {
  verified_name: string;
  verified_phone: string;
}

interface Props {
  initialVerified: boolean;
  onVerified: (data: VerifiedPayload) => void;
}

export function IdentityVerifyButton({ initialVerified, onVerified }: Props) {
  const [verified, setVerified] = useState(initialVerified);
  const [submitting, setSubmitting] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);
  // 5/8 mock 폴백 — channel key 미설정 시 모달 오픈
  const [mockModalOpen, setMockModalOpen] = useState(false);

  // 5/8 — channel key 환경변수 단일 신호로 PortOne 활성/mock 분기
  // build 시 inline 평가 — 런타임 hot swap 불가 (Next.js 15 NEXT_PUBLIC_*)
  const gateEnabled = isIdentityGateEnabled();

  if (verified) {
    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 4,
          fontSize: 12,
          color: "var(--ok)",
          fontWeight: 600,
        }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
          verified
        </span>
        인증완료
      </span>
    );
  }

  const handleClick = async () => {
    if (submitting) return;
    setErrorText(null);

    // 5/8 mock 폴백 — channel key 미설정 시 모달 오픈 (빨간 에러 톤 다운)
    if (!gateEnabled) {
      setMockModalOpen(true);
      return;
    }

    // 이하 PortOne 활성화 시 — 기존 코드 그대로 (변경 0)
    const storeId = process.env.NEXT_PUBLIC_PORTONE_STORE_ID;
    const channelKey = process.env.NEXT_PUBLIC_PORTONE_IDENTITY_CHANNEL_KEY;

    // 방어적 검증 — gateEnabled=true 이면 channelKey 도 존재 (헬퍼 정의상)
    // 단 storeId 누락 가능 (별도 환경변수) → 이 경우만 에러 표시
    if (!storeId || !channelKey) {
      setErrorText(
        "본인인증 설정이 완료되지 않았습니다. 운영자에게 문의해 주세요.",
      );
      return;
    }

    setSubmitting(true);
    try {
      // PortOne V2 — 본인인증 위젯 호출
      // identityVerificationId 는 우리 시스템 고유값 (재시도 시 동일 사용 X)
      const identityVerificationId = `iv_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
      const result = await PortOne.requestIdentityVerification({
        storeId,
        identityVerificationId,
        channelKey,
      });

      // 결과 분기 — code 가 있으면 실패 (사용자 취소 또는 채널 오류)
      if (result?.code) {
        setErrorText(result.message ?? "본인인증이 취소되었습니다.");
        setSubmitting(false);
        return;
      }

      // 성공 — identityVerificationId 만 서버에 전송 (서버에서 V2 API 재조회로 검증)
      const verifyId = result?.identityVerificationId ?? identityVerificationId;
      const res = await fetch("/api/web/identity/verify", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identityVerificationId: verifyId }),
      });

      if (!res.ok) {
        let msg = "인증 정보 저장에 실패했습니다.";
        try {
          const data = await res.json();
          if (data?.error && typeof data.error === "string") msg = data.error;
        } catch {
          // ignore
        }
        setErrorText(msg);
        setSubmitting(false);
        return;
      }

      const data = await res.json();
      onVerified({
        verified_name: data.verified_name ?? "",
        verified_phone: data.verified_phone ?? "",
      });
      setVerified(true);
    } catch (e) {
      console.error("[identity-verify]", e);
      setErrorText("본인인증 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setSubmitting(false);
    }
  };

  // 5/8 mock 모달에서 인증 통과 시 콜백 — 부모 onVerified 호출 + 인증 완료 배지 전환
  const handleMockVerified = (data: VerifiedPayload) => {
    setMockModalOpen(false);
    onVerified(data);
    setVerified(true);
  };

  return (
    <>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
        <button
          type="button"
          onClick={handleClick}
          disabled={submitting}
          className="btn"
          style={{
            padding: "10px 20px",
            fontSize: 14,
            fontWeight: 700,
            whiteSpace: "nowrap",
            background: "var(--cafe-blue)",
            color: "var(--bg)",
            border: "1px solid var(--cafe-blue)",
            borderRadius: 4,
            cursor: submitting ? "wait" : "pointer",
            opacity: submitting ? 0.7 : 1,
          }}
        >
          {/* 5/8 — 라벨 분기. mock 모드 = 임시 입력 (출시 전 임시 톤) / PortOne 활성 = 본인인증 시작 */}
          {submitting ? "인증 진행 중..." : gateEnabled ? "본인인증 시작" : "임시 정보 입력"}
        </button>
        {errorText && (
          <p
            role="alert"
            style={{
              fontSize: 12,
              color: "var(--accent)",
              textAlign: "center",
              margin: 0,
            }}
          >
            {errorText}
          </p>
        )}
      </div>

      {/* 5/8 — mock 모달은 gateEnabled=false 일 때만 마운트 가능 */}
      <MockIdentityModal
        open={mockModalOpen}
        onClose={() => setMockModalOpen(false)}
        onVerified={handleMockVerified}
      />
    </>
  );
}

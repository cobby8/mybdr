"use client";

/* ============================================================
 * AccountSectionV2 — Settings "계정 · 보안" 섹션
 *
 * 왜 (2026-05-01 재구성):
 *  - 시안 v2.3 Settings 7섹션 재구성 (사용자 결정 B3-fallback):
 *    profile 섹션 삭제 + IdentityVerifyButton(본인인증) 진입점 → account 섹션으로 이전.
 *    PortOne 본인인증 페이지 신설 전까지 임시 위치. 향후 별도 페이지 분리 예정.
 *  - 시안 Settings.jsx 의 6 행(이메일/비밀번호/2단계/연결된계정/로그인 기기/활동 로그) 박제.
 *
 * 어떻게:
 *  - 부모(page.tsx)에서 한 번 받은 user 데이터를 prop 으로 내려받음.
 *  - 본인인증: user.name_verified 기반으로 IdentityVerifyButton 마운트.
 *    인증 성공 시 onSaved 콜백으로 부모 user state 갱신 (헤더/공유 데이터 동기화).
 *  - 동작 가능: 이메일/비밀번호/연결된 계정 → 기존 페이지 라우팅
 *      · 비밀번호 변경 → /reset-password (이미 구현됨)
 *      · 연결된 계정 → /profile/edit (소셜 연결 관리 자리)
 *  - 미구현: 2단계 인증 / 로그인 기기 / 활동 로그 → disabled "준비 중"
 * ============================================================ */

import Link from "next/link";
import { useRouter } from "next/navigation";
import { SettingsHeader, SettingsRow } from "./settings-ui";
// 5/7: IdentityVerifyButton 직접 사용 제거 — onboarding/identity 페이지 단일 진입점으로 통합

// 부모(page.tsx)에서 내려받는 user 정보. ProfileFormUser 와 동일 구조 일부.
interface AccountUser {
  email?: string | null;
  name?: string | null;
  // 본인인증 완료 여부 — IdentityVerifyButton 의 initialVerified 로 전달
  name_verified?: boolean | null;
}

interface Props {
  user: AccountUser | null;
  // 5/7 PR1.3: onIdentityVerified prop 제거 — settings 는 인증 직접 처리 X.
  //   /onboarding/identity 페이지 단일 진입점으로 통합. 인증 후 페이지 자체 redirect 로 user state 갱신.
}

export function AccountSectionV2({ user }: Props) {
  const router = useRouter();

  // 비밀번호 변경 — 기존 reset-password 플로우로 이동
  const onChangePassword = () => router.push("/reset-password");

  // 이메일 변경 / 연결된 계정 — /profile/edit 페이지가 아직 단일 폼이므로
  // 동일 페이지로 이동 (기존 페이지 보존 원칙)
  const onChangeEmail = () => router.push("/profile/edit");
  const onManageLinked = () => router.push("/profile/edit");

  return (
    <>
      <SettingsHeader
        title="계정 · 보안"
        desc="로그인·인증·연결된 계정 관리"
      />

      {/* 이메일 — 실제 API 응답 사용. null 이면 "이메일 미등록" 안내 */}
      <SettingsRow
        label="이메일"
        value={user?.email ?? "이메일 미등록"}
        action="변경"
        onAction={onChangeEmail}
      />

      {/* 비밀번호 — 마지막 변경일 DB 미지원: "변경 이력 준비 중" */}
      <SettingsRow
        label="비밀번호"
        value="변경 이력 준비 중"
        action="변경"
        onAction={onChangePassword}
      />

      {/* 본인인증 — 5/7 PR1.3: IdentityVerifyButton 모달 직접 사용 제거.
          단일 진입점 = /onboarding/identity 페이지 (PR1.1). settings 는 상태 표시 + 진입 링크만.
          이유: (1) 본인인증 modal 이 두 곳에서 마운트되면 흐름 분기 → 회귀 위험.
                (2) onboarding 시스템 도입 후 모든 사용자 동일 흐름 보장.
                (3) 인증 완료 후 재인증/변경 시나리오 X (한 번만 인증 가능). */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "14px 0",
          borderBottom: "1px solid var(--border)",
          gap: 12,
        }}
      >
        <div>
          <div style={{ fontWeight: 600, fontSize: 14 }}>본인인증</div>
          <div
            style={{ fontSize: 12, color: "var(--ink-mute)", marginTop: 2 }}
          >
            {user?.name_verified
              ? `실명 인증 완료${user?.name ? ` · ${user.name}` : ""}`
              : "대회 출전 · 팀 활동에는 본인인증이 필요합니다"}
          </div>
        </div>
        {user?.name_verified ? (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              fontSize: 12,
              color: "var(--ok)",
              fontWeight: 600,
              flexShrink: 0,
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
              verified
            </span>
            인증완료
          </span>
        ) : (
          <Link
            href="/onboarding/identity"
            className="btn"
            style={{
              padding: "6px 12px",
              fontSize: 12,
              fontWeight: 600,
              whiteSpace: "nowrap",
              background: "var(--cafe-blue)",
              color: "var(--bg)",
              border: "1px solid var(--cafe-blue)",
              borderRadius: 4,
              flexShrink: 0,
              textDecoration: "none",
            }}
          >
            본인인증 →
          </Link>
        )}
      </div>

      {/* 2단계 인증 — 추후 구현 */}
      <SettingsRow
        label="2단계 인증"
        value="준비 중"
        action="켜기"
        disabled
      />

      {/* 연결된 계정 — 카카오/구글 연동 정보 DB 조회 미구현 → 자리만 + 관리 버튼은 edit 라우트 */}
      <SettingsRow
        label="연결된 계정"
        value="준비 중"
        action="관리"
        onAction={onManageLinked}
      />

      {/* 로그인 기기 — sessions 테이블 필요. 추후 구현 */}
      <SettingsRow
        label="로그인 기기"
        value="준비 중"
        action="관리"
        disabled
      />
    </>
  );
}

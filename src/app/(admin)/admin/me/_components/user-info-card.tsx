/**
 * UserInfoCard — admin 마이페이지 로그인 정보 카드.
 *
 * 2026-05-11 — Phase 1 MVP (사용자 결재 §4 — 권한 매트릭스 + 로그인 정보만).
 * 2026-05-11 — Phase 3 (비번 변경 진입점 추가).
 *
 * 표시 정보:
 *   - 아바타 (이니셜 또는 profile_image_url)
 *   - 닉네임 (큰 글자)
 *   - 이메일
 *   - 가입일 (한글 포맷)
 *   - UID (작게, 디버그용)
 *   - 우측 상단: 비밀번호 변경 진입점 (Phase 3) — `/profile/settings?section=account`
 *
 * 비번 변경 destination 결정 사유:
 *   - `/reset-password` 는 token 쿼리 필수 (이메일 링크 경로) — 직접 진입 불가.
 *   - `/profile/settings?section=account` 의 "비밀번호" 행 → `/reset-password` 로 라우팅 (account-section-v2.tsx L45).
 *   - settings 페이지가 이메일·비번·본인인증 통합 진입점 → 자연스러운 흐름.
 *
 * 디자인 토큰만 사용 — var(--*) / Material Symbols Outlined.
 * server component (interactivity 0 — Link 만 사용).
 */

import Link from "next/link";

export interface UserInfoCardProps {
  user: {
    id: bigint;
    nickname: string | null;
    email: string;
    createdAt: Date;
    profileImageUrl: string | null;
  };
}

// 날짜 한글 포맷 — "2024년 3월 15일"
function formatDate(d: Date): string {
  const year = d.getFullYear();
  const month = d.getMonth() + 1;
  const day = d.getDate();
  return `${year}년 ${month}월 ${day}일`;
}

// 이니셜 추출 (닉네임 / 이메일)
function getInitial(nickname: string | null, email: string): string {
  const source = nickname?.trim() || email;
  return (source[0] ?? "?").toUpperCase();
}

export function UserInfoCard({ user }: UserInfoCardProps) {
  const displayName = user.nickname?.trim() || user.email.split("@")[0];
  const initial = getInitial(user.nickname, user.email);

  return (
    <section
      className="rounded-lg border p-6"
      style={{
        borderColor: "var(--color-border)",
        backgroundColor: "var(--color-surface)",
      }}
    >
      <div className="flex items-start gap-4">
        {/* 아바타 — profile_image_url 있으면 이미지, 없으면 이니셜 원형 */}
        {user.profileImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={user.profileImageUrl}
            alt={`${displayName} 프로필`}
            className="h-16 w-16 object-cover"
            style={{ borderRadius: "50%" }}
          />
        ) : (
          <div
            className="flex h-16 w-16 items-center justify-center text-2xl font-bold"
            style={{
              borderRadius: "50%", // W=H 원형 — 9999px 회피
              backgroundColor: "var(--color-primary)",
              color: "white",
            }}
          >
            {initial}
          </div>
        )}

        {/* 정보 영역 */}
        <div className="flex-1 min-w-0">
          {/* 상단 행 — 닉네임 + 비번 변경 진입점 (Phase 3) */}
          {/* 이유: 카드 우측 상단 = 가장 자연스러운 보안 액션 위치. 닉네임 옆 정렬로 시각 균형. */}
          <div className="flex items-start justify-between gap-2">
            {/* 닉네임 큰 글자 */}
            <div
              className="text-xl font-bold truncate"
              style={{ color: "var(--color-text-primary)" }}
            >
              {displayName}
            </div>

            {/* 비번 변경 진입점 — Material Symbols Outlined `key` 아이콘 + 라벨 */}
            {/* destination = /profile/settings?section=account (web 통합 진입점, account-section-v2 박제) */}
            <Link
              href="/profile/settings?section=account"
              className="flex items-center gap-1 px-2 py-1 text-xs whitespace-nowrap hover:underline shrink-0"
              style={{
                color: "var(--color-text-secondary)",
                borderRadius: "4px",
              }}
              title="비밀번호 변경"
              aria-label="비밀번호 변경"
            >
              <span
                className="material-symbols-outlined"
                style={{ fontSize: 16 }}
              >
                key
              </span>
              <span>비밀번호 변경</span>
            </Link>
          </div>

          {/* 이메일 */}
          <div
            className="mt-1 flex items-center gap-1 text-sm"
            style={{ color: "var(--color-text-secondary)" }}
          >
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 16 }}
            >
              mail
            </span>
            <span className="truncate">{user.email}</span>
          </div>

          {/* 가입일 */}
          <div
            className="mt-1 flex items-center gap-1 text-sm"
            style={{ color: "var(--color-text-secondary)" }}
          >
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 16 }}
            >
              event
            </span>
            <span>가입일: {formatDate(user.createdAt)}</span>
          </div>

          {/* UID — 작게 (디버그용) */}
          {/* 2026-05-11 Phase 2 Minor 1 fix (reviewer 권고) — --color-text-tertiary 미정의 토큰 →
              --color-text-secondary 직접 사용 통일. 토큰 폭증 방지. */}
          <div
            className="mt-2 text-xs font-mono"
            style={{ color: "var(--color-text-secondary)" }}
          >
            UID: {user.id.toString()}
          </div>
        </div>
      </div>
    </section>
  );
}

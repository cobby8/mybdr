/**
 * 2026-05-09 PR3 — 사전 라인업 ttp 1건 카드 (presentational).
 *
 * 왜 분리하는가:
 *   lineup-confirm-form.tsx 는 state/POST 로직이 무거워서 row 별 표시 책임을 분리.
 *   row 1건 = (출전 ☑ 체크박스 + 주전 ☆ 체크박스 + #번호 + 이름).
 *   상태 토글은 부모 (form) 에서 주입한 콜백 호출만 담당.
 *
 * 디자인 룰 (CLAUDE.md 13 룰):
 *   - var(--color-*) 토큰만 (하드코딩 색상 ❌)
 *   - Material Symbols Outlined (lucide-react ❌)
 *   - 44px 터치 영역 (체크박스 라벨 단위)
 *   - pill 9999px ❌ — 사각 칩 사용
 *
 * 주의:
 *   - 부모(form) 가 Set<string> 으로 활성/주전 추적 → ttp.id (string) 를 키로 검사
 *   - 출전 미체크 row 는 주전 ☆ 비활성화 (회색 처리)
 *   - 주전 5명 도달 + 본인 미주전 인 경우 = 주전 ☆ 비활성 (UI 가드 — POST 에도 5명 강제)
 */

"use client";

// ttp 1건 — page.tsx 에서 GET API 응답 직렬화 후 prop 으로 전달
// snake_case 응답 키 그대로 사용 (apiSuccess 자동 변환 룰 준수)
export type TtpItem = {
  id: string; // bigint → string (route.ts serialize)
  jersey_number: number | null;
  role: string | null; // "player" | "captain" | "coach" | "manager"
  position: string | null;
  player_name: string | null;
  user: {
    id: string;
    name: string | null;
    nickname: string | null;
  } | null;
};

type Props = {
  ttp: TtpItem;
  isActive: boolean; // 출전 체크 여부
  isStarter: boolean; // 주전 체크 여부
  starterDisabled: boolean; // 주전 5명 도달 + 본인 미주전 시 true (추가 차단)
  onToggleActive: () => void;
  onToggleStarter: () => void;
  disabled?: boolean; // 매치 시작됨 등 폼 전체 disabled
};

export function TtpRow({
  ttp,
  isActive,
  isStarter,
  starterDisabled,
  onToggleActive,
  onToggleStarter,
  disabled = false,
}: Props) {
  // 표시명 — nickname > user.name > player_name 우선순위 (P0 헬퍼와 동일 정책)
  const displayName =
    ttp.user?.nickname || ttp.user?.name || ttp.player_name || "(이름 없음)";

  // 주전 토글 가능 = 출전 체크된 상태 + (이미 주전이거나 5명 미달)
  const canToggleStarter = !disabled && isActive && !starterDisabled;

  return (
    <div
      // 카드 — 출전 활성 시 강조 (BDR Red 토큰 사용)
      className="flex items-center gap-3 rounded-md border px-3 py-2.5"
      style={{
        // 출전 시 BDR Red 살짝 / 미출전 = 기본 카드
        background: isActive
          ? "var(--color-accent-light)"
          : "var(--color-card)",
        borderColor: isActive ? "var(--color-accent)" : "var(--color-border)",
        opacity: disabled ? 0.6 : 1,
      }}
    >
      {/* 출전 체크박스 — 44px 터치 영역 보장 (label 전체 클릭) */}
      <label
        className="flex min-h-11 min-w-11 cursor-pointer items-center justify-center"
        style={{ cursor: disabled ? "not-allowed" : "pointer" }}
      >
        <input
          type="checkbox"
          checked={isActive}
          onChange={onToggleActive}
          disabled={disabled}
          // 기본 브라우저 체크박스 — 토큰 색은 accent-color 로 통일
          style={{ accentColor: "var(--color-accent)", width: 20, height: 20 }}
          aria-label={`${displayName} 출전`}
        />
      </label>

      {/* 주전 토글 — Material Symbols star (출전 안 했으면 회색 비활성) */}
      <button
        type="button"
        onClick={onToggleStarter}
        disabled={!canToggleStarter}
        className="flex min-h-11 min-w-11 items-center justify-center rounded-md"
        style={{
          // 주전: 채워진 별 / 미주전: 빈 별 / 비활성: 회색
          color: isStarter
            ? "var(--color-accent)"
            : canToggleStarter
              ? "var(--color-text-secondary)"
              : "var(--color-text-muted)",
          cursor: canToggleStarter ? "pointer" : "not-allowed",
        }}
        aria-label={`${displayName} 주전 토글`}
        aria-pressed={isStarter}
      >
        <span
          className="material-symbols-outlined"
          style={{
            // 주전이면 fill, 아니면 outline
            fontVariationSettings: isStarter
              ? "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24"
              : "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24",
            fontSize: 22,
          }}
        >
          star
        </span>
      </button>

      {/* 등번호 — # 표기 / 숫자 가운데 정렬 */}
      <div
        className="flex h-9 w-12 items-center justify-center rounded-md text-sm font-semibold tabular-nums"
        style={{
          background: "var(--color-surface)",
          color: "var(--color-text-primary)",
          border: "1px solid var(--color-border)",
        }}
      >
        {ttp.jersey_number !== null ? `#${ttp.jersey_number}` : "—"}
      </div>

      {/* 이름 + role 메타 (position 은 별도 컬럼으로 분리) */}
      <div className="flex min-w-0 flex-1 flex-col">
        <span
          className="truncate text-sm font-medium"
          style={{ color: "var(--color-text-primary)" }}
        >
          {displayName}
        </span>
        <span
          className="truncate text-xs"
          style={{ color: "var(--color-text-muted)" }}
        >
          {ttp.role || "선수"}
        </span>
      </div>

      {/* 포지션 컬럼 — 별도 분리 (헤더 "포지션" 과 정렬 매칭, w-16 center). null 시 — */}
      <div
        className="flex h-9 w-16 items-center justify-center text-sm tabular-nums"
        style={{ color: "var(--color-text-secondary)" }}
      >
        {ttp.position || "—"}
      </div>
    </div>
  );
}

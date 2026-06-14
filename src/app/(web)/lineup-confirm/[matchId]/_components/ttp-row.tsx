/**
 * 2026-06-14 PR-LINEUP-V2 [3] — 사전 라인업 ttp 1건 행 (presentational, 전면 재작성).
 *
 * 왜 재작성하는가 (앱 bdr_stat_v3 roster_confirm 정합):
 *   - 기존: 출전 ☑ 체크박스 + 주전 ☆ 별 + 포지션 컬럼 (2단계 입력).
 *   - 신규: 행 전체가 단일 탭 순환 버튼 (선택→선발→벤치→선택). C 버튼은 주장 단일 토글.
 *   - 앱 roster_confirm 행에는 포지션(PG/SG)이 없음 → 포지션 컬럼 완전 제거.
 *
 * 행 구성: [번호] [이름 + 닉네임 + 주장태그] [C 버튼] [상태칩(선발/벤치/선택)]
 *   - 행 클릭 = cycleRole (부모 콜백) → 역할 순환.
 *   - C 버튼 = toggleCaptain (e.stopPropagation 으로 행 순환과 분리).
 *
 * 디자인 룰 (CLAUDE.md 13 룰):
 *   - var(--*) 토큰만 (하드코딩 색상 ❌)
 *   - Material Symbols Outlined (lucide-react ❌)
 *   - pill 9999px ❌ — 사각 칩 사용. 정사각 원형만 50% 허용(여기선 미사용)
 *   - 720px 분기 / 44px 터치는 globals.css .lc-* 에서 처리
 *
 * 주의:
 *   - 부모(form)가 roles 맵으로 역할 추적 → role prop ('out'|'starter'|'bench') 으로 표시 분기.
 *   - 출전(선발∪벤치)이 아닌 선수는 C 버튼 비활성 (주장 ⊆ 출전).
 */

"use client";

// ttp 1건 — page.tsx 에서 server prisma 직렬화 후 prop 으로 전달 (snake_case 키)
export type TtpItem = {
  id: string; // bigint → string
  jersey_number: number | null;
  role: string | null; // "player" | "captain" | "coach"
  position: string | null; // ★UI 미사용(앱 정합 포지션 제거) — 타입은 page 직렬화 호환 위해 유지
  player_name: string | null;
  user: {
    id: string;
    name: string | null;
    nickname: string | null;
  } | null;
};

// 역할 3상태 — 앱 roster_confirm _Role 과 정합
export type LcRole = "out" | "starter" | "bench";

type Props = {
  ttp: TtpItem;
  role: LcRole; // 현재 역할 (out/starter/bench)
  isCaptain: boolean; // 주장 여부 (행 1건)
  onCycle: () => void; // 행 탭 = 역할 순환
  onToggleCaptain: () => void; // C 버튼 = 주장 단일 토글
  locked?: boolean; // 매치 잠금(시작 후) — 전 입력 비활성
};

export function TtpRow({
  ttp,
  role,
  isCaptain,
  onCycle,
  onToggleCaptain,
  locked = false,
}: Props) {
  // 표시명 — nickname > user.name > player_name 우선순위 (기존 정책 유지)
  const displayName =
    ttp.user?.nickname || ttp.user?.name || ttp.player_name || "(이름 없음)";
  // 닉네임은 본명과 다를 때만 별도 표기 (시안 nick 라인)
  const nick =
    ttp.user?.nickname && ttp.user?.nickname !== displayName
      ? ttp.user.nickname
      : null;

  // 상태칩 — 역할별 라벨/아이콘/모디파이어 (시안 toggle 칩 정합)
  const toggle =
    role === "starter"
      ? { mod: "starter", ico: "check", lbl: "선발" }
      : role === "bench"
        ? { mod: "bench", ico: "check", lbl: "벤치" }
        : { mod: "out", ico: "add", lbl: "선택" };

  // 행 클래스 — 역할/잠금에 따라 강조 (CSS .lc-row.is-starter/.is-bench/.is-locked)
  const rowCls =
    "lc-row" +
    (role === "starter"
      ? " is-starter"
      : role === "bench"
        ? " is-bench"
        : "") +
    (locked ? " is-locked" : "");

  // 주장은 출전 선수(선발∪벤치)만 — out 상태면 C 비활성
  const capDisabled = locked || role === "out";

  return (
    <button
      type="button"
      className={rowCls}
      onClick={onCycle}
      disabled={locked}
    >
      {/* 등번호 — null 시 "미정" (작은 글씨). 포지션 컬럼은 제거됨 */}
      <span className={"lc-row__num" + (ttp.jersey_number == null ? " is-none" : "")}>
        {ttp.jersey_number != null ? ttp.jersey_number : "미정"}
      </span>

      {/* 이름 + 닉네임 + 주장태그 */}
      <span className="lc-row__name">
        <span className="lc-row__nm">{displayName}</span>
        {nick && <span className="lc-row__nick">{nick}</span>}
        {isCaptain && <span className="lc-captag">주장</span>}
      </span>

      {/* C 버튼 — 주장 단일 토글. e.stopPropagation 으로 행 순환과 분리 */}
      <span
        className={"lc-capbtn" + (isCaptain ? " is-on" : "")}
        onClick={(e) => {
          e.stopPropagation(); // 행 클릭(cycleRole) 막고 주장만 토글
          if (capDisabled) return;
          onToggleCaptain();
        }}
        role="button"
        aria-label={`${displayName} 주장 지정`}
        aria-pressed={isCaptain}
        aria-disabled={capDisabled}
      >
        C
      </span>

      {/* 상태칩 — 선발/벤치/선택 (display 전용, 클릭은 행 전체가 받음) */}
      <span className={"lc-toggle lc-toggle--" + toggle.mod}>
        <span className="ico material-symbols-outlined">{toggle.ico}</span>
        {toggle.lbl}
      </span>
    </button>
  );
}

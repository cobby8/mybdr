/**
 * 2026-05-09 PR3 — 사전 라인업 입력 폼 (client component).
 *
 * 왜 client 인가:
 *   - 출전/주전 체크 토글 = 즉각적인 UI 반응 필요 → server action 보다 client state 가 단순
 *   - POST 후 응답으로 lineup 이 갱신되어야 → 클라이언트 fetch + state 업데이트
 *   - 단일 토글 버튼 라벨이 현재 상태에 따라 자동 변경 → reactive
 *
 * 주요 동작 (사용자 결정 2건 반영):
 *   1. 단일 토글 버튼 — 전원 active 면 "전체 출전 해제" / 그 외 "전체 출전 선택" (라벨 자동)
 *      해제 시 → activeTtpIds 비우기 + starters 비우기 (주전도 함께 제거)
 *      선택 시 → role=player|captain ttp 모두 active (starters 는 유지)
 *   2. 상대팀 영역 미노출 — away 데이터를 받아도 UI 표시 X
 *
 * API 응답 키 정책 (errors.md 2026-04-17 재발 5회 회피):
 *   - apiSuccess() 자동 snake_case 변환 → 프론트도 snake_case 접근자 사용
 *   - bigint id 는 string (route.ts .toString())
 *   - 신규 필드 추가 시 curl raw 응답으로 1회 검증 권장
 *
 * 디자인 룰 (CLAUDE.md 13 룰):
 *   - var(--color-*) 토큰만
 *   - Material Symbols Outlined
 *   - 720px 분기 / 44px 터치 / pill 9999px ❌
 *   - app-nav__icon-btn 패턴은 본 페이지 적용 X (AppNav 외부)
 */

"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { TtpRow, type TtpItem } from "./ttp-row";

// ===== 타입 (page.tsx server fetch 결과를 prop 으로 받음) =====
// route.ts 의 GET 응답 → apiSuccess() 자동 snake_case 변환 후 키 (검증 완료)

export type LineupTeam = {
  tournament_team_id: string;
  team_id: string;
  name: string;
  players: TtpItem[];
  lineup: {
    id: string;
    match_id: string;
    team_side: string;
    starters: string[]; // ttpId 배열
    substitutes: string[];
    confirmed_by_id: string;
    confirmed_at: string;
    updated_at: string;
  } | null;
};

export type LineupMatchInfo = {
  id: string;
  scheduled_at: string | null;
  status: string;
};

type Props = {
  tournamentId: string;
  matchId: string;
  match: LineupMatchInfo;
  homeTeam: LineupTeam;
  // 본인 팀 측 — captain/manager 권한 시 home/away 중 1개
  // admin (양쪽 편집) 도 home 으로 통일하여 단순화 (사용자 결정: 상대팀 미노출)
  // → admin 도 본인이 home/away 모두 가능하지만 UI 는 home 만 노출
  mySide: "home" | "away";
};

export function LineupConfirmForm({
  tournamentId,
  matchId,
  match,
  homeTeam,
  mySide,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // 매치 시작 후 = 입력 차단 (서버 가드와 동일 표현)
  const isLocked = match.status !== "scheduled" && match.status !== "ready";

  // ===== 초기 state — 기존 lineup 있으면 채움, 없으면 빈 set =====
  // 출전 = starters + substitutes 합집합
  const [activeIds, setActiveIds] = useState<Set<string>>(() => {
    if (homeTeam.lineup) {
      return new Set([
        ...homeTeam.lineup.starters,
        ...homeTeam.lineup.substitutes,
      ]);
    }
    return new Set();
  });
  // 주전 5명
  const [starterIds, setStarterIds] = useState<Set<string>>(() => {
    if (homeTeam.lineup) {
      return new Set(homeTeam.lineup.starters);
    }
    return new Set();
  });

  // ===== 파생 state =====
  const players = homeTeam.players;

  // 출전 가능 후보 (role: player | captain) — 코치/매니저는 출전 X
  // 단일 토글 버튼이 "전원 active" 판정 시 이 후보 기준으로 비교
  const eligibleIds = useMemo(
    () =>
      players
        .filter((p) => p.role === "player" || p.role === "captain")
        .map((p) => p.id),
    [players],
  );

  // "전원 active" = eligible 모두 activeIds 안에 있음 (eligible 0건이면 false)
  const allEligibleActive = useMemo(() => {
    if (eligibleIds.length === 0) return false;
    return eligibleIds.every((id) => activeIds.has(id));
  }, [eligibleIds, activeIds]);

  // 주전 5명 도달 시 추가 차단 플래그
  const starterFull = starterIds.size >= 5;

  // 출전·주전 카운트 (UI 표시)
  const activeCount = activeIds.size;
  const starterCount = starterIds.size;

  // ===== 핸들러 =====

  // 출전 토글 — 주전이면 주전도 함께 해제 (도메인 룰: 주전 ⊆ 출전)
  function toggleActive(ttpId: string) {
    setActiveIds((prev) => {
      const next = new Set(prev);
      if (next.has(ttpId)) {
        next.delete(ttpId);
        // 출전 해제 시 주전도 함께 해제
        setStarterIds((prevStar) => {
          if (!prevStar.has(ttpId)) return prevStar;
          const nextStar = new Set(prevStar);
          nextStar.delete(ttpId);
          return nextStar;
        });
      } else {
        next.add(ttpId);
      }
      return next;
    });
    // 사용자 인터랙션 = 메시지 초기화
    setErrorMsg(null);
    setSuccessMsg(null);
  }

  // 주전 토글 — 출전 안 했으면 거부 (UI 가드 / TtpRow 에서도 disabled)
  // 5명 도달 시 추가 차단 (단 이미 주전인 row 의 해제는 가능)
  function toggleStarter(ttpId: string) {
    setStarterIds((prev) => {
      const next = new Set(prev);
      if (next.has(ttpId)) {
        next.delete(ttpId);
      } else {
        // 출전 미체크 = 거부 (방어적 — TtpRow disabled 와 이중)
        if (!activeIds.has(ttpId)) return prev;
        // 5명 초과 = 거부
        if (next.size >= 5) return prev;
        next.add(ttpId);
      }
      return next;
    });
    setErrorMsg(null);
    setSuccessMsg(null);
  }

  // 단일 토글 버튼 — 라벨/동작이 상태에 따라 자동 변경 (사용자 결정 1번)
  function handleAllToggle() {
    if (allEligibleActive) {
      // 전원 active → 해제 (출전+주전 모두 비우기)
      setActiveIds(new Set());
      setStarterIds(new Set());
    } else {
      // 일부 또는 전원 비active → eligible 모두 active (starters 는 유지)
      setActiveIds(new Set(eligibleIds));
      // starters 는 유지 — 단 active 안 든 건 제거 (도메인 룰)
      setStarterIds((prev) => {
        const eligibleSet = new Set(eligibleIds);
        const next = new Set<string>();
        for (const s of prev) {
          if (eligibleSet.has(s)) next.add(s);
        }
        return next;
      });
    }
    setErrorMsg(null);
    setSuccessMsg(null);
  }

  // 라인업 확정 — POST /api/web/tournaments/[id]/matches/[matchId]/lineup
  // body: { teamSide, starters, substitutes }
  // route.ts 가 ttp 무결성 + 5명 강제 + 중복 0 모두 검증 (UI 는 1차 가드)
  async function handleConfirm() {
    if (isLocked) return;

    // UI 가드 — 주전 5명 미달 시 차단
    if (starterIds.size !== 5) {
      setErrorMsg("주전은 정확히 5명이어야 합니다.");
      return;
    }
    // 출전 안 한 ttp 가 starters 에 있는 경우 (방어 — UI 룰상 발생 X)
    for (const s of starterIds) {
      if (!activeIds.has(s)) {
        setErrorMsg("주전은 출전 선수 안에서 선택해주세요.");
        return;
      }
    }

    // substitutes = active - starters (active 중 starter 가 아닌 ttp)
    const substitutes = [...activeIds].filter((id) => !starterIds.has(id));

    setErrorMsg(null);
    setSuccessMsg(null);

    startTransition(async () => {
      try {
        const res = await fetch(
          `/api/web/tournaments/${tournamentId}/matches/${matchId}/lineup`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              teamSide: mySide,
              starters: [...starterIds],
              substitutes,
            }),
          },
        );
        const json = await res.json();
        if (!res.ok) {
          // route.ts apiError → { error, code } 구조
          setErrorMsg(json?.error ?? "라인업 저장에 실패했습니다.");
          return;
        }
        setSuccessMsg("라인업이 확정되었습니다.");
        // 서버 페이지 데이터 refetch — server component lineup 갱신
        router.refresh();
      } catch (e) {
        console.error("[lineup-confirm] POST failed", e);
        setErrorMsg("네트워크 오류가 발생했습니다.");
      }
    });
  }

  // 라인업 해제 — DELETE
  async function handleRelease() {
    if (isLocked) return;
    if (!homeTeam.lineup) return; // 해제할 게 없음

    if (!confirm("라인업을 해제하시겠습니까? (자동 채움으로 복귀)")) return;

    setErrorMsg(null);
    setSuccessMsg(null);

    startTransition(async () => {
      try {
        const res = await fetch(
          `/api/web/tournaments/${tournamentId}/matches/${matchId}/lineup`,
          {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ teamSide: mySide }),
          },
        );
        const json = await res.json();
        if (!res.ok) {
          setErrorMsg(json?.error ?? "라인업 해제에 실패했습니다.");
          return;
        }
        setSuccessMsg("라인업이 해제되었습니다.");
        setActiveIds(new Set());
        setStarterIds(new Set());
        router.refresh();
      } catch (e) {
        console.error("[lineup-confirm] DELETE failed", e);
        setErrorMsg("네트워크 오류가 발생했습니다.");
      }
    });
  }

  return (
    <div className="flex flex-col gap-4">
      {/* 매치 잠금 안내 — 시작 후 = 입력 불가 */}
      {isLocked && (
        <div
          className="rounded-md border p-3 text-sm"
          style={{
            background: "var(--color-surface)",
            borderColor: "var(--color-warning)",
            color: "var(--color-text-primary)",
          }}
        >
          이미 시작된 경기입니다. 라인업을 변경할 수 없습니다.
        </div>
      )}

      {/* 우리팀 카드 — 상대팀 영역은 사용자 결정으로 미노출 */}
      <section
        className="rounded-md border p-4"
        style={{
          background: "var(--color-card)",
          borderColor: "var(--color-border)",
        }}
      >
        <header className="mb-3 flex items-center justify-between">
          <h2
            className="text-base font-semibold"
            style={{ color: "var(--color-text-primary)" }}
          >
            우리팀 — {homeTeam.name}
          </h2>
          {/* 출전/주전 카운트 */}
          <span
            className="text-xs tabular-nums"
            style={{ color: "var(--color-text-secondary)" }}
          >
            출전 {activeCount}명 · 주전 {starterCount}/5
          </span>
        </header>

        {/* 단일 토글 버튼 (사용자 결정 1번) */}
        <div className="mb-3">
          <button
            type="button"
            onClick={handleAllToggle}
            disabled={isLocked || isPending || eligibleIds.length === 0}
            className="rounded-md border px-3 py-2 text-sm"
            style={{
              background: "var(--color-surface)",
              borderColor: "var(--color-border)",
              color: "var(--color-text-primary)",
              cursor: isLocked ? "not-allowed" : "pointer",
              minHeight: 44,
            }}
          >
            {allEligibleActive ? "전체 출전 해제" : "전체 출전 선택"}
          </button>
        </div>

        {/* ttp 목록 */}
        {players.length === 0 ? (
          <div
            className="rounded-md border p-4 text-center text-sm"
            style={{
              background: "var(--color-surface)",
              borderColor: "var(--color-border)",
              color: "var(--color-text-muted)",
            }}
          >
            등록된 선수가 없습니다.
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {/* 헤더 row — ttp-row 컬럼 너비와 정확히 매칭 (44/44/48/flex-1/64) */}
            {/* 가벼운 텍스트 헤더 (border/bg 0). pt-2 pb-1 만 살짝 spacing */}
            <div
              className="flex items-center gap-3 px-3 pb-1 pt-2 text-xs"
              style={{ color: "var(--color-text-muted)" }}
            >
              {/* 출전 — ttp-row label `min-w-11` (44px) 과 매칭 */}
              <div className="flex min-w-11 items-center justify-center">출전</div>
              {/* 주전 — ttp-row button `min-w-11` (44px) 과 매칭 */}
              <div className="flex min-w-11 items-center justify-center">주전</div>
              {/* 번호 — ttp-row 등번호 칩 `w-12` (48px) 과 매칭 */}
              <div className="flex w-12 items-center justify-center">번호</div>
              {/* 이름 — ttp-row 이름 영역 `flex-1` 과 매칭 */}
              <div className="flex min-w-0 flex-1 items-center">이름</div>
              {/* 포지션 — ttp-row 포지션 영역 `w-16` (64px) 과 매칭 */}
              <div className="flex w-16 items-center justify-center">포지션</div>
            </div>

            {players.map((p) => {
              const isActive = activeIds.has(p.id);
              const isStarter = starterIds.has(p.id);
              // 주전 5명 도달 + 본인 미주전 = 주전 추가 불가
              const starterDisabled = starterFull && !isStarter;
              return (
                <TtpRow
                  key={p.id}
                  ttp={p}
                  isActive={isActive}
                  isStarter={isStarter}
                  starterDisabled={starterDisabled}
                  onToggleActive={() => toggleActive(p.id)}
                  onToggleStarter={() => toggleStarter(p.id)}
                  disabled={isLocked || isPending}
                />
              );
            })}
          </div>
        )}
      </section>

      {/* 메시지 영역 — 에러/성공 */}
      {errorMsg && (
        <div
          className="rounded-md border p-3 text-sm"
          style={{
            background: "var(--color-surface)",
            borderColor: "var(--color-error)",
            color: "var(--color-error)",
          }}
        >
          {errorMsg}
        </div>
      )}
      {successMsg && (
        <div
          className="rounded-md border p-3 text-sm"
          style={{
            background: "var(--color-surface)",
            borderColor: "var(--color-success)",
            color: "var(--color-success)",
          }}
        >
          {successMsg}
        </div>
      )}

      {/* 액션 버튼 — 확정 + 해제 (해제는 기존 lineup 있을 때만) */}
      <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
        <button
          type="button"
          onClick={handleConfirm}
          disabled={isLocked || isPending || starterCount !== 5}
          className="rounded-md px-4 py-3 text-sm font-semibold"
          style={{
            background:
              starterCount === 5 && !isLocked
                ? "var(--color-accent)"
                : "var(--color-surface)",
            color:
              starterCount === 5 && !isLocked
                ? "var(--color-on-accent)"
                : "var(--color-text-muted)",
            border: "1px solid var(--color-border)",
            cursor:
              starterCount === 5 && !isLocked && !isPending
                ? "pointer"
                : "not-allowed",
            minHeight: 44,
          }}
        >
          {isPending
            ? "처리중..."
            : homeTeam.lineup
              ? "라인업 재확정"
              : "라인업 확정"}
        </button>

        {/* 해제 버튼 — 기존 lineup 있을 때만 노출 */}
        {homeTeam.lineup && !isLocked && (
          <button
            type="button"
            onClick={handleRelease}
            disabled={isPending}
            className="rounded-md px-4 py-3 text-sm font-semibold"
            style={{
              background: "var(--color-surface)",
              color: "var(--color-text-secondary)",
              border: "1px solid var(--color-border)",
              cursor: isPending ? "not-allowed" : "pointer",
              minHeight: 44,
            }}
          >
            라인업 해제
          </button>
        )}
      </div>

      {/* 가이드 — 주전 5명 미달 시 안내 */}
      {!isLocked && starterCount !== 5 && (
        <p
          className="text-xs"
          style={{ color: "var(--color-text-muted)" }}
        >
          주전 5명을 선택해야 라인업을 확정할 수 있습니다. (현재 {starterCount}/5)
        </p>
      )}
    </div>
  );
}

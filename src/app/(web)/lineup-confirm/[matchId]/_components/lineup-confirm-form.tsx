/**
 * 2026-06-14 PR-LINEUP-V2 [3] — 사전 라인업 입력 폼 (client, 전면 재작성).
 *
 * 왜 재작성하는가 (앱 bdr_stat_v3 roster_confirm 정합):
 *   - 기존: 2-state(activeIds + starterIds Set) + 출전/주전 2단계 토글.
 *   - 신규: roles 맵('out'|'starter'|'bench') + captain(ttpId) + undo 스택.
 *     행 단일 탭 순환(cycleRole) + 주장(C) 단일 토글 + 전체해제 + 실행취소.
 *
 * 앱 정합 모델:
 *   · 역할 3상태: out(선택) → starter(선발) → bench(벤치) → out
 *       cycleRole: out→선발(선발<5)/벤치(선발=5) / 선발→벤치(벤치<7)/out(벤치만석) / 벤치→out
 *       정원 12(선발5+벤치7) 초과 시 out→ 진입 차단
 *       out 전환 시 그 선수가 주장이면 주장 자동 해제 (주장 ⊆ 출전)
 *   · 정원: 선발 5(LC_STARTER_MAX) + 벤치 7(LC_BENCH_MAX) = 12
 *   · 주장(C): 경기 단위 단일 토글 — 출전 선수(선발∪벤치)만 지정
 *   · 코칭스태프 바: role==='coach' 분리(명단 제외). manager 분기 없음(실측 0건)
 *   · 전체해제 / 실행취소(undo 스냅샷 스택)
 *
 * ★주장 필수 게이트 (PM 확정):
 *   - 선발 정확히 5 AND 주장 1명일 때만 확정 버튼 활성.
 *   - 미지정 시 비활성 + "주장(C)을 지정해주세요" 안내.
 *
 * API 계약 (변경 0):
 *   - POST body: { teamSide, starters[5], substitutes[], captain }
 *     starters = role==='starter' / substitutes = role==='bench' / out = 미포함
 *   - 응답 키 = apiSuccess snake_case → lineup.captain_ttp_id (errors.md 재발 6회 회피)
 *
 * 디자인 룰: var(--*) 토큰 / Material Symbols / 720px·44px·iOS16px(.lc-* in globals.css)
 *   - isLocked 분기 / DELETE 해제 / 상대팀 미노출 = 기존 동작 보존(Stop conditions)
 */

"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { TtpRow, type TtpItem, type LcRole } from "./ttp-row";

const LC_STARTER_MAX = 5; // 앱 _kStarterMax
const LC_BENCH_MAX = 7; // 앱 _kBenchMax

// ===== 타입 (page.tsx server fetch 결과를 prop 으로 받음) =====
// page.tsx 는 server prisma 직접 조회 → snake_case 로 직렬화하여 전달
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
    substitutes: string[]; // ttpId 배열 (= 벤치)
    captain_ttp_id: string | null; // ★신규 — 경기단위 주장(NULL=미지정)
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
  // 본인 팀 측 — admin 도 home 으로 통일 (상대팀 미노출, 기존 결정 유지)
  mySide: "home" | "away";
};

// undo 스냅샷 — 변경 직전 { roles, captain } 전체 복사
type Snapshot = { roles: Record<string, LcRole>; captain: string | null };

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

  // 매치 시작 후 = 입력 차단 (서버 가드와 동일 표현, 기존 유지)
  const isLocked = match.status !== "scheduled" && match.status !== "ready";

  // 선수 풀 = coach 제외 (코칭스태프 바로 분리). manager 분기 없음(실측 0건)
  const players = useMemo(
    () => homeTeam.players.filter((p) => p.role !== "coach"),
    [homeTeam.players],
  );
  // 코치 목록 — 코칭스태프 바 표시용 (명단에서 분리)
  const coaches = useMemo(
    () => homeTeam.players.filter((p) => p.role === "coach"),
    [homeTeam.players],
  );

  // ===== 초기 state — 기존 lineup 있으면 채움 (starters→선발 / substitutes→벤치) =====
  const [roles, setRoles] = useState<Record<string, LcRole>>(() => {
    const m: Record<string, LcRole> = {};
    const starterSet = new Set(homeTeam.lineup?.starters ?? []);
    const benchSet = new Set(homeTeam.lineup?.substitutes ?? []);
    for (const p of players) {
      m[p.id] = starterSet.has(p.id)
        ? "starter"
        : benchSet.has(p.id)
          ? "bench"
          : "out";
    }
    return m;
  });
  // 주장 — 기존 lineup 의 captain_ttp_id (NULL=미지정)
  const [captain, setCaptain] = useState<string | null>(
    homeTeam.lineup?.captain_ttp_id ?? null,
  );
  // undo 스택 — 변경 직전 스냅샷 push → pop 재적용
  const [history, setHistory] = useState<Snapshot[]>([]);

  // ===== 파생값 =====
  const roleOf = (id: string): LcRole => roles[id] ?? "out";
  const starters = useMemo(
    () => players.filter((p) => roleOf(p.id) === "starter"),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [players, roles],
  );
  const benchers = useMemo(
    () => players.filter((p) => roleOf(p.id) === "bench"),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [players, roles],
  );
  const starterCount = starters.length;
  const benchCount = benchers.length;
  const ready = starterCount === LC_STARTER_MAX;
  const untouched = starterCount === 0 && benchCount === 0;
  // ★주장 필수 — 선발 5 AND 주장 1명일 때만 확정 가능
  const canConfirm = ready && captain !== null && !isLocked && !isPending;

  // 변경 직전 스냅샷 push (rosterDraft.push)
  function snapshot() {
    setHistory((h) => [...h, { roles: { ...roles }, captain }]);
  }

  // ===== 핸들러 =====

  // 행 탭 = 역할 순환 (_cycleRole)
  function cycleRole(p: TtpItem) {
    if (isLocked) return;
    const cur = roleOf(p.id);
    let next: LcRole;
    if (cur === "out") {
      // 정원 12 초과(선발5+벤치7 만석)면 진입 차단
      if (starterCount >= LC_STARTER_MAX && benchCount >= LC_BENCH_MAX) return;
      // 선발 미달이면 선발 우선, 차면 벤치
      next = starterCount < LC_STARTER_MAX ? "starter" : "bench";
    } else if (cur === "starter") {
      // 벤치 만석이면 바로 out
      next = benchCount < LC_BENCH_MAX ? "bench" : "out";
    } else {
      // bench → out
      next = "out";
    }
    snapshot();
    setRoles((r) => ({ ...r, [p.id]: next }));
    // out 전환 시 그 선수가 주장이면 주장 자동 해제 (주장 ⊆ 출전)
    if (next === "out" && captain === p.id) setCaptain(null);
    setErrorMsg(null);
  }

  // C 버튼 = 주장 단일 토글 (setCaptain — 같은 팀 1명)
  function toggleCaptain(p: TtpItem) {
    if (isLocked || roleOf(p.id) === "out") return; // 주장은 출전 선수만
    snapshot();
    setCaptain((c) => (c === p.id ? null : p.id));
    setErrorMsg(null);
  }

  // 전체 해제 (clearTeamEntry — 모든 역할 out + 주장 정리)
  function clearAll() {
    if (isLocked || untouched) return;
    snapshot();
    const m: Record<string, LcRole> = {};
    for (const p of players) m[p.id] = "out";
    setRoles(m);
    setCaptain(null);
    setErrorMsg(null);
  }

  // 실행취소 (rosterDraft.undo — 직전 스냅샷 pop 재적용)
  function undo() {
    if (!history.length || isLocked) return;
    const prev = history[history.length - 1];
    setHistory((h) => h.slice(0, -1));
    setRoles(prev.roles);
    setCaptain(prev.captain);
    setErrorMsg(null);
  }

  // 라인업 확정 — POST { teamSide, starters[5], substitutes[], captain }
  // route.ts 가 ttp 무결성 + 5명 강제 + 중복 0 + 벤치캡7 + 정원12 + 주장 검증 (UI 는 1차 가드)
  function handleConfirm() {
    if (!canConfirm) return;

    const starterIds = starters.map((p) => p.id);
    const substitutes = benchers.map((p) => p.id);

    setErrorMsg(null);
    startTransition(async () => {
      try {
        const res = await fetch(
          `/api/web/tournaments/${tournamentId}/matches/${matchId}/lineup`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              teamSide: mySide,
              starters: starterIds,
              substitutes,
              captain, // ★주장 ttpId (필수 — canConfirm 에서 보장)
            }),
          },
        );
        const json = await res.json();
        if (!res.ok) {
          setErrorMsg(json?.error ?? "라인업 저장에 실패했습니다.");
          return;
        }
        setHistory([]); // 확정 성공 = undo 스택 비움
        // server component lineup 갱신 (확정 배지/메시지 reactive)
        router.refresh();
      } catch (e) {
        console.error("[lineup-confirm] POST failed", e);
        setErrorMsg("네트워크 오류가 발생했습니다.");
      }
    });
  }

  // 라인업 해제 — DELETE (기존 동작 보존)
  function handleRelease() {
    if (isLocked) return;
    if (!homeTeam.lineup) return; // 해제할 게 없음
    if (!confirm("라인업을 해제하시겠습니까?")) return;

    setErrorMsg(null);
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
        // 로컬 state 초기화 (전 역할 out + 주장 해제)
        const m: Record<string, LcRole> = {};
        for (const p of players) m[p.id] = "out";
        setRoles(m);
        setCaptain(null);
        setHistory([]);
        router.refresh();
      } catch (e) {
        console.error("[lineup-confirm] DELETE failed", e);
        setErrorMsg("네트워크 오류가 발생했습니다.");
      }
    });
  }

  // 확정 완료 여부 — 기존 lineup 존재 = 이미 확정됨 (배지/라벨 분기)
  const confirmed = homeTeam.lineup !== null;

  // 선발 5슬롯 (선택 순서 대용 = players 순회 순서)
  const starterSlots = Array.from(
    { length: LC_STARTER_MAX },
    (_, i) => starters[i] ?? null,
  );

  // 메시지 (앱 게이트 정합) — 우선순위: 잠금 > 주장미지정 > 선발미달 > 5/5
  let msg: { tone: string; icon: string; node: React.ReactNode };
  if (isLocked) {
    msg = {
      tone: "err",
      icon: "lock",
      node: (
        <span>
          <strong>이미 시작된 경기입니다.</strong> 라인업을 변경할 수 없습니다.
        </span>
      ),
    };
  } else if (!captain && starterCount > 0) {
    msg = {
      tone: "warn",
      icon: "info",
      node: <span>주장(C)을 지정해주세요.</span>,
    };
  } else if (starterCount < LC_STARTER_MAX) {
    msg = {
      tone: "warn",
      icon: "info",
      node: (
        <span>
          선발 {LC_STARTER_MAX - starterCount}명을 더 선택하세요.{" "}
          <strong>(현재 {starterCount}/5)</strong>
        </span>
      ),
    };
  } else {
    msg = {
      tone: "info",
      icon: "task_alt",
      node: <span>선발 5명 확정 · 라인업을 확정할 수 있습니다.</span>,
    };
  }

  const confirmLabel = isPending
    ? "처리중…"
    : confirmed
      ? "라인업 재확정"
      : "라인업 확정";

  // 등록 명단 0 = 빈 명단 안내
  if (players.length === 0 && coaches.length === 0) {
    return (
      <div className="gm-card">
        <div className="lc-state">
          <span className="ico material-symbols-outlined">group_off</span>
          <p className="lc-state__t">등록된 선수가 없습니다.</p>
          <p className="lc-state__d">
            팀 관리에서 선수를 먼저 등록해야 라인업을 확정할 수 있습니다.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* 선발 5슬롯 보드 (웹 강점 — 한눈 파악) */}
      <div className="gm-card lc-board">
        <div className="lc-board__head">
          <h3 className="lc-board__h">
            <span className="ico material-symbols-outlined">
              sports_basketball
            </span>
            {homeTeam.name}
            <span className="lc-board__reg">{players.length}명 등록</span>
          </h3>
          {ready && captain ? (
            <span className="lc-board__badge lc-board__badge--ready">
              <span className="ico material-symbols-outlined">verified</span>
              {confirmed ? "팀장 확정" : "선발 완료"}
            </span>
          ) : (
            <span className="lc-board__badge lc-board__badge--pend">
              <span className="ico material-symbols-outlined">edit_note</span>
              {untouched ? "선발 미지정" : "선발 진행중"}
            </span>
          )}
        </div>

        {/* 카운터: 선발 N/5 · 벤치 b/7 + hint / 실행취소 / 전체해제 */}
        <div className="lc-sub">
          <span
            className={
              "lc-count lc-count--starter " + (ready ? "is-full" : "is-under")
            }
          >
            <span className="lc-count__lbl">선발</span>
            <span className="lc-count__n">{starterCount}</span>
            <span className="lc-count__lbl">/ 5</span>
          </span>
          <span className="lc-count__sep" />
          <span className="lc-count">
            <span className="lc-count__lbl">벤치</span>
            <span className="lc-count__n">{benchCount}</span>
            <span className="lc-count__lbl">/ 7</span>
          </span>
          {!ready && !isLocked && (
            <span className="lc-sub__hint">
              <span className="ico material-symbols-outlined">error</span>
              탭하면 선발 5명→벤치 순으로 지정
            </span>
          )}
          <span className="lc-sub__tools">
            <button
              type="button"
              className="lc-tool"
              onClick={undo}
              disabled={!history.length || isLocked || isPending}
            >
              <span className="ico material-symbols-outlined">undo</span>
              실행취소
            </button>
            <button
              type="button"
              className="lc-tool"
              onClick={clearAll}
              disabled={untouched || isLocked || isPending}
            >
              <span className="ico material-symbols-outlined">restart_alt</span>
              전체 해제
            </button>
          </span>
        </div>

        <div className="lc-slots">
          {starterSlots.map((p, i) => (
            <div key={i} className={"lc-slot" + (p ? "" : " is-empty")}>
              <span className="lc-slot__no">{i + 1}</span>
              {p ? (
                <>
                  <span className="lc-slot__avatar-wrap">
                    <span className="lc-slot__avatar">
                      {(p.user?.nickname ||
                        p.user?.name ||
                        p.player_name ||
                        "?")[0]}
                    </span>
                    {p.jersey_number != null && (
                      <span className="lc-slot__jersey">{p.jersey_number}</span>
                    )}
                    {captain === p.id && <span className="lc-slot__cap">C</span>}
                  </span>
                  <span className="lc-slot__name">
                    {p.user?.nickname ||
                      p.user?.name ||
                      p.player_name ||
                      "(이름 없음)"}
                  </span>
                </>
              ) : (
                <>
                  <span className="lc-slot__avatar">+</span>
                  <span className="lc-slot__ph">빈자리</span>
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 코칭스태프 바 (role==='coach' 분리). 코치 0건이면 미표시 */}
      {coaches.length > 0 && (
        <div className="lc-coachbar">
          <span className="lc-coachbar__lbl">코칭스태프</span>
          {coaches.map((c) => (
            <span key={c.id} className="lc-coachchip">
              <span className="ico material-symbols-outlined">badge</span>
              <span className="lc-coachchip__role">코치</span>
              {c.user?.nickname || c.user?.name || c.player_name || "(이름 없음)"}
            </span>
          ))}
        </div>
      )}

      {/* 선수 명단 — 3상태 행 순환 */}
      <div className="gm-card">
        {players.length === 0 ? (
          <div className="lc-state">
            <span className="ico material-symbols-outlined">group_off</span>
            <p className="lc-state__t">출전 가능한 선수가 없습니다.</p>
          </div>
        ) : (
          <div className="lc-rows">
            {players.map((p) => (
              <TtpRow
                key={p.id}
                ttp={p}
                role={roleOf(p.id)}
                isCaptain={captain === p.id}
                onCycle={() => cycleRole(p)}
                onToggleCaptain={() => toggleCaptain(p)}
                locked={isLocked || isPending}
              />
            ))}
          </div>
        )}

        {/* 메시지 */}
        <div className={"lc-msg lc-msg--" + msg.tone}>
          <span className="ico material-symbols-outlined">{msg.icon}</span>
          {msg.node}
        </div>

        {/* 에러 (네트워크/서버 422 등) — 메시지와 별도 */}
        {errorMsg && (
          <div className="lc-msg lc-msg--err" style={{ marginTop: 8 }}>
            <span className="ico material-symbols-outlined">error</span>
            <span>{errorMsg}</span>
          </div>
        )}

        {/* 데스크톱 액션 바 */}
        <div className="lc-actions">
          <button
            type="button"
            className="btn btn--accent btn--xl lc-actions__confirm"
            onClick={handleConfirm}
            disabled={!canConfirm}
          >
            <span className="ico material-symbols-outlined">
              {isPending ? "hourglass_top" : "how_to_reg"}
            </span>
            {confirmLabel}
          </button>
          {confirmed && !isLocked && (
            <button
              type="button"
              className="btn btn--ghost btn--xl"
              onClick={handleRelease}
              disabled={isPending}
            >
              라인업 해제
            </button>
          )}
        </div>
      </div>

      {/* 모바일 하단 sticky 바 */}
      <div className="lc-sticky">
        <div className="lc-sticky__prog">
          <span>선발 {starterCount}/5</span>
          <span className="lc-sticky__bar">
            <span
              className={"lc-sticky__fill" + (ready ? " is-full" : "")}
              style={{ width: (starterCount / 5) * 100 + "%" }}
            />
          </span>
          <span>벤치 {benchCount}/7</span>
        </div>
        <div className="lc-sticky__row">
          <button
            type="button"
            className="btn btn--accent btn--touch lc-actions__confirm"
            onClick={handleConfirm}
            disabled={!canConfirm}
          >
            {confirmLabel}
          </button>
          {confirmed && !isLocked && (
            <button
              type="button"
              className="btn btn--ghost btn--touch"
              onClick={handleRelease}
              disabled={isPending}
            >
              해제
            </button>
          )}
        </div>
      </div>
    </>
  );
}

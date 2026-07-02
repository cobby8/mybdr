# B1.1 TournamentWorkspace Panel Internals - Uploadable Markdown

Use this file after B1 shell analysis. It contains only the five panel internals that were missing or truncated: teams, divisions, matches, recorders, site.

## Request

- Update B1.1 panel internals in _qa/current-src-inventory.md.
- Add panel-internal details to _qa/reverse-bake-gap.md.
- Create or extend _qa/bake-fix-checklist-B1.md with B1.1 internal bake steps.
- Keep scope to BDR-current reverse-bake checklist. Do not propose runtime API, Prisma, or route changes.

## Files

### File: src/app/(admin)/tournament-admin/tournaments/[id]/_panels/teams-panel.tsx

````tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/card";
// 2026-05-16 PR-Admin-1 — 단계간 CTA (페이지 footer "다음: 대진표 생성 →")
import { NextStepCTA } from "../_components/NextStepCTA";
// Track B-a Toss 리스킨 — Material Symbols → lucide-react 키트(<Icon>)
import { Icon } from "@/components/admin-toss";
import { PanelLoadingState } from "./panel-loading-state";

/* ---------- 타입 ---------- */

type Player = {
  id: string;
  player_name: string | null;
  phone: string | null;
  jersey_number: number | null;
  position: string | null;
  role: string | null;
  user_id: string | null;
  users: { id: string; nickname: string | null; phone: string | null; profile_image_url: string | null } | null;
};

type TournamentTeam = {
  id: string;
  status: string;
  seedNumber: number | null;
  groupName: string | null;
  createdAt: string;
  team: {
    id: string;
    name: string;
    logoUrl: string | null;
    primaryColor: string | null;
  };
  players: { id: string; role: string }[];
};

/**
 * apply_token 진행 표 row (Phase 2-C IA 통합).
 * - team-applications API 응답의 토큰 정보를 tournamentTeam.id 로 매핑해서 표 컬럼 추가.
 * - applyTokenUrl: 만료 토큰은 null 처리 (API 가 만료 검사 후 노출).
 */
// 2026-05-11 Phase 3-D — 검토 보고서 §D 권장 4건 통합:
//   - appliedVia (admin / coach_token / self / null) — 등록 경로 배지
//   - appliedAt (신청 시각) — createdAt 보다 우선 표시
//   - waitingNumber — 대기접수 N번
//   - registeredBy — 일반 신청자 정보 (nickname / email)
type TokenInfo = {
  applyTokenUrl: string | null;
  applyTokenExpiresAt: string | null;
  managerName: string | null;
  managerPhone: string | null;
  appliedVia: string | null;
  appliedAt: string | null;
  waitingNumber: number | null;
  registeredBy: { nickname: string | null; email: string | null } | null;
  // Phase 3-F 옵션 A 신규
  category: string | null;
  paymentStatus: string | null;
  updatedAt: string;
};

type DivisionRuleOption = {
  code: string;
  label: string;
  cap: number | null;
};

/* ---------- 상수 ---------- */

const STATUS_LABEL: Record<string, string> = {
  pending: "대기 중",
  approved: "승인",
  rejected: "거절",
  withdrawn: "취소",
};

const STATUS_COLOR: Record<string, string> = {
  pending: "text-[var(--color-warning)] bg-[var(--color-warning)]/10",
  approved: "text-[var(--color-game-team)] bg-[var(--color-game-team)]/10",
  rejected: "text-[var(--color-error)] bg-[color-mix(in_srgb,var(--color-error)_10%,transparent)]",
  withdrawn: "text-[var(--color-text-muted)] bg-[var(--color-elevated)]",
};

/* ---------- 선수 추가 폼 초기값 ---------- */
const EMPTY_FORM = { player_name: "", phone: "", jersey_number: "", position: "" };

/* ---------- 메인 컴포넌트 ---------- */

export default function TournamentTeamsPage() {
  const { id } = useParams<{ id: string }>();
  const [teams, setTeams] = useState<TournamentTeam[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [drawingDivision, setDrawingDivision] = useState<string | null>(null);

  // 선수 관리 상태
  const [expandedTeamId, setExpandedTeamId] = useState<string | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [playersLoading, setPlayersLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState(EMPTY_FORM);
  const [addLoading, setAddLoading] = useState(false);

  // Phase 2-C IA — apply_token 진행 표 통합
  // tokenMap: tournamentTeam.id → 토큰 URL/만료/코치정보
  // 이유(왜): 기존 API 응답에는 토큰 정보가 없어 별도 endpoint 호출 후 id 매핑.
  const [tokenMap, setTokenMap] = useState<Record<string, TokenInfo>>({});
  const [toast, setToast] = useState<string | null>(null);
  // Phase 3-F 옵션 A — Tournament 진행률 표시용 roster 룰
  const [rosterRule, setRosterRule] = useState<{ min: number | null; max: number | null }>({
    min: null,
    max: null,
  });
  // 2026-05-12 Phase 4-B — 종별 룰 목록 (드롭다운용)
  const [divisionRules, setDivisionRules] = useState<DivisionRuleOption[]>([]);
  // 모달 inline 편집 상태 (코치 / 종별 / import)
  const [editingManager, setEditingManager] = useState(false);
  const [managerForm, setManagerForm] = useState({ name: "", phone: "" });
  const [showImportModal, setShowImportModal] = useState(false);

  // 토스트 자동 사라짐 (3초)
  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }, []);

  /* --- 팀 목록 로드 + 토큰 정보 병합 (Phase 2-C 통합) --- */
  const load = useCallback(async () => {
    try {
      // 1) 기존 팀/선수 정보 (시드/상태 관리용)
      //    API 응답이 snake_case 자동 변환되므로 camelCase interface 로 명시 매핑 (Invalid Date / 시드 누락 fix)
      const res = await fetch(`/api/web/tournaments/${id}/teams`);
      if (res.ok) {
        const raw = (await res.json()) as Array<{
          id: string;
          status: string;
          seed_number: number | null;
          group_name: string | null;
          created_at: string;
          team: {
            id: string; name: string;
            logo_url: string | null; primary_color: string | null;
          };
          players: Array<{ id: string; role: string }>;
        }>;
        const mapped: TournamentTeam[] = raw.map((t) => ({
          id: t.id,
          status: t.status,
          seedNumber: t.seed_number,
          groupName: t.group_name,
          createdAt: t.created_at,
          team: {
            id: t.team.id,
            name: t.team.name,
            logoUrl: t.team.logo_url,
            primaryColor: t.team.primary_color,
          },
          players: t.players,
        }));
        setTeams(mapped);
      }

      // 2) 토큰 정보 (apply_token URL + 만료) — 별도 endpoint
      //    응답은 snake_case (apiSuccess 자동 변환) — apply_token_url / apply_token_expires_at
      const tokenRes = await fetch(`/api/web/admin/tournaments/${id}/team-applications`);
      if (tokenRes.ok) {
        const json = await tokenRes.json();
        const next: Record<string, TokenInfo> = {};
        // apiSuccess 응답 = raw data (no { data: ... } wrapper). { teams: [...] } 형태.
        // 응답 key 가 snake_case 로 변환되므로 접근자도 snake_case 사용 (CLAUDE.md §보안 5번)
        const teamsArr = (json?.teams ?? []) as Array<{
          id: string;
          apply_token_url: string | null;
          apply_token_expires_at: string | null;
          manager_name: string | null;
          manager_phone: string | null;
          applied_via: string | null;
          applied_at: string | null;
          waiting_number: number | null;
          registered_by: { nickname: string | null; email: string | null } | null;
          category: string | null;
          payment_status: string | null;
          updated_at: string;
        }>;
        for (const row of teamsArr) {
          next[row.id] = {
            applyTokenUrl: row.apply_token_url,
            applyTokenExpiresAt: row.apply_token_expires_at,
            managerName: row.manager_name,
            managerPhone: row.manager_phone,
            appliedVia: row.applied_via,
            appliedAt: row.applied_at,
            waitingNumber: row.waiting_number,
            registeredBy: row.registered_by,
            category: row.category,
            paymentStatus: row.payment_status,
            updatedAt: row.updated_at,
          };
        }
        setTokenMap(next);
        // Tournament roster 룰 (페이지 단위 1회)
        setRosterRule({
          min: typeof json?.roster_min === "number" ? json.roster_min : null,
          max: typeof json?.roster_max === "number" ? json.roster_max : null,
        });
        // Phase 4-B 종별 룰 (드롭다운용)
        setDivisionRules((json?.division_rules ?? []) as DivisionRuleOption[]);
      }
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  /* --- 토큰 URL 복사 (clipboard + 토스트) --- */
  const copyTokenUrl = useCallback(
    async (url: string | null) => {
      if (!url) {
        showToast("토큰이 만료되었습니다. 재발급이 필요합니다.");
        return;
      }
      try {
        await navigator.clipboard.writeText(url);
        showToast("토큰 URL이 복사되었습니다");
      } catch {
        showToast("복사에 실패했습니다");
      }
    },
    [showToast],
  );

  /* --- 만료일 포맷 (YYYY.MM.DD) --- */
  const formatExpiry = (iso: string | null): string => {
    if (!iso) return "—";
    const d = new Date(iso);
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
  };

  /* --- 팀 상태 변경 --- */
  const updateStatus = async (teamId: string, status: string) => {
    setActionLoading(teamId);
    try {
      await fetch(`/api/web/tournaments/${id}/teams/${teamId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      await load();
    } catch { /* ignore */ } finally {
      setActionLoading(null);
    }
  };

  /* --- Track B-a: 납부 상태 변경 (paid 설정 시 입금→자동확정 트리거) --- */
  // 이유(왜): 운영자가 입금 확인 후 "납부"로 바꾸면 서버가 정원 가드 통과 시 자동으로 승인 처리한다.
  //   응답의 promoted / promote_reason 으로 결과(승격 / 정원초과 보류)를 토스트 안내한다.
  const updatePayment = async (teamId: string, paymentStatus: string) => {
    setActionLoading(teamId);
    try {
      const res = await fetch(`/api/web/tournaments/${id}/teams/${teamId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payment_status: paymentStatus }),
      });
      // 응답 key 는 snake_case (apiSuccess 자동 변환) — promoted / promote_reason
      const json = await res.json().catch(() => null);
      if (paymentStatus === "paid" && json) {
        if (json.promoted) {
          showToast("입금 확인 — 참가 확정(승인)으로 자동 변경되었습니다.");
        } else if (json.promote_reason === "division_full") {
          showToast("입금 처리됨 — 단, 해당 종별 정원이 가득 차 자동 승인은 보류되었습니다.");
        } else {
          showToast("납부 상태가 변경되었습니다.");
        }
      } else {
        showToast("납부 상태가 변경되었습니다.");
      }
      await load();
    } catch {
      showToast("네트워크 오류");
    } finally {
      setActionLoading(null);
    }
  };

  /* --- Phase 4-B 옵션 B (모달 inline 액션 4건) --- */

  // 토큰 재발급
  const reissueToken = async (ttId: string) => {
    if (!confirm("토큰을 재발급하시겠습니까?\n기존 토큰 URL은 무효화됩니다.")) return;
    try {
      const res = await fetch(`/api/web/admin/tournaments/${id}/teams/${ttId}/reissue-token`, {
        method: "POST",
      });
      const json = await res.json();
      if (!res.ok) return showToast(json.error ?? "재발급 실패");
      if (json.apply_token_url) {
        try { await navigator.clipboard.writeText(json.apply_token_url); } catch { /* ignore */ }
        showToast(`재발급 완료 — 링크가 복사되었습니다. (만료 ${new Date(json.expires_at).toLocaleDateString("ko-KR")})`);
      } else {
        showToast("재발급 완료");
      }
      await load();
    } catch { showToast("네트워크 오류"); }
  };

  // 코치 정보 변경
  const saveManager = async (ttId: string) => {
    try {
      const body: Record<string, string> = {};
      if (managerForm.name.trim()) body.managerName = managerForm.name.trim();
      // phone 빈 문자열 = null 처리 (zod 가 빈 값 허용)
      body.managerPhone = managerForm.phone.trim();
      const res = await fetch(`/api/web/admin/tournaments/${id}/teams/${ttId}/manager`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) return showToast(json.error ?? "저장 실패");
      showToast(json.changed ? "코치 정보 변경됨" : "변경 사항 없음");
      setEditingManager(false);
      await load();
    } catch { showToast("네트워크 오류"); }
  };

  // 종별 변경
  const changeCategory = async (ttId: string, category: string) => {
    if (!category) return;
    if (!confirm(`종별을 "${category}" 로 변경하시겠습니까?\n선수 명단의 division_code 도 일괄 변경됩니다.`)) return;
    try {
      const res = await fetch(`/api/web/admin/tournaments/${id}/teams/${ttId}/category`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category }),
      });
      const json = await res.json();
      if (!res.ok) return showToast(json.error ?? "변경 실패");
      showToast(json.changed ? `종별: ${json.previous ?? "(없음)"} → ${json.current}` : "변경 사항 없음");
      await load();
    } catch { showToast("네트워크 오류"); }
  };

  /* --- 시드 배정 --- */
  const updateSeed = async (teamId: string, seed: number | null) => {
    try {
      await fetch(`/api/web/tournaments/${id}/teams/${teamId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seedNumber: seed }),
      });
      await load();
    } catch { /* ignore */ }
  };

  const updateGroup = async (teamId: string, groupName: string | null) => {
    try {
      const res = await fetch(`/api/web/tournaments/${id}/teams/${teamId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groupName }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => null);
        showToast(json?.error ?? "조 변경 실패");
        return;
      }
      showToast(groupName ? `${groupName}조로 변경되었습니다.` : "조 편성이 해제되었습니다.");
      await load();
    } catch {
      showToast("네트워크 오류");
    }
  };

  const autoDrawDivision = async (
    rule: DivisionRuleOption,
    mode: "random" | "seeded" = "random",
  ) => {
    const ready = divisionReadiness.find((item) => item.code === rule.code);
    if (!ready || ready.approved < 2) {
      showToast("승인팀이 2팀 이상이어야 조편성을 할 수 있습니다.");
      return;
    }
    const modeLabel = mode === "seeded" ? "시드 반영" : "랜덤";
    if (!confirm(`${rule.label} 승인팀 ${ready.approved}팀을 ${modeLabel} 방식으로 조편성할까요?`)) {
      return;
    }
    setDrawingDivision(rule.code);
    try {
      const res = await fetch(`/api/web/admin/tournaments/${id}/division-draw`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ divisionCode: rule.code, mode }),
      });
      const json = await res.json();
      if (!res.ok) {
        showToast(json.error ?? "조편성 실패");
        return;
      }
      showToast(`${json.division_label ?? rule.label}: ${json.group_count ?? 0}개 조 편성 완료`);
      await load();
    } catch {
      showToast("네트워크 오류");
    } finally {
      setDrawingDivision(null);
    }
  };

  /* --- 선수 목록 로드 --- */
  const loadPlayers = async (teamId: string) => {
    setPlayersLoading(true);
    try {
      const res = await fetch(`/api/web/tournaments/${id}/teams/${teamId}/players`);
      if (res.ok) {
        const data = await res.json();
        setPlayers(data);
      }
    } catch { /* ignore */ } finally {
      setPlayersLoading(false);
    }
  };

  /* --- 팀 카드 클릭 → 선수 목록 토글 --- */
  const toggleTeam = (teamId: string) => {
    if (expandedTeamId === teamId) {
      setExpandedTeamId(null);
      setPlayers([]);
      setShowAddForm(false);
    } else {
      setExpandedTeamId(teamId);
      setShowAddForm(false);
      setAddForm(EMPTY_FORM);
      loadPlayers(teamId);
    }
  };

  /* --- 선수 추가 --- */
  const handleAddPlayer = async () => {
    if (!expandedTeamId || !addForm.player_name.trim()) return;
    setAddLoading(true);
    try {
      const body: Record<string, unknown> = {
        player_name: addForm.player_name.trim(),
      };
      // 전화번호: 숫자만 추출
      if (addForm.phone.trim()) {
        body.phone = addForm.phone.replace(/[^0-9]/g, "");
      }
      // 등번호
      if (addForm.jersey_number.trim()) {
        body.jersey_number = Number(addForm.jersey_number);
      }
      // 포지션
      if (addForm.position.trim()) {
        body.position = addForm.position.trim();
      }

      const res = await fetch(`/api/web/tournaments/${id}/teams/${expandedTeamId}/players`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        setAddForm(EMPTY_FORM);
        setShowAddForm(false);
        await loadPlayers(expandedTeamId);
        await load(); // 팀 목록도 새로고침 (선수 수 반영)
      } else {
        const err = await res.json();
        alert(err.error ?? "선수 추가에 실패했습니다.");
      }
    } catch {
      alert("선수 추가에 실패했습니다.");
    } finally {
      setAddLoading(false);
    }
  };

  /* --- 선수 삭제 --- */
  const handleDeletePlayer = async (playerId: string) => {
    if (!expandedTeamId) return;
    if (!confirm("이 선수를 삭제하시겠습니까?")) return;

    try {
      const res = await fetch(
        `/api/web/tournaments/${id}/teams/${expandedTeamId}/players/${playerId}`,
        { method: "DELETE" }
      );
      if (res.ok) {
        await loadPlayers(expandedTeamId);
        await load();
      }
    } catch { /* ignore */ }
  };

  /* --- 필터 + 통계 (Phase 3-D 검토 보고서 §D 통합) --- */
  // 코치 미입력 = appliedVia='admin' + players 0건 (운영자 박제 후 코치가 토큰으로 입력 안 함)
  const isCoachPending = (tt: TournamentTeam): boolean => {
    const t = tokenMap[tt.id];
    return t?.appliedVia === "admin" && tt.players.length === 0;
  };

  const filtered =
    filter === "all"
      ? teams
      : filter === "coach_pending"
        ? teams.filter(isCoachPending)
        : teams.filter((t) => t.status === filter);

  const counts = {
    all: teams.length,
    pending: teams.filter((t) => t.status === "pending").length,
    approved: teams.filter((t) => t.status === "approved").length,
    rejected: teams.filter((t) => t.status === "rejected").length,
    coach_pending: teams.filter(isCoachPending).length,
  };

  // 통계 카드 — 등록 경로별 분류 (Phase 3-D 권장 4)
  const viaStats = {
    admin: teams.filter((tt) => tokenMap[tt.id]?.appliedVia === "admin").length,
    coach_token: teams.filter((tt) => tokenMap[tt.id]?.appliedVia === "coach_token").length,
    self: teams.filter((tt) => tokenMap[tt.id]?.appliedVia === "self").length,
    null: teams.filter((tt) => !tokenMap[tt.id]?.appliedVia).length,
  };
  const approvedTeams = teams.filter((tt) => tt.status === "approved");
  const divisionReadiness = divisionRules.map((rule) => {
    const approved = approvedTeams.filter(
      (tt) => tokenMap[tt.id]?.category === rule.code,
    ).length;
    const total = teams.filter((tt) => tokenMap[tt.id]?.category === rule.code).length;
    const overCapacity = rule.cap != null && approved > rule.cap;
    return {
      ...rule,
      approved,
      total,
      overCapacity,
      ready: approved >= 2 && !overCapacity,
    };
  });
  const unassignedApprovedCount = approvedTeams.filter(
    (tt) => !tokenMap[tt.id]?.category,
  ).length;
  const readyDivisionCount = divisionReadiness.filter((item) => item.ready).length;

  if (loading) return <PanelLoadingState label="참가팀 정보를 준비 중입니다." />;

  return (
    <div data-skin="toss">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href={`/tournament-admin/tournaments/${id}`} className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]">&larr; 대회 관리</Link>
          <h1 className="mt-1 text-xl font-bold sm:text-2xl">참가팀 관리</h1>
          {/* Phase 2-C 안내 — 코치 토큰 URL 공유 시 비로그인으로 명단 입력 가능 */}
          <p className="mt-1 text-xs text-[var(--color-text-muted)]">
            코치에게 토큰 URL을 공유하면 비로그인으로 명단 입력 가능합니다.
          </p>
        </div>
        {/* 2026-05-11 Phase 3-C — 토큰 발송 도구 (CSV 다운로드 + 메시지 일괄 복사) */}
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => downloadTokenCsv(teams, tokenMap)}
            disabled={!aliveTokenCount(tokenMap)}
            className="btn btn--sm"
            title="모든 팀의 명단 입력 링크를 파일로 받기"
          >
            <Icon name="download" size={16} className="align-middle mr-1" />
            토큰 파일 받기 ({aliveTokenCount(tokenMap)})
          </button>
          <button
            type="button"
            onClick={() => copyAllTokenMessages(teams, tokenMap, showToast)}
            disabled={!aliveTokenCount(tokenMap)}
            className="btn btn--primary btn--sm"
            title="카톡 발송용 안내문 일괄 복사"
          >
            <Icon name="message-circle" size={16} className="align-middle mr-1" />
            카톡 문구 복사
          </button>
          {/* 2026-05-16 PR-Admin-2 — "순위전 자동 채우기" 버튼은 matches 페이지로 이동 박제됨 (AdvancePlayoffsButton).
              admin-flow §3 단계 10 = "예선 종료 → 순위전 진출" 은 matches 페이지가 자연스러운 위치. */}
        </div>
      </div>

      {/* 등록 경로 통계 카드 (Phase 3-D 권장 4 — 강남구 일괄 박제 vs 코치 신청 구분 시각화) */}
      <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <ViaStatCard label="운영자 등록" count={viaStats.admin} icon="briefcase" />
        <ViaStatCard label="코치 신청" count={viaStats.coach_token} icon="id-card" />
        <ViaStatCard label="본인 신청" count={viaStats.self} icon="user" />
        <ViaStatCard label="경로 미상" count={viaStats.null} icon="circle-help" />
      </div>

      {/* 통계 탭 — status 분류 + 코치 미입력 (운영자 박제 + 코치 명단 0건)
          2026-05-12 — 탭 필터 pill 9999px ❌ + admin 빨강 본문 금지 룰 → rounded-[4px] + info(Navy) 활성 톤.
          count 뱃지 (rounded-full px-1.5 py-0.5) = 작은 정사각형 chip → 보존 (룰 10 예외) */}
      {divisionRules.length > 0 && (
        <section
          className="mb-4 rounded-[18px] border bg-[var(--card)] p-3"
          style={{ borderColor: "var(--color-border)" }}
        >
          <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-[var(--ink)]">종별 배정 현황</h2>
              <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">
                승인팀 기준 {readyDivisionCount}/{divisionRules.length}개 종별 대진 준비
              </p>
            </div>
            <Link
              href={`/tournament-admin/tournaments/${id}#bracket`}
              className="ts-btn ts-btn--secondary ts-btn--sm"
            >
              대진추첨으로
            </Link>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {divisionReadiness.map((item) => (
              <div
                key={item.code}
                className="rounded-[14px] border bg-[var(--grey-50)] p-3"
                style={{ borderColor: "var(--color-border)" }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-[var(--ink)]">
                      {item.label}
                    </p>
                    <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                      전체 {item.total}팀 · 승인 {item.approved}
                      {item.cap != null ? ` / 정원 ${item.cap}` : ""}
                    </p>
                  </div>
                  <span
                    className="rounded-[8px] px-2 py-0.5 text-[10px] font-semibold"
                    style={{
                      background: item.overCapacity
                        ? "color-mix(in srgb, var(--color-error) 14%, transparent)"
                        : item.ready
                          ? "color-mix(in srgb, var(--color-success) 14%, transparent)"
                          : "var(--color-elevated)",
                      color: item.overCapacity
                        ? "var(--color-error)"
                        : item.ready
                          ? "var(--color-success)"
                          : "var(--color-text-muted)",
                    }}
                  >
                    {item.overCapacity ? "정원 초과" : item.ready ? "준비" : "대기"}
                  </span>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => autoDrawDivision(item, "random")}
                    disabled={drawingDivision === item.code || item.approved < 2}
                    className="ts-btn ts-btn--secondary ts-btn--sm w-full"
                  >
                    {drawingDivision === item.code ? "조편성 중..." : "랜덤"}
                  </button>
                  <button
                    type="button"
                    onClick={() => autoDrawDivision(item, "seeded")}
                    disabled={drawingDivision === item.code || item.approved < 2}
                    className="ts-btn ts-btn--secondary ts-btn--sm w-full"
                  >
                    시드 반영
                  </button>
                </div>
              </div>
            ))}
            {unassignedApprovedCount > 0 && (
              <div
                className="rounded-[14px] border p-3"
                style={{
                  borderColor: "var(--color-warning)",
                  background: "color-mix(in srgb, var(--color-warning) 8%, transparent)",
                }}
              >
                <p className="text-sm font-bold text-[var(--ink)]">종별 미배정</p>
                <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                  승인팀 {unassignedApprovedCount}팀의 종별을 먼저 지정해야 합니다.
                </p>
              </div>
            )}
          </div>
        </section>
      )}

      <div className="mb-4 flex flex-wrap gap-2">
        {(["all", "pending", "approved", "rejected", "coach_pending"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className="ts-chip"
            data-active={filter === s}
          >
            {s === "all" ? "전체" : s === "coach_pending" ? "코치 미입력" : STATUS_LABEL[s]}
            <span className="rounded-[8px] bg-[var(--grey-100)] px-1.5 py-0.5 text-xs">{counts[s]}</span>
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <Card className="py-12 text-center text-[var(--color-text-muted)]">
          <div className="mb-2 flex justify-center">
            <Icon name="volleyball" size={36} />
          </div>
          {filter === "all" ? "참가 신청한 팀이 없습니다." : `${STATUS_LABEL[filter]} 상태의 팀이 없습니다.`}
        </Card>
      ) : (
        // 2026-05-12 — 사용자 요청: 종별 그룹화 (i2-U11 / i3-U9 / i3w-U12 등 같은 종별 묶음)
        // 그룹 정렬 = 종 코드 알파벳 / 그룹 내 = 기존 filtered 순서 유지 (createdAt desc)
        // "종별 미지정" 팀 = "기타" 그룹으로 마지막
        (() => {
          const groups: Record<string, typeof filtered> = {};
          for (const tt of filtered) {
            const cat = tokenMap[tt.id]?.category ?? "기타";
            (groups[cat] ??= []).push(tt);
          }
          // 정렬 — 종 코드 알파벳 / "기타" 는 항상 마지막
          const sortedKeys = Object.keys(groups).sort((a, b) => {
            if (a === "기타") return 1;
            if (b === "기타") return -1;
            return a.localeCompare(b);
          });
          return (
            <div className="space-y-6">
              {sortedKeys.map((cat) => (
                <section key={cat}>
                  {/* 종별 헤더 — accent 톤 작은 헤더 */}
                  <div className="mb-2 flex items-center gap-2 px-1">
                    <h3
                      className="text-sm font-bold uppercase tracking-wide"
                      style={{ color: "var(--color-accent)", letterSpacing: "0.04em" }}
                    >
                      {cat}
                    </h3>
                    <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                      ({groups[cat].length}팀)
                    </span>
                    <div
                      className="flex-1 border-t"
                      style={{ borderColor: "var(--color-border)" }}
                    />
                  </div>
                  <div className="space-y-2">
                    {groups[cat].map((tt) => {
            // Phase 2-C — 토큰 정보 매핑 (tournamentTeam.id 기준)
            const token = tokenMap[tt.id];
            const tokenAlive = !!token?.applyTokenUrl;
            return (
            <Card key={tt.id}>
              {/* 팀 정보 행 */}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div
                  className="flex min-w-0 cursor-pointer items-center gap-3"
                  onClick={() => toggleTeam(tt.id)}
                >
                  {/* 팀 색상 아이콘 — 정사각형(W=H) 원형은 룰 10에 따라 9999px 회피 → 50% */}
                  <div
                    className="h-10 w-10 rounded-[50%]"
                    style={{ backgroundColor: tt.team.primaryColor ?? "var(--color-primary)" }}
                  />
                  <div>
                    {/* 팀명 + 배지 (Phase 3-D 권장 1 — applied_via 배지) */}
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold">{tt.team.name}</p>
                      <ViaBadge appliedVia={token?.appliedVia ?? null} />
                      <StatusBadge status={tt.status} />
                      {token?.waitingNumber && (
                        <span className="rounded-[8px] bg-[var(--color-warning)]/15 px-2 py-0.5 text-xs font-medium text-[var(--color-warning)]">
                          대기 {token.waitingNumber}번
                        </span>
                      )}
                      {isCoachPending(tt) && (
                        <span className="rounded-[8px] bg-[var(--color-info)]/15 px-2 py-0.5 text-xs font-medium text-[var(--color-info)]">
                          코치 입력 대기
                        </span>
                      )}
                    </div>
                    {/* 메타 정보 — 선수수 / 신청 시각 (applied_at 우선, fallback createdAt) / 코치 / 신청자 */}
                    <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">
                      선수 {tt.players.length}명 &middot;{" "}
                      {token?.appliedAt
                        ? `${new Date(token.appliedAt).toLocaleDateString("ko-KR")} 신청`
                        : `${new Date(tt.createdAt).toLocaleDateString("ko-KR")} 등록`}
                      {token?.managerName && <> &middot; 코치 {token.managerName}</>}
                      {token?.registeredBy?.nickname && (
                        <> &middot; 신청자 {token.registeredBy.nickname}</>
                      )}
                    </p>
                  </div>
                  {/* 펼침 화살표 */}
                  <Icon
                    name={expandedTeamId === tt.id ? "chevron-up" : "chevron-down"}
                    size={18}
                    color="var(--color-text-muted)"
                  />
                </div>

                <div className="flex w-full flex-wrap items-center justify-start gap-2 sm:w-auto sm:justify-end">
                  {/* Phase 2-C — 토큰 URL 복사 버튼 */}
                  {/* 토큰 자체가 발급된 적이 없는 팀(직접 등록 등) = "-" / 만료 = "만료" 표시 */}
                  {token ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        copyTokenUrl(token.applyTokenUrl);
                      }}
                      disabled={!tokenAlive}
                      title={tokenAlive ? `만료: ${formatExpiry(token.applyTokenExpiresAt)}` : "토큰 만료됨"}
                      className={`ts-btn ts-btn--sm ${
                        tokenAlive
                          ? "ts-btn--secondary"
                          : "cursor-not-allowed opacity-60"
                      }`}
                    >
                      <Icon name={tokenAlive ? "copy" : "link-2-off"} size={14} />
                      {tokenAlive ? "링크 복사" : "만료"}
                    </button>
                  ) : (
                    <span className="text-xs text-[var(--color-text-muted)]" title="토큰 미발급">—</span>
                  )}
                  {/* 시드 배정 */}
                  {tt.status === "approved" && (
                    <div className="flex items-center gap-1">
                      <label className="text-xs text-[var(--color-text-muted)]">시드</label>
                      <input
                        type="number"
                        min={1}
                        defaultValue={tt.seedNumber ?? ""}
                        onBlur={(e) =>
                          updateSeed(tt.id, e.target.value ? Number(e.target.value) : null)
                        }
                        className="w-16 rounded-[8px] border-none bg-[var(--color-elevated)] px-2 py-1 text-center text-sm text-[var(--color-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]/50"
                        placeholder="-"
                      />
                    </div>
                  )}

                  {/* 상태 뱃지 */}
                  {tt.status === "approved" && (
                    <label className="flex items-center gap-1 text-xs text-[var(--color-text-muted)]">
                      <span>조</span>
                      <input
                        defaultValue={tt.groupName ?? ""}
                        onBlur={(e) => {
                          const next = e.target.value.trim().toUpperCase();
                          if (next !== (tt.groupName ?? "")) updateGroup(tt.id, next || null);
                        }}
                        className="w-12 rounded-[8px] border-none bg-[var(--color-elevated)] px-2 py-1 text-center text-sm text-[var(--color-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]/50"
                        placeholder="-"
                      />
                    </label>
                  )}

                  <span className={`rounded-[8px] px-3 py-1 text-xs font-medium ${STATUS_COLOR[tt.status] ?? ""}`}>
                    {STATUS_LABEL[tt.status] ?? tt.status}
                  </span>

                  {/* 액션 버튼 */}
                  {tt.status === "pending" && (
                    <div className="flex gap-1">
                      <button
                        onClick={() => updateStatus(tt.id, "approved")}
                        disabled={actionLoading === tt.id}
                        className="ts-btn ts-btn--primary ts-btn--sm"
                      >
                        승인
                      </button>
                      <button
                        onClick={() => updateStatus(tt.id, "rejected")}
                        disabled={actionLoading === tt.id}
                        className="ts-btn ts-btn--danger ts-btn--sm"
                      >
                        거절
                      </button>
                    </div>
                  )}
                  {tt.status === "approved" && (
                    <button
                      onClick={() => updateStatus(tt.id, "rejected")}
                      disabled={actionLoading === tt.id}
                      className="ts-btn ts-btn--danger ts-btn--sm"
                    >
                      거절
                    </button>
                  )}
                  {tt.status === "rejected" && (
                    <button
                      onClick={() => updateStatus(tt.id, "approved")}
                      disabled={actionLoading === tt.id}
                      className="ts-btn ts-btn--primary ts-btn--sm"
                    >
                      승인으로 변경
                    </button>
                  )}
                </div>
              </div>

              {/* 2026-05-12 Phase 3-E 후속 — 인라인 펼침 dead code 청소 완료.
                  선수 명단은 모달 (페이지 끝 TeamDetailModal) 에서 렌더링됨. */}
            </Card>
            );
          })}
                  </div>
                </section>
              ))}
            </div>
          );
        })()
      )}

      {/* Phase 4-B — 선수 일괄 import 모달 */}
      {showImportModal && expandedTeamId && (
        <ImportPlayersModal
          tournamentId={id}
          ttId={expandedTeamId}
          onClose={() => setShowImportModal(false)}
          onSuccess={(msg) => {
            setShowImportModal(false);
            showToast(msg);
            if (expandedTeamId) loadPlayers(expandedTeamId);
            load();
          }}
        />
      )}

      {/* Phase 2-C — 토스트 (화면 우상단 고정) */}
      {toast && (
        <div
          role="status"
          className="fixed top-20 right-4 z-50 rounded-[16px] border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-sm text-[var(--ink)] shadow-[var(--sh-md)] no-print"
          style={{ minWidth: 220 }}
        >
          {toast}
        </div>
      )}

      {/* 2026-05-11 Phase 3-E — 팀 상세 모달 (인라인 펼침 → 모달 전환 + 선수 명단 프린트) */}
      {expandedTeamId && (() => {
        const expandedTeam = teams.find((t) => t.id === expandedTeamId);
        if (!expandedTeam) return null;
        const token = tokenMap[expandedTeam.id];
        return (
          <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-40 flex items-start justify-center overflow-y-auto p-3 no-print sm:p-4"
            style={{ background: "rgba(0,0,0,0.5)" }}
            onClick={() => { setExpandedTeamId(null); setPlayers([]); setShowAddForm(false); }}
          >
            <div
              id="team-detail-printable"
              className="relative my-3 w-full max-w-3xl rounded-[24px] border bg-[var(--card)] p-4 shadow-[var(--sh-lg)] sm:my-4 sm:p-6"
              style={{ borderColor: "var(--border)" }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* 2026-05-12 — 닫기 X 버튼 우상단 절대 위치 (모달 표준 패턴) */}
              <button
                type="button"
                onClick={() => { setExpandedTeamId(null); setPlayers([]); setShowAddForm(false); }}
                className="ct-iconbtn absolute right-3 top-3 z-10 no-print"
                title="닫기"
                aria-label="닫기"
              >
                <Icon name="x" size={20} />
              </button>
              {/* 모달 헤더 — 팀 정보 + 액션 (프린트 / 닫기) — Phase 3-F 옵션 A 5건 통합
                  2026-05-11 모바일 최적화: 좁은 화면(<sm)에서 정보·액션 세로 분리 + 액션 wrap */}
              <div className="mb-4 flex flex-col gap-3 print-header sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-bold">{expandedTeam.team.name}</h2>
                    {/* 1. 신청 종별 — Phase 4-B: 드롭다운으로 변경 가능 */}
                    {divisionRules.length > 0 ? (
                      <select
                        value={token?.category ?? ""}
                        onChange={(e) => changeCategory(expandedTeam.id, e.target.value)}
                        className="rounded-[8px] px-2 py-0.5 text-[10px] font-semibold no-print"
                        style={{
                          background: "color-mix(in srgb, var(--color-accent) 15%, transparent)",
                          color: "var(--color-accent)",
                          letterSpacing: "0.04em",
                          border: "1px solid color-mix(in srgb, var(--color-accent) 30%, transparent)",
                        }}
                        title="종별 변경"
                      >
                        <option value="" disabled>종별 선택</option>
                        {divisionRules.map((d) => (
                          <option key={d.code} value={d.code}>{d.label}</option>
                        ))}
                      </select>
                    ) : (
                      token?.category && (
                        <span
                          className="rounded-[8px] px-2 py-0.5 text-[10px] font-semibold"
                          style={{
                            background: "color-mix(in srgb, var(--color-accent) 15%, transparent)",
                            color: "var(--color-accent)",
                            letterSpacing: "0.04em",
                          }}
                        >
                          {token.category}
                        </span>
                      )
                    )}
                    <ViaBadge appliedVia={token?.appliedVia ?? null} />
                    <StatusBadge status={expandedTeam.status} />
                    {/* 3. 납부 상태 배지 (프린트 포함 표시) */}
                    <PaymentBadge status={token?.paymentStatus ?? null} />
                    {/* Track B-a — 납부 상태 인라인 변경 (paid 선택 시 입금→자동확정 트리거) */}
                    <select
                      value={token?.paymentStatus ?? "unpaid"}
                      onChange={(e) => updatePayment(expandedTeam.id, e.target.value)}
                      disabled={actionLoading === expandedTeam.id}
                      className="no-print rounded-[8px] border px-2 py-0.5 text-[10px] font-semibold"
                      style={{
                        borderColor: "var(--color-border)",
                        background: "var(--color-card)",
                        color: "var(--color-text-secondary)",
                      }}
                      title="납부 상태 변경 (납부 선택 시 자동 승인)"
                    >
                      <option value="unpaid">미납</option>
                      <option value="paid">납부</option>
                      <option value="refunded">환불</option>
                    </select>
                    {token?.waitingNumber && (
                      <span className="rounded-[8px] bg-[var(--color-warning)]/15 px-2 py-0.5 text-xs font-medium text-[var(--color-warning)]">
                        대기 {token.waitingNumber}번
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                    {token?.appliedAt
                      ? `${new Date(token.appliedAt).toLocaleDateString("ko-KR")} 신청`
                      : `${new Date(expandedTeam.createdAt).toLocaleDateString("ko-KR")} 등록`}
                    {" "}· 코치{" "}
                    {editingManager ? (
                      <span className="no-print inline-flex items-center gap-1">
                        <input
                          type="text"
                          value={managerForm.name}
                          onChange={(e) => setManagerForm({ ...managerForm, name: e.target.value })}
                          placeholder="코치 이름"
                          className="w-24 rounded-[8px] border px-2 py-0.5 text-xs"
                          style={{ borderColor: "var(--color-border)", background: "var(--color-card)" }}
                        />
                        <input
                          type="tel"
                          value={managerForm.phone}
                          onChange={(e) => setManagerForm({ ...managerForm, phone: e.target.value })}
                          placeholder="010-XXXX-XXXX"
                          className="w-32 rounded-[8px] border px-2 py-0.5 text-xs"
                          style={{ borderColor: "var(--color-border)", background: "var(--color-card)" }}
                        />
                        <button
                          type="button"
                          onClick={() => saveManager(expandedTeam.id)}
                          className="rounded-[8px] px-2 py-0.5 text-[10px] font-medium text-white"
                          style={{ background: "var(--color-success)" }}
                        >
                          저장
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingManager(false)}
                          className="rounded-[8px] px-2 py-0.5 text-[10px]"
                          style={{ color: "var(--color-text-muted)" }}
                        >
                          취소
                        </button>
                      </span>
                    ) : (
                      <>
                        {token?.managerName ?? <span style={{ color: "var(--color-text-muted)" }}>(미입력)</span>}
                        {token?.managerPhone && (
                          <>
                            {" ("}
                            <a
                              href={`tel:${token.managerPhone.replace(/[^0-9+]/g, "")}`}
                              className="underline decoration-dotted underline-offset-2 hover:text-[var(--color-info)]"
                              style={{ color: "var(--color-info)" }}
                              onClick={(e) => e.stopPropagation()}
                            >
                              {token.managerPhone}
                            </a>
                            {")"}
                          </>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setEditingManager(true);
                            setManagerForm({ name: token?.managerName ?? "", phone: token?.managerPhone ?? "" });
                          }}
                          className="ml-1 inline-flex no-print"
                          title="코치 정보 편집"
                          style={{ color: "var(--color-text-muted)" }}
                        >
                          <Icon name="pencil" size={12} />
                        </button>
                      </>
                    )}
                    {token?.registeredBy?.nickname && <> · 신청자 {token.registeredBy.nickname}</>}
                  </p>
                  {/* 조 · 시드 변경 — Phase 3-F 옵션 A 후속: 시드 input 추가 */}
                  <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-[var(--color-text-muted)]">
                    <label className="flex items-center gap-1 no-print">
                      <span>조</span>
                      <input
                        defaultValue={expandedTeam.groupName ?? ""}
                        onBlur={(e) => {
                          const next = e.target.value.trim().toUpperCase();
                          if (next !== (expandedTeam.groupName ?? "")) {
                            updateGroup(expandedTeam.id, next || null);
                          }
                        }}
                        className="w-12 rounded-[8px] border px-2 py-0.5 text-center text-xs focus:outline-none focus:ring-1"
                        style={{
                          borderColor: "var(--color-border)",
                          background: "var(--color-card)",
                          color: "var(--color-text-primary)",
                        }}
                        placeholder="-"
                      />
                    </label>
                    <label className="flex items-center gap-1 no-print">
                      <span>시드</span>
                      <input
                        type="number"
                        min={1}
                        max={99}
                        defaultValue={expandedTeam.seedNumber ?? ""}
                        onBlur={(e) => {
                          const v = e.target.value ? Number(e.target.value) : null;
                          if (v !== (expandedTeam.seedNumber ?? null)) updateSeed(expandedTeam.id, v);
                        }}
                        className="w-14 rounded-[8px] border px-2 py-0.5 text-xs focus:outline-none focus:ring-1"
                        style={{
                          borderColor: "var(--color-border)",
                          background: "var(--color-card)",
                          color: "var(--color-text-primary)",
                        }}
                      />
                    </label>
                  </div>
                  {/* 5. 토큰 만료일 + 마지막 갱신 시각 + Phase 4-B 재발급 버튼 */}
                  <div className="mt-0.5 flex flex-wrap items-center gap-3 text-[10px]" style={{ color: "var(--color-text-muted)" }}>
                    {token?.applyTokenExpiresAt && (
                      <span>
                        토큰 만료: {new Date(token.applyTokenExpiresAt).toLocaleDateString("ko-KR")}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => reissueToken(expandedTeam.id)}
                      className="no-print inline-flex items-center gap-0.5 underline decoration-dotted underline-offset-2"
                      style={{ color: "var(--color-info)" }}
                      title="토큰 재발급"
                    >
                      <Icon name="refresh-cw" size={12} />
                      재발급
                    </button>
                    {token?.updatedAt && (
                      <span>
                        {token.appliedVia === "coach_token" ? "코치 입력" : "마지막 갱신"}: {formatUpdatedAt(token.updatedAt)}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 no-print sm:flex-shrink-0">
                  {/* 1. URL 복사 버튼 */}
                  {token?.applyTokenUrl && (
                    <button
                      type="button"
                      onClick={() => copyTokenUrl(token.applyTokenUrl)}
                      className="btn btn--sm"
                      title={`토큰 만료: ${token.applyTokenExpiresAt ? new Date(token.applyTokenExpiresAt).toLocaleDateString("ko-KR") : "-"}`}
                    >
                      <Icon name="copy" size={16} className="align-middle mr-1" />
                      링크 복사
                    </button>
                  )}
                  {/* 2. 승인 / 거절 액션 (status 분기) */}
                  {expandedTeam.status === "pending" && (
                    <>
                      <button
                        type="button"
                        onClick={() => updateStatus(expandedTeam.id, "approved")}
                        disabled={actionLoading === expandedTeam.id}
                        className="btn btn--sm"
                        style={{ background: "var(--color-success)", color: "white", borderColor: "var(--color-success)" }}
                      >
                        승인
                      </button>
                      <button
                        type="button"
                        onClick={() => updateStatus(expandedTeam.id, "rejected")}
                        disabled={actionLoading === expandedTeam.id}
                        className="btn btn--sm"
                        style={{ background: "var(--color-error)", color: "white", borderColor: "var(--color-error)" }}
                      >
                        거절
                      </button>
                    </>
                  )}
                  {expandedTeam.status === "approved" && (
                    <button
                      type="button"
                      onClick={() => updateStatus(expandedTeam.id, "rejected")}
                      disabled={actionLoading === expandedTeam.id}
                      className="btn btn--sm"
                      style={{ color: "var(--color-error)", borderColor: "var(--color-error)" }}
                    >
                      거절로 변경
                    </button>
                  )}
                  {expandedTeam.status === "rejected" && (
                    <button
                      type="button"
                      onClick={() => updateStatus(expandedTeam.id, "approved")}
                      disabled={actionLoading === expandedTeam.id}
                      className="btn btn--sm"
                      style={{ color: "var(--color-success)", borderColor: "var(--color-success)" }}
                    >
                      승인으로 변경
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="btn btn--sm"
                    title="선수 명단 프린트"
                  >
                    <Icon name="printer" size={16} className="align-middle mr-1" />
                    프린트
                  </button>
                  {/* 닫기 X 버튼은 모달 우상단 absolute 로 이동 (위 button.absolute.right-3.top-3) */}
                </div>
              </div>

              {/* 선수 명단 헤더 + 4. 진행률 (rosterMin/Max 대비) */}
              <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold">선수 명단 ({players.length}명)</h3>
                  <RosterProgressBadge
                    count={players.length}
                    min={rosterRule.min}
                    max={rosterRule.max}
                  />
                </div>
                <div className="flex flex-wrap gap-2 no-print">
                  <button
                    type="button"
                    onClick={() => setShowImportModal(true)}
                    className="btn btn--sm"
                    title="카톡 명단 텍스트 일괄 입력"
                  >
                    <Icon name="clipboard-paste" size={16} className="align-middle mr-1" />
                    일괄 입력
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddForm(!showAddForm)}
                    className="btn btn--primary btn--sm"
                  >
                    <Icon name="user-plus" size={16} className="align-middle mr-1" />
                    선수 추가
                  </button>
                </div>
              </div>

              {/* 선수 추가 폼 */}
              {showAddForm && (
                <div className="mb-4 rounded-[16px] bg-[var(--grey-50)] p-4 no-print">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <input
                      type="text"
                      placeholder="이름 *"
                      value={addForm.player_name}
                      onChange={(e) => setAddForm({ ...addForm, player_name: e.target.value })}
                      className="ts-input"
                    />
                    <input
                      type="text"
                      placeholder="전화번호"
                      value={addForm.phone}
                      onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })}
                      className="ts-input"
                    />
                    <input
                      type="number"
                      placeholder="등번호"
                      value={addForm.jersey_number}
                      onChange={(e) => setAddForm({ ...addForm, jersey_number: e.target.value })}
                      className="ts-input"
                    />
                    <input
                      type="text"
                      placeholder="포지션"
                      value={addForm.position}
                      onChange={(e) => setAddForm({ ...addForm, position: e.target.value })}
                      className="ts-input"
                    />
                  </div>
                  <div className="mt-3 flex justify-end gap-2">
                    <button
                      onClick={() => { setShowAddForm(false); setAddForm(EMPTY_FORM); }}
                      className="btn btn--sm"
                    >
                      취소
                    </button>
                    <button
                      onClick={handleAddPlayer}
                      disabled={addLoading || !addForm.player_name.trim()}
                      className="btn btn--primary btn--sm"
                    >
                      {addLoading ? "추가 중..." : "추가"}
                    </button>
                  </div>
                </div>
              )}

              {/* 선수 명단 테이블 */}
              {playersLoading ? (
                <p className="py-4 text-center text-sm text-[var(--color-text-muted)]">불러오는 중...</p>
              ) : players.length === 0 ? (
                <p className="py-8 text-center text-sm text-[var(--color-text-muted)]">등록된 선수가 없습니다.</p>
              ) : (
                <>
                <div className="space-y-2 sm:hidden">
                  {players.map((p) => (
                    <div key={p.id} className="rounded-[16px] bg-[var(--grey-50)] p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-semibold text-[var(--ink)]">
                            {p.jersey_number ? `${p.jersey_number}번 · ` : ""}{p.player_name ?? "-"}
                          </p>
                          <p className="mt-1 text-xs text-[var(--ink-mute)]">
                            {(p as { birth_date?: string }).birth_date ?? "-"} · {(p as { school_name?: string }).school_name ?? "-"}
                          </p>
                          <p className="mt-1 text-xs text-[var(--ink-mute)]">
                            보호자 {(p as { parent_name?: string }).parent_name ?? "-"} · {(p as { parent_phone?: string }).parent_phone ?? p.phone ?? "-"}
                          </p>
                        </div>
                        <button
                          onClick={() => handleDeletePlayer(p.id)}
                          className="ct-iconbtn no-print"
                          title="선수 삭제"
                        >
                          <Icon name="trash-2" size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="hidden overflow-x-auto sm:block">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[var(--color-border)] text-left text-xs text-[var(--color-text-muted)]">
                        <th className="pb-2 pr-3">#</th>
                        <th className="pb-2 pr-3">이름</th>
                        <th className="pb-2 pr-3">생년월일</th>
                        <th className="pb-2 pr-3">학교</th>
                        <th className="pb-2 pr-3">포지션</th>
                        <th className="pb-2 pr-3">학부모</th>
                        <th className="pb-2 pr-3 no-print">연락처</th>
                        <th className="pb-2 no-print" />
                      </tr>
                    </thead>
                    <tbody>
                      {players.map((p) => (
                        <tr key={p.id} className="border-b border-[var(--color-border)]/50">
                          <td className="py-2 pr-3 text-[var(--color-text-muted)]">{p.jersey_number ?? "-"}</td>
                          <td className="py-2 pr-3 font-medium">{p.player_name ?? "-"}</td>
                          <td className="py-2 pr-3 text-[var(--color-text-muted)]">{(p as { birth_date?: string }).birth_date ?? "-"}</td>
                          <td className="py-2 pr-3 text-[var(--color-text-muted)]">{(p as { school_name?: string }).school_name ?? "-"}</td>
                          <td className="py-2 pr-3 text-[var(--color-text-muted)]">{p.position ?? "-"}</td>
                          <td className="py-2 pr-3 text-[var(--color-text-muted)]">{(p as { parent_name?: string }).parent_name ?? "-"}</td>
                          <td className="py-2 pr-3 text-[var(--color-text-muted)] no-print">
                            {(p as { parent_phone?: string }).parent_phone ?? p.phone ?? "-"}
                          </td>
                          <td className="py-2 text-right no-print">
                            <button
                              onClick={() => handleDeletePlayer(p.id)}
                              className="ct-iconbtn"
                              title="선수 삭제"
                            >
                              <Icon name="trash-2" size={18} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                </>
              )}

              {/* 프린트 푸터 — 프린트 시에만 표시 */}
              <p className="mt-4 hidden text-xs text-[var(--color-text-muted)] print-only">
                ※ 본 명단은 운영자 어드민 (mybdr.kr) 에서 출력되었습니다. 출력일: {new Date().toLocaleDateString("ko-KR")}
              </p>
            </div>
          </div>
        );
      })()}

      {/* 프린트 전용 CSS — 모달만 표시 + 페이지 나머지 hide */}
      <style jsx global>{`
        @media print {
          body * { visibility: hidden; }
          #team-detail-printable, #team-detail-printable * { visibility: visible; }
          #team-detail-printable { position: absolute; top: 0; left: 0; width: 100%; box-shadow: none; border: none; padding: 0; margin: 0; background: white; color: black; }
          .no-print { display: none !important; }
          .print-only { display: block !important; }
        }
        .print-only { display: none; }
      `}</style>

      {/* 2026-05-16 PR-Admin-1 — 단계간 CTA (admin-flow-audit §3 단계 4 단절 해소) */}
      <NextStepCTA tournamentId={id} currentStep="teams" />
    </div>
  );
}

/* ============================================================
 * 2026-05-12 Phase 4-B (옵션 B 4번) — 선수 일괄 import 모달
 * - 카톡 명단 텍스트 붙여넣기 → 파싱 → 미리보기 → POST API
 * - 형식: 이름/생년월일/등번호/포지션/학교명/부모님성함/부모님연락처 (Phase 3-A 동일)
 * - overwrite 옵션 (기존 명단 삭제 후 INSERT)
 * ============================================================ */
function ImportPlayersModal({
  tournamentId,
  ttId,
  onClose,
  onSuccess,
}: {
  tournamentId: string;
  ttId: string;
  onClose: () => void;
  onSuccess: (msg: string) => void;
}) {
  const [text, setText] = useState("");
  const [overwrite, setOverwrite] = useState(false);
  const [strict, setStrict] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);

  // 카톡 텍스트 파싱 (Phase 3-A team-apply-form 와 동일 형식)
  const parsePlayers = (raw: string) => {
    const lines = raw.split(/\r?\n/).filter((l) => l.trim());
    if (lines.length === 0) return { players: [], errors: ["붙여넣을 명단이 없습니다."] };
    const players: Array<Record<string, string | number | null>> = [];
    const errors: string[] = [];
    lines.forEach((line, idx) => {
      const parts = line.split("/").map((s) => s.trim());
      if (parts.length < 2) {
        errors.push(`${idx + 1}줄: 형식 오류 (최소 이름/생년월일)`);
        return;
      }
      const [name, birth, jersey, position, school, parentName, parentPhone] = parts;
      // 생년월일 normalize
      const m = birth.match(/^(\d{4})[-./]?(\d{1,2})[-./]?(\d{1,2})$/);
      if (!m) {
        errors.push(`${idx + 1}줄 (${name}): 생년월일 형식 오류 "${birth}"`);
        return;
      }
      const normBirth = `${m[1]}-${m[2].padStart(2, "0")}-${m[3].padStart(2, "0")}`;
      // 연락처 normalize
      const phoneDigits = (parentPhone ?? "").replace(/\D/g, "");
      const normPhone =
        phoneDigits.length === 11
          ? `${phoneDigits.slice(0, 3)}-${phoneDigits.slice(3, 7)}-${phoneDigits.slice(7)}`
          : null;
      players.push({
        player_name: name,
        birth_date: normBirth,
        jersey_number: jersey ? Number(jersey) : null,
        position: position || null,
        school_name: school || null,
        parent_name: parentName || null,
        parent_phone: normPhone,
      });
    });
    return { players, errors };
  };

  const submit = async () => {
    setError(null);
    setParseError(null);
    const { players, errors } = parsePlayers(text);
    if (errors.length > 0) {
      setParseError(errors.join("\n"));
      return;
    }
    if (players.length === 0) {
      setParseError("파싱된 선수가 없습니다.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/web/admin/tournaments/${tournamentId}/teams/${ttId}/import-players`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ players, overwrite, strictDivisionRule: strict }),
      });
      const json = await res.json();
      if (!res.ok) {
        if (json.code === "DIVISION_VALIDATION_FAILED" && Array.isArray(json.errors)) {
          setError(`종별 검증 실패:\n${json.errors.map((e: { index: number; message: string }) => `${e.index + 1}번: ${e.message}`).join("\n")}`);
        } else {
          setError(json.error ?? "입력 실패");
        }
        setSubmitting(false);
        return;
      }
      const warningNote = Array.isArray(json.warnings) && json.warnings.length > 0
        ? ` (경고 ${json.warnings.length}건)` : "";
      onSuccess(`${json.inserted_count}명 입력${overwrite ? ` / ${json.deleted_count}명 삭제` : ""}${warningNote}`);
    } catch {
      setError("네트워크 오류");
      setSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 no-print sm:p-4"
      style={{ background: "rgba(0,0,0,0.6)" }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl rounded-[24px] border bg-[var(--card)] p-4 shadow-[var(--sh-lg)] sm:p-6"
        style={{ borderColor: "var(--border)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="ct-iconbtn absolute right-3 top-3"
          aria-label="닫기"
        >
          <Icon name="x" size={20} />
        </button>
        <h2 className="mb-4 text-lg font-bold">선수 일괄 입력</h2>
        <p className="mb-3 text-xs" style={{ color: "var(--ink-mute)" }}>
          한 줄에 한 명씩 입력합니다. 순서: 이름/생년월일/등번호/포지션/학교명/보호자/연락처
        </p>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={10}
          placeholder={"홍길동/2017-05-16/7/가드/강남초등학교/홍판서/010-1234-5678\n김철수/2017.8.22/12/포워드/잠실초등학교/김보호자/010-9876-5432"}
          className="ts-input min-h-[220px] font-mono text-sm"
        />
        <div className="mt-3 flex flex-wrap items-center gap-4 text-xs">
          <label className="flex items-center gap-1">
            <input type="checkbox" checked={overwrite} onChange={(e) => setOverwrite(e.target.checked)} />
            <span>기존 명단 전체 삭제 후 입력</span>
          </label>
          <label className="flex items-center gap-1">
            <input type="checkbox" checked={strict} onChange={(e) => setStrict(e.target.checked)} />
            <span>종별 규칙 엄격 검증</span>
          </label>
        </div>
        {parseError && (
          <p className="mt-3 whitespace-pre-line text-xs" style={{ color: "var(--color-warning)" }}>
            {parseError}
          </p>
        )}
        {error && (
          <p className="mt-3 whitespace-pre-line text-sm" style={{ color: "var(--color-error)" }}>
            {error}
          </p>
        )}
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" onClick={onClose} disabled={submitting} className="btn btn--sm">
            취소
          </button>
          <button type="button" onClick={submit} disabled={submitting || !text.trim()} className="btn btn--primary btn--sm">
            {submitting ? "처리 중..." : "일괄 입력 실행"}
          </button>
        </div>
      </div>
    </div>
  );
}

// 2026-05-11 Phase 2-C 후속: AddTeamTokenModal 컴포넌트 제거.
//   - 강남구 36팀 일괄 INSERT 스크립트로 박제 완료 → 운영자 페이지 단건 발급 빈도 0.
//   - POST /api/web/admin/tournaments/[id]/team-applications endpoint 는 그대로 보존
//     (향후 비상 단건 케이스 또는 다른 운영 흐름에서 진입점 재추가 가능).

/* ============================================================
 * 2026-05-11 Phase 3-D — 등록 경로/상태/통계 배지 헬퍼
 * ============================================================ */

// 등록 경로 배지 — applied_via 값별 색상/라벨
function ViaBadge({ appliedVia }: { appliedVia: string | null }) {
  const map: Record<string, { label: string; bg: string; fg: string }> = {
    admin: { label: "운영자", bg: "var(--color-elevated)", fg: "var(--color-text-secondary)" },
    coach_token: { label: "코치", bg: "color-mix(in srgb, var(--color-info) 15%, transparent)", fg: "var(--color-info)" },
    self: { label: "본인", bg: "color-mix(in srgb, var(--color-success) 15%, transparent)", fg: "var(--color-success)" },
  };
  if (!appliedVia || !map[appliedVia]) {
    return (
      <span
        className="rounded-[8px] px-2 py-0.5 text-[10px] font-medium"
        style={{ background: "var(--color-elevated)", color: "var(--color-text-muted)" }}
      >
        경로 미상
      </span>
    );
  }
  const cfg = map[appliedVia];
  return (
    <span
      className="rounded-[8px] px-2 py-0.5 text-[10px] font-medium"
      style={{ background: cfg.bg, color: cfg.fg }}
    >
      {cfg.label}
    </span>
  );
}

// 상태 배지 — status 값별 색상/라벨
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; bg: string; fg: string }> = {
    pending: {
      label: "대기 중",
      bg: "color-mix(in srgb, var(--color-warning) 15%, transparent)",
      fg: "var(--color-warning)",
    },
    approved: {
      label: "승인",
      bg: "color-mix(in srgb, var(--color-success) 15%, transparent)",
      fg: "var(--color-success)",
    },
    rejected: {
      label: "거절",
      bg: "color-mix(in srgb, var(--color-error) 15%, transparent)",
      fg: "var(--color-error)",
    },
    waiting: {
      label: "대기접수",
      bg: "color-mix(in srgb, var(--color-info) 15%, transparent)",
      fg: "var(--color-info)",
    },
  };
  const cfg = map[status] ?? {
    label: status,
    bg: "var(--color-elevated)",
    fg: "var(--color-text-muted)",
  };
  return (
    <span
      className="rounded-[8px] px-2 py-0.5 text-[10px] font-medium"
      style={{ background: cfg.bg, color: cfg.fg }}
    >
      {cfg.label}
    </span>
  );
}

// 2026-05-11 Phase 3-F 옵션 A — 납부 상태 배지
function PaymentBadge({ status }: { status: string | null }) {
  const map: Record<string, { label: string; bg: string; fg: string }> = {
    paid: {
      label: "납부",
      bg: "color-mix(in srgb, var(--color-success) 15%, transparent)",
      fg: "var(--color-success)",
    },
    unpaid: {
      label: "미납",
      bg: "color-mix(in srgb, var(--color-warning) 15%, transparent)",
      fg: "var(--color-warning)",
    },
    waived: {
      label: "면제",
      bg: "color-mix(in srgb, var(--color-info) 15%, transparent)",
      fg: "var(--color-info)",
    },
    refunded: {
      label: "환불",
      bg: "var(--color-elevated)",
      fg: "var(--color-text-muted)",
    },
  };
  if (!status || !map[status]) return null;
  const cfg = map[status];
  return (
    <span
      className="rounded-[8px] px-2 py-0.5 text-[10px] font-medium"
      style={{ background: cfg.bg, color: cfg.fg }}
    >
      {cfg.label}
    </span>
  );
}

// 진행률 배지 — players.length vs roster_min/max
function RosterProgressBadge({
  count,
  min,
  max,
}: {
  count: number;
  min: number | null;
  max: number | null;
}) {
  if (min == null && max == null) return null;
  // 상태 분기: 부족 / 충족 / 초과
  let label: string;
  let color: string;
  if (min != null && count < min) {
    label = `${count} / ${min} 이상`;
    color = "var(--color-warning)";
  } else if (max != null && count > max) {
    label = `${count} / ${max} 초과`;
    color = "var(--color-error)";
  } else {
    label = `${count}${max ? ` / ${max}` : ""}`;
    color = "var(--color-success)";
  }
  return (
    <span
      className="rounded-[8px] px-2 py-0.5 text-[10px] font-medium"
      style={{
        background: `color-mix(in srgb, ${color} 12%, transparent)`,
        color,
      }}
    >
      {label}
    </span>
  );
}

// 마지막 갱신 시각 — 상대 시간 또는 절대 (1일 이상 = 절대)
function formatUpdatedAt(iso: string): string {
  const d = new Date(iso);
  const diffMs = Date.now() - d.getTime();
  const min = Math.floor(diffMs / 60000);
  if (min < 1) return "방금";
  if (min < 60) return `${min}분 전`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}시간 전`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}일 전`;
  return d.toLocaleDateString("ko-KR");
}

// 등록 경로 통계 카드 — accent 톤 단일 (conventions.md "admin 빨간색 본문 금지" 준수)
function ViaStatCard({ label, count, icon }: { label: string; count: number; icon: string }) {
  return (
    <div
      className="flex items-center gap-3 rounded-[16px] border p-3"
      style={{ borderColor: "var(--border)", background: "var(--grey-50)" }}
    >
      <Icon name={icon} size={24} color="var(--color-accent)" />
      <div>
        <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
          {label}
        </p>
        <p className="text-lg font-bold" style={{ color: "var(--color-text-primary)" }}>
          {count}
        </p>
      </div>
    </div>
  );
}

/* ============================================================
 * 2026-05-11 Phase 3-C — 토큰 발송 도구 (CSV 다운로드 + 카톡 메시지 일괄 복사)
 *
 * 자동 SMS 발송은 별 PR (채널 결정 필요 — 솔라피/알리고/카카오 비즈).
 * 본 fix = 즉시 가능한 빠른 옵션:
 *   - CSV 다운로드 → 엑셀로 열어 데이터 확인 + 일괄 카톡 발송 보조
 *   - 카톡 메시지 일괄 복사 → 클립보드에 팀별 안내문 일괄 → 단톡방 붙여넣기
 * ============================================================ */

// alive 토큰 수 (UI 버튼 disabled 가드용)
function aliveTokenCount(tokenMap: Record<string, TokenInfo>): number {
  return Object.values(tokenMap).filter((t) => !!t.applyTokenUrl).length;
}

// CSV 다운로드 — 운영자가 엑셀로 열어 검토 가능
function downloadTokenCsv(
  teams: TournamentTeam[],
  tokenMap: Record<string, TokenInfo>,
): void {
  // UTF-8 BOM 추가 (엑셀 한글 깨짐 회피 — Windows 표준)
  const BOM = "﻿";
  const header = "팀명,코치명,코치번호,토큰 URL,만료";
  const lines = [header];
  for (const tt of teams) {
    const token = tokenMap[tt.id];
    if (!token?.applyTokenUrl) continue;
    const expiry = token.applyTokenExpiresAt
      ? new Date(token.applyTokenExpiresAt).toLocaleDateString("ko-KR")
      : "";
    // CSV escape — 컴마/따옴표 포함 시 큰따옴표로 감싸고 내부 따옴표는 ""
    const cells = [
      tt.team.name,
      token.managerName ?? "",
      token.managerPhone ?? "",
      token.applyTokenUrl,
      expiry,
    ].map((c) => {
      const s = String(c);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    });
    lines.push(cells.join(","));
  }
  const csv = BOM + lines.join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `team-tokens-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// 2026-05-16 PR-Admin-2 — Phase 3-B `advancePlaceholders` 헬퍼는 matches 페이지의
// AdvancePlayoffsButton 컴포넌트로 이동 + 흡수됨 (modal UI 포함 / load() refetch trigger).
// teams 페이지 헤더 버튼 제거에 따라 본 헬퍼도 deadcode → 제거.

// 카톡 메시지 일괄 복사 — 클립보드에 팀별 안내문 합쳐서 복사
function copyAllTokenMessages(
  teams: TournamentTeam[],
  tokenMap: Record<string, TokenInfo>,
  toast: (msg: string) => void,
): void {
  const blocks: string[] = [];
  for (const tt of teams) {
    const token = tokenMap[tt.id];
    if (!token?.applyTokenUrl) continue;
    const managerName = token.managerName ? `${token.managerName} 코치님` : `${tt.team.name} 코치님`;
    blocks.push(
      `[${tt.team.name}]\n` +
      `안녕하세요, ${managerName}.\n` +
      `참가팀 명단 입력 링크입니다.\n` +
      `${token.applyTokenUrl}\n` +
      `※ 링크는 일회용입니다. 한 번에 모든 선수 명단을 입력해주세요.`,
    );
  }
  if (blocks.length === 0) {
    toast("발송 가능한 토큰이 없습니다.");
    return;
  }
  const text = blocks.join("\n\n────────\n\n");
  navigator.clipboard
    .writeText(text)
    .then(() => toast(`${blocks.length}팀 메시지 복사 완료 — 단톡방에 붙여넣기`))
    .catch(() => toast("복사에 실패했습니다. 토큰 파일 받기를 사용하세요."));
}

````

### File: src/app/(admin)/tournament-admin/tournaments/[id]/_panels/divisions-panel.tsx

````tsx
"use client";

/**
 * 2026-05-12 Phase 3.5 — 종별 운영 방식 설정 페이지.
 *
 * 배경 (사용자 보고 5/12):
 *   - 대진표 생성 전 종별마다 다른 진행 방식 (i3-U9 링크제 / i2-U11 듀얼 등) 설정 UI 없음
 *   - Tournament.format = 단일 enum → 종별 단위 박제 불가능
 *   - Phase 3.5 = TournamentDivisionRule.format + settings 컬럼 신설
 *
 * Workspace panel: /tournament-admin/tournaments/[id]#divisions
 *
 * 기능:
 *   - 종별 목록 (코드 / 라벨 / 학년 / 참가비)
 *   - 종별마다 format 드롭다운 (8 enum) — PATCH
 *   - 종별별 settings (groupCount / advanceCount / linkagePairs) JSON 입력
 *   - 저장 시 즉시 PATCH (낙관적 UI)
 *
 * 권한: canManageTournament (super_admin / organizer / TAM / 단체 admin)
 */

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
// Track B-c Toss 리스킨 — Material Symbols → lucide-react 키트(<Icon>)
import { Icon } from "@/components/admin-toss";
// 2026-05-12 Phase 3.5-D — division format / settings 헬퍼 (lib 분리 → vitest 단위 검증 가능)
import {
  FORMAT_LABEL,
  showGroupSettings,
  showRankingFormat,
  shouldShowAdvancePerGroup,
  ADVANCE_PER_GROUP_DEFAULT,
  calculateTotalTeams,
} from "@/lib/tournaments/division-formats";
// 2026-06-22 F-2b — 디비전 일정(날짜/코트) 역참조 표시 헬퍼
import {
  resolveDivisionSchedule,
  allCourts,
  type ScheduleDateLite,
  type PlaceLite,
  type DivScheduleEntry,
} from "../divisions/_components/schedule-format";

interface DivisionRule {
  id: string;
  code: string;
  label: string;
  grade_min: number | null;
  grade_max: number | null;
  fee_krw: number;
  sort_order: number;
  format: string | null;
  settings: Record<string, unknown> | null;
}

type MasterCategory = {
  id: string;
  name: string;
  divisions: string[];
  ages: string[];
  sort_order: number;
};

type CurrentCategory = {
  category: string;
  divisions: Array<{
    name: string;
    cap: number | null;
    fee: number | null;
  }>;
};

// FORMAT_LABEL / showGroupSettings / showRankingFormat = lib/tournaments/division-formats.ts 로 이동 (Phase 3.5-D)
// 사유: server (route.ts) + client (page.tsx) 양쪽에서 동일 enum 사용 + vitest 단위 검증 가능.

export default function DivisionsSetupPage() {
  const params = useParams();
  const tournamentId = params.id as string;

  const [rules, setRules] = useState<DivisionRule[]>([]);
  const [allowedFormats, setAllowedFormats] = useState<string[]>([]);
  const [masterCategories, setMasterCategories] = useState<MasterCategory[]>([]);
  const [currentCategories, setCurrentCategories] = useState<CurrentCategory[]>([]);
  // 2026-06-22 F-2b — 디비전 일정 역참조용 데이터(div_schedule 배열 + 룩업 소스)
  //   route 에서 map→배열로 변환해 내보내므로(디비전명 snake 변환 회피) 배열로 받는다.
  const [divSchedule, setDivSchedule] = useState<DivScheduleEntry[]>([]);
  const [scheduleDates, setScheduleDates] = useState<ScheduleDateLite[]>([]);
  const [places, setPlaces] = useState<PlaceLite[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [syncResult, setSyncResult] = useState<string | null>(null);
  // 2026-05-12 Phase 3.5-C — 진출 매핑 수동 trigger
  const [advancingId, setAdvancingId] = useState<string | null>(null);
  const [advanceResult, setAdvanceResult] = useState<{
    code: string;
    updated: number;
    skipped: number;
  } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/web/admin/tournaments/${tournamentId}/division-rules`
      );
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "조회 실패");
        setLoading(false);
        return;
      }
      setRules((json.rules ?? []) as DivisionRule[]);
      setAllowedFormats((json.allowed_formats ?? []) as string[]);
      setMasterCategories((json.master_categories ?? []) as MasterCategory[]);
      setCurrentCategories((json.current_categories ?? []) as CurrentCategory[]);
      // F-2b — 디비전 일정 역참조 데이터(배열·route 에서 map→배열 변환·snake)
      setDivSchedule(
        Array.isArray(json.div_schedule)
          ? (json.div_schedule as DivScheduleEntry[])
          : [],
      );
      setScheduleDates((json.schedule_dates ?? []) as ScheduleDateLite[]);
      setPlaces((json.places ?? []) as PlaceLite[]);
    } catch {
      setError("네트워크 오류");
    } finally {
      setLoading(false);
    }
  }, [tournamentId]);

  useEffect(() => {
    load();
  }, [load]);

  const isDivisionSelected = (category: string, division: string) =>
    currentCategories.some(
      (item) =>
        item.category === category &&
        item.divisions.some((current) => current.name === division),
    );

  const toggleDivision = (category: string, division: string) => {
    setSyncResult(null);
    setCurrentCategories((prev) => {
      const existing = prev.find((item) => item.category === category);
      if (!existing) {
        return [
          ...prev,
          { category, divisions: [{ name: division, cap: null, fee: null }] },
        ];
      }

      const selected = existing.divisions.some((item) => item.name === division);
      const nextDivisions = selected
        ? existing.divisions.filter((item) => item.name !== division)
        : [...existing.divisions, { name: division, cap: null, fee: null }];

      if (nextDivisions.length === 0) {
        return prev.filter((item) => item.category !== category);
      }

      return prev.map((item) =>
        item.category === category ? { ...item, divisions: nextDivisions } : item,
      );
    });
  };

  const getCurrentDivisionName = (category: string, divisionIndex: number) =>
    currentCategories.find((item) => item.category === category)?.divisions[
      divisionIndex
    ]?.name ?? null;

  const updateDivisionName = (
    category: string,
    divisionIndex: number,
    value: string,
  ) => {
    const previousName = getCurrentDivisionName(category, divisionIndex);
    setSyncResult(null);
    setError(null);
    setCurrentCategories((prev) =>
      prev.map((item) =>
        item.category === category
          ? {
              ...item,
              divisions: item.divisions.map((current, index) =>
                index === divisionIndex ? { ...current, name: value } : current,
              ),
            }
          : item,
      ),
    );
    if (previousName && previousName !== value) {
      setDivSchedule((prev) =>
        prev.map((entry) =>
          entry.division === previousName ? { ...entry, division: value } : entry,
        ),
      );
    }
  };

  const removeDivision = (category: string, divisionIndex: number) => {
    const removedName = getCurrentDivisionName(category, divisionIndex);
    if (!removedName) return;
    if (!confirm(`"${removedName}" 디비전을 삭제할까요?`)) return;

    setSyncResult(null);
    setError(null);
    setCurrentCategories((prev) =>
      prev
        .map((item) =>
          item.category === category
            ? {
                ...item,
                divisions: item.divisions.filter((_, index) => index !== divisionIndex),
              }
            : item,
        )
        .filter((item) => item.divisions.length > 0),
    );
    setDivSchedule((prev) =>
      prev.filter((entry) => entry.division !== removedName),
    );
  };

  const updateDivisionNumber = (
    category: string,
    divisionIndex: number,
    key: "cap" | "fee",
    value: string,
  ) => {
    const numberValue = value === "" ? null : Math.max(0, Number(value));
    setCurrentCategories((prev) =>
      prev.map((item) =>
        item.category === category
          ? {
              ...item,
              divisions: item.divisions.map((current, index) =>
                index === divisionIndex
                  ? { ...current, [key]: numberValue }
                  : current,
              ),
            }
          : item,
      ),
    );
  };

  const getDivisionSchedule = (division: string) => {
    const entry = divSchedule.find((item) => item.division === division);
    return {
      dateId: entry?.date_id ?? "",
      courtId: entry?.court_id ?? "",
    };
  };

  const updateDivisionSchedule = (
    division: string,
    patch: Partial<Pick<DivScheduleEntry, "date_id" | "court_id">>,
  ) => {
    setSyncResult(null);
    setDivSchedule((prev) => {
      const existing = prev.find((item) => item.division === division);
      const next = {
        division,
        date_id: patch.date_id !== undefined ? patch.date_id : existing?.date_id,
        court_id: patch.court_id !== undefined ? patch.court_id : existing?.court_id,
      };
      const withoutCurrent = prev.filter((item) => item.division !== division);
      if (!next.date_id && !next.court_id) return withoutCurrent;
      return [...withoutCurrent, next];
    });
  };

  const syncDivisions = async () => {
    const normalizedCategories = currentCategories
      .map((item) => ({
        ...item,
        divisions: item.divisions.map((division) => ({
          ...division,
          name: division.name.trim(),
        })),
      }))
      .filter((item) => item.divisions.length > 0);
    const divisionNames = normalizedCategories.flatMap((item) =>
      item.divisions.map((division) => division.name),
    );
    if (divisionNames.some((name) => name.length === 0)) {
      setError("디비전명을 입력해 주세요.");
      return;
    }
    const duplicateNames = divisionNames.filter(
      (name, index) => divisionNames.indexOf(name) !== index,
    );
    if (duplicateNames.length > 0) {
      setError(`디비전명이 중복되었습니다: ${[...new Set(duplicateNames)].join(", ")}`);
      return;
    }
    const categories = Object.fromEntries(
      normalizedCategories.map((item) => [
        item.category,
        item.divisions.map((division) => division.name),
      ]),
    );
    const divCaps = Object.fromEntries(
      normalizedCategories.flatMap((item) =>
        item.divisions
          .filter((division) => division.cap != null)
          .map((division) => [division.name, division.cap]),
      ),
    );
    const divFees = Object.fromEntries(
      normalizedCategories.flatMap((item) =>
        item.divisions
          .filter((division) => division.fee != null)
          .map((division) => [division.name, division.fee]),
      ),
    );
    const selectedDivisionNames = new Set(
      normalizedCategories.flatMap((item) =>
        item.divisions.map((division) => division.name),
      ),
    );
    const divScheduleMap = Object.fromEntries(
      divSchedule
        .filter(
          (entry) =>
            selectedDivisionNames.has(entry.division.trim()) &&
            entry.date_id &&
            entry.court_id,
        )
        .map((entry) => [
          entry.division.trim(),
          { dateId: entry.date_id, courtId: entry.court_id },
        ]),
    );

    setSyncing(true);
    setError(null);
    setSyncResult(null);
    try {
      const res = await fetch(
        `/api/web/admin/tournaments/${tournamentId}/division-rules`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ categories, divCaps, divFees, divSchedule: divScheduleMap }),
        },
      );
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "종별 저장 실패");
        return;
      }

      setRules((json.rules ?? []) as DivisionRule[]);
      setCurrentCategories((json.current_categories ?? []) as CurrentCategory[]);
      setDivSchedule(
        Array.isArray(json.div_schedule)
          ? (json.div_schedule as DivScheduleEntry[])
          : [],
      );
      const result = json.sync_result;
      setSyncResult(
        result
          ? `저장 완료 · 신규 ${result.created ?? 0}건 · 갱신 ${result.updated ?? 0}건 · 삭제 ${result.deleted ?? 0}건`
          : "저장 완료",
      );
    } catch {
      setError("네트워크 오류");
    } finally {
      setSyncing(false);
    }
  };

  // 2026-05-12 Phase 3.5-C — 종별 진출 매핑 수동 실행
  const advanceDivision = async (ruleId: string, code: string) => {
    if (!confirm(`"${code}" 종별 진출 매핑을 실행하시겠어요?\n\n예선 순위를 기준으로 순위전 경기를 자동으로 채웁니다.`)) return;
    setAdvancingId(ruleId);
    setAdvanceResult(null);
    setError(null);
    try {
      const res = await fetch(
        `/api/web/admin/tournaments/${tournamentId}/division-rules/${ruleId}/advance`,
        { method: "POST" },
      );
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "매핑 실패");
        return;
      }
      setAdvanceResult({
        code: json.division_code,
        updated: json.updated,
        skipped: json.skipped,
      });
    } catch {
      setError("네트워크 오류");
    } finally {
      setAdvancingId(null);
    }
  };

  const updateRule = async (
    ruleId: string,
    patch: { format?: string | null; settings?: Record<string, unknown> }
  ) => {
    setSavingId(ruleId);
    setError(null);
    try {
      const res = await fetch(
        `/api/web/admin/tournaments/${tournamentId}/division-rules/${ruleId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(patch),
        }
      );
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "저장 실패");
        return;
      }
      // 낙관적 갱신
      setRules((prev) =>
        prev.map((r) =>
          r.id === ruleId
            ? {
                ...r,
                format: patch.format ?? r.format,
                settings: patch.settings ?? r.settings,
              }
            : r
        )
      );
    } catch {
      setError("네트워크 오류");
    } finally {
      setSavingId(null);
    }
  };

  const courtOptions = allCourts(places);

  if (loading) {
    return (
      <div data-skin="toss" className="space-y-4">
        <div className="h-8 w-48 animate-pulse rounded bg-[var(--color-surface)]" />
        <div className="h-32 animate-pulse rounded-lg bg-[var(--color-surface)]" />
      </div>
    );
  }

  return (
    // Track B-c — Toss 토큰 적용 루트 opt-in
    <div data-skin="toss" className="space-y-4">

      {error && (
        <div
          className="rounded-[4px] border p-3 text-sm"
          style={{
            borderColor: "var(--color-error)",
            background: "color-mix(in srgb, var(--color-error) 8%, transparent)",
            color: "var(--color-error)",
          }}
        >
          {error}
        </div>
      )}

      <section className="rounded-[18px] bg-[var(--grey-50)] p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 gap-3">
            <div className="ct-headicon">
              <Icon name="category" size={18} color="var(--primary)" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-bold text-[var(--ink)]">
                종별 구성
              </h2>
              <p className="mt-1 text-sm text-[var(--ink-mute)]">
                대회 생성과 같은 종별 마스터를 사용합니다.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={syncDivisions}
            disabled={syncing}
            className="ts-btn ts-btn--primary ts-btn--sm"
          >
            {syncing ? "저장 중..." : "종별 저장"}
          </button>
        </div>

        {syncResult && (
          <div
            className="mt-3 rounded-[4px] border px-3 py-2 text-sm"
            style={{
              borderColor: "var(--color-success)",
              background: "color-mix(in srgb, var(--color-success) 8%, transparent)",
              color: "var(--color-success)",
            }}
          >
            {syncResult}
          </div>
        )}

        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          {masterCategories.map((category) => {
            const selected = currentCategories.find(
              (item) => item.category === category.name,
            );
            return (
              <div
                key={category.id}
                className="rounded-[16px] border bg-[var(--card)] p-3"
                style={{
                  borderColor: "var(--color-border)",
                }}
              >
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-semibold text-[var(--ink)]">
                    {category.name}
                  </h3>
                  <span className="ts-badge ts-badge--grey">
                    {selected?.divisions.length ?? 0}개 선택
                  </span>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {category.divisions.map((division) => {
                    const checked = isDivisionSelected(category.name, division);
                    return (
                      <button
                        key={division}
                        type="button"
                        onClick={() => toggleDivision(category.name, division)}
                        data-active={checked}
                        className="ts-chip"
                      >
                        {checked && <Icon name="check" size={14} />}
                        {division}
                      </button>
                    );
                  })}
                </div>

                {selected && selected.divisions.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {selected.divisions.map((division, divisionIndex) => {
                      const schedule = getDivisionSchedule(division.name);
                      const selectedDate = scheduleDates.find(
                        (date) => date.id === schedule.dateId,
                      );
                      const availableCourts =
                        selectedDate?.court_ids?.length
                          ? courtOptions.filter((court) =>
                              selectedDate.court_ids?.includes(court.id),
                            )
                          : courtOptions;

                      return (
                        <div
                          key={`${category.name}-${divisionIndex}`}
                          className="grid gap-2 sm:grid-cols-2 xl:grid-cols-[minmax(112px,1fr)_88px_100px_minmax(128px,1.15fr)_minmax(136px,1.2fr)_44px]"
                        >
                          <input
                            type="text"
                            value={division.name}
                            onChange={(e) =>
                              updateDivisionName(
                                category.name,
                                divisionIndex,
                                e.target.value,
                              )
                            }
                            className="ts-input min-h-[44px] font-semibold"
                            aria-label={`${category.name} 디비전명`}
                            placeholder="디비전명"
                          />
                          <input
                            type="number"
                            min={0}
                            value={division.cap ?? ""}
                            onChange={(e) =>
                              updateDivisionNumber(
                                category.name,
                                divisionIndex,
                                "cap",
                                e.target.value,
                              )
                            }
                            className="ts-input min-h-[44px]"
                            placeholder="정원"
                          />
                          <input
                            type="number"
                            min={0}
                            step={1000}
                            value={division.fee ?? ""}
                            onChange={(e) =>
                              updateDivisionNumber(
                                category.name,
                                divisionIndex,
                                "fee",
                                e.target.value,
                              )
                            }
                            className="ts-input min-h-[44px]"
                            placeholder="참가비"
                          />
                          <select
                            value={schedule.dateId}
                            onChange={(e) =>
                              updateDivisionSchedule(division.name, {
                                date_id: e.target.value,
                                court_id: "",
                              })
                            }
                            className="ts-select min-h-[44px]"
                          >
                            <option value="">일정 선택</option>
                            {scheduleDates.map((date) => (
                              <option key={date.id} value={date.id}>
                                {date.date}
                              </option>
                            ))}
                          </select>
                          <select
                            value={schedule.courtId}
                            onChange={(e) =>
                              updateDivisionSchedule(division.name, {
                                court_id: e.target.value,
                              })
                            }
                            className="ts-select min-h-[44px]"
                          >
                            <option value="">체육관 선택</option>
                            {availableCourts.map((court) => (
                              <option key={court.id} value={court.id}>
                                {court.full}
                              </option>
                            ))}
                          </select>
                          <button
                            type="button"
                            onClick={() => removeDivision(category.name, divisionIndex)}
                            className="ts-btn ts-btn--ghost min-h-[44px] px-0"
                            aria-label={`${division.name || "디비전"} 삭제`}
                            title="삭제"
                          >
                            <Icon name="trash-2" size={18} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {rules.length === 0 ? (
        /*
          2026-05-28 PR-1C-12 박제 — 시안 adv-empty (빈 상태 발견성 강화).
          사유: 운영 평면 텍스트 → 시안의 아이콘 + 종별 개념 안내 + 마법사 진입 CTA 로 보강.
          dashed border = 시안 adv-empty 점선 박스를 운영 토큰으로 치환.
        */
        <div className="ct-emptybox ct-emptybox--tall">
            {/* Material category → lucide layout-grid */}
            <Icon name="layout-grid" size={48} color="var(--color-text-muted)" />
            <div className="text-base font-bold text-[var(--ink)]">
              저장된 종별이 없습니다
            </div>
            <div className="max-w-md text-sm text-[var(--ink-mute)]">
              위에서 종별을 선택하고 저장하세요.
            </div>
        </div>
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {rules.map((r) => (
            <article key={r.id} className="rounded-[18px] border bg-[var(--card)] p-4" style={{ borderColor: "var(--color-border)" }}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  {/*
                    2026-05-28 PR-1C-12 박제 — 시안 adv-card__head (code 모노 칩 + 종별명).
                    사유: 운영 평면 "code (label)" → 시안의 code 모노 칩(blue-soft 배경) + 라벨로 시각 강화.
                    --color-info 8% 틴트 = 시안 adv-card__name 의 cafe-blue-soft 칩을 운영 토큰으로 치환.
                  */}
                  <p className="flex items-center gap-2 font-semibold text-[var(--ink)]">
                    <span
                      className="rounded-[4px] px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wide"
                      style={{
                        color: "var(--color-info)",
                        background: "color-mix(in srgb, var(--color-info) 12%, transparent)",
                      }}
                    >
                      {r.code}
                    </span>
                    {r.label}
                  </p>
                  <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">
                    {/* 2026-05-12 룰 변경: 어린 학년 자유 참가 — gradeMax 이하 표시 */}
                    {r.grade_max != null ? `${r.grade_max}학년 이하` : "학년 제한 없음"} · 참가비 {r.fee_krw.toLocaleString()}원
                  </p>
                  {/*
                    2026-06-22 F-2b — 디비전별 경기 날짜/코트 표시.
                    div_schedule 배열에서 division ↔ DivisionRule.label 우선 매칭, 없으면 code 폴백.
                    역참조 실패(매칭/값 부재/룩업 실패)는 "–" 로 graceful 표시.
                  */}
                  {(() => {
                    const { dateLabel, courtLabel } = resolveDivisionSchedule(
                      divSchedule,
                      r.label,
                      r.code,
                      scheduleDates,
                      places,
                    );
                    return (
                      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                        <span className="inline-flex items-center gap-1 rounded-[4px] border px-1.5 py-0.5 text-[11px] font-medium text-[var(--color-text-muted)]"
                          style={{ borderColor: "var(--color-border)", background: "var(--color-elevated)" }}>
                          <Icon name="calendar" size={12} />
                          {dateLabel ?? "–"}
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-[4px] border px-1.5 py-0.5 text-[11px] font-medium text-[var(--color-text-muted)]"
                          style={{ borderColor: "var(--color-border)", background: "var(--color-elevated)" }}>
                          <Icon name="map-pin" size={12} />
                          {courtLabel ?? "–"}
                        </span>
                      </div>
                    );
                  })()}
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs text-[var(--color-text-muted)]">진행 방식:</label>
                  <select
                    value={r.format ?? ""}
                    disabled={savingId === r.id}
                    onChange={(e) =>
                      updateRule(r.id, { format: e.target.value || null })
                    }
                    className="ts-select min-w-[160px]"
                  >
                    <option value="">대회 방식 사용</option>
                    {allowedFormats.map((f) => (
                      <option key={f} value={f}>
                        {/* FORMAT_LABEL 타입 = DivisionFormat narrow → string indexing 위해 cast (런타임은 ?? f 폴백) */}
                        {(FORMAT_LABEL as Record<string, string>)[f] ?? f}
                      </option>
                    ))}
                  </select>
                  {savingId === r.id && (
                    <span className="text-xs text-[var(--color-text-muted)]">저장 중...</span>
                  )}
                </div>
              </div>

              {/* 2026-05-12 Phase 3.5-D — 조 크기 / 조 개수 입력 (풀리그 기반 진행 방식만) */}
              {showGroupSettings(r.format) && (
                <GroupSettingsInputs
                  ruleId={r.id}
                  format={r.format}
                  settings={r.settings}
                  saving={savingId === r.id}
                  onSave={(patch) => updateRule(r.id, { settings: patch })}
                />
              )}

              {/* 2026-05-12 Phase 3.5-C — 진출 매핑 수동 실행 */}
              <div className="mt-2 flex items-center justify-between">
                <p className="text-xs text-[var(--color-text-muted)]">
                  예선 순위 기준 순위전 자동 매핑
                </p>
                <button
                  type="button"
                  onClick={() => advanceDivision(r.id, r.code)}
                  disabled={advancingId === r.id}
                  className="ts-btn ts-btn--secondary ts-btn--sm"
                >
                  {advancingId === r.id ? "실행 중..." : "진출 매핑 실행"}
                </button>
              </div>

              {/* 매핑 결과 — 해당 종별만 표시 */}
              {advanceResult && advanceResult.code === r.code && (
                <div
                  className="mt-2 rounded-[4px] border p-2 text-xs"
                  style={{
                    borderColor: "var(--color-success)",
                    background: "color-mix(in srgb, var(--color-success) 8%, transparent)",
                    color: "var(--color-success)",
                  }}
                >
                  매핑 완료 · 갱신 {advanceResult.updated}건 · 제외 {advanceResult.skipped}건
                </div>
              )}
            </article>
          ))}
        </div>
      )}

    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// 2026-05-12 Phase 3.5-D — 조 설정 입력 컴포넌트 (group_size / group_count / ranking_format)
// ─────────────────────────────────────────────────────────────────────────
//
// 동작:
//   - 진행 방식이 풀리그 기반일 때만 노출 (showGroupSettings 가드)
//   - 입력값 변경 → onSave 호출 (debounce 없음 — onBlur 기준)
//   - 신규 enum (group_stage_with_ranking) 시 ranking_format select 추가 노출
//   - 빈 값 = undefined 박제 (settings JSON 에서 제외)
//
// 검증:
//   - 1~32 정수 (서버 zod 와 동일)
//   - 음수/소수/0 입력 시 input 자체가 거부 (min/max/step)
//
function GroupSettingsInputs(props: {
  ruleId: string;
  format: string | null;
  settings: Record<string, unknown> | null;
  saving: boolean;
  onSave: (settings: Record<string, unknown>) => void;
}) {
  const { format, settings, saving, onSave } = props;
  const isDualTournament = format === "dual_tournament";

  // 기존 settings 의 group_size / group_count / ranking_format / advance_per_group 추출 (legacy 키 호환)
  const initialGroupSize =
    typeof settings?.group_size === "number" ? settings.group_size : null;
  const initialGroupCount =
    typeof settings?.group_count === "number" ? settings.group_count : null;
  const initialRankingFormat =
    typeof settings?.ranking_format === "string"
      ? (settings.ranking_format as string)
      : "round_robin";
  // 2026-05-13 — 조별 본선 진출 팀 수 (default 2 = 생활체육 표준 1·2위 진출)
  const initialAdvancePerGroup =
    typeof settings?.advance_per_group === "number" ? settings.advance_per_group : null;

  // 로컬 상태 (input 입력값) — 빈 문자열 허용 (사용자가 일시적으로 비울 수 있음)
  const [groupSize, setGroupSize] = useState<string>(
    initialGroupSize != null ? String(initialGroupSize) : isDualTournament ? "4" : "",
  );
  const [groupCount, setGroupCount] = useState<string>(
    initialGroupCount != null ? String(initialGroupCount) : "",
  );
  const [rankingFormat, setRankingFormat] = useState<string>(initialRankingFormat);
  const [advancePerGroup, setAdvancePerGroup] = useState<string>(
    initialAdvancePerGroup != null ? String(initialAdvancePerGroup) : isDualTournament ? "2" : "",
  );

  // 총 팀 수 계산 (group_size × group_count) — division-formats.ts 헬퍼 사용
  const totalTeams = calculateTotalTeams(
    isDualTournament ? 4 : groupSize !== "" ? Number(groupSize) : null,
    groupCount !== "" ? Number(groupCount) : null,
  );
  const effectiveAdvancePerGroup = isDualTournament
    ? 2
    : advancePerGroup !== ""
      ? Number(advancePerGroup)
      : ADVANCE_PER_GROUP_DEFAULT;

  // 저장 트리거 — 기존 settings + 신규 키 머지 (legacy linkage_pairs / advanceCount 보존)
  const handleSave = () => {
    const next: Record<string, unknown> = { ...(settings ?? {}) };

    // group_size / group_count: 빈 값이면 키 삭제
    if (isDualTournament) next.group_size = 4;
    else if (groupSize === "") delete next.group_size;
    else next.group_size = Number(groupSize);

    if (groupCount === "") delete next.group_count;
    else next.group_count = Number(groupCount);

    // ranking_format: 신규 enum 일 때만 박제 (다른 format 은 의미 없음)
    if (showRankingFormat(format)) {
      next.ranking_format = rankingFormat;
    }

    // 2026-05-13 — advance_per_group: 조별리그→본선 enum (3개) 일 때만 박제
    // (group_stage_knockout / full_league_knockout / dual_tournament)
    if (shouldShowAdvancePerGroup(format)) {
      if (isDualTournament) next.advance_per_group = 2;
      else if (advancePerGroup === "") delete next.advance_per_group;
      else next.advance_per_group = Number(advancePerGroup);
    } else {
      // 노출 조건이 아닌 enum 으로 전환 시 기존 키 정리 (의미 없는 박제 잔존 방지)
      delete next.advance_per_group;
    }

    onSave(next);
  };

  return (
    <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
      <label className="ts-field text-xs text-[var(--ink-mute)]">
        {isDualTournament ? "조 크기 (고정)" : "조 크기 (팀)"}
        <input
          type="number"
          min={1}
          max={32}
          step={1}
          value={isDualTournament ? "4" : groupSize}
          disabled={saving || isDualTournament}
          onChange={(e) => setGroupSize(e.target.value)}
          onBlur={handleSave}
          className="ts-input mt-1"
          placeholder="4"
        />
      </label>
      <label className="ts-field text-xs text-[var(--ink-mute)]">
        조 개수
        <input
          type="number"
          min={1}
          max={32}
          step={1}
          value={groupCount}
          disabled={saving}
          onChange={(e) => setGroupCount(e.target.value)}
          onBlur={handleSave}
          className="ts-input mt-1"
          placeholder="4"
        />
      </label>
      {/* 2026-05-13 — 신규 enum 만 ranking_format 영역 노출. 단, group_count <= 2 이면 드롭다운 대신 안내문 노출
          (사용자 결재 §B: 2조 이하 = 어떤 방식이든 단판 1경기로 자동 매핑됨)
          드롭다운 라벨도 한국식: "풀리그" / "토너먼트" */}
      {showRankingFormat(format) && (
        groupCount !== "" && Number(groupCount) <= 2 ? (
          // 조 2개 이하 — 단판 안내문 (드롭다운 숨김 / settings.ranking_format 기본값 round_robin 박제 유지)
          <div className="text-xs text-[var(--ink-mute)]">
            <span className="block font-medium text-[var(--ink)]">동순위전 방식</span>
            <p
              className="mt-1 rounded-[12px] bg-[var(--grey-50)] px-3 py-2 text-xs leading-relaxed"
            >
              각 동순위전이 단판 경기로 자동 진행됩니다 (조 개수가 2조 이하)
            </p>
          </div>
        ) : (
          // 조 3개 이상 — 풀리그 / 토너먼트 선택 드롭다운
          <label className="ts-field text-xs text-[var(--ink-mute)]">
            동순위전 방식
            <select
              value={rankingFormat}
              disabled={saving}
              onChange={(e) => setRankingFormat(e.target.value)}
              onBlur={handleSave}
              className="ts-select mt-1"
            >
              {/* 2026-05-13 라벨 한국식 통일 — "싱글 엘리미네이션" → "토너먼트" */}
              <option value="round_robin">풀리그</option>
              <option value="single_elimination">토너먼트</option>
            </select>
          </label>
        )
      )}
      {/* 2026-05-13 — 조별 본선 진출 팀 수 (group_stage_knockout / full_league_knockout / dual_tournament 만)
          사유: 조별리그/풀리그 → 본선 토너먼트 enum 만 의미 있음 (조 N위까지 본선 진출).
          UI: group_size 가 max 상한 (조 크기 초과 진출 불가). default 2 = 생활체육 표준 1·2위 */}
      {shouldShowAdvancePerGroup(format) && (
        <label className="ts-field text-xs text-[var(--ink-mute)]">
          {isDualTournament ? "조별 진출 팀 수 (고정)" : "조별 본선 진출 팀 수"}
          <input
            type="number"
            min={1}
            max={isDualTournament ? 4 : groupSize !== "" ? Number(groupSize) : 32}
            step={1}
            value={isDualTournament ? "2" : advancePerGroup}
            disabled={saving || isDualTournament}
            onChange={(e) => setAdvancePerGroup(e.target.value)}
            onBlur={handleSave}
            className="ts-input mt-1"
            placeholder={`${ADVANCE_PER_GROUP_DEFAULT}`}
          />
        </label>
      )}
      {/* 총 팀 수 + 총 본선 진출 팀 수 안내 — 모든 컬럼 가로 펼침 */}
      <p className="col-span-2 text-xs text-[var(--color-text-muted)] sm:col-span-3">
        {totalTeams != null
          ? `총 ${totalTeams}팀 (${groupSize} × ${groupCount})`
          : "조 크기 × 조 개수 = 총 팀 수"}
        {shouldShowAdvancePerGroup(format) && groupCount !== "" && (
          <>
            {" / "}
            총 본선 진출 ={" "}
            {effectiveAdvancePerGroup * Number(groupCount)}
            팀
          </>
        )}
      </p>
    </div>
  );
}

````

### File: src/app/(admin)/tournament-admin/tournaments/[id]/_panels/matches-panel.tsx

````tsx
"use client";

import type { RecordingMode } from "@/lib/tournaments/recording-mode";
import { RecordingModeTriggerClient } from "../_components/recording-mode-trigger";
import MatchesClient from "../matches/matches-client";

type Props = {
  tournamentId: string;
  defaultMode: RecordingMode;
  matchStats: {
    total: number;
    paper: number;
    flutter: number;
    manual: number;
    inProgress: number;
  };
};

export default function MatchesPanel({ tournamentId, defaultMode, matchStats }: Props) {
  return (
    <div className="mt-4 space-y-4">
      <RecordingModeTriggerClient
        tournamentId={tournamentId}
        defaultMode={defaultMode}
        matchStats={matchStats}
      />
      <MatchesClient />
    </div>
  );
}

````

### File: src/app/(admin)/tournament-admin/tournaments/[id]/_panels/recorders-panel.tsx

````tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// 2026-06-13 HOTFIX: GET 응답은 apiSuccess→convertKeysToSnakeCase 거쳐 snake_case.
//   camelCase(recorderId/isActive/createdAt)로 읽으면 전 행 undefined → 빈 목록 버그.
type Recorder = {
  id: string;
  recorder_id: string;
  is_active: boolean;
  created_at: string;
  recorder: {
    id: string;
    nickname: string | null;
    email: string;
    profile_image_url: string | null;
  };
};

// Track B-d — 경기별 기록자 배정용 매치 타입.
//   GET /matches 응답(snake_case). settings.recorder_id 가 경기별 배정된 기록자 userId(string).
type MatchRow = {
  id: string;
  // 2026-06-21 정합: GET /matches 응답은 apiSuccess→convertKeysToSnakeCase 거쳐 snake_case.
  //   Prisma 필드 roundName/scheduledAt 은 응답에서 round_name/scheduled_at 로 변환됨.
  //   camelCase 로 읽으면 round_name 라벨이 항상 fallback("라운드 N")으로만 떨어짐 → snake 로 교정.
  round_name: string | null;
  round_number: number | null;
  match_number: number | null;
  scheduled_at: string | null;
  venue_name: string | null;
  homeTeam: { team: { name: string } } | null;
  awayTeam: { team: { name: string } } | null;
  settings: { recorder_id?: string | null; division_code?: string | null; [k: string]: unknown } | null;
};

// 매치 settings 에서 경기별 배정된 기록자 userId 추출 (없으면 null).
function getMatchRecorderId(m: MatchRow): string | null {
  const s = m.settings as Record<string, unknown> | null;
  if (!s) return null;
  const rid = s.recorder_id;
  return rid != null && rid !== "" ? String(rid) : null;
}

export default function TournamentRecordersPage() {
  const { id } = useParams<{ id: string }>();
  const [recorders, setRecorders] = useState<Recorder[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Track B-d — 경기별 기록자 배정 state
  const [matches, setMatches] = useState<MatchRow[]>([]);
  const [matchesLoading, setMatchesLoading] = useState(true);
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [autoAssigning, setAutoAssigning] = useState(false);
  const [matchError, setMatchError] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/web/tournaments/${id}/recorders`);
      if (res.ok) setRecorders(await res.json());
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  }, [id]);

  // Track B-d — 경기 목록 로드 (경기별 배정 현황 표시용)
  const loadMatches = useCallback(async () => {
    try {
      const res = await fetch(`/api/web/tournaments/${id}/matches`);
      if (res.ok) setMatches(await res.json());
    } catch { /* ignore */ } finally {
      setMatchesLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { loadMatches(); }, [loadMatches]);

  const addRecorder = async () => {
    if (!email.trim()) return;
    setAdding(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch(`/api/web/tournaments/${id}/recorders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "추가 실패");
      setEmail("");
      setSuccess(`${data.recorder?.nickname ?? email} 님을 기록원으로 추가했습니다.`);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "오류 발생");
    } finally {
      setAdding(false);
    }
  };

  const removeRecorder = async (recorderId: string, name: string) => {
    if (!confirm(`${name} 님의 기록원 권한을 제거하시겠습니까?`)) return;
    try {
      await fetch(`/api/web/tournaments/${id}/recorders`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recorderId }),
      });
      await load();
    } catch { /* ignore */ }
  };

  const activeRecorders = recorders.filter((r) => r.is_active);

  // Track B-d — 경기별 기록자 배정/해제 (settings.recorder_id PATCH).
  //   recorderUserId="" → 해제. 풀 인원만 select 에 노출되므로 클라단 검증 추가 불요(서버 풀 검증 존재).
  const assignRecorder = async (matchId: string, recorderUserId: string) => {
    setAssigningId(matchId);
    setMatchError("");
    try {
      const res = await fetch(
        `/api/web/tournaments/${id}/matches/${matchId}/recorder`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          // snake_case 키 — 서버가 body.recorder_id 로 수신
          body: JSON.stringify({ recorder_id: recorderUserId || null }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "배정 실패");
      // 낙관 갱신 — 해당 매치 settings.recorder_id 만 로컬 반영
      setMatches((prev) =>
        prev.map((m) =>
          m.id === matchId
            ? {
                ...m,
                settings: {
                  ...(m.settings ?? {}),
                  recorder_id: recorderUserId || null,
                },
              }
            : m
        )
      );
    } catch (e) {
      setMatchError(e instanceof Error ? e.message : "오류 발생");
      // 실패 시 서버 진실로 재동기화
      await loadMatches();
    } finally {
      setAssigningId(null);
    }
  };

  // Track B-d — 자동 배정 (풀 라운드로빈). 미배정 경기만 채움(overwrite=false).
  const autoAssign = async () => {
    if (activeRecorders.length === 0) {
      setMatchError("먼저 기록원 풀에 인원을 추가하세요.");
      return;
    }
    if (!confirm("미배정 경기에 기록원 풀을 순환 배정합니다. 진행할까요?")) return;
    setAutoAssigning(true);
    setMatchError("");
    try {
      const res = await fetch(
        `/api/web/tournaments/${id}/recorders/auto-assign`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ overwrite: false }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "자동 배정 실패");
      await loadMatches(); // 서버 결과로 전체 재동기화
    } catch (e) {
      setMatchError(e instanceof Error ? e.message : "오류 발생");
    } finally {
      setAutoAssigning(false);
    }
  };

  // 기록자 userId → 표시명 매핑 (활성 풀에서 조회)
  const recorderNameById = (userId: string | null): string => {
    if (!userId) return "미배정";
    const found = activeRecorders.find((r) => r.recorder_id === userId);
    return found ? (found.recorder.nickname ?? found.recorder.email) : "(풀 외 인원)";
  };

  // 미배정 경기 수 (자동배정 버튼 보조 안내)
  const unassignedCount = matches.filter((m) => !getMatchRecorderId(m)).length;

  return (
    // Track B-c — Toss 토큰 적용 루트 opt-in
    <div data-skin="toss" className="max-w-2xl mx-auto p-6 space-y-6">
      {/* 헤더 */}
      <div className="flex items-center gap-3">
        <Link
          href={`/tournament-admin/tournaments/${id}`}
          className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
        >
          ← 대회 관리
        </Link>
        <h1 className="text-xl font-bold">기록원 관리</h1>
      </div>

      {/* 기록원 추가 */}
      <Card className="p-4 space-y-3">
        <h2 className="font-semibold text-[var(--color-text-primary)]">기록원 추가</h2>
        <p className="text-sm text-[var(--color-text-muted)]">
          mybdr 가입 회원의 이메일로 기록원을 지정합니다. 기록원은 bdr_stat 앱으로 경기를 실시간 기록할 수 있습니다.
        </p>
        <div className="flex gap-2">
          <input
            type="email"
            placeholder="이메일 주소"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => {
              if (e.nativeEvent.isComposing) return;
              if (e.key === "Enter") addRecorder();
            }}
            className="flex-1 px-3 py-2 border border-[var(--color-border)] rounded-lg bg-[var(--color-surface)] text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/50"
          />
          <Button onClick={addRecorder} disabled={adding || !email.trim()}>
            {adding ? "추가 중..." : "추가"}
          </Button>
        </div>
        {error && <p className="text-sm text-[var(--color-error)]">{error}</p>}
        {success && <p className="text-sm text-[var(--color-success)]">{success}</p>}
      </Card>

      {/* 기록원 목록 */}
      <Card className="p-4 space-y-3">
        <h2 className="font-semibold text-[var(--color-text-primary)]">
          현재 기록원 {activeRecorders.length > 0 && `(${activeRecorders.length}명)`}
        </h2>

        {loading ? (
          <p className="text-sm text-[var(--color-text-muted)]">불러오는 중...</p>
        ) : activeRecorders.length === 0 ? (
          <p className="text-sm text-[var(--color-text-muted)]">등록된 기록원이 없습니다.</p>
        ) : (
          <ul className="space-y-2">
            {activeRecorders.map((r) => (
              <li
                key={r.id}
                className="flex items-center justify-between p-3 bg-[var(--color-elevated)] rounded-lg"
              >
                <div className="flex items-center gap-3">
                  {r.recorder.profile_image_url ? (
                    <Image
                      src={r.recorder.profile_image_url}
                      alt=""
                      width={32}
                      height={32}
                      className="w-8 h-8 rounded-full object-cover"
                      unoptimized /* 외부 프로필 이미지 URL — 도메인이 다양 */
                    />
                  ) : (
                    /* 2026-05-12 — admin 빨강 본문 금지 → info(Navy) 토큰 */
                    <div className="w-8 h-8 rounded-full bg-[var(--color-info)]/10 flex items-center justify-center text-[var(--color-info)] text-xs font-bold">
                      {(r.recorder.nickname ?? r.recorder.email)[0].toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium text-[var(--color-text-primary)]">
                      {r.recorder.nickname ?? r.recorder.email}
                    </p>
                    <p className="text-xs text-[var(--color-text-muted)]">{r.recorder.email}</p>
                  </div>
                </div>
                <button
                  onClick={() =>
                    removeRecorder(
                      r.recorder_id,
                      r.recorder.nickname ?? r.recorder.email
                    )
                  }
                  className="text-xs text-[var(--color-error)] hover:text-[var(--color-error)] px-2 py-1 rounded hover:bg-[var(--color-error)]/10"
                >
                  제거
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {/* Track B-d — 경기별 기록자 배정 (settings.recorder_id).
          위 "기록원 풀"에 등록된 인원을 개별 경기에 배정한다. */}
      <Card className="p-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-semibold text-[var(--color-text-primary)]">경기별 기록자 배정</h2>
          {/* 자동 배정 — 미배정 경기에 풀 라운드로빈 */}
          <Button
            variant="secondary"
            onClick={autoAssign}
            disabled={autoAssigning || activeRecorders.length === 0 || unassignedCount === 0}
            className="text-xs"
          >
            {autoAssigning ? "배정 중..." : "자동 배정"}
          </Button>
        </div>
        <p className="text-sm text-[var(--color-text-muted)]">
          위 풀에 등록된 기록원을 각 경기에 지정합니다.
          {unassignedCount > 0 && ` 미배정 ${unassignedCount}경기.`}
        </p>

        {matchError && <p className="text-sm text-[var(--color-error)]">{matchError}</p>}

        {matchesLoading ? (
          <p className="text-sm text-[var(--color-text-muted)]">불러오는 중...</p>
        ) : matches.length === 0 ? (
          <p className="text-sm text-[var(--color-text-muted)]">
            등록된 경기가 없습니다. 대진표를 먼저 생성하세요.
          </p>
        ) : activeRecorders.length === 0 ? (
          <p className="text-sm text-[var(--color-text-muted)]">
            먼저 기록원 풀에 인원을 추가하면 경기별 배정을 할 수 있습니다.
          </p>
        ) : (
          <ul className="space-y-2">
            {matches.map((m) => {
              const recorderId = getMatchRecorderId(m);
              // 라벨: 라운드/경기번호 + 대진(홈 vs 원정)
              const roundLabel =
                m.round_name ?? (m.round_number != null ? `라운드 ${m.round_number}` : "경기");
              const vsLabel = `${m.homeTeam?.team.name ?? "미정"} vs ${m.awayTeam?.team.name ?? "미정"}`;
              return (
                <li
                  key={m.id}
                  className="flex flex-col gap-2 p-3 bg-[var(--color-elevated)] rounded-lg sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">
                      {roundLabel}
                      {m.match_number != null && ` · #${m.match_number}`}
                    </p>
                    <p className="text-xs text-[var(--color-text-muted)] truncate">{vsLabel}</p>
                    {/* 현재 배정 상태 라벨 */}
                    <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                      배정:{" "}
                      <span className={recorderId ? "text-[var(--color-info)]" : ""}>
                        {recorderNameById(recorderId)}
                      </span>
                    </p>
                  </div>
                  {/* 기록자 select — 풀 활성 인원 + (미배정) */}
                  <select
                    value={recorderId ?? ""}
                    disabled={assigningId === m.id}
                    onChange={(e) => assignRecorder(m.id, e.target.value)}
                    className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/50 disabled:opacity-50 sm:w-48"
                  >
                    <option value="">(미배정)</option>
                    {activeRecorders.map((r) => (
                      <option key={r.recorder_id} value={r.recorder_id}>
                        {r.recorder.nickname ?? r.recorder.email}
                      </option>
                    ))}
                  </select>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}

````

### File: src/app/(admin)/tournament-admin/tournaments/[id]/_panels/site-panel.tsx

````tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { PanelLoadingState } from "./panel-loading-state";
import Link from "next/link";
import { Button } from "@/components/ui/button";
// 2026-05-11: BDR 브랜드 hex hardcode 단일화
import { BDR_PRIMARY_HEX } from "@/lib/constants/colors";

// ─── 상수 ─────────────────────────────────────────────────────────────────────

// 미리보기 시뮬레이션 — 사용자가 선택할 수 있는 사이트 템플릿의 미리보기용 hex.
// CSS 변수 (`var(--*)`) 미사용 의도: 미리보기 카드는 실제 사이트의 적용 결과를
// 시각적으로 시뮬레이션해야 함 → 사용자의 다크/라이트 모드 영향을 받지 않도록 고정 hex.
const TEMPLATES = [
  {
    slug: "classic-tournament",
    name: "Classic",
    desc: "깔끔한 화이트 배경의 모던 레이아웃",
    navBg: "#1B3C87",
    bg: "#F5F7FA",
    cardBg: "#FFFFFF",
  },
  {
    slug: "the-process",
    name: "Dark",
    desc: "강렬한 다크 배경의 대담한 스타일",
    navBg: "#1F2937",
    bg: "#0F172A",
    cardBg: "#1E293B",
  },
  {
    slug: "minimal-white",
    name: "Minimal",
    desc: "타이포그래피 중심의 미니멀한 느낌",
    navBg: "#FFFFFF",
    bg: "#FFFFFF",
    cardBg: "#F5F7FA",
  },
];

// 색상 팔레트 — 사용자가 대회 사이트 primary 색상으로 고를 수 있는 선택지.
// `BDR_PRIMARY_HEX` 만 lib/constants/colors.ts 단일 source 적용 (브랜드 원색은 단일 관리).
// 그 외 팔레트는 사용자 선택지 자체가 의도 → 별도 상수화 X.
const COLOR_PRESETS = [
  { hex: "#1B3C87", name: "토스 블루" },
  { hex: "#EF4444", name: "레드" },
  // 2026-05-11 fix — 기존 "오렌지" 라벨은 hex (#E31B23 = BDR Red) 와 불일치 → "BDR Red" 로 정정
  { hex: BDR_PRIMARY_HEX, name: "BDR Red" },
  { hex: "#22C55E", name: "그린" },
  { hex: "#8B5CF6", name: "퍼플" },
  { hex: "#FBBF24", name: "골드" },
  { hex: "#0EA5E9", name: "스카이" },
  { hex: "#1F2937", name: "다크" },
];

// ─── 타입 ─────────────────────────────────────────────────────────────────────

// 2026-05-15 (Snake-case sync fix) — apiSuccess() 가 응답 키를 자동 snake_case
// 변환하므로 GET /site 응답 = snake_case. 이전에 camelCase (isPublished) 로
// 정의해서 site?.isPublished = undefined → 발행 후 UI 전환 실패.
// errors.md "재발 5회" 패턴 6회째 회귀 차단.
type Site = {
  id: string;
  subdomain: string;
  is_published: boolean;
  primary_color: string | null;
  secondary_color: string | null;
  site_name: string | null;
  site_template_slug?: string | null;
};

// ─── 템플릿 미리보기 카드 ────────────────────────────────────────────────────

function TemplateMockup({
  template,
  accentColor,
}: {
  template: (typeof TEMPLATES)[0];
  accentColor: string;
}) {
  const nav = template.slug === "minimal-white" ? "#FFFFFF" : accentColor;
  const navTextColor = template.slug === "minimal-white" ? accentColor : "#FFFFFF";

  return (
    <div
      className="overflow-hidden rounded-md border-2 border-transparent"
      style={{ backgroundColor: template.bg, height: 120 }}
    >
      {/* 네비 */}
      <div
        className="flex h-7 items-center gap-1 px-2"
        style={{ backgroundColor: nav }}
      >
        <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: navTextColor, opacity: 0.5 }} />
        <div className="h-1.5 w-8 rounded-full" style={{ backgroundColor: navTextColor, opacity: 0.8 }} />
        <div className="ml-auto flex gap-1">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-1.5 w-4 rounded-full" style={{ backgroundColor: navTextColor, opacity: 0.5 }} />
          ))}
        </div>
      </div>
      {/* 히어로 */}
      <div className="mx-2 mt-2 h-5 rounded-lg" style={{ backgroundColor: accentColor, opacity: 0.15 }}>
        <div className="flex h-full items-center justify-center">
          <div className="h-1.5 w-16 rounded-full" style={{ backgroundColor: accentColor, opacity: 0.7 }} />
        </div>
      </div>
      {/* 콘텐츠 행 */}
      <div className="mx-2 mt-2 space-y-1.5">
        {[0.8, 0.5, 0.3].map((op, i) => (
          <div
            key={i}
            className="h-2 rounded-full"
            style={{ backgroundColor: template.cardBg, opacity: op, width: `${[80, 60, 45][i]}%` }}
          />
        ))}
      </div>
    </div>
  );
}

// ─── 메인 컴포넌트 ───────────────────────────────────────────────────────────

export default function TournamentSitePage() {
  const { id } = useParams<{ id: string }>();
  const [site, setSite] = useState<Site | null>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState("");

  // 상태
  const [selectedTemplate, setSelectedTemplate] = useState("classic-tournament");
  const [selectedColor, setSelectedColor] = useState("#1B3C87");
  const [subdomain, setSubdomain] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/web/tournaments/${id}/site`);
      if (res.ok) {
        // 2026-05-15 — 응답 = snake_case (apiSuccess 자동 변환). site_template relation 도 site_template 로 변환됨.
        const data: Site & { site_template?: { slug: string } | null } = await res.json();
        if (data?.id) {
          setSite(data);
          if (data.site_template?.slug) setSelectedTemplate(data.site_template.slug);
          if (data.primary_color) setSelectedColor(data.primary_color);
          if (data.subdomain) setSubdomain(data.subdomain);
        }
      }
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  // PATCH 저장 (템플릿 + 색상 + 서브도메인)
  const save = async (opts?: { andPublish?: boolean }) => {
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/web/tournaments/${id}/site`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subdomain: subdomain.trim().toLowerCase(),
          siteTemplateSlug: selectedTemplate,
          primaryColor: selectedColor,
          secondaryColor: selectedColor,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "저장 실패");
      await load();

      if (opts?.andPublish) {
        await togglePublish(true);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "오류 발생");
      setSaving(false);
      return false;
    }
    setSaving(false);
    return true;
  };

  const togglePublish = async (forcePublish?: boolean) => {
    setPublishing(true);
    setError("");
    try {
      const res = await fetch(`/api/web/tournaments/${id}/site/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publish: forcePublish ?? !site?.is_published }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "실패");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "오류 발생");
    } finally {
      setPublishing(false);
    }
  };

  const handleNextFromStep2 = async () => {
    // Step 2 → Step 3: subdomain 입력은 Step 3 에서 받음 → subdomain 있을 때만 중간 저장.
    // (2026-05-15 fix: subdomain 빈 상태 PATCH 시 BFF 가 400 "서브도메인이 필요합니다" 반환 → UX 차단.)
    if (subdomain.trim()) {
      const ok = await save();
      if (!ok) return;
    }
    setStep(3);
  };

  if (loading) return <PanelLoadingState label="사이트 설정을 준비 중입니다." />;

  // ─── 발행 완료 상태 ──────────────────────────────────────────────────────

  if (site?.is_published) {
    return (
      <div data-skin="toss">
        <div className="mb-6">
          <Link href={`/tournament-admin/tournaments/${id}`} className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]">
            ← 대회 관리
          </Link>
          <h1 className="mt-1 text-xl font-bold sm:text-2xl">사이트 관리</h1>
        </div>

        {/* 발행 중 상태 카드 */}
        <div className="mb-6 rounded-md border border-[var(--color-success)]/30 bg-[var(--color-success)]/5 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[var(--color-success)]">● 사이트 공개 중</p>
              <p className="mt-0.5 font-mono text-lg font-semibold text-[var(--color-text-primary)]">
                {site.subdomain}.mybdr.kr
              </p>
            </div>
            <div className="flex gap-2">
              {/* 2026-05-12 — pill 9999px ❌ → btn 클래스 (4px 라운딩 표준) */}
              <a
                href={`https://${site.subdomain}.mybdr.kr`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn--sm"
              >
                방문하기 ↗
              </a>
              <button
                onClick={() => togglePublish(false)}
                disabled={publishing}
                className="rounded-[4px] border border-[var(--color-error)]/30 px-4 py-2 text-sm text-[var(--color-error)] hover:bg-[var(--color-error)]/5 disabled:opacity-50"
              >
                {publishing ? "처리 중..." : "비공개 전환"}
              </button>
            </div>
          </div>
        </div>

        {/* [2026-04-22] 하드코딩 색상 → --color-* 토큰화 */}
        {error && (
          <div
            className="mb-4 rounded-md px-4 py-3 text-sm"
            style={{
              backgroundColor: "color-mix(in srgb, var(--color-error) 10%, transparent)",
              color: "var(--color-error)",
            }}
          >
            {error}
          </div>
        )}

        {/* 수정 버튼들 */}
        <div className="grid gap-3 md:grid-cols-3">
          <button
            onClick={() => setStep(1)}
            className="rounded-md border border-[var(--color-border)] bg-white p-5 text-left shadow-sm transition-shadow hover:shadow-md"
          >
            <p className="text-2xl mb-2">🎨</p>
            <p className="font-semibold text-[var(--color-text-primary)]">템플릿 변경</p>
            <p className="mt-0.5 text-sm text-[var(--color-text-muted)]">
              {TEMPLATES.find((t) => t.slug === selectedTemplate)?.name ?? "Classic"}
            </p>
          </button>
          <button
            onClick={() => setStep(2)}
            className="rounded-md border border-[var(--color-border)] bg-white p-5 text-left shadow-sm transition-shadow hover:shadow-md"
          >
            <div
              className="mb-2 h-8 w-8 rounded-full border-2 border-white shadow"
              style={{ backgroundColor: selectedColor }}
            />
            <p className="font-semibold text-[var(--color-text-primary)]">색상 변경</p>
            <p className="mt-0.5 font-mono text-sm text-[var(--color-text-muted)]">{selectedColor}</p>
          </button>
          <Link
            href={`/tournament-admin/tournaments/${id}#publish`}
            className="rounded-md border border-[var(--color-border)] bg-white p-5 text-left shadow-sm transition-shadow hover:shadow-md"
          >
            <p className="text-2xl mb-2">📄</p>
            <p className="font-semibold text-[var(--color-text-primary)]">공지 페이지</p>
            <p className="mt-0.5 text-sm text-[var(--color-text-muted)]">공지사항 작성</p>
          </Link>
        </div>

        {/* 스텝 1 오버레이 */}
        {step === 1 && (
          <Step1
            selected={selectedTemplate}
            accentColor={selectedColor}
            onChange={setSelectedTemplate}
            onNext={() => setStep(2)}
            onCancel={() => setStep(0)}
          />
        )}
        {step === 2 && (
          <Step2
            selected={selectedColor}
            onChange={setSelectedColor}
            onNext={handleNextFromStep2}
            onBack={() => setStep(1)}
            saving={saving}
          />
        )}
      </div>
    );
  }

  // ─── 위자드 (3단계) ──────────────────────────────────────────────────────

  return (
    // Track B-c — Toss 토큰 적용 루트 opt-in
    <div data-skin="toss">
      {/* 헤더 */}
      <div className="mb-8">
        <Link href={`/tournament-admin/tournaments/${id}`} className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]">
          ← 대회 관리
        </Link>
        <h1 className="mt-1 text-xl font-bold sm:text-2xl">사이트 만들기</h1>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
          3단계로 대회 전용 웹사이트를 만들어보세요
        </p>
      </div>

      {/* 진행 표시 */}
      <div className="mb-8 flex items-center gap-2">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div
              // 2026-05-12 — admin 빨강 본문 금지 (step indicator) → info(Navy)
              className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold transition-colors ${
                step === s
                  ? "bg-[var(--color-info)] text-white"
                  : step > s
                  ? "bg-[var(--color-success)] text-white"
                  : "bg-[var(--color-border)] text-[var(--color-text-muted)]"
              }`}
            >
              {step > s ? "✓" : s}
            </div>
            <span
              className={`text-sm font-medium ${
                step === s ? "text-[var(--color-text-primary)]" : "text-[var(--color-text-muted)]"
              }`}
            >
              {["템플릿", "색상", "발행"][s - 1]}
            </span>
            {s < 3 && <div className="h-px w-8 bg-[var(--color-border)]" />}
          </div>
        ))}
      </div>

      {/* [2026-04-22] 하드코딩 색상 → --color-* 토큰화 */}
      {error && (
        <div
          className="mb-4 rounded-md px-4 py-3 text-sm"
          style={{
            backgroundColor: "color-mix(in srgb, var(--color-error) 10%, transparent)",
            color: "var(--color-error)",
          }}
        >
          {error}
        </div>
      )}

      {/* 단계별 컨텐츠 */}
      {step === 1 && (
        <Step1
          selected={selectedTemplate}
          accentColor={selectedColor}
          onChange={setSelectedTemplate}
          onNext={() => setStep(2)}
        />
      )}

      {step === 2 && (
        <Step2
          selected={selectedColor}
          onChange={setSelectedColor}
          onNext={handleNextFromStep2}
          onBack={() => setStep(1)}
          saving={saving}
        />
      )}

      {step === 3 && (
        <Step3
          subdomain={subdomain}
          onChange={setSubdomain}
          selectedTemplate={selectedTemplate}
          selectedColor={selectedColor}
          siteId={site?.id}
          saving={saving || publishing}
          onBack={() => setStep(2)}
          onPublish={async () => {
            const ok = await save({ andPublish: true });
            if (!ok) return;
          }}
          onSaveDraft={async () => {
            await save();
          }}
          error={error}
        />
      )}
    </div>
  );
}

// ─── 스텝 1: 템플릿 선택 ────────────────────────────────────────────────────

function Step1({
  selected,
  accentColor,
  onChange,
  onNext,
  onCancel,
}: {
  selected: string;
  accentColor: string;
  onChange: (slug: string) => void;
  onNext: () => void;
  onCancel?: () => void;
}) {
  return (
    <div>
      <h2 className="mb-2 text-lg font-bold text-[var(--color-text-primary)]">템플릿 선택</h2>
      <p className="mb-6 text-sm text-[var(--color-text-muted)]">
        대회 사이트의 전체 스타일을 선택하세요. 언제든지 변경할 수 있습니다.
      </p>

      <div className="grid gap-4 md:grid-cols-3">
        {TEMPLATES.map((tpl) => (
          <button
            key={tpl.slug}
            onClick={() => onChange(tpl.slug)}
            className={`rounded-md border-2 p-4 text-left transition-all ${
              selected === tpl.slug
                ? "border-[var(--color-accent)] shadow-[0_0_0_4px_rgba(0,102,255,0.1)]"
                : "border-[var(--color-border)] hover:border-[var(--color-text-muted)]"
            }`}
          >
            <TemplateMockup template={tpl} accentColor={accentColor} />
            <div className="mt-3">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-[var(--color-text-primary)]">{tpl.name}</p>
                {selected === tpl.slug && (
                  /* 2026-05-12 — 선택됨 ✓ = 긍정 결과 → success(Green) (룰 11 — 승자/긍정 = success) */
                  <span className="text-xs font-medium text-[var(--color-success)]">선택됨 ✓</span>
                )}
              </div>
              <p className="mt-0.5 text-sm text-[var(--color-text-muted)]">{tpl.desc}</p>
            </div>
          </button>
        ))}
      </div>

      <div className="mt-8 flex justify-between">
        {onCancel && (
          <button onClick={onCancel} className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]">
            취소
          </button>
        )}
        <Button onClick={onNext} className="ml-auto">
          다음: 색상 선택 →
        </Button>
      </div>
    </div>
  );
}

// ─── 스텝 2: 색상 선택 ──────────────────────────────────────────────────────

function Step2({
  selected,
  onChange,
  onNext,
  onBack,
  saving,
}: {
  selected: string;
  onChange: (hex: string) => void;
  onNext: () => void;
  onBack: () => void;
  saving: boolean;
}) {
  return (
    <div>
      <h2 className="mb-2 text-lg font-bold text-[var(--color-text-primary)]">대표 색상 선택</h2>
      <p className="mb-6 text-sm text-[var(--color-text-muted)]">
        사이트 네비게이션과 강조 색상으로 사용됩니다.
      </p>

      {/* 색상 팔레트 */}
      <div className="flex flex-wrap gap-4">
        {COLOR_PRESETS.map((c) => (
          <button
            key={c.hex}
            onClick={() => onChange(c.hex)}
            title={c.name}
            className={`group relative flex flex-col items-center gap-2 ${
              selected === c.hex ? "" : "opacity-80 hover:opacity-100"
            }`}
          >
            <div
              className={`h-14 w-14 rounded-full shadow-md transition-transform ${
                selected === c.hex
                  ? "scale-110 ring-4 ring-[var(--color-accent)]/30 ring-offset-2"
                  : "hover:scale-105"
              }`}
              style={{ backgroundColor: c.hex }}
            />
            <span className="text-xs text-[var(--color-text-muted)]">{c.name}</span>
            {selected === c.hex && (
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-lg text-white drop-shadow">✓</span>
              </div>
            )}
          </button>
        ))}
      </div>

      {/* 미리보기 */}
      <div className="mt-8 rounded-md border border-[var(--color-border)] p-4">
        <p className="mb-3 text-xs font-medium text-[var(--color-text-muted)]">미리보기</p>
        <div className="overflow-hidden rounded-md" style={{ height: 64 }}>
          <div
            className="flex h-10 items-center gap-2 px-4"
            style={{ backgroundColor: selected }}
          >
            <div className="h-5 w-5 rounded-full bg-white/20" />
            <div className="h-2 w-20 rounded-full bg-white/80" />
            <div className="ml-auto flex gap-2">
              {["홈", "팀", "일정", "결과"].map((l) => (
                <span key={l} className="text-xs text-white/80">{l}</span>
              ))}
            </div>
          </div>
          <div
            className="flex items-center justify-center"
            style={{ height: 24, backgroundColor: `${selected}15` }}
          >
            <div className="h-1.5 w-24 rounded-full" style={{ backgroundColor: selected, opacity: 0.5 }} />
          </div>
        </div>
      </div>

      <div className="mt-8 flex justify-between">
        <button onClick={onBack} className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]">
          ← 이전
        </button>
        <Button onClick={onNext} disabled={saving}>
          {saving ? "저장 중..." : "다음: 주소 설정 →"}
        </Button>
      </div>
    </div>
  );
}

// ─── 스텝 3: 주소 설정 + 발행 ────────────────────────────────────────────────

function Step3({
  subdomain,
  onChange,
  selectedTemplate,
  selectedColor,
  siteId,
  saving,
  onBack,
  onPublish,
  onSaveDraft,
  error,
}: {
  subdomain: string;
  onChange: (v: string) => void;
  selectedTemplate: string;
  selectedColor: string;
  siteId?: string;
  saving: boolean;
  onBack: () => void;
  onPublish: () => void;
  onSaveDraft: () => void;
  error: string;
}) {
  const tplName = TEMPLATES.find((t) => t.slug === selectedTemplate)?.name ?? "Classic";

  return (
    <div>
      <h2 className="mb-2 text-lg font-bold text-[var(--color-text-primary)]">주소 설정 및 발행</h2>
      <p className="mb-6 text-sm text-[var(--color-text-muted)]">
        대회 사이트 URL을 설정하고 바로 공개하거나 임시 저장할 수 있습니다.
      </p>

      {/* 요약 */}
      <div className="mb-6 grid gap-3 rounded-md bg-[var(--color-surface)] p-4 md:grid-cols-2">
        <div>
          <p className="text-xs text-[var(--color-text-muted)]">선택한 템플릿</p>
          <p className="mt-1 font-semibold text-[var(--color-text-primary)]">{tplName}</p>
        </div>
        <div>
          <p className="text-xs text-[var(--color-text-muted)]">대표 색상</p>
          <div className="mt-1 flex items-center gap-2">
            <div
              className="h-5 w-5 rounded-full border border-white shadow-sm"
              style={{ backgroundColor: selectedColor }}
            />
            <span className="font-mono text-sm font-semibold text-[var(--color-text-primary)]">
              {selectedColor}
            </span>
          </div>
        </div>
      </div>

      {/* URL 설정 */}
      <div className="mb-6">
        <label className="mb-2 block text-sm font-medium text-[var(--color-text-primary)]">
          사이트 주소 <span className="text-[var(--color-error)]">*</span>
        </label>
        <div className="flex items-center gap-2">
          <input
            className="flex-1 rounded-md border-none bg-[var(--color-border)] px-4 py-3 text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/50"
            value={subdomain}
            onChange={(e) =>
              onChange(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))
            }
            placeholder="my-tournament"
            autoFocus
          />
          <span className="whitespace-nowrap text-sm font-medium text-[var(--color-text-muted)]">
            .mybdr.kr
          </span>
        </div>
        {subdomain && (
          <p className="mt-2 text-sm text-[var(--color-text-muted)]">
            https://<span className="text-[var(--color-info)]">{subdomain}</span>.mybdr.kr
          </p>
        )}
      </div>

      {/* [2026-04-22] 하드코딩 색상 → --color-* 토큰화 */}
      {error && (
        <div
          className="mb-4 rounded-md px-4 py-3 text-sm"
          style={{
            backgroundColor: "color-mix(in srgb, var(--color-error) 10%, transparent)",
            color: "var(--color-error)",
          }}
        >
          {error}
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
        <button
          onClick={onBack}
          className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
          disabled={saving}
        >
          ← 이전
        </button>
        <div className="flex gap-3">
          {/* 2026-05-12 — pill 9999px ❌ → btn 클래스 (4px 라운딩 표준) */}
          <button
            onClick={onSaveDraft}
            disabled={saving || !subdomain.trim()}
            className="btn disabled:opacity-40"
          >
            {saving ? "저장 중..." : "임시 저장"}
          </button>
          <Button
            onClick={onPublish}
            disabled={saving || !subdomain.trim()}
            className="min-w-[120px]"
          >
            {saving ? "처리 중..." : "🚀 공개하기"}
          </Button>
        </div>
      </div>

      <p className="mt-4 text-center text-xs text-[var(--color-text-muted)]">
        공개 후에도 언제든지 설정을 변경하거나 비공개로 전환할 수 있습니다
      </p>
    </div>
  );
}


````


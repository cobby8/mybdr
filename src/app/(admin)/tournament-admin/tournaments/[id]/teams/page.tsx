"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/card";
// 2026-05-16 PR-Admin-1 — 단계간 CTA (페이지 footer "다음: 대진표 생성 →")
import { NextStepCTA } from "../_components/NextStepCTA";

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
  rejected: "text-[var(--color-error)] bg-[rgba(239,68,68,0.1)]",
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
  const [divisionRules, setDivisionRules] = useState<Array<{ code: string; label: string }>>([]);
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
        setDivisionRules((json?.division_rules ?? []) as Array<{ code: string; label: string }>);
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
        showToast(`재발급 완료 — URL 복사됨 (만료 ${new Date(json.expires_at).toLocaleDateString("ko-KR")})`);
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

  if (loading)
    return <div className="flex h-40 items-center justify-center text-[var(--color-text-muted)]">불러오는 중...</div>;

  return (
    <div>
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
            title="모든 팀의 토큰 URL을 CSV 파일로 다운로드"
          >
            <span className="material-symbols-outlined text-base align-middle mr-1">download</span>
            CSV 다운로드 ({aliveTokenCount(tokenMap)})
          </button>
          <button
            type="button"
            onClick={() => copyAllTokenMessages(teams, tokenMap, showToast)}
            disabled={!aliveTokenCount(tokenMap)}
            className="btn btn--primary btn--sm"
            title="카톡 발송용 메시지 일괄 복사 (팀별 안내문 포함)"
          >
            <span className="material-symbols-outlined text-base align-middle mr-1">chat</span>
            카톡 메시지 복사
          </button>
          {/* 2026-05-11 Phase 3-B — 종별 standings 기반 순위전 placeholder 자동 채우기 */}
          <button
            type="button"
            onClick={() => advancePlaceholders(id, showToast)}
            className="btn btn--sm"
            style={{ background: "var(--color-info)", color: "#fff", borderColor: "var(--color-info)" }}
            title="모든 종별 예선 종료 후 순위전(A조 N위 vs B조 N위) 자동 매핑"
          >
            <span className="material-symbols-outlined text-base align-middle mr-1">trending_up</span>
            순위전 자동 채우기
          </button>
        </div>
      </div>

      {/* 등록 경로 통계 카드 (Phase 3-D 권장 4 — 강남구 일괄 박제 vs 코치 신청 구분 시각화) */}
      <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <ViaStatCard label="운영자 등록" count={viaStats.admin} icon="business_center" />
        <ViaStatCard label="코치 신청" count={viaStats.coach_token} icon="badge" />
        <ViaStatCard label="본인 신청" count={viaStats.self} icon="person" />
        <ViaStatCard label="경로 미상" count={viaStats.null} icon="help" />
      </div>

      {/* 통계 탭 — status 분류 + 코치 미입력 (운영자 박제 + 코치 명단 0건)
          2026-05-12 — 탭 필터 pill 9999px ❌ + admin 빨강 본문 금지 룰 → rounded-[4px] + info(Navy) 활성 톤.
          count 뱃지 (rounded-full px-1.5 py-0.5) = 작은 정사각형 chip → 보존 (룰 10 예외) */}
      <div className="mb-4 flex flex-wrap gap-2">
        {(["all", "pending", "approved", "rejected", "coach_pending"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`flex items-center gap-1.5 whitespace-nowrap rounded-[4px] px-4 py-2 text-sm transition-colors ${
              filter === s ? "bg-[var(--color-info)] font-semibold text-white" : "bg-[var(--color-elevated)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
            }`}
          >
            {s === "all" ? "전체" : s === "coach_pending" ? "코치 미입력" : STATUS_LABEL[s]}
            <span className="rounded-full bg-black/20 px-1.5 py-0.5 text-xs">{counts[s]}</span>
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <Card className="py-12 text-center text-[var(--color-text-muted)]">
          <div className="mb-2 text-3xl">
            <span className="material-symbols-outlined text-4xl">sports_basketball</span>
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
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div
                  className="flex cursor-pointer items-center gap-3"
                  onClick={() => toggleTeam(tt.id)}
                >
                  {/* 팀 색상 아이콘 */}
                  <div
                    className="h-10 w-10 rounded-full"
                    style={{ backgroundColor: tt.team.primaryColor ?? "var(--color-primary)" }}
                  />
                  <div>
                    {/* 팀명 + 배지 (Phase 3-D 권장 1 — applied_via 배지) */}
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold">{tt.team.name}</p>
                      <ViaBadge appliedVia={token?.appliedVia ?? null} />
                      <StatusBadge status={tt.status} />
                      {token?.waitingNumber && (
                        <span className="rounded-full bg-[var(--color-warning)]/15 px-2 py-0.5 text-xs font-medium text-[var(--color-warning)]">
                          대기 {token.waitingNumber}번
                        </span>
                      )}
                      {isCoachPending(tt) && (
                        <span className="rounded-full bg-[var(--color-info)]/15 px-2 py-0.5 text-xs font-medium text-[var(--color-info)]">
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
                  <span className="material-symbols-outlined text-[var(--color-text-muted)] text-lg">
                    {expandedTeamId === tt.id ? "expand_less" : "expand_more"}
                  </span>
                </div>

                <div className="flex items-center gap-3">
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
                      className={`flex items-center gap-1 rounded-[4px] px-3 py-1.5 text-xs font-medium ${
                        tokenAlive
                          ? "bg-[var(--color-info)]/10 text-[var(--color-info)] hover:bg-[var(--color-info)]/20"
                          : "cursor-not-allowed bg-[var(--color-elevated)] text-[var(--color-text-muted)] opacity-60"
                      }`}
                    >
                      <span className="material-symbols-outlined text-sm">
                        {tokenAlive ? "content_copy" : "link_off"}
                      </span>
                      {tokenAlive ? "URL 복사" : "만료"}
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
                  <span className={`rounded-full px-3 py-1 text-xs font-medium ${STATUS_COLOR[tt.status] ?? ""}`}>
                    {STATUS_LABEL[tt.status] ?? tt.status}
                  </span>

                  {/* 액션 버튼 */}
                  {tt.status === "pending" && (
                    <div className="flex gap-1">
                      <button
                        onClick={() => updateStatus(tt.id, "approved")}
                        disabled={actionLoading === tt.id}
                        className="rounded-[4px] bg-[var(--color-game-team)]/10 px-3 py-1.5 text-xs font-medium text-[var(--color-game-team)] hover:bg-[var(--color-game-team)]/20 disabled:opacity-50"
                      >
                        승인
                      </button>
                      <button
                        onClick={() => updateStatus(tt.id, "rejected")}
                        disabled={actionLoading === tt.id}
                        className="rounded-[4px] bg-[var(--color-error)]/10 px-3 py-1.5 text-xs font-medium text-[var(--color-error)] hover:bg-[var(--color-error)]/20 disabled:opacity-50"
                      >
                        거절
                      </button>
                    </div>
                  )}
                  {tt.status === "approved" && (
                    <button
                      onClick={() => updateStatus(tt.id, "rejected")}
                      disabled={actionLoading === tt.id}
                      className="rounded-[4px] bg-[var(--color-error)]/10 px-3 py-1.5 text-xs font-medium text-[var(--color-error)] hover:bg-[var(--color-error)]/20 disabled:opacity-50"
                    >
                      거절
                    </button>
                  )}
                  {tt.status === "rejected" && (
                    <button
                      onClick={() => updateStatus(tt.id, "approved")}
                      disabled={actionLoading === tt.id}
                      className="rounded-[4px] bg-[var(--color-game-team)]/10 px-3 py-1.5 text-xs font-medium text-[var(--color-game-team)] hover:bg-[var(--color-game-team)]/20 disabled:opacity-50"
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
          className="fixed top-20 right-4 z-50 rounded-[4px] border border-[var(--color-border)] bg-[var(--color-elevated)] px-4 py-3 text-sm text-[var(--color-text-primary)] shadow-md no-print"
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
            className="fixed inset-0 z-40 flex items-start justify-center overflow-y-auto p-4 no-print"
            style={{ background: "rgba(0,0,0,0.5)" }}
            onClick={() => { setExpandedTeamId(null); setPlayers([]); setShowAddForm(false); }}
          >
            <div
              id="team-detail-printable"
              className="relative my-4 w-full max-w-3xl rounded-[4px] border bg-[var(--color-elevated)] p-6"
              style={{ borderColor: "var(--color-border)" }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* 2026-05-12 — 닫기 X 버튼 우상단 절대 위치 (모달 표준 패턴) */}
              <button
                type="button"
                onClick={() => { setExpandedTeamId(null); setPlayers([]); setShowAddForm(false); }}
                className="absolute right-3 top-3 z-10 rounded-[4px] p-2 text-[var(--color-text-muted)] hover:bg-[var(--color-surface)] no-print"
                title="닫기"
                aria-label="닫기"
              >
                <span className="material-symbols-outlined">close</span>
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
                        className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase no-print"
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
                          className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase"
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
                    {/* 3. 납부 상태 배지 */}
                    <PaymentBadge status={token?.paymentStatus ?? null} />
                    {token?.waitingNumber && (
                      <span className="rounded-full bg-[var(--color-warning)]/15 px-2 py-0.5 text-xs font-medium text-[var(--color-warning)]">
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
                          className="w-24 rounded-[4px] border px-2 py-0.5 text-xs"
                          style={{ borderColor: "var(--color-border)", background: "var(--color-card)" }}
                        />
                        <input
                          type="tel"
                          value={managerForm.phone}
                          onChange={(e) => setManagerForm({ ...managerForm, phone: e.target.value })}
                          placeholder="010-XXXX-XXXX"
                          className="w-32 rounded-[4px] border px-2 py-0.5 text-xs"
                          style={{ borderColor: "var(--color-border)", background: "var(--color-card)" }}
                        />
                        <button
                          type="button"
                          onClick={() => saveManager(expandedTeam.id)}
                          className="rounded-[4px] px-2 py-0.5 text-[10px] font-medium text-white"
                          style={{ background: "var(--color-success)" }}
                        >
                          저장
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingManager(false)}
                          className="rounded-[4px] px-2 py-0.5 text-[10px]"
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
                          <span className="material-symbols-outlined text-xs">edit</span>
                        </button>
                      </>
                    )}
                    {token?.registeredBy?.nickname && <> · 신청자 {token.registeredBy.nickname}</>}
                  </p>
                  {/* 조 · 시드 변경 — Phase 3-F 옵션 A 후속: 시드 input 추가 */}
                  <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-[var(--color-text-muted)]">
                    {expandedTeam.groupName && <span>조 {expandedTeam.groupName}</span>}
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
                        className="w-14 rounded-[4px] border px-2 py-0.5 text-xs focus:outline-none focus:ring-1"
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
                      <span className="material-symbols-outlined text-xs">refresh</span>
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
                      <span className="material-symbols-outlined text-base align-middle mr-1">content_copy</span>
                      URL 복사
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
                        style={{ background: "var(--color-success)", color: "#fff", borderColor: "var(--color-success)" }}
                      >
                        승인
                      </button>
                      <button
                        type="button"
                        onClick={() => updateStatus(expandedTeam.id, "rejected")}
                        disabled={actionLoading === expandedTeam.id}
                        className="btn btn--sm"
                        style={{ background: "var(--color-error)", color: "#fff", borderColor: "var(--color-error)" }}
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
                    <span className="material-symbols-outlined text-base align-middle mr-1">print</span>
                    프린트
                  </button>
                  {/* 닫기 X 버튼은 모달 우상단 absolute 로 이동 (위 button.absolute.right-3.top-3) */}
                </div>
              </div>

              {/* 선수 명단 헤더 + 4. 진행률 (rosterMin/Max 대비) */}
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold">선수 명단 ({players.length}명)</h3>
                  <RosterProgressBadge
                    count={players.length}
                    min={rosterRule.min}
                    max={rosterRule.max}
                  />
                </div>
                <div className="flex gap-2 no-print">
                  <button
                    type="button"
                    onClick={() => setShowImportModal(true)}
                    className="btn btn--sm"
                    title="카톡 명단 텍스트 일괄 입력"
                  >
                    <span className="material-symbols-outlined text-base align-middle mr-1">content_paste</span>
                    일괄 입력
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddForm(!showAddForm)}
                    className="btn btn--primary btn--sm"
                  >
                    <span className="material-symbols-outlined text-base align-middle mr-1">person_add</span>
                    선수 추가
                  </button>
                </div>
              </div>

              {/* 선수 추가 폼 */}
              {showAddForm && (
                <div className="mb-4 rounded-[4px] bg-[var(--color-surface)] p-4 no-print">
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <input
                      type="text"
                      placeholder="이름 *"
                      value={addForm.player_name}
                      onChange={(e) => setAddForm({ ...addForm, player_name: e.target.value })}
                      className="rounded-[4px] border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
                    />
                    <input
                      type="text"
                      placeholder="전화번호"
                      value={addForm.phone}
                      onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })}
                      className="rounded-[4px] border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
                    />
                    <input
                      type="number"
                      placeholder="등번호"
                      value={addForm.jersey_number}
                      onChange={(e) => setAddForm({ ...addForm, jersey_number: e.target.value })}
                      className="rounded-[4px] border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
                    />
                    <input
                      type="text"
                      placeholder="포지션 (G, F 등)"
                      value={addForm.position}
                      onChange={(e) => setAddForm({ ...addForm, position: e.target.value })}
                      className="rounded-[4px] border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
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
                <div className="overflow-x-auto">
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
                              className="rounded-[4px] p-1 text-[var(--color-text-muted)] hover:bg-[var(--color-error)]/10 hover:text-[var(--color-error)]"
                              title="선수 삭제"
                            >
                              <span className="material-symbols-outlined text-lg">delete</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
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
          setError(json.error ?? "import 실패");
        }
        setSubmitting(false);
        return;
      }
      const warningNote = Array.isArray(json.warnings) && json.warnings.length > 0
        ? ` (경고 ${json.warnings.length}건)` : "";
      onSuccess(`${json.inserted_count}명 INSERT${overwrite ? ` / ${json.deleted_count}명 삭제` : ""}${warningNote}`);
    } catch {
      setError("네트워크 오류");
      setSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 no-print"
      style={{ background: "rgba(0,0,0,0.6)" }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl rounded-[4px] border bg-[var(--color-elevated)] p-6"
        style={{ borderColor: "var(--color-border)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 rounded-[4px] p-2 text-[var(--color-text-muted)] hover:bg-[var(--color-surface)]"
          aria-label="닫기"
        >
          <span className="material-symbols-outlined">close</span>
        </button>
        <h2 className="mb-4 text-lg font-bold">선수 일괄 입력</h2>
        <p className="mb-3 text-xs" style={{ color: "var(--color-text-muted)" }}>
          한 줄 한 명. 형식: <code className="rounded bg-black/10 px-1">이름/생년월일/등번호/포지션/학교명/부모님성함/부모님연락처</code>
        </p>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={10}
          placeholder={"홍길동/2017-05-16/7/G/강남초등학교/홍판서/010-1234-5678\n김철수/2017.8.22/12/F/잠실초등학교/김아빠/010-9876-5432"}
          className="w-full rounded-[4px] border px-3 py-2 text-sm font-mono focus:outline-none focus:ring-1"
          style={{
            borderColor: "var(--color-border)",
            background: "var(--color-card)",
            color: "var(--color-text-primary)",
          }}
        />
        <div className="mt-3 flex flex-wrap items-center gap-4 text-xs">
          <label className="flex items-center gap-1">
            <input type="checkbox" checked={overwrite} onChange={(e) => setOverwrite(e.target.checked)} />
            <span>기존 명단 전체 삭제 후 입력 (overwrite)</span>
          </label>
          <label className="flex items-center gap-1">
            <input type="checkbox" checked={strict} onChange={(e) => setStrict(e.target.checked)} />
            <span>종별 룰 strict 검증 (위반 시 거부)</span>
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
        className="rounded-full px-2 py-0.5 text-[10px] font-medium"
        style={{ background: "var(--color-elevated)", color: "var(--color-text-muted)" }}
      >
        경로 미상
      </span>
    );
  }
  const cfg = map[appliedVia];
  return (
    <span
      className="rounded-full px-2 py-0.5 text-[10px] font-medium"
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
      className="rounded-full px-2 py-0.5 text-[10px] font-medium"
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
      className="rounded-full px-2 py-0.5 text-[10px] font-medium"
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
      className="rounded-full px-2 py-0.5 text-[10px] font-medium"
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
      className="flex items-center gap-3 rounded-[4px] border p-3"
      style={{ borderColor: "var(--color-border)", background: "var(--color-elevated)" }}
    >
      <span
        className="material-symbols-outlined text-2xl"
        style={{ color: "var(--color-accent)" }}
      >
        {icon}
      </span>
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

/* Phase 3-B — 종별 standings 기반 순위전 placeholder 자동 채우기 */
async function advancePlaceholders(
  tournamentId: string,
  toast: (msg: string) => void,
): Promise<void> {
  if (!confirm("모든 종별 순위전 placeholder 매치를 standings 기반으로 자동 채우시겠습니까?\n\n조별 예선 종료 후 사용하세요. 이미 채워진 슬롯은 보호됩니다.")) {
    return;
  }
  try {
    const res = await fetch(`/api/web/admin/tournaments/${tournamentId}/advance-placeholders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const json = await res.json();
    if (!res.ok) {
      toast(json.error ?? "자동 채우기 실패");
      return;
    }
    const upd = json.total_updated ?? 0;
    const skip = json.total_skipped ?? 0;
    const err = json.total_errors ?? 0;
    toast(`자동 채우기 완료 — 업데이트 ${upd}건 / 스킵 ${skip}건${err > 0 ? ` / 에러 ${err}건` : ""}`);
    // 페이지 새로고침 (매치 페이지 진입 시 채워진 슬롯 확인용)
    setTimeout(() => window.location.reload(), 1500);
  } catch {
    toast("네트워크 오류");
  }
}

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
    .catch(() => toast("복사에 실패했습니다. CSV 다운로드를 사용하세요."));
}

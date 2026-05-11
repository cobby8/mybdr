"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/card";

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
          };
        }
        setTokenMap(next);
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

      {/* 통계 탭 — status 분류 + 코치 미입력 (운영자 박제 + 코치 명단 0건) */}
      <div className="mb-4 flex flex-wrap gap-2">
        {(["all", "pending", "approved", "rejected", "coach_pending"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`flex items-center gap-1.5 whitespace-nowrap rounded-full px-4 py-2 text-sm transition-colors ${
              filter === s ? "bg-[var(--color-accent)] font-semibold text-[var(--color-on-accent)]" : "bg-[var(--color-elevated)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
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
        <div className="space-y-2">
          {filtered.map((tt) => {
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
                        className="rounded-full bg-[var(--color-game-team)]/10 px-3 py-1.5 text-xs font-medium text-[var(--color-game-team)] hover:bg-[var(--color-game-team)]/20 disabled:opacity-50"
                      >
                        승인
                      </button>
                      <button
                        onClick={() => updateStatus(tt.id, "rejected")}
                        disabled={actionLoading === tt.id}
                        className="rounded-full bg-[var(--color-error)]/10 px-3 py-1.5 text-xs font-medium text-[var(--color-error)] hover:bg-[var(--color-error)]/20 disabled:opacity-50"
                      >
                        거절
                      </button>
                    </div>
                  )}
                  {tt.status === "approved" && (
                    <button
                      onClick={() => updateStatus(tt.id, "rejected")}
                      disabled={actionLoading === tt.id}
                      className="rounded-full bg-[var(--color-error)]/10 px-3 py-1.5 text-xs font-medium text-[var(--color-error)] hover:bg-[var(--color-error)]/20 disabled:opacity-50"
                    >
                      거절
                    </button>
                  )}
                  {tt.status === "rejected" && (
                    <button
                      onClick={() => updateStatus(tt.id, "approved")}
                      disabled={actionLoading === tt.id}
                      className="rounded-full bg-[var(--color-game-team)]/10 px-3 py-1.5 text-xs font-medium text-[var(--color-game-team)] hover:bg-[var(--color-game-team)]/20 disabled:opacity-50"
                    >
                      승인으로 변경
                    </button>
                  )}
                </div>
              </div>

              {/* 선수 목록 (펼쳐진 상태) */}
              {expandedTeamId === tt.id && (
                <div className="mt-4 border-t border-[var(--color-border)] pt-4">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-sm font-semibold">선수 명단</h3>
                    <button
                      onClick={() => setShowAddForm(!showAddForm)}
                      className="flex items-center gap-1 rounded-[4px] bg-[var(--color-accent)] px-3 py-1.5 text-xs font-medium text-white hover:opacity-90"
                    >
                      <span className="material-symbols-outlined text-sm">person_add</span>
                      선수 추가
                    </button>
                  </div>

                  {/* 선수 추가 폼 */}
                  {showAddForm && (
                    <div className="mb-4 rounded-[8px] bg-[var(--color-elevated)] p-4">
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                        <input
                          type="text"
                          placeholder="이름 *"
                          value={addForm.player_name}
                          onChange={(e) => setAddForm({ ...addForm, player_name: e.target.value })}
                          className="rounded-[4px] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
                        />
                        <input
                          type="text"
                          placeholder="전화번호"
                          value={addForm.phone}
                          onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })}
                          className="rounded-[4px] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
                        />
                        <input
                          type="number"
                          placeholder="등번호"
                          value={addForm.jersey_number}
                          onChange={(e) => setAddForm({ ...addForm, jersey_number: e.target.value })}
                          className="rounded-[4px] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
                        />
                        <input
                          type="text"
                          placeholder="포지션 (PG, SG 등)"
                          value={addForm.position}
                          onChange={(e) => setAddForm({ ...addForm, position: e.target.value })}
                          className="rounded-[4px] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
                        />
                      </div>
                      <div className="mt-3 flex justify-end gap-2">
                        <button
                          onClick={() => { setShowAddForm(false); setAddForm(EMPTY_FORM); }}
                          className="rounded-[4px] px-4 py-2 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
                        >
                          취소
                        </button>
                        <button
                          onClick={handleAddPlayer}
                          disabled={addLoading || !addForm.player_name.trim()}
                          className="rounded-[4px] bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
                        >
                          {addLoading ? "추가 중..." : "추가"}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* 선수 목록 테이블 */}
                  {playersLoading ? (
                    <p className="py-4 text-center text-sm text-[var(--color-text-muted)]">불러오는 중...</p>
                  ) : players.length === 0 ? (
                    <p className="py-4 text-center text-sm text-[var(--color-text-muted)]">등록된 선수가 없습니다.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-[var(--color-border)] text-left text-xs text-[var(--color-text-muted)]">
                            <th className="pb-2 pr-3">#</th>
                            <th className="pb-2 pr-3">이름</th>
                            <th className="hidden pb-2 pr-3 sm:table-cell">전화번호</th>
                            <th className="pb-2 pr-3">포지션</th>
                            <th className="pb-2 pr-3">연동</th>
                            <th className="pb-2" />
                          </tr>
                        </thead>
                        <tbody>
                          {players.map((p) => (
                            <tr key={p.id} className="border-b border-[var(--color-border)]/50">
                              <td className="py-2 pr-3 text-[var(--color-text-muted)]">
                                {p.jersey_number ?? "-"}
                              </td>
                              <td className="py-2 pr-3 font-medium">
                                {p.player_name ?? "-"}
                              </td>
                              <td className="hidden py-2 pr-3 text-[var(--color-text-muted)] sm:table-cell">
                                {p.phone ? `${p.phone.slice(0, 3)}-****-${p.phone.slice(-4)}` : "-"}
                              </td>
                              <td className="py-2 pr-3 text-[var(--color-text-muted)]">
                                {p.position ?? "-"}
                              </td>
                              <td className="py-2 pr-3">
                                {p.users ? (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-game-team)]/10 px-2 py-0.5 text-xs font-medium text-[var(--color-game-team)]">
                                    <span className="material-symbols-outlined text-xs">link</span>
                                    연동됨
                                  </span>
                                ) : (
                                  <span className="text-xs text-[var(--color-text-muted)]">미연동</span>
                                )}
                              </td>
                              <td className="py-2 text-right">
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
                </div>
              )}
            </Card>
            );
          })}
        </div>
      )}

      {/* Phase 2-C — 토스트 (화면 우상단 고정) */}
      {toast && (
        <div
          role="status"
          className="fixed top-20 right-4 z-50 rounded-[4px] border border-[var(--color-border)] bg-[var(--color-elevated)] px-4 py-3 text-sm text-[var(--color-text-primary)] shadow-md"
          style={{ minWidth: 220 }}
        >
          {toast}
        </div>
      )}
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

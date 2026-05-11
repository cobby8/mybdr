"use client";

import { useState, useEffect, useCallback, useTransition } from "react";
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
type TokenInfo = {
  applyTokenUrl: string | null;
  applyTokenExpiresAt: string | null;
  managerName: string | null;
  managerPhone: string | null;
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
  const [showTokenModal, setShowTokenModal] = useState(false);
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
      const res = await fetch(`/api/web/tournaments/${id}/teams`);
      if (res.ok) setTeams(await res.json());

      // 2) 토큰 정보 (apply_token URL + 만료) — 별도 endpoint
      //    응답은 snake_case (apiSuccess 자동 변환) — apply_token_url / apply_token_expires_at
      const tokenRes = await fetch(`/api/web/admin/tournaments/${id}/team-applications`);
      if (tokenRes.ok) {
        const json = await tokenRes.json();
        const next: Record<string, TokenInfo> = {};
        // apiSuccess wrapper: { success: true, data: { teams: [...] } } — 모두 snake_case 변환됨
        // 응답 key 가 snake_case 로 변환되므로 접근자도 snake_case 사용 (CLAUDE.md §보안 5번)
        const teamsArr = (json?.data?.teams ?? []) as Array<{
          id: string;
          apply_token_url: string | null;
          apply_token_expires_at: string | null;
          manager_name: string | null;
          manager_phone: string | null;
        }>;
        for (const row of teamsArr) {
          next[row.id] = {
            applyTokenUrl: row.apply_token_url,
            applyTokenExpiresAt: row.apply_token_expires_at,
            managerName: row.manager_name,
            managerPhone: row.manager_phone,
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

  /* --- 필터 --- */
  const filtered = filter === "all" ? teams : teams.filter((t) => t.status === filter);

  const counts = {
    all: teams.length,
    pending: teams.filter((t) => t.status === "pending").length,
    approved: teams.filter((t) => t.status === "approved").length,
    rejected: teams.filter((t) => t.status === "rejected").length,
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
        {/* 팀 + 토큰 신규 발급 버튼 (Phase 2-C 통합) */}
        <button
          type="button"
          onClick={() => setShowTokenModal(true)}
          className="flex items-center gap-1.5 rounded-[4px] bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-[var(--color-on-accent)] hover:opacity-90"
        >
          <span className="material-symbols-outlined text-base">add</span>
          팀 + 토큰 신규 발급
        </button>
      </div>

      {/* 통계 탭 */}
      <div className="mb-4 flex gap-2 overflow-x-auto">
        {(["all", "pending", "approved", "rejected"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`flex items-center gap-1.5 whitespace-nowrap rounded-full px-4 py-2 text-sm transition-colors ${
              filter === s ? "bg-[var(--color-accent)] font-semibold text-[var(--color-on-accent)]" : "bg-[var(--color-elevated)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
            }`}
          >
            {s === "all" ? "전체" : STATUS_LABEL[s]}
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
                    <p className="font-semibold">{tt.team.name}</p>
                    <p className="text-xs text-[var(--color-text-muted)]">
                      선수 {tt.players.length}명 &middot;{" "}
                      {new Date(tt.createdAt).toLocaleDateString("ko-KR")} 신청
                      {/* Phase 2-C — 코치 정보 표시 (있을 때만) */}
                      {token?.managerName && (
                        <> &middot; 코치 {token.managerName}</>
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

      {/* Phase 2-C — 팀 + 토큰 신규 발급 모달 */}
      {showTokenModal && (
        <AddTeamTokenModal
          tournamentId={id}
          onClose={() => setShowTokenModal(false)}
          onSuccess={(msg) => {
            setShowTokenModal(false);
            showToast(msg);
            // 서버 갱신 (새 토큰 row + 만료 반영)
            load();
          }}
        />
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

/* ============================================================
 * Phase 2-C — 팀 + 토큰 신규 발급 모달
 * - POST /api/web/admin/tournaments/[id]/team-applications
 * - 성공 시 응답의 apply_token_url 자동 클립보드 복사 + 토스트
 * ============================================================ */
interface AddTeamTokenModalProps {
  tournamentId: string;
  onClose: () => void;
  onSuccess: (msg: string) => void;
}

function AddTeamTokenModal({ tournamentId, onClose, onSuccess }: AddTeamTokenModalProps) {
  const [teamName, setTeamName] = useState("");
  const [managerName, setManagerName] = useState("");
  const [managerPhone, setManagerPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch(
          `/api/web/admin/tournaments/${tournamentId}/team-applications`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ teamName, managerName, managerPhone }),
          },
        );
        const json = await res.json();
        if (!res.ok) {
          // apiError는 snake_case 변환 우회 — { error: "..." } 그대로
          setError(json.error ?? "신청 토큰 발급에 실패했습니다");
          return;
        }
        // 응답은 apiSuccess wrapper { success, data: { team: {...} } } — 모두 snake_case
        const url: string | undefined = json?.data?.team?.apply_token_url;
        const tName: string = json?.data?.team?.team_name ?? teamName;
        if (url) {
          // 발급 즉시 자동 복사 (UX 단축)
          try {
            await navigator.clipboard.writeText(url);
            onSuccess(`${tName} 토큰 발급 완료 — URL 복사됨`);
          } catch {
            onSuccess(`${tName} 토큰 발급 완료 (복사 실패)`);
          }
        } else {
          onSuccess(`${tName} 토큰 발급 완료`);
        }
      } catch {
        setError("네트워크 오류가 발생했습니다");
      }
    });
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-40 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.5)" }}
      onClick={onClose}
    >
      <form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-[4px] border border-[var(--color-border)] bg-[var(--color-elevated)] p-6"
      >
        <h2 className="mb-4 text-lg font-bold">팀 + 토큰 신규 발급</h2>

        <div className="space-y-3">
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-[var(--color-text-muted)]">팀명</span>
            <input
              type="text"
              required
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="강남동 슈터스"
              maxLength={50}
              autoFocus
              className="w-full rounded-[4px] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-[var(--color-text-muted)]">코치 이름</span>
            <input
              type="text"
              required
              value={managerName}
              onChange={(e) => setManagerName(e.target.value)}
              placeholder="홍길동"
              maxLength={30}
              className="w-full rounded-[4px] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-[var(--color-text-muted)]">코치 연락처</span>
            <input
              type="tel"
              required
              value={managerPhone}
              onChange={(e) => setManagerPhone(e.target.value)}
              placeholder="010-1234-5678"
              className="w-full rounded-[4px] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
            />
          </label>
        </div>

        {error && (
          <p className="mt-3 text-sm text-[var(--color-error)]">{error}</p>
        )}

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="rounded-[4px] px-4 py-2 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] disabled:opacity-50"
          >
            취소
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="rounded-[4px] bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-[var(--color-on-accent)] hover:opacity-90 disabled:opacity-50"
          >
            {isPending ? "발급 중..." : "토큰 발급"}
          </button>
        </div>
      </form>
    </div>
  );
}

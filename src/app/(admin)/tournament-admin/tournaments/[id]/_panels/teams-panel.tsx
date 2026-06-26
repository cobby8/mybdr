"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { Btn, Empty, Icon, Modal, useTossConfirm } from "@/components/admin-toss";
import { PanelLoadingState } from "./panel-loading-state";

type TeamStatus = "pending" | "approved" | "rejected" | "withdrawn" | string;
type PaymentStatus = "unpaid" | "paid" | "refunded" | "waived" | string;

type TeamRow = {
  id: string;
  status: TeamStatus;
  seed_number: number | null;
  group_name: string | null;
  created_at: string;
  team: {
    id: string;
    name: string;
    logo_url: string | null;
    primary_color: string | null;
  };
  players: Array<{ id: string; role: string }>;
};

type TokenInfo = {
  applyTokenUrl: string | null;
  applyTokenExpiresAt: string | null;
  managerName: string | null;
  managerPhone: string | null;
  appliedVia: string | null;
  appliedAt: string | null;
  waitingNumber: number | null;
  registeredBy: { nickname: string | null; email: string | null } | null;
  category: string | null;
  paymentStatus: PaymentStatus | null;
  updatedAt: string;
};

type DivisionRuleOption = {
  code: string;
  label: string;
  cap: number | null;
};

type TeamView = TeamRow & {
  token: TokenInfo | null;
  rawCategory: string | null;
  category: string | null;
  paymentStatus: PaymentStatus | null;
  managerName: string | null;
  managerPhone: string | null;
  tokenAlive: boolean;
};

type Player = {
  id: string;
  player_name: string | null;
  phone: string | null;
  jersey_number: number | null;
  position: string | null;
  role: string | null;
  birth_date?: string | null;
  school_name?: string | null;
  parent_name?: string | null;
  parent_phone?: string | null;
};

type PlayerDraft = {
  player_name: string;
  phone: string;
  jersey_number: string;
  position: string;
};

const STATUS_LABEL: Record<string, string> = {
  pending: "대기",
  approved: "승인",
  rejected: "거절",
  withdrawn: "취소",
};

const STATUS_TONE: Record<string, "ok" | "warn" | "err" | "mute" | "info"> = {
  pending: "warn",
  approved: "ok",
  rejected: "err",
  withdrawn: "mute",
};

const PAYMENT_LABEL: Record<string, string> = {
  unpaid: "미납",
  paid: "납부",
  refunded: "환불",
  waived: "면제",
};

const VIA_LABEL: Record<string, string> = {
  admin: "운영자",
  coach_token: "코치",
  self: "본인",
};

const EMPTY_PLAYER: PlayerDraft = {
  player_name: "",
  phone: "",
  jersey_number: "",
  position: "",
};

function statusLabel(status: string) {
  return STATUS_LABEL[status] ?? status;
}

function paymentLabel(status: string | null | undefined) {
  if (!status) return "미납";
  return PAYMENT_LABEL[status] ?? status;
}

function formatDate(value: string | null | undefined) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("ko-KR");
}

function cleanCategoryCode(code: string | null | undefined) {
  const value = code?.trim() ?? "";
  if (!value) return null;
  if (/^\?+(\s+\?+)*$/.test(value)) return null;
  return value;
}

function knownCategoryCode(code: string | null | undefined, rules: DivisionRuleOption[]) {
  const value = cleanCategoryCode(code);
  if (!value) return null;
  return rules.some((rule) => rule.code === value) ? value : null;
}

function effectiveCategoryCode(code: string | null | undefined, rules: DivisionRuleOption[]) {
  const known = knownCategoryCode(code, rules);
  if (known) return known;
  return rules.length === 1 ? rules[0]?.code ?? null : null;
}

function categoryLabel(code: string | null, rules: DivisionRuleOption[]) {
  if (!code) return "종별 미확인";
  return rules.find((rule) => rule.code === code)?.label ?? "종별 미확인";
}

function categorySortKey(code: string | null) {
  return code ?? "\uffff";
}

function normalizePhone(value: string) {
  return value.replace(/\D/g, "");
}

function isCoachPending(team: TeamView) {
  return team.token?.appliedVia === "admin" && team.players.length === 0;
}

function toneForStatus(status: string) {
  return STATUS_TONE[status] ?? "mute";
}

export default function TournamentTeamsPanel() {
  const { id } = useParams<{ id: string }>();
  const [teams, setTeams] = useState<TeamRow[]>([]);
  const [tokenMap, setTokenMap] = useState<Record<string, TokenInfo>>({});
  const [divisionRules, setDivisionRules] = useState<DivisionRuleOption[]>([]);
  const [rosterRule, setRosterRule] = useState<{ min: number | null; max: number | null }>({
    min: null,
    max: null,
  });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [bulkMovingCategory, setBulkMovingCategory] = useState<string | null>(null);
  const [bulkMoveTarget, setBulkMoveTarget] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<string | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const tossConfirm = useTossConfirm();

  const showToast = useCallback((message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 2800);
  }, []);

  const load = useCallback(async () => {
    try {
      const [teamRes, tokenRes] = await Promise.all([
        fetch(`/api/web/tournaments/${id}/teams`),
        fetch(`/api/web/admin/tournaments/${id}/team-applications`),
      ]);

      if (teamRes.ok) {
        setTeams((await teamRes.json()) as TeamRow[]);
      }

      if (tokenRes.ok) {
        const json = await tokenRes.json();
        const next: Record<string, TokenInfo> = {};
        const rows = (json?.teams ?? []) as Array<{
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
          payment_status: PaymentStatus | null;
          updated_at: string;
        }>;
        for (const row of rows) {
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
        setRosterRule({
          min: typeof json?.roster_min === "number" ? json.roster_min : null,
          max: typeof json?.roster_max === "number" ? json.roster_max : null,
        });
        setDivisionRules((json?.division_rules ?? []) as DivisionRuleOption[]);
      }
    } catch {
      showToast("참가팀 정보를 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, [id, showToast]);

  useEffect(() => {
    void load();
  }, [load]);

  const viewTeams = useMemo<TeamView[]>(() => {
    return teams.map((team) => {
      const token = tokenMap[team.id] ?? null;
      const rawCategory = token?.category ?? null;
      return {
        ...team,
        token,
        rawCategory,
        category: effectiveCategoryCode(rawCategory, divisionRules),
        paymentStatus: token?.paymentStatus ?? null,
        managerName: token?.managerName ?? null,
        managerPhone: token?.managerPhone ?? null,
        tokenAlive: Boolean(token?.applyTokenUrl),
      };
    });
  }, [divisionRules, teams, tokenMap]);

  const counts = useMemo(() => {
    return {
      all: viewTeams.length,
      pending: viewTeams.filter((team) => team.status === "pending").length,
      approved: viewTeams.filter((team) => team.status === "approved").length,
      rejected: viewTeams.filter((team) => team.status === "rejected").length,
      coach_pending: viewTeams.filter(isCoachPending).length,
      paid: viewTeams.filter((team) => team.paymentStatus === "paid").length,
      tokenAlive: viewTeams.filter((team) => team.tokenAlive).length,
    };
  }, [viewTeams]);

  const filteredTeams = useMemo(() => {
    if (filter === "all") return viewTeams;
    if (filter === "coach_pending") return viewTeams.filter(isCoachPending);
    if (filter === "paid") return viewTeams.filter((team) => team.paymentStatus === "paid");
    if (filter === "unpaid") return viewTeams.filter((team) => team.paymentStatus !== "paid");
    return viewTeams.filter((team) => team.status === filter);
  }, [filter, viewTeams]);

  const grouped = useMemo(() => {
    const map = new Map<string | null, TeamView[]>();
    for (const team of filteredTeams) {
      const key = team.category;
      map.set(key, [...(map.get(key) ?? []), team]);
    }
    return [...map.entries()].sort(([a], [b]) =>
      categorySortKey(a).localeCompare(categorySortKey(b)),
    );
  }, [filteredTeams]);

  const divisionStats = useMemo(() => {
    return divisionRules.map((rule) => {
      const total = viewTeams.filter((team) => team.category === rule.code).length;
      const approved = viewTeams.filter(
        (team) => team.category === rule.code && team.status === "approved",
      ).length;
      const paid = viewTeams.filter(
        (team) => team.category === rule.code && team.paymentStatus === "paid",
      ).length;
      return {
        ...rule,
        total,
        approved,
        paid,
        overCapacity: rule.cap != null && approved > rule.cap,
      };
    });
  }, [divisionRules, viewTeams]);

  const detailTeam = useMemo(
    () => viewTeams.find((team) => team.id === detailId) ?? null,
    [detailId, viewTeams],
  );

  async function copyToClipboard(text: string | null, emptyMessage: string) {
    if (!text) {
      showToast(emptyMessage);
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
      showToast("복사했습니다.");
    } catch {
      showToast("복사에 실패했습니다.");
    }
  }

  async function updateStatus(teamId: string, status: TeamStatus) {
    setActionLoading(teamId);
    try {
      const res = await fetch(`/api/web/tournaments/${id}/teams/${teamId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error();
      showToast(`${statusLabel(status)} 처리했습니다.`);
      await load();
    } catch {
      showToast("상태 변경에 실패했습니다.");
    } finally {
      setActionLoading(null);
    }
  }

  async function updatePayment(teamId: string, paymentStatus: PaymentStatus) {
    setActionLoading(teamId);
    try {
      const res = await fetch(`/api/web/tournaments/${id}/teams/${teamId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payment_status: paymentStatus }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.error ?? "납부 상태 변경 실패");
      if (paymentStatus === "paid" && json?.promoted) {
        showToast("입금 확인 후 자동 승인했습니다.");
      } else if (paymentStatus === "paid" && json?.promote_reason === "division_full") {
        showToast("입금은 확인했지만 정원 초과로 승인은 보류됐습니다.");
      } else {
        showToast("납부 상태를 변경했습니다.");
      }
      await load();
    } catch {
      showToast("납부 상태 변경에 실패했습니다.");
    } finally {
      setActionLoading(null);
    }
  }

  async function changeCategory(teamId: string, category: string) {
    if (!category) return;
    const team = viewTeams.find((item) => item.id === teamId);
    const ok = await tossConfirm.confirm({
      title: "신청 종별 변경",
      sub: `${team?.team.name ?? "선택 팀"}을 ${categoryLabel(category, divisionRules)}로 이동합니다.`,
      body: "팀의 신청 종별과 선수 division_code가 함께 변경됩니다. 이미 생성된 대진표가 있다면 대진표 탭에서 다시 확인하세요.",
      confirmLabel: "종별 변경",
      tone: "danger",
    });
    if (!ok) return;

    setActionLoading(teamId);
    try {
      const res = await fetch(`/api/web/admin/tournaments/${id}/teams/${teamId}/category`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.error ?? "종별 변경 실패");
      showToast(
        json?.changed
          ? `${categoryLabel(json.current, divisionRules)}로 이동했습니다.`
          : "변경사항이 없습니다.",
      );
      await load();
    } catch {
      showToast("종별 변경에 실패했습니다.");
    } finally {
      setActionLoading(null);
    }
  }

  async function bulkChangeCategory(fromCategory: string | null, targetCategory: string, count: number) {
    if (!targetCategory) return;
    const ok = await tossConfirm.confirm({
      title: "종별 일괄 이동",
      sub: `${categoryLabel(fromCategory, divisionRules)} ${count}팀을 ${categoryLabel(targetCategory, divisionRules)}로 이동합니다.`,
      body: "팀과 선수의 종별 코드가 함께 변경됩니다. 운영 당일에는 이동 후 대진표 생성 상태를 반드시 다시 확인하세요.",
      confirmLabel: "일괄 이동",
      tone: "danger",
    });
    if (!ok) return;

    const key = fromCategory ?? "__unassigned";
    setBulkMovingCategory(key);
    try {
      const res = await fetch(`/api/web/admin/tournaments/${id}/teams/category`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fromCategory, category: targetCategory }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.error ?? "일괄 이동 실패");
      showToast(
        json?.changed
          ? `${json.team_count ?? 0}팀 / 선수 ${json.player_count ?? 0}명 이동 완료`
          : "이동할 팀이 없습니다.",
      );
      await load();
    } catch {
      showToast("종별 일괄 이동에 실패했습니다.");
    } finally {
      setBulkMovingCategory(null);
    }
  }

  async function updateSeed(teamId: string, seedNumber: number | null) {
    try {
      const res = await fetch(`/api/web/tournaments/${id}/teams/${teamId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seedNumber }),
      });
      if (!res.ok) throw new Error();
      showToast("시드를 저장했습니다.");
      await load();
    } catch {
      showToast("시드 저장에 실패했습니다.");
    }
  }

  async function updateGroup(teamId: string, groupName: string | null) {
    try {
      const res = await fetch(`/api/web/tournaments/${id}/teams/${teamId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groupName }),
      });
      if (!res.ok) throw new Error();
      showToast(groupName ? `${groupName}조로 저장했습니다.` : "조 배정을 해제했습니다.");
      await load();
    } catch {
      showToast("조 저장에 실패했습니다.");
    }
  }

  async function deleteTeam(team: TeamView) {
    const ok = await tossConfirm.confirm({
      title: "참가팀 삭제",
      sub: `${team.team.name}을 참가팀 목록에서 삭제합니다.`,
      body: "승인된 팀이면 참가팀 수가 함께 감소합니다. 대진표가 이미 생성된 경우 삭제 후 대진표를 다시 확인해야 합니다.",
      confirmLabel: "삭제",
      tone: "danger",
    });
    if (!ok) return;

    setActionLoading(team.id);
    try {
      const res = await fetch(`/api/web/tournaments/${id}/teams/${team.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();
      showToast("참가팀을 삭제했습니다.");
      setDetailId(null);
      await load();
    } catch {
      showToast("참가팀 삭제에 실패했습니다.");
    } finally {
      setActionLoading(null);
    }
  }

  function downloadTokenCsv() {
    const header = "팀명,코치명,코치연락처,신청종별,납부상태,토큰URL,토큰만료";
    const rows = viewTeams.map((team) =>
      [
        team.team.name,
        team.managerName ?? "",
        team.managerPhone ?? "",
        categoryLabel(team.category, divisionRules),
        paymentLabel(team.paymentStatus),
        team.token?.applyTokenUrl ?? "",
        formatDate(team.token?.applyTokenExpiresAt),
      ]
        .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
        .join(","),
    );
    const blob = new Blob(["\ufeff" + [header, ...rows].join("\n")], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tournament-teams-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast("참가팀 CSV를 내려받았습니다.");
  }

  function copyTokenMessages() {
    const blocks = viewTeams
      .filter((team) => team.token?.applyTokenUrl)
      .map((team) => {
        const manager = team.managerName ? `${team.managerName} 코치님` : `${team.team.name} 코치님`;
        return `[${team.team.name}]
안녕하세요, ${manager}.
MyBDR 참가팀 선수 명단 입력 링크입니다.
${team.token?.applyTokenUrl}
링크는 1회용입니다. 한 번에 모든 선수 명단을 입력해주세요.`;
      });
    void copyToClipboard(blocks.join("\n\n----------\n\n"), "복사할 토큰이 없습니다.");
  }

  if (loading) {
    return <PanelLoadingState label="참가팀 정보를 준비 중입니다." />;
  }

  return (
    <div data-skin="toss" className="space-y-4">
      {tossConfirm.dialog}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-black text-[var(--ink)]">참가팀 운영</h3>
          <p className="mt-1 text-xs font-semibold text-[var(--ink-mute)]">
            승인, 입금, 신청 종별 이동, 선수명단을 한 화면에서 처리합니다.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Btn variant="secondary" size="sm" icon="download" onClick={downloadTokenCsv}>
            CSV
          </Btn>
          <Btn variant="primary" size="sm" icon="message-circle" onClick={copyTokenMessages}>
            카톡 문구 복사
          </Btn>
        </div>
      </div>

      <div className="ct-panel-stats">
        <Metric icon="users" label="전체" value={`${counts.all}팀`} />
        <Metric icon="check-circle" label="승인" value={`${counts.approved}팀`} tone="ok" />
        <Metric icon="clock" label="대기" value={`${counts.pending}팀`} tone="warn" />
        <Metric icon="banknote" label="납부" value={`${counts.paid}팀`} tone="ok" />
        <Metric icon="link" label="토큰" value={`${counts.tokenAlive}개`} />
      </div>

      <section className="ts-card ts-card--flat">
        <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-sm font-black text-[var(--ink)]">종별 현황</h3>
            <p className="mt-1 text-xs font-semibold text-[var(--ink-mute)]">
              종별별 신청, 승인, 납부 상태입니다. 정원 초과는 대진 생성 전 정리하세요.
            </p>
          </div>
          <span className="ct-pill" data-tone={divisionRules.length > 0 ? "info" : "warn"}>
            {divisionRules.length > 0 ? `${divisionRules.length}종별` : "종별 없음"}
          </span>
        </div>
        {divisionStats.length === 0 ? (
          <Empty icon="layout-grid" title="등록된 종별이 없습니다" desc="대회 정보 수정의 종별 단계에서 먼저 종별을 저장하세요." />
        ) : (
          <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
            {divisionStats.map((rule) => (
              <div key={rule.code} className="rounded-[14px] bg-[var(--grey-50)] p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-extrabold text-[var(--ink)]">{rule.label}</p>
                    <p className="mt-1 text-xs font-semibold text-[var(--ink-mute)]">{rule.code}</p>
                  </div>
                  <span className="ct-pill" data-tone={rule.overCapacity ? "err" : "mute"}>
                    {rule.cap == null ? "정원 없음" : `${rule.approved}/${rule.cap}`}
                  </span>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2">
                  <MiniStat label="신청" value={rule.total} />
                  <MiniStat label="승인" value={rule.approved} />
                  <MiniStat label="납부" value={rule.paid} />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="flex flex-wrap gap-2">
        {[
          ["all", "전체", counts.all],
          ["pending", "대기", counts.pending],
          ["approved", "승인", counts.approved],
          ["rejected", "거절", counts.rejected],
          ["paid", "납부", counts.paid],
          ["unpaid", "미납", counts.all - counts.paid],
          ["coach_pending", "코치 미입력", counts.coach_pending],
        ].map(([key, label, count]) => (
          <button
            key={String(key)}
            type="button"
            className="ts-chip"
            data-active={filter === key}
            onClick={() => setFilter(String(key))}
          >
            {label}
            <span className="rounded-[8px] bg-[var(--grey-100)] px-1.5 py-0.5 text-xs">
              {count}
            </span>
          </button>
        ))}
      </div>

      {filteredTeams.length === 0 ? (
        <Empty icon="users" title="표시할 참가팀이 없습니다" desc="필터를 바꾸거나 신청 토큰을 다시 확인하세요." />
      ) : (
        <div className="space-y-5">
          {grouped.map(([category, rows]) => {
            const moveOptions = divisionRules.filter((rule) => rule.code !== category);
            const groupKey = category ?? "__unassigned";
            const selectedTarget = bulkMoveTarget[groupKey] ?? moveOptions[0]?.code ?? "";
            const rawCategories = Array.from(
              new Set(rows.map((team) => cleanCategoryCode(team.rawCategory)).filter(Boolean)),
            );
            const bulkSourceCategory = category ?? (rawCategories.length === 1 ? rawCategories[0] ?? null : null);
            return (
              <section key={groupKey} className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-sm font-black text-[var(--primary)]">
                    {categoryLabel(category, divisionRules)}
                  </h3>
                  <span className="text-xs font-bold text-[var(--ink-mute)]">{rows.length}팀</span>
                  <div className="min-w-[80px] flex-1 border-t border-[var(--border)]" />
                  {moveOptions.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2">
                      <select
                        className="ts-select"
                        style={{ minHeight: 36, width: 160 }}
                        value={selectedTarget}
                        onChange={(event) =>
                          setBulkMoveTarget((current) => ({
                            ...current,
                            [groupKey]: event.target.value,
                          }))
                        }
                        aria-label="일괄 이동할 종별"
                      >
                        {moveOptions.map((rule) => (
                          <option key={rule.code} value={rule.code}>
                            {rule.label}
                          </option>
                        ))}
                      </select>
                      <Btn
                        variant="secondary"
                        size="sm"
                        icon="move-right"
                        disabled={!selectedTarget || bulkMovingCategory === groupKey}
                        onClick={() => bulkChangeCategory(bulkSourceCategory, selectedTarget, rows.length)}
                      >
                        일괄 이동
                      </Btn>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  {rows.map((team) => (
                    <TeamCard
                      key={team.id}
                      team={team}
                      divisionRules={divisionRules}
                      actionLoading={actionLoading === team.id}
                      onOpen={() => setDetailId(team.id)}
                      onCopy={() => copyToClipboard(team.token?.applyTokenUrl ?? null, "복사할 토큰이 없습니다.")}
                      onStatus={updateStatus}
                      onPayment={updatePayment}
                      onCategory={changeCategory}
                      onDelete={deleteTeam}
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}

      {detailTeam && (
        <TeamDetailModal
          tournamentId={id}
          team={detailTeam}
          divisionRules={divisionRules}
          rosterRule={rosterRule}
          onClose={() => setDetailId(null)}
          onReload={load}
          onToast={showToast}
          onStatus={updateStatus}
          onPayment={updatePayment}
          onCategory={changeCategory}
          onSeed={updateSeed}
          onGroup={updateGroup}
          onDelete={deleteTeam}
        />
      )}

      {toast && (
        <div
          role="status"
          className="fixed right-4 top-20 z-50 rounded-[16px] border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-sm font-bold text-[var(--ink)] shadow-[var(--sh-md)]"
        >
          {toast}
        </div>
      )}
    </div>
  );
}

function Metric({
  icon,
  label,
  value,
  tone = "mute",
}: {
  icon: string;
  label: string;
  value: string;
  tone?: "ok" | "warn" | "err" | "mute";
}) {
  return (
    <div className="ct-metric flex items-center gap-3">
      <Icon name={icon} size={20} color={tone === "ok" ? "var(--ok)" : tone === "warn" ? "var(--warn)" : "var(--primary)"} />
      <div>
        <p className="ct-metric__lbl">{label}</p>
        <p className="ct-metric__val">{value}</p>
      </div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[10px] bg-white px-3 py-2">
      <p className="text-[11px] font-bold text-[var(--ink-mute)]">{label}</p>
      <p className="mt-1 text-sm font-black text-[var(--ink)]">{value}</p>
    </div>
  );
}

function TeamCard({
  team,
  divisionRules,
  actionLoading,
  onOpen,
  onCopy,
  onStatus,
  onPayment,
  onCategory,
  onDelete,
}: {
  team: TeamView;
  divisionRules: DivisionRuleOption[];
  actionLoading: boolean;
  onOpen: () => void;
  onCopy: () => void;
  onStatus: (teamId: string, status: TeamStatus) => void;
  onPayment: (teamId: string, paymentStatus: PaymentStatus) => void;
  onCategory: (teamId: string, category: string) => void;
  onDelete: (team: TeamView) => void;
}) {
  return (
    <div className="ts-card ts-card--tight">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <button
          type="button"
          onClick={onOpen}
          className="flex min-w-0 flex-1 items-center gap-3 border-0 bg-transparent p-0 text-left"
        >
          <span
            className="grid h-10 w-10 shrink-0 place-items-center rounded-[50%] text-xs font-black text-white"
            style={{ backgroundColor: team.team.primary_color ?? "var(--primary)" }}
          >
            {team.team.name.slice(0, 2)}
          </span>
          <span className="min-w-0">
            <span className="flex flex-wrap items-center gap-2">
              <b className="text-sm text-[var(--ink)]">{team.team.name}</b>
              <span className="ct-pill" data-tone={toneForStatus(team.status)}>
                {statusLabel(team.status)}
              </span>
              <span className="ct-pill" data-tone={team.paymentStatus === "paid" ? "ok" : "warn"}>
                {paymentLabel(team.paymentStatus)}
              </span>
              {team.token?.appliedVia && (
                <span className="ct-pill" data-tone="mute">
                  {VIA_LABEL[team.token.appliedVia] ?? team.token.appliedVia}
                </span>
              )}
              {team.token?.waitingNumber && (
                <span className="ct-pill" data-tone="warn">
                  대기 {team.token.waitingNumber}번
                </span>
              )}
              {isCoachPending(team) && (
                <span className="ct-pill" data-tone="info">
                  코치 입력 대기
                </span>
              )}
            </span>
            <span className="mt-1 block text-xs font-semibold text-[var(--ink-mute)]">
              선수 {team.players.length}명 · {categoryLabel(team.category, divisionRules)}
              {team.managerName ? ` · 코치 ${team.managerName}` : ""}
            </span>
          </span>
        </button>

        <div className="flex flex-wrap items-center gap-2">
          {divisionRules.length > 0 && (
            <select
              className="ts-select"
              style={{ minHeight: 36, width: 150 }}
              value={team.category ?? ""}
              onChange={(event) => onCategory(team.id, event.target.value)}
              disabled={actionLoading}
              aria-label={`${team.team.name} 신청 종별`}
            >
              <option value="" disabled>
                종별 선택
              </option>
              {team.category && !divisionRules.some((rule) => rule.code === team.category) && (
                <option value={team.category}>{team.category}</option>
              )}
              {divisionRules.map((rule) => (
                <option key={rule.code} value={rule.code}>
                  {rule.label}
                </option>
              ))}
            </select>
          )}
          <select
            className="ts-select"
            style={{ minHeight: 36, width: 110 }}
            value={team.paymentStatus ?? "unpaid"}
            onChange={(event) => onPayment(team.id, event.target.value)}
            disabled={actionLoading}
            aria-label={`${team.team.name} 납부 상태`}
          >
            <option value="unpaid">미납</option>
            <option value="paid">납부</option>
            <option value="refunded">환불</option>
          </select>
          <Btn variant="secondary" size="sm" icon="copy" onClick={onCopy} disabled={!team.tokenAlive}>
            링크
          </Btn>
          {team.status === "pending" && (
            <>
              <Btn size="sm" disabled={actionLoading} onClick={() => onStatus(team.id, "approved")}>
                승인
              </Btn>
              <Btn variant="danger" size="sm" disabled={actionLoading} onClick={() => onStatus(team.id, "rejected")}>
                거절
              </Btn>
            </>
          )}
          {team.status === "approved" && (
            <Btn variant="danger" size="sm" disabled={actionLoading} onClick={() => onStatus(team.id, "rejected")}>
              거절
            </Btn>
          )}
          {team.status === "rejected" && (
            <Btn size="sm" disabled={actionLoading} onClick={() => onStatus(team.id, "approved")}>
              승인
            </Btn>
          )}
          <Btn variant="ghost" size="sm" icon="trash-2" disabled={actionLoading} onClick={() => onDelete(team)} aria-label="참가팀 삭제" />
        </div>
      </div>
    </div>
  );
}

function TeamDetailModal({
  tournamentId,
  team,
  divisionRules,
  rosterRule,
  onClose,
  onReload,
  onToast,
  onStatus,
  onPayment,
  onCategory,
  onSeed,
  onGroup,
  onDelete,
}: {
  tournamentId: string;
  team: TeamView;
  divisionRules: DivisionRuleOption[];
  rosterRule: { min: number | null; max: number | null };
  onClose: () => void;
  onReload: () => Promise<void>;
  onToast: (message: string) => void;
  onStatus: (teamId: string, status: TeamStatus) => void;
  onPayment: (teamId: string, paymentStatus: PaymentStatus) => void;
  onCategory: (teamId: string, category: string) => void;
  onSeed: (teamId: string, seedNumber: number | null) => void;
  onGroup: (teamId: string, groupName: string | null) => void;
  onDelete: (team: TeamView) => void;
}) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [playersLoading, setPlayersLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [draft, setDraft] = useState<PlayerDraft>(EMPTY_PLAYER);
  const [adding, setAdding] = useState(false);
  const [managerEditing, setManagerEditing] = useState(false);
  const [managerName, setManagerName] = useState(team.managerName ?? "");
  const [managerPhone, setManagerPhone] = useState(team.managerPhone ?? "");
  const [importOpen, setImportOpen] = useState(false);

  const loadPlayers = useCallback(async () => {
    setPlayersLoading(true);
    try {
      const res = await fetch(`/api/web/tournaments/${tournamentId}/teams/${team.id}/players`);
      if (!res.ok) throw new Error();
      setPlayers((await res.json()) as Player[]);
    } catch {
      onToast("선수 명단을 불러오지 못했습니다.");
    } finally {
      setPlayersLoading(false);
    }
  }, [onToast, team.id, tournamentId]);

  useEffect(() => {
    void loadPlayers();
  }, [loadPlayers]);

  async function reissueToken() {
    try {
      const res = await fetch(`/api/web/admin/tournaments/${tournamentId}/teams/${team.id}/reissue-token`, {
        method: "POST",
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.error ?? "토큰 재발급 실패");
      if (json?.apply_token_url) {
        await navigator.clipboard.writeText(json.apply_token_url).catch(() => undefined);
      }
      onToast("토큰을 재발급했습니다.");
      await onReload();
    } catch {
      onToast("토큰 재발급에 실패했습니다.");
    }
  }

  async function saveManager() {
    try {
      const body: Record<string, string> = {};
      if (managerName.trim()) body.managerName = managerName.trim();
      body.managerPhone = managerPhone.trim();
      const res = await fetch(`/api/web/admin/tournaments/${tournamentId}/teams/${team.id}/manager`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error();
      setManagerEditing(false);
      onToast("코치 정보를 저장했습니다.");
      await onReload();
    } catch {
      onToast("코치 정보 저장에 실패했습니다.");
    }
  }

  async function addPlayer() {
    if (!draft.player_name.trim()) return;
    setAdding(true);
    try {
      const payload = {
        player_name: draft.player_name.trim(),
        phone: draft.phone ? normalizePhone(draft.phone) : null,
        jersey_number: draft.jersey_number ? Number(draft.jersey_number) : null,
        position: draft.position.trim() || null,
      };
      const res = await fetch(`/api/web/tournaments/${tournamentId}/teams/${team.id}/players`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.error ?? "선수 추가 실패");
      setDraft(EMPTY_PLAYER);
      setShowAdd(false);
      onToast("선수를 추가했습니다.");
      await loadPlayers();
      await onReload();
    } catch (error) {
      onToast(error instanceof Error ? error.message : "선수 추가에 실패했습니다.");
    } finally {
      setAdding(false);
    }
  }

  async function deletePlayer(playerId: string) {
    try {
      const res = await fetch(`/api/web/tournaments/${tournamentId}/teams/${team.id}/players/${playerId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();
      onToast("선수를 삭제했습니다.");
      await loadPlayers();
      await onReload();
    } catch {
      onToast("선수 삭제에 실패했습니다.");
    }
  }

  return (
    <>
      <Modal
        open
        onClose={onClose}
        maxWidth={860}
        title={team.team.name}
        sub={`${categoryLabel(team.category, divisionRules)} · 선수 ${players.length}명`}
        foot={
          <div className="flex w-full flex-wrap items-center gap-2">
            <Btn variant="secondary" icon="printer" onClick={() => window.print()}>
              명단 출력
            </Btn>
            <Btn variant="danger" icon="trash-2" onClick={() => onDelete(team)}>
              팀 삭제
            </Btn>
            <div className="flex-1" />
            {team.status === "pending" && (
              <>
                <Btn onClick={() => onStatus(team.id, "approved")}>승인</Btn>
                <Btn variant="danger" onClick={() => onStatus(team.id, "rejected")}>
                  거절
                </Btn>
              </>
            )}
            <Btn variant="secondary" onClick={onClose}>
              닫기
            </Btn>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="grid gap-3 md:grid-cols-3">
            <InfoBox label="상태" value={statusLabel(team.status)} />
            <InfoBox label="납부" value={paymentLabel(team.paymentStatus)} />
            <InfoBox label="신청일" value={formatDate(team.token?.appliedAt ?? team.created_at)} />
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <label className="ts-field block">
              <span className="ts-field__label">신청 종별</span>
              <select
                className="ts-select w-full"
                value={team.category ?? ""}
                onChange={(event) => onCategory(team.id, event.target.value)}
              >
                <option value="" disabled>
                  종별 선택
                </option>
                {team.category && !divisionRules.some((rule) => rule.code === team.category) && (
                  <option value={team.category}>{team.category}</option>
                )}
                {divisionRules.map((rule) => (
                  <option key={rule.code} value={rule.code}>
                    {rule.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="ts-field block">
              <span className="ts-field__label">납부 상태</span>
              <select
                className="ts-select w-full"
                value={team.paymentStatus ?? "unpaid"}
                onChange={(event) => onPayment(team.id, event.target.value)}
              >
                <option value="unpaid">미납</option>
                <option value="paid">납부</option>
                <option value="refunded">환불</option>
              </select>
            </label>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <label className="ts-field block">
              <span className="ts-field__label">조</span>
              <input
                className="ts-input"
                defaultValue={team.group_name ?? ""}
                onBlur={(event) => {
                  const next = event.target.value.trim().toUpperCase();
                  if (next !== (team.group_name ?? "")) onGroup(team.id, next || null);
                }}
                placeholder="A"
              />
            </label>
            <label className="ts-field block">
              <span className="ts-field__label">시드</span>
              <input
                className="ts-input"
                type="number"
                min={1}
                defaultValue={team.seed_number ?? ""}
                onBlur={(event) => {
                  const next = event.target.value ? Number(event.target.value) : null;
                  if (next !== (team.seed_number ?? null)) onSeed(team.id, next);
                }}
                placeholder="-"
              />
            </label>
            <div className="ts-field block">
              <span className="ts-field__label">토큰</span>
              <div className="flex gap-2">
                <Btn
                  variant="secondary"
                  size="sm"
                  icon="copy"
                  disabled={!team.token?.applyTokenUrl}
                  onClick={() => {
                    if (!team.token?.applyTokenUrl) return onToast("복사할 토큰이 없습니다.");
                    navigator.clipboard.writeText(team.token.applyTokenUrl).catch(() => undefined);
                    onToast("토큰 링크를 복사했습니다.");
                  }}
                >
                  복사
                </Btn>
                <Btn variant="secondary" size="sm" icon="refresh-cw" onClick={reissueToken}>
                  재발급
                </Btn>
              </div>
            </div>
          </div>

          <section className="rounded-[16px] bg-[var(--grey-50)] p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-black text-[var(--ink)]">코치 정보</h3>
                <p className="mt-1 text-xs font-semibold text-[var(--ink-mute)]">
                  대표 연락처는 토큰 안내와 당일 운영 연락에 사용됩니다.
                </p>
              </div>
              {!managerEditing && (
                <Btn variant="secondary" size="sm" icon="pencil" onClick={() => setManagerEditing(true)}>
                  수정
                </Btn>
              )}
            </div>
            {managerEditing ? (
              <div className="grid gap-2 md:grid-cols-[1fr_1fr_auto_auto]">
                <input className="ts-input" value={managerName} onChange={(event) => setManagerName(event.target.value)} placeholder="코치명" />
                <input className="ts-input" value={managerPhone} onChange={(event) => setManagerPhone(event.target.value)} placeholder="010-0000-0000" />
                <Btn size="sm" onClick={saveManager}>저장</Btn>
                <Btn variant="secondary" size="sm" onClick={() => setManagerEditing(false)}>취소</Btn>
              </div>
            ) : (
              <div className="grid gap-2 md:grid-cols-2">
                <InfoBox label="코치명" value={team.managerName ?? "-"} />
                <InfoBox label="연락처" value={team.managerPhone ?? "-"} />
              </div>
            )}
          </section>

          <section>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-black text-[var(--ink)]">선수 명단</h3>
                <p className="mt-1 text-xs font-semibold text-[var(--ink-mute)]">
                  {rosterRule.min != null || rosterRule.max != null
                    ? `권장 ${rosterRule.min ?? "-"}~${rosterRule.max ?? "-"}명`
                    : "등록 선수 명단"}
                </p>
              </div>
              <div className="flex gap-2">
                <Btn variant="secondary" size="sm" icon="clipboard-paste" onClick={() => setImportOpen(true)}>
                  일괄 입력
                </Btn>
                <Btn size="sm" icon="user-plus" onClick={() => setShowAdd((current) => !current)}>
                  선수 추가
                </Btn>
              </div>
            </div>

            {showAdd && (
              <div className="mb-3 grid gap-2 rounded-[14px] bg-[var(--grey-50)] p-3 md:grid-cols-[1fr_110px_1fr_1fr_auto]">
                <input className="ts-input" value={draft.player_name} onChange={(event) => setDraft((current) => ({ ...current, player_name: event.target.value }))} placeholder="선수명" />
                <input className="ts-input" value={draft.jersey_number} onChange={(event) => setDraft((current) => ({ ...current, jersey_number: event.target.value }))} placeholder="등번호" />
                <input className="ts-input" value={draft.position} onChange={(event) => setDraft((current) => ({ ...current, position: event.target.value }))} placeholder="포지션" />
                <input className="ts-input" value={draft.phone} onChange={(event) => setDraft((current) => ({ ...current, phone: event.target.value }))} placeholder="연락처" />
                <Btn size="sm" disabled={adding || !draft.player_name.trim()} onClick={addPlayer}>
                  추가
                </Btn>
              </div>
            )}

            {playersLoading ? (
              <PanelLoadingState label="선수 명단을 불러오는 중입니다." />
            ) : players.length === 0 ? (
              <Empty icon="user-plus" title="등록된 선수가 없습니다" desc="코치 토큰 또는 일괄 입력으로 선수 명단을 채우세요." />
            ) : (
              <div className="amt-table-wrap">
                <table className="amt-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>이름</th>
                      <th>생년월일</th>
                      <th>학교</th>
                      <th>포지션</th>
                      <th>연락처</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {players.map((player) => (
                      <tr key={player.id}>
                        <td>{player.jersey_number ?? "-"}</td>
                        <td className="font-bold">{player.player_name ?? "-"}</td>
                        <td className="amt-table__div">{player.birth_date ?? "-"}</td>
                        <td className="amt-table__div">{player.school_name ?? "-"}</td>
                        <td className="amt-table__div">{player.position ?? "-"}</td>
                        <td className="amt-table__div">{player.parent_phone ?? player.phone ?? "-"}</td>
                        <td>
                          <Btn variant="ghost" size="sm" icon="trash-2" onClick={() => deletePlayer(player.id)} aria-label="선수 삭제" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </Modal>

      {importOpen && (
        <ImportPlayersModal
          tournamentId={tournamentId}
          teamId={team.id}
          onClose={() => setImportOpen(false)}
          onToast={onToast}
          onReload={async () => {
            await loadPlayers();
            await onReload();
          }}
        />
      )}
    </>
  );
}

function InfoBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[12px] bg-[var(--grey-50)] px-3 py-2">
      <p className="text-[11px] font-bold text-[var(--ink-mute)]">{label}</p>
      <p className="mt-1 text-sm font-black text-[var(--ink)]">{value}</p>
    </div>
  );
}

function ImportPlayersModal({
  tournamentId,
  teamId,
  onClose,
  onToast,
  onReload,
}: {
  tournamentId: string;
  teamId: string;
  onClose: () => void;
  onToast: (message: string) => void;
  onReload: () => Promise<void>;
}) {
  const [text, setText] = useState("");
  const [overwrite, setOverwrite] = useState(false);
  const [strict, setStrict] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const lines = text.split(/\r?\n/).filter((line) => line.trim());

  function parsePlayers() {
    return lines.map((line) => {
      const [playerName, birthDate, jerseyNumber, position, schoolName, parentName, parentPhone] = line
        .split("/")
        .map((part) => part.trim());
      return {
        player_name: playerName,
        birth_date: birthDate || null,
        jersey_number: jerseyNumber ? Number(jerseyNumber) : null,
        position: position || null,
        school_name: schoolName || null,
        parent_name: parentName || null,
        parent_phone: parentPhone ? normalizePhone(parentPhone) : null,
      };
    });
  }

  async function submit() {
    if (lines.length === 0) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/web/admin/tournaments/${tournamentId}/teams/${teamId}/import-players`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          players: parsePlayers(),
          overwrite,
          strictDivisionRule: strict,
        }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.error ?? "일괄 입력 실패");
      onToast(`${json?.inserted_count ?? lines.length}명 입력했습니다.`);
      await onReload();
      onClose();
    } catch (error) {
      onToast(error instanceof Error ? error.message : "일괄 입력에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      maxWidth={640}
      title="선수 일괄 입력"
      sub="한 줄에 한 명씩 이름/생년월일/등번호/포지션/학교/보호자/연락처 순서로 입력합니다."
      foot={
        <div className="flex w-full justify-end gap-2">
          <Btn variant="secondary" onClick={onClose} disabled={submitting}>
            취소
          </Btn>
          <Btn onClick={submit} disabled={submitting || lines.length === 0}>
            {submitting ? "입력 중" : `일괄 입력 (${lines.length})`}
          </Btn>
        </div>
      }
    >
      <div className="space-y-3">
        <textarea
          className="ts-textarea"
          style={{ minHeight: 220, fontFamily: "var(--ff-mono)", fontSize: 13 }}
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder={"홍길동/2017-05-16/7/가드/강남초/홍보호/010-1234-5678"}
        />
        <label className="ct-checkrow">
          <input type="checkbox" checked={overwrite} onChange={(event) => setOverwrite(event.target.checked)} />
          <span>기존 명단 전체 삭제 후 입력</span>
        </label>
        <label className="ct-checkrow">
          <input type="checkbox" checked={strict} onChange={(event) => setStrict(event.target.checked)} />
          <span>종별 규칙 엄격 검증</span>
        </label>
      </div>
    </Modal>
  );
}

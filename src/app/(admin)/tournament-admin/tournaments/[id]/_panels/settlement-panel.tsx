"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Btn, Icon, SkelTable } from "@/components/admin-toss";
import "../matches/matches-admin.css";

type PaymentStatus = "unpaid" | "paid" | "refunded" | "waived" | string;

type TeamRow = {
  id: string;
  status: string;
  category: string | null;
  division?: string | null;
  division_tier?: string | null;
  payment_status: PaymentStatus | null;
  team: {
    id: string;
    name: string;
    logoUrl?: string | null;
    primaryColor?: string | null;
  };
};

type DivisionRule = {
  code?: string | null;
  label?: string | null;
};

type TournamentDetail = {
  entry_fee?: number | null;
  div_fees?: unknown;
  divisions?: unknown;
  categories?: unknown;
  division_rules?: DivisionRule[];
  divisionRules?: DivisionRule[];
};

const PAYMENT_LABEL: Record<string, string> = {
  unpaid: "미납",
  paid: "납부",
  refunded: "환불",
  waived: "면제",
};

const PAYMENT_TONE: Record<string, "ok" | "warn" | "mute" | "err"> = {
  paid: "ok",
  unpaid: "warn",
  refunded: "mute",
  waived: "mute",
};

const STATUS_LABEL: Record<string, string> = {
  pending: "대기",
  approved: "승인",
  rejected: "거절",
  withdrawn: "취소",
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function numberFrom(value: unknown, fallback = 0) {
  const parsed = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;
  return Number.isFinite(parsed) ? parsed : fallback;
}

function money(value: number) {
  return `${Math.round(value).toLocaleString("ko-KR")}원`;
}

function paymentLabel(value: string | null | undefined) {
  if (!value) return "미납";
  return PAYMENT_LABEL[value] ?? value;
}

function isBrokenLabel(value: string | null | undefined) {
  if (!value) return true;
  return value.includes("?") || value.includes("�");
}

function divisionLabel(code: string | null, labels: Map<string, string>, singleFallback: string | null) {
  if (code && labels.has(code)) return labels.get(code) ?? code;
  if (singleFallback) return singleFallback;
  if (!code || isBrokenLabel(code)) return "종별 미확인";
  return labels.get(code) ?? code;
}

function addDivisionLabel(labels: Map<string, string>, value: unknown) {
  if (typeof value !== "string") return;
  const label = value.trim();
  if (!label || isBrokenLabel(label)) return;
  labels.set(label, label);
}

function teamDivisionCode(team: TeamRow) {
  if (team.category && !isBrokenLabel(team.category)) return team.category;
  if (team.division && !isBrokenLabel(team.division)) return team.division;
  return null;
}

export default function SettlementPanel({ tournamentId }: { tournamentId: string }) {
  const [teams, setTeams] = useState<TeamRow[]>([]);
  const [tournament, setTournament] = useState<TournamentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!tournamentId) return;
    setLoading(true);
    setError("");

    try {
      const [teamsRes, tournamentRes] = await Promise.all([
        fetch(`/api/web/tournaments/${tournamentId}/teams`),
        fetch(`/api/web/tournaments/${tournamentId}`),
      ]);
      if (!teamsRes.ok || !tournamentRes.ok) {
        throw new Error("정산 데이터를 불러오지 못했습니다.");
      }
      setTeams((await teamsRes.json()) as TeamRow[]);
      setTournament((await tournamentRes.json()) as TournamentDetail);
    } catch (e) {
      setError(e instanceof Error ? e.message : "정산 데이터를 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, [tournamentId]);

  useEffect(() => {
    void load();
  }, [load]);

  const divisionLabels = useMemo(() => {
    const rows = tournament?.division_rules ?? tournament?.divisionRules ?? [];
    const labels = new Map<string, string>();
    for (const rule of rows) {
      const code = rule.code?.trim();
      if (!code || isBrokenLabel(code)) continue;
      const label = rule.label?.trim();
      labels.set(code, label && !isBrokenLabel(label) ? label : code);
    }
    if (Array.isArray(tournament?.divisions)) {
      for (const division of tournament.divisions) addDivisionLabel(labels, division);
    }
    if (isRecord(tournament?.categories)) {
      for (const value of Object.values(tournament.categories)) {
        if (Array.isArray(value)) value.forEach((item) => addDivisionLabel(labels, item));
        else addDivisionLabel(labels, value);
      }
    }
    if (isRecord(tournament?.div_fees)) {
      Object.keys(tournament.div_fees).forEach((key) => addDivisionLabel(labels, key));
    }
    return labels;
  }, [tournament]);
  const singleDivisionLabel = divisionLabels.size === 1 ? [...divisionLabels.values()][0] ?? null : null;

  const divFees = useMemo(() => {
    const rows = isRecord(tournament?.div_fees) ? tournament?.div_fees : {};
    return new Map(Object.entries(rows).map(([code, fee]) => [code, numberFrom(fee)]));
  }, [tournament]);

  const baseFee = numberFrom(tournament?.entry_fee);
  const activeTeams = useMemo(
    () => teams.filter((team) => team.status !== "rejected" && team.status !== "withdrawn"),
    [teams],
  );
  const rows = useMemo(() => {
    return activeTeams.map((team) => {
      const divisionCode = teamDivisionCode(team);
      const fee = divisionCode && divFees.has(divisionCode)
        ? divFees.get(divisionCode) ?? baseFee
        : baseFee;
      const paymentStatus = team.payment_status ?? "unpaid";
      return { ...team, divisionCode, fee, paymentStatus };
    });
  }, [activeTeams, baseFee, divFees]);

  const paidRows = rows.filter((team) => team.paymentStatus === "paid" || team.paymentStatus === "waived");
  const unpaidRows = rows.filter((team) => team.paymentStatus !== "paid" && team.paymentStatus !== "waived");
  const paidTotal = paidRows.reduce((sum, team) => sum + (team.paymentStatus === "waived" ? 0 : team.fee), 0);
  const expectedTotal = rows.reduce((sum, team) => sum + (team.paymentStatus === "waived" ? 0 : team.fee), 0);
  const unpaidTotal = Math.max(expectedTotal - paidTotal, 0);

  if (loading) {
    return (
      <div data-skin="toss" className="op-settle-panel">
        <SkelTable rows={5} />
      </div>
    );
  }

  return (
    <div data-skin="toss" className="op-settle-panel">
      {error && <div className="amt-errorbox">{error}</div>}

      <div className="op-settle-kpis">
        <SettleKpi label="입금 합계" value={money(paidTotal)} tone="ok" />
        <SettleKpi label="미수 합계" value={money(unpaidTotal)} tone={unpaidRows.length > 0 ? "warn" : "ok"} />
        <SettleKpi label="지출 합계" value="미연동" tone="mute" sub="DATA-CONTRACT 신규 필드 필요" />
      </div>

      <section className="ts-card ts-card--flat op-settle-card">
        <div className="op-settle-head">
          <div>
            <h3>참가비 입금 현황 ({paidRows.length}/{rows.length}팀)</h3>
            <p>참가팀 탭의 납부 상태와 대회 참가비 설정을 기준으로 계산합니다.</p>
          </div>
          <Btn
            variant="secondary"
            size="sm"
            icon="users"
            onClick={() => {
              window.history.replaceState(null, "", "#teams");
              window.dispatchEvent(new HashChangeEvent("hashchange"));
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          >
            참가팀에서 수정
          </Btn>
        </div>

        <div className="amt-table-wrap">
          <table className="amt-table op-settle-table">
            <thead>
              <tr>
                <th>팀</th>
                <th>종별</th>
                <th>참가비</th>
                <th>납부</th>
                <th>상태</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((team) => (
                <tr key={team.id}>
                  <td>
                    <span className="op-settle-team">
                      <span className="ts-avatar">{team.team.name[0]}</span>
                      <b>{team.team.name}</b>
                    </span>
                  </td>
                  <td>{divisionLabel(team.divisionCode, divisionLabels, singleDivisionLabel)}</td>
                  <td className="op-settle-money">{money(team.fee)}</td>
                  <td>
                    <span className="ct-pill" data-tone={PAYMENT_TONE[team.paymentStatus] ?? "mute"}>
                      {paymentLabel(team.paymentStatus)}
                    </span>
                  </td>
                  <td>
                    <span className="ct-pill" data-tone={team.status === "approved" ? "ok" : "warn"}>
                      {STATUS_LABEL[team.status] ?? team.status}
                    </span>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={5} className="op-settle-empty">
                    정산할 참가팀이 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <div className="ct-emptybox op-settle-note">
        <Icon name="info" size={24} color="var(--ink-dim)" />
        <b>지출·잔액 정산은 아직 데이터 필드가 없습니다.</b>
        <span>DATA-CONTRACT의 expenses 신규 필드가 확정되면 지출 합계와 잔액까지 같은 화면에 연결할 수 있습니다.</span>
      </div>
    </div>
  );
}

function SettleKpi({
  label,
  value,
  tone,
  sub,
}: {
  label: string;
  value: string;
  tone: "ok" | "warn" | "mute";
  sub?: string;
}) {
  return (
    <div className="op-settle-kpi" data-tone={tone}>
      <span>{label}</span>
      <b>{value}</b>
      {sub && <em>{sub}</em>}
    </div>
  );
}

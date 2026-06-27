"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Btn, Icon, Modal, SkelTable, useTossConfirm } from "@/components/admin-toss";
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

// 지출 — API 응답(apiSuccess 재귀 snake). id=BigInt→string, amount=Int, created_at=ISO.
type Expense = {
  id: string;
  label: string;
  amount: number;
  category: string | null;
  memo: string | null;
  created_at: string;
};

type ExpenseDraft = { label: string; amount: string; category: string; memo: string };
const EMPTY_EXPENSE: ExpenseDraft = { label: "", amount: "", category: "", memo: "" };

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
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [draft, setDraft] = useState<ExpenseDraft>(EMPTY_EXPENSE);
  const [submitting, setSubmitting] = useState(false);
  const tossConfirm = useTossConfirm();

  const load = useCallback(async () => {
    if (!tournamentId) return;
    setLoading(true);
    setError("");

    try {
      const [teamsRes, tournamentRes, expensesRes] = await Promise.all([
        fetch(`/api/web/tournaments/${tournamentId}/teams`),
        fetch(`/api/web/tournaments/${tournamentId}`),
        fetch(`/api/web/tournaments/${tournamentId}/expenses`),
      ]);
      if (!teamsRes.ok || !tournamentRes.ok) {
        throw new Error("정산 데이터를 불러오지 못했습니다.");
      }
      setTeams((await teamsRes.json()) as TeamRow[]);
      setTournament((await tournamentRes.json()) as TournamentDetail);
      // 지출 — 신규 테이블(DB 반영 전이면 실패 가능) → 실패해도 입금/미수 본문은 유지(graceful).
      setExpenses(expensesRes.ok ? ((await expensesRes.json()) as Expense[]) : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "정산 데이터를 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, [tournamentId]);

  useEffect(() => {
    void load();
  }, [load]);

  // 지출 추가 — amount 양의 정수(원). 성공 시 리로드.
  const submitExpense = useCallback(async () => {
    const amountNum = Number(draft.amount);
    if (!draft.label.trim() || !Number.isFinite(amountNum) || amountNum <= 0) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/web/tournaments/${tournamentId}/expenses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: draft.label.trim(),
          amount: Math.trunc(amountNum),
          category: draft.category.trim() || null,
          memo: draft.memo.trim() || null,
        }),
      });
      if (!res.ok) throw new Error();
      setDraft(EMPTY_EXPENSE);
      setAddOpen(false);
      await load();
    } catch {
      setError("지출 추가에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  }, [draft, tournamentId, load]);

  const deleteExpense = useCallback(
    async (expense: Expense) => {
      const ok = await tossConfirm.confirm({
        title: "지출 삭제",
        sub: `${expense.label} (${money(expense.amount)})을 삭제합니다.`,
        confirmLabel: "삭제",
        tone: "danger",
      });
      if (!ok) return;
      try {
        const res = await fetch(
          `/api/web/tournaments/${tournamentId}/expenses/${expense.id}`,
          { method: "DELETE" },
        );
        if (!res.ok) throw new Error();
        await load();
      } catch {
        setError("지출 삭제에 실패했습니다.");
      }
    },
    [tossConfirm, tournamentId, load],
  );

  const expenseTotal = useMemo(
    () => expenses.reduce((sum, expense) => sum + (expense.amount ?? 0), 0),
    [expenses],
  );

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
  // 잔액 = 입금 합계 − 지출 합계 (기존 입금/미수 로직 무변경, 지출만 차감).
  const balance = paidTotal - expenseTotal;

  if (loading) {
    return (
      <div className="op-settle-panel op-panel-flow">
        <SkelTable rows={5} />
      </div>
    );
  }

  return (
    <div className="op-settle-panel op-panel-flow">
      {tossConfirm.dialog}
      {error && <div className="amt-errorbox">{error}</div>}

      <div className="op-settle-kpis">
        <SettleKpi label="입금 합계" value={money(paidTotal)} tone="ok" />
        <SettleKpi label="미수 합계" value={money(unpaidTotal)} tone={unpaidRows.length > 0 ? "warn" : "ok"} />
        <SettleKpi label="지출 합계" value={money(expenseTotal)} tone="mute" />
        <SettleKpi label="잔액" value={money(balance)} tone={balance >= 0 ? "ok" : "warn"} sub="입금 − 지출" />
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

      <section className="ts-card ts-card--flat op-settle-card">
        <div className="op-settle-head">
          <div>
            <h3>지출 내역 ({expenses.length}건 · {money(expenseTotal)})</h3>
            <p>대회 운영 지출을 기록합니다. 잔액 = 입금 합계 − 지출 합계.</p>
          </div>
          <Btn size="sm" icon="plus" onClick={() => setAddOpen(true)}>
            지출 추가
          </Btn>
        </div>

        {expenses.length === 0 ? (
          <div className="ct-emptybox op-settle-note">
            <Icon name="receipt" size={24} color="var(--ink-dim)" />
            <b>등록된 지출이 없습니다.</b>
            <span>코트 대관료·심판비 등 운영 지출을 추가하면 잔액에 반영됩니다.</span>
          </div>
        ) : (
          <div className="amt-table-wrap">
            <table className="amt-table op-settle-table">
              <thead>
                <tr>
                  <th>항목</th>
                  <th>분류</th>
                  <th>금액</th>
                  <th>메모</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {expenses.map((expense) => (
                  <tr key={expense.id}>
                    <td><b>{expense.label}</b></td>
                    <td>{expense.category ?? "-"}</td>
                    <td className="op-settle-money">{money(expense.amount)}</td>
                    <td>{expense.memo ?? "-"}</td>
                    <td>
                      <Btn
                        variant="ghost"
                        size="sm"
                        icon="trash-2"
                        onClick={() => deleteExpense(expense)}
                        aria-label="지출 삭제"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {addOpen && (
        <Modal
          open
          onClose={() => setAddOpen(false)}
          maxWidth={480}
          title="지출 추가"
          sub="대회 운영 지출 항목을 기록합니다."
          foot={
            <div className="flex w-full justify-end gap-2">
              <Btn variant="secondary" onClick={() => setAddOpen(false)} disabled={submitting}>
                취소
              </Btn>
              <Btn
                icon="check"
                disabled={submitting || !draft.label.trim() || Number(draft.amount) <= 0}
                onClick={submitExpense}
              >
                {submitting ? "추가 중" : "추가"}
              </Btn>
            </div>
          }
        >
          <div className="space-y-3">
            <label className="ts-field block">
              <span className="ts-field__label">항목명</span>
              <input
                className="ts-input"
                value={draft.label}
                onChange={(event) => setDraft((current) => ({ ...current, label: event.target.value }))}
                placeholder="예: 코트 대관료"
              />
            </label>
            <label className="ts-field block">
              <span className="ts-field__label">금액 (원)</span>
              <input
                className="ts-input"
                type="number"
                min={1}
                value={draft.amount}
                onChange={(event) => setDraft((current) => ({ ...current, amount: event.target.value }))}
                placeholder="50000"
              />
            </label>
            <label className="ts-field block">
              <span className="ts-field__label">분류 (선택)</span>
              <input
                className="ts-input"
                value={draft.category}
                onChange={(event) => setDraft((current) => ({ ...current, category: event.target.value }))}
                placeholder="예: 대관 / 심판 / 물품"
              />
            </label>
            <label className="ts-field block">
              <span className="ts-field__label">메모 (선택)</span>
              <input
                className="ts-input"
                value={draft.memo}
                onChange={(event) => setDraft((current) => ({ ...current, memo: event.target.value }))}
                placeholder="비고"
              />
            </label>
          </div>
        </Modal>
      )}
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

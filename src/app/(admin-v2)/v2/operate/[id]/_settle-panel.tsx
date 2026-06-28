"use client";

// ============================================================
// operate/[id]/_settle-panel.tsx — 정산 패널 (R4-D)
//   정본 1:1 포팅: Dev/design/BDR v2.41-admin-toss/operate.jsx (Settle + ExpenseModal)
//   - 정본은 클라 mock(WS.teams.paid · expenses 배열)이지만, 실 백엔드 존재 → 실데이터.
//   - 입금 = 참가팀(서버 READ) × 종별 참가비(feeKrw) 중 납부 팀 합계(실 paid 상태).
//   - 지출 = tournament_expense(PR-2 신규 테이블) 실 행. GET=서버 READ(props),
//     추가/삭제 = adminFetch 기존 엔드포인트(백엔드 0변경):
//       · POST   /api/web/tournaments/[id]/expenses        {label,amount,category,memo}
//       · DELETE /api/web/tournaments/[id]/expenses/[id]
//   - 팀별 납부 변경 = teams-panel 과 동일 PATCH /teams/[teamId] {paymentStatus}.
//   className(set-*/ops-*/ct-*/amt-*)·마크업은 정본 verbatim.
//   ⚠️ 의도적 deviation: 분류(category) = 실 expense 의 string 필드 + 기본/기존값 파생
//      목록(정본 localStorage 사용자 분류 저장 대신 — 별도 분류 저장처 부재).
// ============================================================

import React from "react";
import { useRouter } from "next/navigation";
import { Icon, Btn, Modal, useAdminShell } from "@/components/admin-v2";
import { adminFetch, AdminApiError } from "@/lib/admin-v2/data/client";
import type { OperateTeam, OperateRule, PayStatus } from "./_teams-panel";

// ── 도메인 타입(서버 단일 매핑) ──────────────────────────────────────────
export type SettleExpense = {
  id: string;
  label: string;
  amount: number;
  category: string | null;
  memo: string | null;
};
export type SettleData = {
  expenses: SettleExpense[];
};

const DEFAULT_EXP_CATS = ["인건비", "대관비", "홍보비", "운영비", "시상"];
const wonF = (n: number) => (Number(n) || 0).toLocaleString() + "원";

function errMsg(e: unknown): string {
  if (e instanceof AdminApiError) return e.message || "요청을 처리하지 못했습니다";
  return "요청을 처리하지 못했습니다";
}

export function SettlePanel({
  tournamentId,
  teams,
  rules,
  data,
}: {
  tournamentId: string;
  teams: OperateTeam[];
  rules: OperateRule[];
  data: SettleData;
}) {
  const { toast } = useAdminShell();
  const router = useRouter();

  // 팀별 납부 상태(서버 paid → 로컬 낙관). props 갱신 동기화.
  const [pays, setPays] = React.useState<Record<string, PayStatus>>(() => {
    const m: Record<string, PayStatus> = {};
    teams.forEach((t) => (m[t.id] = t.paid));
    return m;
  });
  React.useEffect(() => {
    const m: Record<string, PayStatus> = {};
    teams.forEach((t) => (m[t.id] = t.paid));
    setPays(m);
  }, [teams]);

  const [expenses, setExpenses] = React.useState<SettleExpense[]>(data.expenses);
  React.useEffect(() => setExpenses(data.expenses), [data.expenses]);

  const [openDiv, setOpenDiv] = React.useState<string | null>(null);
  const [expOpen, setExpOpen] = React.useState(false);

  // 분류 목록 = 기본값 + 기존 지출에 쓰인 분류(중복 제거)
  const cats = React.useMemo(() => {
    const set = new Set<string>(DEFAULT_EXP_CATS);
    expenses.forEach((e) => {
      if (e.category && e.category.trim()) set.add(e.category.trim());
    });
    return Array.from(set);
  }, [expenses]);

  // ── 집계 ──
  const feeOf = (t: OperateTeam) => rules.find((r) => r.code === t.category)?.fee ?? 0;
  const income = teams
    .filter((t) => pays[t.id] === "paid")
    .reduce((s, t) => s + feeOf(t), 0);
  const out = expenses.reduce((s, e) => s + e.amount, 0);

  const divSummary = rules.map((r) => {
    const dteams = teams.filter((t) => t.category === r.code);
    const paidTeams = dteams.filter((t) => pays[t.id] === "paid");
    return {
      ...r,
      teams: dteams,
      total: dteams.length,
      paidN: paidTeams.length,
      sum: paidTeams.reduce((s, t) => s + feeOf(t), 0),
    };
  });
  const curDiv = openDiv ? divSummary.find((d) => d.code === openDiv) : null;

  // ── 납부 변경(teams PATCH 재사용 · paymentStatus → payment_status) ──
  const setPayment = async (teamId: string, paid: PayStatus) => {
    const prev = pays[teamId];
    setPays((p) => ({ ...p, [teamId]: paid }));
    try {
      await adminFetch(`/api/web/tournaments/${tournamentId}/teams/${teamId}`, {
        method: "PATCH",
        body: { paymentStatus: paid },
      });
      toast(paid === "paid" ? "납부 처리되었습니다" : "납부 상태를 변경했습니다");
    } catch (e) {
      setPays((p) => ({ ...p, [teamId]: prev })); // 롤백
      toast(errMsg(e));
    }
  };

  // ── 지출 추가(POST) / 삭제(DELETE) ──
  const addExpense = async (payload: {
    cat: string;
    label: string;
    amount: number;
    memo: string;
  }) => {
    setExpOpen(false);
    try {
      // label/amount/category/memo = 단일 단어 키 → camel→snake 무해
      const created = await adminFetch<{
        id: string | number;
        label: string;
        amount: number;
        category: string | null;
        memo: string | null;
      }>(`/api/web/tournaments/${tournamentId}/expenses`, {
        method: "POST",
        body: {
          label: payload.label,
          amount: payload.amount,
          category: payload.cat || null,
          memo: payload.memo || null,
        },
      });
      setExpenses((es) => [
        {
          id: String(created.id),
          label: created.label,
          amount: created.amount,
          category: created.category,
          memo: created.memo,
        },
        ...es,
      ]);
      toast("지출을 추가했습니다");
    } catch (e) {
      toast(errMsg(e));
    }
  };
  const removeExpense = async (id: string) => {
    const prev = expenses;
    setExpenses((es) => es.filter((x) => x.id !== id));
    try {
      await adminFetch(`/api/web/tournaments/${tournamentId}/expenses/${id}`, {
        method: "DELETE",
      });
      toast("지출을 삭제했습니다");
    } catch (e) {
      setExpenses(prev); // 롤백
      toast(errMsg(e));
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* KPI */}
      <div className="ct-panel-stats" style={{ gridTemplateColumns: "repeat(3,1fr)" }}>
        {(
          [
            ["입금 합계", wonF(income), "ok"],
            ["지출 합계", wonF(out), "err"],
            ["잔액", wonF(income - out), income - out >= 0 ? "info" : "warn"],
          ] as [string, string, string][]
        ).map(([l, v, tone]) => (
          <div key={l} className="ts-card ts-card--flat" style={{ padding: 16 }}>
            <div className="ct-metric__lbl">{l}</div>
            <div
              style={{
                fontSize: 20,
                fontWeight: 800,
                marginTop: 4,
                color:
                  tone === "err"
                    ? "var(--danger)"
                    : tone === "ok"
                      ? "var(--ok)"
                      : "var(--ink)",
              }}
            >
              {v}
            </div>
          </div>
        ))}
      </div>

      {/* 종별 참가비 요약 */}
      <div className="ts-card ts-card--flat">
        <div className="ops-card-h">
          <div>
            <h3>참가비 입금 현황</h3>
            <p>종별을 누르면 팀별 납부 현황을 확인·수정할 수 있습니다.</p>
          </div>
        </div>
        {divSummary.length === 0 ? (
          <div className="ct-emptybox" style={{ padding: 18, marginTop: 6 }}>
            등록된 종별이 없습니다.
          </div>
        ) : (
          <div className="set-divgrid">
            {divSummary.map((r) => (
              <button
                key={r.code}
                type="button"
                className="set-divcard"
                onClick={() => setOpenDiv(r.code)}
              >
                <div className="set-divcard__top">
                  <span className="set-divcard__nm">{r.label}</span>
                  <Icon name="chevron-right" size={16} color="var(--ink-dim)" />
                </div>
                <div className="set-divcard__amt">{wonF(r.sum)}</div>
                <div className="set-divcard__sub">
                  납부 {r.paidN}/{r.total}팀
                </div>
                <div className="set-divbar">
                  <span style={{ width: (r.total ? (r.paidN / r.total) * 100 : 0) + "%" }} />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 지출 현황 */}
      <div className="ts-card ts-card--flat">
        <div className="ops-card-h">
          <div>
            <h3>지출 현황</h3>
            <p>
              총 {expenses.length}건 · {wonF(out)}
            </p>
          </div>
          <Btn variant="secondary" size="sm" icon="plus" onClick={() => setExpOpen(true)}>
            지출 추가
          </Btn>
        </div>
        <div style={{ marginTop: 6 }}>
          {expenses.length ? (
            expenses.map((e) => (
              <div key={e.id} className="set-exprow">
                <span className="ct-pill" data-tone="mute">
                  {e.category || "기타"}
                </span>
                <div className="set-exprow__body">
                  <div className="set-exprow__t">{e.label}</div>
                  {e.memo && <div className="set-exprow__m">{e.memo}</div>}
                </div>
                <span className="set-exprow__amt">{wonF(e.amount)}</span>
                <button
                  className="ct-iconbtn"
                  title="삭제"
                  onClick={() => removeExpense(e.id)}
                >
                  <Icon name="trash-2" size={15} />
                </button>
              </div>
            ))
          ) : (
            <div className="ct-emptybox" style={{ padding: 18 }}>
              등록된 지출이 없습니다.
            </div>
          )}
        </div>
      </div>

      {/* 종별 상세 모달 — 팀별 납부 수정 */}
      {curDiv && (
        <Modal
          open
          onClose={() => setOpenDiv(null)}
          maxWidth={620}
          title={curDiv.label + " 참가비"}
          sub={`납부 ${curDiv.paidN}/${curDiv.total}팀 · 입금 ${wonF(curDiv.sum)}`}
          foot={<Btn onClick={() => setOpenDiv(null)}>닫기</Btn>}
        >
          {curDiv.teams.length === 0 ? (
            <div className="ct-emptybox" style={{ padding: 18 }}>
              이 종별에 참가팀이 없습니다.
            </div>
          ) : (
            <div className="amt-table-wrap">
              <table className="amt-table">
                <thead>
                  <tr>
                    <th>팀</th>
                    <th>참가비</th>
                    <th>납부</th>
                  </tr>
                </thead>
                <tbody>
                  {curDiv.teams.map((t) => (
                    <tr key={t.id}>
                      <td style={{ fontWeight: 600 }}>{t.name}</td>
                      <td className="amt-table__score">{wonF(feeOf(t))}</td>
                      <td>
                        <select
                          className="ts-select"
                          style={{ width: 108 }}
                          value={pays[t.id] ?? "unpaid"}
                          onChange={(e) => setPayment(t.id, e.target.value as PayStatus)}
                        >
                          <option value="unpaid">미납</option>
                          <option value="paid">납부</option>
                          <option value="refunded">환불</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Modal>
      )}

      {expOpen && (
        <ExpenseModal
          cats={cats}
          onClose={() => setExpOpen(false)}
          onSubmit={addExpense}
        />
      )}
    </div>
  );
}

// ── 지출 추가 모달 ────────────────────────────────────────────────────────
function ExpenseModal({
  cats,
  onClose,
  onSubmit,
}: {
  cats: string[];
  onClose: () => void;
  onSubmit: (p: { cat: string; label: string; amount: number; memo: string }) => void;
}) {
  const [cat, setCat] = React.useState(cats[0] ?? "");
  const [label, setLabel] = React.useState("");
  const [amount, setAmount] = React.useState("");
  const [memo, setMemo] = React.useState("");
  const [adding, setAdding] = React.useState(false);
  const [newCat, setNewCat] = React.useState("");
  const [localCats, setLocalCats] = React.useState<string[]>(cats);
  const canSubmit = label.trim() && +amount > 0;
  const addCat = () => {
    const c = newCat.trim();
    if (!c) return;
    if (!localCats.includes(c)) setLocalCats((cs) => [...cs, c]);
    setCat(c);
    setNewCat("");
    setAdding(false);
  };
  return (
    <Modal
      open
      onClose={onClose}
      maxWidth={420}
      title="지출 추가"
      sub="대회 운영 지출을 분류별로 기록합니다."
      foot={
        <>
          <Btn variant="secondary" onClick={onClose}>
            취소
          </Btn>
          <Btn
            icon="check"
            onClick={() =>
              onSubmit({ cat, label: label.trim(), amount: +amount, memo: memo.trim() })
            }
            {...(canSubmit ? {} : { disabled: true })}
          >
            지출 추가
          </Btn>
        </>
      }
    >
      <label className="ts-field">
        <span className="ts-field__label">분류</span>
        <div style={{ display: "flex", gap: 8 }}>
          <select
            className="ts-select"
            style={{ flex: 1, minWidth: 0 }}
            value={cat}
            onChange={(e) => setCat(e.target.value)}
          >
            {localCats.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
          <Btn variant="secondary" icon={adding ? "x" : "plus"} onClick={() => setAdding((a) => !a)}>
            분류
          </Btn>
        </div>
        {adding && (
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <input
              className="ts-input"
              style={{ flex: 1, minWidth: 0 }}
              value={newCat}
              onChange={(e) => setNewCat(e.target.value)}
              placeholder="새 분류명 (예: 보험료)"
              onKeyDown={(e) => {
                if (!e.nativeEvent.isComposing && e.key === "Enter") addCat();
              }}
            />
            <Btn onClick={addCat} {...(newCat.trim() ? {} : { disabled: true })}>
              추가
            </Btn>
          </div>
        )}
      </label>
      <label className="ts-field">
        <span className="ts-field__label">내용 *</span>
        <input
          className="ts-input"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="예: 체육관 대관료 (2일)"
        />
      </label>
      <label className="ts-field">
        <span className="ts-field__label">금액 *</span>
        <div style={{ position: "relative" }}>
          <input
            type="number"
            className="ts-input"
            style={{ paddingRight: 36, textAlign: "right" }}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0"
          />
          <span
            style={{
              position: "absolute",
              right: 16,
              top: "50%",
              transform: "translateY(-50%)",
              fontSize: 14,
              fontWeight: 700,
              color: "var(--ink-mute)",
              pointerEvents: "none",
            }}
          >
            원
          </span>
        </div>
      </label>
      <label className="ts-field" style={{ marginBottom: 0 }}>
        <span className="ts-field__label">메모</span>
        <textarea
          className="ts-textarea"
          style={{ minHeight: 60 }}
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          placeholder="비고 (선택)"
        />
      </label>
    </Modal>
  );
}

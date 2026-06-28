"use client";

// ============================================================
// operate/[id]/_teams-panel.tsx — 참가팀 패널 (R4-A 첫 패널)
//   정본 1:1 포팅: Dev/design/BDR v2.41-admin-toss/panels-core.jsx (window.TeamsPanel)
//   - 데이터(teams/rules) = 서버 컴포넌트 Prisma READ → props 주입(raw fetch 0).
//   - 상태(승인/거절)·납부 변경 = adminFetch(camel→snake 단일변환) PATCH
//     /api/web/tournaments/[id]/teams/[teamId] (기존 엔드포인트·백엔드 0변경).
//   - 상세 모달 선수 명단 = 실 GG .../teams/[teamId]/players (mock 명단 미사용).
//   - 토큰 발급/일괄입력/선수추가 등 부가기능 = 후속 증분 → "준비 중" 토스트(honest no-op).
//   className(ts-*/ct-*/amt-*)·인라인 스타일은 정본 verbatim.
// ============================================================

import React from "react";
import { useRouter } from "next/navigation";
import { Icon, Btn, Modal, useAdminShell } from "@/components/admin-v2";
import { adminFetch, AdminApiError } from "@/lib/admin-v2/data/client";

// ── 도메인 타입(서버에서 단일 매핑된 camel) ──────────────────────────────
export type TeamStatus = "pending" | "approved" | "rejected" | "withdrawn";
export type PayStatus = "unpaid" | "paid" | "refunded" | "waived";
export type ViaKind = "admin" | "coach_token" | "self" | null;

export type OperateTeam = {
  id: string;
  name: string;
  color: string;
  logo: string | null;
  category: string; // 종별 코드
  status: TeamStatus;
  via: ViaKind;
  players: number;
  paid: PayStatus;
  waiting: number | null;
  manager: string | null;
  appliedAt: string; // "2026-05-03"
};

export type OperateRule = {
  code: string;
  label: string;
  cap: number | null;
  fee: number;
};

// 정본 라벨/톤 맵 (data.jsx 동일값)
const TEAM_STATUS: Record<TeamStatus, string> = {
  pending: "대기 중",
  approved: "승인",
  rejected: "거절",
  withdrawn: "취소",
};
const TEAM_TONE: Record<TeamStatus, string> = {
  pending: "warn",
  approved: "ok",
  rejected: "err",
  withdrawn: "mute",
};
const VIA_LABEL: Record<"admin" | "coach_token" | "self", string> = {
  admin: "운영자",
  coach_token: "코치",
  self: "본인",
};
const PAY_LABEL: Record<PayStatus, string> = {
  paid: "납부",
  unpaid: "미납",
  refunded: "환불",
  waived: "면제",
};

// 상세 모달 선수 명단(실 GET 응답 camel)
type RosterPlayer = {
  id: string | number;
  jerseyNumber: number | null;
  playerName: string | null;
  birthDate: string | null;
  schoolName: string | null;
  position: string | null;
  parentName: string | null;
};

export function TeamsPanel({
  tournamentId,
  tournamentName,
  teams: initialTeams,
  rules,
}: {
  tournamentId: string;
  tournamentName: string;
  teams: OperateTeam[];
  rules: OperateRule[];
}) {
  const { toast } = useAdminShell();
  const router = useRouter();
  const [teams, setTeams] = React.useState<OperateTeam[]>(initialTeams);
  const [filter, setFilter] = React.useState<string>("all");
  const [open, setOpen] = React.useState<OperateTeam | null>(null); // 상세 모달 team

  // 서버 재조회(router.refresh) 후 props 갱신분을 로컬 상태에 동기화(낙관적 갱신 정합)
  React.useEffect(() => {
    setTeams(initialTeams);
  }, [initialTeams]);

  const isCoachPending = (t: OperateTeam) =>
    t.via === "admin" && t.players === 0;

  const counts: Record<string, number> = {
    all: teams.length,
    pending: teams.filter((t) => t.status === "pending").length,
    approved: teams.filter((t) => t.status === "approved").length,
    rejected: teams.filter((t) => t.status === "rejected").length,
    coach_pending: teams.filter(isCoachPending).length,
  };

  const filtered =
    filter === "all"
      ? teams
      : filter === "coach_pending"
        ? teams.filter(isCoachPending)
        : teams.filter((t) => t.status === filter);

  // 종별 현황(승인 ≥ 2 && 정원 미초과 = ready)
  const readiness = rules.map((r) => {
    const appr = teams.filter(
      (t) => t.category === r.code && t.status === "approved"
    ).length;
    const total = teams.filter((t) => t.category === r.code).length;
    const over = r.cap != null && appr > r.cap;
    return { ...r, appr, total, over, ready: appr >= 2 && !over };
  });

  const groups: Record<string, OperateTeam[]> = {};
  filtered.forEach((t) => {
    (groups[t.category] = groups[t.category] || []).push(t);
  });

  const labelOf = (code: string) =>
    rules.find((r) => r.code === code)?.label ?? "기타";

  // ── 상태 변경(승인/거절) — 낙관적 갱신 + adminFetch PATCH ───────────────
  const setStatus = async (id: string, status: TeamStatus) => {
    const prev = teams;
    setTeams((ts) => ts.map((t) => (t.id === id ? { ...t, status } : t)));
    try {
      await adminFetch(
        `/api/web/tournaments/${tournamentId}/teams/${id}`,
        { method: "PATCH", body: { status } }
      );
      toast(status === "approved" ? "승인 처리되었습니다" : "거절 처리되었습니다");
      router.refresh(); // 서버 재조회(teams_count·자동승격 등 부수효과 정합)
    } catch (e) {
      setTeams(prev); // 실패 시 롤백
      toast(e instanceof AdminApiError ? e.message : "처리에 실패했습니다");
    }
  };

  // ── 납부 변경 — adminFetch PATCH(paymentStatus → payment_status) ────────
  const setPayment = async (id: string, paid: PayStatus) => {
    setTeams((ts) => ts.map((t) => (t.id === id ? { ...t, paid } : t)));
    try {
      await adminFetch(
        `/api/web/tournaments/${tournamentId}/teams/${id}`,
        { method: "PATCH", body: { paymentStatus: paid } }
      );
      toast(paid === "paid" ? "납부 처리되었습니다" : "납부 상태를 변경했습니다");
      router.refresh(); // paid → 자동 승격 가능성 → 서버 재조회로 정합
    } catch (e) {
      toast(e instanceof AdminApiError ? e.message : "처리에 실패했습니다");
    }
  };

  // 카톡 안내문(실 대회명) 복사
  const copyKakao = () => {
    const text = `[${tournamentName}] 참가팀 안내\n참가 신청·명단 입력 링크는 운영자에게 문의해 주세요.`;
    try {
      navigator.clipboard.writeText(text);
      toast("카톡 문구를 복사했습니다");
    } catch {
      toast("복사에 실패했습니다");
    }
  };

  return (
    <div>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 8,
          justifyContent: "flex-end",
          marginBottom: 14,
        }}
      >
        <Btn
          variant="secondary"
          size="sm"
          icon="download"
          onClick={() => toast("토큰 내보내기는 준비 중입니다")}
        >
          토큰 파일 받기 ({teams.length})
        </Btn>
        <Btn size="sm" icon="message-circle" onClick={copyKakao}>
          카톡 문구 복사
        </Btn>
      </div>

      {/* 종별 현황 — 한줄 요약 */}
      <div
        className="ts-card ts-card--flat"
        style={{
          marginBottom: 14,
          display: "flex",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 10,
        }}
      >
        <span
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: "var(--ink)",
            flex: "0 0 auto",
          }}
        >
          종별 현황
        </span>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 6,
            flex: 1,
            minWidth: 0,
          }}
        >
          {readiness.length === 0 ? (
            <span style={{ fontSize: 12.5, color: "var(--ink-mute)" }}>
              등록된 종별이 없습니다
            </span>
          ) : (
            readiness.map((r) => (
              <span
                key={r.code}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  fontSize: 13,
                  fontWeight: 600,
                  color: "var(--ink-soft)",
                  background: "var(--grey-100)",
                  padding: "5px 11px",
                  borderRadius: 9,
                }}
              >
                {r.label}{" "}
                <b
                  style={{
                    fontFamily: "var(--ff-mono)",
                    color: r.over ? "var(--danger)" : "var(--ink)",
                  }}
                >
                  {r.total}
                  {r.cap != null ? `/${r.cap}` : ""}
                </b>
                {r.over && (
                  <span className="ct-pill" data-tone="err">
                    초과
                  </span>
                )}
              </span>
            ))
          )}
        </div>
        <span
          style={{ fontSize: 12, color: "var(--ink-mute)", flex: "0 0 auto" }}
        >
          대진 추첨은 대진표 탭
        </span>
      </div>

      {/* 필터 */}
      <div
        style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}
      >
        {(
          [
            ["all", "전체"],
            ["pending", "대기"],
            ["approved", "승인"],
            ["rejected", "거절"],
            ["coach_pending", "코치 미입력"],
          ] as [string, string][]
        ).map(([k, l]) => (
          <button
            key={k}
            className="ts-chip"
            data-active={filter === k}
            onClick={() => setFilter(k)}
          >
            {l}
            <span
              style={{
                fontSize: 11,
                background: "var(--grey-100)",
                padding: "1px 6px",
                borderRadius: 8,
              }}
            >
              {counts[k]}
            </span>
          </button>
        ))}
      </div>

      {/* 참가팀 0건 → 정본 Empty */}
      {teams.length === 0 ? (
        <div className="ct-emptybox">
          <Icon name="users" size={40} color="var(--ink-dim)" />
          <b style={{ color: "var(--ink)" }}>참가 신청한 팀이 없습니다</b>
          <span>접수가 시작되면 신청한 팀이 여기에 표시됩니다.</span>
        </div>
      ) : (
        // 종별 그룹 카드
        Object.keys(groups)
          .sort((a, b) =>
            a === "기타" ? 1 : b === "기타" ? -1 : a.localeCompare(b)
          )
          .map((cat) => (
            <section key={cat} style={{ marginBottom: 16 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 8,
                }}
              >
                <h3
                  style={{
                    fontSize: 13,
                    color: "var(--primary)",
                    textTransform: "uppercase",
                    letterSpacing: ".04em",
                  }}
                >
                  {labelOf(cat)}
                </h3>
                <span style={{ fontSize: 12, color: "var(--ink-mute)" }}>
                  ({groups[cat].length}팀)
                </span>
                <div style={{ flex: 1, borderTop: "1px solid var(--border)" }} />
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                }}
              >
                {groups[cat].map((t) => (
                  <div
                    key={t.id}
                    className="ts-card ts-card--tight"
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      alignItems: "center",
                      gap: 12,
                      justifyContent: "space-between",
                    }}
                  >
                    <button
                      onClick={() => setOpen(t)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        border: 0,
                        background: "transparent",
                        cursor: "pointer",
                        minWidth: 0,
                        textAlign: "left",
                        fontFamily: "var(--ff)",
                      }}
                    >
                      <span
                        style={{
                          width: 38,
                          height: 38,
                          borderRadius: "50%",
                          background: t.color,
                          flex: "0 0 auto",
                          display: "grid",
                          placeItems: "center",
                          color: "#fff",
                          fontWeight: 800,
                          fontSize: 15,
                          overflow: "hidden",
                        }}
                      >
                        {t.logo ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={t.logo}
                            alt=""
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                            }}
                          />
                        ) : (
                          t.name.slice(0, 1)
                        )}
                      </span>
                      <span style={{ minWidth: 0 }}>
                        <span
                          style={{
                            display: "flex",
                            flexWrap: "wrap",
                            alignItems: "center",
                            gap: 6,
                          }}
                        >
                          <b style={{ color: "var(--ink)" }}>{t.name}</b>
                          {t.via && (
                            <span className="ct-pill" data-tone="mute">
                              {VIA_LABEL[t.via]}
                            </span>
                          )}
                          <span
                            className="ct-pill"
                            data-tone={TEAM_TONE[t.status]}
                          >
                            {TEAM_STATUS[t.status]}
                          </span>
                          {t.waiting && (
                            <span className="ct-pill" data-tone="warn">
                              대기 {t.waiting}번
                            </span>
                          )}
                          {isCoachPending(t) && (
                            <span className="ct-pill" data-tone="info">
                              코치 입력 대기
                            </span>
                          )}
                        </span>
                        <span
                          style={{
                            display: "block",
                            fontSize: 12,
                            color: "var(--ink-mute)",
                            marginTop: 3,
                          }}
                        >
                          선수 {t.players}명 · {t.appliedAt} 신청
                          {t.manager ? ` · 코치 ${t.manager}` : ""}
                        </span>
                      </span>
                    </button>
                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      {t.status === "pending" && (
                        <>
                          <Btn
                            size="sm"
                            onClick={() => setStatus(t.id, "approved")}
                          >
                            승인
                          </Btn>
                          <Btn
                            variant="danger"
                            size="sm"
                            onClick={() => setStatus(t.id, "rejected")}
                          >
                            거절
                          </Btn>
                        </>
                      )}
                      {t.status === "approved" && (
                        <Btn
                          variant="danger"
                          size="sm"
                          onClick={() => setStatus(t.id, "rejected")}
                        >
                          거절
                        </Btn>
                      )}
                      {t.status === "rejected" && (
                        <Btn
                          size="sm"
                          onClick={() => setStatus(t.id, "approved")}
                        >
                          승인으로
                        </Btn>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))
      )}

      {open && (
        <TeamModal
          team={open}
          tournamentId={tournamentId}
          rules={rules}
          onClose={() => setOpen(null)}
          onStatus={setStatus}
          onPayment={setPayment}
          toast={toast}
        />
      )}
    </div>
  );
}

// ── 상세 모달 — 실 선수 명단 GET(mock 미사용) ────────────────────────────
function TeamModal({
  team,
  tournamentId,
  rules,
  onClose,
  onStatus,
  onPayment,
  toast,
}: {
  team: OperateTeam;
  tournamentId: string;
  rules: OperateRule[];
  onClose: () => void;
  onStatus: (id: string, status: TeamStatus) => void;
  onPayment: (id: string, paid: PayStatus) => void;
  toast: (m: React.ReactNode) => void;
}) {
  const [pay, setPay] = React.useState<PayStatus>(team.paid);
  const [roster, setRoster] = React.useState<RosterPlayer[] | null>(null);
  const [loadError, setLoadError] = React.useState(false);

  // 모달 진입 시 실 명단 로드(raw fetch 0 — adminFetch GET)
  React.useEffect(() => {
    let alive = true;
    setRoster(null);
    setLoadError(false);
    adminFetch<RosterPlayer[]>(
      `/api/web/tournaments/${tournamentId}/teams/${team.id}/players`
    )
      .then((rows) => {
        if (alive) setRoster(Array.isArray(rows) ? rows : []);
      })
      .catch(() => {
        if (alive) setLoadError(true);
      });
    return () => {
      alive = false;
    };
  }, [tournamentId, team.id]);

  const ruleLabel = rules.find((r) => r.code === team.category)?.label ?? "";

  return (
    <Modal
      open
      onClose={onClose}
      maxWidth={760}
      title={team.name}
      sub={`${ruleLabel} · ${team.appliedAt} 신청`}
      foot={
        <>
          <Btn variant="secondary" onClick={() => window.print()} icon="printer">
            프린트
          </Btn>
          <div style={{ flex: 1 }} />
          {team.status === "pending" ? (
            <>
              <Btn
                onClick={() => {
                  onStatus(team.id, "approved");
                  onClose();
                }}
              >
                승인
              </Btn>
              <Btn
                variant="danger"
                onClick={() => {
                  onStatus(team.id, "rejected");
                  onClose();
                }}
              >
                거절
              </Btn>
            </>
          ) : (
            <Btn variant="secondary" onClick={onClose}>
              닫기
            </Btn>
          )}
        </>
      }
    >
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: 8,
          marginBottom: 14,
        }}
      >
        <span className="ct-pill" data-tone={TEAM_TONE[team.status]}>
          {TEAM_STATUS[team.status]}
        </span>
        <span className="ct-pill" data-tone="mute">
          납부: {PAY_LABEL[pay]}
        </span>
        <select
          className="ts-select"
          style={{ width: "auto" }}
          value={pay}
          onChange={(e) => {
            const v = e.target.value as PayStatus;
            setPay(v);
            onPayment(team.id, v);
          }}
        >
          <option value="unpaid">미납</option>
          <option value="paid">납부</option>
          <option value="refunded">환불</option>
        </select>
        <Btn
          variant="secondary"
          size="sm"
          icon="refresh-cw"
          onClick={() => toast("토큰 재발급은 준비 중입니다")}
        >
          토큰 재발급
        </Btn>
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
          marginBottom: 10,
        }}
      >
        <h3 style={{ fontSize: 14 }}>선수 명단 ({team.players}명)</h3>
        <div style={{ display: "flex", gap: 8 }}>
          <Btn
            variant="secondary"
            size="sm"
            icon="clipboard-paste"
            onClick={() => toast("선수 일괄 입력은 준비 중입니다")}
          >
            일괄 입력
          </Btn>
          <Btn
            size="sm"
            icon="user-plus"
            onClick={() => toast("선수 추가는 준비 중입니다")}
          >
            선수 추가
          </Btn>
        </div>
      </div>
      {loadError ? (
        <p
          style={{ color: "var(--danger)", fontSize: 13, padding: "16px 0" }}
        >
          명단을 불러오지 못했습니다.
        </p>
      ) : roster === null ? (
        <p
          style={{ color: "var(--ink-mute)", fontSize: 13, padding: "16px 0" }}
        >
          명단을 불러오는 중…
        </p>
      ) : roster.length === 0 ? (
        <p
          style={{ color: "var(--ink-mute)", fontSize: 13, padding: "16px 0" }}
        >
          등록된 선수가 없습니다.
        </p>
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
                <th>보호자</th>
              </tr>
            </thead>
            <tbody>
              {roster.map((p, i) => (
                <tr key={p.id ?? i}>
                  <td>{p.jerseyNumber ?? i + 1}</td>
                  <td style={{ fontWeight: 600 }}>{p.playerName ?? "—"}</td>
                  <td className="amt-table__div">
                    {p.birthDate ? String(p.birthDate).slice(0, 10) : "—"}
                  </td>
                  <td className="amt-table__div">{p.schoolName ?? "—"}</td>
                  <td className="amt-table__div">{p.position ?? "—"}</td>
                  <td className="amt-table__div">{p.parentName ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Modal>
  );
}

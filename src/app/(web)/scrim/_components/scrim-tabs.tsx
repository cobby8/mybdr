"use client";

/* ============================================================
 * /scrim — 스크림 매칭 탭 UI (PR-MOCK-TO-REAL ④)
 *
 * 이유(왜):
 *  - 기존 scrim/page.tsx 의 더미(OPEN_REQS/INCOMING/OUTGOING/HISTORY)를 전량 제거하고
 *    team_match_requests 실데이터로 와이어한다. 인터랙션(수락/거절/취소/제안)이 필요하므로
 *    server component(page.tsx)에서 SSR 데이터를 받아 이 client 컴포넌트에서 렌더 + 액션 처리.
 *  - 신규 API/라우트 0: 기존 PATCH /api/web/teams/[id]/match-request/[reqId] (수락/거절/취소)와
 *    POST /api/web/teams/[id]/match-request (제안 보내기, 모달 재사용)만 호출.
 *
 * 방법(어떻게):
 *  - 4탭: 받은 제안 / 보낸 제안 / 지난 기록 / 상대 찾기.
 *  - SSR 응답은 snake_case(from_team / to_team / primary_color / preferred_date 등) 그대로 받음.
 *  - 액션 성공 시 router.refresh() 로 SSR 재조회 → 목록 즉시 동기화.
 *  - 상대 찾기 탭: 스크림 매칭 모델(레이팅 기반 상대 추천)은 DB 부재 → 준비중 안내 + /teams 링크.
 *    제안 보내기 자체는 팀 상세의 "매치 신청" 모달(team-match-request-modal)로 이미 가능.
 * ============================================================ */

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

// SSR 에서 내려오는 제안 1건 — API GET(match-requests) 응답 형태와 동일(snake_case)
export type ScrimRequest = {
  id: string;
  status: string; // pending | accepted | rejected | cancelled
  message: string | null;
  preferred_date: string | null; // ISO
  created_at: string; // ISO
  // 받은 제안 → 상대는 from_team / 보낸 제안 → 상대는 to_team
  counterpart: {
    id: string;
    name: string;
    primary_color: string | null;
    city: string | null;
    district: string | null;
  } | null;
  proposer_nickname: string | null; // 받은 제안에서만 의미
};

type Props = {
  myTeamId: string; // 내 운영팀 id (받은=to_team / 보낸 시 액션 경로의 [id])
  myTeamName: string;
  incoming: ScrimRequest[]; // 받은 제안 (pending)
  outgoing: ScrimRequest[]; // 보낸 제안 (pending)
  history: ScrimRequest[]; // 지난 기록 (accepted/rejected/cancelled)
};

type TabKey = "incoming" | "outgoing" | "history" | "find";

// 상태 → 배지 클래스/라벨 (시안 stMap 역박제, 공용 .ex-badge--*)
const STATUS_BADGE: Record<string, [string, string]> = {
  pending: ["ex-badge--warn", "응답 대기"],
  accepted: ["ex-badge--ok", "수락됨"],
  rejected: ["ex-badge--soft", "거절됨"],
  cancelled: ["ex-badge--soft", "취소됨"],
};

// 팀명 → 이니셜 3글자 (이미지 없을 때 아바타 대체 — 하드코딩 색상 금지 룰)
function teamInitials(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return "TM";
  // 영문이면 앞 3글자, 한글이면 앞 2글자
  const ascii = /^[A-Za-z0-9]/.test(trimmed);
  return (ascii ? trimmed.slice(0, 3) : trimmed.slice(0, 2)).toUpperCase();
}

// 선호 일시 표기 (없으면 빈 문자열)
function formatPreferred(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getMonth() + 1}.${d.getDate()} ${String(d.getHours()).padStart(2, "0")}:${String(
    d.getMinutes(),
  ).padStart(2, "0")}`;
}

// 상대 시간 표기 (created_at → "n시간 전" 류)
function formatAgo(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const diffMs = Date.now() - d.getTime();
  const min = Math.floor(diffMs / 60000);
  if (min < 1) return "방금";
  if (min < 60) return `${min}분 전`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}시간 전`;
  const day = Math.floor(hr / 24);
  return `${day}일 전`;
}

export function ScrimTabs({
  myTeamId,
  myTeamName,
  incoming,
  outgoing,
  history,
}: Props) {
  const router = useRouter();
  const [tab, setTab] = useState<TabKey>(
    // 받은 제안이 있으면 첫 탭, 없으면 받은 제안 탭을 기본 노출(0건 빈상태)
    "incoming",
  );
  // 처리 중인 요청 id (버튼 중복클릭/로딩 표시)
  const [busyId, setBusyId] = useState<string | null>(null);
  const [errMsg, setErrMsg] = useState<string | null>(null);

  // PATCH 공통 — 수락/거절/취소 (기존 API 재사용)
  // teamId: 액션 경로의 [id]. 받은(수락/거절)=내팀(to_team) / 보낸(취소)=내팀(from_team=내팀이 보냄)
  async function patchStatus(
    teamId: string,
    reqId: string,
    nextStatus: "accepted" | "rejected" | "cancelled",
  ) {
    setErrMsg(null);
    setBusyId(reqId);
    try {
      const res = await fetch(`/api/web/teams/${teamId}/match-request/${reqId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok) {
        // 성공 → SSR 재조회로 목록 동기화 (받은/보낸 → 지난 기록 이동)
        router.refresh();
      } else {
        setErrMsg(
          typeof json?.error === "string"
            ? json.error
            : "처리에 실패했습니다. 잠시 후 다시 시도해 주세요.",
        );
      }
    } catch {
      setErrMsg("네트워크 오류가 발생했습니다.");
    } finally {
      setBusyId(null);
    }
  }

  const tabs: [TabKey, string, number][] = [
    ["incoming", "받은 제안", incoming.length],
    ["outgoing", "보낸 제안", outgoing.length],
    ["history", "지난 기록", history.length],
    ["find", "상대 찾기", 0],
  ];

  return (
    <>
      {/* 내 팀 요약 바 — 시안 sc-me 역박제 (레이팅/조건편집은 모델 부재 → 표기만) */}
      <div className="card sc-me">
        <span className="ex-mono ex-mono--accent sc-me__av">
          {teamInitials(myTeamName)}
        </span>
        <div>
          <div className="sc-me__name">{myTeamName}</div>
          <div className="sc-me__meta">
            내 운영팀으로 친선·연습경기 제안을 주고받습니다.
          </div>
        </div>
        <Link href={`/teams/${myTeamId}`} className="btn btn--sm">
          팀 보기
        </Link>
      </div>

      {/* 탭 */}
      <div className="ex-tabs">
        {tabs.map(([k, label, n]) => (
          <button
            key={k}
            className={"ex-tab" + (tab === k ? " is-on" : "")}
            onClick={() => setTab(k)}
          >
            {label}
            {/* find 탭은 카운트 미표기(모델 부재) */}
            {k !== "find" && <span className="ex-tab__n">{n}</span>}
          </button>
        ))}
      </div>

      {/* 액션 에러 — 탭 공통 노출 */}
      {errMsg && (
        <p style={{ fontSize: 13, color: "var(--danger)", marginBottom: 10 }}>
          {errMsg}
        </p>
      )}

      {/* ── 받은 제안 ── */}
      {tab === "incoming" &&
        (incoming.length === 0 ? (
          <EmptyState
            icon="inbox"
            title="받은 제안이 없습니다"
            desc="다른 팀이 우리 팀에 친선·연습경기를 제안하면 여기에 표시됩니다."
          />
        ) : (
          <div className="sc-list">
            {incoming.map((r) => (
              <div key={r.id} className="card sc-prop">
                <span
                  className="ex-mono ex-mono--navy sc-prop__av"
                  aria-hidden="true"
                >
                  {r.counterpart ? teamInitials(r.counterpart.name) : "TM"}
                </span>
                <div>
                  <div className="sc-prop__head">
                    <b style={{ fontSize: 14 }}>
                      {r.counterpart?.name ?? "알 수 없는 팀"}
                    </b>
                    <span className={"ex-badge " + STATUS_BADGE.pending[0]}>
                      {STATUS_BADGE.pending[1]}
                    </span>
                    <span className="sc-prop__when">
                      {formatAgo(r.created_at)}
                    </span>
                  </div>
                  <div className="sc-prop__msg">
                    {r.message ?? "메시지가 없습니다."}
                    {formatPreferred(r.preferred_date) && (
                      <> · 선호 {formatPreferred(r.preferred_date)}</>
                    )}
                  </div>
                </div>
                <div className="sc-prop__act">
                  <button
                    type="button"
                    className="btn btn--sm"
                    disabled={busyId === r.id}
                    onClick={() => patchStatus(myTeamId, r.id, "rejected")}
                  >
                    거절
                  </button>
                  <button
                    type="button"
                    className="btn btn--primary btn--sm"
                    disabled={busyId === r.id}
                    onClick={() => patchStatus(myTeamId, r.id, "accepted")}
                  >
                    {busyId === r.id ? "처리 중" : "수락"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ))}

      {/* ── 보낸 제안 ── */}
      {tab === "outgoing" &&
        (outgoing.length === 0 ? (
          <EmptyState
            icon="send"
            title="보낸 제안이 없습니다"
            desc="팀 상세 페이지에서 '매치 신청'으로 다른 팀에 연습경기를 제안할 수 있습니다."
          />
        ) : (
          <div className="sc-list">
            {outgoing.map((r) => (
              <div key={r.id} className="card sc-prop">
                <span
                  className="ex-mono ex-mono--blue sc-prop__av"
                  aria-hidden="true"
                >
                  {r.counterpart ? teamInitials(r.counterpart.name) : "TM"}
                </span>
                <div>
                  <div className="sc-prop__head">
                    <span style={{ fontSize: 11, color: "var(--ink-dim)" }}>
                      To
                    </span>
                    <b style={{ fontSize: 14 }}>
                      {r.counterpart?.name ?? "알 수 없는 팀"}
                    </b>
                    <span className={"ex-badge " + STATUS_BADGE.pending[0]}>
                      {STATUS_BADGE.pending[1]}
                    </span>
                    <span className="sc-prop__when">
                      {formatAgo(r.created_at)}
                    </span>
                  </div>
                  <div className="sc-prop__msg">
                    {r.message ?? "메시지가 없습니다."}
                    {formatPreferred(r.preferred_date) && (
                      <> · 선호 {formatPreferred(r.preferred_date)}</>
                    )}
                  </div>
                </div>
                <div className="sc-prop__act">
                  <button
                    type="button"
                    className="btn btn--sm"
                    disabled={busyId === r.id || !r.counterpart?.id}
                    onClick={() => r.counterpart?.id && patchStatus(r.counterpart.id, r.id, "cancelled")}
                  >
                    {busyId === r.id ? "처리 중" : "취소"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ))}

      {/* ── 지난 기록 (읽기 전용) ── */}
      {tab === "history" &&
        (history.length === 0 ? (
          <EmptyState
            icon="history"
            title="지난 기록이 없습니다"
            desc="수락·거절·취소된 제안이 여기에 모입니다."
          />
        ) : (
          <div className="sc-list">
            {history.map((r) => {
              const badge = STATUS_BADGE[r.status] ?? STATUS_BADGE.cancelled;
              return (
                <div key={r.id} className="card sc-prop">
                  <span
                    className="ex-mono ex-mono--ink sc-prop__av"
                    aria-hidden="true"
                  >
                    {r.counterpart ? teamInitials(r.counterpart.name) : "TM"}
                  </span>
                  <div>
                    <div className="sc-prop__head">
                      <b style={{ fontSize: 14 }}>
                        {r.counterpart?.name ?? "알 수 없는 팀"}
                      </b>
                      <span className={"ex-badge " + badge[0]}>{badge[1]}</span>
                      <span className="sc-prop__when">
                        {formatAgo(r.created_at)}
                      </span>
                    </div>
                    <div className="sc-prop__msg">
                      {r.message ?? "메시지가 없습니다."}
                      {formatPreferred(r.preferred_date) && (
                        <> · 선호 {formatPreferred(r.preferred_date)}</>
                      )}
                    </div>
                  </div>
                  {/* 읽기 전용 — 액션 버튼 없음 */}
                  <span />
                </div>
              );
            })}
          </div>
        ))}

      {/* ── 상대 찾기 (모델 부재 → 준비중 + /teams 링크) ── */}
      {tab === "find" && (
        <div className="card">
          <div className="ex-empty">
            <span className="ico material-symbols-outlined">handshake</span>
            <div className="ex-empty__t">레이팅 기반 상대 추천 준비 중</div>
            <div className="ex-empty__d">
              팀 레이팅에 맞는 상대를 자동 추천하는 기능을 준비 중입니다. 그동안은
              팀 목록에서 상대 팀을 찾아 직접 매치를 제안할 수 있습니다.
            </div>
            <Link
              href="/teams"
              className="btn btn--primary btn--sm"
              style={{ marginTop: 12 }}
            >
              팀 둘러보기
            </Link>
          </div>
        </div>
      )}
    </>
  );
}

// 탭별 빈상태 — 공용 .ex-empty 셸 재사용
function EmptyState({
  icon,
  title,
  desc,
}: {
  icon: string;
  title: string;
  desc: string;
}) {
  return (
    <div className="card">
      <div className="ex-empty">
        <span className="ico material-symbols-outlined">{icon}</span>
        <div className="ex-empty__t">{title}</div>
        <div className="ex-empty__d">{desc}</div>
      </div>
    </div>
  );
}

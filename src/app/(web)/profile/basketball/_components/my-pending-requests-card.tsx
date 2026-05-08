/* ============================================================
 * MyPendingRequestsCard — 본인 진행 중 신청 통합 카드 (영역 ①)
 *
 * 왜 (사용자 결정 Q3=M-1):
 *  - 본인 진행 흐름 = 사용자가 "내가 어떤 상태인가" 알고 싶은 최우선 본인 전용 가치
 *  - 3종 (team_join_requests + team_member_requests + transfer_requests) 통합 표시
 *  - pending 상태만 — 처리 완료된 건은 활동 로그 (ActivityLog) 가 다룸
 *
 * 어떻게:
 *  - props.requests: page.tsx 에서 3종 fetch + 변환 + 합산 + 정렬 (최신 우선) 후 전달
 *  - 빈 배열 (pending 0건) → 카드 자체 hidden (page.tsx 에서 conditional render)
 *  - 각 항목: kind 라벨 + 팀명 + 신청일 (relative) + 우측 "대기 중" 뱃지
 *  - kind 별 클릭 동작:
 *    · team_join → /teams/[id] (팀 페이지)
 *    · jersey_change/dormant/withdraw → /teams/[id]/manage 또는 /teams/[id]
 *    · transfer_in/out → /teams/[id] (대상 팀)
 *
 *  - Material Symbols Outlined (lucide-react 금지 — CLAUDE.md §디자인 핵심)
 *  - BDR 토큰 (var(--*)) — 핑크/살몬/코랄 ❌ / pill 9999px ❌
 * ============================================================ */

import Link from "next/link";

// 진행 중 신청 통합 타입 — 3 source 매핑 후 단일 union
export type PendingRequest =
  | {
      kind: "team_join";
      id: string;
      teamId: string;
      teamName: string;
      requestedAt: string; // ISO
      preferredJersey: number | null;
    }
  | {
      kind: "jersey_change";
      id: string;
      teamId: string;
      teamName: string;
      requestedAt: string;
      oldJersey: number | null;
      newJersey: number | null;
    }
  | {
      kind: "dormant";
      id: string;
      teamId: string;
      teamName: string;
      requestedAt: string;
      until: string | null; // ISO 또는 null
    }
  | {
      kind: "withdraw";
      id: string;
      teamId: string;
      teamName: string;
      requestedAt: string;
    }
  | {
      kind: "transfer_in";
      id: string;
      teamId: string; // 가는 팀 (toTeam)
      teamName: string;
      requestedAt: string;
      fromTeamName: string;
    }
  | {
      kind: "transfer_out";
      id: string;
      teamId: string; // 떠나는 팀 (fromTeam)
      teamName: string;
      requestedAt: string;
      toTeamName: string;
    };

export interface MyPendingRequestsCardProps {
  requests: PendingRequest[];
}

// kind → Material Symbol 매핑
function getIcon(kind: PendingRequest["kind"]): string {
  switch (kind) {
    case "team_join":
      return "group_add";
    case "jersey_change":
      return "tag";
    case "dormant":
      return "pause_circle";
    case "withdraw":
      return "logout";
    case "transfer_in":
      return "south_west";
    case "transfer_out":
      return "north_east";
  }
}

// kind → 라벨 + 보조 설명 매핑 (요약 1줄)
function describeRequest(r: PendingRequest): { label: string; detail: string } {
  switch (r.kind) {
    case "team_join":
      return {
        label: "가입 신청",
        detail:
          r.preferredJersey != null
            ? `${r.teamName} · 등번호 #${r.preferredJersey} 희망`
            : r.teamName,
      };
    case "jersey_change": {
      const from = r.oldJersey != null ? `#${r.oldJersey}` : "?";
      const to = r.newJersey != null ? `#${r.newJersey}` : "?";
      return {
        label: "등번호 변경",
        detail: `${r.teamName} · ${from} → ${to}`,
      };
    }
    case "dormant":
      return {
        label: "휴면 신청",
        detail:
          r.until != null
            ? `${r.teamName} · ~${fmtDate(r.until)}`
            : `${r.teamName} · 기간 미정`,
      };
    case "withdraw":
      return {
        label: "탈퇴 신청",
        detail: r.teamName,
      };
    case "transfer_in":
      return {
        label: "이적 신청 (입단)",
        detail: `${r.fromTeamName} → ${r.teamName}`,
      };
    case "transfer_out":
      return {
        label: "이적 신청 (전출)",
        detail: `${r.teamName} → ${r.toTeamName}`,
      };
  }
}

// ISO → "M.D" 또는 절대 날짜 (relative 함수 별도)
function fmtDate(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "-";
  return `${d.getMonth() + 1}.${d.getDate()}`;
}

// ISO → "N일 전" / "N시간 전" / "방금 전" (relative)
function fmtRelative(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "-";
  const diffMs = Date.now() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "방금 전";
  if (diffMin < 60) return `${diffMin}분 전`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}시간 전`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 30) return `${diffDay}일 전`;
  return fmtDate(iso);
}

export function MyPendingRequestsCard({ requests }: MyPendingRequestsCardProps) {
  // 빈 상태 — 호출처에서 카드 자체 hidden 보장하지만, defensive 처리
  if (requests.length === 0) return null;

  return (
    <div className="card" style={{ padding: "18px 20px" }}>
      {/* 헤더 — "진행 중 신청 (N)" + 우측 뱃지 색상 BDR Red */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span
            className="material-symbols-outlined"
            style={{ fontSize: 18, color: "var(--accent)" }}
            aria-hidden
          >
            schedule
          </span>
          <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "var(--ink)" }}>
            진행 중 신청
          </h2>
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: "var(--accent)",
              padding: "1px 6px",
              background: "color-mix(in srgb, var(--accent) 14%, transparent)",
              borderRadius: 4,
            }}
          >
            {requests.length}
          </span>
        </div>
      </div>

      {/* 리스트 — 각 항목 클릭 → /teams/[id] 이동 */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {requests.map((r) => {
          const desc = describeRequest(r);
          const icon = getIcon(r.kind);
          // 클릭 라우팅 — 모든 kind 가 팀 페이지로 (가장 단순한 패턴)
          const href = `/teams/${r.teamId}`;
          return (
            <Link
              key={`${r.kind}-${r.id}`}
              href={href}
              style={{
                display: "flex",
                gap: 10,
                alignItems: "center",
                padding: "10px 12px",
                background: "var(--bg-alt)",
                borderRadius: 6,
                textDecoration: "none",
                color: "inherit",
              }}
            >
              {/* 좌측 아이콘 */}
              <span
                style={{
                  width: 32,
                  height: 32,
                  display: "grid",
                  placeItems: "center",
                  flexShrink: 0,
                  background: "var(--bg)",
                  borderRadius: 4,
                  border: "1px solid var(--border)",
                }}
              >
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: 18, color: "var(--ink-soft)" }}
                  aria-hidden
                >
                  {icon}
                </span>
              </span>

              {/* 본문 — 라벨 + 디테일 */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: "var(--ink)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {desc.label}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: "var(--ink-dim)",
                    marginTop: 2,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {desc.detail}
                </div>
              </div>

              {/* 우측 시간 + 뱃지 */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-end",
                  gap: 4,
                  flexShrink: 0,
                }}
              >
                <span
                  style={{
                    fontSize: 10.5,
                    color: "var(--ink-dim)",
                    fontFamily: "var(--ff-mono)",
                  }}
                >
                  {fmtRelative(r.requestedAt)}
                </span>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: "var(--accent)",
                    padding: "1px 5px",
                    background: "color-mix(in srgb, var(--accent) 12%, transparent)",
                    borderRadius: 3,
                    letterSpacing: ".02em",
                  }}
                >
                  대기 중
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

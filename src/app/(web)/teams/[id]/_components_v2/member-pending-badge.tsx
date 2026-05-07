"use client";

import { useEffect, useState } from "react";

/**
 * 5/6 — 본인 카드 좌하단 신청 중 뱃지
 *
 * 표시 위치: roster-tab-v2 본인 row (isMe + !isDormant) 좌하단
 * 4종 신청 분기:
 *   - jersey_change → "#N번 변경 신청 중"
 *   - dormant       → "휴면 신청 중"
 *   - withdraw      → "탈퇴 신청 중"
 *   - transfer      → "→ {toTeamName} 이적 신청 중"
 *
 * fetch: MemberActionsMenu 와 동일 endpoint (단순화 — fetch 중복 비용 작음).
 *        향후 lift state up 으로 통합 가능 (성능 개선 필요 시).
 *
 * pending 0건 = null 렌더 (공간 0).
 */

type Pending =
  | { kind: "loading" }
  | { kind: "none" }
  | { kind: "jersey_change"; newJersey: number | null }
  | { kind: "dormant" }
  | { kind: "withdraw" }
  | { kind: "transfer"; toTeamName: string | null };

interface Props {
  teamId: string;
}

export default function MemberPendingBadge({ teamId }: Props) {
  const [pending, setPending] = useState<Pending>({ kind: "loading" });

  useEffect(() => {
    let cancelled = false;
    fetchPending(teamId).then((p) => {
      if (!cancelled) setPending(p);
    });
    return () => {
      cancelled = true;
    };
  }, [teamId]);

  if (pending.kind === "loading" || pending.kind === "none") return null;

  let label = "";
  if (pending.kind === "jersey_change") {
    label =
      pending.newJersey !== null
        ? `#${pending.newJersey}번 변경 신청 중`
        : "번호 변경 신청 중";
  } else if (pending.kind === "dormant") {
    label = "휴면 신청 중";
  } else if (pending.kind === "withdraw") {
    label = "탈퇴 신청 중";
  } else if (pending.kind === "transfer") {
    label = pending.toTeamName
      ? `→ ${pending.toTeamName} 이적 신청 중`
      : "이적 신청 중";
  }

  return <span className="badge badge--soft">{label}</span>;
}

async function fetchPending(teamId: string): Promise<Pending> {
  // 이유(왜): apiSuccess 는 응답 키를 자동 snake_case 변환 (lib/api/response.ts).
  //   따라서 envelope = { transfer_requests / requests } 직접, payload 내부도 snake_case.
  //   재발 6회 박제 — errors.md 참조.
  try {
    // 이적 신청 우선 — 가장 큰 액션
    const transferRes = await fetch(`/api/web/transfer-requests?status=pending`, {
      cache: "no-store",
    });
    if (transferRes.ok) {
      const j = await transferRes.json();
      const list = (j?.transfer_requests ?? []) as Array<{
        from_team_id: string;
        to_team_id: string;
        to_team?: { name?: string | null } | null;
      }>;
      const t = list.find(
        (r) => String(r.from_team_id) === teamId || String(r.to_team_id) === teamId,
      );
      if (t) {
        return {
          kind: "transfer",
          toTeamName: t.to_team?.name ?? null,
        };
      }
    }

    // member request (jersey/dormant/withdraw)
    const memberRes = await fetch(
      `/api/web/teams/${teamId}/requests?status=pending`,
      { cache: "no-store" },
    );
    if (!memberRes.ok) return { kind: "none" };
    const memberJson = await memberRes.json();
    const list = (memberJson?.requests ?? []) as Array<{
      request_type: string;
      payload: unknown;
    }>;
    if (list.length === 0) return { kind: "none" };
    const first = list[0];
    if (first.request_type === "jersey_change") {
      // payload 내부 키도 snake_case 변환됨 (재귀 변환)
      const p = first.payload as { new_jersey?: number } | null;
      return {
        kind: "jersey_change",
        newJersey: typeof p?.new_jersey === "number" ? p.new_jersey : null,
      };
    }
    if (first.request_type === "dormant") return { kind: "dormant" };
    if (first.request_type === "withdraw") return { kind: "withdraw" };
    return { kind: "none" };
  } catch {
    return { kind: "none" };
  }
}

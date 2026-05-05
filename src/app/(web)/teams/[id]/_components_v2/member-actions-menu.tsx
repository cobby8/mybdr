"use client";

import { useEffect, useRef, useState } from "react";
import { JerseyChangeRequestModal } from "./jersey-change-request-modal";
import { DormantRequestModal } from "./dormant-request-modal";
import { WithdrawRequestModal } from "./withdraw-request-modal";
import { TransferRequestModal } from "./transfer-request-modal";

/**
 * MemberActionsMenu — Phase 2 PR8+PR9 / Phase 3 PR10+PR11
 * ─────────────────────────────────────────────────────────
 * 이유(왜): 팀 페이지 로스터 본인 row 의 액션 dropdown.
 *   "번호 변경" / "휴면 신청" / "이적 신청" / "탈퇴 신청" 4종을 단일 진입점으로 통합.
 *   server component (RosterTabV2) 에서 본인 row 만 마운트해 불필요한 fetch 0.
 *
 * pending 룰 (미묘 룰 #1 — 보고서 §8):
 *  - 같은 (team, user) team_member_requests status='pending' 1건만 허용
 *  - 별도로 transfer_requests final_status='pending' 1건만 허용 (PR10)
 *  - mount 시 GET ?status=pending 두 곳 병렬 호출 → 분기:
 *      none           → 모든 액션 활성
 *      jersey_change  → "내 액션 ▾" 그대로 + jersey 메뉴 disabled / 다른 액션은 가능
 *      ... (각 type 별 disabled 처리)
 *      transfer       → 트리거 "이적 진행 중" disabled (모든 액션 차단 — 이적 미묘 룰)
 *
 * 단순화: 본 PR10 에서는 어떤 pending 이든 1건이라도 있으면 트리거 disabled.
 *   이유: 신청 흐름 동시 진행 차단 (보고서 §8 #1 + 이적 흐름 분리)
 */

type Props = {
  teamId: string;
  teamName?: string | null; // 이적 모달 헤더 표시용
  currentJersey: number | null; // 본인 현재 등번호 (jersey 모달 노출용)
};

type PendingState =
  | { kind: "loading" }
  | { kind: "none" }
  | { kind: "jersey_change"; newJersey: number | null }
  | { kind: "dormant" }
  | { kind: "withdraw" }
  | { kind: "transfer"; toTeamName: string | null };

type ModalKind = "jersey" | "dormant" | "withdraw" | "transfer" | null;

export function MemberActionsMenu({ teamId, teamName, currentJersey }: Props) {
  const [pending, setPending] = useState<PendingState>({ kind: "loading" });
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeModal, setActiveModal] = useState<ModalKind>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // mount 시 본인 pending 1회 조회 (PR6 GET API — 일반 멤버는 본인 신청만 응답)
  useEffect(() => {
    let cancelled = false;
    fetchPending().then((s) => {
      if (!cancelled) setPending(s);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamId]);

  // dropdown clickOutside / Esc 닫기
  useEffect(() => {
    if (!menuOpen) return;
    function onDocClick(e: MouseEvent) {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setMenuOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  async function fetchPending(): Promise<PendingState> {
    try {
      // 이유: TeamMemberRequest pending + TransferRequest pending 을 병렬 조회.
      //   PR10: 이적이 진행 중이면 다른 모든 액션 차단 (단순화 — 흐름 분리).
      const [memberRes, transferRes] = await Promise.all([
        fetch(`/api/web/teams/${teamId}/requests?status=pending`),
        fetch(`/api/web/transfer-requests?status=pending`),
      ]);
      const memberJson = await memberRes.json().catch(() => ({}));
      const transferJson = await transferRes.json().catch(() => ({}));

      // 이적 우선 검사 — pending 이적이 있으면 본 팀 관련성 무관하게 모든 액션 차단
      const transferList = (transferJson?.data?.transferRequests ?? []) as Array<{
        fromTeamId: string;
        toTeamId: string;
        toTeam?: { name?: string | null } | null;
      }>;
      // 본 팀에서 떠나는 이적 (fromTeamId === teamId) 우선 표시
      const ownTransfer =
        transferList.find((t) => t.fromTeamId === teamId) ?? transferList[0] ?? null;
      if (ownTransfer) {
        return {
          kind: "transfer",
          toTeamName: ownTransfer.toTeam?.name ?? null,
        };
      }

      // member request pending
      const list = (memberJson?.data?.requests ?? []) as Array<{
        requestType: string;
        payload: unknown;
      }>;
      if (list.length === 0) return { kind: "none" };
      const first = list[0];
      if (first.requestType === "jersey_change") {
        const p = first.payload as { newJersey?: number } | null;
        return {
          kind: "jersey_change",
          newJersey: typeof p?.newJersey === "number" ? p.newJersey : null,
        };
      }
      if (first.requestType === "dormant") return { kind: "dormant" };
      if (first.requestType === "withdraw") return { kind: "withdraw" };
      return { kind: "none" };
    } catch {
      return { kind: "none" };
    }
  }

  // 신청 성공 시 pending 재조회 (모달 닫힌 직후 호출)
  function handleSuccess() {
    setPending({ kind: "loading" });
    setTimeout(() => {
      fetchPending().then(setPending);
    }, 300);
  }

  // 트리거 버튼 라벨 — pending 분기
  let triggerLabel = "내 액션 ▾";
  let triggerDisabled = false;
  if (pending.kind === "loading") {
    triggerLabel = "확인 중...";
    triggerDisabled = true;
  } else if (pending.kind === "jersey_change") {
    triggerLabel =
      pending.newJersey !== null ? `#${pending.newJersey}번 승인 대기` : "변경 승인 대기";
    triggerDisabled = true;
  } else if (pending.kind === "dormant") {
    triggerLabel = "휴면 승인 대기";
    triggerDisabled = true;
  } else if (pending.kind === "withdraw") {
    triggerLabel = "탈퇴 승인 대기";
    triggerDisabled = true;
  } else if (pending.kind === "transfer") {
    // PR10: 이적 진행 중 라벨 — 어느 사이드 진행 중인지는 마이페이지 진행 카드에서 확인
    triggerLabel = pending.toTeamName ? `→ ${pending.toTeamName} 진행 중` : "이적 진행 중";
    triggerDisabled = true;
  }

  function openModal(kind: ModalKind) {
    setMenuOpen(false);
    setActiveModal(kind);
  }

  return (
    <div ref={containerRef} style={{ position: "relative", display: "inline-block" }}>
      <button
        type="button"
        onClick={() => setMenuOpen((v) => !v)}
        disabled={triggerDisabled}
        className="btn"
        style={{
          fontSize: 11,
          padding: "4px 8px",
          minHeight: 28,
          opacity: triggerDisabled ? 0.65 : 1,
          cursor: triggerDisabled ? "not-allowed" : "pointer",
        }}
      >
        {triggerLabel}
      </button>

      {menuOpen && !triggerDisabled && (
        <div
          role="menu"
          // 메뉴는 버튼 우측 정렬 (본인 카드가 우상단에 위치하므로 right:0 으로 카드 안에서 표시)
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            right: 0,
            minWidth: 140,
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 6,
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            zIndex: 50,
            overflow: "hidden",
          }}
        >
          <button
            type="button"
            role="menuitem"
            onClick={() => openModal("jersey")}
            style={menuItemStyle}
          >
            <span className="material-symbols-outlined" style={menuIconStyle}>
              edit
            </span>
            번호 변경
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => openModal("dormant")}
            style={menuItemStyle}
          >
            <span className="material-symbols-outlined" style={menuIconStyle}>
              pause_circle
            </span>
            휴면 신청
          </button>
          {/* Phase 3 PR10 — 이적 신청. 양쪽 팀장 승인 흐름 (state machine) */}
          <button
            type="button"
            role="menuitem"
            onClick={() => openModal("transfer")}
            style={menuItemStyle}
          >
            <span className="material-symbols-outlined" style={menuIconStyle}>
              swap_horiz
            </span>
            이적 신청
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => openModal("withdraw")}
            style={{ ...menuItemStyle, color: "var(--danger)" }}
          >
            <span className="material-symbols-outlined" style={menuIconStyle}>
              logout
            </span>
            탈퇴 신청
          </button>
        </div>
      )}

      {/* 모달 3종 — 한 번에 하나만 open */}
      <JerseyChangeRequestModal
        teamId={teamId}
        currentJersey={currentJersey}
        open={activeModal === "jersey"}
        onClose={() => setActiveModal(null)}
        onSuccess={handleSuccess}
      />
      <DormantRequestModal
        teamId={teamId}
        open={activeModal === "dormant"}
        onClose={() => setActiveModal(null)}
        onSuccess={handleSuccess}
      />
      <WithdrawRequestModal
        teamId={teamId}
        open={activeModal === "withdraw"}
        onClose={() => setActiveModal(null)}
        onSuccess={handleSuccess}
      />
      {/* Phase 3 PR10 — 이적 신청 모달 */}
      <TransferRequestModal
        fromTeamId={teamId}
        fromTeamName={teamName}
        open={activeModal === "transfer"}
        onClose={() => setActiveModal(null)}
        onSuccess={handleSuccess}
      />
    </div>
  );
}

const menuItemStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  width: "100%",
  padding: "8px 12px",
  fontSize: 12,
  textAlign: "left",
  background: "transparent",
  border: "none",
  cursor: "pointer",
  color: "var(--ink)",
};

const menuIconStyle: React.CSSProperties = {
  fontSize: 14,
};

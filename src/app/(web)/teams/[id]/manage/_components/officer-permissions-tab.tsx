"use client";

// ─────────────────────────────────────────────────────────────────────────────
// 2026-05-05 Phase 4 PR12 — 운영진 권한 위임 탭 (captain only)
// ─────────────────────────────────────────────────────────────────────────────
// 이유(왜): captain 이 manager/coach/treasurer/director 에게 6 종 액션 권한 분배.
//   본 탭은 manage 페이지에 마운트 — captain 만 진입 가능 (상위 isCaptain 가드).
// UI 구성:
//   1. 위임 가능 멤버 목록 (active manager/coach/treasurer/director)
//   2. 각 멤버 행 → 6 권한 체크박스 + "저장" 버튼 (POST /officer-permissions)
//   3. 위임된 운영진 표시 + "회수" 버튼 (DELETE)
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";

interface MemberRow {
  id: string;
  user_id: string;
  nickname: string;
  role: string; // manager / coach / treasurer / director / member ...
  profile_image: string | null;
}

interface PermissionGrant {
  id: string;
  userId: string;
  permissions: Record<string, unknown>;
  grantedAt: string;
  user: {
    id: string;
    nickname: string | null;
    name: string | null;
    profile_image: string | null;
  } | null;
}

// 위임 가능 직급
const DELEGABLE_ROLES = ["manager", "coach", "treasurer", "director"] as const;

// 권한 키 + 라벨
const PERMISSION_KEYS = [
  { key: "jerseyChangeApprove", label: "번호 변경 승인" },
  { key: "dormantApprove", label: "휴면 승인" },
  { key: "withdrawApprove", label: "탈퇴 승인" },
  { key: "transferApprove", label: "이적 승인" },
  { key: "ghostClassify", label: "유령 분류" },
  { key: "forceChange", label: "강제 jersey 변경" },
] as const;

interface Props {
  teamId: string;
  members: MemberRow[]; // manage 페이지에서 이미 로드된 active 멤버 목록 전달
}

export function OfficerPermissionsTab({ teamId, members }: Props) {
  const [grants, setGrants] = useState<PermissionGrant[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingFor, setSavingFor] = useState<string | null>(null); // userId

  // 각 멤버별 임시 체크 상태 (저장 전 변경분)
  const [draftPerms, setDraftPerms] = useState<Record<string, Record<string, boolean>>>({});

  // 위임 가능 멤버 (captain 제외 + role IN delegable)
  const candidates = members.filter((m) =>
    DELEGABLE_ROLES.includes(m.role as (typeof DELEGABLE_ROLES)[number]),
  );

  // 권한 row 로드
  const loadGrants = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/web/teams/${teamId}/officer-permissions`);
      const json = await res.json();
      if (json.success && json.data?.grants) {
        setGrants(json.data.grants);
        // draft 상태 초기화 — 활성 권한 그대로 반영
        const draft: Record<string, Record<string, boolean>> = {};
        for (const g of json.data.grants as PermissionGrant[]) {
          draft[g.userId] = {};
          for (const k of PERMISSION_KEYS) {
            draft[g.userId][k.key] = g.permissions[k.key] === true;
          }
        }
        setDraftPerms(draft);
      }
    } catch {
      // silent fail
    } finally {
      setLoading(false);
    }
  }, [teamId]);

  useEffect(() => {
    loadGrants();
  }, [loadGrants]);

  // 체크 토글
  const togglePerm = (userId: string, permKey: string) => {
    setDraftPerms((prev) => ({
      ...prev,
      [userId]: {
        ...(prev[userId] ?? {}),
        [permKey]: !(prev[userId]?.[permKey] ?? false),
      },
    }));
  };

  // 저장 (POST)
  const handleSave = async (userId: string) => {
    setSavingFor(userId);
    try {
      const permissions = draftPerms[userId] ?? {};
      const res = await fetch(`/api/web/teams/${teamId}/officer-permissions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, permissions }),
      });
      const json = await res.json();
      if (!json.success) {
        alert(json.error?.message ?? "권한 저장 실패");
        return;
      }
      await loadGrants();
    } catch {
      alert("권한 저장 중 오류가 발생했습니다.");
    } finally {
      setSavingFor(null);
    }
  };

  // 회수 (DELETE)
  const handleRevoke = async (userId: string) => {
    if (!confirm("이 운영진의 모든 위임 권한을 회수합니다. 진행하시겠습니까?")) return;
    setSavingFor(userId);
    try {
      const res = await fetch(`/api/web/teams/${teamId}/officer-permissions`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      const json = await res.json();
      if (!json.success) {
        alert(json.error?.message ?? "회수 실패");
        return;
      }
      await loadGrants();
    } catch {
      alert("권한 회수 중 오류가 발생했습니다.");
    } finally {
      setSavingFor(null);
    }
  };

  if (loading) {
    return <div className="text-sm" style={{ color: "var(--color-text-secondary)" }}>로딩 중...</div>;
  }

  if (candidates.length === 0) {
    return (
      <div
        className="rounded-md p-4 text-sm"
        style={{
          background: "var(--color-bg-secondary)",
          color: "var(--color-text-secondary)",
        }}
      >
        위임 가능한 운영진(매니저/코치/총무/감독) 이 없습니다. 멤버 탭에서 직급을 먼저 변경해 주세요.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div
        className="rounded-md p-3 text-xs"
        style={{
          background: "var(--color-bg-tertiary)",
          color: "var(--color-text-secondary)",
        }}
      >
        팀장은 본 팀의 매니저/코치/총무/감독에게 6 종 액션 권한을 분배할 수 있습니다. 위임받은 운영진은
        해당 신청 인박스에 알림을 받고 승인/거부를 처리할 수 있습니다. 팀장이 변경되면 모든 권한이
        자동으로 회수됩니다.
      </div>

      {candidates.map((m) => {
        const grant = grants.find((g) => g.userId === m.user_id);
        const draft = draftPerms[m.user_id] ?? {};
        const hasDraft = !!grant || Object.values(draft).some((v) => v === true);
        const dirty =
          !!grant &&
          PERMISSION_KEYS.some((k) => (draft[k.key] ?? false) !== (grant.permissions[k.key] === true));

        return (
          <div
            key={m.id}
            className="rounded-md border p-3"
            style={{
              borderColor: "var(--color-border)",
              background: "var(--color-bg-secondary)",
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="font-semibold">{m.nickname}</span>
                <span
                  className="text-xs px-2 py-0.5 rounded"
                  style={{
                    background: "var(--color-bg-tertiary)",
                    color: "var(--color-text-secondary)",
                  }}
                >
                  {m.role}
                </span>
                {grant && (
                  <span
                    className="text-xs px-2 py-0.5 rounded"
                    style={{ background: "var(--color-info-soft)", color: "var(--color-info)" }}
                  >
                    위임됨
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                {grant && (
                  <Button
                    variant="ghost"
                    onClick={() => handleRevoke(m.user_id)}
                    disabled={savingFor === m.user_id}
                  >
                    회수
                  </Button>
                )}
                <Button
                  onClick={() => handleSave(m.user_id)}
                  disabled={savingFor === m.user_id || (!hasDraft && !dirty)}
                >
                  {savingFor === m.user_id ? "저장 중..." : grant ? "수정 저장" : "위임"}
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {PERMISSION_KEYS.map((p) => (
                <label
                  key={p.key}
                  className="flex items-center gap-2 text-sm cursor-pointer"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  <input
                    type="checkbox"
                    checked={draft[p.key] ?? false}
                    onChange={() => togglePerm(m.user_id, p.key)}
                  />
                  <span>{p.label}</span>
                </label>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

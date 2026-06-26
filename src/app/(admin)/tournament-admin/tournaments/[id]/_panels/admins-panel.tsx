"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { PanelLoadingState } from "./panel-loading-state";
import { Icon, useTossConfirm } from "@/components/admin-toss";

type Admin = {
  id: string;
  userId: string;
  role: string;
  createdAt: string;
  user: {
    id: string;
    nickname: string | null;
    email: string;
    profile_image_url: string | null;
  };
};

const ROLE_LABEL: Record<string, string> = {
  owner: "주최자",
  admin: "관리자",
  staff: "스태프",
  scorer: "기록원",
};

export default function TournamentAdminsPage() {
  const { id } = useParams<{ id: string }>();
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("admin");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const tossConfirm = useTossConfirm();

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/web/tournaments/${id}/admins`);
      if (res.ok) setAdmins(await res.json());
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const addAdmin = async () => {
    if (!email.trim()) return;
    setAdding(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch(`/api/web/tournaments/${id}/admins`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), role }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "추가 실패");
      setEmail("");
      setSuccess(`${data.user?.nickname ?? email} 님을 추가했습니다.`);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "오류 발생");
    } finally {
      setAdding(false);
    }
  };

  const removeAdmin = async (adminId: string, name: string) => {
    const ok = await tossConfirm.confirm({
      title: "관리자 권한 제거",
      sub: `${name} 님의 대회 관리자 권한이 제거됩니다.`,
      body: "이 사용자는 더 이상 이 대회를 관리할 수 없습니다.",
      confirmLabel: "제거",
      tone: "danger",
    });
    if (!ok) return;
    try {
      await fetch(`/api/web/tournaments/${id}/admins/${adminId}`, { method: "DELETE" });
      await load();
    } catch { /* ignore */ }
  };

  if (loading) return <PanelLoadingState label="운영진 정보를 준비 중입니다." />;

  return (
    // Track B-c — Toss 토큰 적용 루트 opt-in
    <div data-skin="toss">
      {tossConfirm.dialog}
      {/* 추가 폼 */}
      <section className="ts-card mb-6">
        <h2 className="tp-title mb-4">관리자 추가</h2>
        {error && <p className="tp-message mb-3" data-tone="danger">{error}</p>}
        {success && <p className="tp-message mb-3" data-tone="ok">{success}</p>}
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="이메일 주소"
            className="ts-input flex-1"
            onKeyDown={(e) => {
              if (e.nativeEvent.isComposing) return;
              if (e.key === "Enter") addAdmin();
            }}
          />
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="ts-select"
          >
            <option value="admin">관리자</option>
            <option value="staff">스태프</option>
            <option value="scorer">기록원</option>
          </select>
          <button type="button" onClick={addAdmin} disabled={adding || !email.trim()} className="ts-btn ts-btn--primary">
            {adding ? "추가 중..." : "추가"}
          </button>
        </div>
      </section>

      {/* 관리자 목록 */}
      {admins.length === 0 ? (
        <div className="ct-emptybox py-12 text-center text-[var(--ink-mute)]">
          <div className="mb-2 flex justify-center">
            <Icon name="users" size={32} />
          </div>
          추가된 관리자가 없습니다.
        </div>
      ) : (
        <div className="space-y-2">
          {admins.map((admin) => (
            <div key={admin.id} className="ts-card">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="tp-avatar tp-avatar--large tp-avatar--fallback">
                    {(admin.user.nickname ?? admin.user.email)[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium">{admin.user.nickname ?? "이름 없음"}</p>
                    <p className="tp-list-meta">{admin.user.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="tp-role-badge">
                    {ROLE_LABEL[admin.role] ?? admin.role}
                  </span>
                  <button
                    onClick={() => removeAdmin(admin.id, admin.user.nickname ?? admin.user.email)}
                    className="tp-danger-link"
                  >
                    제거
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Icon } from "@/components/admin-toss";

interface Member {
  id: string;
  userId: string;
  nickname: string | null;
  email: string;
  profileImageUrl: string | null;
  role: string;
}

function roleLabel(role: string) {
  if (role === "owner") return "소유자";
  if (role === "admin") return "관리자";
  return "멤버";
}

function roleTone(role: string) {
  if (role === "owner") return "primary";
  if (role === "admin") return "ok";
  return "grey";
}

export default function OrganizationMembersPage() {
  const params = useParams();
  const orgId = params.orgId as string;

  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("member");
  const [inviting, setInviting] = useState(false);
  const [message, setMessage] = useState("");

  const loadMembers = () => {
    fetch(`/api/web/organizations/${orgId}/members`)
      .then((r) => r.json())
      .then((data) => {
        setMembers(
          (data.members || []).map((m: Record<string, unknown>) => ({
            id: m.id,
            userId: m.user_id,
            nickname: m.nickname,
            email: m.email,
            profileImageUrl: m.profile_image_url,
            role: m.role,
          })),
        );
      })
      .catch(() => setMembers([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadMembers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgId]);

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;
    setInviting(true);
    setMessage("");

    try {
      const res = await fetch(`/api/web/organizations/${orgId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail.trim(), role: inviteRole }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage(data.message || "초대가 완료되었습니다.");
        setInviteEmail("");
        loadMembers();
      } else {
        setMessage(data.error || "초대에 실패했습니다.");
      }
    } catch {
      setMessage("네트워크 오류가 발생했습니다.");
    } finally {
      setInviting(false);
    }
  };

  const handleRemove = async (memberId: string, nickname: string | null) => {
    if (!confirm(`${nickname || "멤버"}를 제거하시겠습니까?`)) return;

    try {
      const res = await fetch(`/api/web/organizations/${orgId}/members/${memberId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok) {
        setMembers((prev) => prev.filter((m) => m.id !== memberId));
      } else {
        setMessage(data.error || "제거에 실패했습니다.");
      }
    } catch {
      setMessage("네트워크 오류가 발생했습니다.");
    }
  };

  return (
    <div data-skin="toss" className="mx-auto max-w-3xl space-y-6">
      <div className="ts-ph">
        <div className="ts-ph__row">
          <div style={{ minWidth: 0 }}>
            <div className="ts-ph__eyebrow">
              <Icon name="users" size={15} />
              단체 관리
            </div>
            <div className="ts-ph__title">멤버 관리</div>
            <div className="ts-ph__sub">단체 운영진과 멤버 권한을 관리합니다.</div>
          </div>
        </div>
      </div>

      {message && (
        <div className="ad-panel">
          <div className="ad-statusline">
            <span className="ad-dot" data-tone="ok" />
            {message}
          </div>
        </div>
      )}

      <section className="ad-panel">
        <div className="ad-panel__head">
          <div className="ad-panel__title">멤버 초대</div>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            type="email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="email@example.com"
            className="ts-input"
            onKeyDown={(e) => {
              if (e.nativeEvent.isComposing) return;
              if (e.key === "Enter") handleInvite();
            }}
          />
          <select
            value={inviteRole}
            onChange={(e) => setInviteRole(e.target.value)}
            className="ts-select sm:max-w-[140px]"
          >
            <option value="member">멤버</option>
            <option value="admin">관리자</option>
          </select>
          <button
            type="button"
            onClick={handleInvite}
            disabled={inviting}
            className="ts-btn ts-btn--primary"
          >
            <Icon name="user-plus" size={17} />
            {inviting ? "초대 중..." : "초대"}
          </button>
        </div>
      </section>

      {loading && (
        <div className="ad-panel space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 animate-pulse rounded-[14px] bg-[var(--grey-100)]" />
          ))}
        </div>
      )}

      {!loading && members.length > 0 && (
        <section className="ad-panel">
          <div className="ad-panel__head">
            <div className="ad-panel__title">멤버 목록</div>
            <span className="ts-badge ts-badge--grey">{members.length}명</span>
          </div>
          <div className="ad-list">
            {members.map((member) => (
              <div key={member.id} className="ad-listrow">
                <span className="ad-avatar-sm" style={{ background: "var(--primary)" }}>
                  {member.profileImageUrl ? (
                    <img src={member.profileImageUrl} alt="" className="h-full w-full rounded-[50%] object-cover" />
                  ) : (
                    (member.nickname || member.email).charAt(0).toUpperCase()
                  )}
                </span>
                <div className="ad-listrow__body">
                  <div className="ad-listrow__t">{member.nickname || "이름 없음"}</div>
                  <div className="ad-listrow__s">{member.email}</div>
                </div>
                <span className={`ts-badge ts-badge--${roleTone(member.role)}`}>
                  {roleLabel(member.role)}
                </span>
                {member.role !== "owner" && (
                  <button
                    type="button"
                    onClick={() => handleRemove(member.id, member.nickname)}
                    className="ad-iconbtn"
                    title="멤버 제거"
                  >
                    <Icon name="x" size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {!loading && members.length === 0 && (
        <div className="ts-empty">
          <div className="ts-empty__icon">
            <Icon name="users" size={30} />
          </div>
          <div className="ts-empty__title">멤버가 없습니다</div>
          <div className="ts-empty__desc">이메일로 첫 멤버를 초대해 주세요.</div>
        </div>
      )}
    </div>
  );
}

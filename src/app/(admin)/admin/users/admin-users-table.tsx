"use client";

// 2026-05-04: (web) 디자인 시스템 통일 (Phase C-3)
// - <Card> wrapper 제거 → DataTableV2 직접 노출
// - <Badge> → .badge--soft + 역할/상태별 inline color
// - 자체 rounded bg-* 버튼 → .btn .btn--primary / .btn--sm

import { useState, useEffect, useMemo } from "react";
import { AdminStatusTabs } from "@/components/admin/admin-status-tabs";
import { MEMBERSHIP_LABELS, type MembershipType } from "@/lib/auth/roles";
// v2.1 P2: DataTableV2 도입 — 모바일 ≤720px 자동 카드형 변환
import { DataTableV2, type DataTableColumn } from "@/components/bdr-v2/data-table";

interface SerializedUser {
  id: string;
  email: string;
  nickname: string | null;
  name: string | null;
  phone: string | null;
  membershipType: number;
  isAdmin: boolean | null;
  status: string | null;
  provider: string | null;
  uid: string | null;
  city: string | null;
  district: string | null;
  position: string | null;
  height: number | null;
  weight: number | null;
  bio: string | null;
  birth_date: string | null;
  profile_image_url: string | null;
  evaluation_rating: number | null;
  total_games_hosted: number | null;
  total_games_participated: number | null;
  last_login_at: string | null;
  createdAt: string;
  updatedAt: string;
}

// 역할별 .badge--soft inline color (default / info / warning / info)
const ROLE_STYLE: Record<number, React.CSSProperties | undefined> = {
  0: undefined, // .badge--soft 기본
  1: {
    background: "color-mix(in srgb, var(--color-info) 12%, transparent)",
    color: "var(--color-info)",
    borderColor: "transparent",
  },
  2: {
    background: "color-mix(in srgb, var(--color-warning) 12%, transparent)",
    color: "var(--color-warning)",
    borderColor: "transparent",
  },
  3: {
    background: "color-mix(in srgb, var(--color-info) 12%, transparent)",
    color: "var(--color-info)",
    borderColor: "transparent",
  },
};

// 공통 라벨 + UI inline style 을 합쳐서 반환하는 헬퍼
function getRoleInfo(mt: number) {
  return {
    label: MEMBERSHIP_LABELS[mt as MembershipType] ?? String(mt),
    style: ROLE_STYLE[mt],
  };
}

// 상태 뱃지 — DataTableV2 columns 명세에서도 사용하므로 모듈 스코프로 끌어올림
function statusBadge(s: string | null) {
  if (s === "active") {
    return (
      <span
        className="badge badge--soft"
        style={{ background: "color-mix(in srgb, var(--color-success) 12%, transparent)", color: "var(--color-success)", borderColor: "transparent" }}
      >
        활성
      </span>
    );
  }
  if (s === "withdrawn") {
    return <span className="badge badge--soft">탈퇴</span>;
  }
  return (
    <span
      className="badge badge--soft"
      style={{ background: "color-mix(in srgb, var(--color-error) 12%, transparent)", color: "var(--color-error)", borderColor: "transparent" }}
    >
      정지
    </span>
  );
}

// 2026-05-04: 가입일시 압축 표시 — "26.05.04 14:23" (테이블 1열에 들어가도록 짧게)
function fmtCreatedAt(iso: string): string {
  const d = new Date(iso);
  const yy = String(d.getFullYear()).slice(2);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${yy}.${mm}.${dd} ${hh}:${mi}`;
}

// v2.1 P2: DataTableV2 컬럼 명세 — 가입일시 1열 추가 (사용자 요구 2026-05-04)
//   기존: [닉네임 / 이메일 / 역할 / 관리자 / 상태] = 5컬럼
//   변경: [가입일시 / 닉네임 / 이메일 / 역할 / 관리자 / 상태] = 6컬럼
//   닉네임 primary 유지 (모바일 카드 제목)
const USER_COLUMNS: DataTableColumn<SerializedUser>[] = [
  {
    key: "createdAt",
    label: "가입일시",
    width: "150px",
    render: (u) => (
      <span
        className="text-xs tabular-nums whitespace-nowrap"
        style={{ color: "var(--color-text-muted)" }}
      >
        {fmtCreatedAt(u.createdAt)}
      </span>
    ),
  },
  {
    key: "nickname",
    label: "닉네임",
    primary: true,
    width: "1.2fr",
    render: (u) => (
      <span className="font-medium">
        {u.isAdmin && <span className="mr-1" style={{ color: "var(--color-error)" }}>★</span>}
        {u.nickname ?? "-"}
      </span>
    ),
  },
  {
    key: "email",
    label: "이메일",
    width: "1.5fr",
    render: (u) => (
      <span className="max-w-[200px] truncate inline-block align-middle" style={{ color: "var(--color-text-muted)" }}>{u.email}</span>
    ),
  },
  {
    key: "role",
    label: "역할",
    width: "120px",
    render: (u) => {
      const role = getRoleInfo(u.membershipType);
      return (
        <span className="badge badge--soft" style={role.style}>
          {role.label}
        </span>
      );
    },
  },
  {
    key: "isAdmin",
    label: "관리자",
    width: "100px",
    render: (u) =>
      u.isAdmin ? (
        <span className="text-xs font-semibold" style={{ color: "var(--color-error)" }}>ON</span>
      ) : (
        <span style={{ color: "var(--color-text-muted)" }}>-</span>
      ),
  },
  {
    key: "status",
    label: "상태",
    width: "100px",
    render: (u) => statusBadge(u.status),
  },
];

interface Props {
  // 2026-05-04: page=N 페이지네이션 → 무한 스크롤 (더보기 버튼) 전환.
  //   initialUsers = SSR 첫 50명 / totalCount = 검색조건 적용 전체 / searchQuery = ?q= 값 / loadMoreAction = 더보기 server action
  initialUsers: SerializedUser[];
  totalCount: number;
  searchQuery: string | null;
  loadMoreAction: (
    offset: number,
    q: string | null,
  ) => Promise<{ users: Array<Record<string, unknown>>; hasMore: boolean }>;
  updateUserRoleAction: (formData: FormData) => Promise<void>;
  updateUserStatusAction: (formData: FormData) => Promise<void>;
  toggleUserAdminAction: (formData: FormData) => Promise<void>;
  forceWithdrawAction: (formData: FormData) => Promise<void>;
  deleteAction: (formData: FormData) => Promise<void>;
}

export function AdminUsersTable({
  initialUsers,
  totalCount,
  searchQuery,
  loadMoreAction,
  updateUserRoleAction,
  updateUserStatusAction,
  toggleUserAdminAction,
  forceWithdrawAction,
  deleteAction,
}: Props) {
  const [selectedUser, setSelectedUser] = useState<SerializedUser | null>(null);
  const [tab, setTab] = useState<"info" | "edit">("info");
  const [confirm, setConfirm] = useState<"withdraw" | "delete" | null>(null);
  const [pending, setPending] = useState(false);
  // 역할별 필터링 탭 상태
  const [activeRoleTab, setActiveRoleTab] = useState("all");

  // 2026-05-04: 더보기 누적 로딩 — initialUsers 부터 시작해서 server action 으로 추가
  const [users, setUsers] = useState<SerializedUser[]>(initialUsers);
  const [hasMore, setHasMore] = useState<boolean>(initialUsers.length < totalCount);
  const [loadingMore, setLoadingMore] = useState(false);

  // SSR 데이터가 갱신되면 (검색어 변경 등) state reset
  useEffect(() => {
    setUsers(initialUsers);
    setHasMore(initialUsers.length < totalCount);
  }, [initialUsers, totalCount]);

  const handleLoadMore = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const result = await loadMoreAction(users.length, searchQuery);
      // 직렬화된 SerializedUser 형태로 캐스팅 (server action 이 동일 select 룰 사용 — actions/admin-users.ts 참조)
      const next = result.users as unknown as SerializedUser[];
      setUsers((prev) => [...prev, ...next]);
      setHasMore(result.hasMore);
    } finally {
      setLoadingMore(false);
    }
  };

  // 역할별 탭 목록 + 개수 계산 — 현재 누적 로딩된 users 기준
  // (전체 카운트는 totalCount 별도, 탭은 표시된 데이터 분류 용도)
  const roleTabs = useMemo(() => [
    { key: "all", label: "전체", count: users.length },
    { key: "normal", label: "일반", count: users.filter((u) => u.membershipType === 0 && !u.isAdmin).length },
    { key: "host", label: "호스트", count: users.filter((u) => u.membershipType >= 1 && !u.isAdmin).length },
    { key: "admin", label: "관리자", count: users.filter((u) => u.isAdmin).length },
  ], [users]);

  // 탭에 따라 유저 필터링
  const filteredUsers = useMemo(() => {
    if (activeRoleTab === "all") return users;
    if (activeRoleTab === "normal") return users.filter((u) => u.membershipType === 0 && !u.isAdmin);
    if (activeRoleTab === "host") return users.filter((u) => u.membershipType >= 1 && !u.isAdmin);
    if (activeRoleTab === "admin") return users.filter((u) => u.isAdmin);
    return users;
  }, [users, activeRoleTab]);

  useEffect(() => {
    document.body.style.overflow = selectedUser ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [selectedUser]);

  const closeModal = () => { setSelectedUser(null); setTab("info"); setConfirm(null); };

  const runAction = async (action: (fd: FormData) => Promise<void>, data: Record<string, string>) => {
    setPending(true);
    const fd = new FormData();
    for (const [k, v] of Object.entries(data)) fd.set(k, v);
    await action(fd);
    setPending(false);
    closeModal();
  };

  const fmt = (iso: string | null) => iso ? new Date(iso).toLocaleDateString("ko-KR") : "-";
  const fmtFull = (iso: string | null) => iso ? new Date(iso).toLocaleString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }) : "-";

  // statusBadge는 모듈 스코프로 이동됨 (DataTableV2 columns에서도 사용)

  return (
    <>
      {/* 역할별 필터 탭 */}
      <AdminStatusTabs tabs={roleTabs} activeTab={activeRoleTab} onChange={setActiveRoleTab} />

      {/* v2.1 P2: DataTableV2 — 데스크톱 표 + 모바일 ≤720px 자동 카드형 (G-1 룰) */}
      <DataTableV2<SerializedUser>
        rowKey={(u) => u.id}
        rows={filteredUsers}
        columns={USER_COLUMNS}
        onRowClick={(user) => { setSelectedUser(user); setTab("info"); setConfirm(null); }}
        emptyMessage="조건에 맞는 회원이 없습니다."
      />

      {/* 2026-05-04: 더보기 버튼 (페이지네이션 대체) — 검색 시에도 동일하게 작동
            누적 표시 / hasMore=false 면 "전체 표시 완료" 메시지 / 활성 탭 필터는 client side */}
      <div className="mt-4 flex flex-col items-center gap-2">
        <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
          {users.length.toLocaleString()} / {totalCount.toLocaleString()}명 표시
        </p>
        {hasMore ? (
          <button
            onClick={handleLoadMore}
            disabled={loadingMore}
            className="btn btn--sm disabled:opacity-50"
          >
            {loadingMore ? "불러오는 중..." : `더보기 (+${Math.min(50, totalCount - users.length)}명)`}
          </button>
        ) : users.length > 0 ? (
          <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
            전체 표시 완료
          </p>
        ) : null}
      </div>

      {/* 상세 모달 */}
      {selectedUser && (() => {
        const u = selectedUser;
        const role = getRoleInfo(u.membershipType);
        return (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm" onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}>
            <div className="w-full max-w-md max-h-[90vh] overflow-hidden rounded-t-[20px] sm:rounded-[20px] bg-[var(--color-card)] shadow-[0_-8px_40px_rgba(0,0,0,0.2)] sm:shadow-[0_8px_40px_rgba(0,0,0,0.2)] flex flex-col animate-slide-up sm:animate-fade-in">

              {/* 프로필 헤더 */}
              <div className="relative bg-gradient-to-br from-[var(--color-accent)] to-[var(--color-accent-hover)] px-6 pt-5 pb-4">
                <button onClick={closeModal} className="absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-full bg-white/20 text-white/80 hover:bg-white/30">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12" /></svg>
                </button>
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 text-lg font-bold text-white">
                    {(u.nickname ?? u.email)?.[0]?.toUpperCase() ?? "?"}
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-white flex items-center gap-1.5">
                      {u.nickname ?? "-"}
                      {/* 관리자 라벨: warning 토큰 (그라디언트 배경 위지만 시맨틱 강조 의미 유지) */}
                      {u.isAdmin && <span className="text-(--color-warning) text-xs">★ 관리자</span>}
                    </h2>
                    <p className="text-xs text-white/70">{u.email}</p>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <span className="badge badge--soft" style={role.style}>{role.label}</span>
                  {statusBadge(u.status)}
                  {u.provider && <span className="rounded-full bg-white/15 px-2 py-0.5 text-xs text-white/80">{u.provider}</span>}
                </div>
              </div>

              {/* 탭 */}
              <div className="flex border-b border-[var(--color-border)]">
                <button onClick={() => { setTab("info"); setConfirm(null); }}
                  className={`flex-1 py-2.5 text-xs font-semibold transition-colors ${tab === "info" ? "text-[var(--color-accent)] border-b-2 border-[var(--color-accent)]" : "text-[var(--color-text-muted)]"}`}>
                  상세정보
                </button>
                <button onClick={() => { setTab("edit"); setConfirm(null); }}
                  className={`flex-1 py-2.5 text-xs font-semibold transition-colors ${tab === "edit" ? "text-[var(--color-accent)] border-b-2 border-[var(--color-accent)]" : "text-[var(--color-text-muted)]"}`}>
                  관리
                </button>
              </div>

              {/* 컨텐츠 */}
              <div className="flex-1 overflow-y-auto px-5 py-4">
                {tab === "info" ? (
                  <div className="space-y-4">
                    <InfoSection title="기본 정보" rows={[
                      ["ID", u.id],
                      ["이름", u.name],
                      ["연락처", u.phone],
                      ["생년월일", fmt(u.birth_date)],
                      ["지역", [u.city, u.district].filter(Boolean).join(" ") || null],
                      ["소개", u.bio],
                    ]} />
                    <InfoSection title="농구 정보" rows={[
                      ["포지션", u.position],
                      ["키", u.height ? `${u.height}cm` : null],
                      ["몸무게", u.weight ? `${u.weight}kg` : null],
                      ["평가점수", u.evaluation_rating?.toFixed(1) ?? null],
                      ["주최 경기", String(u.total_games_hosted ?? 0)],
                      ["참여 경기", String(u.total_games_participated ?? 0)],
                    ]} />
                    <InfoSection title="계정" rows={[
                      ["OAuth", u.provider ?? "이메일"],
                      ["가입일", fmtFull(u.createdAt)],
                      ["최근 로그인", fmtFull(u.last_login_at)],
                    ]} />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* 역할 변경 */}
                    <div className="rounded-[14px] border p-4" style={{ borderColor: "var(--color-border)" }}>
                      <p className="mb-2.5 text-xs font-bold" style={{ color: "var(--color-text-secondary)" }}>역할 변경</p>
                      <form action={async (fd: FormData) => { fd.set("user_id", u.id); await updateUserRoleAction(fd); closeModal(); }}
                        className="flex items-center gap-2">
                        <select name="membership_type" defaultValue={u.membershipType}
                          className="flex-1 rounded-[10px] border px-3 py-2 text-sm outline-none"
                          style={{ borderColor: "var(--color-border)", background: "var(--color-card)", color: "var(--color-text-secondary)" }}>
                          <option value={0}>일반유저</option>
                          <option value={1}>픽업호스트</option>
                          <option value={2}>팀장</option>
                          <option value={3}>대회관리자</option>
                        </select>
                        <button type="submit" className="btn btn--primary btn--sm">변경</button>
                      </form>
                    </div>

                    {/* 슈퍼관리자 */}
                    <div className="rounded-[14px] border p-4 flex items-center justify-between" style={{ borderColor: "var(--color-border)" }}>
                      <div>
                        <p className="text-xs font-bold" style={{ color: "var(--color-text-secondary)" }}>슈퍼관리자</p>
                        <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>시스템 전체 관리 권한</p>
                      </div>
                      {/* (web) .btn 패턴 — 해제는 위험 톤 inline */}
                      <button onClick={() => runAction(toggleUserAdminAction, { user_id: u.id, make_admin: u.isAdmin ? "false" : "true" })}
                        disabled={pending}
                        className="btn btn--sm disabled:opacity-50"
                        style={u.isAdmin ? { background: "var(--color-error)", color: "#fff", borderColor: "var(--color-error)" } : undefined}>
                        {u.isAdmin ? "해제" : "지정"}
                      </button>
                    </div>

                    {/* 계정 상태 */}
                    <div className="rounded-[14px] border p-4 flex items-center justify-between" style={{ borderColor: "var(--color-border)" }}>
                      <div>
                        <p className="text-xs font-bold" style={{ color: "var(--color-text-secondary)" }}>계정 상태</p>
                        <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>현재: {u.status === "active" ? "활성" : u.status === "withdrawn" ? "탈퇴" : "정지"}</p>
                      </div>
                      <button onClick={() => runAction(updateUserStatusAction, { user_id: u.id, status: u.status === "active" ? "suspended" : "active" })}
                        disabled={pending}
                        className="btn btn--sm disabled:opacity-50"
                        style={
                          u.status === "active"
                            ? { borderColor: "var(--color-warning)", color: "var(--color-warning)" }
                            : { borderColor: "var(--color-success)", color: "var(--color-success)" }
                        }>
                        {u.status === "active" ? "정지" : "활성화"}
                      </button>
                    </div>

                    {/* 위험 영역 */}
                    {!u.isAdmin && (
                      <div
                        className="rounded-[14px] border p-4"
                        style={{ borderColor: "color-mix(in srgb, var(--color-error) 30%, transparent)", background: "color-mix(in srgb, var(--color-error) 3%, transparent)" }}
                      >
                        <p className="mb-1 text-xs font-bold" style={{ color: "var(--color-error)" }}>위험 영역</p>
                        <p className="mb-3 text-xs" style={{ color: "var(--color-text-muted)" }}>이 작업은 되돌릴 수 없습니다.</p>
                        {confirm ? (
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium" style={{ color: "var(--color-error)" }}>
                              {confirm === "delete" ? "DB에서 완전히 삭제합니다." : "개인정보를 삭제하고 탈퇴 처리합니다."}
                            </span>
                            <div className="flex gap-1.5 ml-auto">
                              <button onClick={() => setConfirm(null)} className="btn btn--sm">취소</button>
                              <button onClick={() => runAction(confirm === "delete" ? deleteAction : forceWithdrawAction, { user_id: u.id })}
                                disabled={pending}
                                className="btn btn--sm disabled:opacity-50"
                                style={{ background: "var(--color-error)", color: "#fff", borderColor: "var(--color-error)" }}>
                                {pending ? "처리 중..." : "확인"}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            {u.status !== "withdrawn" && (
                              <button onClick={() => setConfirm("withdraw")}
                                className="btn btn--sm"
                                style={{ borderColor: "var(--color-warning)", color: "var(--color-warning)" }}>
                                강제탈퇴
                              </button>
                            )}
                            <button onClick={() => setConfirm("delete")}
                              className="btn btn--sm"
                              style={{ borderColor: "var(--color-error)", color: "var(--color-error)" }}>
                              완전 삭제
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      <style jsx global>{`
        @keyframes slide-up { from { transform: translateY(100%); } to { transform: translateY(0); } }
        @keyframes fade-in { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        .animate-slide-up { animation: slide-up 0.25s ease-out; }
        .animate-fade-in { animation: fade-in 0.2s ease-out; }
      `}</style>
    </>
  );
}

function InfoSection({ title, rows }: { title: string; rows: [string, string | null | undefined][] }) {
  return (
    <div>
      <p className="mb-1.5 text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider">{title}</p>
      <div className="rounded-[12px] border border-[var(--color-border)] overflow-hidden">
        {rows.map(([label, value], i) => (
          <div key={label} className={`flex items-center px-4 py-2 ${i > 0 ? "border-t border-[var(--color-border-subtle)]" : ""}`}>
            <span className="w-20 shrink-0 text-xs text-[var(--color-text-muted)]">{label}</span>
            <span className="text-sm text-[var(--color-text-primary)] break-all">{value || <span className="text-[var(--color-text-muted)]">-</span>}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

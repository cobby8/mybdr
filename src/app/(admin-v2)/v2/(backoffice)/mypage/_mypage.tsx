"use client";

// ============================================================
// _mypage.tsx — 컷오버 관리자 마이페이지(클라). 레거시 (admin)/admin/me 7카드 포팅.
//   1)계정 2)본인인증 3)알림 4)건의사항 5)권한 매트릭스 6)관리 토너먼트 7)최근 활동.
//   ⚠ 전부 표시 전용(props = 서버 READ 직렬화). mutation 0·fetch 0·백엔드 0변경.
//   디자인: admin-v2 ts-card/Badge/Icon + var(--*) 토큰만(하드코딩 색상 0·pill 9999px 0).
//   상태(useState)는 관리 토너먼트 그룹 펼치기 토글에만 사용(레거시 동일).
// ============================================================

import React from "react";
import Link from "next/link";
import { PageHead, Badge, Icon, type BadgeTone } from "@/components/admin-v2";

// ── 직렬화 타입(page.tsx 와 1:1) ──
export interface MyPageData {
  user: {
    id: string;
    nickname: string | null;
    email: string;
    createdAtIso: string;
    profileImageUrl: string | null;
  };
  identityMethod: string | null;
  notifications: {
    unreadCount: number;
    items: { id: string; type: string; status: string; title: string; createdAtIso: string }[];
  };
  suggestions: {
    pendingCount: number;
    items: { id: string; title: string; category: string; status: string; priority: number | null; createdAtIso: string }[];
  };
  roles: {
    superAdmin: boolean;
    siteAdmin: boolean;
    tournamentAdmin: boolean;
    recorderAdmin: boolean;
    tournamentAdminMembers: TournamentEntry[];
    tournamentRecorders: TournamentEntry[];
    partnerMember: { name: string; role: string } | null;
    orgMember: { name: string; role: string } | null;
    associationAdmin: { name: string; role: string } | null;
  };
  adminLogs: { id: string; action: string; resourceType: string; description: string | null; severity: string | null; createdAtIso: string }[];
}

interface TournamentEntry {
  tournamentId: string;
  tournamentName: string | null;
  role?: string | null;
  status: string | null;
  startDateIso: string | null;
  endDateIso: string | null;
}

// ── 공통 헬퍼 ──
function relativeTime(iso: string, now: Date = new Date()): string {
  const date = new Date(iso);
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return "방금 전";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}분 전`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}시간 전`;
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay === 1) return "어제";
  if (diffDay < 7) return `${diffDay}일 전`;
  return `${date.getMonth() + 1}월 ${date.getDate()}일`;
}

function formatJoinDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`;
}

function formatDateRange(startIso: string | null, endIso: string | null): string {
  if (!startIso && !endIso) return "";
  const fmt = (d: Date) => `${d.getMonth() + 1}/${d.getDate()}`;
  const s = startIso ? new Date(startIso) : null;
  const e = endIso ? new Date(endIso) : null;
  if (s && e) {
    if (s.getTime() === e.getTime()) return fmt(s);
    return `${fmt(s)} ~ ${fmt(e)}`;
  }
  return s ? fmt(s) : fmt(e as Date);
}

// 섹션 카드 래퍼 — ts-card + 헤더
function Section({ title, desc, right, children }: { title: string; desc?: string; right?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="ts-card">
      <header style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 14 }}>
        <div>
          <h2 style={{ fontSize: 16, fontWeight: 800, color: "var(--ink)" }}>{title}</h2>
          {desc && <p style={{ marginTop: 4, fontSize: 12, color: "var(--ink-mute)" }}>{desc}</p>}
        </div>
        {right}
      </header>
      {children}
    </section>
  );
}

// 빈 상태 박스
function EmptyBox({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        padding: 16,
        textAlign: "center",
        fontSize: 13,
        borderRadius: "var(--radius-input)",
        border: "1px solid var(--border)",
        background: "var(--grey-100)",
        color: "var(--ink-mute)",
      }}
    >
      {children}
    </div>
  );
}

// 권한 보유 여부 행 박스(공통 스타일)
function statusRowStyle(granted: boolean, soft = false): React.CSSProperties {
  return {
    padding: 12,
    borderRadius: "var(--radius-input)",
    border: `1px solid ${granted && !soft ? "var(--primary)" : "var(--border)"}`,
    background: granted ? "color-mix(in oklab, var(--primary) 8%, transparent)" : "var(--card)",
  };
}

// ── 라벨 매트릭스 ──
const NOTIF_TYPE_LABEL: Record<string, string> = {
  tournament_application: "대회 신청",
  tournament_approved: "대회 승인",
  tournament_rejected: "대회 거절",
  match_result: "경기 결과",
  match_schedule: "경기 일정",
  team_invite: "팀 초대",
  payment: "결제",
  system: "시스템",
  announcement: "공지",
  "system.admin_broadcast": "공지",
};
const SUG_STATUS_LABEL: Record<string, string> = { pending: "대기", open: "접수됨", in_progress: "처리중", resolved: "해결", rejected: "반려" };
const SUG_STATUS_TONE: Record<string, BadgeTone> = { pending: "primary", in_progress: "warn", resolved: "ok", rejected: "grey" };
const SUG_CATEGORY_LABEL: Record<string, string> = { general: "일반", bug: "버그", feature: "기능", improvement: "개선", question: "질문" };
const ACTION_LABEL_MAP: Record<string, string> = { create: "생성", update: "수정", delete: "삭제", publish: "공개", approve: "승인", reject: "거부", ban: "차단", unban: "차단 해제" };

function severityIcon(s: string | null): string {
  if (s === "error") return "circle-x";
  if (s === "warning") return "triangle-alert";
  return "info";
}
function severityColor(s: string | null): string {
  if (s === "error") return "var(--danger)";
  if (s === "warning") return "var(--warn)";
  return "var(--ink-mute)";
}

const STATUS_GROUPS = ["in_progress", "upcoming", "completed", "cancelled"] as const;
type StatusGroup = (typeof STATUS_GROUPS)[number];
const STATUS_GROUP_LABEL: Record<StatusGroup, string> = { in_progress: "진행 중", upcoming: "예정", completed: "완료", cancelled: "취소" };
function classifyStatus(status: string | null): StatusGroup {
  if (status === "in_progress") return "in_progress";
  if (status === "completed") return "completed";
  if (status === "cancelled") return "cancelled";
  return "upcoming";
}

// 관리 토너먼트 머지 행
interface ManagedRow {
  tournamentId: string;
  tournamentName: string;
  status: string | null;
  startDateIso: string | null;
  endDateIso: string | null;
  roles: Array<"admin" | "recorder">;
}
function mergeManaged(admins: TournamentEntry[], recorders: TournamentEntry[]): ManagedRow[] {
  const map = new Map<string, ManagedRow>();
  for (const t of admins) {
    map.set(t.tournamentId, {
      tournamentId: t.tournamentId,
      tournamentName: t.tournamentName ?? "(이름 없음)",
      status: t.status,
      startDateIso: t.startDateIso,
      endDateIso: t.endDateIso,
      roles: ["admin"],
    });
  }
  for (const t of recorders) {
    const ex = map.get(t.tournamentId);
    if (ex) ex.roles.push("recorder");
    else
      map.set(t.tournamentId, {
        tournamentId: t.tournamentId,
        tournamentName: t.tournamentName ?? "(이름 없음)",
        status: t.status,
        startDateIso: t.startDateIso,
        endDateIso: t.endDateIso,
        roles: ["recorder"],
      });
  }
  return Array.from(map.values());
}
function rolesLabel(roles: Array<"admin" | "recorder">): string {
  const a = roles.includes("admin");
  const r = roles.includes("recorder");
  if (a && r) return "운영자·기록원";
  if (a) return "운영자";
  return "기록원";
}

// ── 메인 ──
export function MyPageConsole({ data }: { data: MyPageData }) {
  const { user, identityMethod, notifications, suggestions, roles, adminLogs } = data;

  const displayName = user.nickname?.trim() || user.email.split("@")[0];
  const initial = (user.nickname?.trim()?.[0] || user.email[0] || "?").toUpperCase();

  return (
    <div>
      <PageHead eyebrow="백오피스 · 계정" title="내 정보" sub="내 운영자 계정 정보 · 알림 · 권한 · 관리 토너먼트 · 활동 로그를 확인합니다." />

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {/* 1) 로그인 정보 */}
        <section className="ts-card">
          <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
            {user.profileImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.profileImageUrl} alt={`${displayName} 프로필`} style={{ width: 64, height: 64, objectFit: "cover", borderRadius: "50%" }} />
            ) : (
              <div
                style={{
                  display: "flex",
                  width: 64,
                  height: 64,
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "50%",
                  background: "var(--primary)",
                  color: "var(--card)",
                  fontSize: 24,
                  fontWeight: 800,
                }}
              >
                {initial}
              </div>
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {displayName}
                </div>
                <Link
                  href="/profile/settings?section=account"
                  className="ts-btn ts-btn--ghost ts-btn--sm"
                  title="비밀번호 변경"
                  style={{ flexShrink: 0 }}
                >
                  <Icon name="key" size={15} />
                  비밀번호 변경
                </Link>
              </div>
              <div style={{ marginTop: 4, display: "flex", alignItems: "center", gap: 6, fontSize: 14, color: "var(--ink-soft)" }}>
                <Icon name="mail" size={16} />
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.email}</span>
              </div>
              <div style={{ marginTop: 4, display: "flex", alignItems: "center", gap: 6, fontSize: 14, color: "var(--ink-soft)" }}>
                <Icon name="calendar" size={16} />
                <span>가입일: {formatJoinDate(user.createdAtIso)}</span>
              </div>
              <div style={{ marginTop: 8, fontSize: 12, fontFamily: "var(--ff-mono)", color: "var(--ink-mute)" }}>UID: {user.id}</div>
            </div>
          </div>
        </section>

        {/* 2) 본인인증 상태 */}
        <Section title="본인인증 상태" desc="서비스 운영을 위해 본인인증이 필요합니다.">
          <IdentityRow method={identityMethod} />
        </Section>

        {/* 3) 알림 */}
        <Section
          title={notifications.unreadCount > 0 ? `알림 (${notifications.unreadCount}건 미확인)` : "알림"}
          desc="최근 5건의 알림입니다."
        >
          {notifications.items.length === 0 ? (
            <EmptyBox>새 알림이 없습니다.</EmptyBox>
          ) : (
            <ul style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {notifications.items.map((n) => {
                const unread = n.status === "unread";
                return (
                  <li key={n.id} style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "10px 12px", borderRadius: "var(--radius-input)", border: "1px solid var(--border)" }}>
                    <Icon name={unread ? "bell-ring" : "bell"} size={16} color={unread ? "var(--primary)" : "var(--ink-mute)"} style={{ marginTop: 2 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
                        <span style={{ fontSize: 11, flexShrink: 0, color: "var(--ink-mute)" }}>[{NOTIF_TYPE_LABEL[n.type] ?? n.type}]</span>
                        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: 13, color: "var(--ink)", fontWeight: unread ? 700 : 400 }}>{n.title}</span>
                      </div>
                      <div style={{ marginTop: 2, fontSize: 11, color: "var(--ink-mute)" }}>{relativeTime(n.createdAtIso)}</div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
          <div style={{ marginTop: 12, display: "flex", justifyContent: "flex-end" }}>
            <Link href="/v2/notifications" style={{ fontSize: 12, fontWeight: 600, color: "var(--primary)", textDecoration: "none" }}>
              전체 보기 →
            </Link>
          </div>
        </Section>

        {/* 4) 건의사항 */}
        <Section
          title={suggestions.pendingCount > 0 ? `건의사항 (${suggestions.pendingCount}건 처리 대기)` : "건의사항"}
          desc="나에게 배정된 최근 5건의 건의사항입니다."
        >
          {suggestions.items.length === 0 ? (
            <EmptyBox>처리 대기 건의사항이 없습니다.</EmptyBox>
          ) : (
            <ul style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {suggestions.items.map((s) => {
                const pending = s.status === "pending";
                return (
                  <li key={s.id} style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "10px 12px", borderRadius: "var(--radius-input)", border: "1px solid var(--border)" }}>
                    <Icon name={pending ? "message-square-text" : "circle-check-big"} size={16} color={pending ? "var(--primary)" : "var(--ink-mute)"} style={{ marginTop: 2 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
                        <span style={{ fontSize: 11, flexShrink: 0, color: "var(--ink-mute)" }}>[{SUG_CATEGORY_LABEL[s.category] ?? s.category}]</span>
                        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: 13, color: "var(--ink)", fontWeight: pending ? 700 : 400 }}>{s.title}</span>
                      </div>
                      <div style={{ marginTop: 4, display: "flex", alignItems: "center", gap: 8 }}>
                        <Badge tone={SUG_STATUS_TONE[s.status] ?? "grey"}>{SUG_STATUS_LABEL[s.status] ?? s.status}</Badge>
                        <span style={{ fontSize: 11, color: "var(--ink-mute)" }}>{relativeTime(s.createdAtIso)}</span>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
          <div style={{ marginTop: 12, display: "flex", justifyContent: "flex-end" }}>
            <Link href="/admin/suggestions" style={{ fontSize: 12, fontWeight: 600, color: "var(--primary)", textDecoration: "none" }}>
              전체 보기 →
            </Link>
          </div>
        </Section>

        {/* 5) 권한 매트릭스 */}
        <Section title="내 권한" desc="현재 보유한 관리자 권한입니다. 권한 변경은 super_admin 에게 문의하세요.">
          {roles.superAdmin && (
            <div style={{ ...statusRowStyle(true), marginBottom: 12, display: "flex", alignItems: "flex-start", gap: 8 }}>
              <Icon name="shield-user" size={22} color="var(--primary)" />
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "var(--primary)" }}>Super Admin 권한 보유</div>
                <div style={{ marginTop: 2, fontSize: 12, color: "var(--ink-mute)" }}>
                  모든 영역에 자동 접근 가능합니다 — site/tournament 운영, 파트너, 단체, 기록원, 토너먼트 위임 권한 등 별도 부여 없이도 통과.
                </div>
              </div>
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <BooleanRow label="Super Admin" desc="전체 시스템 관리 권한" granted={roles.superAdmin} />
            <BooleanRow label="Site Admin" desc="유저/팀/코트/대회/커뮤니티 운영 권한" granted={roles.siteAdmin} superAuto={roles.superAdmin} />
            <BooleanRow label="Tournament Admin" desc="membership type 3 — 대회 운영자 권한" granted={roles.tournamentAdmin} superAuto={roles.superAdmin} />
            <BooleanRow label="기록원 관리자 (Recorder Admin)" desc="모든 대회 점수기록 + 기록원 배정" granted={!roles.superAdmin && roles.recorderAdmin} superAuto={roles.superAdmin} />
          </div>

          <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
            <ListRow title="대회 운영자 (Tournament Admin Member)" desc="개별 대회에서 위임받은 운영자 권한" items={roles.tournamentAdminMembers} emptyText="위임받은 대회 없음" showRole />
            <ListRow title="대회 기록원 (Tournament Recorder)" desc="개별 대회에서 라이브 기록 권한" items={roles.tournamentRecorders} emptyText="기록 권한 대회 없음" />
          </div>

          <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
            <MembershipRow title="파트너 멤버" desc="협력업체 광고 / 캠페인 관리 권한" membership={roles.partnerMember} emptyText="파트너 소속 없음" />
            <MembershipRow title="단체 멤버" desc="단체(시리즈) 운영 권한" membership={roles.orgMember} emptyText="단체 소속 없음" />
            <MembershipRow title="협회 관리자 (Association Admin)" desc="심판·경기 운영 권한 (referee/admin 영역)" membership={roles.associationAdmin} superAuto={roles.superAdmin} emptyText="협회 권한 없음" />
          </div>
        </Section>

        {/* 6) 관리 토너먼트 */}
        <ManagedTournaments admins={roles.tournamentAdminMembers} recorders={roles.tournamentRecorders} />

        {/* 7) 최근 admin 활동 */}
        <Section title="최근 admin 활동" desc="최근 10건의 관리자 활동 기록입니다.">
          {adminLogs.length === 0 ? (
            <EmptyBox>최근 활동 기록이 없습니다.</EmptyBox>
          ) : (
            <ul style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {adminLogs.map((log) => {
                const text = log.description?.trim() || `${log.resourceType} ${ACTION_LABEL_MAP[log.action] ?? log.action}`;
                return (
                  <li key={log.id} style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "10px 12px", borderRadius: "var(--radius-input)", border: "1px solid var(--border)" }}>
                    <Icon name={severityIcon(log.severity)} size={16} color={severityColor(log.severity)} style={{ marginTop: 2 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: 13, color: "var(--ink)" }}>{text}</div>
                      <div style={{ marginTop: 2, fontSize: 11, color: "var(--ink-mute)" }}>{relativeTime(log.createdAtIso)}</div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Section>
      </div>
    </div>
  );
}

// ── 본인인증 행 ──
function IdentityRow({ method }: { method: string | null }) {
  let label: string, desc: string, icon: string, color: string, hint: string | undefined, cta: { label: string; href: string } | undefined;
  if (method === "portone") {
    label = "본인인증 완료 (PASS)";
    desc = "PortOne 본인인증으로 검증되었습니다.";
    icon = "badge-check";
    color = "var(--primary)";
  } else if (method === "mock") {
    label = "본인인증 완료 (간편 입력)";
    desc = "임시 자체 입력으로 등록되었습니다.";
    icon = "info";
    color = "var(--ink-mute)";
    hint = "PortOne PASS 본인인증 권장 (출시 후 일괄 재인증 예정)";
  } else {
    label = "본인인증 미완료";
    desc = "본인인증이 필요합니다.";
    icon = "triangle-alert";
    color = "var(--warn)";
    cta = { label: "인증하기", href: "/onboarding/identity" };
  }
  const granted = method === "portone";
  return (
    <div style={statusRowStyle(granted, method === "mock")}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
          <Icon name={icon} size={22} color={color} />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)" }}>{label}</div>
            <div style={{ fontSize: 12, color: "var(--ink-mute)" }}>{desc}</div>
          </div>
        </div>
        {cta && (
          <Link href={cta.href} className="ts-btn ts-btn--primary ts-btn--sm" style={{ flexShrink: 0 }}>
            {cta.label}
          </Link>
        )}
      </div>
      {hint && (
        <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "var(--ink-mute)" }}>
          <Icon name="lightbulb" size={14} />
          <span>{hint}</span>
        </div>
      )}
    </div>
  );
}

// ── boolean 권한 행 ──
function BooleanRow({ label, desc, granted, superAuto = false }: { label: string; desc: string; granted: boolean; superAuto?: boolean }) {
  const effective = granted || superAuto;
  const isSuperAuto = !granted && superAuto;
  return (
    <div style={{ ...statusRowStyle(effective, isSuperAuto), display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
        <Icon name={effective ? "circle-check" : "circle-minus"} size={22} color={effective && !isSuperAuto ? "var(--primary)" : "var(--ink-mute)"} />
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{label}</div>
          <div style={{ fontSize: 12, color: "var(--ink-mute)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{desc}</div>
        </div>
      </div>
      <span style={{ fontSize: 12, fontWeight: 700, whiteSpace: "nowrap", color: effective && !isSuperAuto ? "var(--primary)" : "var(--ink-mute)" }}>
        {isSuperAuto ? "보유 (Super 자동)" : effective ? "보유" : "없음"}
      </span>
    </div>
  );
}

// ── 토너먼트별 권한 리스트 행 ──
function ListRow({ title, desc, items, emptyText, showRole }: { title: string; desc: string; items: TournamentEntry[]; emptyText: string; showRole?: boolean }) {
  const TAKE = 50;
  const truncated = items.length > TAKE;
  const visible = truncated ? items.slice(0, TAKE) : items;
  const has = visible.length > 0;
  return (
    <div style={statusRowStyle(has)}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <Icon name={has ? "badge-check" : "circle-minus"} size={22} color={has ? "var(--primary)" : "var(--ink-mute)"} />
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)" }}>
            {title}
            {has && <span style={{ marginLeft: 8, fontSize: 12, color: "var(--primary)" }}>({visible.length}{truncated ? "+" : ""}개)</span>}
          </div>
          <div style={{ fontSize: 12, color: "var(--ink-mute)" }}>{desc}</div>
        </div>
      </div>
      {has ? (
        <ul style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 6 }}>
          {visible.map((it) => (
            <li
              key={it.tournamentId}
              style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, padding: "6px 10px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--card)", fontSize: 12 }}
            >
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "var(--ink)" }}>{it.tournamentName ?? "(이름 없음)"}</span>
              {showRole && <Badge tone="primary">{it.role ?? "admin"}</Badge>}
            </li>
          ))}
        </ul>
      ) : (
        <div style={{ marginTop: 8, fontSize: 12, color: "var(--ink-mute)" }}>{emptyText}</div>
      )}
    </div>
  );
}

// ── 단일 소속 행 ──
function MembershipRow({ title, desc, membership, emptyText, superAuto = false }: { title: string; desc: string; membership: { name: string; role: string } | null; emptyText: string; superAuto?: boolean }) {
  const has = membership !== null;
  const effective = has || superAuto;
  const isSuperAuto = !has && superAuto;
  return (
    <div style={statusRowStyle(effective, isSuperAuto)}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <Icon name={effective ? "badge-check" : "circle-minus"} size={22} color={effective && !isSuperAuto ? "var(--primary)" : "var(--ink-mute)"} />
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)" }}>{title}</div>
          <div style={{ fontSize: 12, color: "var(--ink-mute)" }}>{desc}</div>
        </div>
        <span style={{ marginLeft: "auto", fontSize: 12, fontWeight: 700, whiteSpace: "nowrap", color: effective && !isSuperAuto ? "var(--primary)" : "var(--ink-mute)" }}>
          {isSuperAuto ? "보유 (Super 자동)" : effective ? "보유" : "없음"}
        </span>
      </div>
      {has && membership && (
        <div style={{ marginTop: 8, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, padding: "6px 10px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--card)", fontSize: 12 }}>
          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "var(--ink)" }}>{membership.name}</span>
          <Badge tone="primary">{membership.role}</Badge>
        </div>
      )}
      {!has && !isSuperAuto && <div style={{ marginTop: 8, fontSize: 12, color: "var(--ink-mute)" }}>{emptyText}</div>}
    </div>
  );
}

// ── 관리 토너먼트(그룹 + 펼치기) ──
function ManagedTournaments({ admins, recorders }: { admins: TournamentEntry[]; recorders: TournamentEntry[] }) {
  const allRows = mergeManaged(admins, recorders);
  const grouped = new Map<StatusGroup, ManagedRow[]>();
  for (const g of STATUS_GROUPS) grouped.set(g, []);
  for (const row of allRows) grouped.get(classifyStatus(row.status))!.push(row);

  if (allRows.length === 0) {
    return (
      <Section title="관리 토너먼트">
        <EmptyBox>관리하는 토너먼트가 없습니다.</EmptyBox>
      </Section>
    );
  }

  return (
    <Section title="관리 토너먼트" desc="내가 운영자 또는 기록원으로 참여 중인 대회입니다.">
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {STATUS_GROUPS.map((g) => {
          const rows = grouped.get(g)!;
          if (rows.length === 0) return null;
          return <ManagedGroup key={g} group={g} rows={rows} />;
        })}
      </div>
    </Section>
  );
}

function ManagedGroup({ group, rows }: { group: StatusGroup; rows: ManagedRow[] }) {
  const [expanded, setExpanded] = React.useState(group === "in_progress");
  const VISIBLE = 5;
  const showAll = expanded || rows.length <= VISIBLE;
  const visible = showAll ? rows : rows.slice(0, VISIBLE);
  const remaining = rows.length - VISIBLE;

  return (
    <div>
      <div style={{ marginBottom: 8, display: "flex", alignItems: "center", gap: 8, fontSize: 14, fontWeight: 700, color: "var(--ink)" }}>
        <span>{STATUS_GROUP_LABEL[group]}</span>
        <span style={{ fontSize: 12, color: "var(--ink-mute)" }}>({rows.length}건)</span>
      </div>
      <ul style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {visible.map((row) => {
          const range = formatDateRange(row.startDateIso, row.endDateIso);
          const g = classifyStatus(row.status);
          return (
            <li key={row.tournamentId} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, padding: "8px 12px", borderRadius: "var(--radius-input)", border: "1px solid var(--border)", background: "var(--card)" }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Link href={`/v2/operate/${row.tournamentId}`} style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)", textDecoration: "none", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {row.tournamentName}
                  </Link>
                  <Badge tone={g === "in_progress" ? "primary" : g === "completed" || g === "cancelled" ? "grey" : "warn"}>{STATUS_GROUP_LABEL[g]}</Badge>
                </div>
                <div style={{ marginTop: 2, display: "flex", alignItems: "center", gap: 8, fontSize: 11, color: "var(--ink-mute)" }}>
                  {range && (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 2 }}>
                      <Icon name="calendar" size={12} />
                      {range}
                    </span>
                  )}
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 2 }}>
                    <Icon name="shield-user" size={12} />
                    {rolesLabel(row.roles)}
                  </span>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
      {rows.length > VISIBLE && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="ts-btn ts-btn--ghost ts-btn--sm"
          style={{ marginTop: 8 }}
        >
          <Icon name={expanded ? "chevron-up" : "chevron-down"} size={16} />
          {expanded ? "접기" : `+${remaining}건 더보기`}
        </button>
      )}
    </div>
  );
}

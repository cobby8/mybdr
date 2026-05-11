/**
 * RoleMatrixCard — admin 마이페이지 권한 매트릭스.
 *
 * 2026-05-11 — Phase 1 MVP (사용자 결재 §4 — 권한 매트릭스 표시).
 *
 * 7 케이스 표시:
 *   1. super_admin (boolean)
 *   2. site_admin (boolean)
 *   3. tournament_admin (membershipType=3, boolean)
 *   4. tournamentAdminMembers (리스트 — 토너먼트별)
 *   5. tournamentRecorders (리스트 — 토너먼트별)
 *   6. partner_member (단일 — 있으면)
 *   7. org_member (단일 — 있으면)
 *
 * UX:
 *   - 권한 있음 = check_circle + var(--color-primary) 강조
 *   - 권한 없음 = remove + 회색 ("권한 없음")
 *   - 리스트 = 카드 형식 (대회명 + role 뱃지)
 *   - 5+ 케이스 = 우선 모두 표시 (Phase 2 펼치기 UX 도입 예정)
 *
 * 디자인 토큰: var(--*) / Material Symbols Outlined.
 * server component.
 */

import type { AdminRoleSummary } from "@/lib/auth/admin-roles";

export interface RoleMatrixCardProps {
  roles: AdminRoleSummary;
}

// 단일 boolean 권한 행 (super/site/tournament_admin)
function BooleanRow({
  label,
  description,
  granted,
}: {
  label: string;
  description: string;
  granted: boolean;
}) {
  return (
    <div
      className="flex items-center justify-between gap-3 rounded-md border p-3"
      style={{
        borderColor: granted
          ? "var(--color-primary)"
          : "var(--color-border)",
        backgroundColor: granted
          ? "var(--color-elevated)"
          : "var(--color-surface)",
      }}
    >
      <div className="flex items-center gap-2 min-w-0">
        <span
          className="material-symbols-outlined"
          style={{
            fontSize: 22,
            color: granted
              ? "var(--color-primary)"
              : "var(--color-text-secondary)",
          }}
        >
          {granted ? "check_circle" : "remove_circle_outline"}
        </span>
        <div className="min-w-0">
          <div
            className="text-sm font-medium truncate"
            style={{ color: "var(--color-text-primary)" }}
          >
            {label}
          </div>
          <div
            className="text-xs truncate"
            style={{ color: "var(--color-text-secondary)" }}
          >
            {description}
          </div>
        </div>
      </div>
      <span
        className="text-xs font-semibold whitespace-nowrap"
        style={{
          color: granted
            ? "var(--color-primary)"
            : "var(--color-text-secondary)",
        }}
      >
        {granted ? "보유" : "없음"}
      </span>
    </div>
  );
}

// 토너먼트별 권한 리스트 섹션
// 2026-05-11 Phase 2 Minor 3 fix — take 51 상한 도달 시 안내 메시지 표시
// items.length === 51 이면 표시는 50개로 잘라내고 "+1건 이상 더 있음" 안내.
function TournamentList({
  title,
  description,
  items,
  emptyText,
  roleAccessor,
}: {
  title: string;
  description: string;
  items: Array<{
    tournamentId: string;
    tournamentName: string | null;
    role?: string;
  }>;
  emptyText: string;
  roleAccessor?: (item: { role?: string }) => string;
}) {
  // 상한 도달 검출 — admin-roles take: 51 (50 + 1) 패턴
  const TAKE_LIMIT = 50;
  const isTruncated = items.length > TAKE_LIMIT;
  const visibleItems = isTruncated ? items.slice(0, TAKE_LIMIT) : items;
  const hasItems = visibleItems.length > 0;
  return (
    <div
      className="rounded-md border p-3"
      style={{
        borderColor: hasItems
          ? "var(--color-primary)"
          : "var(--color-border)",
        backgroundColor: hasItems
          ? "var(--color-elevated)"
          : "var(--color-surface)",
      }}
    >
      <div className="flex items-center gap-2">
        <span
          className="material-symbols-outlined"
          style={{
            fontSize: 22,
            color: hasItems
              ? "var(--color-primary)"
              : "var(--color-text-secondary)",
          }}
        >
          {hasItems ? "verified" : "remove_circle_outline"}
        </span>
        <div className="min-w-0">
          <div
            className="text-sm font-medium"
            style={{ color: "var(--color-text-primary)" }}
          >
            {title}
            {hasItems && (
              <span
                className="ml-2 text-xs"
                style={{ color: "var(--color-primary)" }}
              >
                ({visibleItems.length}
                {isTruncated ? "+" : ""}개)
              </span>
            )}
          </div>
          <div
            className="text-xs"
            style={{ color: "var(--color-text-secondary)" }}
          >
            {description}
          </div>
        </div>
      </div>

      {/* 리스트 (있을 때만) */}
      {hasItems ? (
        <>
          <ul className="mt-3 space-y-1.5">
            {visibleItems.map((item) => (
              <li
                key={item.tournamentId}
                className="flex items-center justify-between gap-2 rounded border px-2.5 py-1.5 text-xs"
                style={{
                  borderColor: "var(--color-border)",
                  backgroundColor: "var(--color-surface)",
                }}
              >
                <span
                  className="truncate"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  {item.tournamentName ?? "(이름 없음)"}
                </span>
                {roleAccessor && (
                  <span
                    className="rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide whitespace-nowrap"
                    style={{
                      backgroundColor: "var(--color-primary)",
                      color: "white",
                    }}
                  >
                    {roleAccessor(item)}
                  </span>
                )}
              </li>
            ))}
          </ul>

          {/* 상한 도달 안내 — Phase 2 Minor 3 fix */}
          {isTruncated && (
            <div
              className="mt-2 flex items-center gap-1 text-xs"
              style={{ color: "var(--color-text-secondary)" }}
            >
              <span
                className="material-symbols-outlined"
                style={{ fontSize: 14 }}
              >
                info
              </span>
              <span>
                표시 상한 {TAKE_LIMIT}건 — 더 많은 권한이 있을 수 있습니다.
                운영자에게 문의하세요.
              </span>
            </div>
          )}
        </>
      ) : (
        <div
          className="mt-2 text-xs"
          style={{ color: "var(--color-text-secondary)" }}
        >
          {emptyText}
        </div>
      )}
    </div>
  );
}

// 단일 소속 (partner / org) 행
function MembershipRow({
  title,
  description,
  membership,
  emptyText,
}: {
  title: string;
  description: string;
  membership: { name: string; role: string } | null;
  emptyText: string;
}) {
  const granted = membership !== null;
  return (
    <div
      className="rounded-md border p-3"
      style={{
        borderColor: granted ? "var(--color-primary)" : "var(--color-border)",
        backgroundColor: granted
          ? "var(--color-elevated)"
          : "var(--color-surface)",
      }}
    >
      <div className="flex items-center gap-2">
        <span
          className="material-symbols-outlined"
          style={{
            fontSize: 22,
            color: granted
              ? "var(--color-primary)"
              : "var(--color-text-secondary)",
          }}
        >
          {granted ? "verified" : "remove_circle_outline"}
        </span>
        <div className="min-w-0">
          <div
            className="text-sm font-medium"
            style={{ color: "var(--color-text-primary)" }}
          >
            {title}
          </div>
          <div
            className="text-xs"
            style={{ color: "var(--color-text-secondary)" }}
          >
            {description}
          </div>
        </div>
      </div>
      {membership ? (
        <div
          className="mt-2 flex items-center justify-between gap-2 rounded border px-2.5 py-1.5 text-xs"
          style={{
            borderColor: "var(--color-border)",
            backgroundColor: "var(--color-surface)",
          }}
        >
          <span
            className="truncate"
            style={{ color: "var(--color-text-primary)" }}
          >
            {membership.name}
          </span>
          <span
            className="rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide whitespace-nowrap"
            style={{
              backgroundColor: "var(--color-primary)",
              color: "white",
            }}
          >
            {membership.role}
          </span>
        </div>
      ) : (
        <div
          className="mt-2 text-xs"
          style={{ color: "var(--color-text-secondary)" }}
        >
          {emptyText}
        </div>
      )}
    </div>
  );
}

export function RoleMatrixCard({ roles }: RoleMatrixCardProps) {
  return (
    <section
      className="rounded-lg border p-6"
      style={{
        borderColor: "var(--color-border)",
        backgroundColor: "var(--color-surface)",
      }}
    >
      {/* 섹션 헤더 */}
      <header className="mb-4">
        <h2
          className="text-lg font-bold"
          style={{ color: "var(--color-text-primary)" }}
        >
          내 권한
        </h2>
        <p
          className="mt-1 text-xs"
          style={{ color: "var(--color-text-secondary)" }}
        >
          현재 보유한 관리자 권한입니다. 권한 변경은 super_admin 에게 문의하세요.
        </p>
      </header>

      {/* 1) 전역 권한 3종 (boolean) */}
      <div className="space-y-2">
        <BooleanRow
          label="Super Admin"
          description="전체 시스템 관리 권한"
          granted={roles.superAdmin}
        />
        <BooleanRow
          label="Site Admin"
          description="유저/팀/코트/대회/커뮤니티 운영 권한"
          granted={roles.siteAdmin}
        />
        <BooleanRow
          label="Tournament Admin"
          description="membership type 3 — 대회 운영자 권한"
          granted={roles.tournamentAdmin}
        />
      </div>

      {/* 2) 토너먼트별 운영/기록 권한 */}
      <div className="mt-4 space-y-2">
        <TournamentList
          title="대회 운영자 (Tournament Admin Member)"
          description="개별 대회에서 위임받은 운영자 권한"
          items={roles.tournamentAdminMembers}
          emptyText="위임받은 대회 없음"
          roleAccessor={(it) => it.role ?? "admin"}
        />
        <TournamentList
          title="대회 기록원 (Tournament Recorder)"
          description="개별 대회에서 라이브 기록 권한"
          items={roles.tournamentRecorders}
          emptyText="기록 권한 대회 없음"
        />
      </div>

      {/* 3) 외부 소속 (파트너 / 단체) */}
      <div className="mt-4 space-y-2">
        <MembershipRow
          title="파트너 멤버"
          description="협력업체 광고 / 캠페인 관리 권한"
          membership={
            roles.partnerMember
              ? {
                  name: roles.partnerMember.partnerName,
                  role: roles.partnerMember.role,
                }
              : null
          }
          emptyText="파트너 소속 없음"
        />
        <MembershipRow
          title="단체 멤버"
          description="단체(시리즈) 운영 권한"
          membership={
            roles.orgMember
              ? {
                  name: roles.orgMember.organizationName,
                  role: roles.orgMember.role,
                }
              : null
          }
          emptyText="단체 소속 없음"
        />
      </div>
    </section>
  );
}

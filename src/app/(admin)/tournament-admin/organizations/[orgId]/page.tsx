"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
// 2026-05-12 PR3 — "기존 대회 가져오기" 모달 (다건 흡수)
import AbsorbTournamentsModal from "./_components/AbsorbTournamentsModal";
// 2026-05-12 Phase D-1 — 시리즈 카드 ⋮ 메뉴 (분리 / 이동)
import SeriesActionsMenu from "./_components/SeriesActionsMenu";
// 2026-05-12 Phase E — 단체 보관 / 복구 버튼 (owner only)
import ArchiveOrganizationButton from "./_components/ArchiveOrganizationButton";
// 4C-8 OO2 — 단체 위계 crumbs 재사용 (4C-2 산출물)
import { OrgHierarchyCrumbs } from "@/components/shared/org-hierarchy-crumbs";

/* ============================================================
 * 단체 관리 대시보드 (OO2) — /tournament-admin/organizations/[orgId]
 *
 * 2026-05-29 4C-8 OO2 OrgAdminDetail 디자인 박제:
 *   기존 단일 스크롤 레이아웃 → 6 sub-tab 구조로 재구성.
 *   ⚠️ Q2 6탭 순서 lock (절대 보존):
 *     basic → members → series → editions → officers → activity
 *
 *   데이터 패칭/모달 로직(loadOrg / submitEdit / handleCreateSeries /
 *   Absorb·Archive·SeriesActions 모달)은 기존 그대로 유지 — UI만 탭으로 재배치.
 *   editions 탭은 GET route 확장으로 시리즈별 회차(tournaments) 통합 표시.
 *
 *   탭별 판정:
 *     basic    — 박제 (실값: 정보 view/edit + 위험영역 보관)
 *     members  — 박제 (실값: 멤버 list + 멤버 관리 페이지 링크)
 *     series   — 박제 (실값: 시리즈 list + 새 시리즈 생성 + Absorb/Actions)
 *     editions — 박제 (실값: 시리즈별 회차 통합. 데이터 0 시 빈 상태)
 *     officers — 부분 박제 (admin role 멤버 list + 권한 안내. DB 미지원 toggle 동작 X)
 *     activity — 빈 상태 (ORG_ACTIVITY_LOG 테이블 없음 + admin_logs 0건 → mock 금지)
 * ============================================================ */

// 회차(tournament) 요약 — editions 탭용
interface OrgEdition {
  id: string;
  name: string;
  editionNumber: number | null;
  status: string | null;
  startDate: string | null;
  city: string | null;
  district: string | null;
  venueAddress: string | null;
  maxTeams: number | null;
}

interface OrgSeries {
  id: string;
  name: string;
  slug: string;
  tournamentsCount: number;
  createdAt: string;
  tournaments: OrgEdition[];
}

interface OrgMember {
  id: string;
  nickname: string;
  role: string;
}

interface OrgDetail {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  bannerUrl: string | null;
  description: string | null;
  region: string | null;
  contactEmail: string | null;
  websiteUrl: string | null;
  status: string;
  isPublic: boolean;
  seriesCount: number;
  myRole: string | null;
  ownerNickname: string | null;
  // 2026-05-12 hotfix — super_admin 인지 (UI 가드 분기용 — 멤버십 없어도 owner 권한 인정)
  isSuperAdmin?: boolean;
  members: OrgMember[];
  series: OrgSeries[];
}

// 6 sub-tab 정의 — Q2 순서 lock (basic → members → series → editions → officers → activity)
type OO2Tab =
  | "basic"
  | "members"
  | "series"
  | "editions"
  | "officers"
  | "activity";

const OO2_TABS: { v: OO2Tab; l: string; ico: string }[] = [
  { v: "basic", l: "기본 정보", ico: "info" },
  { v: "members", l: "멤버", ico: "group" },
  { v: "series", l: "시리즈", ico: "collections_bookmark" },
  { v: "editions", l: "회차", ico: "event" },
  { v: "officers", l: "권한 위임", ico: "shield_person" },
  { v: "activity", l: "활동 이력", ico: "history" },
];

// 역할 한국어 라벨
const roleLabel = (role: string) =>
  role === "owner" ? "소유자" : role === "admin" ? "관리자" : "멤버";

// 회차 상태 한국어 라벨 (DB status: draft/recruiting/ongoing/completed 등 다양 → 매핑)
const editionStatusLabel = (status: string | null) => {
  switch (status) {
    case "completed":
      return "종료";
    case "ongoing":
    case "in_progress":
      return "진행중";
    case "recruiting":
    case "open":
      return "모집중";
    case "draft":
      return "준비중";
    default:
      return status || "준비중";
  }
};

export default function OrganizationDashboardPage() {
  const params = useParams();
  const orgId = params.orgId as string;
  const searchParams = useSearchParams();

  // URL ?tab= 으로 초기 탭 진입 (시안의 initialTab 답습). 유효하지 않으면 basic.
  const tabFromUrl = searchParams.get("tab") as OO2Tab | null;
  const initialTab: OO2Tab =
    tabFromUrl && OO2_TABS.some((t) => t.v === tabFromUrl)
      ? tabFromUrl
      : "basic";

  const [tab, setTab] = useState<OO2Tab>(initialTab);
  const [org, setOrg] = useState<OrgDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // 단체 정보 로드 — useCallback 으로 박제 (모달 onSuccess 시 재호출 위해).
  const loadOrg = useCallback(() => {
    setLoading(true);
    fetch(`/api/web/organizations/${orgId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
          return;
        }
        // snake_case → camelCase 매핑 (apiSuccess 자동 snake_case 변환 대응)
        setOrg({
          id: data.id,
          name: data.name,
          slug: data.slug,
          logoUrl: data.logo_url,
          bannerUrl: data.banner_url,
          description: data.description,
          region: data.region,
          contactEmail: data.contact_email,
          websiteUrl: data.website_url,
          status: data.status,
          isPublic: data.is_public,
          seriesCount: data.series_count,
          myRole: data.my_role,
          ownerNickname: data.owner?.nickname ?? null,
          isSuperAdmin: data.is_super_admin,
          members: (data.members || []).map((m: Record<string, unknown>) => ({
            id: m.id as string,
            nickname: m.nickname as string,
            role: m.role as string,
          })),
          series: (data.series || []).map((s: Record<string, unknown>) => ({
            id: s.id as string,
            name: s.name as string,
            slug: s.slug as string,
            tournamentsCount: (s.tournaments_count as number) ?? 0,
            createdAt: s.created_at as string,
            // editions 탭용 — 시리즈별 회차 목록 (실값만)
            tournaments: ((s.tournaments as Record<string, unknown>[]) || []).map(
              (t) => ({
                id: t.id as string,
                name: t.name as string,
                editionNumber: (t.edition_number as number) ?? null,
                status: (t.status as string) ?? null,
                startDate: (t.start_date as string) ?? null,
                city: (t.city as string) ?? null,
                district: (t.district as string) ?? null,
                venueAddress: (t.venue_address as string) ?? null,
                maxTeams: (t.max_teams as number) ?? null,
              })
            ),
          })),
        });
      })
      .catch(() => setError("단체 정보를 불러올 수 없습니다."))
      .finally(() => setLoading(false));
  }, [orgId]);

  useEffect(() => {
    loadOrg();
  }, [loadOrg]);

  // 2026-05-12 PR3 — "기존 대회 가져오기" 모달 trigger state.
  const [absorbModalSeries, setAbsorbModalSeries] = useState<{
    id: string;
    name: string;
  } | null>(null);

  // 새 시리즈 생성 (단체 소속으로)
  const [creatingSeriesName, setCreatingSeriesName] = useState("");
  const [showSeriesForm, setShowSeriesForm] = useState(false);

  // 2026-05-12 — 단체 정보 편집 모달 state
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    region: "",
    contact_email: "",
    contact_phone: "",
    website_url: "",
  });
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const openEditModal = () => {
    if (!org) return;
    setEditForm({
      name: org.name ?? "",
      description: org.description ?? "",
      region: org.region ?? "",
      contact_email: org.contactEmail ?? "",
      contact_phone: "",
      website_url: org.websiteUrl ?? "",
    });
    setEditError(null);
    setEditOpen(true);
  };

  const submitEdit = async () => {
    setEditSaving(true);
    setEditError(null);
    try {
      const res = await fetch(`/api/web/organizations/${orgId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      const json = await res.json();
      if (!res.ok) {
        setEditError(json.error ?? "수정 실패");
        setEditSaving(false);
        return;
      }
      setEditOpen(false);
      setEditSaving(false);
      loadOrg(); // 갱신
    } catch {
      setEditError("네트워크 오류");
      setEditSaving(false);
    }
  };

  const handleCreateSeries = async () => {
    if (!creatingSeriesName.trim()) return;
    try {
      const res = await fetch("/api/web/series", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: creatingSeriesName.trim(),
          organization_id: orgId,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        // 시리즈 목록에 추가
        setOrg((prev) =>
          prev
            ? {
                ...prev,
                series: [
                  {
                    id: data.id,
                    name: data.name || creatingSeriesName,
                    slug: data.slug,
                    tournamentsCount: 0,
                    createdAt: new Date().toISOString(),
                    tournaments: [],
                  },
                  ...prev.series,
                ],
                seriesCount: prev.seriesCount + 1,
              }
            : prev
        );
        setCreatingSeriesName("");
        setShowSeriesForm(false);
      }
    } catch {
      /* 무시 */
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 animate-pulse rounded bg-[var(--color-surface)]" />
        <div className="h-32 animate-pulse rounded-lg bg-[var(--color-surface)]" />
      </div>
    );
  }

  if (error || !org) {
    return (
      <div className="py-20 text-center text-[var(--color-text-muted)]">
        {error || "단체를 찾을 수 없습니다."}
      </div>
    );
  }

  // 2026-05-12 hotfix — super_admin 도 owner/admin 권한 인정 (멤버십 없어도)
  const isAdmin =
    org.myRole === "owner" || org.myRole === "admin" || !!org.isSuperAdmin;
  // owner only 액션 (archive/복구) — admin 도 차단 (단, super_admin 우회)
  const isOwner = org.myRole === "owner" || !!org.isSuperAdmin;
  const isArchived = org.status === "archived";

  // editions 탭 — 모든 시리즈의 회차 통합 (flatMap). 시리즈 이름/색 컨텍스트 동봉.
  const allEditions = org.series.flatMap((s) =>
    s.tournaments.map((t) => ({ ...t, seriesName: s.name, seriesId: s.id }))
  );
  // admin role 멤버 (officers 탭)
  const adminMembers = org.members.filter((m) => m.role === "admin");
  // 누적 회차 수 = 시리즈 tournaments_count 합산 (시안 hero의 "대회 N회")
  const totalEditions = org.series.reduce(
    (sum, s) => sum + s.tournamentsCount,
    0
  );

  return (
    <div className="space-y-5">
      {/* 위계 crumbs — 단체 노드 표시 (4C-2 OrgHierarchyCrumbs 재사용) */}
      <OrgHierarchyCrumbs
        trail={[{ label: org.name, level: "org", active: true }]}
      />

      {/* 미니 hero — 로고 + 단체명 + 상태/내 역할 + 메타 + 공개 페이지 CTA */}
      <div className="flex flex-wrap items-center gap-4">
        {org.logoUrl ? (
          <img
            src={org.logoUrl}
            alt={org.name}
            className="h-14 w-14 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-info)] text-lg font-bold text-white">
            {/* admin 빨강 본문 금지 룰 → info(Navy) 토큰 */}
            {org.name.charAt(0)}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-bold text-[var(--color-text-primary)]">
              {org.name}
            </h1>
            {/* archived 시 회색 보관됨 뱃지 */}
            {isArchived && (
              <span className="rounded-full bg-[var(--color-border)] px-2 py-0.5 text-xs font-medium text-[var(--color-text-muted)]">
                보관됨
              </span>
            )}
            {/* 내 역할 뱃지 */}
            {org.myRole && (
              <span
                className="rounded-full px-2 py-0.5 text-xs font-medium"
                style={{
                  color: "var(--color-info)",
                  backgroundColor:
                    "color-mix(in srgb, var(--color-info) 12%, transparent)",
                }}
              >
                {roleLabel(org.myRole)}
              </span>
            )}
          </div>
          <p className="mt-0.5 text-sm text-[var(--color-text-muted)]">
            {org.region || "지역 미설정"} · 멤버{" "}
            <b className="text-[var(--color-text-primary)]">
              {org.members.length}
            </b>
            명 · 시리즈{" "}
            <b className="text-[var(--color-text-primary)]">{org.seriesCount}</b>
            개 · 회차{" "}
            <b className="text-[var(--color-text-primary)]">{totalEditions}</b>회
          </p>
        </div>
        {/* 공개 페이지 — 외부 link */}
        <a
          href={`/organizations/${org.slug}`}
          target="_blank"
          rel="noopener"
          className="btn btn--sm"
        >
          <span className="material-symbols-outlined mr-0.5 text-sm align-middle">
            open_in_new
          </span>
          공개 페이지
        </a>
      </div>

      {/* 6 sub-tab — Q2 순서 lock */}
      <div className="flex flex-wrap gap-1 border-b border-[var(--color-border)]">
        {OO2_TABS.map((t) => {
          const active = tab === t.v;
          // 일부 탭에 카운트 표시 (멤버/시리즈/회차)
          const count =
            t.v === "members"
              ? org.members.length
              : t.v === "series"
                ? org.seriesCount
                : t.v === "editions"
                  ? totalEditions
                  : null;
          return (
            <button
              key={t.v}
              type="button"
              onClick={() => setTab(t.v)}
              className={`flex items-center gap-1 border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
                active
                  ? "border-[var(--color-info)] text-[var(--color-text-primary)]"
                  : "border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]"
              }`}
            >
              <span className="material-symbols-outlined text-base">
                {t.ico}
              </span>
              {t.l}
              {count !== null && (
                <span className="ml-0.5 rounded bg-[var(--color-elevated)] px-1.5 text-xs text-[var(--color-text-secondary)]">
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ========== TAB 1: BASIC ========== */}
      {tab === "basic" && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-medium text-[var(--color-text-primary)]">
              단체 정보
            </h2>
            {isAdmin && (
              <button
                type="button"
                onClick={openEditModal}
                className="btn btn--sm"
              >
                <span className="material-symbols-outlined mr-0.5 text-sm align-middle">
                  edit
                </span>
                편집
              </button>
            )}
          </div>

          {/* 정보 카드 (dl) */}
          <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
            <dl className="grid gap-3 text-sm md:grid-cols-2">
              <div>
                <dt className="text-[var(--color-text-muted)]">단체명</dt>
                <dd className="font-medium text-[var(--color-text-primary)]">
                  {org.name}
                </dd>
              </div>
              <div>
                <dt className="text-[var(--color-text-muted)]">slug</dt>
                <dd className="text-[var(--color-text-primary)]">{org.slug}</dd>
              </div>
              {org.description && (
                <div className="md:col-span-2">
                  <dt className="text-[var(--color-text-muted)]">소개</dt>
                  <dd className="text-[var(--color-text-primary)]">
                    {org.description}
                  </dd>
                </div>
              )}
              <div>
                <dt className="text-[var(--color-text-muted)]">활동 지역</dt>
                <dd className="text-[var(--color-text-primary)]">
                  {org.region || "미설정"}
                </dd>
              </div>
              <div>
                <dt className="text-[var(--color-text-muted)]">상태</dt>
                <dd className="text-[var(--color-text-primary)]">
                  {org.status} · {org.isPublic ? "공개" : "비공개"}
                </dd>
              </div>
              {org.contactEmail && (
                <div>
                  <dt className="text-[var(--color-text-muted)]">연락 이메일</dt>
                  <dd className="text-[var(--color-text-primary)]">
                    {org.contactEmail}
                  </dd>
                </div>
              )}
              <div>
                <dt className="text-[var(--color-text-muted)]">웹사이트</dt>
                <dd>
                  {org.websiteUrl ? (
                    <a
                      href={org.websiteUrl}
                      target="_blank"
                      rel="noopener"
                      className="text-[var(--color-info)] hover:underline"
                    >
                      {org.websiteUrl}
                    </a>
                  ) : (
                    <span className="text-[var(--color-text-muted)]">미입력</span>
                  )}
                </dd>
              </div>
              {org.ownerNickname && (
                <div>
                  <dt className="text-[var(--color-text-muted)]">소유자</dt>
                  <dd className="text-[var(--color-text-primary)]">
                    {org.ownerNickname}
                  </dd>
                </div>
              )}
            </dl>
          </div>

          {/* 위험 영역 — owner only (단체 보관 / 복구) */}
          {isOwner && (
            <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
              <h3 className="mb-2 flex items-center gap-1.5 text-sm font-bold text-[var(--color-text-primary)]">
                <span className="material-symbols-outlined text-base text-[var(--color-text-muted)]">
                  warning
                </span>
                위험 영역 — 소유자 전용
              </h3>
              <p className="mb-3 text-xs leading-relaxed text-[var(--color-text-muted)]">
                단체 <b>보관</b> 시 단체 페이지 비공개 + 신규 시리즈 차단 (기존
                회차 보존, 복구 가능).
              </p>
              {/* Phase E — isOwner 가드 → admin 노출 X. 서버에도 requireOrganizationOwner 이중 가드 */}
              <ArchiveOrganizationButton
                organizationId={org.id}
                organizationName={org.name}
                mode={isArchived ? "restore" : "archive"}
                onSuccess={loadOrg}
              />
            </div>
          )}
        </section>
      )}

      {/* ========== TAB 2: MEMBERS ========== */}
      {tab === "members" && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-medium text-[var(--color-text-primary)]">
              멤버 — {org.members.length}명
            </h2>
            {isAdmin && (
              <Link
                href={`/tournament-admin/organizations/${orgId}/members`}
                className="btn btn--sm btn--primary"
              >
                <span className="material-symbols-outlined mr-0.5 text-sm align-middle">
                  manage_accounts
                </span>
                멤버 관리
              </Link>
            )}
          </div>
          <p className="text-xs text-[var(--color-text-muted)]">
            소유자 / 관리자 / 멤버 · 초대 및 역할 변경은 멤버 관리 페이지에서.
          </p>

          {/* 멤버 list (요약 — 초대/제거는 멤버 관리 페이지로 위임) */}
          <div className="space-y-2">
            {org.members.map((m) => (
              <div
                key={m.id}
                className="flex items-center justify-between rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-border)] text-xs font-medium text-[var(--color-text-muted)]">
                    {(m.nickname || "?").charAt(0).toUpperCase()}
                  </div>
                  <p className="text-sm font-medium text-[var(--color-text-primary)]">
                    {m.nickname || "이름 없음"}
                  </p>
                </div>
                <span
                  className="rounded-full px-2 py-0.5 text-xs font-medium"
                  style={{
                    color:
                      m.role === "owner"
                        ? "var(--color-primary)"
                        : m.role === "admin"
                          ? "var(--color-info)"
                          : "var(--color-text-muted)",
                    backgroundColor: `color-mix(in srgb, ${
                      m.role === "owner"
                        ? "var(--color-primary)"
                        : m.role === "admin"
                          ? "var(--color-info)"
                          : "var(--color-text-muted)"
                    } 12%, transparent)`,
                  }}
                >
                  {roleLabel(m.role)}
                </span>
              </div>
            ))}
            {org.members.length === 0 && (
              <p className="py-8 text-center text-sm text-[var(--color-text-muted)]">
                멤버가 없습니다.
              </p>
            )}
          </div>
        </section>
      )}

      {/* ========== TAB 3: SERIES ========== */}
      {tab === "series" && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-medium text-[var(--color-text-primary)]">
              시리즈 — {org.seriesCount}개
            </h2>
            {isAdmin && (
              <button
                type="button"
                onClick={() => setShowSeriesForm((v) => !v)}
                className="btn btn--sm btn--primary"
              >
                <span className="material-symbols-outlined mr-0.5 text-sm align-middle">
                  add
                </span>
                새 시리즈
              </button>
            )}
          </div>

          {/* 시리즈 생성 인라인 폼 */}
          {showSeriesForm && (
            <div className="flex gap-2">
              <input
                type="text"
                value={creatingSeriesName}
                onChange={(e) => setCreatingSeriesName(e.target.value)}
                placeholder="시리즈 이름"
                className="flex-1 rounded border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-accent)]"
                onKeyDown={(e) => {
                  // 한글 IME composition 중 Enter 차단
                  if (e.nativeEvent.isComposing) return;
                  if (e.key === "Enter") handleCreateSeries();
                }}
              />
              <button
                type="button"
                onClick={handleCreateSeries}
                className="rounded bg-[var(--color-info)] px-4 py-2 text-sm text-white hover:opacity-90"
              >
                만들기
              </button>
            </div>
          )}

          {/* 시리즈 목록 — 기존 Absorb/Actions 모달 trigger 보존 */}
          {org.series.length > 0 ? (
            <div className="space-y-2">
              {org.series.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4 transition-colors hover:border-[var(--color-accent)]"
                >
                  {/* 좌측: 시리즈 정보 — Link 로 진입 */}
                  <Link
                    href={`/tournament-admin/series/${s.id}`}
                    className="min-w-0 flex-1"
                  >
                    <p className="truncate font-medium text-[var(--color-text-primary)]">
                      {s.name}
                    </p>
                    <p className="text-xs text-[var(--color-text-muted)]">
                      대회 {s.tournamentsCount}개 · {s.slug}
                    </p>
                  </Link>
                  {/* 우측: 액션 버튼 + ⋮ 메뉴 + 진입 화살표 */}
                  <div className="flex items-center gap-2">
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={(e) => {
                          // Link 클릭 전파 차단
                          e.preventDefault();
                          e.stopPropagation();
                          setAbsorbModalSeries({ id: s.id, name: s.name });
                        }}
                        className="flex min-h-[44px] items-center gap-1 rounded-[4px] border border-[var(--color-border)] px-3 py-2 text-xs font-medium text-[var(--color-text-secondary)] transition-colors hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
                      >
                        <span className="material-symbols-outlined text-sm">
                          folder_managed
                        </span>
                        기존 대회 가져오기
                      </button>
                    )}
                    {isAdmin && (
                      <SeriesActionsMenu
                        seriesId={s.id}
                        seriesName={s.name}
                        currentOrgId={org.id}
                        currentOrgName={org.name}
                        onSuccess={loadOrg}
                      />
                    )}
                    <Link
                      href={`/tournament-admin/series/${s.id}`}
                      aria-label={`${s.name} 상세 진입`}
                    >
                      <span className="material-symbols-outlined text-[var(--color-text-muted)]">
                        chevron_right
                      </span>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-[var(--color-text-muted)]">
              아직 시리즈가 없습니다. 새 시리즈를 만들어보세요.
            </p>
          )}
        </section>
      )}

      {/* ========== TAB 4: EDITIONS (모든 시리즈 회차 통합) ========== */}
      {tab === "editions" && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-medium text-[var(--color-text-primary)]">
              회차 일정 — {totalEditions}회 누적
            </h2>
          </div>
          {/* 안내 — 회차 클릭 시 셋업 hub 진입 */}
          <div className="flex items-start gap-2 rounded-[4px] border border-[var(--color-border)] bg-[var(--color-elevated)] p-3 text-xs leading-relaxed text-[var(--color-text-secondary)]">
            <span className="material-symbols-outlined flex-shrink-0 text-sm text-[var(--color-info)]">
              info
            </span>
            <div>
              모든 시리즈의 회차를 통합해 보여줍니다. 회차를 클릭하면{" "}
              <b>대회 셋업 페이지</b>로 이동합니다. 시리즈별 상세 보기는 시리즈
              탭에서.
            </div>
          </div>

          {allEditions.length > 0 ? (
            <div className="space-y-2">
              {allEditions.map((e) => (
                <Link
                  key={e.id}
                  href={`/tournament-admin/tournaments/${e.id}`}
                  className="flex items-center justify-between rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4 transition-colors hover:border-[var(--color-accent)]"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate font-medium text-[var(--color-text-primary)]">
                        {e.name}
                      </p>
                      <span
                        className="rounded-full px-2 py-0.5 text-xs font-medium"
                        style={{
                          color:
                            e.status === "completed"
                              ? "var(--color-text-muted)"
                              : "var(--color-info)",
                          backgroundColor: `color-mix(in srgb, ${
                            e.status === "completed"
                              ? "var(--color-text-muted)"
                              : "var(--color-info)"
                          } 12%, transparent)`,
                        }}
                      >
                        {editionStatusLabel(e.status)}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-xs text-[var(--color-text-muted)]">
                      {e.seriesName}
                      {e.startDate &&
                        ` · ${new Date(e.startDate).toLocaleDateString("ko-KR")}`}
                      {(e.city || e.district) &&
                        ` · ${[e.city, e.district].filter(Boolean).join(" ")}`}
                      {e.maxTeams && ` · 최대 ${e.maxTeams}팀`}
                    </p>
                  </div>
                  <span className="material-symbols-outlined text-[var(--color-text-muted)]">
                    chevron_right
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-[var(--color-text-muted)]">
              아직 진행된 회차가 없습니다. 시리즈를 만들고 대회를 추가해보세요.
            </p>
          )}
        </section>
      )}

      {/* ========== TAB 5: OFFICERS (권한 위임 — admin role) ========== */}
      {tab === "officers" && (
        <section className="space-y-4">
          <div>
            <h2 className="font-medium text-[var(--color-text-primary)]">
              권한 위임 — 관리자 {adminMembers.length}명
            </h2>
            <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">
              소유자만 위임 가능. 역할 변경은 멤버 관리 페이지에서.
            </p>
          </div>

          {/* 권한 안내 박스 (역할별 권한 설명 — 정적 안내) */}
          <div className="flex items-start gap-2 rounded-[4px] border border-[var(--color-border)] bg-[var(--color-elevated)] p-3 text-xs leading-relaxed text-[var(--color-text-secondary)]">
            <span className="material-symbols-outlined flex-shrink-0 text-sm text-[var(--color-info)]">
              shield
            </span>
            <div>
              <b>소유자</b> = 모든 권한 (단체 보관 / 해산 포함). <b>관리자</b> =
              시리즈 생성 / 멤버 초대 / 회차 추가. <b>멤버</b> = 읽기 전용.
            </div>
          </div>

          {/* 관리자 list — 권한 toggle 은 DB 미지원 → 멤버 표시만 (mock 금지) */}
          {adminMembers.length > 0 ? (
            <div className="space-y-2">
              {adminMembers.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-border)] text-xs font-medium text-[var(--color-text-muted)]">
                      {(m.nickname || "?").charAt(0).toUpperCase()}
                    </div>
                    <p className="text-sm font-medium text-[var(--color-text-primary)]">
                      {m.nickname || "이름 없음"}
                    </p>
                  </div>
                  <span
                    className="rounded-full px-2 py-0.5 text-xs font-medium"
                    style={{
                      color: "var(--color-info)",
                      backgroundColor:
                        "color-mix(in srgb, var(--color-info) 12%, transparent)",
                    }}
                  >
                    관리자
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-[var(--color-text-muted)]">
              아직 위임된 관리자가 없습니다. 멤버 관리에서 멤버를 관리자로
              지정할 수 있습니다.
            </p>
          )}
        </section>
      )}

      {/* ========== TAB 6: ACTIVITY ========== */}
      {tab === "activity" && (
        <section className="space-y-4">
          <h2 className="font-medium text-[var(--color-text-primary)]">
            활동 이력
          </h2>
          {/* ORG_ACTIVITY_LOG 테이블 없음 + admin_logs(organization) 0건 → 빈 상태 (mock 금지) */}
          <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] py-12 text-center">
            <span className="material-symbols-outlined mb-2 text-4xl text-[var(--color-text-muted)]">
              history
            </span>
            <p className="text-sm text-[var(--color-text-primary)]">
              활동 이력 기능 준비 중
            </p>
            <p className="mt-1 text-xs text-[var(--color-text-muted)]">
              단체 · 시리즈 · 멤버 활동 로그가 곧 여기에 표시됩니다.
            </p>
          </div>
        </section>
      )}

      {/* 2026-05-12 PR3 — 기존 대회 가져오기 모달 */}
      {absorbModalSeries && org && (
        <AbsorbTournamentsModal
          open={!!absorbModalSeries}
          onClose={() => setAbsorbModalSeries(null)}
          seriesId={absorbModalSeries.id}
          seriesName={absorbModalSeries.name}
          organizationName={org.name}
          onSuccess={loadOrg}
        />
      )}

      {/* 2026-05-12 — 단체 정보 편집 모달 (6 필드 — PATCH /api/web/organizations/[id]) */}
      {editOpen && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4"
          onClick={() => !editSaving && setEditOpen(false)}
        >
          <div
            className="relative my-4 w-full max-w-lg rounded-lg bg-[var(--color-surface)] p-6 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => !editSaving && setEditOpen(false)}
              className="absolute right-3 top-3 rounded-[4px] p-2 text-[var(--color-text-muted)] hover:bg-[var(--color-elevated)]"
              aria-label="닫기"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
            <h3 className="mb-4 text-base font-bold text-[var(--color-text-primary)]">
              단체 정보 편집
            </h3>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-semibold text-[var(--color-text-muted)]">
                  단체 이름 <span className="text-[var(--color-accent)]">*</span>
                </label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) =>
                    setEditForm({ ...editForm, name: e.target.value })
                  }
                  className="w-full rounded-[4px] border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-[var(--color-text-muted)]">
                  소개
                </label>
                <textarea
                  value={editForm.description}
                  onChange={(e) =>
                    setEditForm({ ...editForm, description: e.target.value })
                  }
                  rows={2}
                  className="w-full rounded-[4px] border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2 text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-[var(--color-text-muted)]">
                    지역
                  </label>
                  <input
                    type="text"
                    value={editForm.region}
                    onChange={(e) =>
                      setEditForm({ ...editForm, region: e.target.value })
                    }
                    className="w-full rounded-[4px] border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-[var(--color-text-muted)]">
                    웹사이트
                  </label>
                  <input
                    type="url"
                    placeholder="https://"
                    value={editForm.website_url}
                    onChange={(e) =>
                      setEditForm({ ...editForm, website_url: e.target.value })
                    }
                    className="w-full rounded-[4px] border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2 text-sm"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-[var(--color-text-muted)]">
                    연락 이메일
                  </label>
                  <input
                    type="email"
                    value={editForm.contact_email}
                    onChange={(e) =>
                      setEditForm({ ...editForm, contact_email: e.target.value })
                    }
                    className="w-full rounded-[4px] border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-[var(--color-text-muted)]">
                    연락 전화
                  </label>
                  <input
                    type="tel"
                    value={editForm.contact_phone}
                    onChange={(e) =>
                      setEditForm({ ...editForm, contact_phone: e.target.value })
                    }
                    className="w-full rounded-[4px] border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2 text-sm"
                  />
                </div>
              </div>
            </div>
            {editError && (
              <p className="mt-3 text-sm text-[var(--color-error)]">
                {editError}
              </p>
            )}
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => !editSaving && setEditOpen(false)}
                disabled={editSaving}
                className="btn btn--sm"
              >
                취소
              </button>
              <button
                type="button"
                onClick={submitEdit}
                disabled={editSaving || !editForm.name.trim()}
                className="btn btn--sm btn--primary"
              >
                {editSaving ? "저장 중..." : "저장"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

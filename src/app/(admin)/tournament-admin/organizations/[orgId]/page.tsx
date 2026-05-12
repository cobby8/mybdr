"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
// 2026-05-12 PR3 — "기존 대회 가져오기" 모달 (다건 흡수)
import AbsorbTournamentsModal from "./_components/AbsorbTournamentsModal";

/* ============================================================
 * 단체 대시보드 — /tournament-admin/organizations/[orgId]
 *
 * 단체 정보 표시 + 수정 + 소속 시리즈 목록 + "새 시리즈 만들기" 버튼
 * ============================================================ */

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
  members: { id: string; nickname: string; role: string }[];
  series: {
    id: string;
    name: string;
    slug: string;
    tournamentsCount: number;
    createdAt: string;
  }[];
}

export default function OrganizationDashboardPage() {
  const params = useParams();
  const orgId = params.orgId as string;

  const [org, setOrg] = useState<OrgDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // 단체 정보 로드 — useCallback 으로 박제 (PR3 모달 onSuccess 시 재호출 위해).
  const loadOrg = useCallback(() => {
    setLoading(true);
    fetch(`/api/web/organizations/${orgId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
          return;
        }
        // snake_case → camelCase 매핑
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
  // open 시 어떤 시리즈 카드의 버튼을 눌렀는지 기억해야 모달에 seriesId/seriesName/orgName 전달.
  const [absorbModalSeries, setAbsorbModalSeries] = useState<{
    id: string;
    name: string;
  } | null>(null);

  // 새 시리즈 생성 (단체 소속으로)
  const [creatingSeriesName, setCreatingSeriesName] = useState("");
  const [showSeriesForm, setShowSeriesForm] = useState(false);

  // 2026-05-12 — 단체 정보 편집 모달 state (이미지 32 사용자 요청)
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

  const isAdmin = org.myRole === "owner" || org.myRole === "admin";

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center gap-4">
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
        <div>
          <h1 className="text-xl font-bold text-[var(--color-text-primary)]">
            {org.name}
          </h1>
          <p className="text-sm text-[var(--color-text-muted)]">
            {org.region || "지역 미설정"} · 멤버 {org.members.length}명 · 시리즈{" "}
            {org.seriesCount}개
          </p>
        </div>
      </div>

      {/* 정보 카드 */}
      <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-medium text-[var(--color-text-primary)]">
            단체 정보
          </h2>
          {isAdmin && (
            <Link
              href={`/organizations/${org.slug}`}
              target="_blank"
              className="text-xs text-[var(--color-info)] hover:underline"
            >
              공개 페이지 보기
              <span className="material-symbols-outlined ml-0.5 text-xs align-middle">
                open_in_new
              </span>
            </Link>
          )}
        </div>
        <dl className="grid gap-2 text-sm md:grid-cols-2">
          <div>
            <dt className="text-[var(--color-text-muted)]">slug</dt>
            <dd className="text-[var(--color-text-primary)]">{org.slug}</dd>
          </div>
          <div>
            <dt className="text-[var(--color-text-muted)]">상태</dt>
            <dd className="text-[var(--color-text-primary)]">
              {org.status} · {org.isPublic ? "공개" : "비공개"}
            </dd>
          </div>
          {org.description && (
            <div className="md:col-span-2">
              <dt className="text-[var(--color-text-muted)]">소개</dt>
              <dd className="text-[var(--color-text-primary)]">
                {org.description}
              </dd>
            </div>
          )}
          {org.contactEmail && (
            <div>
              <dt className="text-[var(--color-text-muted)]">이메일</dt>
              <dd className="text-[var(--color-text-primary)]">
                {org.contactEmail}
              </dd>
            </div>
          )}
          {org.websiteUrl && (
            <div>
              <dt className="text-[var(--color-text-muted)]">웹사이트</dt>
              <dd>
                <a
                  href={org.websiteUrl}
                  target="_blank"
                  rel="noopener"
                  className="text-[var(--color-info)] hover:underline"
                >
                  {org.websiteUrl}
                </a>
              </dd>
            </div>
          )}
        </dl>
      </div>

      {/* 2026-05-12 — 단체 운영자 관리 메뉴 (이미지 32 사용자 요청) */}
      {isAdmin && (
        <div className="space-y-2">
          {/* 단체 정보 편집 모달 trigger */}
          <button
            type="button"
            onClick={openEditModal}
            className="flex w-full items-center justify-between rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4 transition-colors hover:border-[var(--color-accent)]"
          >
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[var(--color-text-muted)]">edit</span>
              <span className="text-sm font-medium text-[var(--color-text-primary)]">
                단체 정보 편집
              </span>
            </div>
            <span className="material-symbols-outlined text-[var(--color-text-muted)]">
              chevron_right
            </span>
          </button>

          {/* 멤버 관리 */}
          <Link
            href={`/tournament-admin/organizations/${orgId}/members`}
            className="flex items-center justify-between rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4 transition-colors hover:border-[var(--color-accent)]"
          >
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[var(--color-text-muted)]">
                group
              </span>
              <span className="text-sm font-medium text-[var(--color-text-primary)]">
                멤버 관리 ({org.members.length}명)
              </span>
            </div>
            <span className="material-symbols-outlined text-[var(--color-text-muted)]">
              chevron_right
            </span>
          </Link>

          {/* 공개 사이트 — 외부 link */}
          <a
            href={`/organizations/${org.slug}`}
            target="_blank"
            rel="noopener"
            className="flex items-center justify-between rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4 transition-colors hover:border-[var(--color-accent)]"
          >
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[var(--color-text-muted)]">
                public
              </span>
              <span className="text-sm font-medium text-[var(--color-text-primary)]">
                공개 사이트 보기
              </span>
            </div>
            <span className="material-symbols-outlined text-[var(--color-text-muted)]">
              open_in_new
            </span>
          </a>
        </div>
      )}

      {/* 소속 시리즈 */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-medium text-[var(--color-text-primary)]">
            소속 시리즈
          </h2>
          {isAdmin && (
            <button
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
          <div className="mb-4 flex gap-2">
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
              onClick={handleCreateSeries}
              className="rounded bg-[var(--color-info)] px-4 py-2 text-sm text-white hover:opacity-90"
            >
              만들기
            </button>
          </div>
        )}

        {/* 시리즈 목록
            2026-05-12 PR3 — 각 시리즈 카드 우측에 "기존 대회 가져오기" 버튼 추가 (운영자만).
            시리즈 진입 Link 와 분리하기 위해 카드 컨테이너는 div 로, "상세 진입"은 별도 Link 로 박제.
        */}
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
                {/* 우측: 액션 버튼 + 진입 화살표 */}
                <div className="flex items-center gap-2">
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={(e) => {
                        // Link 클릭 전파 차단 — 버튼 클릭 시 시리즈 상세 진입 X.
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
      </div>

      {/* 2026-05-12 PR3 — 기존 대회 가져오기 모달.
          단체 정보 (name) 는 org 에서, 시리즈 정보는 absorbModalSeries state 에서 전달.
          onSuccess: loadOrg 재호출하여 시리즈 카운터 갱신 (tournaments_count). */}
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

      {/* 2026-05-12 — 단체 정보 편집 모달 (이미지 32 사용자 요청)
          - 6 필드 (name / description / region / contact_email / contact_phone / website_url)
          - PATCH /api/web/organizations/[id] (owner/admin 만 통과 — 서버 가드)
          - 성공 시 loadOrg 재호출하여 카드 정보 갱신 */}
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
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full rounded-[4px] border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-[var(--color-text-muted)]">
                  소개
                </label>
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
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
                    onChange={(e) => setEditForm({ ...editForm, region: e.target.value })}
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
                    onChange={(e) => setEditForm({ ...editForm, website_url: e.target.value })}
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
                    onChange={(e) => setEditForm({ ...editForm, contact_email: e.target.value })}
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
                    onChange={(e) => setEditForm({ ...editForm, contact_phone: e.target.value })}
                    className="w-full rounded-[4px] border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2 text-sm"
                  />
                </div>
              </div>
            </div>
            {editError && (
              <p className="mt-3 text-sm text-[var(--color-error)]">{editError}</p>
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

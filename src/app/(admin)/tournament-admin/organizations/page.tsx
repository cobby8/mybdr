"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

/* ============================================================
 * 내 단체 목록 — /tournament-admin/organizations
 *
 * 소속된 단체를 카드 형태로 표시.
 * "새 단체 만들기" 버튼으로 생성 페이지로 이동.
 * ============================================================ */

interface OrgItem {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  region: string | null;
  seriesCount: number;
  myRole: string;
  // 2026-05-12 Phase E — archived 단체 분리 표시용
  status: string;
}

export default function OrganizationsListPage() {
  const [orgs, setOrgs] = useState<OrgItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/web/organizations")
      .then((r) => r.json())
      .then((data) => {
        // API 응답이 snake_case → camelCase 매핑
        setOrgs(
          (data.organizations || []).map((o: Record<string, unknown>) => ({
            id: o.id as string,
            name: o.name as string,
            slug: o.slug as string,
            logoUrl: (o.logo_url as string) ?? null,
            region: (o.region as string) ?? null,
            seriesCount: (o.series_count as number) ?? 0,
            myRole: o.my_role as string,
            // 2026-05-12 Phase E — status 보존 (archived 분리 표시)
            status: (o.status as string) ?? "approved",
          }))
        );
      })
      .catch(() => setOrgs([]))
      .finally(() => setLoading(false));
  }, []);

  // 역할 한국어 라벨
  const roleLabel = (role: string) => {
    if (role === "owner") return "소유자";
    if (role === "admin") return "관리자";
    return "멤버";
  };

  return (
    <div>
      {/* 헤더: 제목 + 생성 버튼 */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold text-[var(--color-text-primary)]">
          내 단체
        </h1>
        {/* 2026-05-12 — admin 빨간색 본문 금지 룰 (conventions.md 5/11):
            `bg-[var(--color-primary)]` 직접 var 금지 → `btn btn--primary` 클래스 위임
            (라이트 = navy / 다크 = BDR Red 자동 분기, globals.css L276+) */}
        <Link
          href="/tournament-admin/organizations/new"
          className="btn btn--primary"
        >
          <span className="material-symbols-outlined mr-1 text-base align-middle">
            add
          </span>
          새 단체 만들기
        </Link>
      </div>

      {/* 로딩 스켈레톤 */}
      {loading && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-32 animate-pulse rounded-lg bg-[var(--color-surface)]"
            />
          ))}
        </div>
      )}

      {/* 2026-05-12 Phase E — active / archived 분리 (carded 그리드)
          archived 는 회색 톤 + 별 섹션. owner 가 복구 흐름 자연스럽게 인지. */}
      {!loading && orgs.length > 0 && (() => {
        const activeOrgs = orgs.filter((o) => o.status !== "archived");
        const archivedOrgs = orgs.filter((o) => o.status === "archived");
        return (
          <>
            {/* 활성 단체 — 기존 카드 그대로 */}
            {activeOrgs.length > 0 && (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {activeOrgs.map((org) => (
                  <Link
                    key={org.id}
                    href={`/tournament-admin/organizations/${org.id}`}
                    className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-5 transition-colors hover:border-[var(--color-accent)]"
                  >
                    <div className="flex items-center gap-3">
                      {org.logoUrl ? (
                        <img
                          src={org.logoUrl}
                          alt={org.name}
                          className="h-10 w-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-info)] text-sm font-bold text-white">
                          {org.name.charAt(0)}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-[var(--color-text-primary)]">
                          {org.name}
                        </p>
                        <p className="text-xs text-[var(--color-text-muted)]">
                          {org.region || "지역 미설정"} · 시리즈 {org.seriesCount}개
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="rounded-full bg-[rgba(27,60,135,0.12)] px-2.5 py-0.5 text-xs font-medium text-[var(--color-info)]">
                        {roleLabel(org.myRole)}
                      </span>
                      <span className="material-symbols-outlined text-base text-[var(--color-text-muted)]">
                        chevron_right
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {/* 보관된 단체 — 회색 톤 + 별 섹션 (archive 가 있을 때만 노출) */}
            {archivedOrgs.length > 0 && (
              <div className="mt-10">
                <div className="mb-3 flex items-center gap-2">
                  <span className="material-symbols-outlined text-base text-[var(--color-text-muted)]">
                    inventory_2
                  </span>
                  <h2 className="text-sm font-semibold text-[var(--color-text-muted)]">
                    보관된 단체 ({archivedOrgs.length})
                  </h2>
                </div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {archivedOrgs.map((org) => (
                    <Link
                      key={org.id}
                      href={`/tournament-admin/organizations/${org.id}`}
                      // 회색 톤 — opacity-70 + hover 시 정상 색
                      className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-5 opacity-70 transition-all hover:opacity-100 hover:border-[var(--color-text-muted)]"
                    >
                      <div className="flex items-center gap-3">
                        {org.logoUrl ? (
                          <img
                            src={org.logoUrl}
                            alt={org.name}
                            className="h-10 w-10 rounded-full object-cover grayscale"
                          />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-text-muted)] text-sm font-bold text-white">
                            {org.name.charAt(0)}
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium text-[var(--color-text-primary)]">
                            {org.name}
                          </p>
                          <p className="text-xs text-[var(--color-text-muted)]">
                            {org.region || "지역 미설정"} · 시리즈 {org.seriesCount}개
                          </p>
                        </div>
                      </div>
                      <div className="mt-3 flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <span className="rounded-full bg-[var(--color-border)] px-2 py-0.5 text-xs font-medium text-[var(--color-text-muted)]">
                            보관됨
                          </span>
                          <span className="rounded-full bg-[rgba(27,60,135,0.12)] px-2.5 py-0.5 text-xs font-medium text-[var(--color-info)]">
                            {roleLabel(org.myRole)}
                          </span>
                        </div>
                        <span className="material-symbols-outlined text-base text-[var(--color-text-muted)]">
                          chevron_right
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </>
        );
      })()}

      {/* 빈 상태 */}
      {!loading && orgs.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-20 text-center">
          <span className="material-symbols-outlined text-4xl text-[var(--color-text-disabled)]">
            corporate_fare
          </span>
          <p className="text-[var(--color-text-muted)]">
            아직 소속된 단체가 없습니다
          </p>
          <Link
            href="/tournament-admin/organizations/new"
            className="btn btn--primary"
          >
            단체 만들기
          </Link>
        </div>
      )}
    </div>
  );
}

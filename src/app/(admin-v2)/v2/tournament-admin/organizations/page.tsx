"use client";

// =====================================================================
// (admin-v2)/v2/tournament-admin/organizations/page.tsx — 단체·주최(M3 파일럿 5/5)
//   정본: ta-pages.jsx Orgs (카드 그리드)
//
//   데이터 배선(★실데이터):
//   - GET /api/web/organizations (admin-api organizationsApi.listMyOrganizations) — 내가 멤버인 단체.
//   - 레거시 단체 페이지가 raw fetch 로 쓰던 그 source 를 admin-api 로 타입드 배선(snake 함정 차단).
//   - 카드 "관리" → 레거시 단체 상세(/tournament-admin/organizations/[id]) 링크.
//   카드 클래스(ad-card/ad-cardgrid)는 toss-admin.css append 분(정본 admin-pages.css 1:1·토큰화).
// =====================================================================

import Link from "next/link";
import { organizationsApi, useAdminQuery } from "@/lib/admin-api";
import type { AdminOrganizationSummary } from "@/lib/admin-api";
import { PageHead } from "@/components/admin-v2/blocks";
import { Icon, Empty, ErrState, Skel } from "@/components/admin-toss";

const SUB = "대회를 개최하는 단체와 주최사를 관리합니다.";

function roleLabel(role: string | null): string {
  if (role === "owner") return "소유자";
  if (role === "admin") return "관리자";
  return "멤버";
}

function statusLabel(status: string | null): string {
  if (status === "archived") return "보관";
  if (status === "pending") return "대기";
  return "운영";
}

export default function TaOrganizationsPage() {
  const { data, loading, error, refetch } = useAdminQuery(
    (signal) => organizationsApi.listMyOrganizations(signal),
    [],
  );

  return (
    <div>
      <PageHead
        eyebrow="대회 관리자"
        title="단체·주최"
        sub={SUB}
        actions={
          <Link href="/tournament-admin/organizations/new" className="ts-btn ts-btn--primary" style={{ textDecoration: "none" }}>
            <Icon name="plus" size={17} />
            단체 만들기
          </Link>
        }
      />

      {/* 로딩 — 카드 스켈레톤 그리드 */}
      {loading && (
        <div className="ad-cardgrid">
          {[0, 1, 2].map((i) => (
            <div key={i} className="ad-card">
              <Skel w="60%" h={18} />
              <Skel w="40%" h={13} />
              <Skel w="100%" h={48} r={12} />
            </div>
          ))}
        </div>
      )}

      {!loading && error && (
        <ErrState title="단체 목록을 불러오지 못했습니다" desc={error.message} onRetry={refetch} />
      )}

      {!loading && !error && (data?.length ?? 0) === 0 && (
        <Empty icon="building-2" title="소속된 단체가 없습니다" desc="새 단체를 만들거나 기존 단체 초대를 확인해 주세요.">
          <Link href="/tournament-admin/organizations/new" className="ts-btn ts-btn--primary" style={{ textDecoration: "none" }}>
            단체 만들기
          </Link>
        </Empty>
      )}

      {!loading && !error && (data?.length ?? 0) > 0 && (
        <div className="ad-cardgrid">
          {data!.map((org) => (
            <OrgCard key={org.id} org={org} />
          ))}
        </div>
      )}
    </div>
  );
}

function OrgCard({ org }: { org: AdminOrganizationSummary }) {
  const archived = org.status === "archived";
  return (
    <div className="ad-card" style={archived ? { opacity: 0.72 } : undefined}>
      <div className="ad-card__head">
        {org.logoUrl ? (
          // 로고 이미지 — 데이터 주입(컴포넌트 하드코딩 아님)
          <span className="ad-card__logo" style={{ overflow: "hidden", padding: 0 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={org.logoUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </span>
        ) : (
          // 로고 없음 → 이니셜. 배경 토큰(하드코딩 hex 0)
          <span className="ad-card__logo" style={{ background: "var(--primary)" }}>
            {org.name.slice(0, 1)}
          </span>
        )}
        <div style={{ minWidth: 0, flex: 1 }}>
          <div className="ad-card__title" style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{org.name}</span>
            {!archived && org.status === "approved" && (
              <Icon name="badge-check" size={16} color="var(--primary)" />
            )}
          </div>
          <div className="ad-card__sub">{org.region || "지역 미설정"}</div>
        </div>
      </div>

      <div className="ad-card__stats">
        <div>
          <div className="ad-card__stat-v">{org.seriesCount ?? 0}</div>
          <div className="ad-card__stat-l">정규대회</div>
        </div>
        <div>
          <div className="ad-card__stat-v">{roleLabel(org.myRole)}</div>
          <div className="ad-card__stat-l">내 권한</div>
        </div>
        <div>
          <div className="ad-card__stat-v">{statusLabel(org.status)}</div>
          <div className="ad-card__stat-l">상태</div>
        </div>
      </div>

      <div className="ad-card__foot">
        <Link
          href={`/tournament-admin/organizations/${org.id}`}
          className="ts-btn ts-btn--secondary ts-btn--sm ts-btn--block"
          style={{ textDecoration: "none" }}
        >
          관리
          <Icon name="chevron-right" size={15} />
        </Link>
      </div>
    </div>
  );
}

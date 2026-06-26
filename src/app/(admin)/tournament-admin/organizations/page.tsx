"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Empty, Icon } from "@/components/admin-toss";

interface OrgItem {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  region: string | null;
  seriesCount: number;
  myRole: string;
  status: string;
}

function roleLabel(role: string) {
  if (role === "owner") return "소유자";
  if (role === "admin") return "관리자";
  return "멤버";
}

function OrgLogo({ org, archived = false }: { org: OrgItem; archived?: boolean }) {
  if (org.logoUrl) {
    return (
      <span className="ad-card__logo overflow-hidden bg-[var(--grey-100)]">
        <img
          src={org.logoUrl}
          alt=""
          className={"h-full w-full object-cover" + (archived ? " grayscale" : "")}
        />
      </span>
    );
  }

  return (
    <span
      className="ad-card__logo"
      style={{ background: archived ? "var(--grey-400)" : "var(--primary)" }}
    >
      {org.name.charAt(0)}
    </span>
  );
}

function OrgCard({ org, archived = false }: { org: OrgItem; archived?: boolean }) {
  return (
    <Link
      href={`/tournament-admin/organizations/${org.id}`}
      className="ad-card"
      style={archived ? { opacity: 0.72 } : undefined}
    >
      <div className="ad-card__head">
        <OrgLogo org={org} archived={archived} />
        <div style={{ minWidth: 0, flex: 1 }}>
          <div className="ad-card__title" style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span className="truncate">{org.name}</span>
            {!archived && <Icon name="badge-check" size={16} color="var(--primary)" />}
          </div>
          <div className="ad-card__sub">{org.region || "지역 미설정"}</div>
        </div>
      </div>

      <div className="ad-card__stats">
        <div>
          <div className="ad-card__stat-v">{org.seriesCount}</div>
          <div className="ad-card__stat-l">시리즈</div>
        </div>
        <div>
          <div className="ad-card__stat-v">{roleLabel(org.myRole)}</div>
          <div className="ad-card__stat-l">내 권한</div>
        </div>
        <div>
          <div className="ad-card__stat-v">{archived ? "보관" : "운영"}</div>
          <div className="ad-card__stat-l">상태</div>
        </div>
      </div>

      <div className="ad-card__foot">
        <span className="ts-btn ts-btn--secondary ts-btn--sm">
          관리
          <Icon name="chevron-right" size={15} />
        </span>
      </div>
    </Link>
  );
}

function LoadingGrid() {
  return (
    <div className="ad-cardgrid">
      {[1, 2, 3].map((i) => (
        <div key={i} className="ad-card animate-pulse">
          <div className="h-12 rounded-[14px] bg-[var(--grey-100)]" />
          <div className="h-16 rounded-[14px] bg-[var(--grey-50)]" />
        </div>
      ))}
    </div>
  );
}

export default function OrganizationsListPage() {
  const [orgs, setOrgs] = useState<OrgItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/web/organizations")
      .then((r) => r.json())
      .then((data) => {
        setOrgs(
          (data.organizations || []).map((o: Record<string, unknown>) => ({
            id: o.id as string,
            name: o.name as string,
            slug: o.slug as string,
            logoUrl: (o.logo_url as string) ?? null,
            region: (o.region as string) ?? null,
            seriesCount: (o.series_count as number) ?? 0,
            myRole: o.my_role as string,
            status: (o.status as string) ?? "approved",
          })),
        );
      })
      .catch(() => setOrgs([]))
      .finally(() => setLoading(false));
  }, []);

  const activeOrgs = orgs.filter((org) => org.status !== "archived");
  const archivedOrgs = orgs.filter((org) => org.status === "archived");

  return (
    <div data-skin="toss" className="space-y-6">
      <div className="ts-ph">
        <div className="ts-ph__row">
          <div style={{ minWidth: 0 }}>
            <div className="ts-ph__eyebrow">
              <Icon name="building-2" size={15} />
              대회 관리자
            </div>
            <div className="ts-ph__title">단체</div>
            <div className="ts-ph__sub">내가 운영하거나 소속된 단체와 시리즈를 관리합니다.</div>
          </div>
          <div className="ts-ph__actions">
            <Link href="/tournament-admin/organizations/new" className="ts-btn ts-btn--primary">
              <Icon name="plus" size={17} />
              단체 만들기
            </Link>
          </div>
        </div>
      </div>

      {loading && <LoadingGrid />}

      {!loading && orgs.length === 0 && (
        <Empty
          icon="building-2"
          title="소속된 단체가 없습니다"
          desc="새 단체를 만들거나 기존 단체 초대를 확인해 주세요."
        >
          <Link href="/tournament-admin/organizations/new" className="ts-btn ts-btn--primary">
            단체 만들기
          </Link>
        </Empty>
      )}

      {!loading && activeOrgs.length > 0 && (
        <section className="ad-section">
          <div className="ad-cardgrid">
            {activeOrgs.map((org) => (
              <OrgCard key={org.id} org={org} />
            ))}
          </div>
        </section>
      )}

      {!loading && archivedOrgs.length > 0 && (
        <section className="ad-section">
          <div className="ad-panel__head">
            <div className="ad-panel__title">보관된 단체</div>
            <span className="ts-badge ts-badge--grey">{archivedOrgs.length}개</span>
          </div>
          <div className="ad-cardgrid">
            {archivedOrgs.map((org) => (
              <OrgCard key={org.id} org={org} archived />
            ))}
          </div>
        </section>
      )}

      {!loading && (
        <div className="ad-panel">
          <div className="ad-listrow">
            <span className="ad-listrow__icon" style={{ background: "var(--primary-weak)" }}>
              <Icon name="info" size={17} color="var(--primary)" />
            </span>
            <div className="ad-listrow__body">
              <div className="ad-listrow__t">단체 운영 안내</div>
              <div className="ad-listrow__s">
                단체 안에서 시리즈와 대회를 만들 수 있습니다. 관리자 계정은 즉시 승인되고, 일반 사용자는 단체 신청 페이지에서 요청할 수 있습니다.
              </div>
            </div>
            <Link href="/organizations/apply" className="ts-btn ts-btn--secondary ts-btn--sm">
              신청 페이지
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

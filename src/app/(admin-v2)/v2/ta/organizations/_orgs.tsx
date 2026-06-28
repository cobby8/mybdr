"use client";

// ============================================================
// ta/organizations/_orgs.tsx — 단체·주최 (클라). 정본 ta-pages Orgs 1:1.
//   ad-cardgrid 카드(로고/인증뱃지/대회·운영진·회원 통계/관리·운영진 버튼).
//   데이터는 서버 props. 등록·관리·운영진 = 미배선 → 준비 중 토스트.
//   데이터 0건이면 정본 Empty(준비 중 인상 차단).
// ============================================================

import React from "react";
import { PageHead, Btn, Icon, Empty, useAdminShell } from "@/components/admin-v2";

export type TaOrgRow = {
  id: string;
  name: string;
  type: string;
  tournaments: number;
  admins: number;
  members: number;
  verified: boolean;
  color: string;
};

export function OrgGrid({ rows }: { rows: TaOrgRow[] }) {
  const { toast } = useAdminShell();

  return (
    <div>
      <PageHead
        eyebrow="대회 관리자"
        title="단체·주최 관리"
        sub="대회를 개최하는 단체와 주최사를 관리합니다."
        actions={
          <Btn icon="plus" onClick={() => toast("단체 등록은 준비 중입니다")}>
            단체 등록
          </Btn>
        }
      />
      {rows.length === 0 ? (
        <Empty
          icon="building-2"
          title="등록된 단체가 없습니다"
          desc="운영 중인 단체·주최사가 여기에 표시됩니다."
        />
      ) : (
        <div className="ad-cardgrid">
          {rows.map((o) => (
            <div key={o.id} className="ad-card">
              <div className="ad-card__head">
                <span className="ad-card__logo" style={{ background: o.color }}>
                  {o.name.slice(0, 1)}
                </span>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div
                    className="ad-card__title"
                    style={{ display: "flex", alignItems: "center", gap: 6 }}
                  >
                    {o.name}
                    {o.verified && (
                      <Icon name="badge-check" size={16} color="var(--primary)" />
                    )}
                  </div>
                  <div className="ad-card__sub">{o.type}</div>
                </div>
              </div>
              <div className="ad-card__stats">
                <div>
                  <div className="ad-card__stat-v">{o.tournaments}</div>
                  <div className="ad-card__stat-l">대회</div>
                </div>
                <div>
                  <div className="ad-card__stat-v">{o.admins}</div>
                  <div className="ad-card__stat-l">운영진</div>
                </div>
                <div>
                  <div className="ad-card__stat-v">{o.members.toLocaleString()}</div>
                  <div className="ad-card__stat-l">회원</div>
                </div>
              </div>
              <div className="ad-card__foot">
                <Btn
                  variant="secondary"
                  size="sm"
                  block
                  icon="settings-2"
                  onClick={() => toast(`${o.name} 관리는 준비 중입니다`)}
                >
                  관리
                </Btn>
                <Btn
                  variant="ghost"
                  size="sm"
                  icon="users"
                  onClick={() => toast("운영진 관리는 준비 중입니다")}
                >
                  운영진
                </Btn>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

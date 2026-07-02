"use client";

// ============================================================
// org-console/_coming-soon.tsx — 8레일 골격(skeleton) + 잠금/준비중 컨셉
//   정본 참조: org-pages.jsx ComingSoon/SkelTable/SkelCards.
//   ★DB 미지원(무중단ADD·신규테이블) 기능 — 실데이터 와이어 0. 순수 도형(회색 바)만
//     렌더(숫자/텍스트 mock 없음) → §7 "데이터 없으면 정본 Empty/더미 금지" 준수.
// ============================================================

import React from "react";
import { PageHead, Icon, Btn, useAdminShell } from "@/components/admin-v2";
import { ORG_RAILS, type RailKey } from "./_rails";

function SkelTable() {
  return (
    <div className="ad-panel" style={{ padding: 0 }}>
      <div style={{ display: "flex", gap: 10, padding: 16, borderBottom: "1px solid var(--border)" }}>
        <div className="oc-skelbar" style={{ flex: 1, height: 38, borderRadius: 12 }} />
        <div className="oc-skelbar" style={{ width: 90, height: 38, borderRadius: 12 }} />
      </div>
      {[0, 1, 2, 3, 4].map((i) => (
        <div
          key={i}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            padding: "16px 18px",
            borderTop: i ? "1px solid var(--border)" : "none",
          }}
        >
          <div className="oc-skelbar" style={{ width: 36, height: 36, borderRadius: 50 }} />
          <div style={{ flex: 1 }}>
            <div className="oc-skelbar" style={{ width: "40%", height: 13 }} />
            <div className="oc-skelbar" style={{ width: "24%", height: 11, marginTop: 7 }} />
          </div>
          <div className="oc-skelbar" style={{ width: 64, height: 24, borderRadius: 8 }} />
        </div>
      ))}
    </div>
  );
}

function SkelCards() {
  return (
    <div className="ad-cardgrid">
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="ad-card">
          <div style={{ display: "flex", gap: 12 }}>
            <div className="oc-skelbar" style={{ width: 48, height: 48, borderRadius: 14 }} />
            <div style={{ flex: 1 }}>
              <div className="oc-skelbar" style={{ width: "70%", height: 15 }} />
              <div className="oc-skelbar" style={{ width: "45%", height: 12, marginTop: 8 }} />
            </div>
          </div>
          <div className="oc-skelbar" style={{ width: "100%", height: 40, borderRadius: 12, marginTop: 4 }} />
        </div>
      ))}
    </div>
  );
}

export function ComingSoon({ page }: { page: RailKey }) {
  const { toast } = useAdminShell();
  const M = ORG_RAILS[page];
  const locked = !!M.locked;

  return (
    <div>
      <PageHead eyebrow="단체 콘솔" title={M.title} sub={M.sub} />
      <div className="oc-skel-wrap">
        <div className="oc-skel">{M.kind === "cards" ? <SkelCards /> : <SkelTable />}</div>
        <div className="oc-skel-mask">
          <div className="oc-lockcard">
            <span
              className="oc-lockcard__icon"
              style={{
                background: locked ? "var(--danger-weak)" : "var(--primary-weak)",
                color: locked ? "var(--danger)" : "var(--primary)",
              }}
            >
              <Icon name={locked ? "lock" : "hammer"} size={26} />
            </span>
            <div className="oc-lockcard__t">
              {M.title}
              <span className="oc-concept" data-tone={locked ? "warn" : undefined}>
                <Icon name="sparkles" size={11} />
                {locked ? "잠금" : "준비중"}
              </span>
            </div>
            <div className="oc-lockcard__d">{M.note}</div>
            <div style={{ marginTop: 18 }}>
              {locked ? (
                <Btn
                  variant="secondary"
                  icon="shield-check"
                  onClick={() => toast("단체 인증 신청 기능은 준비 중이에요")}
                >
                  인증하고 잠금 해제
                </Btn>
              ) : (
                <Btn variant="secondary" icon="bell" onClick={() => toast("출시되면 알려드릴게요")}>
                  출시 알림 받기
                </Btn>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

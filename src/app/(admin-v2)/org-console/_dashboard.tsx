"use client";

// ============================================================
// org-console/_dashboard.tsx — 단체 콘솔 대시보드 (정본 org-pages.jsx Dashboard 1:1)
//   KPI 3종(멤버·시리즈·진행중 대회) = 서버 props(실 Prisma 집계). 인증 진행률 = 컨셉 고정값(§4-1).
//   인증 유도 배너 · 온보딩 체크리스트 = 정적 컨셉(브리프 지시 — 정적 컨셉 OK).
//   최근 활동 = 활동 로그 테이블 부재 → org-data.jsx 샘플 유지하되 "컨셉" 톤으로 정직 라벨링
//   (실시간처럼 보이는 표현 금지 — §7 데이터 없으면 정본 Empty/더미 금지에 대한 절충).
// ============================================================

import React from "react";
import { useRouter } from "next/navigation";
import { PageHead, KpiGrid, AdListPanel, Btn, Badge, Icon, useAdminShell, type KpiItem, type ListItem } from "@/components/admin-v2";
import { orgColor } from "./_org-color";

// 온보딩 체크리스트 항목(정적 컨셉 — org-data.jsx ORG_ONBOARD 1:1, to는 실 라우트로 치환).
const ONBOARD: { id: string; label: string; desc: string; state: "done" | "now" | "soon"; to: string; concept?: boolean }[] = [
  { id: "ob1", label: "단체 기본 정보 입력", desc: "단체명·활동 지역", state: "done", to: "/org-console/profile" },
  { id: "ob2", label: "멤버 초대하기", desc: "링크로 바로 초대(인증 불필요)", state: "now", to: "/org-console/members" },
  { id: "ob3", label: "로고·배너 등록", desc: "단체 브랜딩 꾸미기", state: "now", to: "/org-console/profile", concept: true },
  { id: "ob4", label: "단체 인증 신청", desc: "공식 대회 개최·회비 출금에 필요", state: "soon", to: "/org-console/profile", concept: true },
];

// 최근 활동(컨셉 샘플 — 활동 로그 테이블 부재. 실제 값 아님을 배지로 명시).
const RECENT_CONCEPT: ListItem[] = [
  { id: 1, icon: "user-plus", tone: "primary", t: "새 멤버가 가입하면 여기에 표시돼요", s: "회원 신청 승인 알림(예시)", time: "" },
  { id: 2, icon: "trophy", tone: "ok", t: "대회가 시작되면 여기에 표시돼요", s: "대회 진행 현황 알림(예시)", time: "" },
  { id: 3, icon: "megaphone", tone: "primary", t: "공지를 발행하면 여기에 표시돼요", s: "멤버 알림 발송(예시)", time: "" },
];

function CertBanner({ orgId }: { orgId: string | null }) {
  const { toast } = useAdminShell();
  const OC = orgColor(orgId);
  return (
    <div className="oc-cert" style={{ background: `linear-gradient(120deg, ${OC.deep}, ${OC.base})` }}>
      <span className="oc-cert__icon">
        <Icon name="shield-check" size={26} color="#fff" />
      </span>
      <div className="oc-cert__body">
        <div className="oc-cert__eyebrow">
          단체 인증
          <span className="oc-concept">
            <Icon name="sparkles" size={11} />
            준비중
          </span>
        </div>
        <div className="oc-cert__title">인증을 마치면 공식 대회 개최·회비 출금이 열려요</div>
        <div className="oc-cert__desc">기본 기능은 인증 없이도 바로 쓸 수 있어요. 서류는 필요한 시점에 제출하면 됩니다.</div>
        <div className="oc-cert__prog">
          <div className="oc-cert__track">
            <div className="oc-cert__fill" style={{ width: "40%" }} />
          </div>
          <div className="oc-cert__pct">
            <span>인증 진행률</span>
            <span>40%</span>
          </div>
        </div>
      </div>
      <div className="oc-cert__act">
        <Btn iconRight="arrow-right" onClick={() => toast("단체 인증 신청 기능은 준비 중이에요")}>
          인증 이어서 하기
        </Btn>
      </div>
    </div>
  );
}

function Onboarding() {
  const router = useRouter();
  const pillLabel: Record<string, string> = { now: "지금 추천", soon: "필요할 때" };
  const doneCount = ONBOARD.filter((o) => o.state === "done").length;
  return (
    <div className="ad-panel">
      <div className="ad-panel__head">
        <div className="ad-panel__title">시작하기</div>
        <Badge tone="primary">
          {doneCount} / {ONBOARD.length} 완료
        </Badge>
      </div>
      <div className="oc-onb">
        {ONBOARD.map((o) => (
          <button key={o.id} className="oc-onbrow" data-state={o.state} onClick={() => router.push(o.to)}>
            <span className="oc-onbrow__mark">{o.state === "done" && <Icon name="check" size={15} />}</span>
            <span className="oc-onbrow__body">
              <span className="oc-onbrow__t">
                {o.label}
                {o.state !== "done" && (
                  <span className="oc-pill" data-tone={o.state}>
                    {pillLabel[o.state]}
                  </span>
                )}
                {o.concept && (
                  <span className="oc-concept" data-tone={o.state === "soon" ? "warn" : undefined}>
                    <Icon name="sparkles" size={11} />
                    컨셉
                  </span>
                )}
              </span>
              <span className="oc-onbrow__d">{o.desc}</span>
            </span>
            <span className="oc-onbrow__go">
              <Icon name="chevron-right" size={18} />
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

export type DashboardProps = {
  orgId: string | null;
  orgName: string;
  memberCount: number;
  seriesCount: number;
  ongoingCount: number;
};

export function Dashboard({ orgId, orgName, memberCount, seriesCount, ongoingCount }: DashboardProps) {
  const router = useRouter();

  const kpis: KpiItem[] = [
    { label: "전체 멤버", value: memberCount.toLocaleString(), icon: "users", tone: "primary" },
    { label: "운영 시리즈", value: seriesCount.toLocaleString(), icon: "layers", tone: "violet" },
    { label: "진행중 대회", value: ongoingCount.toLocaleString(), icon: "trophy", tone: "ok" },
    { label: "인증 진행률(컨셉)", value: "40%", icon: "shield-check", tone: "warn" },
  ];

  return (
    <div>
      <PageHead
        eyebrow={`단체 콘솔 · ${orgName}`}
        title="대시보드"
        sub="우리 단체의 멤버·대회·인증 현황을 한눈에 확인해요."
        actions={
          <Btn icon="user-plus" onClick={() => router.push("/org-console/members")}>
            멤버 초대
          </Btn>
        }
      />
      <CertBanner orgId={orgId} />
      <KpiGrid items={kpis} />
      <div className="ad-cols">
        <Onboarding />
        <AdListPanel title="최근 활동" badge="컨셉" badgeTone="grey" items={RECENT_CONCEPT} />
      </div>
    </div>
  );
}

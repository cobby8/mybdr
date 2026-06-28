// ============================================================
// (admin-v2)/v2/marketing-console/page.tsx — R2-B 마케팅 콘솔 (BO-5)
//   정본 bo-pages CONSOLE_DEFS.marketingConsole 1:1 (단일 탭 "캠페인").
//   ⚠ 백엔드 0변경 — 리스트 READ 는 서버 컴포넌트 Prisma 단일 매핑(snake→표시값 1곳).
//   레거시 /admin/campaigns 의 데이터 소스(ad_campaigns + partner + placements)를 동일
//   Prisma 직접조회로 재현. 행 상세(캠페인 편집)는 시안 미완 → 미배선(리스트만).
// ============================================================

import { prisma } from "@/lib/db/prisma";
import { SchemaList, type Schema, type SchemaCol, type SchemaRow } from "@/components/admin-v2";

export const dynamic = "force-dynamic";

// 컬럼 정의(정본 bo-data campaigns 1:1) ─────────────────────────────
const CAMPAIGN_COLS: SchemaCol[] = [
  { key: "name", label: "캠페인", w: "minmax(0,2fr)", type: "title" },
  { key: "period", label: "기간", w: "minmax(0,1.4fr)", type: "mono" },
  { key: "ctr", label: "클릭률", w: "92px", align: "center", type: "mono" },
  { key: "status", label: "상태", w: "92px", align: "center", type: "badge" },
  { key: "act", label: "", w: "60px", align: "right", type: "actions" },
];

// 상태 → 표시 라벨/톤 (ad_campaigns.status: draft|pending|approved|rejected|paused|ended)
function campaignStatus(s: string): { badge: string; tone: string } {
  if (s === "approved") return { badge: "진행중", tone: "ok" };
  if (s === "pending" || s === "pending_review") return { badge: "심사중", tone: "warn" };
  if (s === "rejected") return { badge: "반려", tone: "danger" };
  if (s === "paused") return { badge: "일시정지", tone: "grey" };
  if (s === "ended") return { badge: "종료", tone: "grey" };
  if (s === "draft") return { badge: "초안", tone: "grey" };
  return { badge: s, tone: "grey" };
}

// MM.DD (KST 고정) — 서버는 UTC → Asia/Seoul 변환
function md(d: Date): string {
  const p = new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(d);
  const mo = p.find((x) => x.type === "month")?.value ?? "";
  const da = p.find((x) => x.type === "day")?.value ?? "";
  return `${mo}.${da}`;
}

// 게재 기간 표시(정본 "06.01 ~ 06.30" / null이면 "상시")
function fmtPeriod(start: Date | null, end: Date | null): string {
  if (!start && !end) return "상시";
  return `${start ? md(start) : ""} ~ ${end ? md(end) : ""}`;
}

// 클릭률(CTR) — 노출 0이면 "0%"
function ctr(impressions: number, clicks: number): string {
  if (impressions === 0) return "0%";
  return `${((clicks / impressions) * 100).toFixed(1)}%`;
}

export default async function AdminV2MarketingConsole() {
  // ad_campaigns + 파트너명 + 배치 수(정본 placements_count). 백엔드 0변경(SELECT 만).
  const campaigns = await prisma.ad_campaigns.findMany({
    orderBy: { created_at: "desc" },
    take: 50,
    include: {
      partner: { select: { name: true } },
      _count: { select: { placements: true } },
    },
  });

  // ── snake → 표시 도메인 단일 매핑 ──
  const rows: SchemaRow[] = campaigns.map((c) => {
    const { badge, tone } = campaignStatus(c.status);
    return {
      id: c.id.toString(),
      name: c.headline, // 사용자 노출 제목
      sub: `${c.partner?.name ?? "파트너"} · ${c.title}`, // 파트너사 · 내부 제목
      period: fmtPeriod(c.start_date, c.end_date),
      ctr: ctr(c.impressions, c.clicks),
      badge,
      tone,
    };
  });

  const schema: Schema = {
    head: "캠페인 관리",
    sub: "프로모션·배너 캠페인을 운영합니다.",
    addLabel: "캠페인 생성",
    cols: CAMPAIGN_COLS,
    rows,
  };

  return (
    <div>
      {/* 정본 ConsolePage 단일 탭(캠페인) — 탭이 1개라 정적 렌더(항상 활성) */}
      <div className="bo-constabs">
        <button type="button" className="bo-constab" data-on="true">
          캠페인
        </button>
      </div>
      <SchemaList schema={schema} eyebrow="마케팅 콘솔" />
    </div>
  );
}

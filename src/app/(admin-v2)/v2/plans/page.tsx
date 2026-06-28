// ============================================================
// (admin-v2)/v2/plans/page.tsx — R2-B 요금제 리스트 (BO-5)
//   정본 bo-pages plans(SchemaList) 1:1. ⚠ 백엔드 0변경 — 리스트 READ 는
//   서버 컴포넌트 Prisma 단일 매핑(snake→표시값 1곳). 레거시 /admin/plans 와
//   동일 소스(plans + user_subscriptions count). 행 상세(PlanEditor)는 시안 미완
//   → 미배선(리스트만).
// ============================================================

import { prisma } from "@/lib/db/prisma";
import { SchemaList, type Schema, type SchemaCol, type SchemaRow } from "@/components/admin-v2";

export const dynamic = "force-dynamic";

// 컬럼 정의(정본 bo-data plans 1:1) ────────────────────────────────
const PLAN_COLS: SchemaCol[] = [
  { key: "name", label: "요금제", w: "minmax(0,1.8fr)", type: "title" },
  { key: "price", label: "월 요금", w: "120px", align: "right", type: "mono" },
  { key: "subs", label: "가입자", w: "100px", align: "center", type: "mono" },
  { key: "status", label: "상태", w: "92px", align: "center", type: "status" },
  { key: "act", label: "", w: "60px", align: "right", type: "actions" },
];

export default async function AdminV2Plans() {
  // plans + 구독자 수(user_subscriptions count). 백엔드 0변경(SELECT 만).
  const plans = await prisma.plans.findMany({
    orderBy: { created_at: "desc" },
    include: { _count: { select: { user_subscriptions: true } } },
  });

  // ── snake → 표시 도메인 단일 매핑 ──
  const rows: SchemaRow[] = plans.map((p) => ({
    id: p.id.toString(),
    name: p.name,
    sub: p.description ?? "", // 설명
    // 가격: 0원이면 "무료", 아니면 천단위 통일(정본 "₩9,900")
    price: p.price === 0 ? "무료" : `₩${p.price.toLocaleString("ko-KR")}`,
    subs: p._count.user_subscriptions.toLocaleString("ko-KR"), // 구독 건수
    // 상태(status 셀): is_active → 운영중/ok, 아니면 비공개/mute
    st: p.is_active ? "운영중" : "비공개",
    sttone: p.is_active ? "ok" : "mute",
  }));

  const schema: Schema = {
    head: "요금제 관리",
    sub: "구독 요금제와 가입자 현황을 관리합니다.",
    addLabel: "요금제 추가",
    cols: PLAN_COLS,
    rows,
  };

  // 행 상세(PlanEditor)는 시안 미완 → 미배선(onRow/rowHref 없음 = 리스트만).
  return <SchemaList schema={schema} eyebrow="관리자 콘솔" />;
}

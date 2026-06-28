// ============================================================
// (admin-v2)/v2/payments/page.tsx — R2-B 결제 리스트 (BO-5)
//   정본 bo-pages payments(SchemaList) 1:1. ⚠ 백엔드 0변경 — 리스트 READ 는
//   서버 컴포넌트 Prisma 단일 매핑(snake→표시값 1곳). 레거시 /admin/payments 와
//   동일 소스(payments + users). 데이터 0건이면 SchemaList 가 정본 Empty 빈상태 렌더.
//   행 상세(PaymentDetail)는 시안 미완 → 미배선(리스트만).
// ============================================================

import { prisma } from "@/lib/db/prisma";
import { SchemaList, type Schema, type SchemaCol, type SchemaRow } from "@/components/admin-v2";

export const dynamic = "force-dynamic";

// 컬럼 정의(정본 bo-data payments 1:1) ─────────────────────────────
const PAYMENT_COLS: SchemaCol[] = [
  { key: "name", label: "내역", w: "minmax(0,1.8fr)", type: "title" },
  { key: "method", label: "수단", w: "minmax(0,1fr)", type: "muted" },
  { key: "amount", label: "금액", w: "120px", align: "right", type: "mono" },
  { key: "date", label: "일시", w: "minmax(0,1fr)", type: "mono" },
  { key: "status", label: "상태", w: "96px", align: "center", type: "badge" },
  { key: "act", label: "", w: "60px", align: "right", type: "actions" },
];

// 상태 → 표시 라벨/톤 (payments.status: pending|paid|failed|cancelled|refunded|partial_refunded)
function paymentStatus(s: string): { badge: string; tone: string } {
  if (s === "paid") return { badge: "완료", tone: "ok" };
  if (s === "failed") return { badge: "실패", tone: "danger" };
  if (s === "refunded") return { badge: "환불", tone: "grey" };
  if (s === "partial_refunded") return { badge: "부분환불", tone: "warn" };
  if (s === "pending") return { badge: "대기", tone: "warn" };
  if (s === "cancelled") return { badge: "취소", tone: "grey" };
  return { badge: s, tone: "grey" };
}

// 결제 수단 라벨(영문 코드 → 한글, 미매핑은 원문 노출)
const METHOD_LABEL: Record<string, string> = {
  card: "카드",
  transfer: "계좌이체",
  easy_pay: "간편결제",
  virtual_account: "가상계좌",
  mobile: "휴대폰",
};

// MM.DD HH:mm (KST 고정)
function fmtDateTime(d: Date): string {
  const p = new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(d);
  const get = (t: string) => p.find((x) => x.type === t)?.value ?? "";
  return `${get("month")}.${get("day")} ${get("hour")}:${get("minute")}`;
}

export default async function AdminV2Payments() {
  // payments + 결제자(users). 최신순 50건. 백엔드 0변경(SELECT 만).
  const payments = await prisma.payments
    .findMany({
      orderBy: { created_at: "desc" },
      take: 50,
      include: { users: { select: { nickname: true, name: true } } },
    })
    .catch(() => []); // 조회 실패 시 빈 리스트 → 정본 Empty 빈상태

  // ── snake → 표시 도메인 단일 매핑 ──
  const rows: SchemaRow[] = payments.map((p) => {
    const { badge, tone } = paymentStatus(p.status);
    return {
      id: p.id.toString(),
      name: p.description || p.payable_type || "결제", // 내역(설명 우선)
      sub: p.users?.nickname || p.users?.name || "-", // 결제자
      method: p.payment_method ? METHOD_LABEL[p.payment_method] ?? p.payment_method : "-",
      amount: `₩${Number(p.final_amount).toLocaleString("ko-KR")}`,
      date: fmtDateTime(p.created_at),
      badge,
      tone,
    };
  });

  const schema: Schema = {
    head: "결제 관리",
    sub: "참가비·예약 결제와 환불을 처리합니다.",
    cols: PAYMENT_COLS,
    rows,
  };

  // 행 상세(PaymentDetail)는 시안 미완 → 미배선(onRow/rowHref 없음 = 리스트만).
  return <SchemaList schema={schema} eyebrow="관리자 콘솔" />;
}

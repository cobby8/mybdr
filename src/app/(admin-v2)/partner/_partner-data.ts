// ============================================================
// partner/_partner-data.ts — 협력업체 콘솔 서버 데이터 헬퍼 (R6-A)
//   - getPartnerContext: 세션 → partner_members(is_active) 로 파트너 스코프 확정.
//     · partnerId  = 캠페인(ad_campaigns) 스코프 키
//     · ownerId    = 내 시설(court_infos.user_id == partners.owner_id) 스코프 키
//   - 표시 헬퍼(snake DB 값 → 표시 도메인 단일 매핑 · snake 함정 차단).
//   ★백엔드/DB/Prisma 0변경 — READ/집계용 select 만. 레거시 0 import.
// ============================================================

import { getWebSession } from "@/lib/auth/web-session";
import { isSuperAdmin } from "@/lib/auth/is-super-admin";
import { prisma } from "@/lib/db/prisma";

export type PartnerContext = {
  userId: bigint;
  partnerId: bigint | null; // 소속 파트너(ad_campaigns 스코프). super 무소속 = null
  ownerId: bigint | null; // 파트너 owner(court_infos.user_id 스코프). super 무소속 = null
  partnerName: string;
  role: string | null; // owner | admin | member
  isSuper: boolean;
};

// 세션 → 파트너 컨텍스트. 미로그인/미소속(비-super)은 호출부(layout)에서 차단.
//   - 소속 멤버: 실 partner_id/owner_id 스코프.
//   - super 무소속: 진입 허용하되 스코프 null → 빈상태(보고).
export async function getPartnerContext(): Promise<PartnerContext | null> {
  const session = await getWebSession();
  if (!session) return null;

  const userId = BigInt(session.sub);
  const isSuper = isSuperAdmin(session);

  // 활성 파트너 멤버십(없으면 null) — partner 의 owner_id/name 동시 적재.
  const membership = await prisma.partner_members.findFirst({
    where: { user_id: userId, is_active: true },
    select: {
      partner_id: true,
      role: true,
      partner: { select: { name: true, owner_id: true } },
    },
  });

  if (membership) {
    return {
      userId,
      partnerId: membership.partner_id,
      ownerId: membership.partner.owner_id,
      partnerName: membership.partner.name,
      role: membership.role,
      isSuper,
    };
  }

  // 소속 없음 — super 만 빈 컨텍스트로 진입(일반 사용자는 layout 에서 redirect).
  return {
    userId,
    partnerId: null,
    ownerId: null,
    partnerName: "협력업체",
    role: null,
    isSuper,
  };
}

// ── 표시 헬퍼(서버 단일 매핑) ────────────────────────────────────────

export type Tone = "ok" | "primary" | "warn" | "grey" | "danger";

// 아바타/로고 색 팔레트(데이터 주입용 — 컴포넌트 하드코딩 아님)
export const AV = [
  "#3182F6",
  "#15B86A",
  "#6D5AE6",
  "#FF9500",
  "#F04452",
  "#00B8D9",
  "#E0457B",
  "#8B5CF6",
];
export function avColor(i: number): string {
  return AV[((i % AV.length) + AV.length) % AV.length];
}

// KST 날짜 "2026.06.15" (서버=UTC → Asia/Seoul). 없으면 "—".
export function fmtDate(d: Date | null | undefined): string {
  if (!d) return "—";
  return d
    .toLocaleDateString("ko-KR", {
      timeZone: "Asia/Seoul",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
    .replace(/\.\s/g, ".")
    .replace(/\.$/, "");
}

// 캠페인 게재 기간 "06.01–07.31" / 한쪽만 있으면 그쪽만 / 둘 다 없으면 "상시".
export function fmtPeriod(
  start: Date | null | undefined,
  end: Date | null | undefined
): string {
  const md = (d: Date) =>
    d
      .toLocaleDateString("ko-KR", {
        timeZone: "Asia/Seoul",
        month: "2-digit",
        day: "2-digit",
      })
      .replace(/\.\s?/g, ".")
      .replace(/\.$/, "");
  if (start && end) return `${md(start)}–${md(end)}`;
  if (start) return `${md(start)}–`;
  if (end) return `–${md(end)}`;
  return "상시";
}

// 캠페인 status → 표시 라벨/톤(정본 배지). 과금 무관 — 운영 상태만.
export function campaignStatus(s: string | null | undefined): {
  label: string;
  tone: Tone;
} {
  switch (s) {
    case "approved":
      return { label: "게재중", tone: "ok" };
    case "pending_review":
      return { label: "검토중", tone: "warn" };
    case "rejected":
      return { label: "반려", tone: "danger" };
    case "paused":
      return { label: "일시중지", tone: "grey" };
    case "ended":
      return { label: "종료", tone: "grey" };
    case "draft":
      return { label: "초안", tone: "grey" };
    default:
      return { label: s || "초안", tone: "grey" };
  }
}

// 노출 영역(placement) 코드 → 한글 라벨(정본 노출 영역).
export function placementLabel(p: string): string {
  switch (p) {
    case "feed":
      return "피드";
    case "sidebar":
      return "사이드바";
    case "court_top":
      return "코트 상단";
    case "list":
      return "목록";
    default:
      return p;
  }
}

// 코트 유형 → 라벨/배지 톤(Badge 허용 톤 = primary/ok/warn/danger/grey).
export function courtTypeBadge(t: string | null | undefined): {
  label: string;
  tone: Tone;
} {
  if (t === "indoor") return { label: "실내", tone: "primary" };
  if (t === "outdoor") return { label: "야외", tone: "ok" };
  return { label: t || "기타", tone: "grey" };
}

// 코트 운영 상태 → ad-dot 라벨/톤(status 셀).
export function courtStatus(s: string | null | undefined): {
  st: string;
  sttone: string;
} {
  if (s === "active") return { st: "운영중", sttone: "ok" };
  if (s === "inactive" || s === "closed")
    return { st: "점검중", sttone: "warn" };
  return { st: s || "운영중", sttone: "ok" };
}

// operating_hours(jsonb) → 짧은 표시. 객체면 첫 요일 범위/대표값, 없으면 "—".
//   jsonb 는 verbatim 참조만(재귀 변환 0 · F-2b 함정 회피).
export function fmtOperatingHours(j: unknown): string {
  if (!j || typeof j !== "object" || Array.isArray(j)) return "—";
  const obj = j as Record<string, unknown>;
  const vals = Object.values(obj).filter(
    (v): v is string => typeof v === "string" && v.length > 0
  );
  if (vals.length === 0) return "—";
  // 모든 요일 동일 시간이면 1개로, 아니면 첫 값 + "외"
  const uniq = Array.from(new Set(vals));
  return uniq.length === 1 ? uniq[0] : `${vals[0]} 외`;
}

// 숫자 천단위 콤마. 0 도 "0" 으로 정직 표기(빈상태).
export function n(v: number | null | undefined): string {
  return (v ?? 0).toLocaleString();
}

// ── 정산(PartnerSettlement) 표시 매핑 ────────────────────────────────

// 원 단위 정수 → "₩4,620,000". null/0 정직 표기(금액 셀).
export function won(amount: number | null | undefined): string {
  return "₩" + (amount ?? 0).toLocaleString();
}

// 정산월 "2026년 6월"(정본 PT_SETTLE month 셀). 연/월 정수 → 한글 표기.
export function periodLabel(year: number, month: number): string {
  return `${year}년 ${month}월`;
}

// 정산 status → 라벨/톤(badge 셀). DB status = pending/paid/cancelled.
//   정본 PT_SETTLE 배지("입금 예정" amber / "입금 완료" ok) 매핑.
export function settlementStatusBadge(s: string | null | undefined): {
  label: string;
  tone: Tone;
} {
  switch (s) {
    case "paid":
      return { label: "입금 완료", tone: "ok" };
    case "pending":
      return { label: "입금 예정", tone: "warn" };
    case "cancelled":
      return { label: "취소", tone: "grey" };
    default:
      return { label: s || "입금 예정", tone: "grey" };
  }
}

// CTR(%) — 노출 0 이면 "0.0%" (분모 0 방어).
export function ctrPct(impressions: number, clicks: number): string {
  if (!impressions) return "0.0%";
  return `${((clicks / impressions) * 100).toFixed(1)}%`;
}

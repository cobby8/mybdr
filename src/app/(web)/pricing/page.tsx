/* ============================================================
 * /pricing — 요금제 페이지 (서버 wrapper)
 *
 * 왜 서버 컴포넌트로 유지:
 * - SEO metadata export 보존 (next/metadata 는 서버 컴포넌트에서만 가능).
 * - revalidate 캐시 정책 보존.
 * - plans 실 데이터(prisma) + 본인 현재 구독(getWebSession)을 서버에서 조회 →
 *   클라(pricing-content)로 전달. (Phase 6.2C-2 — mock 0 실 데이터 박제)
 *
 * 어떻게:
 * - prisma.plans.findMany({ is_active: true }) — 운영 plans 4종(feature_key 기반) 실 조회.
 * - 본인 활성 구독은 user_subscriptions 에서 조회해 "이용 중인 플랜" 표시에 사용.
 *   (session 없으면 구독 0 — 비로그인도 카드 열람 가능.)
 * - UI 본체는 `_v2/pricing-content.tsx` 가 담당 (카드 grid + CTA Link).
 *
 * 설계 메모 (Phase 6.2C-2 — 시안 BU1 박제):
 * - 시안 BU1 은 tier 3종(무료/BDR+/PRO) + 비교표 + 월간/연간 토글이지만,
 *   운영 plans 는 feature_key 4종(팀 생성권/픽업게임/체육관 대관/대회 생성)으로
 *   tier 개념이 없음 → 비교표·토글은 운영 데이터에 매핑 불가하여 제거 (PM 승인).
 * - 카드 CTA → /pricing/checkout?planId={id} 실연결 (기존 checkout flow 그대로).
 * ============================================================ */

import type { Metadata } from "next";

import { prisma } from "@/lib/db/prisma";
import { getWebSession } from "@/lib/auth/web-session";

import { PricingContent, type PricingPlan } from "./_v2/pricing-content";

// SEO: 요금제 페이지 메타데이터 (기존 보존)
export const metadata: Metadata = {
  title: "요금제 | MyBDR",
  description:
    "MyBDR 멤버십 요금제를 비교하고 나에게 맞는 플랜을 선택하세요.",
};

// ISR 캐시 (기존 값 보존). plans 조회에 적용 — 가격/플랜 변경은 5분 내 반영.
export const revalidate = 300;

export default async function PricingPage() {
  // 1) plans 실 데이터 — 활성 플랜만, 가격 오름차순 (mock 0)
  const plans = await prisma.plans
    .findMany({
      where: { is_active: true },
      orderBy: { price: "asc" },
      select: {
        id: true,
        name: true,
        description: true,
        plan_type: true,
        feature_key: true,
        price: true,
      },
    })
    .catch(() => []);

  // 2) 본인 활성 구독 — session 있을 때만. "이용 중인 플랜" 표시에 사용.
  //    비로그인(session null)이면 빈 Set → 모든 카드가 결제 진입 가능 상태로 노출.
  const session = await getWebSession();
  const myPlanIds = new Set<string>();
  if (session) {
    const subs = await prisma.user_subscriptions
      .findMany({
        where: { user_id: BigInt(session.sub), status: "active" },
        select: { plan_id: true },
      })
      .catch(() => []);
    for (const s of subs) myPlanIds.add(s.plan_id.toString());
  }

  // 3) BigInt → string 직렬화 (클라 컴포넌트 전달용)
  const plansForClient: PricingPlan[] = plans.map((p) => ({
    id: p.id.toString(),
    name: p.name,
    description: p.description ?? "",
    planType: p.plan_type,
    featureKey: p.feature_key,
    price: p.price,
    current: myPlanIds.has(p.id.toString()),
  }));

  return <PricingContent plans={plansForClient} />;
}

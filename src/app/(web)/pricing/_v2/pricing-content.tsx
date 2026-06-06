/* ============================================================
 * PricingContent — /pricing 본체 (BDR v2.25 BU1 시안 박제 · Phase 6.2C-2)
 *
 * 왜 서버 프레젠테이션 컴포넌트(use client 제거):
 * - 기존 월간/연간 useState 토글을 제거(운영 plans 는 tier·연간 가격 개념 없음)했으므로
 *   클라 인터랙션이 더 이상 없음. CTA 는 next/link <Link> 로 라우팅만 → 서버 컴포넌트로 충분.
 * - 데이터는 상위 page.tsx(서버)가 prisma 로 조회해 props 로 전달 (mock 0).
 *
 * 어떻게:
 * - plans 카드 grid 렌더 (반응형: 모바일 1열 / md+ 자동 채움).
 * - 각 카드: name / description / 가격(천 단위 + plan_type 라벨) / CTA.
 * - CTA = /pricing/checkout?planId={id} 실연결 (기존 checkout flow 그대로).
 *   본인 구독 중(current=true)이면 비활성 "이용 중인 플랜".
 *
 * 시안 대비 변경 (PM 승인):
 * - 시안 BU1 의 비교표(tier 8행)·월간/연간 토글 제거 → 운영 plans(feature_key 4종)는
 *   tier·연간 가격 컬럼이 없어 매핑 불가. mock 0 원칙으로 운영 데이터만 렌더.
 * - features 다중 목록 제거 → 운영 plans 는 description 단일 컬럼만 보유.
 * ============================================================ */

import Link from "next/link";

// page.tsx(서버)에서 직렬화해 넘기는 플랜 타입. BigInt → string.
export type PricingPlan = {
  id: string;
  name: string;
  description: string;
  // plan_type: "monthly" | "one_time" — 라벨 분기에 사용
  planType: string;
  featureKey: string;
  price: number;
  // 본인이 현재 구독 중인 플랜인지 (user_subscriptions status=active)
  current: boolean;
};

// 가격 표기 — 천 단위 구분 (시안 wonRaw 톤: ₩ 접두). 0원은 "무료".
function formatPrice(price: number): string {
  if (price === 0) return "무료";
  return "₩" + price.toLocaleString("ko-KR");
}

// plan_type → 한국어 라벨 (시안 PLAN_TYPE_LABEL)
function planTypeLabel(type: string): string {
  return type === "monthly" ? "/ 월" : "/ 회";
}

export function PricingContent({ plans }: { plans: PricingPlan[] }) {
  return (
    <div className="page">
      {/* 헤더 영역 — 시안 BU1 hero band 톤 (제목 + 안내) */}
      <div
        style={{
          textAlign: "center",
          marginBottom: 36,
          maxWidth: 720,
          margin: "0 auto 36px",
        }}
      >
        <div className="eyebrow" style={{ justifyContent: "center" }}>
          요금제 · PRICING
        </div>
        <h1
          style={{
            margin: "10px 0 10px",
            fontSize: 36,
            fontWeight: 800,
            letterSpacing: "-0.02em",
          }}
        >
          MyBDR <span style={{ color: "var(--accent)" }}>멤버십</span>
        </h1>
        <p
          style={{
            margin: 0,
            color: "var(--ink-mute)",
            fontSize: 15,
            lineHeight: 1.6,
          }}
        >
          전국 농구 매칭을 더 깊게. 팀 운영부터 대회 개최까지, 나에게 맞는
          플랜을 선택하세요.
        </p>
      </div>

      {/* 플랜 카드 grid — plans 실 데이터 (mock 0)
       * 반응형: 모바일 1열 / md+ 3열. plans 개수 무관하게 안정적 정렬. */}
      {plans.length === 0 ? (
        // 데이터 부족 시 hide 불가 → 안내 문구 (mock 카드 생성 금지)
        <div
          className="card"
          style={{
            maxWidth: 520,
            margin: "0 auto",
            padding: "28px 26px",
            textAlign: "center",
            color: "var(--ink-mute)",
          }}
        >
          현재 이용 가능한 요금제가 없습니다.
        </div>
      ) : (
        <div
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
          style={{ maxWidth: 1080, margin: "0 auto" }}
        >
          {plans.map((p) => (
            <div
              key={p.id}
              className="card"
              style={{
                padding: "28px 26px 26px",
                position: "relative",
                display: "flex",
                flexDirection: "column",
                // 본인 구독 중인 카드는 accent 테두리로 강조 (시안 current 톤)
                border: p.current ? "2px solid var(--accent)" : undefined,
              }}
            >
              {p.current && (
                <div
                  style={{
                    position: "absolute",
                    top: -11,
                    left: "50%",
                    transform: "translateX(-50%)",
                    background: "var(--accent)",
                    color: "#fff",
                    padding: "4px 12px",
                    fontSize: 11,
                    fontWeight: 800,
                    letterSpacing: ".08em",
                    borderRadius: 99,
                    whiteSpace: "nowrap",
                  }}
                >
                  현재 구독 중
                </div>
              )}

              {/* 플랜명 */}
              <div
                style={{
                  fontFamily: "var(--ff-display)",
                  fontWeight: 900,
                  fontSize: 20,
                  letterSpacing: ".02em",
                  color: p.current ? "var(--accent)" : "var(--ink)",
                }}
              >
                {p.name}
              </div>

              {/* 설명 (운영 plans description 단일 컬럼) */}
              <div
                style={{
                  fontSize: 13,
                  color: "var(--ink-mute)",
                  marginTop: 6,
                  marginBottom: 18,
                  minHeight: 36,
                  lineHeight: 1.5,
                }}
              >
                {p.description}
              </div>

              {/* 가격 (천 단위 + plan_type 라벨) */}
              <div
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  gap: 6,
                  marginBottom: 20,
                }}
              >
                <span
                  style={{
                    fontFamily: "var(--ff-display)",
                    fontSize: 36,
                    fontWeight: 900,
                    letterSpacing: "-0.02em",
                  }}
                >
                  {formatPrice(p.price)}
                </span>
                {p.price > 0 && (
                  <span style={{ fontSize: 13, color: "var(--ink-dim)" }}>
                    {planTypeLabel(p.planType)}
                  </span>
                )}
              </div>

              {/* CTA — 실연결 /pricing/checkout?planId={id}
               * 본인 구독 중이면 비활성 버튼, 아니면 결제 진입 Link.
               * (margin-top: auto 로 카드 하단 정렬 — 설명 길이 달라도 버튼 라인 맞춤) */}
              {p.current ? (
                <button
                  type="button"
                  className="btn btn--xl"
                  disabled
                  style={{ marginTop: "auto" }}
                >
                  이용 중인 플랜
                </button>
              ) : (
                <Link
                  href={`/pricing/checkout?planId=${p.id}`}
                  className="btn btn--accent btn--xl"
                  style={{
                    marginTop: "auto",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    textDecoration: "none",
                  }}
                >
                  {p.name} 선택
                </Link>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 안내 푸터 — 시안 BU1 비교표 하단 안내 문구 톤 */}
      <div
        style={{
          textAlign: "center",
          marginTop: 50,
          fontSize: 13,
          color: "var(--ink-mute)",
          maxWidth: 720,
          marginLeft: "auto",
          marginRight: "auto",
          lineHeight: 1.6,
        }}
      >
        플랜은 언제든 변경·해지할 수 있으며, 결제는 토스페이먼츠를 통해 안전하게
        처리됩니다. 결제 문의 ·{" "}
        <a href="mailto:bdr.wonyoung@gmail.com">bdr.wonyoung@gmail.com</a>
      </div>
    </div>
  );
}

/* /pricing — 로딩 스켈레톤 (DS v4 교체 — PR-PUB-1-8)
 *
 * 이유: 구버전 Skeleton(@/components/ui/skeleton) + 구토큰 전량 제거.
 *   제거 목록:
 *     --color-border      → var(--border) 기반 인라인
 *     rounded-[20px]      → .card 클래스 (radius-card 8px)
 *     bg-white            → .card 배경 처리
 *     rounded-full (pill) → borderRadius: 4 (13룰 12번 pill 9999px 금지)
 *     space-y-* / p-6 등  → inline style
 *   Skeleton 컴포넌트 제거 → DS v4 인라인 스켈레톤 (pulse animation + var(--border))
 *   720px 분기: grid-cols-1(모바일) / 3열(md+) — pricing-content.tsx 동일 패턴.
 */
export default function PricingLoading() {
  return (
    <div className="page">
      {/* 헤더 영역 스켈레톤 */}
      <div style={{ textAlign: "center", maxWidth: 720, margin: "0 auto 36px" }}>
        {/* eyebrow 스켈 */}
        <div
          className="pu-skel"
          style={{
            height: 14,
            width: 140,
            background: "var(--border)",
            borderRadius: 4,
            margin: "0 auto 14px",
          }}
        />
        {/* h1 스켈 */}
        <div
          className="pu-skel"
          style={{
            height: 38,
            width: 320,
            background: "var(--border)",
            borderRadius: 4,
            margin: "0 auto 12px",
          }}
        />
        {/* 부제 스켈 */}
        <div
          className="pu-skel"
          style={{
            height: 15,
            width: 440,
            background: "var(--border)",
            borderRadius: 4,
            margin: "0 auto",
          }}
        />
      </div>

      {/* 플랜 카드 그리드 스켈레톤 — 모바일 1열 / md+ 3열 */}
      <div
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
        style={{ maxWidth: 1080, margin: "0 auto" }}
      >
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="card"
            style={{
              padding: "28px 26px 26px",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* 플랜명 스켈 */}
            <div
              className="pu-skel"
              style={{
                height: 20,
                width: 100,
                background: "var(--border)",
                borderRadius: 4,
                marginBottom: 10,
              }}
            />
            {/* 설명 줄 1 */}
            <div
              className="pu-skel"
              style={{
                height: 13,
                width: "80%",
                background: "var(--border)",
                borderRadius: 4,
                marginBottom: 6,
              }}
            />
            {/* 설명 줄 2 */}
            <div
              className="pu-skel"
              style={{
                height: 13,
                width: "60%",
                background: "var(--border)",
                borderRadius: 4,
                marginBottom: 18,
              }}
            />
            {/* 가격 스켈 */}
            <div
              className="pu-skel"
              style={{
                height: 36,
                width: 120,
                background: "var(--border)",
                borderRadius: 4,
                marginBottom: 20,
              }}
            />
            {/* CTA 버튼 스켈 — 44px 터치 타겟 */}
            <div
              className="pu-skel"
              style={{
                height: 44,
                background: "var(--border)",
                borderRadius: 4,
                marginTop: "auto",
              }}
            />
          </div>
        ))}
      </div>

      <style>{`
        .pu-skel { animation: pu-pulse 1.4s ease-in-out infinite; }
        @keyframes pu-pulse { 0%,100%{opacity:1} 50%{opacity:.35} }
      `}</style>
    </div>
  );
}

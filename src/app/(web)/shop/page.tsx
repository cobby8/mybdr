/* ============================================================
 * /shop — BDR 샵 (Shop) v2.31 시안 박제 — SH1
 *
 * 이유(왜):
 *   기존 PRODUCTS 12건·cart useState·이모지(🛒♡★🚚↩️✅💳)는 전량
 *   더미였고(DB products/cart/wishlist 모델 0), 운영 미연결 확정.
 *   → mock 박제 금지, 준비중 빈상태가 정답.
 *
 * 구조 결정:
 *   시안 Hero(시즌 배너)는 정적 마케팅이라 보존하되 하드코딩 색상을
 *   토큰화(#DC2626·#7F1D1D → var(--accent)·var(--accent-deep)).
 *   상품 그리드·cart·이모지는 전량 삭제하고 ex-empty "샵 오픈 준비 중"
 *   으로 대체. 인터랙션(cart) 제거 → "use client" 제거, server 단순화.
 *
 * 시안 출처: Dev/design/BDR-current/screens/Shop.jsx (+ extras-pages.css .sh-*)
 *
 * 원칙: API/Prisma/서비스 0 변경 / 데이터 0 / mock 0 / 이모지 0(Material
 *       Symbols) / pill 9999 제거 / 토큰 var(--*) 만 / 라우트 /shop 불변.
 * AppNav active: pathname 자동 판정(/shop → more)
 * ============================================================ */

import Link from "next/link";

export default function ShopPage() {
  // 공개 정적 셸 — Hero(정적) + 빈상태. 인터랙션 0.
  return (
    <div className="page">
      <div className="page__inner page__inner--wide ex-page-w">
        {/* 브레드크럼 */}
        <div className="ex-crumb">
          <Link href="/">홈</Link>
          <span className="sep">›</span>
          <span className="cur">BDR 샵</span>
        </div>

        {/* Hero — accent → accent-deep → bdr-navy 그라디언트(토큰화). 데코 원 2개 */}
        <div className="sh-hero">
          <div className="sh-hero__deco sh-hero__deco--lg" />
          <div className="sh-hero__deco sh-hero__deco--sm" />
          <div className="sh-hero__inner">
            <div className="sh-hero__eyebrow">BDR SHOP · 2026 SPRING</div>
            <h1 className="sh-hero__title">코트 위 모든 것</h1>
            <p className="sh-hero__lead">
              공인구부터 슈즈, BDR 한정 굿즈까지. 멤버 전용 할인가로 만나보세요.
            </p>
          </div>
        </div>

        {/* 빈상태 — 샵 오픈 준비 중. mock 상품 그리드·cart 금지 */}
        <div className="card">
          <div className="ex-empty">
            <span className="ico material-symbols-outlined">storefront</span>
            <div className="ex-empty__t">샵 오픈 준비 중</div>
            <div className="ex-empty__d">공인구·슈즈·BDR 굿즈를 만나볼 수 있는 샵을 준비하고 있습니다. 곧 오픈합니다.</div>
          </div>
        </div>
      </div>
    </div>
  );
}

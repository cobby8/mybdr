/* ============================================================
 * /gallery — 갤러리 (Gallery) v2.31 시안 박제 — GL1
 *
 * 이유(왜):
 *   기존 ITEMS 12건·lightbox·가짜 SVG 코트라인·이모지(▶📷♥👁🔗🚩)는
 *   전량 더미였고, 운영 실측 결과 news_photo 1건(is_hero 0)·앨범 테이블
 *   0 으로 사실상 비어있음. → mock 박제 금지, 준비중 빈상태가 정답.
 *
 * 구조 결정:
 *   시안 셸(ex-head + 업로드 버튼)은 유지하되 앨범/그리드 mock·lightbox·
 *   SVG·이모지는 전량 삭제하고 ex-empty "갤러리 준비 중" 으로 대체.
 *   인터랙션(lightbox useState) 제거 → "use client" 제거, server 단순화.
 *
 * 시안 출처: Dev/design/BDR-current/screens/Gallery.jsx (+ extras-pages.css .gl-*)
 *
 * 원칙: API/Prisma/서비스 0 변경 / 데이터 0 / mock 0 / 이모지 0(Material
 *       Symbols) / 토큰 var(--*) 만 / 라우트 /gallery 불변.
 * AppNav active: pathname 자동 판정(/gallery → more)
 * ============================================================ */

import Link from "next/link";

export default function GalleryPage() {
  // 공개 정적 셸 — 빈상태이므로 인터랙션 0.
  return (
    <div className="page">
      <div className="page__inner page__inner--wide ex-page-w">
        {/* 브레드크럼 */}
        <div className="ex-crumb">
          <Link href="/">홈</Link>
          <span className="sep">›</span>
          <span className="cur">갤러리</span>
        </div>

        {/* 헤더 — eyebrow + h1 + 설명 + 업로드 버튼(UI만) */}
        <div className="ex-head">
          <div>
            <div className="eyebrow">갤러리 · GALLERY</div>
            <h1 className="ex-head__title">코트의 명장면</h1>
            <p className="ex-head__sub">
              전국 대회와 경기의 순간들을 모았습니다. 앨범을 열어 더 많은 사진을 확인하세요.
            </p>
          </div>
          <div className="ex-head__actions">
            {/* 사진 업로드 — DB 미지원, UI 셸만(동작 미구현) */}
            <button className="btn" type="button">
              <span className="ico material-symbols-outlined">upload</span>사진 업로드
            </button>
          </div>
        </div>

        {/* 빈상태 — 갤러리 준비 중. mock 앨범/그리드·lightbox 금지 */}
        <div className="card">
          <div className="ex-empty">
            <span className="ico material-symbols-outlined">photo_library</span>
            <div className="ex-empty__t">갤러리 준비 중</div>
            <div className="ex-empty__d">대회와 경기의 명장면을 모은 갤러리를 준비하고 있습니다. 곧 공개됩니다.</div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * PrintButton — Phase 6 (2026-05-12).
 *
 * 왜 (이유):
 *   FIBA 양식 = A4 세로 1 페이지 종이 기록지. 운영자가 경기 종료 후 "인쇄" 버튼 1번 클릭
 *   으로 시안 그대로 종이 PDF 저장 / 출력 가능해야 함. 의존성 0 (`window.print()` 만).
 *
 * 방법 (어떻게):
 *   - 클라이언트 컴포넌트 (use client) — onClick = window.print()
 *   - minimal layout 의 toolbar 좌측 ("← 매치 관리로" 옆) 에 배치
 *   - `no-print` 클래스 = 인쇄 시 자기 자신 숨김 (_print.css)
 *   - Material Symbols `print` 아이콘 + "인쇄" 텍스트 (작게 — toolbar 비율 정합)
 *
 * 절대 룰:
 *   - var(--*) 토큰만 / lucide-react ❌ / Material Symbols Outlined 만
 *   - 빨강 본문 텍스트 ❌
 *   - 터치 영역 36px+ (toolbar 영역 — toolbar 가 컴팩트 thin bar 이므로 정합)
 */

"use client";

export function PrintButton() {
  // 브라우저 native 인쇄 다이얼로그 호출. PDF 저장 또는 종이 출력 둘 다 지원.
  // SSR 안전 — onClick 이므로 client 진입 후만 실행 (window 접근 시점 보장)
  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  return (
    <button
      type="button"
      onClick={handlePrint}
      // no-print = _print.css 에서 인쇄 시 제거
      className="no-print flex items-center gap-1 px-2 py-1 text-xs hover:underline"
      style={{
        color: "var(--color-text-muted)",
        touchAction: "manipulation",
      }}
      aria-label="FIBA 양식 인쇄 / PDF 저장"
      title="인쇄 / PDF 저장"
    >
      {/* Material Symbols print 아이콘 — 18px (toolbar 비율 정합) */}
      <span
        className="material-symbols-outlined"
        style={{ fontSize: 16 }}
        aria-hidden
      >
        print
      </span>
      인쇄
    </button>
  );
}

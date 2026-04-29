/* ============================================================
 * StatsStrip — BDR v2 4열 통계 카드 스트립
 *
 * 왜 이 컴포넌트가 있는가:
 * v2 Home.jsx 시안에서 Promo 배너 바로 아래에 위치하는 4열 통계 행.
 * "전체 회원 / 지금 접속 / 오늘의 글 / 진행중 대회" 형태로 간결히
 * 숫자를 강조하는 섹션을 props 기반 재사용 컴포넌트로 추출.
 *
 * globals.css의 `.card` 클래스(라이트 흰 카드/다크 brutalist 박스)를
 * 그대로 사용. 디스플레이 폰트(var(--ff-display))로 숫자를 크게 표시.
 * 서버 컴포넌트 — 동적 인터랙션 없음.
 * ============================================================ */

/** 한 개의 통계 항목 */
export interface StatItem {
  /** 상단 라벨 (대문자화되어 렌더) */
  label: string;
  /** 표시할 값 — 숫자 또는 문자열(예: "-" placeholder) */
  value: string | number;
}

export interface StatsStripProps {
  /** 스트립에 표시할 통계 항목 배열 (보통 4개) */
  items: StatItem[];
}

/**
 * 통계 카드 스트립 — 모바일 대응 자동 그리드.
 *
 * [2026-04-29 모바일 가로 overflow 픽스]
 * 기존: `repeat(${items.length}, 1fr)` → items 4개일 때 366px 모바일에서 4열 강제 →
 *       각 카드 ~75px로 좁아져 한국어 라벨이 세로 줄바꿈("지/금/접/속") + 가로 overflow 발생
 * 변경: `repeat(auto-fit, minmax(140px, 1fr))` — 컨테이너 폭에 맞춰 자동으로 열 수 결정.
 *       데스크톱은 4열 / 태블릿은 3~4열 / 모바일(<320~580px)은 2열 / 매우 좁으면 1열.
 *       items.length 에 관계없이 안전 (가변 개수 대응).
 */
export function StatsStrip({ items }: StatsStripProps) {
  return (
    // 자동 그리드 — minmax(140px, 1fr) 로 컬럼 최소폭 보장 + 부모 폭 안에서 자동 줄바꿈
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
        gap: 12,
        marginBottom: 24,
      }}
    >
      {items.map((item) => (
        // .card = v2 공통 카드 스타일 (라이트: 흰 + radius / 다크: brutalist)
        <div key={item.label} className="card" style={{ padding: "16px 18px" }}>
          {/* 상단 eyebrow 라벨 — 작고 대문자, dim 톤 */}
          <div
            style={{
              fontSize: 11,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "var(--ink-dim)",
              fontWeight: 700,
            }}
          >
            {item.label}
          </div>
          {/* 큰 숫자 — 디스플레이 폰트로 28px */}
          <div
            style={{
              fontFamily: "var(--ff-display)",
              fontSize: 28,
              fontWeight: 800,
              marginTop: 4,
              letterSpacing: "-0.01em",
            }}
          >
            {/* 숫자는 자동으로 천단위 구분자 포맷, 문자열은 그대로 */}
            {typeof item.value === "number"
              ? item.value.toLocaleString()
              : item.value}
          </div>
        </div>
      ))}
    </div>
  );
}

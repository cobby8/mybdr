/* ============================================================
 * LiveChipRow — BG7 라이브 띠 (Phase 2C · UC2/UA1/UA5 공용)
 *
 * 시안: Dev/design/BDR-current/game-shared.jsx 의 window.LiveChipRow
 * 용도: 진행 중인 라이브 경기(대회 매치)를 Hero 카로셀 위 sticky 띠로 노출.
 *       chip 클릭 시 /live/[id] 진입.
 *
 * 데이터 출처 = tournamentMatch (status in ["live","in_progress"]).
 *   - "Q3 14-10" 같은 라이브 스코어 / 팀 vs 팀 / 대회 round 는
 *     라이브 스코어 추적이 있는 tournamentMatch 에만 존재 (픽업 games 엔 없음).
 *   - HomePage server component 가 조회 후 LiveChipItem[] 로 매핑해 전달.
 *
 * 0건이면 null 반환 → 띠 전체 hidden (mock/가짜 chip 금지 — 사용자 결재 2026-05-29).
 * 1~4건 = chip row / 5건+ = 가로 스크롤 (overflowX auto 가 자연 처리).
 * 깜박임 = globals.css 기존 .live-air-dot 클래스 재사용 (새 CSS 추가 0).
 * 색상 = 운영 토큰 변수만 (--danger=라이브 빨강 / --radius-* 라운딩) / 하드코딩 hex·rgba 금지.
 *   (시안 game-shared.jsx 의 --err/--r-xs 는 시안 전용 토큰 → 운영 --danger/--radius-chip 매핑)
 * ============================================================ */

import Link from "next/link";

// 라이브 chip 1건 — 시안 LIVE_NOW 항목 형태를 운영 tournamentMatch 매핑에 맞춤
export interface LiveChipItem {
  /** tournamentMatch.id — /live/[id] 진입 키 */
  id: number;
  /** "강남BC vs 마포FC" — 양팀 이름 결합 */
  title: string;
  /** "Q3 14-10" 또는 "14-10" — 라이브 스코어 라벨 */
  label: string;
  /** 대회명 + round (예: "강남구협회장배 봄 · 결승") — 없으면 빈 문자열 */
  meta: string;
}

export function LiveChipRow({ items }: { items: LiveChipItem[] }) {
  // 0건이면 띠 전체 hide — 가짜 데이터 절대 노출 안 함
  if (!items || items.length === 0) return null;

  return (
    // sticky 띠 — AppNav 바로 아래 고정. 가로 스크롤 컨테이너.
    <div
      style={{
        position: "sticky",
        top: 0,
        zIndex: 20,
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "8px 12px",
        // 라이브 강조 배경 — err 토큰 8% (라이트/다크 모두 대응)
        background: "color-mix(in srgb, var(--danger) 8%, var(--bg-elev))",
        borderBottom: "1px solid var(--border)",
      }}
    >
      {/* 좌측 고정 "🔴 LIVE N" 라벨 (스크롤되지 않음) */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          flexShrink: 0,
          fontFamily: "var(--ff-mono)",
          fontWeight: 800,
          fontSize: 12,
          letterSpacing: "0.06em",
          color: "var(--danger)",
        }}
      >
        {/* 깜박이는 빨간 점 — globals.css .live-air-dot 애니메이션 재사용 */}
        <span
          className="live-air-dot"
          style={{
            display: "inline-block",
            width: 8,
            height: 8,
            borderRadius: "50%", // 정사각형(W=H) 원형만 50% 허용 (디자인 룰 §10)
            background: "var(--danger)",
          }}
        />
        <span>LIVE</span>
        {/* 라이브 건수 뱃지 */}
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            minWidth: 18,
            height: 18,
            padding: "0 5px",
            fontSize: 11,
            fontWeight: 800,
            color: "var(--ink-on-brand)", // 흰색 전용 토큰 (하드코딩 #fff 회피)
            background: "var(--danger)",
            borderRadius: "var(--radius-chip)",
          }}
        >
          {items.length}
        </span>
      </div>

      {/* chip 스크롤 영역 — 1~4건은 그대로, 5건+ 가로 스크롤 */}
      <div
        style={{
          display: "flex",
          gap: 8,
          overflowX: "auto",
          flex: 1,
          minWidth: 0,
          // 스크롤 시 끝부분 여백 — 마지막 chip 잘림 방지
          paddingBottom: 2,
        }}
      >
        {items.map((it) => (
          // chip 클릭 → /live/[id] 진입 (라이브 박스스코어 페이지)
          <Link
            key={it.id}
            href={`/live/${it.id}`}
            style={{
              flexShrink: 0,
              display: "flex",
              flexDirection: "column",
              gap: 2,
              maxWidth: 240,
              padding: "6px 12px",
              background: "var(--bg)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-card)",
              textDecoration: "none",
            }}
          >
            {/* 대회 · round (있을 때만) */}
            {it.meta && (
              <span
                style={{
                  fontSize: 10.5,
                  fontWeight: 700,
                  color: "var(--ink-dim)",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {it.meta}
              </span>
            )}
            {/* "강남BC vs 마포FC" — 1줄 말줄임 */}
            <span
              style={{
                fontSize: 12.5,
                fontWeight: 800,
                color: "var(--ink)",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {it.title}
            </span>
            {/* 라이브 스코어 라벨 — 점 + "Q3 14-10" */}
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                fontFamily: "var(--ff-mono)",
                fontSize: 12,
                fontWeight: 800,
                color: "var(--danger)",
              }}
            >
              <span
                className="live-air-dot"
                style={{
                  display: "inline-block",
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: "var(--danger)",
                }}
              />
              {it.label}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}

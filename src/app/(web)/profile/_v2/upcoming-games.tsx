/* ============================================================
 * UpcomingGames — /profile v2.4 다음 경기 (단일 카드, D-N 빨간 박스 강조)
 *
 * 왜:
 * - v2.4 시안 캡처 26 우측 aside 첫 카드 — 단일 D-N 박스 강조 톤으로 변경.
 *   기존 다중 행(72px/제목/배지) 카드를 폐기하고, 가장 가까운 1건을 "다음 경기" 카드로 표시.
 * - D-N 영역(좌)은 var(--accent) 12% mix 박스 + 큰 ff-display 글자, 우측은 제목 + 장소·시간.
 * - 카드 푸터에 "경기 상세 →" 버튼 (시안 캡처 26 그대로).
 *
 * 어떻게:
 * - games[0] 만 사용 (1건). 데이터 없으면 빈 상태 메시지.
 * - D-N 계산: 오늘 KST 자정 기준 일수 차이.
 * - 시안 빨간 막대 헤더(좌측 12x2 div) + "다음 경기" 라벨.
 * ============================================================ */

import Link from "next/link";

export interface UpcomingGame {
  /** 경기 ID (uuid 우선, 없으면 raw bigint 문자열) */
  id: string;
  title: string | null;
  /** ISO 문자열 */
  scheduledAt: string;
  venueName: string | null;
  /** game_applications.status — Int 코드 (0=pending, 1=approved, 2=rejected, 3=cancelled).
   *  시안 v2.4 에선 사용 안 함 (D-N 강조만). 호환을 위해 prop 은 유지. */
  status: number | null;
}

export interface UpcomingGamesProps {
  games: UpcomingGame[];
}

/** KST 기준 오늘 자정부터의 일수 차이. 과거면 null. */
function calcDDay(scheduledAtIso: string): number | null {
  const target = new Date(scheduledAtIso);
  if (isNaN(target.getTime())) return null;

  // KST offset +09:00 으로 shift 후 날짜만 추출
  const KST_OFFSET_MS = 9 * 60 * 60 * 1000;
  const now = new Date();
  const nowKst = new Date(now.getTime() + KST_OFFSET_MS);
  const targetKst = new Date(target.getTime() + KST_OFFSET_MS);

  const todayKst = Date.UTC(
    nowKst.getUTCFullYear(),
    nowKst.getUTCMonth(),
    nowKst.getUTCDate(),
  );
  const targetDay = Date.UTC(
    targetKst.getUTCFullYear(),
    targetKst.getUTCMonth(),
    targetKst.getUTCDate(),
  );

  const diffDays = Math.round((targetDay - todayKst) / (24 * 60 * 60 * 1000));
  if (diffDays < 0) return null;
  return diffDays;
}

/** HH:mm 포맷 */
function fmtTime(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const h = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${h}:${mi}`;
}

export function UpcomingGames({ games }: UpcomingGamesProps) {
  // v2.4 시안: 가장 빠른 1건만 D-N 강조 카드로 표시
  const nextGame = games[0] ?? null;

  // 데이터 없을 때 — 시안에 명시되어 있진 않지만 운영 폴백 필수
  if (!nextGame) {
    return (
      <div
        className="card"
        style={{
          padding: 16,
          textAlign: "center",
          color: "var(--ink-mute)",
          fontSize: 13,
        }}
      >
        예정된 경기가 없습니다.
      </div>
    );
  }

  // D-N 일수 계산 (음수면 0 처리)
  const dDay = calcDDay(nextGame.scheduledAt);
  // D-N 라벨 — null 이면 "PAST" 폴백 (지난 경기 들어왔을 때 안전망)
  const dLabel = dDay === null ? "PAST" : dDay === 0 ? "D-DAY" : `D-${dDay}`;

  return (
    // 시안 캡처 26 — 단일 D-N 강조 카드 + 빨간 막대 헤더 + "경기 상세 →" 푸터
    <div className="card" style={{ padding: 0, overflow: "hidden" }}>
      {/* 헤더 — 빨간 12x2 막대 + "다음 경기" 라벨 (시안 톤) */}
      <div
        style={{
          padding: "12px 16px",
          borderBottom: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        <span
          style={{
            width: 12,
            height: 2,
            background: "var(--accent)",
            borderRadius: 2,
          }}
        />
        <span style={{ fontSize: 12, fontWeight: 700, color: "var(--ink)" }}>
          다음 경기
        </span>
      </div>

      {/* 본문 — 좌 D-N 박스 + 우 정보 */}
      <div
        style={{
          padding: 16,
          display: "flex",
          gap: 14,
          alignItems: "center",
        }}
      >
        {/* D-N 빨간 박스 (12% mix 배경 + accent 텍스트) */}
        <div
          style={{
            width: 72,
            height: 72,
            // 시안 빨간 박스 톤 — color-mix 로 12% 투명. 토큰 룰 준수
            background: "color-mix(in srgb, var(--accent) 12%, transparent)",
            borderRadius: 8,
            display: "grid",
            placeItems: "center",
            fontFamily: "var(--ff-display)",
            fontWeight: 900,
            fontSize: 22,
            color: "var(--accent)",
            letterSpacing: "-0.04em",
            flexShrink: 0,
          }}
        >
          {dLabel}
        </div>
        {/* 우측: 제목 + 장소 · 시간 */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 14,
              fontWeight: 700,
              marginBottom: 2,
              color: "var(--ink)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {nextGame.title ?? "경기"}
          </div>
          <div style={{ fontSize: 12, color: "var(--ink-mute)" }}>
            {[nextGame.venueName, fmtTime(nextGame.scheduledAt)]
              .filter(Boolean)
              .join(" · ")}
          </div>
        </div>
      </div>

      {/* 푸터 — "경기 상세 →" 버튼 (시안 톤) */}
      <Link
        href={`/games/${nextGame.id.length >= 8 ? nextGame.id.slice(0, 8) : nextGame.id}`}
        className="btn"
        style={{
          margin: "0 16px 16px",
          display: "block",
          textAlign: "center",
          fontSize: 13,
          textDecoration: "none",
        }}
      >
        경기 상세 →
      </Link>
    </div>
  );
}

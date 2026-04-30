/* ============================================================
 * UpcomingGames — /profile v2.3 다가오는 일정 (최대 3건)
 *
 * 왜:
 * - v2.3 Profile.jsx L91~101 "다가오는 일정" 섹션 1:1 재현. 시안 GAMES.slice(0,3) 매칭.
 * - 페이지 SSR 단계에서 game_applications findMany take:3 으로 prefetch.
 *
 * 어떻게:
 * - 최대 3행 카드: 72px MM.DD / 제목 + 장소·시간 / 상태 badge ("참가확정" / "신청중" / "D-N").
 * - 시안의 "참가확정" 은 application.status === "approved"/"confirmed" 일 때만 노출.
 *   pending 은 "신청중", 그 외(rejected 등) 은 D-N 폴백.
 * - 모바일 720px 분기 — 인라인 grid `72px / 1fr / auto` 는 좁으면 텍스트 절단 →
 *   1열 stack(날짜 + 제목 위, 장소·시간 + 상태 아래)로 재배치.
 * - Link 로 /games/[id] 이동 (id 는 uuid slice 8자 or raw id).
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
   *  시안 "참가확정" = 1 / "신청중" = 0 / 그 외 = D-N. */
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

/** MM.DD 포맷 — 시안의 ff-mono D 컬럼용 */
function fmtMonthDay(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "-";
  // KST 로 표시 — Korea locale
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${m}.${day}`;
}

/** HH:mm 포맷 */
function fmtTime(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const h = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${h}:${mi}`;
}

/** 신청 상태 코드 → 시안 badge 라벨 + 클래스 매핑.
 *  status === 1(approved) → "참가확정"(녹색), 0(pending) → "신청중"(soft), 그 외는 D-N. */
function badgeFor(
  status: number | null,
  dDay: number | null,
): { label: string; className: string } {
  if (status === 1) {
    return { label: "참가확정", className: "badge badge--ok" };
  }
  if (status === 0) {
    return { label: "신청중", className: "badge badge--soft" };
  }
  // 그 외(상태 없음/거절 등) — D-N 폴백
  if (dDay !== null) {
    return { label: dDay === 0 ? "D-DAY" : `D-${dDay}`, className: "badge badge--soft" };
  }
  return { label: "예정", className: "badge badge--soft" };
}

export function UpcomingGames({ games }: UpcomingGamesProps) {
  return (
    <div className="card" style={{ padding: "22px 24px", marginBottom: 16 }}>
      <h2 style={{ margin: "0 0 14px", fontSize: 18, fontWeight: 700, color: "var(--ink)" }}>
        다가오는 일정
      </h2>

      {games.length > 0 ? (
        // v2.3 시안: 행 list + gap 10. 모바일 분기는 .upcoming-row 클래스로 globals.css 위임
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {games.map((game) => {
            const dDay = calcDDay(game.scheduledAt);
            const badge = badgeFor(game.status, dDay);
            return (
              <Link
                key={game.id}
                href={`/games/${game.id.length >= 8 ? game.id.slice(0, 8) : game.id}`}
                className="upcoming-row"
                style={{
                  display: "grid",
                  gridTemplateColumns: "72px 1fr auto",
                  gap: 14,
                  padding: "12px 14px",
                  background: "var(--bg-alt)",
                  borderRadius: 6,
                  alignItems: "center",
                  textDecoration: "none",
                  color: "inherit",
                }}
              >
                {/* 좌측: MM.DD (ff-mono, accent 색) */}
                <div
                  style={{
                    fontFamily: "var(--ff-mono)",
                    fontSize: 12,
                    fontWeight: 700,
                    color: "var(--accent)",
                  }}
                >
                  {fmtMonthDay(game.scheduledAt)}
                </div>
                {/* 중앙: 제목 + 장소 · 시간 */}
                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      fontWeight: 600,
                      fontSize: 14,
                      color: "var(--ink)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {game.title ?? "경기"}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--ink-dim)", marginTop: 2 }}>
                    {[game.venueName, fmtTime(game.scheduledAt)].filter(Boolean).join(" · ")}
                  </div>
                </div>
                {/* 우측: 상태 badge (참가확정 / 신청중 / D-N) */}
                <span className={badge.className}>{badge.label}</span>
              </Link>
            );
          })}
        </div>
      ) : (
        // 빈 상태 — 시안에 없는 case 지만 필수 폴백
        <div
          style={{
            padding: "18px 14px",
            textAlign: "center",
            fontSize: 13,
            color: "var(--ink-mute)",
          }}
        >
          예정된 경기가 없습니다.
        </div>
      )}
    </div>
  );
}

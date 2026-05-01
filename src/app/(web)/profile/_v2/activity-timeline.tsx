/* ============================================================
 * ActivityTimeline — /profile v2 최근 활동 (5건 혼합)
 *
 * 왜:
 * - v2 Profile.jsx L101~114 "최근 활동" 재현. PM 확정 D-P2:
 *   community_posts + game_applications 혼합 최근 5건 (서버 컴포넌트 Prisma 직접 호출 OK).
 * - 하드코딩 timeline 더미를 제거하고 실 데이터만 표시. 데이터 없으면 empty state.
 *
 * 어떻게:
 * - 3열 grid: 60px 날짜(mono) / 80px 태그 배지 / 1fr 타겟 문구.
 * - 태그 종류(원본과 동일 4종 + 미지원 1종 축소):
 *   · post   (게시글 작성)           — badge--soft
 *   · match  (경기 신청)              — badge--soft
 *   · win    (경기 완료·승)           — badge--ok  (※ 승패 데이터는 아직 없음 — "경기 완료" 일괄)
 *   · team   (팀 합류) ← Phase 1 범위 밖, 이번엔 제외
 * - 실제로는 "게시글 작성 / 경기 신청" 2종만 분류. 차후 승/패 연결 시 확장.
 * ============================================================ */

import Link from "next/link";

/** 활동 1건 — v2.4 시안: post/match/win/loss/team 5종 (현 데이터 = post/application 2종, 향후 확장 가능) */
export interface ActivityItem {
  /** 중복 방지용 고유 키 (type + id) */
  key: string;
  /** ISO 문자열 */
  createdAt: string;
  /**
   * 표시 태그 종류 — v2.4 시안 매핑:
   *  · post        — 게시글 작성 (badge--soft)
   *  · application — 경기 신청 (badge--ok, "match" 와 동급)
   *  · match       — 대회 접수 (badge--soft) — 향후 토너먼트 신청 연결
   *  · win         — 경기 완료·승 (badge--ok) — 승패 데이터 연결 후
   *  · loss        — 경기 완료·패 (badge--red) — 승패 데이터 연결 후
   *  · team        — 팀 합류 (badge--soft) — TeamMember.joined_at 연결 후
   */
  kind: "post" | "application" | "match" | "win" | "loss" | "team";
  /** 태그 라벨 (예: "게시글 작성") */
  action: string;
  /** 중앙 텍스트 (예: "어제 픽업경기 후기") */
  target: string;
  /** 클릭 시 이동 경로 (없으면 div) */
  href?: string;
}

export interface ActivityTimelineProps {
  items: ActivityItem[];
}

/** MM.DD 포맷 — ff-mono 용 */
function fmtMonthDay(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "-";
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${m}.${day}`;
}

/** v2.4 시안 kind → badge 클래스 매핑 (5종 + application 호환) */
function badgeClass(kind: ActivityItem["kind"]): string {
  switch (kind) {
    case "win":
      return "badge badge--ok"; // 녹색 — 승
    case "loss":
      return "badge badge--red"; // 빨강 — 패
    case "post":
      return "badge badge--soft"; // 카페블루 soft — 게시글 작성
    case "match":
      return "badge badge--soft"; // 대회 접수 (시안 ref)
    case "application":
      return "badge badge--ok"; // 경기 신청 (긍정적 활동)
    case "team":
      return "badge badge--soft"; // 팀 합류
    default:
      return "badge badge--ghost";
  }
}

export function ActivityTimeline({ items }: ActivityTimelineProps) {
  return (
    <div className="card" style={{ padding: "22px 24px" }}>
      <h2 style={{ margin: "0 0 14px", fontSize: 18, fontWeight: 700, color: "var(--ink)" }}>
        최근 활동
      </h2>
      {items.length === 0 ? (
        <div
          style={{
            padding: "18px 4px",
            textAlign: "center",
            fontSize: 13,
            color: "var(--ink-mute)",
          }}
        >
          아직 활동 내역이 없습니다.
        </div>
      ) : (
        <div>
          {items.map((t, i) => {
            const row = (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "60px 80px 1fr",
                  gap: 14,
                  padding: "12px 0",
                  borderBottom: i < items.length - 1 ? "1px solid var(--border)" : 0,
                  alignItems: "center",
                }}
              >
                {/* 좌측: MM.DD */}
                <div
                  style={{
                    fontFamily: "var(--ff-mono)",
                    fontSize: 12,
                    color: "var(--ink-dim)",
                  }}
                >
                  {fmtMonthDay(t.createdAt)}
                </div>
                {/* 중앙: 태그 배지 */}
                <div>
                  <span className={badgeClass(t.kind)} style={{ fontSize: 10 }}>
                    {t.action}
                  </span>
                </div>
                {/* 우측: 타겟 문구 */}
                <div
                  style={{
                    fontSize: 14,
                    color: "var(--ink)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {t.target}
                </div>
              </div>
            );
            // href 있으면 Link, 없으면 div
            return t.href ? (
              <Link
                key={t.key}
                href={t.href}
                style={{ textDecoration: "none", color: "inherit", display: "block" }}
              >
                {row}
              </Link>
            ) : (
              <div key={t.key}>{row}</div>
            );
          })}
        </div>
      )}
    </div>
  );
}

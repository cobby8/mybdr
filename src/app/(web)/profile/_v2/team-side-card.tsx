/* ============================================================
 * TeamSideCard — /profile v2 소속 팀 사이드 카드
 *
 * 왜:
 * - v2 Profile.jsx L44~53 좌측 aside "소속 팀" 카드 재현.
 * - 시안은 1팀 선택형 (TEAMS[0]) 이나 실제 DB 에는 여러 팀 소속 가능.
 *   → 첫 번째 활성 팀(기존 getProfile teams 리스트 0번) 만 표시. 복수 시 "외 N팀" 메타 추가.
 * - "리딤" 같은 팀 tag 는 DB 필드 없음 → team name 첫 2글자 이니셜로 폴백.
 *
 * 어떻게:
 * - Link → /teams/[id] 이동.
 * - 팀 로고(logoUrl) 있으면 이미지, 없으면 primaryColor 배경 + 이니셜 텍스트.
 * - 팀 1개 이상일 때만 렌더. 0개면 컴포넌트 자체 숨김 (페이지에서 조건부 렌더).
 * ============================================================ */

import Image from "next/image";
import Link from "next/link";

export interface TeamSideItem {
  id: string;
  name: string;
  /** 팀 색상 — 기본 var(--accent) */
  primaryColor: string | null;
  /** 팀 로고 URL — 없으면 이니셜 폴백 */
  logoUrl: string | null;
  /** v2.3 시안 "12W 5L" — 팀 전적. 0/0 이면 표시 생략 (신규 팀 잡음 방지) */
  wins: number;
  losses: number;
  draws: number;
}

export interface TeamSideCardProps {
  primaryTeam: TeamSideItem;
  /** 총 소속팀 수 — 2 이상일 때 "외 N팀" 메타 추가 */
  totalTeams: number;
}

export function TeamSideCard({ primaryTeam, totalTeams }: TeamSideCardProps) {
  // 팀 tag 이니셜 — 한글 2글자 또는 영문 앞 3글자
  const tagInitial = primaryTeam.name.trim().slice(0, 3).toUpperCase();
  // 배경색 — null 이면 v2 accent 폴백
  const bgColor = primaryTeam.primaryColor ?? "var(--accent)";

  return (
    // v2.4 시안 캡처 26 — 헤더에 빨간 12x2 막대 + "전체" 우측 링크
    <div className="card" style={{ padding: 16 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span
            style={{
              width: 12,
              height: 2,
              background: "var(--accent)",
              borderRadius: 2,
            }}
          />
          <span style={{ fontSize: 12, fontWeight: 700, color: "var(--ink)" }}>
            소속 팀
          </span>
        </div>
        {/* 우측 "전체" — 팀 목록 페이지로 이동 (/profile/teams 운영 미존재 → /teams 로 매핑) */}
        <Link
          href="/teams"
          style={{
            fontSize: 11,
            color: "var(--ink-dim)",
            textDecoration: "none",
          }}
        >
          전체
        </Link>
      </div>

      <Link
        href={`/teams/${primaryTeam.id}`}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: 8,
          background: "var(--bg-alt)",
          borderRadius: 6,
          textDecoration: "none",
          color: "inherit",
        }}
      >
        {/* 팀 색 박스 — 시안 톤 40x40 (기존 32 → 40 으로 확대, 시안 캡처 26 비율) */}
        <span
          style={{
            width: 40,
            height: 40,
            background: bgColor,
            color: "#fff",
            display: "grid",
            placeItems: "center",
            fontFamily: "var(--ff-mono)",
            fontSize: 12,
            fontWeight: 700,
            borderRadius: 4,
            overflow: "hidden",
            flexShrink: 0,
          }}
        >
          {primaryTeam.logoUrl ? (
            <Image
              src={primaryTeam.logoUrl}
              alt={primaryTeam.name}
              width={40}
              height={40}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            tagInitial
          )}
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontWeight: 700,
              fontSize: 14,
              color: "var(--ink)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {primaryTeam.name}
          </div>
          {/* v2.4 시안 "34W 12L · 1842" — wins/losses + 외 N팀. 데이터 없으면 "—" 폴백 */}
          <div
            style={{
              fontSize: 11,
              color: "var(--ink-dim)",
              fontFamily: "var(--ff-mono)",
              marginTop: 2,
            }}
          >
            {primaryTeam.wins > 0 || primaryTeam.losses > 0 ? (
              <>
                {primaryTeam.wins}W {primaryTeam.losses}L
                {primaryTeam.draws > 0 ? ` ${primaryTeam.draws}D` : ""}
              </>
            ) : (
              "—"
            )}
            {totalTeams > 1 && (
              <>
                {" · "}외 {totalTeams - 1}팀
              </>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
}

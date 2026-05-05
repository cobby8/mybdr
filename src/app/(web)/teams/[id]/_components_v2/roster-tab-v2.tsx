import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/db/prisma";
import { getDisplayName } from "@/lib/utils/player-display-name";
// 2026-05-05 Phase 2 PR7 — 본인 row 등번호 변경 신청 버튼 (client wrapper)
import { JerseyChangeButton } from "./jersey-change-button";

// 2026-05-02: birth_date → 만 나이 계산
// null/Invalid Date 안전 — null 반환 시 카드에서 미표시
function calcAge(birthDate: Date | null): number | null {
  if (!birthDate) return null;
  const now = new Date();
  let age = now.getFullYear() - birthDate.getFullYear();
  const m = now.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birthDate.getDate())) age--;
  return age >= 0 && age < 130 ? age : null;
}

// 2026-05-02: 지역 표시 — city + district 콤마 구분된 다중 값 처리
// 첫 번째만 (예: "서울,경기" → "서울")
function formatRegion(city: string | null, district: string | null): string | null {
  const c = (city ?? "").split(",")[0]?.trim();
  const d = (district ?? "").split(",")[0]?.trim();
  if (c && d) return `${c} ${d}`;
  if (c) return c;
  return null;
}

import "./roster-tab-v2.css";

/**
 * RosterTabV2 — 팀 로스터 카드 그리드
 *
 * 2026-05-02 사용자 요청:
 * - 행 → 카드 그리드 (TeamCardV2 패턴 차용)
 * - 모바일 2열 / 태블릿 3열 / PC 4열
 *
 * DB 매핑 / 미지원:
 * - jerseyNumber → 등번호 (좌상)
 * - nickname/name → 이름 (getDisplayName, 실명 우선 — conventions.md 2026-05-01)
 * - user.position → 포지션
 * - role: captain → 빨강 배지 / director·coach·manager·treasurer → soft 배지
 * - PPG → DB 미지원 (추후 match_player_stat 집계)
 *
 * 회귀 방지 (errors.md 04-29):
 * - 인라인 grid 안티패턴 ❌ → roster-tab-v2.css className + media query
 */

type Props = {
  teamId: bigint;
  accent: string;
  // 2026-05-05 Phase 2 PR7 — 본인 row 식별 (로그인 안 했으면 null)
  // 이유: server component 단에서 본인 row 만 client 버튼을 마운트해 불필요한
  //   fetch 호출 차단. null 이면 모든 row 에서 버튼 미노출 (비로그인/타인 시야).
  currentUserId?: bigint | null;
};

const ROLE_LABEL: Record<string, string> = {
  director: "감독",
  coach: "코치",
  captain: "주장",
  manager: "매니저",
  treasurer: "총무",
  member: "선수",
};

const ROLE_ORDER: Record<string, number> = {
  captain: 0,
  director: 1,
  coach: 2,
  manager: 3,
  treasurer: 4,
  member: 5,
};

export async function RosterTabV2({ teamId, accent, currentUserId }: Props) {
  const members = await prisma.teamMember
    .findMany({
      where: { teamId, status: "active" },
      include: {
        user: {
          select: {
            id: true,
            nickname: true,
            name: true,
            position: true,
            // 2026-05-02: 선수카드에 신장 표시 (사용자 결정)
            height: true,
            // 2026-05-02 (옵션 A): 프로필 사진 + 나이 + 선출 + 지역
            profile_image_url: true,
            birth_date: true,
            is_elite: true,
            city: true,
            district: true,
          },
        },
      },
      orderBy: [{ jerseyNumber: "asc" }, { createdAt: "asc" }],
    })
    .catch(() => []);

  if (members.length === 0) {
    return (
      <div
        className="card"
        style={{
          padding: "40px 20px",
          textAlign: "center",
          color: "var(--ink-mute)",
        }}
      >
        <span
          className="material-symbols-outlined"
          style={{ fontSize: 32, marginBottom: 8, display: "block" }}
        >
          groups
        </span>
        <p style={{ margin: 0, fontSize: 14 }}>로스터가 비어 있습니다.</p>
      </div>
    );
  }

  // 역할 우선 정렬 (DB orderBy는 jerseyNumber 기준이므로 역할 기준 재정렬)
  const sorted = [...members].sort((a, b) => {
    const ra = ROLE_ORDER[a.role ?? "member"] ?? 99;
    const rb = ROLE_ORDER[b.role ?? "member"] ?? 99;
    if (ra !== rb) return ra - rb;
    const ja = a.jerseyNumber ?? 999;
    const jb = b.jerseyNumber ?? 999;
    return ja - jb;
  });

  return (
    <div
      className="roster-grid"
      // accent 변수 (팀 고유색) — 카드 상단 띠 + 등번호 색에 사용
      style={{ ["--roster-accent" as string]: accent }}
    >
      {sorted.map((m) => {
        const displayName = getDisplayName(m.user);
        const userId = m.user?.id?.toString();
        const position = m.user?.position ?? "—";
        const height = m.user?.height ?? null;
        // 2026-05-05 Phase 2 PR7 — 본인 row 식별 (BigInt 비교)
        const isMe = currentUserId !== undefined && currentUserId !== null && m.userId === currentUserId;
        const myJersey = m.jerseyNumber ?? null;
        // 2026-05-02 (옵션 A): 프로필 사진 + 나이 + 선출 + 지역
        const profileImage = m.user?.profile_image_url ?? null;
        const age = calcAge(m.user?.birth_date ?? null);
        const isElite = m.user?.is_elite === true;
        const region = formatRegion(m.user?.city ?? null, m.user?.district ?? null);
        const role = m.role ?? "member";
        const roleLabel = ROLE_LABEL[role] ?? role;
        const jersey = m.jerseyNumber ?? "—";

        // 2026-05-02 (v3): 컴팩트 + 나이 → 지역 우측
        //  ┌─────────────────────────┐
        //  │ [등번호]    포지션 신장   │  ← 상단 row
        //  │            📍 지역  나이  │  ← 지역 + 나이 한 줄
        //  │ [아바타] 이름  [선출][주장]│
        //  └─────────────────────────┘
        // 여백 줄임: gap 4, padding 0, 뱃지 minHeight 제거
        const hasBadge = isElite || role === "captain" || role === "director" || role === "coach" || role === "manager" || role === "treasurer";
        const cardInner = (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {/* 상단 row — 등번호 좌 / 포지션·신장 + 지역·나이 우 */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: 8,
              }}
            >
              <div className="roster-card__jersey">{jersey}</div>
              <div
                style={{
                  flex: 1,
                  textAlign: "right",
                  display: "flex",
                  flexDirection: "column",
                  gap: 1,
                  minWidth: 0,
                }}
              >
                {/* 포지션 · 신장 (1줄, 우측 정렬) */}
                <div
                  style={{
                    fontSize: 12,
                    color: "var(--ink)",
                    fontFamily: "var(--ff-mono, monospace)",
                    display: "flex",
                    gap: 4,
                    justifyContent: "flex-end",
                    flexWrap: "wrap",
                  }}
                >
                  {position !== "—" && <span>{position}</span>}
                  {height && (
                    <span style={{ color: "var(--ink-mute)" }}>{height}cm</span>
                  )}
                </div>
                {/* 지역 + 나이 (1줄, 우측 정렬) — 둘 중 하나라도 있으면 표시 */}
                {(region || age !== null) && (
                  <div
                    style={{
                      fontSize: 11,
                      color: "var(--ink-mute)",
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                      justifyContent: "flex-end",
                      flexWrap: "wrap",
                    }}
                  >
                    {region && (
                      <span style={{ display: "flex", alignItems: "center", gap: 2 }}>
                        <span
                          className="material-symbols-outlined"
                          style={{ fontSize: 12 }}
                        >
                          location_on
                        </span>
                        {region}
                      </span>
                    )}
                    {age !== null && (
                      <span style={{ fontFamily: "var(--ff-mono, monospace)" }}>
                        {age}세
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* 메인 — 아바타 + 이름 + 뱃지 (한 줄, 뱃지 우측) */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                minWidth: 0,
              }}
              className="roster-card__identity"
            >
              {profileImage ? (
                <span
                  className="roster-card__avatar"
                  style={{
                    overflow: "hidden",
                    padding: 0,
                    position: "relative",
                  }}
                >
                  <Image
                    src={profileImage}
                    alt={displayName}
                    fill
                    sizes="32px"
                    style={{ objectFit: "cover" }}
                    unoptimized
                  />
                </span>
              ) : (
                <span className="roster-card__avatar">
                  {displayName.charAt(0)}
                </span>
              )}
              <span className="roster-card__name" style={{ flex: 1, minWidth: 0 }}>
                {displayName}
              </span>
              {/* 뱃지 영역 — 우측 정렬, 있을 때만 (minHeight 제거 → 여백 0) */}
              {hasBadge && (
                <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                  {isElite && <span className="badge badge--red">선출</span>}
                  {role === "captain" ? (
                    <span className="badge badge--red">주장</span>
                  ) : role === "director" ||
                    role === "coach" ||
                    role === "manager" ||
                    role === "treasurer" ? (
                    <span className="badge badge--soft">{roleLabel}</span>
                  ) : null}
                </div>
              )}
            </div>
            {/* 2026-05-05 Phase 2 PR7 — 본인 row: 등번호 변경 신청 버튼
                이유: 본인 카드는 Link 외부 div 로 감싸므로 클릭 충돌 0. server component
                JSX 에서 onClick 사용 불가 → JerseyChangeButton (client) 으로 위임. */}
            {isMe && (
              <div
                style={{
                  marginTop: 4,
                  display: "flex",
                  justifyContent: "flex-end",
                }}
              >
                <JerseyChangeButton
                  teamId={teamId.toString()}
                  currentJersey={myJersey}
                />
              </div>
            )}
          </div>
        );

        // 본인 카드는 Link 로 감싸지 않음 — 버튼 클릭이 /users/[id] 이동과 충돌하기 때문.
        // 이유: Link 안에서 button onClick 은 stopPropagation 해도 일부 브라우저에서 navigate 트리거.
        if (isMe) {
          return (
            <div key={m.id.toString()} className="roster-card">
              {cardInner}
            </div>
          );
        }

        return userId ? (
          <Link
            key={m.id.toString()}
            href={`/users/${userId}`}
            className="roster-card"
          >
            {cardInner}
          </Link>
        ) : (
          <div key={m.id.toString()} className="roster-card">
            {cardInner}
          </div>
        );
      })}
    </div>
  );
}

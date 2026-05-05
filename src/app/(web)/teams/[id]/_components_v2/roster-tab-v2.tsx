import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/db/prisma";
import { getDisplayName } from "@/lib/utils/player-display-name";
// 2026-05-05 Phase 2 PR8+PR9 — 본인 row dropdown (번호 변경 + 휴면 + 탈퇴 통합)
//   기존 JerseyChangeButton 대체 (PR7 단독 버튼 → 3 액션 통합 메뉴).
//   기존 컴포넌트 파일은 보존 (역사 추적용 — 외부 import 0건 검증 완료 2026-05-05).
import { MemberActionsMenu } from "./member-actions-menu";
import MemberPendingBadge from "./member-pending-badge";

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
  // 2026-05-05 Phase 3 PR10 — 이적 모달 헤더에 현 팀 이름 표시용
  teamName?: string | null;
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

export async function RosterTabV2({ teamId, accent, currentUserId, teamName }: Props) {
  // 2026-05-05 Phase 2 PR8 — dormant 멤버도 로스터에 포함 (휴면 뱃지 표시)
  // withdrawn 은 자동 제외 (status IN ['active','dormant'])
  const members = await prisma.teamMember
    .findMany({
      where: { teamId, status: { in: ["active", "dormant"] } },
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
      // PR8: dormant 멤버는 active 뒤로 정렬 (status='active' 우선 — 사전순 a-d)
      orderBy: [{ status: "asc" }, { jerseyNumber: "asc" }, { createdAt: "asc" }],
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

  // 역할 우선 정렬 + dormant 멤버 후순위 (DB orderBy는 status/jerseyNumber 기준)
  // PR8: dormant 는 active 뒤로 — 운영자 시야 가독성 확보
  const sorted = [...members].sort((a, b) => {
    const sa = a.status === "dormant" ? 1 : 0;
    const sb = b.status === "dormant" ? 1 : 0;
    if (sa !== sb) return sa - sb; // active 먼저
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
        // PR8: 휴면 멤버 표시 분기 — 카드 톤 다운 + "휴면" 뱃지
        const isDormant = m.status === "dormant";

        // 2026-05-02 (v3): 컴팩트 + 나이 → 지역 우측
        //  ┌─────────────────────────┐
        //  │ [등번호]    포지션 신장   │  ← 상단 row
        //  │            📍 지역  나이  │  ← 지역 + 나이 한 줄
        //  │ [아바타] 이름  [선출][주장]│
        //  └─────────────────────────┘
        // 여백 줄임: gap 4, padding 0, 뱃지 minHeight 제거
        const hasBadge = isDormant || isElite || role === "captain" || role === "director" || role === "coach" || role === "manager" || role === "treasurer";
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
                  {/* PR8: 휴면 뱃지 — soft 톤, 가장 우선 표시 (상태 정보가 가장 중요) */}
                  {isDormant && <span className="badge badge--soft">휴면</span>}
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
            {/* 2026-05-05 Phase 2 PR8+PR9 — 본인 row 액션 메뉴 (3 액션 통합)
                이유: 본인 카드는 Link 외부 div 로 감싸므로 클릭 충돌 0. server component
                JSX 에서 onClick 사용 불가 → MemberActionsMenu (client) 으로 위임.
                휴면 멤버도 본인 시야에서 액션 메뉴 노출 — 단, 서버에서 NOT_TEAM_MEMBER
                403 차단 (POST 시 status='active' 만 통과). 휴면 본인은 자동 복귀 hook 으로
                다음 SSR 진입 시 active 로 복귀 → 그 후 액션 가능. */}
            {isMe && !isDormant && (
              <div
                style={{
                  marginTop: 4,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 8,
                  flexWrap: "wrap",
                }}
              >
                {/* 5/6 — 본인 신청 중 뱃지 (좌하단) — pending 0건 시 null (자동 빈 div) */}
                <MemberPendingBadge teamId={teamId.toString()} />
                <MemberActionsMenu
                  teamId={teamId.toString()}
                  teamName={teamName ?? null}
                  currentJersey={myJersey}
                />
              </div>
            )}
            {/* P3-10: 본인 휴면 안내 — 액션 메뉴 미노출 보완 (자동 복귀 hook 안내) */}
            {isMe && isDormant && (
              <div
                style={{
                  marginTop: 4,
                  fontSize: 11,
                  color: "var(--ink-mute)",
                  textAlign: "right",
                  fontStyle: "italic",
                }}
              >
                휴면 중 · 복귀일 도래 시 자동 복귀
              </div>
            )}
          </div>
        );

        // 본인 카드는 Link 로 감싸지 않음 — 버튼 클릭이 /users/[id] 이동과 충돌하기 때문.
        // 이유: Link 안에서 button onClick 은 stopPropagation 해도 일부 브라우저에서 navigate 트리거.
        // PR8: 휴면 멤버는 카드 자체를 톤 다운 (opacity 0.6) — 시각 정보 우선
        const dormantStyle: React.CSSProperties | undefined = isDormant
          ? { opacity: 0.6 }
          : undefined;
        if (isMe) {
          // 5/6 fix: 본인 카드는 dropdown 메뉴 (MemberActionsMenu) 가 카드 밖으로
          // 펼쳐져야 함. .roster-card 의 overflow: hidden 을 inline 으로 visible 오버라이드.
          // 다른 멤버 카드는 hover 효과 등을 위해 hidden 유지.
          const meStyle: React.CSSProperties = { ...dormantStyle, overflow: "visible" };
          return (
            <div key={m.id.toString()} className="roster-card" style={meStyle}>
              {cardInner}
            </div>
          );
        }

        return userId ? (
          <Link
            key={m.id.toString()}
            href={`/users/${userId}`}
            className="roster-card"
            style={dormantStyle}
          >
            {cardInner}
          </Link>
        ) : (
          <div key={m.id.toString()} className="roster-card" style={dormantStyle}>
            {cardInner}
          </div>
        );
      })}
    </div>
  );
}

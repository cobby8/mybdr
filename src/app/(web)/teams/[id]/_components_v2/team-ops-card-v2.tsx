import Link from "next/link";

/**
 * TeamOpsCardV2 — TU2 사이드 보강 (BT4 내 권한 + BT7 운영 액션)
 * ─────────────────────────────────────────────────────────────
 * 이유(왜): 시안 TeamDetail.jsx 의 우측 aside 에는
 *   ② TU2-B "운영 액션" 카드 (캡틴/매니저만 — BT7 cross-domain)
 *   ③ TU2-C "내 권한" 카드 (멤버 본인만 — BT4 TeamOfficerPermissions)
 *   가 있다. 운영 사이드카드(team-side-card-v2)에는 최근폼+가입+연락만 있어
 *   본인 권한/운영 진입 동선이 비어 있었다. 그 두 카드만 추가 박제한다.
 *
 * 방법(어떻게):
 *   - BT4(내 권한): 운영 권한 모델 = TeamOfficerPermissions 의 permissions JSON.
 *     captain 은 자동 전체권한(permissions.ts hasTeamOfficerPermission 룰 #1),
 *     위임자는 permissions[key]===true 인 키만 보유. 6키를 사람이 읽을 라벨로
 *     매핑해 보유/미보유를 check_circle / block 아이콘으로 표시.
 *   - BT7(운영 액션): cross-domain 링크 3종. 실제 동작하는 운영 라우트만 건다.
 *       · 이 팀 멤버 경기 모으기 → /games (host_team_id searchParams 통과)
 *       · 팀 관리 → /teams/[id]/manage (가입/매치/멤버 큐 통합 — 존재)
 *     (시안의 "/tournaments?team_id=" 는 tournaments page 가 searchParams 를
 *      사용하지 않아 효과가 없으므로 제외 — 가짜 동선 금지)
 *
 * DB / mock 금지:
 *   - TeamOfficerPermissions 는 운영 0건이나 captain 자동 전체권한은 "실제 권한"
 *     이므로 captain 본인에게는 6키 전부 보유로 표시(가짜 아님).
 *   - 위임 권한은 SSR 에서 permissions JSON 실값을 읽어 전달받는다(아래 props).
 */

// permissions.ts 의 TeamOfficerPermission 6키 — 라벨 매핑.
// 키 순서 = 시안 캡틴 권한 목록 순서를 운영 6키에 맞춰 정렬.
const PERMISSION_LABELS: { key: string; label: string }[] = [
  { key: "jerseyChangeApprove", label: "등번호 변경 승인" },
  { key: "dormantApprove", label: "휴면 분류 승인" },
  { key: "withdrawApprove", label: "탈퇴 승인" },
  { key: "transferApprove", label: "이적 승인" },
  { key: "ghostClassify", label: "유령(휴면) 분류" },
  { key: "forceChange", label: "강제 등번호 변경" },
];

// 본인 role 한글 라벨 + 색. captain/vice/manager 만 운영 라벨 부여.
function roleLabel(role: string | null): { text: string; tone: string } {
  switch (role) {
    case "captain":
      return { text: "캡틴", tone: "var(--accent)" };
    case "vice":
      return { text: "부캡틴", tone: "var(--cafe-blue)" };
    case "manager":
      return { text: "매니저", tone: "var(--cafe-blue)" };
    default:
      return { text: "멤버", tone: "var(--ink-mute)" };
  }
}

type Props = {
  teamId: string;
  // 본인 멤버 여부 / 운영진 여부 / role / 위임 권한 키 boolean 맵
  isMember: boolean;
  canManage: boolean; // captain or vice/manager
  myRole: string | null;
  isCaptain: boolean; // captain 은 자동 전체권한
  grantedPermissions: Record<string, boolean>; // 위임받은 권한 키 → true
};

export function TeamOpsCardV2({
  teamId,
  isMember,
  canManage,
  myRole,
  isCaptain,
  grantedPermissions,
}: Props) {
  // 비멤버에게는 두 카드 모두 의미 없음 → 아무것도 렌더하지 않음(mock 금지)
  if (!isMember) return null;

  const role = roleLabel(myRole);

  // 각 권한 키 보유 판정 — captain 은 전체 true, 그 외는 위임 맵 참조.
  const hasKey = (key: string): boolean =>
    isCaptain || grantedPermissions[key] === true;

  // 운영 권한을 하나라도 가진 멤버인지 (카드 데이터 유무 판정용)
  const hasAnyPermission =
    isCaptain || PERMISSION_LABELS.some((p) => grantedPermissions[p.key] === true);

  return (
    <>
      {/* ── BT7 · 운영 액션 카드 (운영진만) ── */}
      {canManage && (
        <div className="card" style={{ padding: "16px 20px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: "0.1em",
              color: "var(--ink-dim)",
              textTransform: "uppercase",
              marginBottom: 12,
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
              tune
            </span>
            운영 액션
          </div>

          {/* 이 팀 멤버 경기 모으기 — /games host_team_id 통과(searchParams 자유) */}
          <Link
            href={`/games?host_team_id=${teamId}`}
            className="flex items-center gap-2.5"
            style={{
              padding: "10px 12px",
              borderRadius: "var(--radius-chip)",
              background: "var(--bg-alt)",
              marginBottom: 8,
              textDecoration: "none",
            }}
          >
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 20, color: "var(--cafe-blue)" }}
            >
              sports_basketball
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: "var(--ink)" }}>
                이 팀 멤버 경기 모으기
              </div>
              <div style={{ fontSize: 11, color: "var(--ink-mute)" }}>
                팀 호스트 경기로 모집
              </div>
            </div>
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 18, color: "var(--ink-dim)" }}
            >
              chevron_right
            </span>
          </Link>

          {/* 팀 관리 — /teams/[id]/manage (가입/매치/멤버 큐 통합) */}
          <Link
            href={`/teams/${teamId}/manage`}
            className="flex items-center gap-2.5"
            style={{
              padding: "10px 12px",
              borderRadius: "var(--radius-chip)",
              background: "var(--bg-alt)",
              textDecoration: "none",
            }}
          >
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 20, color: "var(--accent)" }}
            >
              settings
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: "var(--ink)" }}>
                팀 관리
              </div>
              <div style={{ fontSize: 11, color: "var(--ink-mute)" }}>
                멤버 · 가입 · 매치 신청 관리
              </div>
            </div>
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 18, color: "var(--ink-dim)" }}
            >
              chevron_right
            </span>
          </Link>
        </div>
      )}

      {/* ── BT4 · 내 권한 카드 (멤버 본인) ── */}
      <div className="card" style={{ padding: "16px 20px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: "0.1em",
            color: "var(--ink-dim)",
            textTransform: "uppercase",
            marginBottom: 10,
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
            verified
          </span>
          내 권한
        </div>

        {/* 본인 role 배지 */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <span
            style={{
              fontFamily: "var(--ff-mono)",
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: "0.04em",
              color: "#fff",
              background: role.tone,
              padding: "3px 9px",
              borderRadius: "var(--radius-chip)",
            }}
          >
            {role.text}
          </span>
        </div>

        {/* 운영 권한이 하나도 없으면(= 일반 멤버) 권한 6키 나열 대신 안내만.
            mock 금지: 멤버에게 운영권한 6키 전부 block 으로 나열하면 노이즈만 큼. */}
        {hasAnyPermission ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {PERMISSION_LABELS.map((p) => {
              const on = hasKey(p.key);
              return (
                <div
                  key={p.key}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 7,
                    fontSize: 12.5,
                    color: on ? "var(--ink-soft)" : "var(--ink-dim)",
                  }}
                >
                  <span
                    className="material-symbols-outlined"
                    style={{
                      fontSize: 17,
                      color: on ? "var(--ok)" : "var(--ink-dim)",
                    }}
                  >
                    {on ? "check_circle" : "block"}
                  </span>
                  {p.label}
                </div>
              );
            })}
          </div>
        ) : (
          // 일반 멤버 — 운영 권한 없음을 명확히 안내(가짜 권한 표시 0)
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 7,
              fontSize: 12.5,
              color: "var(--ink-mute)",
            }}
          >
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 17, color: "var(--ink-dim)" }}
            >
              info
            </span>
            경기 · 대회 참가 가능 / 운영 권한 없음
          </div>
        )}
      </div>
    </>
  );
}

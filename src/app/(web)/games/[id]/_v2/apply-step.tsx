/* ============================================================
 * ApplyStep — 내 신청 진행 단계 인디케이터 (Phase 2C · UA2 BG1)
 *
 * 왜 이 컴포넌트가 있는가:
 *   GameDetail 시안(BDR-current/screens/GameDetail.jsx)의 BG1 = sidebar
 *   "내 신청 현황" step indicator. 본인이 이미 신청한 경기에서 현재 어느
 *   단계까지 왔는지를 [신청 완료 → 호스트 승인 → 참가 확정] 3단계로 시각화한다.
 *
 * status 매핑 (game_applications.status = Int — 운영 전역 일관):
 *   - 0 = 대기   : 신청 완료 ✓, 호스트 승인 "진행 중", 참가 확정 미도달
 *   - 1 = 승인   : 3단계 모두 완료
 *   - 2 = 거절   : 신청 완료 ✓, 호스트 승인 단계에서 "거절", 참가 확정 미도달
 *   동일 매핑이 my-games/page.tsx · api/web/me/activity/route.ts(2C-3 UC1) ·
 *   apply-panel.tsx 에서 모두 0/1/2 로 통일되어 있다. 새 매핑을 만들지 않고
 *   이 단일 진실을 그대로 따른다.
 *
 * mock 금지: 본인 신청이 없는(myApplicationStatus=null) 경우 page.tsx 측에서
 *   이 컴포넌트를 아예 렌더하지 않는다. 여기서는 0/1/2 만 처리한다.
 *
 * 디자인 13룰: var(--*) DS v4 토큰 + Material Symbols Outlined 만 사용.
 * 서버 데이터에 의존하지 않는 순수 표시 컴포넌트 — 클라이언트 지시어 불필요.
 * ============================================================ */

// 신청 시각/승인 시각 등 타임스탬프 표시용 — KST "M/D HH:mm" 포맷
function formatStamp(d: Date | string | null | undefined): string | null {
  if (!d) return null;
  const date = typeof d === "string" ? new Date(d) : d;
  if (Number.isNaN(date.getTime())) return null;
  try {
    // ko-KR + Asia/Seoul — 운영 다른 페이지(activity route)와 동일 패턴
    const m = date.toLocaleString("ko-KR", {
      timeZone: "Asia/Seoul",
      month: "numeric",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    return m;
  } catch {
    return null;
  }
}

export interface ApplyStepProps {
  /** 내 신청 상태: 0=대기 / 1=승인 / 2=거절 (null/미신청은 page에서 미렌더) */
  status: number;
  /** 신청 시각 (game_applications.created_at) */
  appliedAt?: Date | string | null;
  /** 승인 시각 (game_applications.approved_at) */
  approvedAt?: Date | string | null;
  /** 거절 시각 (game_applications.rejected_at) */
  rejectedAt?: Date | string | null;
}

// 단계 1건의 시각 상태
type StepState = "done" | "current" | "rejected" | "pending";

interface StepDef {
  label: string;
  icon: string;
  state: StepState;
  /** 단계별 보조 시각/문구 */
  stamp?: string | null;
}

export function ApplyStep({
  status,
  appliedAt,
  approvedAt,
  rejectedAt,
}: ApplyStepProps) {
  const appliedStamp = formatStamp(appliedAt);
  const approvedStamp = formatStamp(approvedAt);
  const rejectedStamp = formatStamp(rejectedAt);

  // status 별 3단계 상태 계산 (단일 매핑 — 위 헤더 주석 참조)
  let steps: StepDef[];
  if (status === 2) {
    // 거절: 신청 완료 ✓ → 호스트 승인 단계에서 거절 → 참가 확정 미도달
    steps = [
      { label: "신청 완료", icon: "edit_note", state: "done", stamp: appliedStamp ? `${appliedStamp} 신청` : null },
      { label: "신청 거절", icon: "cancel", state: "rejected", stamp: rejectedStamp ? `${rejectedStamp} 거절` : null },
      { label: "참가 확정", icon: "sports_basketball", state: "pending" },
    ];
  } else if (status === 1) {
    // 승인: 3단계 모두 완료
    steps = [
      { label: "신청 완료", icon: "edit_note", state: "done", stamp: appliedStamp ? `${appliedStamp} 신청` : null },
      { label: "호스트 승인", icon: "verified", state: "done", stamp: approvedStamp ? `${approvedStamp} 승인` : null },
      { label: "참가 확정", icon: "sports_basketball", state: "done" },
    ];
  } else {
    // 대기(0) 및 그 외 기본: 신청 완료 ✓ → 호스트 승인 "진행 중" → 참가 확정 미도달
    steps = [
      { label: "신청 완료", icon: "edit_note", state: "done", stamp: appliedStamp ? `${appliedStamp} 신청` : null },
      { label: "호스트 승인", icon: "hourglass_top", state: "current", stamp: "승인 대기 중" },
      { label: "참가 확정", icon: "sports_basketball", state: "pending" },
    ];
  }

  return (
    <ol
      style={{
        listStyle: "none",
        margin: 0,
        padding: 0,
        display: "flex",
        flexDirection: "column",
        gap: 0,
      }}
    >
      {steps.map((step, i) => {
        const isLast = i === steps.length - 1;
        // 단계 상태별 색상 — var(--*) 토큰만 사용 (하드코딩 색 금지)
        const palette = colorOf(step.state);
        return (
          <li
            key={i}
            style={{
              display: "flex",
              gap: 12,
              position: "relative",
              // 마지막 단계가 아니면 다음 단계까지 연결선 공간 확보
              paddingBottom: isLast ? 0 : 18,
            }}
          >
            {/* 좌측 인디케이터 열 — 원형 마커 + 세로 연결선 */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                flexShrink: 0,
              }}
            >
              {/* 원형 마커 — 정사각형(W=H) 원형은 50% 허용 (디자인 13룰 §C-10 예외) */}
              <span
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: palette.bg,
                  border: `1px solid ${palette.border}`,
                  color: palette.fg,
                  flexShrink: 0,
                }}
              >
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: 16, lineHeight: 1 }}
                  aria-hidden
                >
                  {step.icon}
                </span>
              </span>
              {/* 세로 연결선 — 마지막 단계 제외. 완료 단계는 강조색, 그 외 회색 */}
              {!isLast && (
                <span
                  style={{
                    flex: 1,
                    width: 2,
                    marginTop: 2,
                    background:
                      step.state === "done"
                        ? "var(--ok)"
                        : "var(--border)",
                  }}
                />
              )}
            </div>

            {/* 우측 텍스트 열 — 라벨 + 보조 시각/문구 */}
            <div style={{ paddingTop: 3, minWidth: 0 }}>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: palette.labelColor,
                  lineHeight: 1.2,
                }}
              >
                {step.label}
              </div>
              {step.stamp && (
                <div
                  style={{
                    fontSize: 11,
                    color: "var(--ink-dim)",
                    fontFamily: "var(--ff-mono)",
                    marginTop: 2,
                  }}
                >
                  {step.stamp}
                </div>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

// 단계 상태 → 색상 팔레트 (var(--*) 토큰만)
function colorOf(state: StepState): {
  bg: string;
  border: string;
  fg: string;
  labelColor: string;
} {
  switch (state) {
    case "done":
      // 완료 — 성공 색(ok)
      return {
        bg: "var(--ok)",
        border: "var(--ok)",
        fg: "#fff",
        labelColor: "var(--ink)",
      };
    case "current":
      // 진행 중 — 강조색(accent) 외곽선 강조
      return {
        bg: "var(--accent-soft, var(--bg-alt))",
        border: "var(--accent)",
        fg: "var(--accent)",
        labelColor: "var(--ink)",
      };
    case "rejected":
      // 거절 — BDR Red
      return {
        bg: "var(--bdr-red)",
        border: "var(--bdr-red)",
        fg: "#fff",
        labelColor: "var(--bdr-red)",
      };
    default:
      // 미도달 — 흐린 회색
      return {
        bg: "var(--bg-alt)",
        border: "var(--border)",
        fg: "var(--ink-dim)",
        labelColor: "var(--ink-dim)",
      };
  }
}

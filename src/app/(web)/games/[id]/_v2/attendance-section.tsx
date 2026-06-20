/* ============================================================
 * AttendanceSection — M3 wave2 호스트 출석 체크 섹션 (시안 C 박제)
 *
 * 왜 이 컴포넌트가 있는가:
 *   확정/종료된 경기(game.status >= 2)에서 호스트가 승인 참가자(status=1)의
 *   현장 출석을 체크/해제한다. 미출석 처리한 참가자는 이후 경기 리포트에서
 *   "노쇼"로 prefill 된다(report-form 연동 — DATA-BINDING §4 시안 C).
 *
 * 핵심 동작 — 낙관적 업데이트(optimistic update):
 *   - 토글 클릭 시 ① 먼저 로컬 state 를 즉시 바꿔(present↔absent) 화면 반영
 *     ② PUT /api/web/games/[id]/attendance 호출.
 *   - 성공 시 그대로 유지. 실패 시 **이전 상태로 롤백**하고 카운터도 다시 맞춰진다
 *     (카운터는 attendance map 에서 파생 계산 → 롤백 시 자동 재계산).
 *   - 같은 참가자를 같은 값으로 다시 누르면 토글 해제(미체크 null 로 복귀)된다.
 *
 * 권한: 이 컴포넌트는 page.tsx 에서 `isHost && game.status>=2` 일 때만 렌더된다.
 *   서버 PUT 라우트도 organizer_id 가드(IDOR)가 있어 이중 안전.
 *
 * 디자인: 시안 GameDetail.jsx "출석 체크 섹션" 박제.
 *   - var(--*) 토큰만(하드코딩 hex 0) / 토글 버튼 min-height 44px(터치)
 *   - 아바타 정사각 원형(50% — 토큰 룰 예외 허용) / 720px 분기
 * ============================================================ */

"use client";

import { useState, type CSSProperties } from "react";

// page.tsx 에서 내려주는 승인 참가자 shape — id/user_id 는 string(BigInt 직렬화).
// attendedAt: 서버 attended_at(ISO) 유무로 출석 초기값을 파생한다.
export interface AttendanceMember {
  /** 신청 id (string) */
  id: string;
  /** 참가자 User.id — PUT body.user_id 로 전송. null(게스트/placeholder)이면 토글 비활성 */
  user_id: string | null;
  nickname: string | null;
  name: string | null;
  position: string | null;
  skill_level: string | null;
  /** 서버 attended_at(ISO) — 존재하면 초기값 "출석(true)" */
  attendedAt: string | null;
}

interface AttendanceSectionProps {
  /** 라우트 [id] (short UUID 또는 전체 UUID) */
  gameId: string;
  members: AttendanceMember[];
}

// 출석 상태: true=출석 / false=미출석 / undefined=미체크
type AttState = Record<string, boolean | undefined>;

// 표시 이름 — 닉네임 > 이름 > "익명"
function displayName(m: AttendanceMember): string {
  return m.nickname?.trim() || m.name?.trim() || "익명";
}

// 아바타 이니셜 — 이름 앞 2글자(대문자)
function initials(m: AttendanceMember): string {
  const base = m.nickname?.trim() || m.name?.trim() || "?";
  return base.slice(0, 2).toUpperCase();
}

export function AttendanceSection({ gameId, members }: AttendanceSectionProps) {
  // 초기 출석 state — 서버 attended_at 이 있으면 true, 없으면 미체크(undefined).
  // 미출석(false)은 서버에 별도 표현이 없으므로(attended_at null = 미체크와 동일),
  // 초기엔 출석 여부만 복원한다. 미출석은 호스트가 명시적으로 누른 세션 내 상태.
  const [att, setAtt] = useState<AttState>(() => {
    const init: AttState = {};
    for (const m of members) {
      if (m.attendedAt) init[m.id] = true;
    }
    return init;
  });
  // 저장 중 표시(시안 "저장중…") — 한 번에 여러 토글 가능하므로 카운터로 관리
  const [savingCount, setSavingCount] = useState(0);

  // 카운터는 att map 에서 파생 — 롤백 시 자동으로 재계산된다(별도 카운터 state 불필요).
  const presentCount = members.filter((m) => att[m.id] === true).length;
  const absentCount = members.filter((m) => att[m.id] === false).length;

  // 출석/미출석 토글 — 낙관적 업데이트 + 실패 시 롤백.
  async function handleToggle(member: AttendanceMember, present: boolean) {
    // 게스트/placeholder(user_id 없음)는 출석 대상이 아님(서버도 user_id 필요).
    if (member.user_id == null) return;

    const prev = att[member.id];
    // 같은 값을 다시 누르면 토글 해제(미체크) — 그 외에는 해당 값으로 설정.
    const next = prev === present ? undefined : present;
    // 서버에는 present(true)/absent(false)만 보낸다. 해제(undefined)는 false(attended_at null)로 전송.
    const serverPresent = next === true;

    // ① 낙관적 반영 — 화면 먼저 변경(카운터도 파생이라 즉시 갱신됨)
    setAtt((s) => ({ ...s, [member.id]: next }));
    setSavingCount((c) => c + 1);

    try {
      const res = await fetch(`/api/web/games/${gameId}/attendance`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ user_id: member.user_id, present: serverPresent }),
      });
      if (!res.ok) {
        // ② 실패 → 이전 상태로 롤백(카운터 자동 재계산)
        setAtt((s) => ({ ...s, [member.id]: prev }));
      }
    } catch {
      // 네트워크 오류도 롤백
      setAtt((s) => ({ ...s, [member.id]: prev }));
    } finally {
      setSavingCount((c) => Math.max(0, c - 1));
    }
  }

  // 토글 버튼 공통 스타일 — 44px 터치 보장(시안 .att-toggle button min-height:44px)
  const toggleBtnBase: CSSProperties = {
    minHeight: 44,
    padding: "0 16px",
    background: "transparent",
    border: 0,
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 700,
    color: "var(--ink-mute)",
  };

  return (
    <section className="card" style={{ padding: "22px 26px" }}>
      {/* 헤더 — 제목 + 호스트 전용 라벨 + 출석/미출석 카운터 + 저장중 */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          marginBottom: 6,
          flexWrap: "wrap",
          gap: 8,
        }}
      >
        <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "var(--ink)" }}>
          출석 체크{" "}
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: "var(--accent)",
              marginLeft: 6,
            }}
          >
            호스트 전용
          </span>
        </h2>
        <div
          style={{
            fontSize: 12,
            color: "var(--ink-mute)",
            display: "flex",
            gap: 10,
            alignItems: "center",
          }}
        >
          {/* 출석/미출석 카운터 — att map 파생. 롤백 시 자동 보정 */}
          <span style={{ color: "var(--ok)", fontWeight: 700 }}>출석 {presentCount}</span>
          <span style={{ color: "var(--warn)", fontWeight: 700 }}>미출석 {absentCount}</span>
          {savingCount > 0 && <span style={{ color: "var(--ink-dim)" }}>저장중…</span>}
        </div>
      </div>

      {/* 안내문 — 미출석 처리 시 리포트 노쇼 연동 안내(시안 ended 카피) */}
      <p style={{ margin: "0 0 14px", fontSize: 12, color: "var(--ink-mute)" }}>
        미출석 처리된 참가자는 경기 리포트에서 노쇼로 표시됩니다.
      </p>

      {/* 참가자 행 리스트 */}
      {members.length === 0 ? (
        // 승인 참가자가 없을 때(호스트 1명) — 빈 카드 회피
        <p style={{ margin: 0, fontSize: 12, color: "var(--ink-dim)" }}>
          아직 승인된 참가자가 없습니다.
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {members.map((m, i) => {
            const v = att[m.id]; // true/false/undefined
            const disabled = m.user_id == null; // 게스트/placeholder
            return (
              <div
                key={m.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "40px 1fr auto",
                  gap: 12,
                  alignItems: "center",
                  padding: "10px 0",
                  borderTop: i > 0 ? "1px solid var(--border)" : 0,
                  // 토글 불가(게스트) 행은 살짝 흐리게
                  opacity: disabled ? 0.6 : 1,
                }}
              >
                {/* 아바타 — 정사각 원형(50% 토큰 룰 예외 허용) */}
                <div
                  aria-hidden
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: "50%",
                    background: "var(--ink-soft)",
                    color: "var(--bg)",
                    display: "grid",
                    placeItems: "center",
                    fontFamily: "var(--ff-mono)",
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                >
                  {initials(m)}
                </div>

                {/* 이름 + 레벨·포지션 메타 */}
                <div style={{ minWidth: 0 }}>
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
                    {displayName(m)}
                  </div>
                  {(m.skill_level?.trim() || m.position?.trim()) && (
                    <div
                      style={{
                        fontSize: 11,
                        color: "var(--ink-dim)",
                        fontFamily: "var(--ff-mono)",
                      }}
                    >
                      {[m.skill_level?.trim(), m.position?.trim()]
                        .filter(Boolean)
                        .join(" · ")}
                    </div>
                  )}
                </div>

                {/* 출석/미출석 토글 — 44px 터치. data-active 대신 인라인 분기 */}
                <div
                  role="group"
                  aria-label={`${displayName(m)} 출석`}
                  style={{
                    display: "inline-flex",
                    border: "1px solid var(--border)",
                    borderRadius: 4,
                    overflow: "hidden",
                  }}
                >
                  <button
                    type="button"
                    disabled={disabled}
                    aria-pressed={v === true}
                    onClick={() => handleToggle(m, true)}
                    style={{
                      ...toggleBtnBase,
                      cursor: disabled ? "not-allowed" : "pointer",
                      // 출석 활성 시 --ok 배경 + --ink-on-brand 텍스트
                      ...(v === true
                        ? { background: "var(--ok)", color: "var(--ink-on-brand)" }
                        : null),
                    }}
                  >
                    출석
                  </button>
                  <button
                    type="button"
                    disabled={disabled}
                    aria-pressed={v === false}
                    onClick={() => handleToggle(m, false)}
                    style={{
                      ...toggleBtnBase,
                      borderLeft: "1px solid var(--border)",
                      cursor: disabled ? "not-allowed" : "pointer",
                      // 미출석 활성 시 --warn 배경 + 검정 텍스트(badge--warn 과 동일 대비)
                      ...(v === false
                        ? { background: "var(--warn)", color: "#000" }
                        : null),
                    }}
                  >
                    미출석
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

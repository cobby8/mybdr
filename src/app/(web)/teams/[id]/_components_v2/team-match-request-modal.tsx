"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

/**
 * TeamMatchRequestModalV2
 * ─────────────────────────────────────────────────────────
 * Phase 10-4 — 팀 매치 신청 모달 (Hero 우측 CTA 2번 자리)
 *
 * 이유(왜): 매치 신청은 "내가 운영진인 팀"을 from_team 으로 골라 to_team(현재 팀)에
 * 보내는 흐름이라 단순 버튼이 아닌 모달 폼이 필요. zod 스키마와 동일한 입력 3개.
 *
 * 방법(어떻게):
 * - props.myManagedTeams: SSR에서 미리 계산 (teamMembers 본조회 재활용 + 동일 로그인 유저의 다른 팀)
 *   — 0개면 버튼 disabled + tooltip "운영진인 팀이 필요합니다"
 *   — 1개면 자동 선택, 1개+면 select 노출
 * - 비로그인이면 /login?returnTo
 * - POST /api/web/teams/:to_team_id/match-request 로 전송
 *
 * 표시:
 * - 트리거: "매치 신청" 버튼 (btn--accent)
 * - 모달: from_team 셀렉트 + 메시지(선택, 1000자) + 선호 일시(선택, datetime-local)
 */

type ManagedTeam = { id: string; name: string };

type Props = {
  toTeamId: string; // URL의 [id]
  toTeamName: string;
  myManagedTeams: ManagedTeam[]; // 비어 있으면 disabled
  isLoggedIn: boolean;
};

export function TeamMatchRequestModalV2({
  toTeamId,
  toTeamName,
  myManagedTeams,
  isLoggedIn,
}: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // 폼 상태 — 첫 운영팀 자동 선택
  const [fromTeamId, setFromTeamId] = useState<string>(
    myManagedTeams[0]?.id ?? ""
  );
  const [message, setMessage] = useState("");
  const [preferredDate, setPreferredDate] = useState(""); // datetime-local 문자열

  // 모달 열릴 때 키보드 ESC 닫기 + body 스크롤 락
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  function openModal() {
    if (!isLoggedIn) {
      router.push(`/login?returnTo=/teams/${toTeamId}`);
      return;
    }
    setError(null);
    setSuccess(null);
    setOpen(true);
  }

  async function handleSubmit() {
    setError(null);
    setSuccess(null);

    // 클라이언트 사전 검증 — from_team 필수
    if (!fromTeamId) {
      setError("매치를 신청할 우리 팀을 선택해 주세요.");
      return;
    }

    // datetime-local → ISO. 빈 값이면 null. (zod schema는 ISO+offset 요구하므로 toISOString 사용)
    const preferredIso = preferredDate
      ? new Date(preferredDate).toISOString()
      : null;

    setLoading(true);
    try {
      const res = await fetch(`/api/web/teams/${toTeamId}/match-request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          from_team_id: fromTeamId,
          message: message.trim() || null,
          preferred_date: preferredIso,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok) {
        setSuccess(json?.message ?? "매치 신청이 전송되었습니다.");
        // 폼 초기화 + 1.5초 후 모달 닫기 (UX: 성공 메시지 잠깐 노출)
        setMessage("");
        setPreferredDate("");
        setTimeout(() => setOpen(false), 1500);
      } else {
        const errText =
          typeof json?.error === "string"
            ? json.error
            : Array.isArray(json?.error)
            ? "입력값을 다시 확인해 주세요."
            : "매치 신청에 실패했습니다.";
        setError(errText);
      }
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  // 운영팀 0개 → 비활성 버튼 (모달 자체 미오픈)
  const noTeam = myManagedTeams.length === 0;

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        disabled={noTeam}
        aria-disabled={noTeam}
        title={noTeam ? "내가 운영진인 팀이 있어야 매치 신청이 가능합니다" : undefined}
        className="btn btn--accent"
        style={{
          opacity: noTeam ? 0.6 : 1,
          cursor: noTeam ? "not-allowed" : "pointer",
        }}
      >
        매치 신청
      </button>

      {open && (
        <div
          // 백드롭 — 클릭 시 닫기
          role="dialog"
          aria-modal="true"
          aria-label="매치 신청"
          onClick={() => !loading && setOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.55)",
            display: "grid",
            placeItems: "center",
            zIndex: 1000,
            padding: 16,
          }}
        >
          <div
            // 모달 컨테이너 — 백드롭 클릭 이벤트 차단
            onClick={(e) => e.stopPropagation()}
            className="card"
            style={{
              maxWidth: 480,
              width: "100%",
              padding: 24,
              maxHeight: "90vh",
              overflowY: "auto",
              color: "var(--ink)",
            }}
          >
            <h2
              style={{
                fontSize: 20,
                fontWeight: 800,
                marginBottom: 6,
                fontFamily: "var(--ff-display)",
              }}
            >
              매치 신청
            </h2>
            <p
              style={{
                fontSize: 13,
                color: "var(--ink-soft)",
                marginBottom: 18,
              }}
            >
              <b>{toTeamName}</b> 팀에 친선/연습경기를 제안합니다.
            </p>

            <div style={{ display: "grid", gap: 14 }}>
              {/* 1) 우리 팀 선택 */}
              <label style={{ display: "grid", gap: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 700 }}>
                  우리 팀 선택
                </span>
                <select
                  value={fromTeamId}
                  onChange={(e) => setFromTeamId(e.target.value)}
                  className="input"
                  disabled={loading || myManagedTeams.length === 1}
                  style={{ width: "100%" }}
                >
                  {myManagedTeams.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
                {myManagedTeams.length === 1 && (
                  <span style={{ fontSize: 11, color: "var(--ink-mute)" }}>
                    운영진인 팀이 1개뿐이라 자동 선택됩니다.
                  </span>
                )}
              </label>

              {/* 2) 선호 일시 (선택) */}
              <label style={{ display: "grid", gap: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 700 }}>
                  선호 일시 (선택)
                </span>
                <input
                  type="datetime-local"
                  value={preferredDate}
                  onChange={(e) => setPreferredDate(e.target.value)}
                  className="input"
                  disabled={loading}
                  style={{ width: "100%" }}
                />
              </label>

              {/* 3) 메시지 (선택, 최대 1000자) */}
              <label style={{ display: "grid", gap: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 700 }}>
                  메시지 (선택)
                </span>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value.slice(0, 1000))}
                  rows={4}
                  placeholder="간단한 인사와 매치 의향을 남겨 주세요."
                  className="input"
                  disabled={loading}
                  style={{ width: "100%", resize: "vertical" }}
                />
                <span
                  style={{
                    fontSize: 11,
                    color: "var(--ink-mute)",
                    textAlign: "right",
                  }}
                >
                  {message.length} / 1000
                </span>
              </label>

              {error && (
                <p style={{ fontSize: 13, color: "var(--danger)" }}>{error}</p>
              )}
              {success && (
                <p style={{ fontSize: 13, color: "var(--ok)" }}>{success}</p>
              )}

              <div
                style={{
                  display: "flex",
                  gap: 8,
                  justifyContent: "flex-end",
                  marginTop: 6,
                }}
              >
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  disabled={loading}
                  className="btn"
                >
                  취소
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading || !fromTeamId}
                  className="btn btn--accent"
                >
                  {loading ? "전송 중..." : "신청 보내기"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

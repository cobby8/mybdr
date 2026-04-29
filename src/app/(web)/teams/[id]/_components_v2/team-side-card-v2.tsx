import { TeamJoinButtonV2 } from "./team-join-button-v2";
import { TeamMatchRequestModalV2 } from "./team-match-request-modal";

/**
 * TeamSideCardV2
 * ─────────────────────────────────────────────────────────
 * v2 시안 `TeamDetail.jsx` 우측 aside 2카드 재현.
 *
 * 이유(왜): 시안의 탭/스탯/소개 영역은 좌측 1fr, 우측 320px sticky aside에
 * "최근 폼 + 게스트 지원/매치 신청" 카드와 "연락 카드"를 얹는다.
 * 기존 페이지에는 사이드 영역 자체가 없어 새로 추가한다.
 *
 * 방법(어떻게):
 * - 2개 `.card`를 세로 스택. 상단 카드는 position:sticky top:96
 *   (시안은 120; mybdr 헤더 높이 고려해 96으로 조정)
 * - 최근 폼: 28×28 칸 5개, W→var(--ok) L→var(--ink-dim) "—"→border only.
 * - 메인 CTA "팀 가입 신청" — 시안의 "게스트 지원" 자리에 실제 동작하는
 *   가입 신청 복원 (1d53893 v2 재구성에서 누락된 기능 복원).
 *   멤버에게는 미렌더(아래 isMember 가드).
 * - 보조 버튼 "팀 매치 신청" — Phase 10-4에서 활성화 (Hero 와 동일한 모달 재사용).
 * - 연락 카드: 팀장 닉네임 + 응답시간("준비 중")
 *   + "쪽지 보내기" 버튼 (btn--sm 전폭, disabled).
 *
 * DB 매핑 / 미지원:
 * - 최근 폼 → computeRecentForm (recent-tab-v2.tsx에서 import)
 * - 팀 가입 신청 → POST /api/web/teams/:id/join (구현됨)
 * - 팀 매치 신청 → POST /api/web/teams/:id/match-request (Phase 10-4 신설)
 * - 쪽지 → 준비 중 (Phase 10 백로그)
 * - 응답시간 → "준비 중" 텍스트로 대체
 */

type ManagedTeam = { id: string; name: string };

type Props = {
  recentForm: ("W" | "L" | "-")[]; // 최대 5개
  captainName: string | null;
  // 가입 신청 UI 제어 (서버 컴포넌트에서 미리 계산해 전달)
  teamId: string;
  // Phase 10-4 매치 신청 모달용 — to_team 이름 + 운영팀 후보
  teamName: string;
  myManagedTeams: ManagedTeam[];
  isLoggedIn: boolean;
  isMember: boolean; // 멤버면 "가입 신청" 자체를 숨긴다
  hasPendingRequest: boolean; // pending 신청 있으면 disabled "신청 완료"
};

export function TeamSideCardV2({
  recentForm,
  captainName,
  teamId,
  teamName,
  myManagedTeams,
  isLoggedIn,
  isMember,
  hasPendingRequest,
}: Props) {
  // 정확히 5칸을 유지 (빈 칸은 "-"로 채움) — 시안 일관성 위해
  const cells: ("W" | "L" | "-")[] = [...recentForm];
  while (cells.length < 5) cells.push("-");
  const filled = cells.slice(0, 5);

  return (
    <aside
      className="flex flex-col gap-3.5"
      style={{ position: "sticky", top: 96 }}
    >
      {/* ── 카드 1: 최근 폼 + 지원/매치신청 ── */}
      <div className="card" style={{ padding: "18px 20px" }}>
        <div
          style={{
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: "0.1em",
            color: "var(--ink-dim)",
            textTransform: "uppercase",
            marginBottom: 10,
          }}
        >
          최근 폼
        </div>
        <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
          {filled.map((r, i) => {
            const isW = r === "W";
            const isL = r === "L";
            return (
              <span
                key={i}
                style={{
                  width: 28,
                  height: 28,
                  display: "grid",
                  placeItems: "center",
                  fontFamily: "var(--ff-display)",
                  fontWeight: 900,
                  fontSize: 13,
                  color: isW || isL ? "#fff" : "var(--ink-mute)",
                  background: isW
                    ? "var(--ok)"
                    : isL
                    ? "var(--ink-dim)"
                    : "transparent",
                  border:
                    isW || isL
                      ? "none"
                      : "1px dashed var(--border)",
                  borderRadius: 4,
                }}
              >
                {r}
              </span>
            );
          })}
        </div>

        {/* 팀 가입 신청 — 1d53893 재구성에서 누락된 기능 복원.
            멤버면 미표시(이미 멤버), 미멤버면 활성/신청완료 분기 (TeamJoinButtonV2 내부 처리) */}
        {!isMember && (
          <TeamJoinButtonV2
            teamId={teamId}
            isLoggedIn={isLoggedIn}
            hasPendingRequest={hasPendingRequest}
          />
        )}
        {/* Phase 10-4 활성 — Hero 와 동일한 모달 재사용. width 100%로 사이드카드에 맞춤.
            모달 자체는 fixed 백드롭이라 트리거 위치만 다르고 같은 컴포넌트. */}
        <div style={{ marginTop: 8, width: "100%" }}>
          <TeamMatchRequestModalV2
            toTeamId={teamId}
            toTeamName={teamName}
            myManagedTeams={myManagedTeams}
            isLoggedIn={isLoggedIn}
          />
        </div>
      </div>

      {/* ── 카드 2: 연락 ── */}
      <div className="card" style={{ padding: "16px 20px" }}>
        <div
          style={{
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: "0.1em",
            color: "var(--ink-dim)",
            textTransform: "uppercase",
            marginBottom: 10,
          }}
        >
          연락
        </div>
        <div
          style={{
            fontSize: 13,
            color: "var(--ink-soft)",
            lineHeight: 1.7,
          }}
        >
          팀장 · {captainName ?? "—"}
          {/*
            DB 미구현 — Phase 10 백로그 (Dev/design/phase-9-future-features.md 5-2)
            응답시간 집계: 메시지/쪽지 응답 로그 테이블 추가 필요. PM 정책에 따라 UI 숨김.

            <br />
            <span style={{ color: "var(--ink-mute)" }}>응답시간 · 준비 중</span>
          */}
        </div>
        {/*
          DB 미구현 — Phase 10 백로그 (Dev/design/phase-9-future-features.md 5-2)
          쪽지/DM 모델 추가 필요 (현재 messages는 알림 메시지만). PM 정책에 따라 UI 숨김.

          <button
            type="button"
            disabled
            aria-disabled="true"
            title="준비 중인 기능입니다"
            className="btn btn--sm"
            style={{
              marginTop: 10,
              width: "100%",
              opacity: 0.6,
              cursor: "not-allowed",
            }}
          >
            쪽지 보내기
          </button>
        */}
      </div>
    </aside>
  );
}

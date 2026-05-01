/* ============================================================
 * ApplyPanel — BDR v2 경기 신청 우측 사이드 패널
 *
 * 왜 이 컴포넌트가 있는가:
 * 기존 PriceCard 는 가격 강조 + 버튼 slot 구조였으나, v2 시안은
 *   [상단: 비용 요약 + 자리남음 + 진행바] +
 *   [신청자 정보 카드] +
 *   [메인: 참가 신청 / 신청 취소 / 승인 상태 CTA] +
 *   [보조 1버튼: 문의] +
 *   [하단: 참가자 n/최대]
 * 형태로 응집도 높은 하나의 패널. "한마디/저장/문의"는 DB 연결 없이
 * alert 동작만 배치(PM 확정 — UI만 우선 배치).
 *
 * Phase C (2026-05-02) 갱신 — 사용자 결정 4=A / 5=B / 6=B:
 *   - 자리남음 + 진행바 신설 (시안 GameDetail.jsx L91-98)
 *   - 신청자 정보 카드 신설: 닉네임 / L.skill · position 메타 + skill_level select 1줄
 *     · skill_level select 는 form state 만 (API 전송 X — 결정 5=B 운영 흐름 유지)
 *     · 이유: apply-button.tsx 의 fetch body 변경 0 → 응답 키 변경 0
 *   - 한마디 textarea + 동의 체크박스 시안 정합 박제 (UI만, 검증/전송 동작 0 — 결정 5=B)
 *   - CTA 운영 그대로 (즉시 신청 X — 결정 6=B), GameApplyButton 내부 재사용
 *
 * 클라이언트 컴포넌트 — 기존 GameApplyButton/CancelApplyButton 를
 * 내부에 그대로 재사용해 API/데이터 패칭 경로를 건드리지 않는다.
 * ============================================================ */

"use client";

import { useState } from "react";
import { GameApplyButton } from "../apply-button";
import { CancelApplyButton } from "../cancel-apply-button";

export interface ApplyPanelMyProfile {
  nickname: string | null;
  name: string | null;
  position: string | null;
  skill_level: string | null;
}

export interface ApplyPanelProps {
  gameId: string;
  gameStatus: number;
  /** 비용(원) — 0 / null 이면 "무료" */
  feePerPerson: number | string | null;
  entryFeeNote: string | null;
  maxParticipants: number | null;
  currentParticipants: number | null;
  /** 세션 유무 */
  isLoggedIn: boolean;
  /** 호스트 여부 — 본인이면 신청/취소 CTA 미노출 */
  isHost: boolean;
  /** 내 신청 상태: null(미신청) / 0(대기) / 1(승인) / 2(거절) */
  myApplicationStatus: number | null;
  /** 프로필 완성 여부 (GameApplyButton 필요) */
  profileCompleted: boolean;
  missingFields: string[];
  /** Phase C — 본인 프로필 (신청자 정보 카드 노출용). 비로그인 = null */
  myProfile?: ApplyPanelMyProfile | null;
}

// skill_level 라벨링 헬퍼 — "5" → "L.5", 이미 "L.5" 형태면 그대로
function formatLevel(raw: string | null | undefined): string | null {
  const v = raw?.trim();
  if (!v) return null;
  return /^\d+$/.test(v) ? `L.${v}` : v;
}

export function ApplyPanel({
  gameId,
  gameStatus,
  feePerPerson,
  entryFeeNote,
  maxParticipants,
  currentParticipants,
  isLoggedIn,
  isHost,
  myApplicationStatus,
  profileCompleted,
  missingFields,
  myProfile,
}: ApplyPanelProps) {
  const feeNum = feePerPerson != null ? Number(feePerPerson) : 0;
  const isFree = !feePerPerson || feeNum === 0;
  const cur = currentParticipants ?? 0;
  const max = maxParticipants ?? 0;
  // 자리남음·진행바 — 시안 GameDetail.jsx L94 / L97
  const remaining = Math.max(0, max - cur);
  // 진행률 0~100 (max=0 인 경우 0% 로 폴백)
  const progressPct = max > 0 ? Math.min(100, Math.round((cur / max) * 100)) : 0;

  // Phase C 결정 5=B: 한마디 textarea / 동의 체크박스 / skill_level select 는 UI 만 박제.
  //   - skill_level: 본인 프로필 기본값을 form state 로만 보유. apply-button.tsx fetch body 변경 0
  //   - message / agreed: form state 만, 서버 전송 X (game_applications.message 미전송)
  //   추후 큐: 5C (game_applications.message 전송 + 활성화), 6A (즉시 신청 + 가드)
  const [skillLevel, setSkillLevel] = useState<string>(
    () => myProfile?.skill_level ?? ""
  );

  // 알림만 띄우는 보조 버튼 핸들러 (PM 확정안 — 실제 DB 연동은 차후).
  // DB 미구현 — Phase 10 백로그 (Dev/design/phase-9-future-features.md 5-2)
  // - 한마디(handleMessage): game_applications.message 서버 미전송 → UI 숨김
  // - 저장(handleSave): bookmarks 테이블 미구현 → UI 숨김
  // - 문의(handleContact): 유지 (5-2 명시 대상 아님)
  function handleContact() {
    alert("호스트에게 문의 기능은 준비 중입니다.");
  }

  // 신청자 정보 카드 노출 조건 — 로그인 + 호스트 아님 + 미신청 (즉, 신청 폼이 보이는 시점).
  // 호스트/거절/승인/대기 상태에선 신청 폼 자체가 안 보이므로 신청자 정보 카드도 가린다.
  const showApplicantInfo =
    isLoggedIn && !isHost && myApplicationStatus == null && myProfile;
  const myDisplay =
    myProfile?.nickname?.trim() || myProfile?.name?.trim() || "회원";
  const myMeta = [
    formatLevel(myProfile?.skill_level),
    myProfile?.position ?? null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <aside
      className="card"
      style={{
        padding: 0,
        position: "sticky",
        top: 16,
        // sticky 는 부모에 overflow 걸리면 무효화되지만,
        // layout 구조상 문제 없음. lg에서만 실제 sticky 효과 발생
        overflow: "hidden",
      }}
    >
      {/* 1. 상단 비용 + 자리남음 + 진행바 — 시안 GameDetail.jsx L90-99 정합 */}
      <div
        style={{
          padding: "18px 20px",
          borderBottom: "1px solid var(--border)",
        }}
      >
        {/* 상단 한 줄: "참가 신청" 라벨 (좌) + "N자리 남음" (우) — 시안 정합 */}
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            justifyContent: "space-between",
            marginBottom: 10,
          }}
        >
          <div
            style={{
              fontSize: 11,
              color: "var(--accent)",
              fontWeight: 800,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
            }}
          >
            참가 신청
          </div>
          <div
            style={{
              fontFamily: "var(--ff-mono)",
              fontSize: 12,
              fontWeight: 700,
              color: "var(--ink-soft)",
            }}
          >
            {/* 자리남음 — max=0(미설정) 인 경우 "?" 로 폴백 */}
            {max > 0 ? `${remaining}자리 남음` : "정원 미정"}
          </div>
        </div>

        {/* 진행바 — bg-alt 트랙 + cafe-blue 채움. 시안 정합 (높이 8px / 4px 라운드) */}
        <div
          style={{
            height: 8,
            background: "var(--bg-alt)",
            borderRadius: 4,
            overflow: "hidden",
          }}
          // 접근성: 신청 진행률을 시각 외에도 보조 기술에 알림
          role="progressbar"
          aria-valuenow={progressPct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`참가 신청 진행률 ${progressPct}%`}
        >
          <div
            style={{
              width: `${progressPct}%`,
              height: "100%",
              background: "var(--cafe-blue)",
              transition: "width 0.3s ease",
            }}
          />
        </div>

        {/* 비용 — 진행바 아래 한 줄. mono 폰트 + 큰 글씨 */}
        <div style={{ marginTop: 14 }}>
          <div
            style={{
              fontSize: 11,
              color: "var(--ink-dim)",
              textTransform: "uppercase",
              letterSpacing: 0.3,
              marginBottom: 2,
            }}
          >
            참가비
          </div>
          <div
            style={{
              fontFamily: "var(--ff-mono)",
              fontWeight: 700,
              fontSize: 22,
              color: isFree ? "var(--ok)" : "var(--ink)",
              lineHeight: 1.1,
            }}
          >
            {isFree ? "무료" : `₩${feeNum.toLocaleString()}`}
          </div>
          {entryFeeNote && (
            <div
              style={{ fontSize: 12, color: "var(--ink-dim)", marginTop: 4 }}
            >
              {entryFeeNote}
            </div>
          )}
        </div>
      </div>

      {/* 2. 신청 폼 본체 (CTA + 신청자 정보 카드 + 한마디 + 동의 체크박스) */}
      <div
        style={{
          padding: "18px 20px",
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        {/* 2-1. 신청자 정보 카드 (Phase C 결정 4=A) — 로그인 + 미신청 + 호스트 아님 일 때만 노출.
            시안 GameDetail.jsx L101-107 정합 */}
        {showApplicantInfo && (
          <div>
            <div
              style={{
                fontSize: 11,
                color: "var(--ink-dim)",
                fontWeight: 700,
                marginBottom: 4,
                letterSpacing: 0.3,
              }}
            >
              신청자 정보
            </div>
            {/* 본인 프로필 미리보기 — bg-alt 카드 + 닉네임 + L.skill · position 메타 */}
            <div
              style={{
                padding: "10px 12px",
                background: "var(--bg-alt)",
                borderRadius: 6,
              }}
            >
              <div style={{ fontWeight: 700, fontSize: 13, color: "var(--ink)" }}>
                {myDisplay}
              </div>
              {myMeta && (
                <div
                  style={{
                    fontSize: 11,
                    color: "var(--ink-dim)",
                    fontFamily: "var(--ff-mono)",
                    marginTop: 2,
                  }}
                >
                  {myMeta}
                </div>
              )}
            </div>

            {/* skill_level select — 시안 결정 4=A 채택. UI 만 (form state).
                apply-button.tsx 의 fetch body 변경 0 → API 응답 키 변경 0.
                이유: 본인 프로필의 기본값을 보여주되, 실력 변동 시 신청 시점에 업데이트
                의도를 시각적으로 안내. 추후 큐 (5C) 에서 실제 전송 활성화 가능. */}
            <div style={{ marginTop: 8 }}>
              <label
                style={{
                  display: "block",
                  fontSize: 11,
                  color: "var(--ink-dim)",
                  fontWeight: 700,
                  marginBottom: 4,
                  letterSpacing: 0.3,
                }}
                htmlFor="apply-panel-skill-level"
              >
                실력 (선택)
              </label>
              <select
                id="apply-panel-skill-level"
                className="input"
                value={skillLevel}
                onChange={(e) => setSkillLevel(e.target.value)}
                // form state 만 — 서버 전송 X (운영 흐름 유지, 결정 5=B)
              >
                <option value="">선택 안함</option>
                <option value="1">L.1 (입문)</option>
                <option value="2">L.2</option>
                <option value="3">L.3 (초급)</option>
                <option value="4">L.4</option>
                <option value="5">L.5 (중급)</option>
                <option value="6">L.6</option>
                <option value="7">L.7 (상급)</option>
                <option value="8">L.8</option>
                <option value="9">L.9 (고수)</option>
              </select>
            </div>

            {/* 한마디 textarea (Phase C 결정 5=B) — UI 만 박제. message 필드 서버 전송 X.
                추후 큐 (5C): game_applications.message 전송 활성화 시 form 통합. */}
            <div style={{ marginTop: 8 }}>
              <label
                style={{
                  display: "block",
                  fontSize: 11,
                  color: "var(--ink-dim)",
                  fontWeight: 700,
                  marginBottom: 4,
                  letterSpacing: 0.3,
                }}
                htmlFor="apply-panel-message"
              >
                한마디 (선택)
              </label>
              <textarea
                id="apply-panel-message"
                className="input"
                rows={3}
                placeholder="호스트에게 한마디 남기기"
                style={{ resize: "vertical", fontFamily: "inherit" }}
                // form state 없이 uncontrolled — 미전송 안내 (운영 흐름 유지)
                // 추후 큐 (5C) 에서 useState 추가 + GameApplyButton 으로 message 전달
              />
              <div
                style={{
                  fontSize: 11,
                  color: "var(--ink-dim)",
                  marginTop: 4,
                }}
              >
                ※ 한마디 전송 기능은 준비 중입니다.
              </div>
            </div>

            {/* 동의 체크박스 (Phase C 결정 5=B) — UI 만 박제. 검증/차단 동작 0.
                시안 GameDetail.jsx L112-115 정합. */}
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: 12,
                color: "var(--ink-soft)",
                marginTop: 8,
                cursor: "pointer",
              }}
            >
              <input type="checkbox" defaultChecked />
              <span>취소 시 최소 3시간 전 통보에 동의</span>
            </label>
          </div>
        )}

        {/* 2-2. 메인 CTA — 호스트 / 비로그인 / 신청상태별 분기 (운영 흐름 유지, 결정 6=B) */}
        <div>
          {!isLoggedIn && (
            <p
              style={{
                fontSize: 13,
                color: "var(--ink-dim)",
                textAlign: "center",
                margin: 0,
                padding: "12px 0",
              }}
            >
              로그인 후 신청할 수 있습니다.
            </p>
          )}

          {isLoggedIn && isHost && (
            <p
              style={{
                fontSize: 13,
                color: "var(--ink-dim)",
                textAlign: "center",
                margin: 0,
                padding: "12px 0",
              }}
            >
              내가 개설한 경기입니다.
            </p>
          )}

          {/* 로그인 + 호스트 아님 + 미신청 → 신청 버튼 (운영 그대로 — apply-button.tsx fetch 변경 0) */}
          {isLoggedIn && !isHost && myApplicationStatus == null && (
            <GameApplyButton
              gameId={gameId}
              profileCompleted={profileCompleted}
              missingFields={missingFields}
              gameStatus={gameStatus}
            />
          )}

          {/* 로그인 + 호스트 아님 + 대기중 → 취소 버튼 */}
          {isLoggedIn && !isHost && myApplicationStatus === 0 && (
            <CancelApplyButton gameId={gameId} />
          )}

          {/* 로그인 + 호스트 아님 + 승인됨 → 성공 배지 */}
          {isLoggedIn && !isHost && myApplicationStatus === 1 && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "10px 12px",
                borderRadius: 6,
                background: "rgba(22,163,74,0.10)",
                border: "1px solid var(--ok)",
                color: "var(--ok)",
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              <span
                className="material-symbols-outlined"
                style={{ fontSize: 18 }}
              >
                check_circle
              </span>
              참가가 승인되었습니다.
            </div>
          )}

          {/* 거절당한 경우 (myApplicationStatus === 2) */}
          {isLoggedIn && !isHost && myApplicationStatus === 2 && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "10px 12px",
                borderRadius: 6,
                background: "rgba(220,38,38,0.10)",
                border: "1px solid var(--bdr-red)",
                color: "var(--bdr-red)",
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              <span
                className="material-symbols-outlined"
                style={{ fontSize: 18 }}
              >
                cancel
              </span>
              신청이 거절되었습니다.
            </div>
          )}
        </div>

        {/* 2-3. 보조 버튼: 문의만 노출 (한마디/저장은 DB 미구현 → 숨김).
            DB 미구현 — Phase 10 백로그 (Dev/design/phase-9-future-features.md 5-2)
            - 한마디: game_applications.message 서버 미전송 → 위 textarea 는 UI만 (Phase C)
            - 저장: bookmarks 테이블 추가 필요
            DB 구현 후 한마디 전송 활성화 + 저장 버튼 부활 가능. */}
        <button
          type="button"
          className="btn btn--sm"
          onClick={handleContact}
          style={{ fontSize: 12, width: "100%" }}
        >
          <span
            className="material-symbols-outlined"
            style={{ fontSize: 16, marginRight: 2 }}
          >
            mail
          </span>
          호스트에게 문의
        </button>

        {/* 2-4. 하단 인원 요약 — 자리남음 위쪽에 이미 표시했으나, 상세 "현재 인원" 1줄 추가 (시안 일관성) */}
        <div
          style={{
            paddingTop: 10,
            borderTop: "1px solid var(--border)",
            display: "flex",
            justifyContent: "space-between",
            fontSize: 12,
            color: "var(--ink-dim)",
          }}
        >
          <span>현재 인원</span>
          <span
            style={{
              fontFamily: "var(--ff-mono)",
              fontWeight: 700,
              color: "var(--ink-soft)",
            }}
          >
            {cur}/{max || "?"}명
          </span>
        </div>
      </div>
    </aside>
  );
}

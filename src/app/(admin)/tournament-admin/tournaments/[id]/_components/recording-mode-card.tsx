"use client";

/**
 * 2026-05-11 — Phase 1 tournament-admin "기록 모드 설정" 카드.
 *
 * 사용자 결재:
 *   §1 위치 = tournament-admin 대시보드 카드
 *   §2 정책 = (c) 하이브리드 (대회 default + 매치별 override)
 *   §3 라디오 3개 = all / new_only / exclude_in_progress
 *
 * 동작:
 *   1. 모드 토글 (Flutter / 전자기록지) — 현재 default 강조 표시
 *   2. scope 라디오 3개 (영향 매치 범위)
 *   3. 사유 textarea (5자 이상 — server-side zod 와 동일)
 *   4. 적용 버튼 → confirm modal (영향 매치 수 미리보기) → POST /bulk
 *   5. 응답 후 toast + 페이지 새로고침 (router.refresh)
 *
 * 디자인 룰:
 *   - var(--color-*) 토큰만 (CLAUDE.md §디자인 핵심)
 *   - 관리자 Toss 키트: Icon wrapper + ts-* 클래스
 *   - 모바일/PC 동일 — ts-card + 토글 + 라디오
 */

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
// Track B-c Toss 리스킨 — Material Symbols → lucide-react 키트(<Icon>)
import { Icon } from "@/components/admin-toss";

// 2026-06-22: "manual"(수기) 추가 — BDR 기록 시스템 미사용 대회.
type Mode = "flutter" | "paper" | "manual";
type Scope = "all" | "new_only" | "exclude_in_progress";

interface Props {
  tournamentId: string;
  defaultMode: Mode;
  matchStats: {
    total: number;
    paper: number;
    flutter: number;
    manual: number;
    inProgress: number;
  };
}

// 라디오 옵션 메타 — 사용자에게 노출할 카피 + scope 키
const SCOPE_OPTIONS: Array<{ value: Scope; label: string; desc: string }> = [
  {
    value: "all",
    label: "모든 매치 일괄 적용",
    desc: "모든 매치의 기록 모드를 선택한 값으로 변경합니다.",
  },
  {
    value: "new_only",
    label: "미설정 경기만 적용",
    desc: "운영자가 한번도 모드를 지정하지 않은 매치만 변경합니다.",
  },
  {
    value: "exclude_in_progress",
    label: "진행 중 경기 제외",
    desc: "진행 중 경기를 제외한 나머지 경기만 변경합니다.",
  },
];

// 모드 라벨 매핑 — Flutter 기록앱 / 전자기록지(웹) / 수기(BDR 미사용)
const MODE_LABEL: Record<Mode, string> = {
  flutter: "기록앱",
  paper: "전자기록지",
  manual: "수기",
};

// lucide 키트 이름 — Material videogame_asset/description 대체
const MODE_ICON: Record<Mode, string> = {
  flutter: "gamepad-2", // videogame_asset
  paper: "file-text", // description
  manual: "pencil", // 수기 — BDR 시스템 밖에서 손으로 기록
};

export function RecordingModeCard({
  tournamentId,
  defaultMode,
  matchStats,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  // 사용자가 변경하려는 신규 모드 — 처음에는 현재 default 와 동일 표시
  const [selectedMode, setSelectedMode] = useState<Mode>(defaultMode);
  // 영향 범위 라디오 — 기본 "exclude_in_progress" (가장 안전)
  const [scope, setScope] = useState<Scope>("exclude_in_progress");
  // 사유 — 5자 이상 (server-side zod 동일 룰)
  const [reason, setReason] = useState("");
  // confirm modal 노출 여부
  const [confirmOpen, setConfirmOpen] = useState(false);
  // 결과/에러 메시지 (inline 표시 — toast 라이브러리 없이)
  const [resultMsg, setResultMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // 적용 버튼 클릭 — 사유 검증 후 confirm modal 열기
  const handleApplyClick = () => {
    setResultMsg(null);
    if (reason.trim().length < 5) {
      setResultMsg({
        type: "error",
        text: "변경 사유를 5자 이상 입력해주세요.",
      });
      return;
    }
    setConfirmOpen(true);
  };

  // confirm modal "변경 적용" 클릭 — 실제 POST 호출
  const handleConfirm = () => {
    setConfirmOpen(false);
    setResultMsg(null);
    startTransition(async () => {
      try {
        const res = await fetch(
          `/api/web/admin/tournaments/${tournamentId}/recording-mode/bulk`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              mode: selectedMode,
              scope,
              reason: reason.trim(),
            }),
          }
        );
        const data = await res.json();
        if (!res.ok) {
          // 서버 에러 — error 키 (apiError 컨벤션 — string 또는 zod 첫 메시지)
          setResultMsg({
            type: "error",
            text:
              typeof data.error === "string"
                ? data.error
                : "모드 변경에 실패했습니다.",
          });
          return;
        }
        // 성공 — affected_count + mode 표시 (snake_case — apiSuccess 변환)
        setResultMsg({
          type: "success",
          text: `${data.affected_count}건 경기 기록 방식 변경 완료 (${MODE_LABEL[data.mode as Mode]})`,
        });
        // 사유 초기화 (다음 변경 위해)
        setReason("");
        // 페이지 새로고침 — server-side stats 재계산
        router.refresh();
      } catch (err) {
        console.error("[RecordingModeCard] fetch failed:", err);
        setResultMsg({
          type: "error",
          text: "네트워크 오류로 모드 변경에 실패했습니다.",
        });
      }
    });
  };

  return (
    <section data-skin="toss" className="ts-card rm-card">
      {/* 헤더 — 아이콘 + 타이틀 */}
      <div className="rm-card__head">
        {/* Material tune → lucide sliders-horizontal */}
        <Icon name="sliders-horizontal" size={22} color="var(--primary)" />
        <h3 className="rm-card__title">기록 모드 설정</h3>
      </div>

      {/* 현재 상태 요약 — 대회 default + 매치별 통계 */}
      <div className="rm-summary">
        <div className="rm-summary__row">
          <span className="rm-summary__label">대회 기본:</span>
          <span className="rm-summary__mode">{MODE_LABEL[defaultMode]}</span>
        </div>
        <div className="rm-summary__stats">
          <span>총 {matchStats.total}건</span>
          <span>기록앱 {matchStats.flutter}건</span>
          <span>전자기록지 {matchStats.paper}건</span>
          <span>수기 {matchStats.manual}건</span>
          {matchStats.inProgress > 0 && (
            <span className="rm-summary__active">
              진행중 {matchStats.inProgress}건
            </span>
          )}
        </div>
      </div>

      {/* 모드 토글 — Flutter / 전자기록지 2개 버튼 */}
      <div className="rm-field">
        <div className="rm-field-label">
          새 모드 선택
        </div>
        {/* 2026-06-22: 2지선다 → 3지선다(수기 추가). grid-cols-3 로 자연 확장 */}
        <div className="rm-mode-grid">
          {(["flutter", "paper", "manual"] as Mode[]).map((m) => {
            const active = selectedMode === m;
            return (
              <button
                key={m}
                type="button"
                onClick={() => setSelectedMode(m)}
                className={["rm-mode-btn", active ? "is-active" : ""].join(" ")}
                aria-pressed={active}
              >
                {/* MODE_ICON = lucide 키트 이름(gamepad-2/file-text) */}
                <Icon name={MODE_ICON[m]} size={18} />
                {MODE_LABEL[m]}
              </button>
            );
          })}
        </div>

        {/* 수기 모드 안내 — selectedMode="manual" 일 때만 의미 1줄 노출 */}
        {selectedMode === "manual" && (
          <div className="rm-note">
            <Icon name="info" size={14} color="var(--primary)" />
            <span>
              수기 = 앱과 전자기록지를 사용하지 않는 방식입니다.
            </span>
          </div>
        )}
      </div>

      {/* 영향 범위 라디오 — 3개 옵션 */}
      <div className="rm-field">
        <div className="rm-field-label">
          적용 범위
        </div>
        <div className="rm-scope-list">
          {SCOPE_OPTIONS.map((opt) => (
            <label
              key={opt.value}
              className={["rm-scope", scope === opt.value ? "is-active" : ""].join(" ")}
            >
              <input
                type="radio"
                name="recording-mode-scope"
                value={opt.value}
                checked={scope === opt.value}
                onChange={() => setScope(opt.value)}
                className="rm-scope__radio"
              />
              <div>
                <div className="rm-scope__title">{opt.label}</div>
                <div className="rm-scope__desc">
                  {opt.desc}
                </div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* 사유 textarea — 5자 이상 (server-side zod) */}
      <div className="rm-field">
        <label
          className="rm-field-label"
          htmlFor="recording-mode-reason"
        >
          변경 사유 <span className="rm-required">*</span>
        </label>
        <textarea
          id="recording-mode-reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={2}
          maxLength={500}
          placeholder="결승은 전자기록지 운영"
          className="ts-input rm-textarea"
        />
        <div className="rm-count">
          {reason.length} / 500자 (최소 5자)
        </div>
      </div>

      {/* 결과 메시지 (inline) */}
      {resultMsg && (
        <div
          className="rm-message"
          data-tone={resultMsg.type}
        >
          {resultMsg.text}
        </div>
      )}

      {/* 적용 버튼 */}
      <div className="rm-actions">
        <button
          type="button"
          onClick={handleApplyClick}
          disabled={pending}
          className="ts-btn ts-btn--primary ts-btn--sm"
        >
          {pending ? "처리 중..." : "모드 변경 적용"}
        </button>
      </div>

      {/* Confirm modal — 영향 매치 수 미리보기 */}
      {confirmOpen && (
        <ConfirmModal
          onCancel={() => setConfirmOpen(false)}
          onConfirm={handleConfirm}
          selectedMode={selectedMode}
          scope={scope}
          matchStats={matchStats}
        />
      )}
    </section>
  );
}

// confirm modal — server-side 정확한 영향 매치 수는 모르지만 (settings JSON 분기 필요),
// scope 라디오 룰에 따라 client-side 미리보기 산출 (대략값 — 실제 affected_count 는 응답에서 확인)
function ConfirmModal({
  onCancel,
  onConfirm,
  selectedMode,
  scope,
  matchStats,
}: {
  onCancel: () => void;
  onConfirm: () => void;
  selectedMode: Mode;
  scope: Scope;
  matchStats: Props["matchStats"];
}) {
  // 미리보기 산출 — scope 별 대략 영향 매치 수
  // (현재 mode 와 다른 매치만 변경 — 정확한 수는 server-side audit 박제 시 확정)
  const previewCount = (() => {
    if (scope === "all") return matchStats.total;
    if (scope === "exclude_in_progress") return matchStats.total - matchStats.inProgress;
    // new_only — 정확한 수는 server-side (settings 에 recording_mode 키 없는 매치만)
    // client-side 추산 = total - (이미 명시된 매치) — 보수적으로 total 표시
    return matchStats.total;
  })();

  return (
    <div
      data-skin="toss"
      className="rm-confirm-overlay"
      onClick={onCancel}
    >
      <div
        className="rm-confirm-card"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="rm-confirm-head">
          {/* Material warning → lucide triangle-alert */}
          <Icon name="triangle-alert" size={22} color="var(--primary)" />
          <h4 className="rm-confirm-title">기록 방식 변경 확인</h4>
        </div>
        <p className="rm-confirm-copy">
          최대 <strong className="rm-confirm-accent">{previewCount}건</strong>의 매치가{" "}
          <strong>{MODE_LABEL[selectedMode]}</strong> 방식으로 변경됩니다.
          <br />
          <span>
            이미 같은 방식인 경기는 자동 제외됩니다.
          </span>
        </p>
        <div className="rm-confirm-actions">
          <button
            type="button"
            onClick={onCancel}
            className="ts-btn ts-btn--secondary ts-btn--sm"
          >
            취소
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="ts-btn ts-btn--primary ts-btn--sm"
          >
            변경 적용
          </button>
        </div>
      </div>
    </div>
  );
}

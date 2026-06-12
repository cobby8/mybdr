"use client";

/**
 * /admin/notifications — 관리자 알림 발송 페이지
 *
 * 관리자가 시스템 알림을 대상별로 발송할 수 있는 폼 페이지.
 * target: 전체 / 일반유저 / 관리자 (팀장 = 준비 중 · 전송 차단)
 * POST /api/web/admin/notifications 호출
 */

// 2026-05-04: (web) 디자인 시스템 통일 (Phase C-3)
// - <Card> wrapper → div + 토큰
// - 발송 버튼 → .btn .btn--primary
//
// 2026-06-12: 9C-4 NA1 v2.29 박제 (BN4)
// - 발송 대상 <select> → target 4 chip 행 (전체/일반/팀장/관리자)
//   · 팀장(leader) = disabled + "준비 중" 뱃지 → setTarget 호출 안 함(state 진입 불가)
//     → API validTargets(all/admin/active) 에 leader 미포함 → 400 원천 차단
// - 미리보기 카드 (제목/내용 입력값 실시간) 신규
// - 발송 확인 모달 ("X 대상에게 발송") 신규 — 모달 "발송" 클릭 = 기존 handleSubmit 호출
// - ★ 가드: handleSubmit / fetch / state(title·content·target·actionUrl·sending·result) /
//          기존 3 target 비즈 로직 0 변경. 카테고리 chip = 생략(API notification_type 고정).

import { useState, FormEvent } from "react";
import Link from "next/link"; // Admin-6 박제 — 시안 actions "활동 로그" Link 신규
import { AdminPageHeader } from "@/components/admin/admin-page-header";

// (web) 시안 카드 패턴
const CARD_CLASS = "rounded-[var(--radius-card)] border p-4 sm:p-5";
const CARD_STYLE: React.CSSProperties = {
  borderColor: "var(--color-border)",
  backgroundColor: "var(--color-card)",
  boxShadow: "var(--shadow-card)",
};

// 발송 대상 chip 정의 — NA1 시안 NA1_TARGETS 4종 박제.
// ★ leader(팀장)는 disabled:true — User 모델에 role 컬럼 없음 + API validTargets
//   (all/admin/active) 미지원. "준비 중"으로 표기하고 선택(setTarget) 자체를 차단해
//   state 에 leader 가 들어가지 않게 함 → API 400 원천 차단.
// 카운트(시안 mock 수치)는 DB 미지원이라 박제하지 않음 (라벨/아이콘만).
const TARGET_OPTIONS: {
  value: string;
  label: string;
  icon: string;
  desc: string;
  disabled?: boolean;
}[] = [
  { value: "all", label: "전체 유저", icon: "public", desc: "모든 가입 유저" },
  { value: "active", label: "일반 유저", icon: "person", desc: "관리자 제외 활성 유저" },
  {
    value: "leader",
    label: "팀장",
    icon: "shield_person",
    desc: "팀장 권한 대상",
    disabled: true, // 준비 중 — 전송 차단
  },
  { value: "admin", label: "관리자", icon: "admin_panel_settings", desc: "관리자만" },
];

export default function AdminNotificationsPage() {
  // 폼 상태 — 기존 그대로 (0 변경)
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [target, setTarget] = useState("all");
  const [actionUrl, setActionUrl] = useState("");

  // UI 상태 — 기존 그대로 (0 변경)
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  // 9C-4 신규 — 발송 확인 모달 노출 여부 (순수 UI state, 비즈 로직 무관)
  const [confirmOpen, setConfirmOpen] = useState(false);

  // 현재 선택된 target 의 라벨 (모달/버튼 문구용)
  const currentTarget = TARGET_OPTIONS.find((t) => t.value === target);

  // 알림 발송 처리 — 기존 fetch/흐름 0 변경
  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    setSending(true);
    setResult(null);

    try {
      const res = await fetch("/api/web/admin/notifications", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          content: content.trim() || undefined,
          target,
          action_url: actionUrl.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setResult({ ok: true, message: `${data.sent_count}명에게 알림을 발송했습니다.` });
        // 폼 초기화
        setTitle("");
        setContent("");
        setActionUrl("");
      } else {
        setResult({ ok: false, message: data.error || "발송에 실패했습니다." });
      }
    } catch {
      setResult({ ok: false, message: "네트워크 오류가 발생했습니다." });
    } finally {
      setSending(false);
    }
  }

  // 9C-4 신규 — 모달 "발송" 확인 → 모달 닫고 기존 handleSubmit 그대로 호출.
  // 이유: 시안 NA1 발송 버튼은 확인 모달을 경유. fetch 로직(handleSubmit)은 건드리지 않고
  //      모달을 한 단계 끼워 넣기만 함. handleSubmit 은 e.preventDefault() 만 사용하므로
  //      buttonEvent(MouseEvent) 를 그대로 전달해도 안전(런타임에 preventDefault 존재).
  function handleConfirmSend(buttonEvent: { preventDefault: () => void }) {
    setConfirmOpen(false);
    void handleSubmit(buttonEvent as FormEvent);
  }

  return (
    <div>
      {/* Admin-6 박제 — 시안 v2.14 AdminNotifications.jsx 헤더 패턴 카피 */}
      {/* eyebrow + subtitle + breadcrumbs + actions (활동 로그 Link) 신규 */}
      {/* POST /api/web/admin/notifications 비즈 로직 보존 — handleSubmit / fetch / state 0 변경 */}
      <AdminPageHeader
        eyebrow="ADMIN · 시스템"
        title="알림 발송"
        subtitle="시스템 알림을 대상별로 발송합니다. 일반 유저 대상 발송은 신중히 진행하세요."
        breadcrumbs={[
          { label: "ADMIN" },
          { label: "시스템" },
          { label: "알림 발송" },
        ]}
        actions={
          <Link href="/admin/logs" className="btn">
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
              list_alt
            </span>
            활동 로그
          </Link>
        }
      />

      {/* 9C-4: 작성 form(좌) + 미리보기(우) 2열 그리드 (NA1 nt-na-grid 박제) */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_320px]">
        {/* === 작성 form === */}
        <div className={CARD_CLASS} style={CARD_STYLE}>
          {/* 발송 버튼은 모달 경유 — form onSubmit 은 유지하되 직접 submit 대신
              setConfirmOpen(true) 로 모달을 띄움. (handleSubmit 자체는 모달에서 호출) */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!title.trim()) return;
              setConfirmOpen(true);
            }}
            className="space-y-5"
          >
            {/* 알림 제목 (필수) */}
            <div>
              <label
                htmlFor="notif-title"
                className="mb-1 block text-sm font-semibold"
                style={{ color: "var(--color-text-primary)" }}
              >
                제목 <span style={{ color: "var(--color-error)" }}>*</span>
              </label>
              <input
                id="notif-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="알림 제목을 입력하세요"
                maxLength={100}
                required
                className="w-full rounded-lg border px-4 py-2.5 text-sm outline-none transition-colors focus:border-[var(--color-primary)]"
                style={{
                  backgroundColor: "var(--color-surface)",
                  borderColor: "var(--color-border)",
                  color: "var(--color-text-primary)",
                }}
              />
            </div>

            {/* 알림 내용 (선택) */}
            <div>
              <label
                htmlFor="notif-content"
                className="mb-1 block text-sm font-semibold"
                style={{ color: "var(--color-text-primary)" }}
              >
                내용
              </label>
              <textarea
                id="notif-content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="알림 내용을 입력하세요 (선택)"
                rows={3}
                maxLength={500}
                className="w-full resize-none rounded-lg border px-4 py-2.5 text-sm outline-none transition-colors focus:border-[var(--color-primary)]"
                style={{
                  backgroundColor: "var(--color-surface)",
                  borderColor: "var(--color-border)",
                  color: "var(--color-text-primary)",
                }}
              />
            </div>

            {/* 발송 대상 — 9C-4: <select> → target 4 chip 행 (NA1 nt-target 박제) */}
            <div>
              <label
                className="mb-1 block text-sm font-semibold"
                style={{ color: "var(--color-text-primary)" }}
              >
                발송 대상
              </label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {TARGET_OPTIONS.map((opt) => {
                  const isOn = target === opt.value && !opt.disabled;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      // ★ 팀장(disabled) chip 은 setTarget 호출 안 함 → state 진입 불가 → API 400 차단
                      onClick={() => {
                        if (opt.disabled) return;
                        setTarget(opt.value);
                      }}
                      disabled={opt.disabled}
                      aria-pressed={isOn}
                      title={opt.disabled ? "준비 중 — 발송 대상으로 선택할 수 없습니다" : opt.desc}
                      className="flex flex-col items-start gap-1 rounded-lg border p-3 text-left transition-colors"
                      style={{
                        borderColor: isOn ? "var(--color-primary)" : "var(--color-border)",
                        backgroundColor: isOn
                          ? "color-mix(in oklab, var(--color-primary) 10%, transparent)"
                          : "var(--color-surface)",
                        color: "var(--color-text-primary)",
                        cursor: opt.disabled ? "not-allowed" : "pointer",
                        opacity: opt.disabled ? 0.55 : 1,
                      }}
                    >
                      <span className="flex w-full items-center justify-between gap-1">
                        <span
                          className="material-symbols-outlined"
                          style={{
                            fontSize: 18,
                            color: isOn ? "var(--color-primary)" : "var(--color-text-muted)",
                          }}
                        >
                          {opt.icon}
                        </span>
                        {/* 팀장 = "준비 중" 뱃지 (warn-soft 톤) */}
                        {opt.disabled && (
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 2,
                              fontSize: 9,
                              fontWeight: 800,
                              letterSpacing: ".08em",
                              color: "var(--warn)",
                              background: "color-mix(in oklab, var(--warn) 14%, transparent)",
                              border: "1px solid color-mix(in oklab, var(--warn) 32%, transparent)",
                              padding: "1px 5px",
                              borderRadius: 4,
                            }}
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: 11 }}>
                              schedule
                            </span>
                            준비 중
                          </span>
                        )}
                        {/* 선택됨 표시 */}
                        {isOn && (
                          <span
                            className="material-symbols-outlined"
                            style={{ fontSize: 16, color: "var(--color-primary)" }}
                          >
                            check_circle
                          </span>
                        )}
                      </span>
                      <span className="text-sm font-semibold">{opt.label}</span>
                      <span
                        className="text-xs"
                        style={{ color: "var(--color-text-muted)" }}
                      >
                        {opt.desc}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 액션 URL (선택) */}
            <div>
              <label
                htmlFor="notif-url"
                className="mb-1 block text-sm font-semibold"
                style={{ color: "var(--color-text-primary)" }}
              >
                이동 URL
              </label>
              <input
                id="notif-url"
                type="text"
                value={actionUrl}
                onChange={(e) => setActionUrl(e.target.value)}
                placeholder="/tournaments/123 (선택, 알림 클릭 시 이동)"
                className="w-full rounded-lg border px-4 py-2.5 text-sm outline-none transition-colors focus:border-[var(--color-primary)]"
                style={{
                  backgroundColor: "var(--color-surface)",
                  borderColor: "var(--color-border)",
                  color: "var(--color-text-primary)",
                }}
              />
            </div>

            {/* 결과 메시지 */}
            {result && (
              <div
                className="flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium"
                style={{
                  backgroundColor: result.ok ? "var(--color-success-bg, rgba(16,185,129,0.1))" : "var(--color-error-bg, rgba(239,68,68,0.1))",
                  color: result.ok ? "var(--color-success, #10b981)" : "var(--color-error)",
                }}
              >
                <span className="material-symbols-outlined text-lg">
                  {result.ok ? "check_circle" : "error"}
                </span>
                {result.message}
              </div>
            )}

            {/* 발송 버튼 — (web) .btn .btn--primary 패턴. 클릭 = 확인 모달 오픈 */}
            <button
              type="submit"
              disabled={sending || !title.trim()}
              className="btn btn--primary w-full flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {sending ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  발송 중...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-lg">send</span>
                  알림 발송
                </>
              )}
            </button>
          </form>
        </div>

        {/* === 미리보기 (NA1 nt-preview 박제) === */}
        <aside>
          <div
            className="mb-2 text-xs font-bold"
            style={{ letterSpacing: ".1em", color: "var(--color-text-muted)" }}
          >
            미리보기
          </div>
          <div className={CARD_CLASS} style={CARD_STYLE}>
            {/* 미리보기 바 — "MyBDR · 알림" */}
            <div
              className="mb-3 flex items-center gap-1.5 border-b pb-2 text-xs font-semibold"
              style={{ borderColor: "var(--color-border)", color: "var(--color-text-muted)" }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                smartphone
              </span>
              MyBDR · 알림
            </div>
            {/* 미리보기 본문 — 제목 입력 시 알림 카드, 아니면 placeholder */}
            {title.trim() ? (
              <div className="flex gap-2.5">
                <span
                  className="material-symbols-outlined flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full"
                  style={{
                    background: "color-mix(in oklab, var(--color-primary) 12%, transparent)",
                    color: "var(--color-primary)",
                    fontSize: 19,
                  }}
                >
                  notifications
                </span>
                <div className="min-w-0 flex-1">
                  <div
                    className="mb-0.5 text-xs"
                    style={{ color: "var(--color-text-muted)" }}
                  >
                    방금
                  </div>
                  <div
                    className="text-sm font-bold"
                    style={{ color: "var(--color-text-primary)" }}
                  >
                    {title}
                  </div>
                  {content.trim() && (
                    <div
                      className="mt-0.5 text-xs leading-relaxed"
                      style={{ color: "var(--color-text-muted)" }}
                    >
                      {content}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div
                className="py-6 text-center text-xs"
                style={{ color: "var(--color-text-muted)" }}
              >
                제목을 입력하면 미리보기가 표시됩니다
              </div>
            )}
          </div>

          {/* NU1 수신 안내 (NA1 bl-refund-note 박제) */}
          <div
            className="mt-3 flex items-start gap-2 rounded-lg border p-3 text-xs"
            style={{
              borderColor: "var(--cafe-blue-hair)",
              background: "var(--cafe-blue-soft)",
              color: "var(--cafe-blue-deep)",
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
              hub
            </span>
            <div>
              <div className="font-bold">사용자 알림에 표시됩니다</div>
              <div className="mt-0.5">
                발송된 알림은 수신자의 알림 화면에 카테고리별로 표시됩니다.
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* === 9C-4: 발송 확인 모달 (NA1 bl-modal 박제) === */}
      {confirmOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,.5)" }}
          onClick={() => setConfirmOpen(false)}
          role="presentation"
        >
          <div
            className="w-full max-w-md rounded-[var(--radius-card)] border"
            style={{
              borderColor: "var(--color-border)",
              backgroundColor: "var(--color-card)",
              boxShadow: "var(--shadow-card)",
            }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            {/* 모달 헤더 */}
            <div
              className="flex items-center justify-between border-b px-5 py-4"
              style={{ borderColor: "var(--color-border)" }}
            >
              <h3
                className="flex items-center gap-2 text-base font-bold"
                style={{ color: "var(--color-text-primary)" }}
              >
                <span
                  className="material-symbols-outlined"
                  style={{ color: "var(--color-primary)", fontSize: 20 }}
                >
                  send
                </span>
                알림을 발송할까요?
              </h3>
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                className="flex h-7 w-7 items-center justify-center rounded"
                style={{ color: "var(--color-text-muted)" }}
                aria-label="닫기"
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                  close
                </span>
              </button>
            </div>

            {/* 모달 본문 */}
            <div className="px-5 py-4">
              {/* 경고 박스 (warn-soft 톤 — 취소 불가 안내) */}
              <div
                className="mb-4 flex items-start gap-2 rounded-lg p-3"
                style={{
                  background: "color-mix(in oklab, var(--warn) 14%, transparent)",
                  border: "1px solid color-mix(in oklab, var(--warn) 32%, transparent)",
                }}
              >
                <span
                  className="material-symbols-outlined"
                  style={{ color: "var(--warn)", fontSize: 18 }}
                >
                  priority_high
                </span>
                <div className="text-xs" style={{ color: "var(--color-text-primary)" }}>
                  <div className="font-bold">
                    {currentTarget?.label ?? "전체 유저"} 대상에게 발송됩니다
                  </div>
                  <div className="mt-0.5" style={{ color: "var(--color-text-muted)" }}>
                    발송 후 취소할 수 없습니다. 대상과 내용을 다시 확인하세요.
                  </div>
                </div>
              </div>

              {/* 요약 — 대상 / 제목 */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between gap-3">
                  <span style={{ color: "var(--color-text-muted)" }}>대상</span>
                  <span className="font-semibold" style={{ color: "var(--color-text-primary)" }}>
                    {currentTarget?.label ?? "전체 유저"}
                  </span>
                </div>
                <div className="flex justify-between gap-3">
                  <span style={{ color: "var(--color-text-muted)" }}>제목</span>
                  <span
                    className="truncate text-right font-semibold"
                    style={{ color: "var(--color-text-primary)" }}
                  >
                    {title.trim() || "—"}
                  </span>
                </div>
              </div>
            </div>

            {/* 모달 푸터 — 취소 / 발송 (발송 = 기존 handleSubmit 호출) */}
            <div
              className="flex justify-end gap-2 border-t px-5 py-4"
              style={{ borderColor: "var(--color-border)" }}
            >
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                className="btn"
              >
                취소
              </button>
              <button
                type="button"
                disabled={sending}
                onClick={handleConfirmSend}
                className="btn btn--primary flex items-center gap-1.5 disabled:opacity-50"
              >
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                  send
                </span>
                발송
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

// ============================================================
// _notifications.tsx — 컷오버 알림 발송(클라). 레거시 notifications 1:1 동작.
//   발송 = 기존 POST /api/web/admin/notifications fetch 그대로(백엔드 0변경).
//   ★ 가드: handleSubmit / fetch / state(title·content·target·actionUrl·sending) /
//          기존 3 target 비즈 로직(all/active/admin) 0 변경. leader(팀장)는 disabled
//          → setTarget 차단 → state 진입 불가 → API validTargets 400 원천 차단.
//   디자인: admin-v2 키트(PageHead/Btn/Badge/Icon/Modal) + ts-* + var(--*) 토큰만.
//     ⚠ 하드코딩 색상(#fff/hex/rgba) 0. pill 9999px 0.
// ============================================================

import React, { FormEvent } from "react";
import Link from "next/link";
import {
  PageHead,
  Btn,
  Badge,
  Icon,
  Modal,
  useAdminShell,
} from "@/components/admin-v2";

// 발송 대상 chip — 레거시 TARGET_OPTIONS 1:1(leader 는 disabled).
//   카운트(시안 mock)는 DB 미지원이라 박제하지 않음(라벨/아이콘만).
const TARGET_OPTIONS: {
  value: string;
  label: string;
  icon: string;
  desc: string;
  disabled?: boolean;
}[] = [
  { value: "all", label: "전체 유저", icon: "globe", desc: "모든 가입 유저" },
  { value: "active", label: "일반 유저", icon: "user", desc: "관리자 제외 활성 유저" },
  { value: "leader", label: "팀장", icon: "shield", desc: "팀장 권한 대상", disabled: true },
  { value: "admin", label: "관리자", icon: "shield-check", desc: "관리자만" },
];

export function NotificationsConsole() {
  const { toast } = useAdminShell();

  // 폼 상태 — 레거시 그대로(0 변경)
  const [title, setTitle] = React.useState("");
  const [content, setContent] = React.useState("");
  const [target, setTarget] = React.useState("all");
  const [actionUrl, setActionUrl] = React.useState("");

  // UI 상태 — 레거시 그대로(0 변경) + 확인 모달
  const [sending, setSending] = React.useState(false);
  const [confirmOpen, setConfirmOpen] = React.useState(false);

  const currentTarget = TARGET_OPTIONS.find((t) => t.value === target);

  // ── 알림 발송 처리 — 기존 fetch/흐름 0 변경(백엔드 0변경) ──
  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    setSending(true);

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
        toast(`${data.sent_count}명에게 알림을 발송했습니다`);
        // 폼 초기화(레거시 동일)
        setTitle("");
        setContent("");
        setActionUrl("");
      } else {
        toast(data.error || "발송에 실패했습니다");
      }
    } catch {
      toast("네트워크 오류가 발생했습니다");
    } finally {
      setSending(false);
    }
  }

  // 모달 "발송" 확인 → 모달 닫고 기존 handleSubmit 그대로 호출(레거시 1:1)
  function handleConfirmSend(buttonEvent: { preventDefault: () => void }) {
    setConfirmOpen(false);
    void handleSubmit(buttonEvent as FormEvent);
  }

  return (
    <div>
      <PageHead
        eyebrow="백오피스 · 시스템"
        title="알림 발송"
        sub="시스템 알림을 대상별로 발송합니다. 일반 유저 대상 발송은 신중히 진행하세요."
        actions={
          <Link href="/v2/logs" className="ts-btn ts-btn--secondary ts-btn--sm">
            <Icon name="list-checks" size={15} />
            활동 로그
          </Link>
        }
      />

      {/* 작성 폼(좌) + 미리보기(우) — flex-wrap 으로 모바일 자연 스택(CSS 수정 0) */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 20, alignItems: "flex-start" }}>
        {/* === 작성 폼 === */}
        <div className="ts-card" style={{ flex: "1 1 360px", minWidth: 0 }}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!title.trim()) return;
              setConfirmOpen(true);
            }}
            style={{ display: "flex", flexDirection: "column", gap: 18 }}
          >
            {/* 제목(필수) */}
            <div>
              <label
                htmlFor="notif-title"
                style={{ display: "block", marginBottom: 6, fontSize: 13, fontWeight: 700, color: "var(--ink)" }}
              >
                제목 <span style={{ color: "var(--danger)" }}>*</span>
              </label>
              <input
                id="notif-title"
                className="ts-input"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="알림 제목을 입력하세요"
                maxLength={100}
                required
              />
            </div>

            {/* 내용(선택) */}
            <div>
              <label
                htmlFor="notif-content"
                style={{ display: "block", marginBottom: 6, fontSize: 13, fontWeight: 700, color: "var(--ink)" }}
              >
                내용
              </label>
              <textarea
                id="notif-content"
                className="ts-textarea"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="알림 내용을 입력하세요"
                rows={3}
                maxLength={500}
              />
            </div>

            {/* 발송 대상 — 4 chip(leader disabled) */}
            <div>
              <label style={{ display: "block", marginBottom: 6, fontSize: 13, fontWeight: 700, color: "var(--ink)" }}>
                발송 대상
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0,1fr))", gap: 8 }} className="bo-notif-targets">
                {TARGET_OPTIONS.map((opt) => {
                  const isOn = target === opt.value && !opt.disabled;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      // ★ leader(disabled) chip 은 setTarget 호출 안 함 → state 진입 불가 → API 400 차단
                      onClick={() => {
                        if (opt.disabled) return;
                        setTarget(opt.value);
                      }}
                      disabled={opt.disabled}
                      aria-pressed={isOn}
                      title={opt.disabled ? "준비 중 — 발송 대상으로 선택할 수 없습니다" : opt.desc}
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "flex-start",
                        gap: 4,
                        padding: 12,
                        textAlign: "left",
                        borderRadius: "var(--radius-input)",
                        border: `1px solid ${isOn ? "var(--primary)" : "var(--border-strong)"}`,
                        background: isOn ? "color-mix(in oklab, var(--primary) 10%, transparent)" : "var(--card)",
                        color: "var(--ink)",
                        cursor: opt.disabled ? "not-allowed" : "pointer",
                        opacity: opt.disabled ? 0.55 : 1,
                      }}
                    >
                      <span style={{ display: "flex", width: "100%", alignItems: "center", justifyContent: "space-between", gap: 4 }}>
                        <Icon name={opt.icon} size={18} color={isOn ? "var(--primary)" : "var(--ink-mute)"} />
                        {opt.disabled && <Badge tone="warn" icon="clock">준비 중</Badge>}
                        {isOn && <Icon name="circle-check" size={16} color="var(--primary)" />}
                      </span>
                      <span style={{ fontSize: 14, fontWeight: 700 }}>{opt.label}</span>
                      <span style={{ fontSize: 12, color: "var(--ink-mute)" }}>{opt.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 이동 URL(선택) */}
            <div>
              <label
                htmlFor="notif-url"
                style={{ display: "block", marginBottom: 6, fontSize: 13, fontWeight: 700, color: "var(--ink)" }}
              >
                이동 URL
              </label>
              <input
                id="notif-url"
                className="ts-input"
                type="text"
                value={actionUrl}
                onChange={(e) => setActionUrl(e.target.value)}
                placeholder="/tournaments/123"
              />
            </div>

            {/* 발송 버튼 — 클릭 = 확인 모달 오픈 */}
            <Btn type="submit" variant="primary" block disabled={sending || !title.trim()} icon="send">
              {sending ? "발송 중…" : "알림 발송"}
            </Btn>
          </form>
        </div>

        {/* === 미리보기 === */}
        <aside style={{ flex: "1 1 280px", minWidth: 0 }}>
          <div style={{ marginBottom: 8, fontSize: 12, fontWeight: 800, letterSpacing: ".1em", color: "var(--ink-mute)" }}>
            미리보기
          </div>
          <div className="ts-card">
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                marginBottom: 12,
                paddingBottom: 8,
                borderBottom: "1px solid var(--border)",
                fontSize: 12,
                fontWeight: 700,
                color: "var(--ink-mute)",
              }}
            >
              <Icon name="smartphone" size={14} />
              MyBDR · 알림
            </div>
            {title.trim() ? (
              <div style={{ display: "flex", gap: 10 }}>
                <span
                  style={{
                    display: "flex",
                    flexShrink: 0,
                    width: 36,
                    height: 36,
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: "50%",
                    background: "color-mix(in oklab, var(--primary) 12%, transparent)",
                    color: "var(--primary)",
                  }}
                >
                  <Icon name="bell" size={19} />
                </span>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ marginBottom: 2, fontSize: 12, color: "var(--ink-mute)" }}>방금</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ink)" }}>{title}</div>
                  {content.trim() && (
                    <div style={{ marginTop: 2, fontSize: 12, lineHeight: 1.5, color: "var(--ink-mute)" }}>{content}</div>
                  )}
                </div>
              </div>
            ) : (
              <div style={{ padding: "24px 0", textAlign: "center", fontSize: 12, color: "var(--ink-mute)" }}>
                제목을 입력하면 미리보기가 표시됩니다
              </div>
            )}
          </div>

          {/* 수신 안내 */}
          <div
            className="ts-card ts-card--tight"
            style={{ marginTop: 12, display: "flex", alignItems: "flex-start", gap: 8 }}
          >
            <Icon name="share-2" size={16} color="var(--primary)" />
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)" }}>사용자 알림에 표시됩니다</div>
              <div style={{ marginTop: 2, fontSize: 12, color: "var(--ink-mute)" }}>
                발송된 알림은 수신자의 알림 화면에 카테고리별로 표시됩니다.
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* === 발송 확인 모달 === */}
      <Modal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="알림을 발송할까요?"
        maxWidth={460}
        foot={
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, width: "100%" }}>
            <Btn variant="secondary" onClick={() => setConfirmOpen(false)}>
              취소
            </Btn>
            <Btn variant="primary" disabled={sending} onClick={handleConfirmSend} icon="send">
              발송
            </Btn>
          </div>
        }
      >
        {/* 경고 박스 — 취소 불가 안내 */}
        <div
          style={{
            marginBottom: 16,
            display: "flex",
            alignItems: "flex-start",
            gap: 8,
            padding: 12,
            borderRadius: "var(--radius-input)",
            background: "color-mix(in oklab, var(--warn) 14%, transparent)",
            border: "1px solid color-mix(in oklab, var(--warn) 32%, transparent)",
          }}
        >
          <Icon name="triangle-alert" size={18} color="var(--warn)" />
          <div style={{ fontSize: 13, color: "var(--ink)" }}>
            <div style={{ fontWeight: 700 }}>{currentTarget?.label ?? "전체 유저"} 대상에게 발송됩니다</div>
            <div style={{ marginTop: 2, color: "var(--ink-mute)" }}>발송 후 취소할 수 없습니다. 대상과 내용을 다시 확인하세요.</div>
          </div>
        </div>

        {/* 요약 */}
        <div className="bo-field">
          <span className="bo-field__k">대상</span>
          <span className="bo-field__v">{currentTarget?.label ?? "전체 유저"}</span>
        </div>
        <div className="bo-field">
          <span className="bo-field__k">제목</span>
          <span className="bo-field__v">{title.trim() || "—"}</span>
        </div>
      </Modal>
    </div>
  );
}

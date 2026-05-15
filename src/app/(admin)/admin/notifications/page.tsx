"use client";

/**
 * /admin/notifications — 관리자 알림 발송 페이지
 *
 * 관리자가 시스템 알림을 대상별로 발송할 수 있는 폼 페이지.
 * target: 전체 / 일반유저 / 팀장 / 관리자
 * POST /api/web/admin/notifications 호출
 */

// 2026-05-04: (web) 디자인 시스템 통일 (Phase C-3)
// - <Card> wrapper → div + 토큰
// - 발송 버튼 → .btn .btn--primary

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

// 발송 대상 옵션 (User 모델에 role 없음, isAdmin으로 구분)
const TARGET_OPTIONS = [
  { value: "all", label: "전체 유저" },
  { value: "active", label: "일반 유저 (관리자 제외)" },
  { value: "admin", label: "관리자만" },
];

export default function AdminNotificationsPage() {
  // 폼 상태
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [target, setTarget] = useState("all");
  const [actionUrl, setActionUrl] = useState("");

  // UI 상태
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  // 알림 발송 처리
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

      <div className={CARD_CLASS} style={CARD_STYLE}>
        <form onSubmit={handleSubmit} className="space-y-5">
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

          {/* 발송 대상 */}
          <div>
            <label
              htmlFor="notif-target"
              className="mb-1 block text-sm font-semibold"
              style={{ color: "var(--color-text-primary)" }}
            >
              발송 대상
            </label>
            <select
              id="notif-target"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              className="w-full rounded-lg border px-4 py-2.5 text-sm outline-none transition-colors focus:border-[var(--color-primary)]"
              style={{
                backgroundColor: "var(--color-surface)",
                borderColor: "var(--color-border)",
                color: "var(--color-text-primary)",
              }}
            >
              {TARGET_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
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

          {/* 발송 버튼 — (web) .btn .btn--primary 패턴 */}
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
    </div>
  );
}

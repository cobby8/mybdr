"use client";

import { useState } from "react";

interface Props {
  userId: string;
  nickname: string;
  isWithdrawn: boolean;
  forceWithdrawAction: (formData: FormData) => Promise<void>;
  deleteAction: (formData: FormData) => Promise<void>;
}

export function AdminUserActions({ userId, nickname, isWithdrawn, forceWithdrawAction, deleteAction }: Props) {
  const [confirm, setConfirm] = useState<"withdraw" | "delete" | null>(null);
  const [pending, setPending] = useState(false);

  const handleAction = async (action: (formData: FormData) => Promise<void>) => {
    setPending(true);
    const fd = new FormData();
    fd.set("user_id", userId);
    await action(fd);
    setPending(false);
    setConfirm(null);
  };

  // 2026-05-04: (web) 디자인 시스템 통일 (Phase C-3)
  // 자체 rounded bg-* → .btn .btn--sm + 위험 톤 inline color
  if (confirm) {
    const isDelete = confirm === "delete";
    return (
      <div className="flex items-center gap-1">
        <span className="text-xs" style={{ color: "var(--color-error)" }}>
          {isDelete ? "삭제" : "탈퇴"}?
        </span>
        <button
          onClick={() => handleAction(isDelete ? deleteAction : forceWithdrawAction)}
          disabled={pending}
          className="btn btn--sm disabled:opacity-50"
          style={{ background: "var(--color-error)", color: "#fff", borderColor: "var(--color-error)" }}
        >
          {pending ? "..." : "확인"}
        </button>
        <button
          onClick={() => setConfirm(null)}
          disabled={pending}
          className="btn btn--sm"
        >
          취소
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1">
      {!isWithdrawn && (
        <button
          onClick={() => setConfirm("withdraw")}
          className="btn btn--sm"
          style={{ borderColor: "var(--color-warning)", color: "var(--color-warning)" }}
        >
          강제탈퇴
        </button>
      )}
      <button
        onClick={() => setConfirm("delete")}
        className="btn btn--sm"
        style={{ borderColor: "var(--color-error)", color: "var(--color-error)" }}
      >
        삭제
      </button>
    </div>
  );
}

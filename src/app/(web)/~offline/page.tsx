"use client";

export default function OfflinePage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <div className="mb-4 text-5xl">📵</div>
      <h1 className="mb-2 text-xl font-bold text-[var(--color-text-primary)]">오프라인 상태입니다</h1>
      <p className="mb-6 text-sm text-[var(--color-text-muted)]">
        인터넷 연결을 확인하고 다시 시도해주세요.
      </p>
      {/* 2026-05-12 — pill 9999px ❌ → btn--accent (4px 라운딩 표준) */}
      <button
        onClick={() => window.location.reload()}
        className="btn btn--accent"
      >
        다시 시도
      </button>
    </div>
  );
}

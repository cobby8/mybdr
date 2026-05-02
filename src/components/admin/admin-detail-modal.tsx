"use client";

import { useEffect, type ReactNode } from "react";

// 관리자 상세 모달 — 화면 중앙에 플로팅되는 모달
// 행 클릭 시 상세 정보를 보여주는 공통 컴포넌트
interface AdminDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  actions?: ReactNode; // 하단 액션 버튼 영역 (optional)
}

export function AdminDetailModal({
  isOpen,
  onClose,
  title,
  children,
  actions,
}: AdminDetailModalProps) {
  // ESC 키로 모달 닫기 + body 스크롤 잠금
  useEffect(() => {
    if (!isOpen) return;

    // 모달 열리면 body 스크롤 잠금
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    // 반투명 백드롭 — 모바일: items-end (시트), sm+: items-center (가운데 모달) (2026-05-02 Phase C)
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/*
        모달/시트 컨테이너 — 모바일/데스크톱 분기 (Phase C):
        - 모바일 (<sm): 하단 시트 (rounded-t-[20px] + 풀폭 + slide-up 애니메이션)
        - sm+: 가운데 모달 (mx-4 + max-w-lg + scale-in 애니메이션)
      */}
      <div className="relative flex w-full sm:mx-4 sm:max-w-lg max-h-[92vh] sm:max-h-[85vh] flex-col overflow-hidden rounded-t-[20px] sm:rounded-md border-t-4 border-[var(--color-primary)] bg-[var(--color-card)] shadow-[0_-8px_25px_rgba(0,0,0,0.4)] sm:shadow-[0_0_25px_rgba(0,0,0,0.5)] animate-[modal-slide-up_0.25s_ease-out] sm:animate-[modal-in_0.2s_ease-out]">
        {/* 모바일 드래그 핸들 (시각 단서) — sm+ 숨김 */}
        <div className="sm:hidden flex justify-center pt-2 pb-1">
          <div className="h-1 w-10 rounded-full bg-[var(--color-border)]" />
        </div>

        {/* 상단: 제목 + X 닫기 버튼 */}
        <div className="flex items-center justify-between border-b border-[var(--color-border)] px-4 sm:px-5 py-3 sm:py-4">
          <h2 className="text-[15px] font-black uppercase tracking-wide text-[var(--color-text-primary)] pr-1">
            {title}
          </h2>
          <button
            onClick={onClose}
            aria-label="닫기"
            className="flex h-9 w-9 sm:h-8 sm:w-8 items-center justify-center rounded-lg text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-elevated)] hover:text-[var(--color-text-primary)]"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* 본문: 스크롤 가능한 콘텐츠 영역 */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-5 py-3 sm:py-4">{children}</div>

        {/* 하단: 액션 버튼 영역 (actions가 있을 때만 렌더링) */}
        {actions && (
          <div className="border-t border-[var(--color-border)] px-4 sm:px-5 py-3">
            {actions}
          </div>
        )}
      </div>

      {/* 모달 애니메이션 — 모바일 slide-up + 데스크톱 scale-in 정의 */}
      <style jsx global>{`
        @keyframes modal-in {
          from {
            transform: scale(0.95);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
        @keyframes modal-slide-up {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}

// 모달 내부에서 쓸 수 있는 정보 섹션 컴포넌트
// 유저 관리의 InfoSection 패턴을 재사용
export function ModalInfoSection({
  title,
  rows,
}: {
  title: string;
  rows: [string, string | ReactNode | null | undefined][];
}) {
  return (
    <div>
      <p className="mb-1.5 text-[11px] font-black uppercase tracking-widest text-[var(--color-text-muted)] pr-1">
        {title}
      </p>
      <div className="overflow-hidden rounded-md border border-[var(--color-border)]">
        {rows.map(([label, value], i) => (
          <div
            key={label}
            className={`flex items-center px-4 py-2 ${
              i > 0 ? "border-t border-[var(--color-border-subtle)]" : ""
            }`}
          >
            <span className="w-24 shrink-0 text-xs text-[var(--color-text-muted)]">
              {label}
            </span>
            <span className="break-all text-sm text-[var(--color-text-primary)]">
              {value || (
                <span className="text-[var(--color-text-muted)]">-</span>
              )}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

"use client";

// =====================================================================
// drawer.tsx — 우측 슬라이드 상세 드로어 (v2.40 A2 박제)
//   박제 source: Dev/design/BDR v2.40/_admin-unified/au-kit.jsx (Drawer)
//   목록 행 클릭 시 우측에서 미끄러져 들어오는 요약 패널(A3 진입점).
//   풀 상세는 별도 라우트(A4) — Drawer 는 가벼운 요약 + 핵심 액션.
//
//   'use client' — open/onClose state · ESC keydown effect 보유.
//   ESC 키로 닫기는 시안 동일.
// =====================================================================

import React from "react";
import { Icon } from "@/components/admin-toss";

export type DrawerProps = {
  open: boolean; // 열림 여부
  onClose: () => void; // 닫기 핸들러
  title: React.ReactNode; // 헤더 제목
  sub?: React.ReactNode; // 헤더 보조(옵션)
  children?: React.ReactNode; // 본문(보통 DL 요약)
  foot?: React.ReactNode; // 하단 액션 영역(옵션)
};

export function Drawer({
  open,
  onClose,
  title,
  sub,
  children,
  foot,
}: DrawerProps) {
  // ESC 키로 닫기 — 열려있을 때만 리스너 부착(시안 동일)
  React.useEffect(() => {
    if (!open) return;
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onEsc);
    return () => document.removeEventListener("keydown", onEsc);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <>
      {/* 오버레이 클릭 → 닫기 */}
      <div className="au-drawer-overlay" onClick={onClose} />
      <aside className="au-drawer" role="dialog" aria-modal="true">
        <div className="au-drawer__head">
          <div style={{ minWidth: 0 }}>
            <div className="au-drawer__title">{title}</div>
            {sub && <div className="au-drawer__sub">{sub}</div>}
          </div>
          <button
            className="au-drawer__x"
            onClick={onClose}
            type="button"
            aria-label="닫기"
          >
            <Icon name="x" size={18} />
          </button>
        </div>
        <div className="au-drawer__body">{children}</div>
        {foot && <div className="au-drawer__foot">{foot}</div>}
      </aside>
    </>
  );
}

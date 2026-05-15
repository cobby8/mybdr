/**
 * ConfirmModalProvider — score-sheet 전역 confirm 다이얼로그.
 *
 * 2026-05-15 (PR-D-2 / P1-1 분해) — 전수조사 후속. 기존 score-sheet-form.tsx
 * 안 클로저 패턴 (useState + Promise 헬퍼 + JSX 마운트) 을 Context Provider 로
 * 외부화. 호출자는 useConfirm() 만 사용.
 *
 * 동작:
 *   - confirmModal(config) → Promise<string | null>
 *   - 사용자가 옵션 선택 시 = Promise resolve(value)
 *   - ESC / backdrop / 취소 = Promise resolve(null)
 *   - resolve 후 모달 자동 close (호출자가 setConfirmState(null) 불필요)
 *
 * 사용:
 *   const confirmModal = useConfirm();
 *   const choice = await confirmModal({
 *     title: "...",
 *     message: <p>...</p>,
 *     options: [{ value: "ok", label: "확인" }],
 *     size: "md",
 *   });
 *
 * 박제 룰:
 *   - score-sheet route group layout 에 한 번 마운트 (FullscreenProvider 와 동일 위치).
 *   - ConfirmModal 컴포넌트 재사용 (시각/접근성 그대로).
 *   - 동시 열림 0 보장 — 운영자 흐름상 단일 모달 (기존 동작 호환).
 */

"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";
import { ConfirmModal } from "../score-sheet/[matchId]/_components/confirm-modal";

// 모달 옵션 타입 — ConfirmModal 의 ConfirmModalOption 과 1:1
interface ConfirmModalOption {
  value: string;
  label: string;
  isPrimary?: boolean;
  isDestructive?: boolean;
}

export interface ConfirmConfig {
  title: string;
  message: ReactNode;
  options: ConfirmModalOption[];
  /** modal 폭 — md (448px, default) / lg (672px) / xl (768px). 긴 설명서 등에 사용. */
  size?: "md" | "lg" | "xl";
}

interface ConfirmContextValue {
  confirmModal: (cfg: ConfirmConfig) => Promise<string | null>;
}

const ConfirmContext = createContext<ConfirmContextValue | null>(null);

interface ConfirmState extends ConfirmConfig {
  resolve: (value: string | null) => void;
}

export function ConfirmModalProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ConfirmState | null>(null);

  // confirmModal 헬퍼 — Promise 반환 + state 박제.
  //   resolve 호출 후 자동 close (state=null) → 호출자 setConfirmState(null) 불필요.
  const confirmModal = useCallback((cfg: ConfirmConfig): Promise<string | null> => {
    return new Promise((resolve) => {
      setState({ ...cfg, resolve });
    });
  }, []);

  const handleSelect = (value: string) => {
    if (!state) return;
    state.resolve(value);
    setState(null);
  };

  const handleClose = () => {
    if (!state) return;
    state.resolve(null);
    setState(null);
  };

  return (
    <ConfirmContext.Provider value={{ confirmModal }}>
      {children}
      {state && (
        <ConfirmModal
          open
          title={state.title}
          message={state.message}
          options={state.options}
          size={state.size}
          onSelect={handleSelect}
          onClose={handleClose}
        />
      )}
    </ConfirmContext.Provider>
  );
}

/**
 * useConfirm — Provider 안에서만 호출.
 * Provider 미마운트 시 no-op fallback (운영 안전망 — toast-context 패턴 동일).
 */
export function useConfirm(): (cfg: ConfirmConfig) => Promise<string | null> {
  const ctx = useContext(ConfirmContext);
  if (!ctx) {
    if (typeof window !== "undefined") {
      console.warn(
        "[useConfirm] ConfirmModalProvider not found — using no-op fallback (dev hot reload race?)",
      );
    }
    return async () => null;
  }
  return ctx.confirmModal;
}

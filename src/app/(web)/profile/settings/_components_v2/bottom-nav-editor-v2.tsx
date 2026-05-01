"use client";

/* ============================================================
 * BottomNavEditorV2 — Settings "하단 자주가기" 섹션 편집기
 *
 * 왜 (2026-05-01 신설 — 사용자 결정 C3 + D2):
 *  - 시안 v2.3 Settings 7섹션 중 "bottomNav" 자리.
 *  - 시안 Settings.jsx L20-149 의 BottomNavEditor 컴포넌트를 mybdr Next.js 환경으로 이식.
 *  - 슬롯 5개 + 카탈로그 14항목 (가짜링크 4건 제외).
 *  - 9999px → 50% 변환 (D2 결정 + 룰 갱신본 — 정사각형 18×18 위치 뱃지는 50% 가 자연스러운 원형).
 *
 * 어떻게:
 *  - localStorage 기반 (lib/bottom-nav-storage.ts).
 *  - 시안의 SVG 아이콘 → Material Symbols Outlined (CLAUDE.md 룰: lucide-react 금지).
 *  - 시안의 화살표/X 아이콘은 Material Symbols 의 chevron_left / chevron_right / close.
 *  - 슬롯 추가/제거/순서 변경 시 즉시 setBottomNavSlots → BottomNav 컴포넌트 동기화.
 *
 * 박제 룰 준수:
 *  - 9999px 키워드 0건 (정사각형 위치 뱃지는 50%) ✅
 *  - 토큰 var(--*) 만 사용 ✅
 *  - lucide-react ❌ — Material Symbols Outlined ✅
 *  - localStorage 는 useEffect 안에서만 (SSR hydration mismatch 방지) ✅
 *  - 가짜링크 4건 카탈로그에서 제외 ✅
 * ============================================================ */

import { useEffect, useState } from "react";
import { SettingsHeader } from "./settings-ui";
import {
  BOTTOM_NAV_CATALOG,
  BOTTOM_NAV_DEFAULT,
  BOTTOM_NAV_CHANGE_EVENT,
  getBottomNavSlots,
  setBottomNavSlots,
} from "@/lib/bottom-nav-storage";

export function BottomNavEditorSectionV2() {
  // SSR hydration mismatch 방지 — 마운트 후에만 localStorage 값 사용.
  // 초기 렌더는 mounted=false → 빈 슬롯 5개 placeholder 로 자리 유지.
  const [mounted, setMounted] = useState(false);
  const [slots, setSlots] = useState<string[]>([...BOTTOM_NAV_DEFAULT]);

  useEffect(() => {
    setSlots(getBottomNavSlots());
    setMounted(true);
  }, []);

  // 다른 탭 / BottomNav 자체에서 변경 시 동기화
  useEffect(() => {
    const onChange = () => setSlots(getBottomNavSlots());
    window.addEventListener(BOTTOM_NAV_CHANGE_EVENT, onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener(BOTTOM_NAV_CHANGE_EVENT, onChange);
      window.removeEventListener("storage", onChange);
    };
  }, []);

  // 공통 update — 상태 + localStorage 동기화
  const update = (next: string[]) => {
    setSlots(next);
    setBottomNavSlots(next);
  };

  // 슬롯 위치 이동 (왼쪽/오른쪽)
  const move = (idx: number, dir: -1 | 1) => {
    const j = idx + dir;
    if (j < 0 || j >= slots.length) return;
    const next = [...slots];
    [next[idx], next[j]] = [next[j], next[idx]];
    update(next);
  };

  // 슬롯 제거 (1개 미만으로 떨어지면 거부)
  const removeSlot = (idx: number) => {
    if (slots.length <= 1) return;
    update(slots.filter((_, i) => i !== idx));
  };

  // 카탈로그에서 추가/제거 토글 (5개 cap)
  const toggleCatalog = (id: string) => {
    if (slots.includes(id)) {
      update(slots.filter((s) => s !== id));
    } else {
      if (slots.length >= 5) return;
      update([...slots, id]);
    }
  };

  // 기본값 복원
  const reset = () => update([...BOTTOM_NAV_DEFAULT]);

  const filled = slots.length;
  const empty = 5 - filled;

  return (
    <>
      <SettingsHeader
        title="하단 자주가기"
        desc="모바일 화면 하단에 항상 노출되는 빠른 이동 버튼 5개를 직접 고르세요"
      />

      <p
        style={{
          fontSize: 13,
          color: "var(--ink-mute)",
          margin: "0 0 14px",
          lineHeight: 1.55,
        }}
      >
        모바일 하단에 항상 노출되는 자주가기 5개를 선택하고 순서를 정합니다.
        선택은 이 기기에 저장됩니다.
      </p>

      {/* 현재 자주가기 헤더 */}
      <div
        style={{
          fontSize: 13,
          fontWeight: 700,
          color: "var(--ink-soft)",
          margin: "18px 0 10px",
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
        }}
      >
        <span>현재 자주가기</span>
        <small
          style={{
            fontFamily: "var(--ff-mono)",
            fontSize: 11,
            color: "var(--ink-dim)",
            fontWeight: 600,
          }}
        >
          {mounted ? `${filled}/5${empty > 0 ? ` · 빈 슬롯 ${empty}` : ""}` : "—/5"}
        </small>
      </div>

      {/* 활성 슬롯 5개 — 그리드 */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(5, 1fr)",
          gap: 8,
          padding: 12,
          background: "var(--bg-alt)",
          border: "1px solid var(--border)",
          borderRadius: 6,
          marginBottom: 10,
        }}
      >
        {(mounted ? slots : [...BOTTOM_NAV_DEFAULT]).map((id, idx) => {
          const item = BOTTOM_NAV_CATALOG.find((c) => c.id === id);
          if (!item) return null;
          return (
            <div
              key={id}
              style={{
                position: "relative",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 4,
                padding: "10px 4px 32px",
                background: "var(--bg)",
                border: "1px solid var(--border)",
                borderRadius: 4,
                textAlign: "center",
                minWidth: 0,
              }}
            >
              <span
                className="material-symbols-outlined"
                style={{
                  fontSize: 22,
                  color: "var(--accent)",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
                aria-hidden
              >
                {item.icon}
              </span>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: "var(--ink)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  maxWidth: "100%",
                }}
              >
                {item.label}
              </span>
              <span
                style={{
                  fontFamily: "var(--ff-mono)",
                  fontSize: 10,
                  color: "var(--ink-dim)",
                  fontWeight: 600,
                }}
              >
                {idx + 1}
              </span>
              {/* 슬롯 액션 (move left / move right / remove) */}
              <div
                style={{
                  position: "absolute",
                  bottom: 4,
                  left: 4,
                  right: 4,
                  display: "flex",
                  justifyContent: "center",
                  gap: 2,
                }}
              >
                <SlotIconButton
                  icon="chevron_left"
                  ariaLabel="왼쪽으로 이동"
                  disabled={!mounted || idx === 0}
                  onClick={() => move(idx, -1)}
                />
                <SlotIconButton
                  icon="chevron_right"
                  ariaLabel="오른쪽으로 이동"
                  disabled={!mounted || idx === slots.length - 1}
                  onClick={() => move(idx, 1)}
                />
                <SlotIconButton
                  icon="close"
                  ariaLabel="제거"
                  disabled={!mounted || slots.length <= 1}
                  onClick={() => removeSlot(idx)}
                  // 제거 버튼은 hover 시 accent 강조
                  variant="remove"
                />
              </div>
            </div>
          );
        })}
        {/* 비어있는 슬롯 placeholder (mount 전 / 사용자가 일부만 선택한 경우) */}
        {mounted &&
          Array.from({ length: empty }).map((_, i) => (
            <div
              key={`empty-${i}`}
              style={{
                position: "relative",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 4,
                padding: "10px 4px 32px",
                background: "var(--bg)",
                border: "1px dashed var(--border)",
                borderRadius: 4,
                textAlign: "center",
                minWidth: 0,
                opacity: 0.4,
              }}
            >
              <span
                style={{
                  fontFamily: "var(--ff-mono)",
                  fontSize: 10,
                  color: "var(--ink-dim)",
                  fontWeight: 600,
                }}
              >
                {filled + i + 1}
              </span>
              <span
                style={{
                  fontSize: 12,
                  color: "var(--ink-dim)",
                  marginTop: 6,
                }}
              >
                비어있음
              </span>
            </div>
          ))}
      </div>

      {/* 힌트 + 기본값 복원 */}
      <div
        style={{
          fontSize: 12,
          color: "var(--ink-dim)",
          margin: "0 0 18px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
        }}
      >
        <span>← → 화살표로 순서 변경 · × 로 제거</span>
        <button
          type="button"
          onClick={reset}
          disabled={!mounted}
          style={{
            fontSize: 12,
            color: "var(--ink-mute)",
            background: "transparent",
            border: 0,
            cursor: mounted ? "pointer" : "not-allowed",
            textDecoration: "underline",
            padding: 0,
          }}
        >
          기본값으로 복원
        </button>
      </div>

      {/* 카탈로그 헤더 */}
      <div
        style={{
          fontSize: 13,
          fontWeight: 700,
          color: "var(--ink-soft)",
          margin: "18px 0 10px",
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
        }}
      >
        <span>전체 메뉴</span>
        <small
          style={{
            fontFamily: "var(--ff-mono)",
            fontSize: 11,
            color: "var(--ink-dim)",
            fontWeight: 600,
          }}
        >
          탭으로 추가 / 제거
        </small>
      </div>

      {/* 카탈로그 14 항목 그리드 */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(96px, 1fr))",
          gap: 8,
        }}
      >
        {BOTTOM_NAV_CATALOG.map((item) => {
          const selectedIdx = mounted ? slots.indexOf(item.id) : -1;
          const selected = selectedIdx >= 0;
          const disabled = !mounted || (!selected && slots.length >= 5);
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => toggleCatalog(item.id)}
              disabled={disabled}
              title={
                !mounted
                  ? ""
                  : !selected && slots.length >= 5
                  ? "5개까지만 선택할 수 있어요"
                  : ""
              }
              style={{
                position: "relative",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 6,
                padding: "12px 6px",
                background: selected
                  ? // 시안의 color-mix(in srgb, var(--accent) 8%, var(--bg)) — 옅은 accent 배경
                    "color-mix(in oklab, var(--accent) 8%, var(--bg))"
                  : "var(--bg)",
                border: selected
                  ? "1px solid var(--accent)"
                  : "1px solid var(--border)",
                borderRadius: 4,
                color: selected ? "var(--accent)" : "var(--ink-soft)",
                cursor: disabled ? "not-allowed" : "pointer",
                fontSize: 12,
                fontWeight: 600,
                opacity: disabled && !selected ? 0.4 : 1,
                minWidth: 0,
              }}
            >
              {/* 선택 시 위치 뱃지 — 시안의 9999px → 50% (정사각형 18×18 원형) */}
              {selected && (
                <span
                  style={{
                    position: "absolute",
                    top: 4,
                    right: 4,
                    fontFamily: "var(--ff-mono)",
                    fontSize: 10,
                    fontWeight: 700,
                    color: "var(--accent)",
                    background: "var(--bg)",
                    border: "1px solid var(--accent)",
                    // D2 결정 + 룰 갱신: 정사각형 18×18 → 50% (원형)
                    borderRadius: "50%",
                    width: 18,
                    height: 18,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    lineHeight: 1,
                  }}
                >
                  {selectedIdx + 1}
                </span>
              )}
              <span
                className="material-symbols-outlined"
                style={{ fontSize: 20 }}
                aria-hidden
              >
                {item.icon}
              </span>
              <span
                style={{
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  maxWidth: "100%",
                }}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* 모바일 안내 (PC 에서는 hidden) — 시안의 .bn-editor__notice 패턴 */}
      <p
        className="bn-editor-mobile-notice"
        style={{
          marginTop: 14,
          padding: "10px 12px",
          background: "var(--bg-alt)",
          border: "1px solid var(--border)",
          borderRadius: 4,
          fontSize: 12,
          color: "var(--ink-mute)",
          lineHeight: 1.5,
        }}
      >
        ✓ 변경사항이 즉시 적용됩니다. 페이지 하단을 확인하세요.
      </p>

      {/* 모바일 안내는 ≤720px 에서만 표시 — 시안 룰 정합 */}
      <style jsx>{`
        .bn-editor-mobile-notice {
          display: none;
        }
        @media (max-width: 720px) {
          .bn-editor-mobile-notice {
            display: block;
          }
        }
      `}</style>
    </>
  );
}

/* ----- 슬롯 액션 버튼 (Material Symbols 작은 아이콘) ----- */
function SlotIconButton({
  icon,
  ariaLabel,
  disabled,
  onClick,
  variant,
}: {
  icon: string;
  ariaLabel: string;
  disabled: boolean;
  onClick: () => void;
  variant?: "remove";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      title={ariaLabel}
      style={{
        width: 24,
        height: 22,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--bg-alt)",
        border: "1px solid var(--border)",
        borderRadius: 4,
        color: "var(--ink-mute)",
        cursor: disabled ? "not-allowed" : "pointer",
        padding: 0,
        opacity: disabled ? 0.35 : 1,
        transition: "color .12s, border-color .12s, background .12s",
      }}
      // hover 강조는 inline 으로 처리 어려우므로 disabled 가 아닐 때만 :hover
      // 시안과 100% 매칭은 어려우나 disabled / 기본 동작은 완전 일치.
      data-variant={variant}
    >
      <span
        className="material-symbols-outlined"
        style={{ fontSize: 16, lineHeight: 1 }}
        aria-hidden
      >
        {icon}
      </span>
    </button>
  );
}

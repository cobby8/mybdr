"use client";

import type { ReactElement } from "react";

/* ============================================================
 * RefereePickCard (Phase 9 P1-3b · BDR v2)
 *
 * 이유(왜):
 *   심판 배정 요청 화면(RefereeRequest)에서 운영자가 다수 심판을
 *   체크박스 형태로 동시에 선택해야 한다. 시안 L116~L143 의 카드
 *   마크업이 다른 화면(예: 심판 풀, 게임 배정)에서도 재사용될
 *   가능성이 높아 공용 컴포넌트로 분리한다.
 *
 * 동작 모델:
 *   - selected = true 면 accent 보더 + 8% 톤다운 배경
 *   - onToggle 클릭 시 부모가 selected 배열을 갱신 (controlled)
 *   - 좌측 아바타: 이미지 URL 있으면 background-image, 없으면
 *     이름 첫 글자를 이니셜로 표시 (배경색은 시안의 r.color)
 *   - 우측 상단: 체크박스 (시각 표시 — 토글 핸들은 카드 전체)
 *   - badges: 자격/경력/특이사항 등을 .badge--ghost 형태 칩으로
 *
 * 디자인 토큰: --ink / --ink-mute / --ink-dim / --bg / --bg-alt
 *              --border / --accent / --ff-mono
 * ============================================================ */

export interface RefereePick {
  id: string;
  name: string;
  level?: string; // 예: "KBL 2급", "FIBA 3"
  area?: string; // 예: "강남구"
  fee?: number; // 경기당 수당 (표시용)
  avatarColor?: string; // 이니셜 박스 배경색 (없으면 accent)
  badges?: string[]; // 자격/경력 칩
  meta?: string; // 보조 메타 (예: "경력 8년 · 412경기 · ★4.9")
  specialty?: string; // 전문 분야 (이탤릭 표기)
  available?: boolean; // false 면 disabled 처리
}

export interface RefereePickCardProps {
  referee: RefereePick;
  selected: boolean;
  onToggle: () => void;
  className?: string;
}

export function RefereePickCard({
  referee,
  selected,
  onToggle,
  className,
}: RefereePickCardProps): ReactElement {
  // available 미지정 시 기본값 true (선택 가능)
  const isAvailable = referee.available !== false;
  const initial = referee.name.slice(0, 1);
  const avatarBg = referee.avatarColor || "var(--accent)";

  // 카드 외형: 선택 상태일 때 accent 보더 + 톤다운 배경, 비활성 시 흐림 처리
  const borderStyle = selected
    ? "2px solid var(--accent)"
    : "1px solid var(--border)";
  const bgStyle = selected
    ? "color-mix(in srgb, var(--accent) 8%, transparent)"
    : isAvailable
      ? "transparent"
      : "var(--bg-alt)";

  return (
    <button
      type="button"
      onClick={() => isAvailable && onToggle()}
      disabled={!isAvailable}
      className={className}
      style={{
        // 시안 L119~L126 박제: grid 4열 (체크박스 / 아바타 / 본문 / 우측 메타)
        textAlign: "left",
        padding: "14px 16px",
        background: bgStyle,
        border: borderStyle,
        borderRadius: 6,
        cursor: isAvailable ? "pointer" : "not-allowed",
        display: "grid",
        gridTemplateColumns: "auto 44px 1fr auto",
        gap: 12,
        alignItems: "center",
        opacity: isAvailable ? 1 : 0.55,
        width: "100%",
        // 버튼 기본 스타일 리셋: 외곽선/폰트 상속
        font: "inherit",
        color: "inherit",
      }}
    >
      {/* 체크박스: 시각용 (토글 핸들은 버튼 전체) */}
      <input
        type="checkbox"
        checked={selected}
        readOnly
        disabled={!isAvailable}
        style={{ width: 16, height: 16, cursor: "inherit" }}
      />

      {/* 아바타: 이니셜 박스 (시안 Avatar 컴포넌트 박제) */}
      <div
        style={{
          width: 44,
          height: 44,
          background: avatarBg,
          color: "#fff",
          display: "grid",
          placeItems: "center",
          fontFamily: "var(--ff-display)",
          fontWeight: 900,
          fontSize: 16,
          borderRadius: 4,
        }}
      >
        {initial}
      </div>

      {/* 본문: 이름 + level 칩 + meta + specialty */}
      <div>
        <div
          style={{
            display: "flex",
            gap: 6,
            alignItems: "baseline",
            flexWrap: "wrap",
          }}
        >
          <div style={{ fontWeight: 800, fontSize: 14 }}>{referee.name}</div>
          {referee.level && (
            <span className="badge badge--ghost">{referee.level}</span>
          )}
          {referee.area && (
            <span style={{ fontSize: 11, color: "var(--ink-dim)" }}>
              · {referee.area}
            </span>
          )}
          {!isAvailable && <span className="badge badge--red">배정중</span>}
          {/* 추가 badges (자격/경력 등) */}
          {referee.badges?.map((b) => (
            <span key={b} className="badge badge--ghost">
              {b}
            </span>
          ))}
        </div>
        {referee.meta && (
          <div
            style={{
              fontSize: 11,
              color: "var(--ink-dim)",
              fontFamily: "var(--ff-mono)",
              marginTop: 2,
            }}
          >
            {referee.meta}
          </div>
        )}
        {referee.specialty && (
          <div
            style={{
              fontSize: 11,
              color: "var(--ink-soft, var(--ink-mute))",
              marginTop: 3,
              fontStyle: "italic",
            }}
          >
            &ldquo;{referee.specialty}&rdquo;
          </div>
        )}
      </div>

      {/* 우측 메타: 수당 (선택사항) */}
      {typeof referee.fee === "number" && (
        <div style={{ textAlign: "right" }}>
          <div
            style={{
              fontFamily: "var(--ff-mono)",
              fontWeight: 800,
              fontSize: 13,
              color: "var(--ink)",
            }}
          >
            ₩{referee.fee.toLocaleString()}
          </div>
          <div style={{ fontSize: 10, color: "var(--ink-dim)" }}>/ 경기</div>
        </div>
      )}
    </button>
  );
}

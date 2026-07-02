"use client";

/* ============================================================
 * NotifySectionV2 — Settings "알림" 섹션
 *
 * DS v4 구조 리박제 (PR-PUBF-A):
 *  - 시안 정본 `Dev/design/BDR-current/screens/ProfileNotificationSettings.jsx`
 *    의 3섹션 레이아웃(채널 마스터 / 카테고리 매트릭스 / 시간대 우선순위)으로 재구성.
 *  - 본 섹션은 /profile/settings 허브의 단일 카드 안에 렌더되므로,
 *    시안의 3개 카드는 SubH(구분선 헤더)로 나눈 3 서브섹션으로 옮김(중첩 카드 회피).
 *
 * ⚠️ 백엔드 무변경 (UI만) — PATCH/GET /api/web/profile/notification-settings 는
 *    5개 boolean 키(push/game/tournament/team/community)만 지원.
 *    → 실제 저장되는 5키만 동작하도록 배선:
 *        · 채널 마스터: "푸시 알림" = push (실동작)
 *        · 카테고리 매트릭스: "인앱" 열 = game/tournament/team/community (실동작)
 *    → API 미지원 항목은 전부 준비중/disabled (mock 저장 위장 금지):
 *        · 채널: 이메일 / 방해 금지 시간
 *        · 매트릭스: 푸시 / 이메일 열(카테고리별 채널 세분화)
 *        · 알림 시간대 우선순위(DnD) 섹션 전체
 * ============================================================ */

import { useEffect, useState } from "react";
import { SettingsHeader } from "./settings-ui";

// PATCH 가 허용하는 5개 키 (notification-settings/route.ts 의 DEFAULT_SETTINGS)
type NotifyKey = "push" | "game" | "community" | "team" | "tournament";

// 카테고리 매트릭스 행 = 실제 백엔드 카테고리 키 4종. "인앱" 열이 이 키에 배선됨.
const CATEGORY_ROWS: ReadonlyArray<{ key: NotifyKey; label: string; desc: string }> = [
  { key: "game", label: "경기", desc: "신청 승인·리마인더·시작 30분 전" },
  { key: "tournament", label: "대회", desc: "접수 마감·대진표·결과" },
  { key: "team", label: "팀", desc: "가입 신청·승인·공지" },
  { key: "community", label: "커뮤니티", desc: "댓글·답글·멘션" },
] as const;

// 알림 시간대 미리보기(백엔드 미지원 — 준비중 정적 표시)
const TIME_SLOTS = [
  { id: "morning", label: "오전 (06:00–12:00)", desc: "출근 전 빠른 요약" },
  { id: "noon", label: "점심 (12:00–14:00)", desc: "점심 알림 묶음" },
  { id: "evening", label: "저녁 (18:00–22:00)", desc: "경기 임박 알림" },
  { id: "night", label: "야간 (22:00–06:00)", desc: "긴급만 (방해 금지)" },
] as const;

const DEFAULT_SETTINGS: Record<NotifyKey, boolean> = {
  push: true,
  game: true,
  community: true,
  team: true,
  tournament: true,
};

/* -------- 서브섹션 헤더 (시안 SubH) -------- */
function SubH({
  children,
  soon = false,
  hint,
}: {
  children: React.ReactNode;
  soon?: boolean;
  hint?: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "baseline",
        marginBottom: 10,
        paddingBottom: 6,
        borderBottom: "1px solid var(--border)",
      }}
    >
      <div
        style={{
          fontSize: 11,
          fontWeight: 800,
          letterSpacing: ".1em",
          textTransform: "uppercase",
          color: "var(--ink-dim)",
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        {children}
        {soon && (
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: 0,
              textTransform: "none",
              color: "var(--ink-mute)",
              background: "var(--bg-alt)",
              padding: "2px 6px",
              borderRadius: 4,
              border: "1px solid var(--border)",
            }}
            title="준비 중인 기능입니다"
          >
            준비 중
          </span>
        )}
      </div>
      {hint && <span style={{ fontSize: 11, color: "var(--ink-dim)" }}>{hint}</span>}
    </div>
  );
}

/* -------- 토글 행 (채널 마스터용) — settings-ui SettingsToggle 와 동일 룩 -------- */
function ToggleRow({
  label,
  desc,
  checked,
  onChange,
  disabled = false,
  loading = false,
}: {
  label: string;
  desc?: string;
  checked: boolean;
  onChange?: (next: boolean) => void;
  disabled?: boolean;
  loading?: boolean;
}) {
  const handleClick = () => {
    if (disabled || loading) return;
    onChange?.(!checked);
  };
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "14px 0",
        borderBottom: "1px solid var(--border)",
        gap: 12,
        opacity: disabled ? 0.55 : 1,
      }}
    >
      <div>
        <div style={{ fontWeight: 600, fontSize: 14 }}>
          {label}
          {disabled && <SoonBadge />}
        </div>
        {desc && (
          <div style={{ fontSize: 12, color: "var(--ink-mute)", marginTop: 2 }}>{desc}</div>
        )}
      </div>
      <Switch checked={checked} onClick={handleClick} disabled={disabled || loading} label={label} />
    </div>
  );
}

/* -------- 큰 스위치 (44×24) -------- */
function Switch({
  checked,
  onClick,
  disabled,
  label,
}: {
  checked: boolean;
  onClick: () => void;
  disabled: boolean;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={`${label} ${checked ? "끄기" : "켜기"}`}
      onClick={onClick}
      disabled={disabled}
      style={{
        position: "relative",
        width: 44,
        height: 24,
        background: checked ? "var(--cafe-blue)" : "var(--bg-alt)",
        border: "1px solid var(--border)",
        borderRadius: 12,
        cursor: disabled ? "not-allowed" : "pointer",
        transition: "background .2s",
        flexShrink: 0,
      }}
    >
      <span
        style={{
          position: "absolute",
          top: 1,
          left: 1,
          width: 20,
          height: 20,
          background: "var(--bg-elev)",
          borderRadius: "50%",
          transform: checked ? "translateX(20px)" : "translateX(0)",
          transition: "transform .2s",
          boxShadow: "0 1px 3px rgba(0,0,0,.2)",
        }}
      />
    </button>
  );
}

/* -------- 매트릭스 셀용 작은 토글 (40×24) -------- */
function MiniToggle({
  on,
  onChange,
  disabled = false,
  loading = false,
  label,
}: {
  on: boolean;
  onChange?: (v: boolean) => void;
  disabled?: boolean;
  loading?: boolean;
  label: string;
}) {
  const handleClick = () => {
    if (disabled || loading) return;
    onChange?.(!on);
  };
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={handleClick}
      disabled={disabled}
      style={{
        position: "relative",
        width: 40,
        height: 24,
        minWidth: 40,
        padding: 0,
        border: "1px solid var(--border)",
        cursor: disabled ? "not-allowed" : "pointer",
        background: on ? "var(--cafe-blue)" : "var(--bg-alt)",
        borderRadius: 12,
        transition: "background .2s",
        opacity: disabled ? 0.45 : 1,
      }}
    >
      <span
        style={{
          position: "absolute",
          top: 2,
          left: 2,
          width: 18,
          height: 18,
          borderRadius: "50%",
          // 손잡이 — #fff 하드코딩 대신 elev 토큰
          background: "var(--bg-elev)",
          transform: on ? "translateX(16px)" : "translateX(0)",
          transition: "transform .2s",
          boxShadow: "0 1px 3px rgba(0,0,0,.25)",
        }}
      />
    </button>
  );
}

/* -------- "준비 중" 인라인 배지 -------- */
function SoonBadge() {
  return (
    <span
      style={{
        marginLeft: 8,
        fontSize: 11,
        fontWeight: 700,
        color: "var(--ink-mute)",
        background: "var(--bg-alt)",
        padding: "2px 6px",
        borderRadius: 4,
        border: "1px solid var(--border)",
        verticalAlign: "middle",
      }}
      title="준비 중인 기능입니다"
    >
      준비 중
    </span>
  );
}

export function NotifySectionV2() {
  const [settings, setSettings] = useState<Record<NotifyKey, boolean>>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  // 동시에 여러 키 PATCH 가능하도록 saving 키 집합으로 추적
  const [saving, setSaving] = useState<Set<NotifyKey>>(new Set());

  // 마운트 시 현재 알림 설정 조회 (기존 GET 그대로 — 무변경)
  useEffect(() => {
    let aborted = false;
    fetch("/api/web/profile/notification-settings", { credentials: "include" })
      .then(async (r) => {
        if (!r.ok) return;
        const data = await r.json();
        // apiSuccess 응답은 snake_case 직렬화 — settings 그대로 옴
        if (!aborted && data?.settings) {
          setSettings({ ...DEFAULT_SETTINGS, ...data.settings });
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!aborted) setLoading(false);
      });
    return () => {
      aborted = true;
    };
  }, []);

  // 낙관적 업데이트 → PATCH → 실패 시 롤백 (기존 v1 패턴 — 무변경)
  const handleToggle = async (key: NotifyKey, next: boolean) => {
    setSettings((prev) => ({ ...prev, [key]: next }));
    setSaving((prev) => new Set(prev).add(key));
    try {
      const res = await fetch("/api/web/profile/notification-settings", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [key]: next }),
      });
      if (!res.ok) {
        setSettings((prev) => ({ ...prev, [key]: !next }));
      }
    } catch {
      setSettings((prev) => ({ ...prev, [key]: !next }));
    } finally {
      setSaving((prev) => {
        const n = new Set(prev);
        n.delete(key);
        return n;
      });
    }
  };

  return (
    <>
      <SettingsHeader title="알림 설정" desc="채널·카테고리별 알림 수신을 설정하세요" />

      {/* ───────── 서브섹션 1: 채널 (마스터) ───────── */}
      <SubH>채널</SubH>
      {/* 푸시 = 실동작(push 키) */}
      <ToggleRow
        label="푸시 알림"
        desc="모바일 앱·브라우저 즉시 알림"
        checked={settings.push}
        loading={loading || saving.has("push")}
        onChange={(next) => handleToggle("push", next)}
      />
      {/* 이메일 = DB 미지원 → 준비중 */}
      <ToggleRow
        label="이메일 알림"
        desc="일일 요약 + 중요 알림을 이메일로 받음"
        checked={false}
        disabled
      />
      {/* 방해 금지 시간 = DB 미지원 → 준비중 */}
      <ToggleRow
        label="방해 금지 시간 (22:00–06:00)"
        desc="긴급 알림만 통과 — 결제·보안·경기 임박"
        checked={false}
        disabled
      />

      {/* ───────── 서브섹션 2: 카테고리별 발송 채널 (매트릭스) ───────── */}
      <div style={{ marginTop: 28 }}>
        <SubH>카테고리별 발송 채널</SubH>
        <div
          className="pns-matrix"
          style={{
            border: "1px solid var(--border)",
            borderRadius: 6,
            overflow: "hidden",
          }}
        >
          {/* head */}
          <div
            className="pns-matrix__head"
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(0, 1fr) 88px 88px 88px",
              gap: 8,
              padding: "10px 14px",
              background: "var(--bg-alt)",
              fontSize: 11,
              color: "var(--ink-mute)",
              fontWeight: 700,
              letterSpacing: ".06em",
              textTransform: "uppercase",
              borderBottom: "1px solid var(--border)",
            }}
          >
            <div>카테고리</div>
            <div style={{ textAlign: "center" }}>푸시</div>
            <div style={{ textAlign: "center" }}>이메일</div>
            <div style={{ textAlign: "center" }}>인앱</div>
          </div>
          {CATEGORY_ROWS.map((c, i) => (
            <div
              key={c.key}
              className="pns-matrix__row"
              style={{
                display: "grid",
                gridTemplateColumns: "minmax(0, 1fr) 88px 88px 88px",
                gap: 8,
                padding: "14px",
                alignItems: "center",
                borderBottom: i < CATEGORY_ROWS.length - 1 ? "1px solid var(--border)" : 0,
              }}
            >
              <div data-label="카테고리" style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{c.label}</div>
                <div style={{ fontSize: 11, color: "var(--ink-mute)", marginTop: 2 }}>{c.desc}</div>
              </div>
              {/* 푸시 열 — 카테고리별 채널 세분화 미지원 → 준비중(disabled) */}
              <div data-label="푸시" style={{ display: "flex", justifyContent: "center" }}>
                <MiniToggle on={false} disabled label={`${c.label} 푸시 (준비 중)`} />
              </div>
              {/* 이메일 열 — 미지원 → 준비중(disabled) */}
              <div data-label="이메일" style={{ display: "flex", justifyContent: "center" }}>
                <MiniToggle on={false} disabled label={`${c.label} 이메일 (준비 중)`} />
              </div>
              {/* 인앱 열 — 실동작(카테고리 키 game/tournament/team/community) */}
              <div data-label="인앱" style={{ display: "flex", justifyContent: "center" }}>
                <MiniToggle
                  on={settings[c.key]}
                  loading={loading || saving.has(c.key)}
                  onChange={(v) => handleToggle(c.key, v)}
                  label={`${c.label} 인앱`}
                />
              </div>
            </div>
          ))}
        </div>
        {/* 미지원 채널 안내 — 준비중 사유 명시 (mock 아님을 사용자에게 투명하게) */}
        <p style={{ fontSize: 11, color: "var(--ink-dim)", marginTop: 8, lineHeight: 1.6 }}>
          현재 카테고리별 <b>인앱</b> 알림 수신만 저장됩니다. 카테고리별 푸시·이메일 채널
          세분화는 준비 중입니다.
        </p>
      </div>

      {/* ───────── 서브섹션 3: 알림 시간대 우선순위 (준비중 미리보기) ───────── */}
      <div style={{ marginTop: 28 }}>
        <SubH soon hint="준비 중">
          알림 시간대 우선순위
        </SubH>
        <div style={{ display: "flex", flexDirection: "column", gap: 6, opacity: 0.6 }}>
          {TIME_SLOTS.map((s, i) => (
            <div
              key={s.id}
              style={{
                display: "grid",
                gridTemplateColumns: "40px 36px 1fr auto",
                gap: 12,
                padding: "14px",
                minHeight: 56,
                background: "var(--bg-alt)",
                border: "1px solid var(--border)",
                borderRadius: 6,
                alignItems: "center",
                cursor: "not-allowed",
              }}
              aria-disabled
            >
              <span
                style={{
                  width: 28,
                  height: 28,
                  display: "grid",
                  placeItems: "center",
                  background: "var(--bg-elev)",
                  borderRadius: 4,
                  fontFamily: "var(--ff-mono)",
                  fontWeight: 800,
                  fontSize: 13,
                  color: "var(--ink-dim)",
                }}
              >
                {i + 1}
              </span>
              <span style={{ fontSize: 18, color: "var(--ink-dim)", textAlign: "center" }}>⋮⋮</span>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{s.label}</div>
                <div style={{ fontSize: 11, color: "var(--ink-mute)", marginTop: 2 }}>{s.desc}</div>
              </div>
              <span
                style={{
                  fontSize: 10,
                  fontFamily: "var(--ff-mono)",
                  fontWeight: 700,
                  padding: "4px 8px",
                  borderRadius: 3,
                  letterSpacing: ".06em",
                  color: "var(--ink-dim)",
                  background: "var(--bg-elev)",
                  textTransform: "uppercase",
                }}
              >
                {i === 0 ? "최우선" : `우선 #${i + 1}`}
              </span>
            </div>
          ))}
        </div>
        <p style={{ fontSize: 11, color: "var(--ink-dim)", marginTop: 10, lineHeight: 1.6 }}>
          발송 시간대별 우선순위(다이제스트 전환)는 준비 중인 기능입니다. 현재는 순서 변경이
          저장되지 않습니다.
        </p>
      </div>

      {/* 하단 안내 */}
      <p style={{ textAlign: "center", fontSize: 12, color: "var(--ink-dim)", marginTop: 20 }}>
        웹 푸시를 꺼도 앱 내 알림은 정상적으로 수신됩니다
      </p>

      {/* 반응형: 720px 이하에서 매트릭스 열 접기 (시안 동일) */}
      <style jsx>{`
        @media (max-width: 720px) {
          .pns-matrix__head {
            display: none !important;
          }
          .pns-matrix__row {
            grid-template-columns: 1fr 1fr 1fr !important;
            grid-template-rows: auto auto !important;
            gap: 8px !important;
          }
          .pns-matrix__row > [data-label="카테고리"] {
            grid-column: 1 / -1 !important;
          }
          .pns-matrix__row > [data-label]:not([data-label="카테고리"]) {
            display: flex !important;
            flex-direction: column !important;
            align-items: center !important;
            gap: 4px !important;
            padding: 8px 0 !important;
            background: var(--bg-alt) !important;
            border-radius: 4px !important;
          }
          .pns-matrix__row > [data-label]:not([data-label="카테고리"])::before {
            content: attr(data-label);
            font-size: 10px;
            color: var(--ink-dim);
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.06em;
          }
        }
      `}</style>
    </>
  );
}

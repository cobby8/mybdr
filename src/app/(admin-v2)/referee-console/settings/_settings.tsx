"use client";

// ============================================================
// referee-console/settings/_settings.tsx — 설정(클라)
//   ★레거시 (referee)/referee/admin/fee-settings 박제 → admin-v2 디자인.
//     "배정비 단가" 실편집(GET/PUT)을 v2 설정 페이지의 핵심 기능으로 포팅.
//   - 데모 no-op(이전 settings) 대체: 단가는 **실제로 저장**(fee-settings API).
//   - 운영 정책(배정/자격/정산)은 단가와 별개 개념 → 하단에 **읽기전용 참조**로 보존
//     (정본 RF_SETTINGS 그룹 1:1). 가짜 "저장" 버튼 제거(정직).
//   ★mutation = adminFetch GET/PUT /api/web/referee-admin/fee-settings (기존 API·백엔드 0변경).
//     · body camel(feeMain…) → adminFetch 단일 변환점에서 snake(fee_main…)로 변환(서버 zod 계약).
//     · 응답 snake → camel 자동 변환 → 호출부는 camel만 본다.
//   ⚠ super 범위: 기존 API 가 admin.associationId(자동선택 협회)로 강제 → 해당 협회 단가만 편집.
//     PUT 권한은 settlement_manage(사무국장) → 권한 부족 시 403 메시지 화면 노출(레거시 동일).
//   ★admin-v2 키트(PageHead/Btn/Icon/Badge)·ad-panel·ts-*·var(--*) 토큰만 — 하드코딩 색 0.
// ============================================================

import React from "react";
import { PageHead, Btn, Icon, Badge, useAdminShell } from "@/components/admin-v2";
import { adminFetch, AdminApiError } from "@/lib/admin-v2/data/client";

// fee-settings GET/PUT 응답 1행(adminFetch가 snake→camel 변환한 형태).
type FeeSetting = {
  id: string | null;
  associationId: string;
  feeMain: number;
  feeSub: number;
  feeRecorder: number;
  feeTimer: number;
  updatedAt: string | null;
  isDefault: boolean; // true = 아직 저장 전(기본값 표시 중)
};

// 단가 입력 필드 4종(레거시 ROLE_INFO 박제 — camel 키).
//   fee_recorder/fee_timer 둘 다 레거시 라벨이 "경기원"이라 모호 → (기록)/(계시)로 명확화.
//   icon = admin-v2 Icon(lucide kebab). 미매핑 시 빈 span(레이아웃 보존).
const FEE_FIELDS = [
  { key: "feeMain", label: "주심", icon: "flag" },
  { key: "feeSub", label: "부심", icon: "users" },
  { key: "feeRecorder", label: "경기원 (기록)", icon: "clipboard-list" },
  { key: "feeTimer", label: "경기원 (계시)", icon: "timer" },
] as const;

type FeeKey = (typeof FEE_FIELDS)[number]["key"];

// 천단위 콤마(표시 전용).
const formatMoney = (n: number) => n.toLocaleString("ko-KR");

// ── 운영 정책 그룹(정본 RF_SETTINGS 1:1 · 읽기전용 참조) ──
//   단가와 별개 개념. 협회별 정책 실편집은 후속(전역 단일 저장처 없음) → 표시만.
type PolicyItem = { label: string; desc: string; value: string; on?: boolean };
type PolicyGroup = { group: string; items: PolicyItem[] };
const POLICY_GROUPS: PolicyGroup[] = [
  {
    group: "배정 정책",
    items: [
      { label: "자동 배정 추천", desc: "등급·지역 기반으로 후보 심판을 자동 추천합니다.", value: "", on: true },
      { label: "일정 충돌 차단", desc: "같은 시간대 중복 배정을 자동으로 막습니다.", value: "", on: true },
      { label: "기본 배정 구성", desc: "공인 경기의 기본 심판 구성입니다.", value: "주심 1 · 부심 2" },
    ],
  },
  {
    group: "자격·검증",
    items: [
      { label: "자격 만료 알림", desc: "자격증 만료 30일 전 자동 알림을 보냅니다.", value: "", on: true },
      { label: "수습 해제 기준", desc: "신규 심판의 수습 해제에 필요한 경기 수입니다.", value: "5경기" },
    ],
  },
  {
    group: "정산",
    items: [
      { label: "정산 주기", desc: "심판 수당 정산·지급 기준일입니다.", value: "매월 5일" },
      { label: "원천징수 적용", desc: "수당 지급 시 3.3% 원천징수를 자동 계산합니다.", value: "", on: true },
    ],
  },
];

// 입력 스타일(new-form 동일 컨벤션 · var 토큰만).
const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  border: "1px solid var(--border)",
  background: "var(--card)",
  color: "var(--ink)",
  borderRadius: 8,
  fontSize: 14,
  fontWeight: 700,
  fontFamily: "var(--ff)",
};

export function RefereeSettings() {
  const { toast } = useAdminShell();

  // ── 상태 ──
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [isDefault, setIsDefault] = React.useState(false);
  const [updatedAt, setUpdatedAt] = React.useState<string | null>(null);
  // 입력 값은 string 보관(레거시 박제 — 콤마/포커스 처리 단순화).
  const [fees, setFees] = React.useState<Record<FeeKey, string>>({
    feeMain: "",
    feeSub: "",
    feeRecorder: "",
    feeTimer: "",
  });

  // GET — 현재 단가표 로드(없으면 기본값 + isDefault=true).
  React.useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const { setting } = await adminFetch<{ setting: FeeSetting }>(
          "/api/web/referee-admin/fee-settings"
        );
        if (!alive) return;
        setFees({
          feeMain: String(setting.feeMain),
          feeSub: String(setting.feeSub),
          feeRecorder: String(setting.feeRecorder),
          feeTimer: String(setting.feeTimer),
        });
        setIsDefault(setting.isDefault);
        setUpdatedAt(setting.updatedAt);
      } catch (e) {
        if (!alive) return;
        setError(
          e instanceof AdminApiError ? e.message : "단가표를 불러오지 못했습니다."
        );
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  // 입력 변경 — 숫자만 추출(레거시 박제).
  const onChange = (key: FeeKey, raw: string) =>
    setFees((s) => ({ ...s, [key]: raw.replace(/[^0-9]/g, "") }));

  // PUT — 단가표 저장(upsert). 정수 변환 + 검증 후 전송.
  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const toInt = (s: string, label: string) => {
        const n = Number.parseInt(s.replace(/[^0-9]/g, ""), 10);
        if (!Number.isFinite(n) || n < 0) {
          throw new Error(`${label} 금액이 올바르지 않습니다.`);
        }
        return n;
      };
      // camel body → adminFetch 단일 변환점에서 snake(fee_main…)로 변환 → 서버 zod 계약 일치.
      const body = {
        feeMain: toInt(fees.feeMain, "주심"),
        feeSub: toInt(fees.feeSub, "부심"),
        feeRecorder: toInt(fees.feeRecorder, "경기원(기록)"),
        feeTimer: toInt(fees.feeTimer, "경기원(계시)"),
      };
      const { setting } = await adminFetch<{ setting: FeeSetting }>(
        "/api/web/referee-admin/fee-settings",
        { method: "PUT", body }
      );
      setIsDefault(setting.isDefault);
      setUpdatedAt(setting.updatedAt);
      toast("단가표가 저장되었습니다");
    } catch (e) {
      setError(
        e instanceof AdminApiError
          ? e.message
          : e instanceof Error
            ? e.message
            : "저장에 실패했습니다."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHead
        eyebrow="심판 콘솔"
        title="설정"
        sub="역할별 배정비 단가를 설정하고, 심판 운영 정책을 확인합니다."
      />

      <div
        style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 720 }}
      >
        {/* ── 에러 ── */}
        {error && (
          <div
            style={{
              fontSize: 13.5,
              color: "var(--danger)",
              background:
                "color-mix(in srgb, var(--danger) 8%, transparent)",
              border: "1px solid var(--danger)",
              borderRadius: 10,
              padding: "12px 14px",
            }}
          >
            {error}
          </div>
        )}

        {/* ── 배정비 단가(실편집) ── */}
        <section className="ad-panel">
          <div
            className="ad-panel__title"
            style={{ marginBottom: 6, display: "flex", alignItems: "center", gap: 8 }}
          >
            배정비 단가
            {!loading && isDefault && (
              <Badge tone="warn" icon="alert-triangle">
                미저장
              </Badge>
            )}
          </div>
          <p
            style={{
              fontSize: 13,
              color: "var(--ink-mute)",
              marginBottom: 16,
              lineHeight: 1.6,
            }}
          >
            역할별 기본 배정비입니다. 새 배정 시 금액을 비우면 이 단가가 자동
            적용되며, 배정이 완료되는 순간 정산이 생성됩니다. 이미 생성된 정산은
            단가 변경의 영향을 받지 않습니다.
          </p>

          {loading ? (
            <div
              style={{
                padding: "24px 0",
                textAlign: "center",
                fontSize: 13,
                color: "var(--ink-mute)",
              }}
            >
              불러오는 중…
            </div>
          ) : (
            <>
              {isDefault && (
                <div
                  style={{
                    fontSize: 13,
                    color: "var(--warn)",
                    background:
                      "color-mix(in srgb, var(--warn) 8%, transparent)",
                    border: "1px solid var(--warn)",
                    borderRadius: 10,
                    padding: "10px 12px",
                    marginBottom: 14,
                  }}
                >
                  아직 단가표가 저장되지 않았습니다. 아래 기본값을 확인 후
                  저장해주세요.
                </div>
              )}

              {/* 4개 입력(2열) */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                  gap: 12,
                }}
              >
                {FEE_FIELDS.map((f) => {
                  const value = fees[f.key];
                  const numeric = Number.parseInt(value || "0", 10) || 0;
                  return (
                    <label
                      key={f.key}
                      style={{
                        display: "block",
                        border: "1px solid var(--border)",
                        background: "var(--bg-card, var(--card))",
                        borderRadius: 10,
                        padding: 14,
                      }}
                    >
                      <span
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          marginBottom: 8,
                          fontSize: 13,
                          fontWeight: 700,
                          color: "var(--ink)",
                        }}
                      >
                        <Icon name={f.icon} size={16} color="var(--primary)" />
                        {f.label}
                      </span>
                      <div style={{ position: "relative" }}>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={value}
                          onChange={(e) => onChange(f.key, e.target.value)}
                          placeholder="0"
                          style={{ ...inputStyle, paddingRight: 36 }}
                        />
                        <span
                          style={{
                            position: "absolute",
                            right: 12,
                            top: "50%",
                            transform: "translateY(-50%)",
                            fontSize: 12,
                            color: "var(--ink-mute)",
                          }}
                        >
                          원
                        </span>
                      </div>
                      <div
                        style={{
                          marginTop: 6,
                          fontSize: 12,
                          color: "var(--ink-mute)",
                          fontFamily: "var(--ff-mono)",
                        }}
                      >
                        {formatMoney(numeric)}원
                      </div>
                    </label>
                  );
                })}
              </div>

              {/* 저장 행 */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                  marginTop: 16,
                  flexWrap: "wrap",
                }}
              >
                <span style={{ fontSize: 12, color: "var(--ink-mute)" }}>
                  {updatedAt
                    ? `최근 저장: ${new Date(updatedAt).toLocaleString("ko-KR")}`
                    : "아직 저장 이력 없음"}
                </span>
                <Btn icon="check" onClick={save} disabled={saving}>
                  {saving ? "저장 중…" : "단가 저장"}
                </Btn>
              </div>
            </>
          )}
        </section>

        {/* ── 운영 정책(읽기전용 참조) ── */}
        {POLICY_GROUPS.map((g) => (
          <section key={g.group} className="ad-panel">
            <div className="ad-panel__title" style={{ marginBottom: 14 }}>
              {g.group}
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              {g.items.map((it, i) => (
                <div
                  key={it.label}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 16,
                    padding: "14px 0",
                    borderTop: i ? "1px solid var(--border)" : "none",
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{ fontSize: 15, fontWeight: 700, color: "var(--ink)" }}
                    >
                      {it.label}
                    </div>
                    <div
                      style={{ fontSize: 13, color: "var(--ink-mute)", marginTop: 3 }}
                    >
                      {it.desc}
                    </div>
                  </div>
                  {/* 토글 정책 = 상태 뱃지(읽기전용) / 값 정책 = primary 텍스트 */}
                  {typeof it.on === "boolean" ? (
                    <Badge tone={it.on ? "ok" : "grey"}>
                      {it.on ? "사용 중" : "꺼짐"}
                    </Badge>
                  ) : (
                    <span
                      style={{
                        fontSize: 14.5,
                        fontWeight: 700,
                        color: "var(--primary)",
                        fontFamily: "var(--ff-mono)",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {it.value}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </section>
        ))}

        <p style={{ fontSize: 12, color: "var(--ink-mute)" }}>
          운영 정책(배정·자격·정산)은 표시 전용입니다. 협회별 정책 편집은 준비
          중입니다.
        </p>
      </div>
    </div>
  );
}

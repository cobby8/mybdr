"use client";

import { useState, useEffect } from "react";
// 사이트 전역 휴대폰 입력 컴포넌트 (conventions.md [2026-05-08] 룰 — 의무 사용)
import { PhoneInput } from "@/components/inputs/phone-input";

/**
 * 대관 관리 페이지
 * 파트너 소유자가 등록한 체육관(court_infos)의 대관 정보를 관리한다.
 * - 대관 가능 여부 토글
 * - 대관 신청 URL
 * - 대관 비용
 * - 운영시간
 */

interface CourtVenueInfo {
  id: string;
  name: string;
  address: string;
  court_type: string;
  rental_available: boolean;
  rental_url: string | null;
  fee: number | null;
  operating_hours: Record<string, string> | null;
  contact_phone: string | null;
}

// ──────────────────────────────────────────────────────────
// 8C-3 — VP2 PartnerVenue 셸 박제 (BV5 ★★★ Court Operator)
// 옵션 A: VP2 셸 + 2 sub-tab(기본정보 / 시간·가격)만 박제.
//   - 정책·통계 탭 미생성 (시안 mock — DB 미지원 → 박제 0)
//   - operating_hours = read-only 표시 (편집 X) / fee = 기존 편집 유지
//   - 데이터 패칭 · handleSave · /api/web/partner/venue PATCH = 0 변경
// ──────────────────────────────────────────────────────────

// VP2 sub-tab 정의 — 시안 4탭 중 옵션 A로 2탭만 채택 (정책·통계 제외)
const VP2_TABS = [
  { key: "basic", lbl: "기본 정보", ico: "badge" },
  { key: "hours", lbl: "시간·가격", ico: "schedule" },
] as const;
type Vp2TabKey = (typeof VP2_TABS)[number]["key"];

// 요일 라벨 — operating_hours read-only 표시용 (DB key → 한글)
const DAY_LABELS: Record<string, string> = {
  mon: "월", tue: "화", wed: "수", thu: "목",
  fri: "금", sat: "토", sun: "일",
};

export default function VenueManagePage() {
  const [courts, setCourts] = useState<CourtVenueInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null); // 저장 중인 court id
  const [editForm, setEditForm] = useState<Record<string, Record<string, string>>>({});
  // VP2 sub-tab 상태 — 코트별이 아닌 페이지 전역 (시안 셸 단일 탭바)
  const [tab, setTab] = useState<Vp2TabKey>("basic");

  // 파트너 소유 코트 목록 조회 (간단한 방식: partner/me에서 owner를 파악 후 코트 조회)
  // 실제로는 별도 API가 필요하지만, 여기서는 클라이언트에서 직접 처리
  useEffect(() => {
    async function loadCourts() {
      try {
        // partner/me에서 파트너 정보를 가져오고, 코트 목록은 별도 조회
        // 현재 구조에서는 partner owner의 court_infos를 조회하는 API가 없으므로
        // 안내 메시지를 표시
        setLoading(false);
      } catch {
        setLoading(false);
      }
    }
    loadCourts();
  }, []);

  // 대관 정보 저장
  async function handleSave(courtId: string) {
    setSaving(courtId);
    try {
      const form = editForm[courtId] || {};
      await fetch("/api/web/partner/venue", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          court_info_id: courtId,
          rental_available: form.rental_available === "true",
          rental_url: form.rental_url || null,
          fee: form.fee ? parseInt(form.fee) : null,
          contact_phone: form.contact_phone || null,
        }),
      });
    } finally {
      setSaving(null);
    }
  }

  // 폼 값 변경 헬퍼
  function updateField(courtId: string, field: string, value: string) {
    setEditForm((prev) => ({
      ...prev,
      [courtId]: { ...prev[courtId], [field]: value },
    }));
  }

  return (
    <div className="space-y-6">
      {/* ──────────────────────────────────────────────────────────
          VP2 박제 — Court Operator 헤더 + sub-tab 바
          시안 .pm-page 헤더(badge + 타이틀 + 저장 버튼)를 운영 토큰으로 박제.
          저장 버튼은 코트 카드별 개별 저장(기존 handleSave)이라 헤더엔 미배치.
          ────────────────────────────────────────────────────────── */}
      <div>
        {/* Court Operator badge — navy+silver (8C-1 답습, Site Operator dark+gold 와 분리) */}
        <span
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[10.5px] font-extrabold uppercase tracking-wider"
          style={{
            background: "linear-gradient(135deg, #1B3C87 0%, #2A4D9E 100%)",
            border: "1px solid #3A5BA8",
            color: "#fff",
          }}
        >
          {/* silver 아이콘 (#C0CCDB) — badge 측 구분 색 */}
          <span className="material-symbols-outlined text-[13px]" style={{ color: "#C0CCDB" }}>
            stadium
          </span>
          Court Operator
        </span>
        <h2 className="text-xl font-bold mt-2.5" style={{ color: "var(--color-text-primary)" }}>
          대관 정보 관리
        </h2>
        <p className="text-sm mt-1" style={{ color: "var(--color-text-muted)" }}>
          등록된 체육관의 대관 정보를 설정하세요.
        </p>
      </div>

      {/* VP2 sub-tab 바 — 시안 .cv-vtabs 박제 (기본 정보 / 시간·가격 2탭) */}
      <div
        className="flex gap-1 rounded-lg p-1"
        style={{ backgroundColor: "var(--color-surface)" }}
      >
        {VP2_TABS.map((t) => {
          const on = tab === t.key; // 활성 탭 여부
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className="flex items-center gap-1.5 px-4 py-2 rounded text-sm font-medium transition-colors"
              style={{
                // 활성 탭은 primary 배경 / 비활성은 투명 + muted 텍스트
                backgroundColor: on ? "var(--color-primary)" : "transparent",
                color: on ? "#fff" : "var(--color-text-muted)",
              }}
            >
              <span className="material-symbols-outlined text-base">{t.ico}</span>
              {t.lbl}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="animate-pulse space-y-4">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="h-40 rounded-lg"
              style={{ backgroundColor: "var(--color-surface)" }}
            />
          ))}
        </div>
      ) : courts.length === 0 ? (
        // 코트가 없는 경우 안내
        <div
          className="rounded-lg border p-8 text-center"
          style={{
            backgroundColor: "var(--color-card)",
            borderColor: "var(--color-border)",
          }}
        >
          <span
            className="material-symbols-outlined text-4xl mb-3 block"
            style={{ color: "var(--color-text-disabled)" }}
          >
            stadium
          </span>
          <p className="text-sm font-medium mb-2" style={{ color: "var(--color-text-primary)" }}>
            등록된 체육관이 없습니다
          </p>
          <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
            체육관을 대관 관리하려면 먼저 농구장 정보를 등록해야 합니다.
          </p>
          <p className="text-xs mt-2" style={{ color: "var(--color-text-muted)" }}>
            관리자에게 체육관 등록을 요청하세요.
          </p>
        </div>
      ) : (
        // 코트 목록 렌더링
        <div className="space-y-4">
          {courts.map((court) => {
            const form = editForm[court.id] || {};
            return (
              <div
                key={court.id}
                className="rounded-lg border p-5 space-y-4"
                style={{
                  backgroundColor: "var(--color-card)",
                  borderColor: "var(--color-border)",
                }}
              >
                {/* 체육관 헤더 */}
                <div className="flex items-center gap-3">
                  <span
                    className="material-symbols-outlined text-xl"
                    style={{ color: "var(--color-info)" }}
                  >
                    {court.court_type === "indoor" ? "stadium" : "sports_basketball"}
                  </span>
                  <div>
                    <p className="text-sm font-bold" style={{ color: "var(--color-text-primary)" }}>
                      {court.name}
                    </p>
                    <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                      {court.address}
                    </p>
                  </div>
                </div>

                {/* ── 기본 정보 탭 ── 대관 가능 여부 / 신청 URL / 담당자 연락처 */}
                {tab === "basic" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* 대관 가능 여부 */}
                  <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: "var(--color-text-secondary)" }}>
                      대관 가능 여부
                    </label>
                    <select
                      value={form.rental_available ?? String(court.rental_available)}
                      onChange={(e) => updateField(court.id, "rental_available", e.target.value)}
                      className="w-full rounded border px-3 py-2 text-sm outline-none"
                      style={{
                        backgroundColor: "var(--color-surface)",
                        borderColor: "var(--color-border)",
                        color: "var(--color-text-primary)",
                      }}
                    >
                      <option value="true">가능</option>
                      <option value="false">불가</option>
                    </select>
                  </div>

                  {/* 대관 신청 URL */}
                  <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: "var(--color-text-secondary)" }}>
                      대관 신청 URL
                    </label>
                    <input
                      type="url"
                      value={form.rental_url ?? (court.rental_url ?? "")}
                      onChange={(e) => updateField(court.id, "rental_url", e.target.value)}
                      className="w-full rounded border px-3 py-2 text-sm outline-none"
                      style={{
                        backgroundColor: "var(--color-surface)",
                        borderColor: "var(--color-border)",
                        color: "var(--color-text-primary)",
                      }}
                      placeholder="https://booking.example.com"
                    />
                  </div>

                  {/* 담당자 연락처 */}
                  <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: "var(--color-text-secondary)" }}>
                      담당자 연락처
                    </label>
                    {/* 파트너 admin 장소 담당자 연락처 — PhoneInput 자동 포맷
                        updateField 헬퍼 그대로 (form.contact_phone state 변경 0) */}
                    <PhoneInput
                      value={form.contact_phone ?? (court.contact_phone ?? "")}
                      onChange={(v) => updateField(court.id, "contact_phone", v)}
                      className="w-full rounded border px-3 py-2 text-sm outline-none"
                      style={{
                        backgroundColor: "var(--color-surface)",
                        borderColor: "var(--color-border)",
                        color: "var(--color-text-primary)",
                      }}
                    />
                  </div>
                </div>
                )}

                {/* ── 시간·가격 탭 ── 대관 비용(편집) / 영업시간(read-only) */}
                {tab === "hours" && (
                <div className="space-y-4">
                  {/* 대관 비용 — 기존 fee 편집 유지 (handleSave 그대로) */}
                  <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: "var(--color-text-secondary)" }}>
                      대관 비용 (원)
                    </label>
                    <input
                      type="number"
                      value={form.fee ?? String(court.fee ?? "")}
                      onChange={(e) => updateField(court.id, "fee", e.target.value)}
                      className="w-full sm:w-1/2 rounded border px-3 py-2 text-sm outline-none"
                      style={{
                        backgroundColor: "var(--color-surface)",
                        borderColor: "var(--color-border)",
                        color: "var(--color-text-primary)",
                      }}
                      placeholder="시간당 대관료"
                    />
                  </div>

                  {/* 영업시간 — operating_hours read-only 표시 (시안 .gw-srow 박제, 편집 X)
                      DB operating_hours 필드를 요일별로 노출만. 저장 대상 아님. */}
                  <div>
                    <label className="block text-xs font-medium mb-2" style={{ color: "var(--color-text-secondary)" }}>
                      영업 시간
                    </label>
                    {court.operating_hours && Object.keys(court.operating_hours).length > 0 ? (
                      <div
                        className="rounded border divide-y"
                        style={{ borderColor: "var(--color-border)" }}
                      >
                        {Object.entries(court.operating_hours).map(([day, hours]) => (
                          <div
                            key={day}
                            className="flex items-center justify-between px-3 py-2 text-sm"
                            style={{ borderColor: "var(--color-border)" }}
                          >
                            {/* 요일 라벨 — DAY_LABELS 매핑 없으면 원본 key 노출 */}
                            <span style={{ color: "var(--color-text-secondary)" }}>
                              {DAY_LABELS[day] ?? day}
                            </span>
                            <span style={{ color: "var(--color-text-primary)" }}>{hours}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      // operating_hours 없으면 안내 (시안 mock 대신 빈 상태)
                      <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                        등록된 영업시간 정보가 없습니다.
                      </p>
                    )}
                  </div>
                </div>
                )}

                {/* 저장 버튼 */}
                <div className="flex justify-end">
                  <button
                    onClick={() => handleSave(court.id)}
                    disabled={saving === court.id}
                    className="px-4 py-2 rounded text-sm font-medium transition-colors active:scale-95 disabled:opacity-50"
                    style={{
                      backgroundColor: "var(--color-primary)",
                      color: "#fff",
                    }}
                  >
                    {saving === court.id ? "저장 중..." : "저장"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

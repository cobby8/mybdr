"use client";

import { useState, useEffect } from "react";
// 사이트 전역 휴대폰 입력 컴포넌트 (conventions.md [2026-05-08] 룰 — 의무 사용)
import { PhoneInput } from "@/components/inputs/phone-input";
// Toss 키트 — 아이콘(Icon) · 저장 버튼(Btn)
import { Icon, Btn } from "@/components/admin-toss";

/**
 * 대관 관리 페이지
 * 파트너 소유자가 등록한 체육관(court_infos)의 대관 정보를 관리한다.
 * - 대관 가능 여부 토글
 * - 대관 신청 URL
 * - 대관 비용
 * - 운영시간
 *
 * 2026-06-21 Phase 3 PR-A — Toss 재스킨(비주얼만).
 *   루트 data-skin="toss". H 헤더, sub-tab=.ts-segment, 폼=.ts-field/.ts-input/.ts-select,
 *   영업시간=.ts-card. handleSave/PATCH·VP2_TABS·PhoneInput = 변경 0.
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
// VP2 PartnerVenue — 2 sub-tab(기본정보 / 시간·가격)만 박제.
//   - 정책·통계 탭 미생성 (시안 mock — DB 미지원 → 박제 0)
//   - operating_hours = read-only 표시 (편집 X) / fee = 기존 편집 유지
//   - 데이터 패칭 · handleSave · /api/web/partner/venue PATCH = 0 변경
// ──────────────────────────────────────────────────────────

// VP2 sub-tab 정의 — 시안 4탭 중 옵션 A로 2탭만 채택 (정책·통계 제외).
// ico = lucide name(kebab): badge→id-card, schedule→clock.
const VP2_TABS = [
  { key: "basic", lbl: "기본 정보", ico: "id-card" },
  { key: "hours", lbl: "시간·가격", ico: "clock" },
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
    // data-skin="toss" — 페이지 루트 opt-in
    <div data-skin="toss" className="space-y-6">
      {/* ──────────────────────────────────────────────────────────
          Phase 3 PR-A — Court Operator 헤더(H) + sub-tab 바(.ts-segment)
          저장 버튼은 코트 카드별 개별 저장(기존 handleSave)이라 헤더엔 미배치.
          ────────────────────────────────────────────────────────── */}
      <div style={{ margin: "2px 0 4px" }}>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: "var(--ink)" }}>대관 정보 관리</h2>
        <p style={{ fontSize: 13.5, color: "var(--ink-mute)", marginTop: 4 }}>
          등록된 체육관의 대관 정보를 설정하세요.
        </p>
      </div>

      {/* VP2 sub-tab 바 — Toss 세그먼티드 컨트롤(.ts-segment) (기본 정보 / 시간·가격 2탭) */}
      <div className="ts-segment">
        {VP2_TABS.map((t) => {
          const on = tab === t.key; // 활성 탭 여부
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className="ts-segment__btn"
              data-active={on ? "true" : "false"}
              style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6 }}
            >
              <Icon name={t.ico} size={16} />
              {t.lbl}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="animate-pulse space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-40 rounded-lg" style={{ backgroundColor: "var(--grey-100)" }} />
          ))}
        </div>
      ) : courts.length === 0 ? (
        // 코트가 없는 경우 안내 — .ts-card 빈 상태
        <div className="ts-card" style={{ textAlign: "center", padding: 32 }}>
          {/* stadium → lucide building */}
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 10 }}>
            <Icon name="building" size={36} color="var(--ink-dim)" />
          </div>
          <p className="text-sm font-medium mb-2" style={{ color: "var(--ink)" }}>
            등록된 체육관이 없습니다
          </p>
          <p className="text-xs" style={{ color: "var(--ink-mute)" }}>
            체육관을 대관 관리하려면 먼저 농구장 정보를 등록해야 합니다.
          </p>
          <p className="text-xs mt-2" style={{ color: "var(--ink-mute)" }}>
            관리자에게 체육관 등록을 요청하세요.
          </p>
        </div>
      ) : (
        // 코트 목록 렌더링
        <div className="space-y-4">
          {courts.map((court) => {
            const form = editForm[court.id] || {};
            return (
              <div key={court.id} className="ts-card space-y-4">
                {/* 체육관 헤더 */}
                <div className="flex items-center gap-3">
                  {/* indoor=building / outdoor=sports_basketball→circle-dot */}
                  <Icon
                    name={court.court_type === "indoor" ? "building" : "circle-dot"}
                    size={22}
                    color="var(--primary)"
                  />
                  <div>
                    <p className="text-sm font-bold" style={{ color: "var(--ink)" }}>
                      {court.name}
                    </p>
                    <p className="text-xs" style={{ color: "var(--ink-mute)" }}>
                      {court.address}
                    </p>
                  </div>
                </div>

                {/* ── 기본 정보 탭 ── 대관 가능 여부 / 신청 URL / 담당자 연락처 */}
                {tab === "basic" && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* 대관 가능 여부 */}
                    <div className="ts-field">
                      <label className="ts-field__label">대관 가능 여부</label>
                      <select
                        className="ts-select"
                        value={form.rental_available ?? String(court.rental_available)}
                        onChange={(e) => updateField(court.id, "rental_available", e.target.value)}
                      >
                        <option value="true">가능</option>
                        <option value="false">불가</option>
                      </select>
                    </div>

                    {/* 대관 신청 URL */}
                    <div className="ts-field">
                      <label className="ts-field__label">대관 신청 URL</label>
                      <input
                        type="url"
                        className="ts-input"
                        value={form.rental_url ?? (court.rental_url ?? "")}
                        onChange={(e) => updateField(court.id, "rental_url", e.target.value)}
                        placeholder="https://booking.example.com"
                      />
                    </div>

                    {/* 담당자 연락처 — PhoneInput 자동 포맷. updateField 헬퍼 그대로(상태 변경 0).
                        PhoneInput 은 className/style 그대로 받으므로 .ts-input 으로 룩만 교체. */}
                    <div className="ts-field">
                      <label className="ts-field__label">담당자 연락처</label>
                      <PhoneInput
                        value={form.contact_phone ?? (court.contact_phone ?? "")}
                        onChange={(v) => updateField(court.id, "contact_phone", v)}
                        className="ts-input"
                      />
                    </div>
                  </div>
                )}

                {/* ── 시간·가격 탭 ── 대관 비용(편집) / 영업시간(read-only) */}
                {tab === "hours" && (
                  <div className="space-y-4">
                    {/* 대관 비용 — 기존 fee 편집 유지 (handleSave 그대로) */}
                    <div className="ts-field">
                      <label className="ts-field__label">대관 비용 (원)</label>
                      <input
                        type="number"
                        className="ts-input"
                        style={{ maxWidth: 280 }}
                        value={form.fee ?? String(court.fee ?? "")}
                        onChange={(e) => updateField(court.id, "fee", e.target.value)}
                        placeholder="시간당 대관료"
                      />
                    </div>

                    {/* 영업시간 — operating_hours read-only 표시 (편집 X)
                        DB operating_hours 필드를 요일별로 노출만. 저장 대상 아님. */}
                    <div className="ts-field">
                      <label className="ts-field__label">영업 시간</label>
                      {court.operating_hours && Object.keys(court.operating_hours).length > 0 ? (
                        <div
                          className="ts-card ts-card--flat divide-y"
                          style={{ padding: 0, overflow: "hidden" }}
                        >
                          {Object.entries(court.operating_hours).map(([day, hours]) => (
                            <div
                              key={day}
                              className="flex items-center justify-between px-3 py-2 text-sm"
                              style={{ borderColor: "var(--border)" }}
                            >
                              {/* 요일 라벨 — DAY_LABELS 매핑 없으면 원본 key 노출 */}
                              <span style={{ color: "var(--ink-mute)" }}>
                                {DAY_LABELS[day] ?? day}
                              </span>
                              <span style={{ color: "var(--ink)" }}>{hours}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        // operating_hours 없으면 안내 (시안 mock 대신 빈 상태)
                        <p className="text-xs" style={{ color: "var(--ink-mute)" }}>
                          등록된 영업시간 정보가 없습니다.
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* 저장 버튼 — Toss Btn(primary) */}
                <div className="flex justify-end">
                  <Btn
                    variant="primary"
                    size="sm"
                    onClick={() => handleSave(court.id)}
                    disabled={saving === court.id}
                  >
                    {saving === court.id ? "저장 중..." : "저장"}
                  </Btn>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

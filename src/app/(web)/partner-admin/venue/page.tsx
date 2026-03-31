"use client";

import { useState, useEffect } from "react";

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

export default function VenueManagePage() {
  const [courts, setCourts] = useState<CourtVenueInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null); // 저장 중인 court id
  const [editForm, setEditForm] = useState<Record<string, Record<string, string>>>({});

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
      {/* 헤더 */}
      <div>
        <h2 className="text-xl font-bold" style={{ color: "var(--color-text-primary)" }}>
          대관 관리
        </h2>
        <p className="text-sm mt-1" style={{ color: "var(--color-text-muted)" }}>
          등록된 체육관의 대관 정보를 설정하세요.
        </p>
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

                {/* 대관 정보 폼 */}
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

                  {/* 대관 비용 */}
                  <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: "var(--color-text-secondary)" }}>
                      대관 비용 (원)
                    </label>
                    <input
                      type="number"
                      value={form.fee ?? String(court.fee ?? "")}
                      onChange={(e) => updateField(court.id, "fee", e.target.value)}
                      className="w-full rounded border px-3 py-2 text-sm outline-none"
                      style={{
                        backgroundColor: "var(--color-surface)",
                        borderColor: "var(--color-border)",
                        color: "var(--color-text-primary)",
                      }}
                      placeholder="시간당 대관료"
                    />
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
                    <input
                      type="tel"
                      value={form.contact_phone ?? (court.contact_phone ?? "")}
                      onChange={(e) => updateField(court.id, "contact_phone", e.target.value)}
                      className="w-full rounded border px-3 py-2 text-sm outline-none"
                      style={{
                        backgroundColor: "var(--color-surface)",
                        borderColor: "var(--color-border)",
                        color: "var(--color-text-primary)",
                      }}
                      placeholder="010-1234-5678"
                    />
                  </div>
                </div>

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

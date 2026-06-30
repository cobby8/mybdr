"use client";

// ============================================================
// referee-console/members/new/_new-form.tsx — 심판 사전 등록 폼(클라)
//   레거시 (referee)/referee/admin/members/new page 박제 → admin-v2 디자인.
//   ★mutation = adminFetch POST /api/web/referee-admin/members (기존 API·백엔드 0변경).
//     · body 는 camelCase 로 전달 → adminFetch 가 단일 변환점에서 snake 로 변환
//       (registeredName→registered_name 등). 서버 zod 계약은 snake.
//   ⚠ super 범위 한계: 기존 API 가 admin.associationId(자동선택 협회)로 강제 주입 →
//     해당 협회로만 등록. cross-association 등록 불가는 데이터 희박 환경 수용(기존 결정).
//     실패(403 등) 시 화면에 사유(AdminApiError.message) 가시화.
//   ★admin-v2 키트(PageHead/Btn/Icon)·전역 입력(PhoneInput/BirthDateInput/PasswordInput)
//     ·var(--*) 토큰만 — 하드코딩 색 0.
// ============================================================

import React from "react";
import { useRouter } from "next/navigation";
import { PageHead, Btn, Icon } from "@/components/admin-v2";
import { adminFetch, AdminApiError } from "@/lib/admin-v2/data/client";
// 전역 공유 입력 컴포넌트(자동 하이픈/4자리 yyyy/보기 토글). 사이트 전역 룰 — 직접 input 금지.
import { PhoneInput } from "@/components/inputs/phone-input";
import { BirthDateInput } from "@/components/inputs/birth-date-input";
import { PasswordInput } from "@/components/ui/password-input";
import {
  OFFICIAL_LEVEL_OPTIONS,
  OFFICIAL_ROLE_LABELS,
  type OfficialRoleType,
} from "@/lib/referee/official-roles";

// 역할 옵션(레거시 박제 — 심판/경기원 2종).
const ROLE_OPTIONS = [
  { value: "referee", label: OFFICIAL_ROLE_LABELS.referee },
  { value: "game_official", label: OFFICIAL_ROLE_LABELS.game_official },
] as const;

// 시도 목록(레거시 박제).
const SIDO_LIST = [
  "서울", "부산", "대구", "인천", "광주", "대전", "울산", "세종",
  "경기", "강원", "충북", "충남", "전북", "전남", "경북", "경남", "제주",
];

// 입력 공통 스타일(var 토큰만 — 하드코딩 색 0). settlements-bulk inputStyle 동일 컨벤션.
const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  border: "1px solid var(--border)",
  background: "var(--card)",
  color: "var(--ink)",
  borderRadius: 8,
  fontSize: 13.5,
  fontFamily: "var(--ff)",
};

// 라벨 공통 스타일.
const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 12.5,
  fontWeight: 700,
  color: "var(--ink-mute)",
  marginBottom: 6,
};

export function MemberNewForm() {
  const router = useRouter();

  // ── 폼 상태(레거시 1:1) ──
  const [name, setName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [residentId, setResidentId] = React.useState(""); // 주민번호(정산용·선택)
  const [birthDate, setBirthDate] = React.useState("");
  const [level, setLevel] = React.useState("");
  const [roleType, setRoleType] = React.useState<OfficialRoleType>("referee");
  const [licenseNumber, setLicenseNumber] = React.useState("");
  const [regionSido, setRegionSido] = React.useState("");
  const [regionSigungu, setRegionSigungu] = React.useState("");

  // ── 제출 상태 ──
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);

  const goList = () => router.push("/referee-console/members");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // 클라 기본 검증(서버 zod 가 final source of truth).
    if (!name.trim()) {
      setError("이름을 입력해주세요.");
      return;
    }
    if (!phone.trim()) {
      setError("전화번호를 입력해주세요.");
      return;
    }

    setSubmitting(true);
    try {
      // camelCase body → adminFetch 단일 변환점에서 snake 로 변환되어 서버 계약과 일치.
      //   빈 문자열(선택 안 함/미입력)은 null 로 보내 zod optional().nullable() 통과.
      await adminFetch("/api/web/referee-admin/members", {
        method: "POST",
        body: {
          registeredName: name.trim(),
          registeredPhone: phone.trim(),
          residentId: residentId.trim() || null,
          registeredBirthDate: birthDate || null,
          level: level || null,
          roleType: roleType || "referee",
          licenseNumber: licenseNumber.trim() || null,
          regionSido: regionSido || null,
          regionSigungu: regionSigungu.trim() || null,
        },
      });
      setSuccess("심판이 사전 등록되었습니다. 목록으로 이동합니다.");
      // 잠깐 안내 후 목록으로 이동.
      setTimeout(goList, 1200);
    } catch (err) {
      setError(
        err instanceof AdminApiError
          ? err.message
          : "등록에 실패했습니다. 다시 시도해주세요."
      );
      setSubmitting(false);
    }
  };

  return (
    <div>
      {/* 뒤로가기 */}
      <button
        type="button"
        onClick={goList}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 4,
          marginBottom: 12,
          background: "none",
          border: "none",
          cursor: "pointer",
          fontSize: 13,
          fontWeight: 700,
          color: "var(--ink-mute)",
          fontFamily: "var(--ff)",
        }}
      >
        <Icon name="arrow-left" size={16} />
        목록으로
      </button>

      <PageHead
        eyebrow="심판 콘솔"
        title="심판 사전 등록"
        sub="아직 가입하지 않은 심판을 미리 등록합니다. 해당 유저가 가입하면 자동으로 매칭됩니다."
      />

      <form
        onSubmit={handleSubmit}
        style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 16 }}
      >
        {/* 에러 */}
        {error && (
          <div
            style={{
              fontSize: 13.5,
              color: "var(--danger)",
              background: "var(--danger-weak, color-mix(in srgb, var(--danger) 8%, transparent))",
              border: "1px solid var(--danger)",
              borderRadius: 10,
              padding: "12px 14px",
            }}
          >
            {error}
          </div>
        )}
        {/* 성공 */}
        {success && (
          <div
            style={{
              fontSize: 13.5,
              color: "var(--ok)",
              background: "color-mix(in srgb, var(--ok) 8%, transparent)",
              border: "1px solid var(--ok)",
              borderRadius: 10,
              padding: "12px 14px",
            }}
          >
            {success}
          </div>
        )}

        {/* 필수 정보 */}
        <section className="ad-panel" style={{ display: "flex", flexDirection: "column", gap: 14, padding: "16px 18px" }}>
          <h2 style={{ fontSize: 12.5, fontWeight: 800, letterSpacing: "0.04em", color: "var(--ink-mute)", textTransform: "uppercase" }}>
            필수 정보
          </h2>

          <label style={{ display: "block" }}>
            <span style={labelStyle}>이름 *</span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="홍길동"
              style={inputStyle}
            />
          </label>

          <label style={{ display: "block" }}>
            <span style={labelStyle}>전화번호 *</span>
            {/* PhoneInput onChange 시그니처: (val:string)=>void (자동 하이픈 포맷) */}
            <PhoneInput value={phone} onChange={setPhone} style={inputStyle} />
          </label>

          <label style={{ display: "block" }}>
            <span style={labelStyle}>주민등록번호 (정산용, 선택)</span>
            {/* PasswordInput — 보기 토글 통합. 주민번호는 password manager 자동저장 차단(off). */}
            <PasswordInput
              value={residentId}
              onChange={(e) => {
                // 6자리 입력 후 자동 하이픈 삽입(레거시 박제).
                const raw = e.target.value.replace(/[^0-9-]/g, "");
                if (raw.length === 7 && !raw.includes("-")) {
                  setResidentId(raw.slice(0, 6) + "-" + raw.slice(6));
                } else {
                  setResidentId(raw.slice(0, 14)); // 최대 14자(000000-0000000)
                }
              }}
              placeholder="000000-0000000"
              maxLength={14}
              autoComplete="off"
              style={inputStyle}
            />
            <span style={{ display: "block", marginTop: 6, fontSize: 11.5, color: "var(--ink-mute)" }}>
              주민번호는 암호화 저장되며, 정산 목적으로만 사용됩니다.
            </span>
          </label>
        </section>

        {/* 추가 정보(선택) */}
        <section className="ad-panel" style={{ display: "flex", flexDirection: "column", gap: 14, padding: "16px 18px" }}>
          <h2 style={{ fontSize: 12.5, fontWeight: 800, letterSpacing: "0.04em", color: "var(--ink-mute)", textTransform: "uppercase" }}>
            추가 정보 (선택)
          </h2>

          <label style={{ display: "block" }}>
            <span style={labelStyle}>생년월일</span>
            {/* BirthDateInput onChange 시그니처: (val:string)=>void (yyyy 4자리 강제) */}
            <BirthDateInput value={birthDate} onChange={setBirthDate} style={inputStyle} />
          </label>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <label style={{ display: "block" }}>
              <span style={labelStyle}>등급</span>
              <select value={level} onChange={(e) => setLevel(e.target.value)} style={inputStyle}>
                {OFFICIAL_LEVEL_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </label>
            <label style={{ display: "block" }}>
              <span style={labelStyle}>역할</span>
              <select
                value={roleType}
                onChange={(e) => setRoleType(e.target.value as OfficialRoleType)}
                style={inputStyle}
              >
                {ROLE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label style={{ display: "block" }}>
            <span style={labelStyle}>자격번호</span>
            <input
              type="text"
              value={licenseNumber}
              onChange={(e) => setLicenseNumber(e.target.value)}
              placeholder="REF-2026-001"
              style={inputStyle}
            />
          </label>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <label style={{ display: "block" }}>
              <span style={labelStyle}>시/도</span>
              <select value={regionSido} onChange={(e) => setRegionSido(e.target.value)} style={inputStyle}>
                <option value="">선택 안 함</option>
                {SIDO_LIST.map((sido) => (
                  <option key={sido} value={sido}>
                    {sido}
                  </option>
                ))}
              </select>
            </label>
            <label style={{ display: "block" }}>
              <span style={labelStyle}>시/군/구</span>
              <input
                type="text"
                value={regionSigungu}
                onChange={(e) => setRegionSigungu(e.target.value)}
                placeholder="강남구"
                style={inputStyle}
              />
            </label>
          </div>
        </section>

        {/* 제출 */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <Btn variant="secondary" onClick={goList} disabled={submitting}>
            취소
          </Btn>
          {/* type="submit" → form onSubmit(handleSubmit) 발동. Btn 의 기본 type="button"을 rest 가 오버라이드. */}
          <Btn variant="primary" icon="user-plus" disabled={submitting} type="submit">
            {submitting ? "등록 중..." : "심판 사전 등록"}
          </Btn>
        </div>
      </form>
    </div>
  );
}

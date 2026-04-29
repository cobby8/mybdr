"use client";

/* ============================================================
 * ProfileSectionV2 — Settings "선수 프로필" 섹션 (재구성판)
 *
 * 왜 (이번 재구성):
 *  - 사용자 지시 (캡처 43):
 *    1) 실명은 전화번호 인증 시 자동 입력 → 수정 불가 (readonly + disabled)
 *       (Phase 2 별도 작업 — SMS 인증 도입 시 자동 채움. 지금은 readonly만)
 *    2) 포지션 → onboarding 위저드의 3열 버튼 카드 패턴 재사용 (G/F/C)
 *    3) 도시·구/동 → RegionPicker (cascading select) 재사용
 *    4) 모바일 좁은 영역 → 1열 stack 기본 + 일부만 데스크톱 2열
 *  - API/DB 0 변경. PATCH /api/web/profile 시그니처 그대로.
 *  - submit body 에서 name 제외 (어차피 readonly — 변경 못 함).
 *
 * 어떻게:
 *  - 기존 form state 유지하되 city/district 는 RegionPicker(value: Region[]) 와 동기화.
 *  - 첫 번째 region 의 city/district 를 PATCH 시 전송. 비어있으면 빈 문자열.
 *  - 포지션 G/F/C 3개로 한정 (onboarding 와 동일).
 *  - 레이아웃: space-y-4 1 열 stack + (포지션·키), (몸무게·생년월일) 만 2 열 grid.
 * ============================================================ */

import { useState, useEffect, type FormEvent } from "react";
import { SettingsHeader } from "./settings-ui";
import { RegionPicker, type Region } from "@/components/shared/region-picker";

// 부모에서 받는 사용자 정보 (GET /api/web/profile 의 user 필드 일부)
export interface ProfileFormUser {
  nickname?: string | null;
  name?: string | null;
  position?: string | null;
  height?: number | null;
  weight?: number | null;
  city?: string | null;
  district?: string | null;
  birth_date?: string | null; // YYYY-MM-DD (PATCH 응답 / GET 변환 후)
  bio?: string | null;
}

interface Props {
  user: ProfileFormUser | null;
  onSaved?: (next: ProfileFormUser) => void;
}

// 포지션 3종 — onboarding setup-form.tsx L44-48 동일. 단 settings 에서는
// 이미 포지션 + 다른 정보가 한 화면에 있으므로 "설명" 은 생략하고 라벨만.
const POSITIONS = [
  { v: "G", l: "가드" },
  { v: "F", l: "포워드" },
  { v: "C", l: "센터" },
] as const;

export function ProfileSectionV2({ user, onSaved }: Props) {
  // 단순 8 필드 로컬 상태. name 은 readonly 표시용으로만 보유 (PATCH 미전송).
  const [form, setForm] = useState({
    nickname: "",
    name: "",
    position: "",
    height: "",
    weight: "",
    birth_date: "",
    bio: "",
  });
  // 활동 지역 (RegionPicker). 단일 region 만 사용하지만 컴포넌트 시그니처 상 배열.
  const [regions, setRegions] = useState<Region[]>([{ city: "", district: "" }]);
  const [saving, setSaving] = useState(false);
  // 저장 결과 메시지: success | error | null
  const [message, setMessage] = useState<{ kind: "success" | "error"; text: string } | null>(null);

  // 부모 user 가 도착/갱신될 때 폼 초기화
  useEffect(() => {
    if (!user) return;
    setForm({
      nickname: user.nickname ?? "",
      name: user.name ?? "",
      position: user.position ?? "",
      height: user.height != null ? String(user.height) : "",
      weight: user.weight != null ? String(user.weight) : "",
      birth_date: user.birth_date ?? "",
      bio: user.bio ?? "",
    });
    // 도시·구/동 → RegionPicker 의 첫 슬롯에 매핑.
    // 둘 중 하나라도 있으면 채우고, 둘 다 없으면 빈 슬롯 유지.
    setRegions([
      {
        city: user.city ?? "",
        district: user.district ?? "",
      },
    ]);
  }, [user]);

  const setField = (key: keyof typeof form, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (saving) return;
    setMessage(null);

    // 닉네임 길이 클라 검증 (서버도 검증하지만 즉시 피드백)
    const trimmedNick = form.nickname.trim();
    if (trimmedNick.length > 0 && (trimmedNick.length < 2 || trimmedNick.length > 20)) {
      setMessage({ kind: "error", text: "닉네임은 2자 이상 20자 이하여야 합니다." });
      return;
    }

    setSaving(true);
    try {
      // RegionPicker 의 첫 번째 region 만 사용 (Profile 은 단일 활동 지역).
      const firstRegion = regions[0] ?? { city: "", district: "" };

      // PATCH /api/web/profile — name 은 의도적으로 누락 (readonly).
      const res = await fetch("/api/web/profile", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          // 빈 문자열은 서버에서 null 처리됨 (route.ts: `value as string || null`)
          nickname: form.nickname,
          position: form.position,
          // height/weight 는 숫자 변환은 서버에서 처리. 빈문자열이면 null.
          height: form.height,
          weight: form.weight,
          city: firstRegion.city,
          district: firstRegion.district,
          // birth_date 도 빈문자열이면 서버에서 null 처리
          birth_date: form.birth_date,
          bio: form.bio,
        }),
      });
      if (!res.ok) {
        // apiError 형태: { error: string } — 가능하면 메시지 추출
        let errText = "저장에 실패했습니다.";
        try {
          const data = await res.json();
          if (data?.error && typeof data.error === "string") errText = data.error;
        } catch {
          // ignore
        }
        setMessage({ kind: "error", text: errText });
        return;
      }
      // apiSuccess: { ...updated user fields }. snake_case 그대로 (CLAUDE.md).
      // 부모에 변경 알림 (header 등 공유 데이터 갱신용)
      try {
        const data = await res.json();
        onSaved?.({
          nickname: data?.nickname ?? form.nickname,
          // name 은 변경 안 했으므로 기존값 그대로 전파
          name: form.name,
          position: data?.position ?? form.position,
          height: data?.height ?? (form.height ? Number(form.height) : null),
          weight: data?.weight ?? (form.weight ? Number(form.weight) : null),
          city: data?.city ?? firstRegion.city,
          district: data?.district ?? firstRegion.district,
          birth_date: data?.birth_date ?? form.birth_date,
          bio: data?.bio ?? form.bio,
        });
      } catch {
        // ignore parse error — UI 메시지는 그대로 success
      }
      setMessage({ kind: "success", text: "프로필이 저장되었습니다." });
    } catch {
      setMessage({ kind: "error", text: "네트워크 오류로 저장에 실패했습니다." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={onSubmit}>
      <SettingsHeader
        title="선수 프로필"
        desc="경기 및 랭킹에 표시되는 정보"
      />

      {/* 모바일 우선 1열 stack — 일부만 데스크톱(640px+) 2열 grid */}
      <div className="space-y-4" style={{ marginBottom: 16 }}>
        {/* 닉네임 (단독, 풀폭) */}
        <Field
          label="닉네임"
          name="nickname"
          value={form.nickname}
          onChange={(v) => setField("nickname", v)}
          maxLength={20}
          placeholder="2~20자"
        />

        {/* 실명 — readonly + disabled. 전화번호 인증 시 자동 입력될 예정 (Phase 2). */}
        <div>
          <label
            htmlFor="profile-name"
            style={{ fontSize: 12, fontWeight: 700, color: "var(--ink-mute)" }}
          >
            실명
          </label>
          <input
            id="profile-name"
            name="name"
            type="text"
            // 빈 값일 때도 placeholder 로 의도 전달 (readonly 도 placeholder 노출 됨)
            value={form.name ?? ""}
            readOnly
            disabled
            placeholder="전화번호 인증 시 자동 입력 (곧 출시)"
            className="input"
            style={{
              marginTop: 6,
              width: "100%",
              backgroundColor: "var(--bg-alt)",
              cursor: "not-allowed",
              opacity: 0.7,
            }}
          />
          <p style={{ marginTop: 4, fontSize: 11, color: "var(--ink-dim)" }}>
            전화번호 인증 후 자동 입력됩니다. 직접 수정할 수 없습니다.
          </p>
        </div>

        {/* 포지션 — 3열 버튼 카드 (onboarding setup-form.tsx 패턴 차용) */}
        <div>
          <label
            style={{ fontSize: 12, fontWeight: 700, color: "var(--ink-mute)", display: "block" }}
          >
            포지션
          </label>
          <div
            style={{
              marginTop: 6,
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 8,
            }}
          >
            {POSITIONS.map((p) => {
              const sel = form.position === p.v;
              return (
                <button
                  key={p.v}
                  type="button"
                  onClick={() => setField("position", p.v)}
                  // 선택 시 cafe-blue 테두리 + 옅은 배경 (onboarding 컬러 시스템과 통일)
                  style={{
                    padding: "12px 8px",
                    textAlign: "center",
                    background: sel ? "var(--bg-alt)" : "transparent",
                    border: sel
                      ? "2px solid var(--cafe-blue)"
                      : "1px solid var(--border)",
                    borderRadius: 4,
                    cursor: "pointer",
                    fontWeight: 700,
                    fontSize: 13,
                    color: "var(--ink)",
                  }}
                >
                  <div style={{ fontFamily: "var(--ff-display)", fontSize: 16, fontWeight: 900 }}>
                    {p.v}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--ink-dim)", marginTop: 2 }}>
                    {p.l}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 키 / 몸무게 — 데스크톱 2열, 모바일 1열 (좁은 숫자 입력) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field
            label="키 (cm)"
            name="height"
            value={form.height}
            onChange={(v) => setField("height", v.replace(/[^0-9]/g, ""))}
            placeholder="예: 182"
            inputMode="numeric"
          />
          <Field
            label="몸무게 (kg)"
            name="weight"
            value={form.weight}
            onChange={(v) => setField("weight", v.replace(/[^0-9]/g, ""))}
            placeholder="예: 78"
            inputMode="numeric"
          />
        </div>

        {/* 생년월일 (단독, 풀폭) */}
        <Field
          label="생년월일"
          name="birth_date"
          type="date"
          value={form.birth_date}
          onChange={(v) => setField("birth_date", v)}
        />

        {/* 활동 지역 — RegionPicker (cascading select). 단일 region (max=1) 사용. */}
        <div>
          {/* RegionPicker 는 자체 라벨을 가지고 있어 별도 label 불필요. max=1 로 추가버튼 차단. */}
          <RegionPicker value={regions} onChange={setRegions} max={1} />
        </div>

        {/* 자기소개 — textarea (시안 동일) */}
        <div>
          <label
            style={{ fontSize: 12, fontWeight: 700, color: "var(--ink-mute)" }}
            htmlFor="profile-bio"
          >
            자기소개
          </label>
          <textarea
            id="profile-bio"
            className="input"
            rows={3}
            style={{ marginTop: 6, resize: "vertical", width: "100%" }}
            value={form.bio}
            onChange={(e) => setField("bio", e.target.value)}
            placeholder="강남·송파 위주 픽업. 토요일 오전 고정."
          />
        </div>
      </div>

      {/* 저장 버튼 + 메시지 영역 */}
      <div style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <button
          type="submit"
          className="btn btn--primary"
          disabled={saving}
          // 저장 중이면 시각적으로 진행 표시
          style={saving ? { opacity: 0.7, cursor: "wait" } : undefined}
        >
          {saving ? "저장 중..." : "변경사항 저장"}
        </button>
        {message && (
          <span
            style={{
              fontSize: 13,
              color:
                message.kind === "success" ? "var(--ok)" : "var(--accent)",
            }}
            role={message.kind === "error" ? "alert" : "status"}
          >
            {message.text}
          </span>
        )}
      </div>
    </form>
  );
}

/* ----- 단일 라벨+input 묶음. 시안 토큰(.input) 사용 ----- */
function Field({
  label,
  name,
  value,
  onChange,
  type = "text",
  placeholder,
  maxLength,
  inputMode,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  maxLength?: number;
  inputMode?: "numeric" | "text";
}) {
  return (
    <div>
      <label
        htmlFor={`profile-${name}`}
        style={{ fontSize: 12, fontWeight: 700, color: "var(--ink-mute)" }}
      >
        {label}
      </label>
      <input
        id={`profile-${name}`}
        name={name}
        className="input"
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        inputMode={inputMode}
        style={{ marginTop: 6, width: "100%" }}
      />
    </div>
  );
}

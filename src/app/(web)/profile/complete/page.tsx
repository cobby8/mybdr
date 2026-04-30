"use client";

/**
 * /profile/complete — BDR v2.2 D등급 P0-4 박제
 *
 * 시안 출처: Dev/design/BDR v2.2/screens/ProfileComplete.jsx
 * Why: 신규 가입 직후 프로필 완성 유도 (포지션 / 키 / 활동 지역 / 사진)
 *      OnboardingV2(6 step) 풀 온보딩과 별개의 압축형 4 step "지금 바로" 흐름
 *
 * Pattern: 단계형 폼 + 진행 막대 + 카드 컨테이너 (M5 압축)
 *
 * 진입: /verify 인증 직후 자동 redirect / /profile "프로필 60% — 완성하기" 배너
 * 복귀: 완료 → /onboarding/setup (전체 온보딩) 또는 / (이미 마쳤으면 홈)
 *       건너뛰기 → /
 *
 * 회귀 검수 매트릭스:
 *   기능              | 옛 페이지 (M5)        | 시안 v2.2          | 진입점       | 모바일
 *   포지션 선택       | choose→fill 3필드      | ✅ 5칩 (Step 1)    | verify 직후 | 3열
 *   키·체중           | EditProfile에서 처리   | ✅ slider (Step 2) | -          | 1열
 *   활동 지역         | RegionPicker max=3     | ✅ 칩 다중 (Step 3) | -          | 2열
 *   사진 업로드       | EditProfile에서 처리   | ✅ drop zone (Step 4)| -        | OK
 *   건너뛰기          | 헤더 우측 링크          | ✅ 우상단 link      | -          | OK
 *   완료 화면         | 없음                   | ✅ 농구공 + CTA 2개  | -          | OK
 *
 * 보존 원칙 (변경 0):
 *  - PATCH /api/web/profile (nickname / position / city / district / height / weight)
 *  - GET /api/web/profile prefill (snake_case 자동 변환 가드)
 *  - profile_completed 의도적 미전송 (게임 신청 가드 보존)
 *  - 박제 룰: var(--*) / Material Symbols / radius 4px / alert 신규 X
 */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { RegionPicker, type Region } from "@/components/shared/region-picker";

// 농구 5포지션 — 시안과 동일하게 라벨/설명 포함
const POSITIONS = [
  { id: "PG", label: "포인트 가드", desc: "볼 핸들러" },
  { id: "SG", label: "슈팅 가드", desc: "외곽 슈터" },
  { id: "SF", label: "스몰 포워드", desc: "다재다능" },
  { id: "PF", label: "파워 포워드", desc: "골밑 + 미들" },
  { id: "C", label: "센터", desc: "골밑 지배" },
] as const;

// GET /api/web/profile 응답 minimal 형태 (prefill 한정)
// apiSuccess가 자동 snake_case 변환하므로 키는 모두 snake_case (errors.md 6회 재발 가드)
interface ProfilePrefillResponse {
  user?: {
    nickname?: string | null;
    position?: string | null;
    city?: string | null;
    district?: string | null;
    height?: number | null;
    weight?: number | null;
  };
}

const TOTAL_STEPS = 4;

export default function ProfileCompletePage() {
  const router = useRouter();

  // 단계 관리: 1~4 = 입력 step, 5 = 완료 화면 (시안의 step === total + 1)
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // ── 시안 data state 1:1 박제 ──
  const [position, setPosition] = useState(""); // CSV ("PG,SG") — 복수 선택 가능
  const [height, setHeight] = useState(178); // 시안 기본 178
  const [weight, setWeight] = useState(72); // 시안 기본 72
  const [bodyPrivate, setBodyPrivate] = useState(true); // 시안: 신체 정보 비공개 기본 체크
  const [regions, setRegions] = useState<Region[]>([{ city: "", district: "" }]);
  const [skipPhoto, setSkipPhoto] = useState(false);

  // 마운트 시 기존 값 prefill
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/web/profile");
        if (!res.ok) return;
        const data: ProfilePrefillResponse = await res.json();
        const u = data?.user;
        if (cancelled || !u) return;
        if (u.position) setPosition(u.position);
        if (typeof u.height === "number") setHeight(u.height);
        if (typeof u.weight === "number") setWeight(u.weight);
        // 지역 prefill: city/district는 CSV(쉼표 구분) 저장 형식
        if (u.city) {
          const cities = String(u.city).split(",");
          const districts = String(u.district ?? "").split(",");
          const restored: Region[] = cities
            .map((c, i) => ({
              city: c.trim(),
              district: (districts[i] ?? "").trim(),
            }))
            .filter((r) => r.city);
          if (restored.length > 0) setRegions(restored);
        }
      } catch {
        // prefill 실패는 치명적이지 않음 — 빈 폼으로 진행
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // 포지션 토글 (복수 선택)
  const togglePosition = (pos: string) => {
    const selected = position ? position.split(",") : [];
    const idx = selected.indexOf(pos);
    if (idx >= 0) selected.splice(idx, 1);
    else selected.push(pos);
    setPosition(selected.join(","));
  };
  const selectedPositions = position ? position.split(",") : [];

  // 지역 토글 (시안 toggleArea 박제 — 단 RegionPicker 사용 중이라 별도 칩 그리드는 미적용,
  // RegionPicker max=3 그대로 사용. 시안의 14개 칩 그리드는 보류.)
  // → 시안과 동일한 칩 그리드 UX는 RegionPicker로 대체 (이미 사이트 컨벤션)

  // 저장 (Step 4 → 완료 화면): 모든 필드 PATCH
  // profile_completed 의도적 미전송 (게임 신청 가드 보존)
  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      const filledRegions = regions.filter((r) => r.city);
      const districtValue =
        filledRegions
          .map((r) => r.district)
          .filter(Boolean)
          .join(",") || null;

      const payload = {
        position: position || null,
        city: filledRegions.map((r) => r.city).join(",") || null,
        district: districtValue,
        // 비공개 체크 시 height/weight 미전송 (시안 의도 — 신체 정보 비공개)
        ...(bodyPrivate ? {} : { height, weight }),
      };

      const res = await fetch("/api/web/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "저장 실패");

      // 시안: 완료 화면(step === total + 1)으로 진입
      setStep(TOTAL_STEPS + 1);
    } catch (e) {
      setError(e instanceof Error ? e.message : "오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  };

  // Next 버튼 액션 — 마지막 step에선 저장 + 완료 화면
  const handleNext = () => {
    if (step < TOTAL_STEPS) {
      setStep(step + 1);
    } else {
      handleSave();
    }
  };

  // Back 버튼 — step 1에선 홈으로 (시안 "나가기")
  const handleBack = () => {
    if (step > 1) setStep(step - 1);
    else router.push("/");
  };

  // ── 완료 화면 (step === total + 1) ──
  // 시안 L56-73 박제: 농구공 아이콘 + 환영 문구 + CTA 2개
  if (step === TOTAL_STEPS + 1) {
    return (
      <div className="page mx-auto" style={{ maxWidth: 560, paddingTop: 60 }}>
        <div
          className="rounded-[4px] border border-[var(--border)] bg-[var(--bg-elev)]"
          style={{ padding: "48px 36px", textAlign: "center" }}
        >
          {/* 시안 농구공 그라디언트 원 — Material Symbols로 대체(박제 룰: lucide 금지) */}
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: "50%",
              background:
                "linear-gradient(135deg, var(--accent), color-mix(in oklab, var(--accent) 60%, #FF6B35))",
              color: "#fff",
              display: "grid",
              placeItems: "center",
              margin: "0 auto 18px",
            }}
          >
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 36, color: "#fff" }}
            >
              sports_basketball
            </span>
          </div>
          <h1
            style={{
              margin: "0 0 8px",
              fontSize: 24,
              fontWeight: 800,
              letterSpacing: "-0.02em",
              color: "var(--ink)",
              fontFamily: "var(--ff-display)",
            }}
          >
            프로필 기본 정보 완료!
          </h1>
          <p
            style={{
              margin: "0 0 24px",
              fontSize: 14,
              color: "var(--ink-mute)",
              lineHeight: 1.6,
            }}
          >
            기본 정보가 채워졌어요. 더 정확한 매칭을 원하면
            <br />
            취향 설정도 마쳐 보세요 (1분).
          </p>
          <div
            style={{
              display: "flex",
              gap: 8,
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            <button
              type="button"
              onClick={() => router.push("/")}
              className="rounded-[4px] border border-[var(--border)] bg-[var(--bg-elev)] px-6 py-3 text-sm font-semibold text-[var(--ink)] hover:bg-[var(--bg-alt)]"
            >
              나중에 하기
            </button>
            <button
              type="button"
              onClick={() => router.push("/onboarding/setup")}
              className="rounded-[4px] bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-white hover:opacity-90"
            >
              취향 설정 →
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page mx-auto" style={{ maxWidth: 560, paddingTop: 30 }}>
      {/* 시안 진행 막대 (L77-86) */}
      <div style={{ marginBottom: 24 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: 11,
            color: "var(--ink-dim)",
            fontWeight: 700,
            marginBottom: 6,
            letterSpacing: ".08em",
          }}
        >
          <span>STEP {step} / {TOTAL_STEPS} · 프로필 완성</span>
          {/* 시안 우상단 "건너뛰기" 링크 — 홈으로 이동 */}
          <button
            type="button"
            onClick={() => router.push("/")}
            style={{
              cursor: "pointer",
              background: "transparent",
              border: 0,
              color: "var(--ink-dim)",
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: ".08em",
            }}
          >
            건너뛰기
          </button>
        </div>
        {/* 시안 progress bar (height:4, accent fill, transition 0.3s) */}
        <div
          style={{
            height: 4,
            background: "var(--bg-alt)",
            borderRadius: 2,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${(step / TOTAL_STEPS) * 100}%`,
              height: "100%",
              background: "var(--accent)",
              transition: "width .3s",
            }}
          />
        </div>
      </div>

      {/* 시안 .card 본문 (padding 36px 40px, minHeight 380) */}
      <div
        className="rounded-[4px] border border-[var(--border)] bg-[var(--bg-elev)]"
        style={{ padding: "36px 40px", minHeight: 380 }}
      >
        {error && (
          <div
            className="mb-4 rounded-[4px] px-4 py-3 text-sm"
            style={{
              backgroundColor:
                "color-mix(in srgb, var(--accent) 10%, transparent)",
              color: "var(--accent)",
            }}
          >
            {error}
          </div>
        )}

        {/* ── Step 1: 포지션 ── (시안 L89-110) */}
        {step === 1 && (
          <div>
            <div
              className="eyebrow"
              style={{ marginBottom: 6, color: "var(--accent)" }}
            >
              1 · POSITION
            </div>
            <h1
              style={{
                margin: "0 0 4px",
                fontSize: 24,
                fontWeight: 800,
                letterSpacing: "-0.01em",
                color: "var(--ink)",
                fontFamily: "var(--ff-display)",
              }}
            >
              주 포지션을 골라 주세요
            </h1>
            <p
              style={{
                margin: "0 0 22px",
                fontSize: 13,
                color: "var(--ink-mute)",
              }}
            >
              나중에 프로필에서 변경할 수 있어요 · 복수 선택 가능
            </p>
            {/* 시안 3열 그리드 — 모바일에선 globals.css 모바일 분기 또는 minmax로 자동 wrap */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(min(150px, 100%), 1fr))",
                gap: 8,
              }}
            >
              {POSITIONS.map((p) => {
                const on = selectedPositions.includes(p.id);
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => togglePosition(p.id)}
                    style={{
                      padding: "16px 12px",
                      textAlign: "center",
                      cursor: "pointer",
                      background: on
                        ? "color-mix(in oklab, var(--accent) 8%, transparent)"
                        : "var(--bg-alt)",
                      border: on
                        ? "2px solid var(--accent)"
                        : "2px solid var(--border)",
                      borderRadius: 4,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 18,
                        fontWeight: 900,
                        fontFamily: "var(--ff-display)",
                        marginBottom: 4,
                        color: "var(--ink)",
                      }}
                    >
                      {p.id}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        marginBottom: 2,
                        color: "var(--ink)",
                      }}
                    >
                      {p.label}
                    </div>
                    <div style={{ fontSize: 10, color: "var(--ink-dim)" }}>
                      {p.desc}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Step 2: 키·체중 ── (시안 L112-144) */}
        {step === 2 && (
          <div>
            <div
              className="eyebrow"
              style={{ marginBottom: 6, color: "var(--accent)" }}
            >
              2 · BODY
            </div>
            <h1
              style={{
                margin: "0 0 4px",
                fontSize: 24,
                fontWeight: 800,
                letterSpacing: "-0.01em",
                color: "var(--ink)",
                fontFamily: "var(--ff-display)",
              }}
            >
              신체 정보를 입력해 주세요
            </h1>
            <p
              style={{
                margin: "0 0 22px",
                fontSize: 13,
                color: "var(--ink-mute)",
              }}
            >
              매칭 정확도를 높이는 데 사용됩니다 · 비공개 가능
            </p>
            <div style={{ display: "grid", gap: 18 }}>
              {/* 키 슬라이더 */}
              <div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "baseline",
                    marginBottom: 8,
                  }}
                >
                  <label
                    style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)" }}
                  >
                    키
                  </label>
                  <span
                    style={{
                      fontSize: 18,
                      fontWeight: 800,
                      fontFamily: "var(--ff-display)",
                      color: "var(--accent)",
                    }}
                  >
                    {height} cm
                  </span>
                </div>
                <input
                  type="range"
                  min="150"
                  max="220"
                  value={height}
                  onChange={(e) => setHeight(parseInt(e.target.value))}
                  style={{ width: "100%", accentColor: "var(--accent)" }}
                />
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: 10,
                    color: "var(--ink-dim)",
                    marginTop: 4,
                  }}
                >
                  <span>150</span>
                  <span>185</span>
                  <span>220</span>
                </div>
              </div>
              {/* 체중 슬라이더 */}
              <div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "baseline",
                    marginBottom: 8,
                  }}
                >
                  <label
                    style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)" }}
                  >
                    체중
                  </label>
                  <span
                    style={{
                      fontSize: 18,
                      fontWeight: 800,
                      fontFamily: "var(--ff-display)",
                      color: "var(--accent)",
                    }}
                  >
                    {weight} kg
                  </span>
                </div>
                <input
                  type="range"
                  min="40"
                  max="150"
                  value={weight}
                  onChange={(e) => setWeight(parseInt(e.target.value))}
                  style={{ width: "100%", accentColor: "var(--accent)" }}
                />
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: 10,
                    color: "var(--ink-dim)",
                    marginTop: 4,
                  }}
                >
                  <span>40</span>
                  <span>95</span>
                  <span>150</span>
                </div>
              </div>
              {/* 비공개 체크박스 — 체크 시 PATCH에서 height/weight 제외 */}
              <label
                style={{
                  display: "flex",
                  gap: 8,
                  alignItems: "center",
                  fontSize: 12,
                  color: "var(--ink-mute)",
                  cursor: "pointer",
                }}
              >
                <input
                  type="checkbox"
                  checked={bodyPrivate}
                  onChange={(e) => setBodyPrivate(e.target.checked)}
                />
                신체 정보 비공개 (저장하지 않음)
              </label>
            </div>
          </div>
        )}

        {/* ── Step 3: 활동 지역 ── (시안 L146-170) */}
        {/* 시안은 14개 고정 칩이지만, 사이트는 RegionPicker(시/도→시/군/구 cascade) 컨벤션 유지 */}
        {step === 3 && (
          <div>
            <div
              className="eyebrow"
              style={{ marginBottom: 6, color: "var(--accent)" }}
            >
              3 · AREA
            </div>
            <h1
              style={{
                margin: "0 0 4px",
                fontSize: 24,
                fontWeight: 800,
                letterSpacing: "-0.01em",
                color: "var(--ink)",
                fontFamily: "var(--ff-display)",
              }}
            >
              주로 어디서 뛰나요?
            </h1>
            <p
              style={{
                margin: "0 0 22px",
                fontSize: 13,
                color: "var(--ink-mute)",
              }}
            >
              최대 3곳까지 선택 ({regions.filter((r) => r.city).length}/3)
            </p>
            <RegionPicker value={regions} onChange={setRegions} max={3} />
          </div>
        )}

        {/* ── Step 4: 사진 ── (시안 L172-190) */}
        {/* UI만 박제 — 실제 업로드는 /profile/edit 에서 처리 (M5 기존 정책) */}
        {step === 4 && (
          <div>
            <div
              className="eyebrow"
              style={{ marginBottom: 6, color: "var(--accent)" }}
            >
              4 · PHOTO
            </div>
            <h1
              style={{
                margin: "0 0 4px",
                fontSize: 24,
                fontWeight: 800,
                letterSpacing: "-0.01em",
                color: "var(--ink)",
                fontFamily: "var(--ff-display)",
              }}
            >
              프로필 사진을 추가해 주세요
            </h1>
            <p
              style={{
                margin: "0 0 22px",
                fontSize: 13,
                color: "var(--ink-mute)",
              }}
            >
              나중에 추가해도 괜찮아요
            </p>
            {/* 시안 drop zone 박제 (border:2px dashed) */}
            <div
              style={{
                display: "grid",
                placeItems: "center",
                padding: "32px 20px",
                background: "var(--bg-alt)",
                border: "2px dashed var(--border)",
                borderRadius: 4,
              }}
            >
              <div
                style={{
                  width: 96,
                  height: 96,
                  borderRadius: "50%",
                  background: "var(--bg-elev)",
                  border: "1px solid var(--border)",
                  display: "grid",
                  placeItems: "center",
                  marginBottom: 14,
                }}
              >
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: 42, color: "var(--ink-dim)" }}
                >
                  person
                </span>
              </div>
              {/* 사진 업로드는 /profile/edit 으로 안내 (M5 정책 — UI만 박제) */}
              <button
                type="button"
                onClick={() => router.push("/profile/edit")}
                className="rounded-[4px] bg-[var(--accent)] px-4 py-2 text-xs font-semibold text-white hover:opacity-90"
              >
                사진 업로드
              </button>
              <div
                style={{ fontSize: 11, color: "var(--ink-dim)", marginTop: 10 }}
              >
                JPG·PNG / 5MB 이하 · 프로필 편집 페이지로 이동
              </div>
            </div>
            <label
              style={{
                display: "flex",
                gap: 8,
                alignItems: "flex-start",
                fontSize: 12,
                color: "var(--ink-mute)",
                cursor: "pointer",
                marginTop: 14,
                lineHeight: 1.5,
              }}
            >
              <input
                type="checkbox"
                style={{ marginTop: 2 }}
                checked={skipPhoto}
                onChange={(e) => setSkipPhoto(e.target.checked)}
              />
              <span>
                나중에 사진 추가하기 — 프로필 설정에서 언제든 변경할 수 있습니다.
              </span>
            </label>
          </div>
        )}

        {/* ── 액션 버튼 (시안 L192-197) ── */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: 32,
            paddingTop: 20,
            borderTop: "1px solid var(--border)",
          }}
        >
          <button
            type="button"
            onClick={handleBack}
            disabled={saving}
            className="rounded-[4px] border border-[var(--border)] bg-[var(--bg-elev)] px-5 py-2 text-sm font-medium text-[var(--ink)] hover:bg-[var(--bg-alt)] disabled:opacity-50"
          >
            {step > 1 ? "← 이전" : "나가기"}
          </button>
          <button
            type="button"
            onClick={handleNext}
            disabled={saving}
            className="rounded-[4px] bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
          >
            {saving ? "저장 중..." : step < TOTAL_STEPS ? "다음 →" : "완료 →"}
          </button>
        </div>
      </div>

      {/* 시안 단계 미리보기 (L200-203) */}
      <div
        style={{
          marginTop: 14,
          fontSize: 11,
          color: "var(--ink-dim)",
          textAlign: "center",
        }}
      >
        포지션 · 신체 · 지역 · 사진 — 약 1분 소요
      </div>
    </div>
  );
}

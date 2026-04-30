"use client";

// M5 온보딩 압축 + Phase 9 D등급 박제 (OnboardingV2.jsx 톤 차용)
// 박제 매핑:
//  - .page 컨테이너 + max-width 640 (시안 page paddingTop:40)
//  - eyebrow "ONBOARDING · 프로필 완성" + h1 (시안 STEP n / total 헤더 위치 대응)
//  - progress bar (height:4, accent fill) — choose 단계 50% / fill 단계 100%
//  - .card padding 24~36px (시안 카드 본문 박스)
//  - 헤더 우측 "건너뛰기" 링크 (시안 동일)
//  - 버튼은 v2 토큰 (.btn / .btn--primary 대신 var 토큰 클래스 유지하되 톤 일치)
//
// 보존 원칙 (변경 0):
//  - 3필드 PATCH /api/web/profile (nickname / position / city / district)
//  - GET /api/web/profile prefill (snake_case 자동 변환 가드)
//  - profile_completed 의도적 미전송 (게임 신청 가드 보존)
//  - state 구조 (step / saving / error / nickname / position / regions)
//  - togglePosition / handleSave 로직 100% 동일
//  - RegionPicker max=3 그대로
//
// 기존 7필드 → 3필드 압축 컨텍스트:
//  - 전화번호 인증은 /verify?missing=phone 단계에서 별도 처리
//  - 키/몸무게/자기소개/이름은 /profile/edit에서 추후 보완 가능

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { RegionPicker, type Region } from "@/components/shared/region-picker";

// 농구 5포지션 — 복수 선택 가능
const POSITIONS = ["PG", "SG", "SF", "PF", "C"] as const;

// GET /api/web/profile 응답 minimal 형태 (prefill 한정)
// apiSuccess가 자동 snake_case 변환하므로 키는 모두 snake_case (errors.md 6회 재발 가드)
interface ProfilePrefillResponse {
  user?: {
    nickname?: string | null;
    position?: string | null;
    city?: string | null;
    district?: string | null;
  };
}

export default function ProfileCompletePage() {
  const router = useRouter();

  // 단계 관리: "choose" = 옵션 선택 카드, "fill" = 3필드 입력 폼
  // 가입 직후 사용자에게 "지금/나중" 선택권을 먼저 보여주기 위함
  const [step, setStep] = useState<"choose" | "fill">("choose");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // 닉네임 prefill: 가입 시 입력한 값을 GET /api/web/profile 로 미리 채워줌
  const [nickname, setNickname] = useState("");
  const [position, setPosition] = useState(""); // CSV 형식 ("PG,SG")
  const [regions, setRegions] = useState<Region[]>([{ city: "", district: "" }]);

  // 마운트 시 기존 닉네임 prefill (서버 가입 직후엔 이미 닉네임이 저장돼 있음)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/web/profile");
        if (!res.ok) return;
        const data: ProfilePrefillResponse = await res.json();
        // apiSuccess 응답은 snake_case로 직렬화됨 (raw fetch이므로 변환 없음)
        const u = data?.user;
        if (cancelled || !u) return;
        if (u.nickname) setNickname(u.nickname);
        if (u.position) setPosition(u.position);
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

  // 저장: 3필드만 PATCH. profile_completed 의도적 미전송 (게임 신청 가드 보존)
  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      const filledRegions = regions.filter((r) => r.city);
      // district는 빈 문자열이면 null 처리 (필수값 아님)
      const districtValue =
        filledRegions
          .map((r) => r.district)
          .filter(Boolean)
          .join(",") || null;

      const payload = {
        nickname: nickname.trim() || null,
        position: position || null,
        city: filledRegions.map((r) => r.city).join(",") || null,
        district: districtValue,
      };

      const res = await fetch("/api/web/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "저장 실패");

      // M5: 저장 후 곧장 홈으로 (preferences 강제 redirect 제거)
      router.push("/");
    } catch (e) {
      setError(e instanceof Error ? e.message : "오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  };

  // 공통 입력 스타일 (border-radius 4px, BDR Red 포커스 링)
  const inp =
    "w-full rounded-[4px] border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-3 text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)] focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 text-sm";
  const lbl = "mb-1 block text-sm text-[var(--color-text-muted)]";

  // 진행률 (시안 OnboardingV2 progress bar 톤): choose=50%, fill=100%
  const progressPct = step === "choose" ? 50 : 100;

  return (
    // 시안 v2 OnboardingV2.jsx — page max-width 640, paddingTop:40
    <div className="page mx-auto" style={{ maxWidth: 640 }}>
      {/* 시안 progress 헤더: STEP n / total 위치에 eyebrow + 건너뛰기 우측 정렬 */}
      <div style={{ marginBottom: 24 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: 11,
            color: "var(--color-text-muted)",
            fontWeight: 700,
            marginBottom: 6,
            letterSpacing: ".08em",
          }}
        >
          {/* eyebrow 자리: 시안의 "STEP n / total"에 대응. 박제 일관성을 위해 eyebrow 클래스 사용 */}
          <span className="eyebrow" style={{ marginBottom: 0 }}>
            ONBOARDING · 프로필 완성
          </span>
          {/* 시안 우측 "건너뛰기" 링크 — 홈으로 이동 */}
          <button
            type="button"
            onClick={() => router.push("/")}
            style={{
              cursor: "pointer",
              background: "transparent",
              border: 0,
              color: "var(--color-text-muted)",
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: ".08em",
              textTransform: "uppercase",
            }}
          >
            건너뛰기
          </button>
        </div>
        {/* 시안 progress bar (height:4, accent fill, transition 0.3s) */}
        <div
          style={{
            height: 4,
            background: "var(--color-surface)",
            borderRadius: 2,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${progressPct}%`,
              height: "100%",
              background: "var(--color-primary)",
              transition: "width .3s",
            }}
          />
        </div>
      </div>

      {/* 시안 .card 본문 (padding 36px 40px, minHeight 440 → choose 단계만 살짝 줄임) */}
      <div
        className="rounded-[4px] border border-[var(--color-border)] bg-[var(--color-card)] shadow-[var(--shadow-card)]"
        style={{ padding: "36px 40px" }}
      >
        {/* 환영 헤더 — Material Symbols 농구 아이콘 */}
        <div className="mb-7 text-center">
          <div className="mb-3">
            <span
              className="material-symbols-outlined"
              style={{ fontSize: "48px", color: "var(--color-primary)" }}
            >
              sports_basketball
            </span>
          </div>
          <h1
            style={{
              margin: "0 0 6px",
              fontSize: 24,
              fontWeight: 800,
              letterSpacing: "-0.02em",
              color: "var(--color-text-primary)",
              fontFamily: "var(--font-heading)",
            }}
          >
            환영합니다!
          </h1>
          <p
            style={{
              margin: 0,
              fontSize: 14,
              color: "var(--color-text-muted)",
              lineHeight: 1.6,
            }}
          >
            {step === "choose"
              ? "프로필을 더 채우면 맞춤 추천을 받을 수 있어요."
              : "닉네임, 포지션, 지역만 입력하면 끝나요."}
          </p>
        </div>

        {error && (
          <div
            className="mb-4 rounded-[4px] px-4 py-3 text-sm text-[var(--color-error)]"
            style={{
              backgroundColor:
                "color-mix(in srgb, var(--color-error) 10%, transparent)",
            }}
          >
            {error}
          </div>
        )}

        {/* 1단계: 옵션 카드 2개 — 모바일 세로, lg 가로 2열 */}
        {step === "choose" && (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {/* 카드 1: 지금 채우기 — primary 강조 (시안 step1 포지션 카드 톤) */}
            <button
              type="button"
              onClick={() => setStep("fill")}
              className="group flex flex-col items-start rounded-[4px] border-2 border-[var(--color-primary)] bg-[var(--color-surface)] p-6 text-left transition-transform hover:-translate-y-0.5 active:scale-[0.98]"
            >
              <span
                className="material-symbols-outlined mb-3"
                style={{ fontSize: "32px", color: "var(--color-primary)" }}
              >
                edit_note
              </span>
              <h2
                className="mb-1 text-lg font-bold text-[var(--color-text-primary)]"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                지금 채우기
              </h2>
              <p className="mb-4 text-sm text-[var(--color-text-muted)]">
                닉네임 · 포지션 · 활동 지역 (1분 소요)
              </p>
              <span className="mt-auto inline-flex items-center gap-1 rounded-[4px] bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-[var(--color-on-primary)]">
                시작하기
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: "16px" }}
                >
                  arrow_forward
                </span>
              </span>
            </button>

            {/* 카드 2: 나중에 — 보조 (시안 1px 회색 보더) */}
            <button
              type="button"
              onClick={() => router.push("/")}
              className="group flex flex-col items-start rounded-[4px] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-left transition-transform hover:-translate-y-0.5 active:scale-[0.98]"
            >
              <span
                className="material-symbols-outlined mb-3"
                style={{ fontSize: "32px", color: "var(--color-text-muted)" }}
              >
                schedule
              </span>
              <h2
                className="mb-1 text-lg font-bold text-[var(--color-text-primary)]"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                나중에 할게요
              </h2>
              <p className="mb-4 text-sm text-[var(--color-text-muted)]">
                먼저 둘러보고, 마이페이지에서 채울게요
              </p>
              <span className="mt-auto inline-flex items-center gap-1 rounded-[4px] border border-[var(--color-border)] px-4 py-2 text-sm font-medium text-[var(--color-text-muted)]">
                홈으로 가기
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: "16px" }}
                >
                  home
                </span>
              </span>
            </button>
          </div>
        )}

        {/* 2단계: 3필드 입력 폼 (닉네임/포지션/지역) */}
        {step === "fill" && (
          <div className="space-y-5">
            {/* 닉네임 */}
            <div>
              <label className={lbl}>닉네임</label>
              <input
                className={inp}
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="닉네임 (2~20자)"
                minLength={2}
                maxLength={20}
              />
            </div>

            {/* 포지션 */}
            <div>
              <label className={lbl}>
                포지션{" "}
                <span className="text-xs text-[var(--color-text-secondary)]">
                  (복수 선택 가능)
                </span>
              </label>
              <div className="flex gap-2">
                {POSITIONS.map((pos) => (
                  <button
                    key={pos}
                    type="button"
                    onClick={() => togglePosition(pos)}
                    className={`flex-1 rounded-[4px] border py-2 text-sm font-medium transition-colors ${
                      selectedPositions.includes(pos)
                        ? "border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)]"
                        : "border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-primary)]"
                    }`}
                  >
                    {pos}
                  </button>
                ))}
              </div>
            </div>

            {/* 활동 지역 */}
            <div>
              <label className={lbl}>활동 지역</label>
              <RegionPicker value={regions} onChange={setRegions} max={3} />
            </div>
          </div>
        )}
      </div>

      {/* 시안 카드 하단 액션 — 카드 외부 (시안은 내부지만 본 페이지는 step 분기 때문에 외부 배치) */}
      {step === "fill" && (
        <div
          className="space-y-3"
          style={{
            marginTop: 20,
          }}
        >
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="w-full rounded-[4px] bg-[var(--color-primary)] py-4 text-sm font-semibold text-[var(--color-on-primary)] transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {saving ? "저장 중..." : "저장하고 시작하기"}
          </button>
          <button
            type="button"
            onClick={() => setStep("choose")}
            className="w-full rounded-[4px] border border-[var(--color-border)] py-4 text-sm font-medium text-[var(--color-text-muted)] hover:bg-[var(--color-surface)]"
          >
            뒤로
          </button>
        </div>
      )}

      <div className="h-6" />
    </div>
  );
}

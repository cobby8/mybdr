"use client";

/**
 * EnvironmentStep — 5/7 PR2.a 클라이언트 폼
 *
 * 이유: onboarding 2단계 (활동 환경) 단독 폼. profile/edit §6 과 같은 데이터 (preferred_*)
 *   이지만 단순화 — 17 시도 chip + 5 게임유형 chip 만. 다른 §6 항목 (스타일/빈도/목표)
 *   은 후속 단계 (PR4) 또는 profile/edit 자율 입력.
 *
 * 어떻게:
 *   - 17 시도 멀티 chip (preferred_regions Json)
 *   - 5 게임유형 멀티 chip (preferred_game_types Json)
 *   - "다음 →" 버튼: 둘 다 1+ 선택해야 활성. PATCH /api/web/profile + router.push("/onboarding/basketball")
 */

import { useState } from "react";
import { useRouter } from "next/navigation";

const REGIONS_17 = [
  "서울", "부산", "대구", "인천", "광주", "대전", "울산", "세종",
  "경기", "강원", "충북", "충남", "전북", "전남", "경북", "경남", "제주",
] as const;

const GAME_TYPES = [
  { v: "pickup", l: "픽업게임" },
  { v: "guest", l: "게스트" },
  { v: "scrimmage", l: "연습경기" },
  { v: "tournament", l: "대회" },
  { v: "street", l: "길농" },
] as const;

type Props = {
  initialRegions: string[];
  initialGameTypes: string[];
};

export function EnvironmentStep({ initialRegions, initialGameTypes }: Props) {
  const router = useRouter();
  const [regions, setRegions] = useState<Set<string>>(new Set(initialRegions));
  const [gameTypes, setGameTypes] = useState<Set<string>>(new Set(initialGameTypes));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = regions.size > 0 && gameTypes.size > 0;

  function toggleRegion(r: string) {
    setRegions((prev) => {
      const next = new Set(prev);
      if (next.has(r)) next.delete(r);
      else next.add(r);
      return next;
    });
  }
  function toggleGameType(v: string) {
    setGameTypes((prev) => {
      const next = new Set(prev);
      if (next.has(v)) next.delete(v);
      else next.add(v);
      return next;
    });
  }

  async function handleNext() {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/web/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          preferred_regions: Array.from(regions),
          preferred_game_types: Array.from(gameTypes),
        }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setError(json?.error ?? "저장에 실패했습니다.");
        setSubmitting(false);
        return;
      }
      // 다음 단계 (3단계 농구 정보)
      router.push("/onboarding/basketball");
      router.refresh();
    } catch {
      setError("네트워크 오류가 발생했습니다.");
      setSubmitting(false);
    }
  }

  return (
    <div
      style={{
        background: "var(--bg-elev)",
        border: "1px solid var(--border)",
        borderRadius: 8,
        padding: 24,
      }}
    >
      {/* 활동 지역 */}
      <section style={{ marginBottom: 24 }}>
        <h3
          style={{
            fontSize: 14,
            fontWeight: 700,
            marginBottom: 6,
            color: "var(--ink)",
          }}
        >
          활동 지역 <span style={{ color: "var(--accent)" }}>*</span>
        </h3>
        <p style={{ fontSize: 12, color: "var(--ink-mute)", marginBottom: 12 }}>
          주로 활동하는 시·도 (복수 선택 가능)
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {REGIONS_17.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => toggleRegion(r)}
              className={`chip ${regions.has(r) ? "chip--active" : ""}`}
              disabled={submitting}
            >
              {r}
            </button>
          ))}
        </div>
      </section>

      {/* 게임 유형 */}
      <section style={{ marginBottom: 24 }}>
        <h3
          style={{
            fontSize: 14,
            fontWeight: 700,
            marginBottom: 6,
            color: "var(--ink)",
          }}
        >
          관심 경기 유형 <span style={{ color: "var(--accent)" }}>*</span>
        </h3>
        <p style={{ fontSize: 12, color: "var(--ink-mute)", marginBottom: 12 }}>
          복수 선택 가능
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {GAME_TYPES.map((g) => (
            <button
              key={g.v}
              type="button"
              onClick={() => toggleGameType(g.v)}
              className={`chip ${gameTypes.has(g.v) ? "chip--active" : ""}`}
              disabled={submitting}
            >
              {g.l}
            </button>
          ))}
        </div>
      </section>

      {error && (
        <p
          style={{
            fontSize: 13,
            color: "var(--accent)",
            marginBottom: 12,
          }}
        >
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={handleNext}
        disabled={!canSubmit || submitting}
        className="btn btn--primary"
        style={{
          width: "100%",
          minHeight: 44,
          fontSize: 14,
          fontWeight: 700,
          opacity: !canSubmit || submitting ? 0.6 : 1,
          cursor: !canSubmit || submitting ? "not-allowed" : "pointer",
        }}
      >
        {submitting ? "저장 중..." : "다음 →"}
      </button>
    </div>
  );
}

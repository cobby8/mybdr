"use client";

/**
 * BasketballStep — 5/7 PR2.b 클라이언트 폼
 *
 * 이유: 농구 정보 단독 폼. 포지션 5종 + 신장 + 5단계 실력 + 선출(선택).
 *   ⚠️ 등번호는 본 단계에서 제외 (사용자 룰 5/5 PR1) — 팀 가입 시 별도 신청.
 */

import { useState } from "react";
import { useRouter } from "next/navigation";

const POSITIONS = ["PG", "SG", "SF", "PF", "C"] as const;
const SKILL_LEVELS = ["초보", "초중급", "중급", "중상급", "상급"] as const;

type Props = {
  initialPosition: string;
  initialHeight: number | null;
  initialSkillLevel: string;
  initialIsElite: boolean;
};

export function BasketballStep({
  initialPosition,
  initialHeight,
  initialSkillLevel,
  initialIsElite,
}: Props) {
  const router = useRouter();
  const [position, setPosition] = useState<string>(initialPosition);
  const [heightInput, setHeightInput] = useState<string>(
    initialHeight != null ? String(initialHeight) : "",
  );
  const [skillLevel, setSkillLevel] = useState<string>(initialSkillLevel);
  const [isElite, setIsElite] = useState<boolean>(initialIsElite);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 핵심 3종 (포지션/신장/실력) 모두 입력되어야 진행 — 선출은 선택
  const canSubmit =
    position.trim() !== "" &&
    heightInput.trim() !== "" &&
    !isNaN(Number(heightInput)) &&
    Number(heightInput) > 0 &&
    skillLevel.trim() !== "";

  async function handleNext() {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/web/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          position,
          height: Number(heightInput),
          skill_level: skillLevel,
          is_elite: isElite,
        }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setError(json?.error ?? "저장에 실패했습니다.");
        setSubmitting(false);
        return;
      }
      // 마지막 필수 단계 — 홈으로 (PR4 후 /onboarding/done 으로 변경 예정)
      router.push("/");
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
      {/* 등번호 안내 — 5/5 PR1 결정 */}
      <div
        style={{
          background: "var(--cafe-blue-soft)",
          border: "1px solid var(--cafe-blue-hair)",
          color: "var(--cafe-blue-deep)",
          padding: "10px 12px",
          borderRadius: 6,
          fontSize: 12,
          lineHeight: 1.5,
          marginBottom: 20,
        }}
      >
        💡 등번호는 가입한 팀에서 별도로 신청합니다 — 팀장 승인 후 부여
      </div>

      {/* 포지션 */}
      <section style={{ marginBottom: 20 }}>
        <h3
          style={{
            fontSize: 14,
            fontWeight: 700,
            marginBottom: 8,
            color: "var(--ink)",
          }}
        >
          포지션 <span style={{ color: "var(--accent)" }}>*</span>
        </h3>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {POSITIONS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPosition(p)}
              className={`chip ${position === p ? "chip--active" : ""}`}
              disabled={submitting}
            >
              {p}
            </button>
          ))}
        </div>
      </section>

      {/* 신장 */}
      <section style={{ marginBottom: 20 }}>
        <h3
          style={{
            fontSize: 14,
            fontWeight: 700,
            marginBottom: 8,
            color: "var(--ink)",
          }}
        >
          신장 (cm) <span style={{ color: "var(--accent)" }}>*</span>
        </h3>
        <input
          type="number"
          inputMode="numeric"
          min={100}
          max={250}
          value={heightInput}
          onChange={(e) => setHeightInput(e.target.value)}
          placeholder="180"
          disabled={submitting}
          className="input"
          style={{
            width: "100%",
            maxWidth: 200,
            padding: "10px 12px",
            fontSize: 16,
            borderRadius: 4,
            border: "1px solid var(--border)",
            background: "var(--bg)",
            color: "var(--ink)",
          }}
        />
      </section>

      {/* 실력 5단계 */}
      <section style={{ marginBottom: 20 }}>
        <h3
          style={{
            fontSize: 14,
            fontWeight: 700,
            marginBottom: 8,
            color: "var(--ink)",
          }}
        >
          실력 수준 <span style={{ color: "var(--accent)" }}>*</span>
        </h3>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {SKILL_LEVELS.map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => setSkillLevel(l)}
              className={`chip ${skillLevel === l ? "chip--active" : ""}`}
              disabled={submitting}
            >
              {l}
            </button>
          ))}
        </div>
      </section>

      {/* 선출 (선택) */}
      <section style={{ marginBottom: 24 }}>
        <h3
          style={{
            fontSize: 14,
            fontWeight: 700,
            marginBottom: 6,
            color: "var(--ink)",
          }}
        >
          선출 여부
        </h3>
        <p style={{ fontSize: 12, color: "var(--ink-mute)", marginBottom: 8 }}>
          선출(고교/대학 농구부 등) 인 경우 일부 대회 참가 제한이 있습니다.
        </p>
        <div style={{ display: "flex", gap: 6 }}>
          <button
            type="button"
            onClick={() => setIsElite(false)}
            className={`chip ${!isElite ? "chip--active" : ""}`}
            disabled={submitting}
          >
            아니오
          </button>
          <button
            type="button"
            onClick={() => setIsElite(true)}
            className={`chip ${isElite ? "chip--active" : ""}`}
            disabled={submitting}
          >
            네 (선출)
          </button>
        </div>
      </section>

      {error && (
        <p style={{ fontSize: 13, color: "var(--accent)", marginBottom: 12 }}>
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
        {submitting ? "저장 중..." : "완료 →"}
      </button>
    </div>
  );
}

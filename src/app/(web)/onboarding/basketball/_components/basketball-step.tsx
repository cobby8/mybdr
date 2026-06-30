"use client";

/**
 * BasketballStep — 5/7 PR2.b + PUB-1-7 시각 갭 교체
 *
 * 이유(왜):
 *   Phase 7C-4 박제: PG/SG/SF/PF/C chip 버튼 + 신장 number input + 실력 chip.
 *   BDR-current 시안(OnboardingBasketball.jsx): 포지션을 카드 스타일(아이콘+설명)로 표현.
 *   갭: 포지션 UI가 chip→card 미전환.
 *   제약: 데이터 필드(position=PG|SG|…/height/skill_level/is_elite) 완전 보존.
 *     DB 미지원 필드(hand/career/years) 추가 금지.
 *
 * 어떻게:
 *   - POSITIONS: 기존 값(PG/SG/SF/PF/C) 유지 + 카드용 label/desc 추가 (표시용)
 *   - 카드 클릭 → setPosition(p.value) — 기존 submit body의 position 값 동일
 *   - 신장/실력/선출 섹션: 기존 로직 100% 보존, 마이너 스타일 개선만
 *   - submit body: 완전 동일 (position, height, skill_level, is_elite)
 *
 * lock: PATCH /api/web/profile body 0 변경. router.push("/onboarding/preferences") 0 변경.
 */

import { useState } from "react";
import { useRouter } from "next/navigation";

// 기존 값 보존 + 카드 표시용 label/desc 추가
const POSITIONS = [
  { value: "PG", label: "포인트가드", desc: "볼 핸들링·패스·리딩" },
  { value: "SG", label: "슈팅가드",   desc: "3점·드리블·슈팅" },
  { value: "SF", label: "스몰포워드", desc: "다재다능·득점" },
  { value: "PF", label: "파워포워드", desc: "리바운드·포스트업" },
  { value: "C",  label: "센터",       desc: "내곽·블락·리바운드" },
] as const;

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
      // 5/7 PR4: 필수 단계 완료 → 선택 단계 통합 페이지 (preferences) 진입
      router.push("/onboarding/preferences");
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

      {/* 포지션 — chip→card 전환 (시안 OnboardingBasketball.jsx 카드 스타일 박제) */}
      <section style={{ marginBottom: 20 }}>
        <h3
          style={{
            fontSize: 14,
            fontWeight: 700,
            marginBottom: 10,
            color: "var(--ink)",
          }}
        >
          포지션 <span style={{ color: "var(--accent)" }}>*</span>
        </h3>
        {/* ob2-pos-grid: onboarding.css 2열 카드 그리드 (C는 단독 중앙) */}
        <div className="ob2-pos-grid">
          {POSITIONS.map((p) => (
            <button
              key={p.value}
              type="button"
              onClick={() => setPosition(p.value)}
              disabled={submitting}
              className={`ob2-pos-card${position === p.value ? " ob2-pos-card--active" : ""}`}
            >
              {/* 약어 박스 — 44×44 정사각형 (룰 §C 10) */}
              <span className="ob2-pos-card__abbr" aria-hidden="true">
                {p.value}
              </span>
              <span>
                <div className="ob2-pos-card__label">{p.label}</div>
                <div className="ob2-pos-card__desc">{p.desc}</div>
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* 신장 — number input 그대로 (데이터 보존) */}
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

      {/* 실력 5단계 — chip 유지 (데이터 보존) */}
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

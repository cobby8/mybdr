"use client";

/**
 * PreferencesStep — 5/7 PR4 선택 단계 통합 폼
 *
 * 이유: onboarding 4~10 단계 (선택) 를 단일 페이지에 통합. 사용자 피로 ↓ + skip 자유.
 *
 * 입력 항목 (모두 선택):
 *   - 자기소개 (bio, 200자)
 *   - 농구 스타일 (12종 chip, ≤4 권장)
 *   - 활동 빈도 (4단계 단일)
 *   - 가입 목표 (6종 chip 멀티)
 *
 * skip: "나중에 입력" 버튼 → 입력 0 + onboarding_step=10 으로 PATCH → / redirect
 * 저장: 입력값 + onboarding_step=10 PATCH → / redirect (점수 시스템 트리거)
 */

import { useState } from "react";
import { useRouter } from "next/navigation";

const STYLES_12 = [
  "3점 슈터", "돌파형", "포스트업", "올라운더", "수비형", "리바운더",
  "포인트가드형", "캐치앤슛", "픽앤롤", "빠른발", "패서", "스팟업",
] as const;

const FREQUENCIES = [
  { v: "daily", l: "거의 매일" },
  { v: "weekly", l: "주 1~3회" },
  { v: "monthly", l: "월 1~3회" },
  { v: "rare", l: "가끔" },
] as const;

const GOALS_6 = [
  { v: "friends", l: "친구 만들기", e: "🤝" },
  { v: "fit", l: "운동·체력", e: "💪" },
  { v: "skill", l: "실력 향상", e: "🎯" },
  { v: "compete", l: "대회 출전", e: "🏆" },
  { v: "team", l: "팀 합류", e: "👥" },
  { v: "fun", l: "재미·취미", e: "🎉" },
] as const;

type Props = {
  initialBio: string;
  initialStyles: string[];
  initialGoals: string[];
  initialFrequency: string;
};

export function PreferencesStep({
  initialBio,
  initialStyles,
  initialGoals,
  initialFrequency,
}: Props) {
  const router = useRouter();
  const [bio, setBio] = useState<string>(initialBio);
  const [styles, setStyles] = useState<Set<string>>(new Set(initialStyles));
  const [goals, setGoals] = useState<Set<string>>(new Set(initialGoals));
  const [frequency, setFrequency] = useState<string>(initialFrequency);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleStyle(s: string) {
    setStyles((prev) => {
      const next = new Set(prev);
      if (next.has(s)) next.delete(s);
      else next.add(s);
      return next;
    });
  }
  function toggleGoal(v: string) {
    setGoals((prev) => {
      const next = new Set(prev);
      if (next.has(v)) next.delete(v);
      else next.add(v);
      return next;
    });
  }

  // 입력값 PATCH (저장 또는 skip 둘 다 onboarding_step=10 마킹)
  async function submit(includeData: boolean) {
    setSubmitting(true);
    setError(null);
    try {
      const body: Record<string, unknown> = {
        // onboarding_step 마킹 = 본 페이지 통과 표시. 다음 진입 시 / redirect 유도.
        onboarding_step: 10,
      };
      if (includeData) {
        if (bio.trim()) body.bio = bio.trim();
        if (styles.size > 0) body.styles = Array.from(styles);
        if (goals.size > 0) body.goals = Array.from(goals);
        if (frequency) body.play_frequency = frequency;
      }

      const res = await fetch("/api/web/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setError(json?.error ?? "저장에 실패했습니다.");
        setSubmitting(false);
        return;
      }
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
      {/* 자기소개 */}
      <section style={{ marginBottom: 24 }}>
        <h3
          style={{
            fontSize: 14,
            fontWeight: 700,
            marginBottom: 8,
            color: "var(--ink)",
          }}
        >
          자기소개
        </h3>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          maxLength={200}
          rows={3}
          disabled={submitting}
          placeholder="간단한 자기소개를 작성해 주세요"
          className="input"
          style={{
            width: "100%",
            padding: "10px 12px",
            fontSize: 16,
            borderRadius: 4,
            border: "1px solid var(--border)",
            background: "var(--bg)",
            color: "var(--ink)",
            resize: "vertical",
            fontFamily: "inherit",
          }}
        />
        <span style={{ fontSize: 11, color: "var(--ink-mute)" }}>
          {bio.length}/200
        </span>
      </section>

      {/* 농구 스타일 */}
      <section style={{ marginBottom: 24 }}>
        <h3
          style={{
            fontSize: 14,
            fontWeight: 700,
            marginBottom: 6,
            color: "var(--ink)",
          }}
        >
          농구 스타일
        </h3>
        <p style={{ fontSize: 12, color: "var(--ink-mute)", marginBottom: 12 }}>
          본인의 플레이 스타일을 골라주세요 (4개 이하 권장)
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {STYLES_12.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => toggleStyle(s)}
              className={`chip ${styles.has(s) ? "chip--active" : ""}`}
              disabled={submitting}
            >
              {s}
            </button>
          ))}
        </div>
      </section>

      {/* 활동 빈도 */}
      <section style={{ marginBottom: 24 }}>
        <h3
          style={{
            fontSize: 14,
            fontWeight: 700,
            marginBottom: 8,
            color: "var(--ink)",
          }}
        >
          활동 빈도
        </h3>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {FREQUENCIES.map((f) => (
            <button
              key={f.v}
              type="button"
              onClick={() => setFrequency(f.v)}
              className={`chip ${frequency === f.v ? "chip--active" : ""}`}
              disabled={submitting}
            >
              {f.l}
            </button>
          ))}
        </div>
      </section>

      {/* 가입 목표 */}
      <section style={{ marginBottom: 24 }}>
        <h3
          style={{
            fontSize: 14,
            fontWeight: 700,
            marginBottom: 6,
            color: "var(--ink)",
          }}
        >
          가입 목표
        </h3>
        <p style={{ fontSize: 12, color: "var(--ink-mute)", marginBottom: 12 }}>
          mybdr 에서 무엇을 얻고 싶으신가요? (복수 선택 가능)
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {GOALS_6.map((g) => (
            <button
              key={g.v}
              type="button"
              onClick={() => toggleGoal(g.v)}
              className={`chip ${goals.has(g.v) ? "chip--active" : ""}`}
              disabled={submitting}
            >
              <span style={{ marginRight: 4 }}>{g.e}</span>
              {g.l}
            </button>
          ))}
        </div>
      </section>

      {error && (
        <p style={{ fontSize: 13, color: "var(--accent)", marginBottom: 12 }}>
          {error}
        </p>
      )}

      {/* 액션 — 저장 / skip */}
      <div style={{ display: "flex", gap: 8, flexDirection: "column" }}>
        <button
          type="button"
          onClick={() => submit(true)}
          disabled={submitting}
          className="btn btn--primary"
          style={{
            width: "100%",
            minHeight: 44,
            fontSize: 14,
            fontWeight: 700,
            opacity: submitting ? 0.6 : 1,
            cursor: submitting ? "wait" : "pointer",
          }}
        >
          {submitting ? "저장 중..." : "저장하고 시작 →"}
        </button>
        <button
          type="button"
          onClick={() => submit(false)}
          disabled={submitting}
          className="btn"
          style={{
            width: "100%",
            minHeight: 36,
            fontSize: 12,
            opacity: submitting ? 0.6 : 1,
            cursor: submitting ? "wait" : "pointer",
          }}
        >
          나중에 입력 (skip)
        </button>
      </div>
    </div>
  );
}

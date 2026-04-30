"use client";

/* ============================================================
 * /profile/complete/preferences — BDR v2.2 P2-1 박제 (D등급 P2)
 *
 * 시안 출처: Dev/design/BDR v2.2/screens/ProfileCompletePreferences.jsx
 *
 * Why: ProfileComplete (P0-4, 기본 정보 4 step) 완료 후 follow-up wizard.
 *      매칭 정확도 향상용 취향 설정. ProfileComplete = 포지션/키/지역/사진,
 *      이건 스킬/스타일/요일·시간/목표 4 step.
 * Pattern: ProfileComplete 와 동일 톤 (진행 막대 + step + 좌측 nav 없음, 단순 next/back)
 *
 * 진입: ProfileComplete 완료 화면 "취향 설정 →" / /profile "프로필 보강하기"
 * 복귀: 마지막 step 완료 → /home / 건너뛰기 → /home
 *
 * 회귀 검수 매트릭스:
 *   기능              | 옛 페이지 | 시안 v2.2          | 진입점         | 모바일
 *   진행바 4 step     | redirect | ✅ 동일 톤          | 후속 wizard   | OK
 *   1) 스킬 자가평가  | -        | ✅ 5축 1~5 버튼     | -            | 1열
 *   2) 플레이 스타일  | -        | ✅ 6 카드 multi     | -            | 2열
 *   3) 활동 요일·시간 | -        | ✅ grid + chips     | -            | 가로 hscroll
 *   4) 목표·동기      | -        | ✅ 4 카드 multi     | -            | 1열
 *   완료 → 홈         | -        | ✅                  | -            | OK
 *
 * 사용자 결정 §2 준수: var(--*) 토큰만 / Material Symbols / radius 4px /
 *                     alert 신규 0 / 모바일 분기는 globals.css 자동 처리.
 *
 * 데이터 fetching: 사이트 기존 방식(없음) 유지 — 시안에도 API 저장 호출 없음.
 *                  취향 데이터는 클라이언트 state로만 보유 → 매칭 추천 엔진
 *                  연동은 별도 큐(추후 PATCH /api/web/profile/preferences).
 *                  완료 시 router.push("/")로 홈 이동.
 * ============================================================ */

import { useState } from "react";
import { useRouter } from "next/navigation";
// Phase 12 §G: 모바일 백버튼 (사용자 보고)
import { PageBackButton } from "@/components/shared/page-back-button";

// 스킬 5축 — 시안 L80~L86
type SkillKey = "shoot" | "drive" | "def" | "pass" | "reb";
type Skills = Record<SkillKey, number>;

const SKILLS: { k: SkillKey; label: string }[] = [
  { k: "shoot", label: "슈팅" },
  { k: "drive", label: "돌파" },
  { k: "def", label: "수비" },
  { k: "pass", label: "패스" },
  { k: "reb", label: "리바운드" },
];

// 플레이 스타일 6종 — 시안 L115~L122
const STYLES = [
  { id: "aggressive", icon: "🔥", label: "공격적", desc: "적극적인 돌파·도전" },
  { id: "team", icon: "🤝", label: "팀 플레이", desc: "어시스트·스크린" },
  { id: "shooter", icon: "🎯", label: "슈터형", desc: "외곽 슈팅 위주" },
  { id: "paint", icon: "💪", label: "골밑형", desc: "페인트존 지배" },
  { id: "allround", icon: "⚡", label: "올라운드", desc: "다재다능" },
  { id: "chill", icon: "😎", label: "재미 우선", desc: "경쟁보다 즐거움" },
];

// 시간대 6종 — 시안 L166~L173
const TIMES = [
  { id: "dawn", label: "새벽 (5-8시)" },
  { id: "morning", label: "오전 (8-12시)" },
  { id: "lunch", label: "점심 (12-14시)" },
  { id: "afternoon", label: "오후 (14-18시)" },
  { id: "evening", label: "저녁 (18-22시)" },
  { id: "late", label: "심야 (22-25시)" },
];

// 요일 7종 — 시안 L150
const DAYS = ["월", "화", "수", "목", "금", "토", "일"];

// 목표 4종 — 시안 L196~L201
const GOALS = [
  { id: "fun", icon: "sports_basketball", label: "재미있게 농구하기", desc: "픽업·캐주얼 게임 중심" },
  { id: "compete", icon: "emoji_events", label: "경쟁적인 경기", desc: "리그·토너먼트" },
  { id: "improve", icon: "trending_up", label: "실력 향상", desc: "코칭·피드백" },
  { id: "social", icon: "group", label: "새로운 친구·팀 만나기", desc: "커뮤니티 중심" },
];

export default function ProfileCompletePreferencesPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const total = 4;

  // 시안 L27~L33: 단일 data state로 5종 묶음 관리
  const [skills, setSkills] = useState<Skills>({ shoot: 3, drive: 3, def: 3, pass: 3, reb: 3 });
  const [styles, setStyles] = useState<string[]>([]);
  const [days, setDays] = useState<string[]>([]);
  const [times, setTimes] = useState<string[]>([]);
  const [goals, setGoals] = useState<string[]>([]);

  // 토글 헬퍼 — 시안 L35~L37
  const toggle = (arr: string[], setter: (v: string[]) => void, v: string) => {
    setter(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);
  };

  // 스킬 값 설정 — 시안 L39
  const setSkill = (k: SkillKey, v: number) => setSkills({ ...skills, [k]: v });

  // 완료 화면 (step === total + 1) — 시안 L42~L58
  if (step === total + 1) {
    return (
      <div className="page" style={{ maxWidth: 560, paddingTop: 60 }}>
        <div className="card" style={{ padding: "48px 36px", textAlign: "center" }}>
          {/* 그라디언트 원형 아이콘 — 시안 L46 */}
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: "50%",
              background: "linear-gradient(135deg, var(--cafe-blue), #4F46E5)",
              color: "#fff",
              display: "grid",
              placeItems: "center",
              fontSize: 32,
              margin: "0 auto 18px",
            }}
          >
            🎯
          </div>
          <h1 style={{ margin: "0 0 8px", fontSize: 24, fontWeight: 800, letterSpacing: "-0.02em" }}>
            취향 설정 완료!
          </h1>
          <p style={{ margin: "0 0 24px", fontSize: 14, color: "var(--ink-mute)", lineHeight: 1.6 }}>
            맞춤 추천이 더 정확해졌어요.
            <br />
            홈에서 추천 픽업·게스트 모집을 확인해 보세요.
          </p>
          <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
            <button
              type="button"
              className="btn btn--primary btn--lg"
              onClick={() => router.push("/")}
            >
              홈으로 →
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page" style={{ maxWidth: 620, paddingTop: 30 }}>
      {/* Phase 12 §G — 모바일 백버튼 (lg+ hidden). 위저드 진입 직후 ProfileComplete 로 복귀 */}
      <PageBackButton fallbackHref="/profile/complete" />
      {/* 진행 막대 — 시안 L62~L71, ProfileComplete (P0-4) 와 동일 톤 */}
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
          <span>
            STEP {step} / {total} · 취향 설정
          </span>
          {/* 건너뛰기 — 시안 L66, /home으로 이동 */}
          <a onClick={() => router.push("/")} style={{ cursor: "pointer" }}>
            건너뛰기
          </a>
        </div>
        <div style={{ height: 4, background: "var(--bg-alt)", borderRadius: 2, overflow: "hidden" }}>
          <div
            style={{
              width: `${(step / total) * 100}%`,
              height: "100%",
              background: "var(--cafe-blue)",
              transition: "width .3s",
            }}
          />
        </div>
      </div>

      {/* STEP 1: 스킬 자가평가 — 시안 L74~L106 */}
      {step === 1 && (
        <div className="card" style={{ padding: "30px 32px" }}>
          <div className="eyebrow" style={{ marginBottom: 6 }}>
            STEP 1 · SKILLS
          </div>
          <h1 style={{ margin: "0 0 6px", fontSize: 24, fontWeight: 800, letterSpacing: "-0.015em" }}>
            스킬 자가평가
          </h1>
          <p style={{ margin: "0 0 24px", fontSize: 13, color: "var(--ink-mute)" }}>
            1 (입문) ~ 5 (수준급) · 비교 매칭에만 사용됩니다.
          </p>

          {SKILLS.map((s) => (
            <div key={s.k} style={{ marginBottom: 18 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 600 }}>{s.label}</span>
                <span
                  style={{
                    fontSize: 13,
                    fontFamily: "var(--ff-mono)",
                    color: "var(--cafe-blue)",
                    fontWeight: 700,
                  }}
                >
                  {skills[s.k]} / 5
                </span>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                {/* 1~5 버튼 — 시안 L93~L100, 선택값 이하 모두 활성 */}
                {[1, 2, 3, 4, 5].map((n) => {
                  const on = n <= skills[s.k];
                  return (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setSkill(s.k, n)}
                      style={{
                        flex: 1,
                        height: 36,
                        borderRadius: 6,
                        fontSize: 13,
                        fontWeight: 700,
                        border: on ? "1px solid var(--cafe-blue)" : "1px solid var(--border)",
                        background: on ? "var(--cafe-blue)" : "var(--bg-elev)",
                        color: on ? "#fff" : "var(--ink-soft)",
                        cursor: "pointer",
                        transition: "all .15s",
                      }}
                    >
                      {n}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* STEP 2: 플레이 스타일 — 시안 L109~L139 */}
      {step === 2 && (
        <div className="card" style={{ padding: "30px 32px" }}>
          <div className="eyebrow" style={{ marginBottom: 6 }}>
            STEP 2 · STYLE
          </div>
          <h1 style={{ margin: "0 0 6px", fontSize: 24, fontWeight: 800, letterSpacing: "-0.015em" }}>
            플레이 스타일
          </h1>
          <p style={{ margin: "0 0 20px", fontSize: 13, color: "var(--ink-mute)" }}>
            해당하는 항목 모두 선택 · 복수 선택 가능
          </p>
          {/* 2-col grid — 시안 L114, 모바일은 globals.css 분기로 자동 1열 */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 8 }}>
            {STYLES.map((s) => {
              const on = styles.includes(s.id);
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => toggle(styles, setStyles, s.id)}
                  style={{
                    textAlign: "left",
                    padding: "14px 16px",
                    borderRadius: 8,
                    border: on ? "1.5px solid var(--cafe-blue)" : "1px solid var(--border)",
                    background: on
                      ? "color-mix(in oklab, var(--cafe-blue) 8%, transparent)"
                      : "var(--bg-elev)",
                    cursor: "pointer",
                    transition: "all .15s",
                  }}
                >
                  <div style={{ fontSize: 22, marginBottom: 4 }}>{s.icon}</div>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      marginBottom: 2,
                      color: on ? "var(--cafe-blue)" : "var(--ink)",
                    }}
                  >
                    {s.label}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--ink-mute)" }}>{s.desc}</div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* STEP 3: 활동 요일·시간 — 시안 L142~L187 */}
      {step === 3 && (
        <div className="card" style={{ padding: "30px 32px" }}>
          <div className="eyebrow" style={{ marginBottom: 6 }}>
            STEP 3 · WHEN
          </div>
          <h1 style={{ margin: "0 0 6px", fontSize: 24, fontWeight: 800, letterSpacing: "-0.015em" }}>
            활동 요일·시간
          </h1>
          <p style={{ margin: "0 0 20px", fontSize: 13, color: "var(--ink-mute)" }}>
            주로 활동 가능한 요일과 시간대를 선택해주세요.
          </p>

          {/* 요일 7-col grid — 시안 L148~L162 */}
          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--ink-soft)", marginBottom: 8 }}>
            요일
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
              gap: 6,
              marginBottom: 20,
            }}
          >
            {DAYS.map((d) => {
              const on = days.includes(d);
              return (
                <button
                  key={d}
                  type="button"
                  onClick={() => toggle(days, setDays, d)}
                  style={{
                    height: 42,
                    borderRadius: 6,
                    fontSize: 13,
                    fontWeight: 700,
                    border: on ? "1.5px solid var(--cafe-blue)" : "1px solid var(--border)",
                    background: on ? "var(--cafe-blue)" : "var(--bg-elev)",
                    color: on ? "#fff" : "var(--ink-soft)",
                    cursor: "pointer",
                  }}
                >
                  {d}
                </button>
              );
            })}
          </div>

          {/* 시간대 chips (가로 스크롤) — 시안 L164~L185 */}
          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--ink-soft)", marginBottom: 8 }}>
            시간대
          </div>
          <div
            className="hscroll"
            style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4 }}
          >
            {TIMES.map((t) => {
              const on = times.includes(t.id);
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => toggle(times, setTimes, t.id)}
                  style={{
                    flexShrink: 0,
                    padding: "10px 16px",
                    borderRadius: 20,
                    fontSize: 12,
                    fontWeight: 600,
                    border: on ? "1.5px solid var(--cafe-blue)" : "1px solid var(--border)",
                    background: on
                      ? "color-mix(in oklab, var(--cafe-blue) 12%, transparent)"
                      : "var(--bg-elev)",
                    color: on ? "var(--cafe-blue)" : "var(--ink-soft)",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                  }}
                >
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* STEP 4: 목표·동기 — 시안 L190~L225 */}
      {step === 4 && (
        <div className="card" style={{ padding: "30px 32px" }}>
          <div className="eyebrow" style={{ marginBottom: 6 }}>
            STEP 4 · GOALS
          </div>
          <h1 style={{ margin: "0 0 6px", fontSize: 24, fontWeight: 800, letterSpacing: "-0.015em" }}>
            이 앱에서 원하는 것
          </h1>
          <p style={{ margin: "0 0 20px", fontSize: 13, color: "var(--ink-mute)" }}>
            매칭 추천 우선순위에 반영됩니다 · 복수 선택 가능
          </p>
          <div style={{ display: "grid", gap: 8 }}>
            {GOALS.map((g) => {
              const on = goals.includes(g.id);
              return (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => toggle(goals, setGoals, g.id)}
                  style={{
                    textAlign: "left",
                    padding: "14px 18px",
                    borderRadius: 8,
                    border: on ? "1.5px solid var(--cafe-blue)" : "1px solid var(--border)",
                    background: on
                      ? "color-mix(in oklab, var(--cafe-blue) 8%, transparent)"
                      : "var(--bg-elev)",
                    cursor: "pointer",
                    display: "grid",
                    gridTemplateColumns: "40px 1fr auto",
                    gap: 14,
                    alignItems: "center",
                  }}
                >
                  {/* Material Symbols Outlined 아이콘 — 시안 L210 */}
                  <span
                    className="material-symbols-outlined"
                    style={{
                      fontSize: 28,
                      color: on ? "var(--cafe-blue)" : "var(--ink-mute)",
                    }}
                  >
                    {g.icon}
                  </span>
                  <div>
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 700,
                        marginBottom: 2,
                        color: on ? "var(--cafe-blue)" : "var(--ink)",
                      }}
                    >
                      {g.label}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--ink-mute)" }}>{g.desc}</div>
                  </div>
                  {/* 선택 표시 원형 — 시안 L215~L219 */}
                  <span
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: "50%",
                      border: on ? "6px solid var(--cafe-blue)" : "1.5px solid var(--border)",
                      background: on ? "#fff" : "transparent",
                    }}
                  />
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Nav 버튼 — 시안 L228~L235 */}
      <div style={{ display: "flex", gap: 8, marginTop: 18 }}>
        {step > 1 && (
          <button
            type="button"
            className="btn btn--lg"
            onClick={() => setStep(step - 1)}
            style={{ flex: "0 0 auto" }}
          >
            ← 이전
          </button>
        )}
        <button
          type="button"
          className="btn btn--primary btn--lg"
          onClick={() => setStep(step + 1)}
          style={{ flex: 1 }}
        >
          {step === total ? "완료" : "다음 →"}
        </button>
      </div>
    </div>
  );
}

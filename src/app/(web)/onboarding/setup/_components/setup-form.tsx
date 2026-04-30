"use client";

/* ============================================================
 * /onboarding/setup — 위저드 본문 (client form)
 *
 * 이유(왜):
 *   Phase 10-5 후속 — 재진입 차단을 위해 server wrapper(page.tsx)에서
 *   세션·onboarding_completed_at 체크 후 redirect 가 필요하다.
 *   기존 단일 "use client" 페이지였기 때문에 server 코드를 둘 수 없어
 *   본문(위저드 form)만 이 파일로 분리한다.
 *
 * 변경 정책:
 *   - 위저드 흐름 / 시안 / API 호출 0 변경 (Phase 10-5 본 구현 그대로 박제)
 *   - 컴포넌트명만 OnboardingSetupForm 으로 변경
 *   - props 로 currentUserId 받지만 본 폼에서 직접 사용하지 않음
 *     (서버에서 이미 인증·완료 검증 완료. 추후 분석/디버그용 식별자 보관)
 *
 * 시안 매핑 (Dev/design/BDR v2 (1)/screens/OnboardingV2.jsx):
 *   step 1 → step 0 ("pos" + 신장 슬라이더 한 화면 — 시안 L71~L98 그대로)
 *   step 2 → step 1 ("level" — 시안 L100~L125)
 *   step 3 → step 2 ("styles" — 시안 L127~L146 / 최대 4 선택)
 *   step 4 → step 3 ("areas" + frequency 묶음 — 시안 L148~L174)
 *   step 5 → step 4 ("goals" — 시안 L176~L207 / 복수 선택)
 *   step 6 → step 5 ("notifications" — 시안 L209~L236 / 토글 4종)
 *   step 7 → done 화면 (시안 L24~L55 박제)
 * ============================================================ */

import { useState, type ReactElement } from "react";
import { useRouter } from "next/navigation";
import { StepWizard, type StepWizardStep } from "@/components/wizard/step-wizard";

// 위저드 단계 정의: id 는 분석/QA 용 디버그 식별자, label 은 indicator 노출
// optional=true 인 단계는 "(선택)" 라벨 + 진행 차단 없음
const STEPS: StepWizardStep[] = [
  { id: "pos", label: "포지션·신장" },
  { id: "level", label: "실력" },
  { id: "styles", label: "스타일", optional: true },
  { id: "areas", label: "지역·빈도", optional: true },
  { id: "goals", label: "목표", optional: true },
  { id: "notifications", label: "알림" },
];

// 시안 L77~L79 의 포지션 3종 카드 데이터 (값/라벨/설명/포지션 색상)
const POSITIONS = [
  { v: "G", l: "가드", d: "볼 핸들링·슈팅·플레이메이킹", color: "#0F5FCC" },
  { v: "F", l: "포워드", d: "다재다능·득점·리바운드", color: "#10B981" },
  { v: "C", l: "센터", d: "포스트업·리바운드·블락", color: "#DC2626" },
] as const;

// 시안 L106~L111 의 6단계 실력 정의
const LEVELS = [
  { v: "초보", d: "농구 경험 거의 없음. 재미 위주." },
  { v: "초-중급", d: "룰 알고 패스·슛 기본 가능." },
  { v: "중급", d: "픽업 정기 참여. 포지션별 롤 수행." },
  { v: "중-상급", d: "아마추어 대회 출전. 상대 분석 가능." },
  { v: "상급", d: "리그·전국 아마 대회 입상 경험." },
  { v: "선출급", d: "선수 또는 선수 출신." },
] as const;

// 시안 L132 의 12종 스타일. 시안 의도 그대로 한국어 라벨 박제
const STYLE_OPTIONS = [
  "3점 슈터", "돌파형", "포스트업", "패서", "수비수", "올라운더",
  "리바운더", "블락커", "허슬러", "전환 빠른", "시스템 플레이", "야전 타입",
] as const;

// 시안 L153 의 18개 지역 chip
const AREA_OPTIONS = [
  "강남", "서초", "송파", "성동", "용산", "중구",
  "마포", "영등포", "구로", "금천", "관악", "동작",
  "성북", "강동", "광진", "하남", "고양", "부천",
] as const;

// 시안 L168 의 4단계 빈도
const FREQ_OPTIONS = [
  { v: "daily", l: "주 3회 이상" },
  { v: "weekly", l: "주 1~2회" },
  { v: "monthly", l: "월 몇 번" },
  { v: "rare", l: "가끔" },
] as const;

// 시안 L182~L187 의 6종 목표 (이모지 + 라벨 + 설명)
const GOAL_OPTIONS = [
  { v: "friends", e: "🤝", l: "새 친구·팀 만들기", d: "지역·실력 맞는 사람들과 네트워킹" },
  { v: "fit", e: "💪", l: "건강·운동", d: "정기적인 농구로 체력 관리" },
  { v: "skill", e: "🏀", l: "실력 향상", d: "기술·전술 배우고 실력 키우기" },
  { v: "compete", e: "🏆", l: "대회 참가", d: "아마추어 대회·리그 참가" },
  { v: "team", e: "👥", l: "팀 만들기", d: "나만의 팀 운영·관리" },
  { v: "fun", e: "🔥", l: "순수 재미", d: "부담 없이 즐기는 픽업 경기" },
] as const;

// 시안 L214~L218 의 알림 토글 4종
const NOTI_OPTIONS = [
  { k: "games", l: "경기 알림", d: "관심 지역에 새 경기가 열리면 알림" },
  { k: "tournaments", l: "대회 알림", d: "대회 접수 시작·마감·결과" },
  { k: "messages", l: "쪽지·팀 활동", d: "쪽지, 팀 공지, 가입 신청 등" },
  { k: "marketing", l: "이벤트·프로모션", d: "BDR+ 할인, 굿즈, 이벤트" },
] as const;

type Frequency = (typeof FREQ_OPTIONS)[number]["v"];
type NotiKey = (typeof NOTI_OPTIONS)[number]["k"];
type NotiState = Record<NotiKey, boolean>;

// 서버 wrapper 에서 전달하는 props
// currentUserId: 분석/디버그용 (form 내부에선 직접 미사용 — POST 요청은 쿠키 세션 사용)
type Props = {
  currentUserId: string;
};

export function OnboardingSetupForm(_props: Props): ReactElement {
  // _props 는 의도적으로 미사용 (서버 인증 통과 신호로만 받음)
  const router = useRouter();

  // 위저드 진행 상태
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);
  // Phase 10-5: 완료 시 API 저장 상태 — 저장 중엔 다음 버튼 disabled, 실패 시 안내문 노출
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // 단계별 입력 state — 시안 L4~L14 default 값 그대로
  const [pos, setPos] = useState<string>("G");
  const [height, setHeight] = useState<number>(178);
  const [level, setLevel] = useState<string>("");
  const [styles, setStyles] = useState<string[]>([]);
  const [areas, setAreas] = useState<string[]>([]);
  const [frequency, setFrequency] = useState<Frequency>("weekly");
  const [goals, setGoals] = useState<string[]>([]);
  const [notifications, setNotifications] = useState<NotiState>({
    games: true,
    tournaments: true,
    messages: true,
    marketing: false,
  });

  // 다중 선택 토글 헬퍼: 이미 있으면 제거, 없으면 추가 (max 인자로 4 등 한도 강제 가능)
  const toggleArr = (
    arr: string[],
    setter: (next: string[]) => void,
    value: string,
    max?: number,
  ) => {
    if (arr.includes(value)) {
      setter(arr.filter((x) => x !== value));
      return;
    }
    if (typeof max === "number" && arr.length >= max) return; // 한도 초과 무시
    setter([...arr, value]);
  };

  // ---------- Phase 10-5: 완료 핸들러 (DB 저장) ----------
  // 이유: 모든 위저드 입력을 한 번의 POST 로 저장한다. 실패해도 done 화면은 띄우되
  //       saveError 로 사용자에게 알려 "프로필 보기" 에서 재수정 유도.
  const handleFinish = async () => {
    if (saving) return; // 더블클릭 방지
    setSaving(true);
    setSaveError(null);
    try {
      const res = await fetch("/api/web/onboarding/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // 웹세션 쿠키 동봉
        body: JSON.stringify({
          // 1~2단계
          position: pos,
          height,
          level: level || null,
          // 3~5단계
          styles,
          active_areas: areas,
          goals,
          play_frequency: frequency,
          // 6단계 — 위저드 키 그대로 전송 (서버에서 호환 키도 병합)
          notification_settings: notifications,
        }),
      });
      if (!res.ok) {
        // 비로그인(401)·검증 실패(400)·서버 오류(500) 모두 안내 문구만
        setSaveError(
          res.status === 401
            ? "로그인이 필요합니다. 잠시 후 다시 시도해주세요."
            : "저장에 실패했어요. 프로필에서 다시 설정할 수 있어요.",
        );
      }
    } catch {
      setSaveError("네트워크 오류가 발생했어요. 프로필에서 다시 설정해주세요.");
    } finally {
      setSaving(false);
      setDone(true); // 실패해도 환영 화면 진입 (UX 차단 X)
    }
  };

  // ---------- 완료 화면 ----------
  // 시안 L24~L55 박제. 통계 3칸은 더미 (실 데이터 연결은 추후 구현 목록 참조)
  if (done) {
    return (
      <div className="page" style={{ maxWidth: 560, margin: "0 auto", paddingTop: 60 }}>
        <div className="card" style={{ padding: "48px 36px", textAlign: "center" }}>
          {/* 시안 L28: 80×80 그라디언트 원형 + 농구공 이모지 */}
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: "50%",
              background: "linear-gradient(135deg, var(--accent), #FF6B35)",
              color: "#fff",
              display: "grid",
              placeItems: "center",
              fontSize: 44,
              margin: "0 auto 18px",
              fontWeight: 900,
            }}
          >
            🏀
          </div>
          <h1 style={{ margin: "0 0 6px", fontSize: 24, fontWeight: 800, letterSpacing: "-0.02em" }}>
            환영합니다!
          </h1>
          <p style={{ margin: "0 0 20px", fontSize: 14, color: "var(--ink-mute)", lineHeight: 1.6 }}>
            취향에 맞는 경기와 팀이 이미 준비되어 있어요.
            <br />
            지금 바로 첫 경기를 찾아보세요.
          </p>

          {/* Phase 10-5: 저장 실패 시에만 인라인 안내 노출 */}
          {saveError && (
            <p style={{ margin: "0 0 20px", fontSize: 11, color: "var(--err)" }}>
              {saveError}
            </p>
          )}

          {/* 통계 3칸 (시안 L34~L46) — 현재 더미값. 실 집계는 추후 구현 목록 */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 10,
              margin: "28px 0",
              padding: "18px 0",
              borderTop: "1px solid var(--border)",
              borderBottom: "1px solid var(--border)",
            }}
          >
            <div>
              <div
                style={{
                  fontFamily: "var(--ff-display)",
                  fontSize: 22,
                  fontWeight: 900,
                  color: "var(--accent)",
                }}
              >
                24
              </div>
              <div style={{ fontSize: 11, color: "var(--ink-dim)" }}>추천 경기</div>
            </div>
            <div>
              <div
                style={{
                  fontFamily: "var(--ff-display)",
                  fontSize: 22,
                  fontWeight: 900,
                  color: "var(--cafe-blue)",
                }}
              >
                8
              </div>
              <div style={{ fontSize: 11, color: "var(--ink-dim)" }}>내 지역 팀</div>
            </div>
            <div>
              <div
                style={{
                  fontFamily: "var(--ff-display)",
                  fontSize: 22,
                  fontWeight: 900,
                  color: "var(--ok)",
                }}
              >
                3
              </div>
              <div style={{ fontSize: 11, color: "var(--ink-dim)" }}>열린 대회</div>
            </div>
          </div>

          {/* CTA 두 버튼 (시안 L48~L51) — 시안의 setRoute 대신 router.push */}
          <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
            <button
              type="button"
              className="btn btn--lg"
              onClick={() => router.push("/profile")}
            >
              프로필 보기
            </button>
            <button
              type="button"
              className="btn btn--primary btn--xl"
              onClick={() => router.push("/games")}
            >
              경기 찾기 →
            </button>
          </div>

          {/* 보조 CTA — 대회 직전 §A-2 (사용자 결정 옵션 A) :
              온보딩은 6 step 만 채우므로 키/체중·실명·자기소개 등 추가 입력은 /profile/complete 에서 보강.
              메인 CTA(경기 찾기) 옆에 두면 흐름이 분산되므로 보조 라인으로 분리.
              profile_completed 체크는 me API 추가 호출 비용 + 회귀 위험 vs 효과 미미해서 단순 노출 유지(이미 작업한 사용자는 한 번 더 확인하는 정도). */}
          <div style={{ marginTop: 18 }}>
            <button
              type="button"
              onClick={() => router.push("/profile/complete")}
              style={{
                background: "transparent",
                border: 0,
                color: "var(--cafe-blue)",
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 600,
                textDecoration: "underline",
                padding: "4px 8px",
              }}
            >
              프로필 추가 완성하기 →
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ---------- 위저드 진행 ----------
  // step=1(level)에서 미선택 상태면 다음 버튼 차단 (시안 L241 disabled 조건)
  const canGoNext = step === 1 ? Boolean(level) : true;

  return (
    <div className="page" style={{ maxWidth: 720, margin: "0 auto", paddingTop: 40 }}>
      {/* 본문 카드 — 시안 L70 의 .card 외피 그대로 (StepWizard 자체에는 카드 외피 없음) */}
      <div className="card" style={{ padding: "32px 36px" }}>
        <StepWizard
          steps={STEPS}
          currentStep={step}
          onStepChange={setStep}
          onFinish={handleFinish}
          canGoNext={canGoNext && !saving}
          finishLabel="완료 →"
          nextLabel="다음 →"
          prevLabel="← 이전"
          title="프로필 설정"
          subtitle="더 잘 맞는 경기를 추천하기 위한 정보입니다"
        >
          {/* step 0: 포지션 + 신장 (시안 step 1) */}
          {step === 0 && (
            <div>
              <h2
                style={{
                  margin: "0 0 4px",
                  fontSize: 20,
                  fontWeight: 800,
                  letterSpacing: "-0.01em",
                }}
              >
                어떤 포지션으로 뛰나요?
              </h2>
              <p style={{ margin: "0 0 24px", fontSize: 14, color: "var(--ink-mute)" }}>
                매칭·추천에 활용되는 가장 중요한 정보예요.
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
                {POSITIONS.map((p) => {
                  const sel = pos === p.v;
                  return (
                    <button
                      key={p.v}
                      type="button"
                      onClick={() => setPos(p.v)}
                      style={{
                        padding: "22px 16px",
                        textAlign: "center",
                        background: sel ? "var(--bg-alt)" : "transparent",
                        border: sel ? `2px solid ${p.color}` : "1px solid var(--border)",
                        borderRadius: 8,
                        cursor: "pointer",
                      }}
                    >
                      <div
                        style={{
                          width: 54,
                          height: 54,
                          borderRadius: "50%",
                          background: p.color,
                          color: "#fff",
                          display: "grid",
                          placeItems: "center",
                          margin: "0 auto 10px",
                          fontFamily: "var(--ff-display)",
                          fontSize: 24,
                          fontWeight: 900,
                        }}
                      >
                        {p.v}
                      </div>
                      <div style={{ fontWeight: 800, fontSize: 14 }}>{p.l}</div>
                      <div style={{ fontSize: 11, color: "var(--ink-dim)", marginTop: 4 }}>{p.d}</div>
                    </button>
                  );
                })}
              </div>
              {/* 신장 슬라이더 — 시안 L94~L96 그대로 (150~210cm range) */}
              <div style={{ marginTop: 24 }}>
                <label
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: "var(--ink-dim)",
                    display: "block",
                    marginBottom: 6,
                  }}
                >
                  신장 {height}cm
                </label>
                <input
                  type="range"
                  min={150}
                  max={210}
                  value={height}
                  onChange={(e) => setHeight(Number(e.target.value))}
                  style={{ width: "100%" }}
                />
              </div>
            </div>
          )}

          {/* step 1: 실력 (시안 step 2) */}
          {step === 1 && (
            <div>
              <h2
                style={{
                  margin: "0 0 4px",
                  fontSize: 20,
                  fontWeight: 800,
                  letterSpacing: "-0.01em",
                }}
              >
                실력 수준은 어느 정도인가요?
              </h2>
              <p style={{ margin: "0 0 24px", fontSize: 14, color: "var(--ink-mute)" }}>
                비슷한 수준의 플레이어와 매칭해드려요. 부정확해도 괜찮아요—언제든 수정 가능.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {LEVELS.map((l) => {
                  const sel = level === l.v;
                  return (
                    <button
                      key={l.v}
                      type="button"
                      onClick={() => setLevel(l.v)}
                      style={{
                        textAlign: "left",
                        padding: "14px 18px",
                        background: sel ? "var(--bg-alt)" : "transparent",
                        border: sel ? "2px solid var(--accent)" : "1px solid var(--border)",
                        borderRadius: 6,
                        cursor: "pointer",
                      }}
                    >
                      <div style={{ fontWeight: 800, fontSize: 14 }}>{l.v}</div>
                      <div style={{ fontSize: 11, color: "var(--ink-dim)", marginTop: 2 }}>{l.d}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* step 2: 스타일 (시안 step 3, 최대 4선택) */}
          {step === 2 && (
            <div>
              <h2
                style={{
                  margin: "0 0 4px",
                  fontSize: 20,
                  fontWeight: 800,
                  letterSpacing: "-0.01em",
                }}
              >
                어떤 스타일로 뛰나요?
              </h2>
              <p style={{ margin: "0 0 24px", fontSize: 14, color: "var(--ink-mute)" }}>
                최대 4개까지 · 플레이 스타일 매칭에 사용
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
                {STYLE_OPTIONS.map((s) => {
                  const sel = styles.includes(s);
                  // 시안 L141: 4개 도달 시 미선택 옵션 opacity 0.3 (비활성화 시각 신호)
                  const dim = !sel && styles.length >= 4;
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => toggleArr(styles, setStyles, s, 4)}
                      style={{
                        padding: "14px 10px",
                        textAlign: "center",
                        background: sel ? "var(--accent)" : "var(--bg-alt)",
                        color: sel ? "#fff" : "var(--ink)",
                        border: 0,
                        borderRadius: 6,
                        cursor: dim ? "not-allowed" : "pointer",
                        fontSize: 13,
                        fontWeight: 700,
                        opacity: dim ? 0.3 : 1,
                      }}
                    >
                      {s}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* step 3: 지역 + 빈도 (시안 step 4, 묶음 한 화면) */}
          {step === 3 && (
            <div>
              <h2
                style={{
                  margin: "0 0 4px",
                  fontSize: 20,
                  fontWeight: 800,
                  letterSpacing: "-0.01em",
                }}
              >
                주로 어디서 뛰나요?
              </h2>
              <p style={{ margin: "0 0 24px", fontSize: 14, color: "var(--ink-mute)" }}>
                해당 지역의 경기·코트·팀을 우선 추천해드려요.
              </p>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  gap: 8,
                  marginBottom: 20,
                }}
              >
                {AREA_OPTIONS.map((a) => {
                  const sel = areas.includes(a);
                  return (
                    <button
                      key={a}
                      type="button"
                      onClick={() => toggleArr(areas, setAreas, a)}
                      style={{
                        padding: "10px 0",
                        textAlign: "center",
                        background: sel ? "var(--cafe-blue)" : "var(--bg-alt)",
                        color: sel ? "#fff" : "var(--ink)",
                        border: 0,
                        borderRadius: 4,
                        cursor: "pointer",
                        fontSize: 12,
                        fontWeight: 700,
                      }}
                    >
                      {a}
                    </button>
                  );
                })}
              </div>
              {/* 빈도 (시안 L165~L173) — 4개 라디오버튼식 */}
              <div>
                <label
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: "var(--ink-dim)",
                    display: "block",
                    marginBottom: 6,
                  }}
                >
                  얼마나 자주 뛰나요?
                </label>
                <div style={{ display: "flex", gap: 6 }}>
                  {FREQ_OPTIONS.map((f) => {
                    const sel = frequency === f.v;
                    return (
                      <button
                        key={f.v}
                        type="button"
                        onClick={() => setFrequency(f.v)}
                        // 시안 L169: 선택된 칸만 .btn--primary
                        className={`btn btn--sm ${sel ? "btn--primary" : ""}`}
                        style={{ flex: 1 }}
                      >
                        {f.l}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* step 4: 목표 (시안 step 5, 복수 선택) */}
          {step === 4 && (
            <div>
              <h2
                style={{
                  margin: "0 0 4px",
                  fontSize: 20,
                  fontWeight: 800,
                  letterSpacing: "-0.01em",
                }}
              >
                어떤 목표가 있나요?
              </h2>
              <p style={{ margin: "0 0 24px", fontSize: 14, color: "var(--ink-mute)" }}>
                목표에 맞는 콘텐츠와 기능을 보여드려요. 복수 선택 가능.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {GOAL_OPTIONS.map((g) => {
                  const sel = goals.includes(g.v);
                  return (
                    <button
                      key={g.v}
                      type="button"
                      onClick={() => toggleArr(goals, setGoals, g.v)}
                      style={{
                        textAlign: "left",
                        padding: "12px 16px",
                        background: sel ? "var(--bg-alt)" : "transparent",
                        border: sel ? "2px solid var(--accent)" : "1px solid var(--border)",
                        borderRadius: 6,
                        cursor: "pointer",
                        display: "grid",
                        gridTemplateColumns: "36px 1fr",
                        gap: 12,
                        alignItems: "center",
                      }}
                    >
                      <div style={{ fontSize: 24, textAlign: "center" }}>{g.e}</div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 13 }}>{g.l}</div>
                        <div style={{ fontSize: 11, color: "var(--ink-dim)" }}>{g.d}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* step 5: 알림 (시안 step 6, 토글 4종) */}
          {step === 5 && (
            <div>
              <h2
                style={{
                  margin: "0 0 4px",
                  fontSize: 20,
                  fontWeight: 800,
                  letterSpacing: "-0.01em",
                }}
              >
                알림을 어떻게 받을까요?
              </h2>
              <p style={{ margin: "0 0 24px", fontSize: 14, color: "var(--ink-mute)" }}>
                나중에 설정에서 언제든 바꿀 수 있어요.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                {NOTI_OPTIONS.map((n, i) => {
                  const on = notifications[n.k];
                  return (
                    <div
                      key={n.k}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        padding: "14px 0",
                        borderTop: i > 0 ? "1px solid var(--border)" : "none",
                        alignItems: "center",
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 13 }}>{n.l}</div>
                        <div style={{ fontSize: 11, color: "var(--ink-dim)" }}>{n.d}</div>
                      </div>
                      {/* 토글 — 시안 L225~L231 박제. 44×24 트랙 + 18×18 휠 + 좌우 슬라이드 */}
                      <button
                        type="button"
                        onClick={() =>
                          setNotifications({ ...notifications, [n.k]: !on })
                        }
                        aria-pressed={on}
                        style={{
                          width: 44,
                          height: 24,
                          borderRadius: 12,
                          border: 0,
                          cursor: "pointer",
                          background: on ? "var(--accent)" : "var(--border)",
                          position: "relative",
                          transition: ".2s",
                        }}
                      >
                        <div
                          style={{
                            width: 18,
                            height: 18,
                            borderRadius: "50%",
                            // 토글 손잡이 — 토큰 사용
                            background: "var(--bg-elev)",
                            position: "absolute",
                            top: 3,
                            left: on ? 23 : 3,
                            transition: ".2s",
                          }}
                        />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </StepWizard>
      </div>
    </div>
  );
}

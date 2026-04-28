"use client";

/* ============================================================
 * RefereeRequestPage (Phase 9 P1-3b · BDR v2 박제)
 *
 * 시안: Dev/design/BDR v2 (1)/screens/RefereeRequest.jsx
 * 목적: 대회 운영자가 심판 후보 다수에게 배정 요청을 보내는 위저드.
 *
 * 원칙:
 *   - DB 변경 0 — 심판/요청 데이터는 모두 mock 박제 (UI 전용)
 *   - 제출은 alert("준비 중") + setSubmitted(true) 으로 끝
 *   - 4단계: [대회 선택] → [심판 선택] → [메시지·수수료] → [완료]
 *     ※ 4번째(완료)는 StepWizard 가 아니라 submitted 분기로 별도 화면
 *
 * canGoNext 게이트:
 *   - step 0(대회 선택): 항상 true (현재 [id] 토너먼트 박제 표시)
 *   - step 1(심판 선택): selected.length > 0
 *   - step 2(메시지·수수료): message.trim() 있고 fee > 0
 *
 * 디자인 토큰: --accent / --ink / --ink-mute / --ink-dim / --bg-alt
 *              --border / --ff-display / --ff-mono / --ok
 * ============================================================ */

import { useState, type ReactElement } from "react";
import { useParams, useRouter } from "next/navigation";

import { StepWizard, type StepWizardStep } from "@/components/wizard/step-wizard";
import {
  RefereePickCard,
  type RefereePick,
} from "@/components/referee/referee-pick-card";

/* ------------------------------------------------------------------ */
/*  Mock data (DB 미지원 — 시안 박제)                                    */
/* ------------------------------------------------------------------ */

// 시안 L14~L21 referees 배열 박제. id 는 string 으로 변환.
const REFEREES_MOCK: RefereePick[] = [
  {
    id: "0",
    name: "김정환 심판",
    level: "KBL 2급",
    fee: 80000,
    avatarColor: "#DC2626",
    meta: "경력 8년 · 운영 412경기 · ★ 4.9",
    specialty: "빠른 판정 · 3x3 경력 많음",
    available: true,
  },
  {
    id: "1",
    name: "이성훈 심판",
    level: "FIBA 3",
    fee: 100000,
    avatarColor: "#0F5FCC",
    meta: "경력 6년 · 운영 287경기 · ★ 4.8",
    specialty: "국제 대회 경력",
    available: true,
  },
  {
    id: "2",
    name: "박민수 심판",
    level: "KBL 3급",
    fee: 70000,
    avatarColor: "#10B981",
    meta: "경력 4년 · 운영 156경기 · ★ 4.7",
    specialty: "커뮤니케이션 우수",
    available: true,
  },
  {
    id: "3",
    name: "정하영 심판",
    level: "KBL 2급",
    fee: 90000,
    avatarColor: "#F59E0B",
    meta: "경력 9년 · 운영 502경기 · ★ 4.9",
    specialty: "대회장 경험 풍부 · 현재 배정중",
    available: false,
  },
  {
    id: "4",
    name: "최유진 심판",
    level: "KBL 3급",
    fee: 70000,
    avatarColor: "#8B5CF6",
    meta: "경력 5년 · 운영 198경기 · ★ 4.6",
    specialty: "여성부 대회 전문",
    available: true,
  },
  {
    id: "5",
    name: "오승환 심판",
    level: "FIBA 3",
    fee: 100000,
    avatarColor: "#EC4899",
    meta: "경력 7년 · 운영 325경기 · ★ 4.8",
    specialty: "피지컬 플레이 잘 잡음",
    available: true,
  },
];

// 시안 L93~L99 의 4종 수당 칩. -1 은 "직접 입력" 토글.
const FEE_OPTIONS: ReadonlyArray<{ value: number; label: string }> = [
  { value: 60000, label: "₩60,000" },
  { value: 80000, label: "₩80,000" },
  { value: 100000, label: "₩100,000" },
  { value: -1, label: "직접 입력" },
];

const STEPS: StepWizardStep[] = [
  { id: "tournament", label: "대회 선택" },
  { id: "referees", label: "심판 선택" },
  { id: "message", label: "메시지·수수료" },
];

/* ------------------------------------------------------------------ */
/*  Page                                                                */
/* ------------------------------------------------------------------ */

export default function RefereeRequestPage(): ReactElement {
  // [id] 동적 라우트 파라미터 — 현재 대회 식별 (mock 표시 전용)
  const params = useParams<{ id: string }>();
  const tournamentId = params?.id ?? "";
  const router = useRouter();

  // 위저드 상태
  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  // step 1: 선택된 심판 id 배열
  const [selected, setSelected] = useState<string[]>([]);
  // step 2: 메시지 + 수수료
  const [message, setMessage] = useState("");
  const [fee, setFee] = useState<number>(80000);
  const [customFee, setCustomFee] = useState<string>("");
  // 직접 입력 모드 토글 (FEE_OPTIONS value=-1 클릭 시 활성)
  const [useCustomFee, setUseCustomFee] = useState(false);

  // 실제 적용될 수당 (직접 입력 모드면 customFee 우선)
  const effectiveFee = useCustomFee
    ? parseInt(customFee.replace(/[^0-9]/g, ""), 10) || 0
    : fee;

  // 토글 핸들러: 선택/해제 — 부모가 setSelected 로 controlled
  const toggleReferee = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  // 제출: DB 미연결 — alert + submitted 분기로 완료 화면 노출
  const handleSubmit = () => {
    alert(
      "준비 중 — 심판 배정 요청은 referee_requests API 연결 후 활성화됩니다",
    );
    setSubmitted(true);
  };

  // canGoNext 게이트: 단계별로 다른 검증
  const canGoNext =
    step === 0
      ? true // 대회는 [id] 로 자동 결정 → 통과
      : step === 1
        ? selected.length > 0 // 최소 1명 이상 선택
        : step === 2
          ? message.trim().length > 0 && effectiveFee > 0 // 메시지/수당 모두 충족
          : true;

  /* ---------------------------------------------------------------- */
  /*  완료 분기: 시안 L28~L53 박제                                       */
  /* ---------------------------------------------------------------- */
  if (submitted) {
    const selectedNames = REFEREES_MOCK.filter((r) => selected.includes(r.id))
      .map((r) => r.name.split(" ")[0])
      .join(", ");

    return (
      <div
        className="page"
        style={{ maxWidth: 600, margin: "0 auto", padding: "32px 16px" }}
      >
        <div
          className="card"
          style={{ padding: "40px 36px", textAlign: "center" }}
        >
          {/* ✓ 원형 아이콘 (시안 L32) */}
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: "50%",
              background:
                "color-mix(in srgb, var(--ok, #10B981) 16%, transparent)",
              color: "var(--ok, #10B981)",
              display: "grid",
              placeItems: "center",
              fontSize: 40,
              margin: "0 auto 18px",
              fontWeight: 900,
            }}
          >
            ✓
          </div>
          <h1
            style={{
              margin: "0 0 6px",
              fontSize: 22,
              fontWeight: 800,
              letterSpacing: "-0.01em",
            }}
          >
            심판 배정 요청 완료
          </h1>
          <p
            style={{
              margin: "0 0 6px",
              fontSize: 13,
              color: "var(--ink-mute)",
              lineHeight: 1.6,
            }}
          >
            선택한 <b style={{ color: "var(--ink)" }}>{selected.length}명</b>의
            심판에게 배정 요청을 보냈습니다.
            <br />각 심판은 24시간 내 수락·거절 응답을 보냅니다.
          </p>
          {/* 요약 카드 */}
          <div
            style={{
              padding: "14px 16px",
              background: "var(--bg-alt)",
              borderRadius: 6,
              margin: "20px 0 24px",
              textAlign: "left",
            }}
          >
            <div
              style={{
                fontSize: 11,
                color: "var(--ink-dim)",
                fontWeight: 700,
                marginBottom: 6,
                letterSpacing: ".08em",
              }}
            >
              요청 요약
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "80px 1fr",
                gap: 8,
                fontSize: 13,
              }}
            >
              <div style={{ color: "var(--ink-dim)" }}>대회</div>
              <div style={{ fontWeight: 700 }}>#{tournamentId}</div>
              <div style={{ color: "var(--ink-dim)" }}>심판</div>
              <div style={{ fontWeight: 700 }}>{selectedNames}</div>
              <div style={{ color: "var(--ink-dim)" }}>수당</div>
              <div style={{ fontFamily: "var(--ff-mono)" }}>
                ₩{effectiveFee.toLocaleString()} / 경기
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
            <button
              type="button"
              className="btn btn--lg"
              onClick={() => router.push(`/tournaments/${tournamentId}`)}
            >
              대회로
            </button>
            <button
              type="button"
              className="btn btn--primary btn--lg"
              onClick={() => router.push("/my")}
            >
              내 대회로
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ---------------------------------------------------------------- */
  /*  위저드 본문                                                        */
  /* ---------------------------------------------------------------- */
  return (
    <div
      className="page"
      style={{ maxWidth: 720, margin: "0 auto", padding: "32px 16px" }}
    >
      <StepWizard
        steps={STEPS}
        currentStep={step}
        onStepChange={setStep}
        onFinish={handleSubmit}
        canGoNext={canGoNext}
        title="심판 배정 요청"
        subtitle="대회에 필요한 심판 수의 1.5~2배 정도를 선택해 보내는 걸 권장합니다"
        finishLabel="요청 보내기"
      >
        {step === 0 && <Step1Tournament tournamentId={tournamentId} />}
        {step === 1 && (
          <Step2Referees selected={selected} onToggle={toggleReferee} />
        )}
        {step === 2 && (
          <Step3Message
            message={message}
            setMessage={setMessage}
            fee={fee}
            setFee={setFee}
            customFee={customFee}
            setCustomFee={setCustomFee}
            useCustomFee={useCustomFee}
            setUseCustomFee={setUseCustomFee}
            selectedCount={selected.length}
          />
        )}
      </StepWizard>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Step 1: 대회 선택 — 현재 [id] 토너먼트만 카드로 표시 (mock 박제)        */
/* ------------------------------------------------------------------ */

function Step1Tournament({
  tournamentId,
}: {
  tournamentId: string;
}): ReactElement {
  // 시안 L75~L88 의 대회 카드 박제 — 다중 토너먼트 선택 UI 는 별도 화면으로 유보
  return (
    <div className="card" style={{ padding: "24px 28px" }}>
      <h2 style={{ margin: "0 0 14px", fontSize: 16, fontWeight: 700 }}>
        대회 정보
      </h2>
      <div
        style={{
          padding: "14px 16px",
          background: "var(--bg-alt)",
          border: "2px solid var(--accent)",
          borderRadius: 6,
          display: "grid",
          gridTemplateColumns: "48px 1fr auto",
          gap: 12,
          alignItems: "center",
        }}
      >
        <div
          style={{
            width: 48,
            height: 48,
            background: "var(--accent)",
            color: "#fff",
            display: "grid",
            placeItems: "center",
            fontFamily: "var(--ff-display)",
            fontWeight: 900,
            fontSize: 14,
            borderRadius: 4,
          }}
        >
          T
        </div>
        <div>
          <div style={{ fontWeight: 800, fontSize: 14 }}>
            BDR Tournament #{tournamentId}
          </div>
          <div
            style={{
              fontSize: 11,
              color: "var(--ink-dim)",
              fontFamily: "var(--ff-mono)",
              marginTop: 2,
            }}
          >
            현재 페이지의 토너먼트가 자동 선택됩니다
          </div>
        </div>
        <div style={{ fontSize: 11, color: "var(--ink-dim)" }}>
          경기당 필요{" "}
          <b
            style={{
              color: "var(--accent)",
              fontSize: 14,
              fontFamily: "var(--ff-mono)",
            }}
          >
            2명
          </b>
        </div>
      </div>
      <p
        style={{
          fontSize: 11,
          color: "var(--ink-dim)",
          marginTop: 12,
          marginBottom: 0,
        }}
      >
        💡 다른 대회를 선택하려면 해당 대회 페이지에서 다시 진입해 주세요.
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Step 2: 심판 선택 — 카드 그리드 (mock)                                */
/* ------------------------------------------------------------------ */

function Step2Referees({
  selected,
  onToggle,
}: {
  selected: string[];
  onToggle: (id: string) => void;
}): ReactElement {
  return (
    <div className="card" style={{ padding: "24px 28px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          marginBottom: 14,
        }}
      >
        <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>
          심판 선택 ({selected.length}명)
        </h2>
        <div style={{ fontSize: 11, color: "var(--ink-dim)" }}>
          AI 추천 순 · 평점/경력/가용성 기반
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {REFEREES_MOCK.map((r) => (
          <RefereePickCard
            key={r.id}
            referee={r}
            selected={selected.includes(r.id)}
            onToggle={() => onToggle(r.id)}
          />
        ))}
      </div>
      {selected.length === 0 && (
        <p
          style={{
            fontSize: 11,
            color: "var(--ink-dim)",
            marginTop: 12,
            marginBottom: 0,
          }}
        >
          ⚠️ 최소 1명 이상의 심판을 선택해 주세요.
        </p>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Step 3: 메시지 + 수당                                                */
/* ------------------------------------------------------------------ */

function Step3Message({
  message,
  setMessage,
  fee,
  setFee,
  customFee,
  setCustomFee,
  useCustomFee,
  setUseCustomFee,
  selectedCount,
}: {
  message: string;
  setMessage: (v: string) => void;
  fee: number;
  setFee: (v: number) => void;
  customFee: string;
  setCustomFee: (v: string) => void;
  useCustomFee: boolean;
  setUseCustomFee: (v: boolean) => void;
  selectedCount: number;
}): ReactElement {
  return (
    <div className="card" style={{ padding: "24px 28px" }}>
      {/* 메시지 (시안 L147~L148) */}
      <h2 style={{ margin: "0 0 10px", fontSize: 16, fontWeight: 700 }}>
        메시지
      </h2>
      <textarea
        className="input"
        rows={4}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="예: 대회 특성·경기 분위기·챙겨오실 점 등을 알려주세요."
        style={{ resize: "vertical", width: "100%" }}
      />
      <p
        style={{
          fontSize: 11,
          color: "var(--ink-dim)",
          marginTop: 4,
          marginBottom: 0,
        }}
      >
        선택한 {selectedCount}명의 심판에게 동일하게 전송됩니다.
      </p>

      {/* 수당 (시안 L92~L101) */}
      <h2 style={{ margin: "20px 0 10px", fontSize: 16, fontWeight: 700 }}>
        경기당 수당
      </h2>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 8,
          marginBottom: 10,
        }}
      >
        {FEE_OPTIONS.map((opt) => {
          // value = -1 은 "직접 입력" 토글 칩
          const isCustom = opt.value === -1;
          const isActive = isCustom ? useCustomFee : !useCustomFee && fee === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                if (isCustom) {
                  setUseCustomFee(true);
                } else {
                  setUseCustomFee(false);
                  setFee(opt.value);
                }
              }}
              className={`btn ${isActive ? "btn--primary" : ""}`}
              style={{ padding: "12px 0" }}
            >
              <div
                style={{
                  fontFamily: "var(--ff-mono)",
                  fontSize: 14,
                  fontWeight: 800,
                }}
              >
                {opt.label}
              </div>
              {!isCustom && (
                <div style={{ fontSize: 10, opacity: 0.75 }}>/ 경기</div>
              )}
            </button>
          );
        })}
      </div>
      {/* 직접 입력 모드일 때만 입력 필드 노출 */}
      {useCustomFee && (
        <input
          type="text"
          inputMode="numeric"
          className="input"
          value={customFee}
          onChange={(e) => setCustomFee(e.target.value)}
          placeholder="금액 입력 (예: 90000)"
          style={{ width: "100%", marginBottom: 10 }}
        />
      )}
      <p style={{ fontSize: 11, color: "var(--ink-dim)", margin: 0 }}>
        BDR 권장: 80,000~100,000원 · 국제 대회 경력자는 120,000원 이상 권장
      </p>
    </div>
  );
}

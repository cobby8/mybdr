"use client";

import Link from "next/link";
import { useState, type ReactElement } from "react";
import { StepWizard, type StepWizardStep } from "@/components/wizard/step-wizard";

/* ============================================================
 * SeriesCreateForm (시안 SeriesCreate.jsx 박제 — UI 전용)
 *
 * 이유(왜):
 *   BDR v2 신규 시안 Dev/design/BDR v2 (1)/screens/SeriesCreate.jsx
 *   를 3단계 위저드(기본 정보 / 첫 회차 / 검토·공개)로 그대로 박제.
 *   StepWizard 공용 셸로 progress bar + prev/next 분기는 위임하고,
 *   본 컴포넌트는 단계별 본문 + 완료 화면 분기만 책임진다.
 *
 *   tournament_series 테이블이 이미 존재하지만, 운영자 권한 +
 *   첫 회차 자동 생성 + 엠블럼 업로드 흐름이 아직 미정이라 실제
 *   mutation 은 없음. 제출 버튼은 alert("준비 중") + 완료 화면.
 *
 * 시안 매핑 (SeriesCreate.jsx):
 *   - L31~L56  Step 1: 시리즈 기본 정보 (이름/태그라인/색상)
 *   - L59~L101 Step 2: 첫 회차 (장소/일자/정원/참가비/상금)
 *   - L104~L135 Step 3: 확인 후 공개 (preview + visibility)
 *
 * UI 미동작 항목 (백로그):
 *   - 시리즈 생성 server action (prisma.tournament_series.create)
 *   - 운영자 권한 가드 강화 (organizations.owner_id / user.role)
 *   - 색상/엠블럼 업로드 (Supabase storage)
 *   - 시리즈 → 토너먼트 회차 자동 연결 흐름
 * ============================================================ */

// 시안 데이터 모델 그대로 (L5~L8)
interface FormData {
  name: string;
  tagline: string;
  accent: string; // hex 색상 (#E31B23 등)
  format: "3v3" | "5v5";
  frequency: string; // "분기" 등 라벨 (시안엔 입력 UI 없고 기본값만)
  firstDate: string; // YYYY-MM-DD
  venue: string;
  capacity: number;
  fee: string; // 자유 텍스트 (시안 placeholder "₩80,000")
  prize: string; // 자유 텍스트
  visibility: "public" | "unlisted" | "private";
}

// 시안 L46 의 8색 팔레트 — 시리즈 accent 컬러로 사용
const ACCENT_COLORS = [
  "#E31B23",
  "#0F5FCC",
  "#7C3AED",
  "#10B981",
  "#F59E0B",
  "#EC4899",
  "#06B6D4",
  "#0B0D10",
];

// 시안 L77 의 정원 옵션
const CAPACITY_OPTIONS = [8, 12, 16, 24, 32];

// 시안 L124 의 visibility 옵션
const VISIBILITY_OPTIONS = [
  { v: "public", l: "전체 공개" },
  { v: "unlisted", l: "링크 공유" },
  { v: "private", l: "초대만" },
] as const;

// StepWizard 단계 정의 (시안 L24~L28 의 3-스텝 박제)
const STEPS: StepWizardStep[] = [
  { id: "basics", label: "기본 정보" },
  { id: "edition", label: "첫 회차" },
  { id: "review", label: "검토·공개" },
];

const DEFAULT_DATA: FormData = {
  name: "",
  tagline: "",
  accent: "#E31B23",
  format: "3v3",
  frequency: "분기",
  firstDate: "",
  venue: "",
  capacity: 16,
  fee: "",
  prize: "",
  visibility: "public",
};

export function SeriesCreateForm(): ReactElement {
  // 위저드 현재 단계 (0-based) — StepWizard 가 controlled 로 받음
  const [step, setStep] = useState(0);
  // 완료 화면 분기 (P1-2a CourtSubmit 패턴 차용 — 시안엔 setRoute 였음)
  const [submitted, setSubmitted] = useState(false);
  const [data, setData] = useState<FormData>(DEFAULT_DATA);

  // 단일 필드 업데이트 헬퍼 (시안 L9 set 함수 박제)
  const update = <K extends keyof FormData>(k: K, v: FormData[K]) =>
    setData((d) => ({ ...d, [k]: v }));

  // 단계별 next 가드 (시안 L52, L97 의 disabled 조건과 동일)
  // - Step 0: name 필수
  // - Step 1: venue + firstDate 필수
  // - Step 2: 마지막 단계, 항상 통과 (visibility 는 기본값 있음)
  const canGoNext =
    step === 0
      ? data.name.trim() !== ""
      : step === 1
      ? data.venue.trim() !== "" && data.firstDate.trim() !== ""
      : true;

  // 마지막 단계 "공개하고 시리즈 만들기" 클릭 — DB 미지원 단계라 alert + 완료 화면만
  const handleFinish = () => {
    alert(
      "준비 중 — 시리즈 생성은 운영자 권한 가드 + DB 연동과 함께 활성화됩니다."
    );
    setSubmitted(true);
  };

  // ===== 완료 화면 (P1-2a 패턴 차용 — 시안엔 없음, 박제 시 자연스러운 분기) =====
  if (submitted) {
    return (
      <div className="page" style={{ maxWidth: 560 }}>
        <div
          className="card"
          style={{ padding: "40px 36px", textAlign: "center" }}
        >
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: "50%",
              background: "color-mix(in oklab, var(--ok) 16%, transparent)",
              color: "var(--ok)",
              display: "grid",
              placeItems: "center",
              fontSize: 40,
              margin: "0 auto 18px",
              fontWeight: 900,
            }}
          >
            ✓
          </div>
          <h1 style={{ margin: "0 0 6px", fontSize: 22, fontWeight: 800 }}>
            시리즈 개설 신청 완료
          </h1>
          <p
            style={{
              margin: "0 0 14px",
              fontSize: 13,
              color: "var(--ink-mute)",
              lineHeight: 1.6,
            }}
          >
            운영팀이 검토 후 시리즈를 활성화합니다.
            <br />
            활성화되면 시리즈 페이지에서 첫 회차를 등록할 수 있어요.
          </p>

          {/* 시안 preview 카드 박제 (요약용) */}
          <div
            style={{
              padding: "18px 20px",
              borderRadius: 8,
              background: `linear-gradient(135deg, ${data.accent}, ${data.accent}AA)`,
              color: "#fff",
              margin: "16px 0",
              textAlign: "left",
            }}
          >
            <div
              style={{
                fontSize: 11,
                opacity: 0.8,
                fontWeight: 700,
                letterSpacing: ".1em",
                marginBottom: 6,
              }}
            >
              SERIES PREVIEW
            </div>
            <div
              style={{
                fontFamily: "var(--ff-display)",
                fontWeight: 900,
                fontSize: 22,
                letterSpacing: "-0.01em",
              }}
            >
              {data.name || "My Series"}
            </div>
            <div style={{ fontSize: 13, opacity: 0.9, marginTop: 4 }}>
              {data.tagline || "태그라인 없음"}
            </div>
          </div>

          <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
            <Link href="/series" className="btn btn--lg">
              시리즈 목록
            </Link>
            <button
              type="button"
              className="btn btn--primary btn--lg"
              onClick={() => {
                // 또 만들기 — 이름/태그라인/장소/일자만 초기화
                setSubmitted(false);
                setStep(0);
                setData((d) => ({
                  ...d,
                  name: "",
                  tagline: "",
                  venue: "",
                  firstDate: "",
                }));
              }}
            >
              또 만들기
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ===== 입력 단계 (시안 L11~L137 박제) =====
  return (
    <div className="page" style={{ maxWidth: 720 }}>
      {/* 빵부스러기 (시안 L13~L15) */}
      <div
        style={{
          fontSize: 12,
          color: "var(--ink-mute)",
          marginBottom: 10,
        }}
      >
        <Link href="/series" style={{ color: "inherit" }}>
          시리즈
        </Link>{" "}
        ›{" "}
        <span style={{ color: "var(--ink)" }}>새 시리즈 만들기</span>
      </div>

      {/* 페이지 타이틀 (시안 L17~L21) */}
      <div className="eyebrow">시리즈 개설 · 5분 룰</div>
      <h1
        style={{
          margin: "8px 0 6px",
          fontSize: 28,
          fontWeight: 800,
          letterSpacing: "-0.02em",
        }}
      >
        새 시리즈 만들기
      </h1>
      <p
        style={{
          color: "var(--ink-mute)",
          fontSize: 14,
          marginBottom: 24,
          lineHeight: 1.6,
        }}
      >
        이름 입력 → 첫 회차 3필드 → 공개. 컴맹도 핸드폰만으로 5분이면 됩니다.
      </p>

      {/* StepWizard 카드 (시안 L32 의 .card 외피) */}
      <div className="card" style={{ padding: "24px 26px" }}>
        <StepWizard
          steps={STEPS}
          currentStep={step}
          onStepChange={setStep}
          canGoNext={canGoNext}
          finishLabel="공개하고 시리즈 만들기 ✓"
          onFinish={handleFinish}
        >
          {step === 0 && <Step1Basics data={data} update={update} />}
          {step === 1 && <Step2FirstEdition data={data} update={update} />}
          {step === 2 && <Step3Review data={data} update={update} />}
        </StepWizard>
      </div>
    </div>
  );
}

/* ---------- 보조 스타일 (시안 모든 label 동일 스타일) ---------- */

// 시안의 .label 클래스 박제 (P1-2a 와 동일 패턴)
const labelStyle = {
  fontSize: 12,
  fontWeight: 700,
  color: "var(--ink-dim)",
  display: "block",
  marginBottom: 6,
} as const;

/* ---------- Step 1: 기본 정보 (시안 L31~L56) ---------- */
function Step1Basics({
  data,
  update,
}: {
  data: FormData;
  update: <K extends keyof FormData>(k: K, v: FormData[K]) => void;
}): ReactElement {
  return (
    <div>
      <h2 style={{ margin: "0 0 18px", fontSize: 18, fontWeight: 700 }}>
        시리즈 기본 정보
      </h2>

      {/* 시리즈 이름 — 필수 (시안 L36~L37) */}
      <label style={labelStyle}>시리즈 이름 *</label>
      <input
        className="input"
        placeholder="예) BDR CHALLENGE"
        value={data.name}
        onChange={(e) => update("name", e.target.value)}
        autoFocus
      />

      <div style={{ height: 14 }} />

      {/* 한 줄 태그라인 (시안 L40~L41) */}
      <label style={labelStyle}>한 줄 태그라인</label>
      <input
        className="input"
        placeholder="예) 서울 3x3 오픈 챔피언십"
        value={data.tagline}
        onChange={(e) => update("tagline", e.target.value)}
      />

      <div style={{ height: 14 }} />

      {/* 시리즈 색상 (시안 L44~L49) */}
      <label style={labelStyle}>시리즈 색상</label>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {ACCENT_COLORS.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => update("accent", c)}
            // 선택된 색상은 ink 컬러 3px 보더, 그 외는 border 2px (시안 L47)
            style={{
              width: 34,
              height: 34,
              background: c,
              border:
                data.accent === c
                  ? "3px solid var(--ink)"
                  : "2px solid var(--border)",
              borderRadius: 6,
              cursor: "pointer",
              padding: 0,
            }}
            aria-label={`색상 ${c}`}
          />
        ))}
      </div>
    </div>
  );
}

/* ---------- Step 2: 첫 회차 (시안 L59~L101) ---------- */
function Step2FirstEdition({
  data,
  update,
}: {
  data: FormData;
  update: <K extends keyof FormData>(k: K, v: FormData[K]) => void;
}): ReactElement {
  return (
    <div>
      <h2 style={{ margin: "0 0 8px", fontSize: 18, fontWeight: 700 }}>
        첫 회차 — 3필드만 채우면 끝
      </h2>
      <p style={{ margin: "0 0 18px", fontSize: 13, color: "var(--ink-mute)" }}>
        상세 규정·일정은 나중에 추가할 수 있어요.
      </p>

      {/* 개최 장소 — 필수 (시안 L67~L68) */}
      <label style={labelStyle}>개최 장소 *</label>
      <input
        className="input"
        placeholder="예) 장충체육관"
        value={data.venue}
        onChange={(e) => update("venue", e.target.value)}
      />

      <div style={{ height: 14 }} />

      {/* 개최일 — 필수 (시안 L71~L72) */}
      <label style={labelStyle}>개최일 *</label>
      <input
        className="input"
        type="date"
        value={data.firstDate}
        onChange={(e) => update("firstDate", e.target.value)}
      />

      <div style={{ height: 14 }} />

      {/* 참가 정원 (시안 L75~L83) */}
      <label style={labelStyle}>참가 정원</label>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {CAPACITY_OPTIONS.map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => update("capacity", n)}
            // 선택된 옵션만 primary 톤 (시안 L78~L80 인라인 스타일 박제)
            className={`btn btn--sm ${
              data.capacity === n ? "btn--primary" : ""
            }`}
          >
            {n}팀
          </button>
        ))}
      </div>

      {/* 참가비 + 상금 (시안 L85~L94) */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 12,
          marginTop: 14,
        }}
      >
        <div>
          <label style={labelStyle}>참가비 (선택)</label>
          <input
            className="input"
            placeholder="₩80,000"
            value={data.fee}
            onChange={(e) => update("fee", e.target.value)}
          />
        </div>
        <div>
          <label style={labelStyle}>상금 (선택)</label>
          <input
            className="input"
            placeholder="₩5,000,000"
            value={data.prize}
            onChange={(e) => update("prize", e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}

/* ---------- Step 3: 확인 후 공개 (시안 L104~L135) ---------- */
function Step3Review({
  data,
  update,
}: {
  data: FormData;
  update: <K extends keyof FormData>(k: K, v: FormData[K]) => void;
}): ReactElement {
  return (
    <div>
      <h2 style={{ margin: "0 0 18px", fontSize: 18, fontWeight: 700 }}>
        확인 후 공개
      </h2>

      {/* preview 카드 (시안 L109~L113) — accent 컬러 그라디언트 */}
      <div
        style={{
          padding: "18px 20px",
          borderRadius: 8,
          background: `linear-gradient(135deg, ${data.accent}, ${data.accent}AA)`,
          color: "#fff",
          marginBottom: 16,
        }}
      >
        <div
          style={{
            fontSize: 11,
            opacity: 0.8,
            fontWeight: 700,
            letterSpacing: ".1em",
            marginBottom: 6,
          }}
        >
          SERIES PREVIEW
        </div>
        <div
          style={{
            fontFamily: "var(--ff-display)",
            fontWeight: 900,
            fontSize: 24,
            letterSpacing: "-0.01em",
          }}
        >
          {data.name || "My Series"}
        </div>
        <div style={{ fontSize: 13, opacity: 0.9, marginTop: 4 }}>
          {data.tagline || "태그라인 없음"}
        </div>
      </div>

      {/* 요약 표 (시안 L115~L120) */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "120px 1fr",
          rowGap: 10,
          fontSize: 14,
          padding: "14px 16px",
          background: "var(--bg-alt)",
          borderRadius: 6,
          marginBottom: 18,
        }}
      >
        <div style={{ color: "var(--ink-dim)" }}>첫 회차</div>
        <div>
          {data.venue || "—"} · {data.firstDate || "—"}
        </div>
        <div style={{ color: "var(--ink-dim)" }}>경기 방식</div>
        <div>
          {data.format} · {data.capacity}팀
        </div>
        <div style={{ color: "var(--ink-dim)" }}>참가비</div>
        <div>{data.fee || "무료"}</div>
        <div style={{ color: "var(--ink-dim)" }}>상금</div>
        <div>{data.prize || "미정"}</div>
      </div>

      {/* 공개 범위 (시안 L122~L128) */}
      <label style={labelStyle}>공개 범위</label>
      <div style={{ display: "flex", gap: 6, marginBottom: 4 }}>
        {VISIBILITY_OPTIONS.map((opt) => (
          <button
            key={opt.v}
            type="button"
            onClick={() => update("visibility", opt.v)}
            className={`btn btn--sm ${
              data.visibility === opt.v ? "btn--primary" : ""
            }`}
          >
            {opt.l}
          </button>
        ))}
      </div>
    </div>
  );
}

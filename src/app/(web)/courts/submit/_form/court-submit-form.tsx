"use client";

import Link from "next/link";
import { useState, type ReactElement } from "react";
import { StepWizard, type StepWizardStep } from "@/components/wizard/step-wizard";

/* ============================================================
 * CourtSubmitForm (시안 CourtAdd.jsx 박제 — UI 전용)
 *
 * 이유(왜):
 *   BDR v2 신규 시안 Dev/design/BDR v2 (1)/screens/CourtAdd.jsx 를
 *   3단계 위저드(기본 정보 / 시설·특징 / 사진·설명)로 그대로 박제.
 *   StepWizard 공용 셸을 활용해 progress bar + prev/next 분기는
 *   위임하고, 본 컴포넌트는 단계별 본문 + 사이드 보상 카드 + 완료
 *   화면 분기만 책임진다.
 *
 *   DB 변경 금지 단계라 실제 mutation 은 없음. 제출 버튼은
 *   alert("준비 중") + 완료 화면 표시만 수행.
 *
 * 시안 매핑 (CourtAdd.jsx):
 *   - L25~L50  완료 화면 (submitted=true 분기)
 *   - L81~L127 Step 1: 기본 정보
 *   - L129~L180 Step 2: 시설·특징
 *   - L181~L213 Step 3: 사진·설명
 *   - L215~L227 사이드 보상 카드
 *
 * UI 미동작 항목 (백로그):
 *   - 사진 업로더: <input type="file" multiple disabled> 자리만
 *   - 제출 mutation: alert + 완료 화면만
 *   - 내 기여 현황: 더미 숫자 (3개 / 1,200P) 그대로
 * ============================================================ */

// 시안 데이터 모델 그대로 (alias 추가 없음)
interface FormData {
  name: string;
  area: string;
  addr: string;
  hours: string;
  type: "outdoor" | "indoor" | "mixed";
  surface: "urethane" | "asphalt" | "wood" | "pvc" | "concrete";
  hoops: number;
  lighting: boolean;
  fee: "free" | "paid" | "reserve";
  feeAmount: number;
  features: string[];
  vibe: "pickup" | "practice" | "family" | "mixed";
  desc: string;
}

// 시안 L84~L121 select 옵션을 상수로 추출 (반복 jsx 가독성 ↑)
const AREAS = [
  "서울",
  "경기",
  "인천",
  "부산",
  "대구",
  "대전",
  "광주",
  "울산",
  "기타",
];
const FEATURES = [
  "주차장",
  "화장실",
  "음수대",
  "샤워실",
  "라커",
  "벤치",
  "매점",
  "와이파이",
  "AED",
  "응급실 인근",
  "흡연 구역",
  "자판기",
];

// StepWizard 단계 정의 (시안 L75~L79 의 3-스텝 박제)
const STEPS: StepWizardStep[] = [
  { id: "basic", label: "기본 정보" },
  { id: "facility", label: "시설·특징" },
  { id: "photo", label: "사진·설명" },
];

const DEFAULT_DATA: FormData = {
  name: "",
  area: "서울",
  addr: "",
  hours: "24시간",
  type: "outdoor",
  surface: "urethane",
  hoops: 2,
  lighting: true,
  fee: "free",
  feeAmount: 0,
  features: [],
  vibe: "mixed",
  desc: "",
};

export function CourtSubmitForm(): ReactElement {
  // 위저드 현재 단계 (0-based) — StepWizard 가 controlled 로 받음
  const [step, setStep] = useState(0);
  // 시안 L5 의 submitted 분기를 그대로 보존
  const [submitted, setSubmitted] = useState(false);
  const [data, setData] = useState<FormData>(DEFAULT_DATA);

  // 단일 필드 업데이트 헬퍼 (시안 L22 update 함수 박제)
  // 제네릭으로 키별 타입을 안전하게 보장 (시안 JSX 의 동적 키 패턴 그대로 유지)
  const update = <K extends keyof FormData>(k: K, v: FormData[K]) =>
    setData((d) => ({ ...d, [k]: v }));

  // 편의시설 토글 (시안 L23 toggleF 박제)
  const toggleFeature = (f: string) =>
    setData((d) => ({
      ...d,
      features: d.features.includes(f)
        ? d.features.filter((x) => x !== f)
        : [...d.features, f],
    }));

  // 1단계 필수값 가드 (시안 L124 의 disabled 조건과 동일)
  const canGoNextFromStep1 = data.name.trim() !== "" && data.addr.trim() !== "";
  // StepWizard 의 canGoNext 는 현재 단계 기준
  const canGoNext = step === 0 ? canGoNextFromStep1 : true;

  // 마지막 단계 "제보하기" 클릭 — DB 미지원 단계라 alert + 완료 화면만
  const handleFinish = () => {
    alert(
      "준비 중 — 코트 제보 기능은 추후 운영자 검토 흐름과 함께 활성화됩니다."
    );
    setSubmitted(true);
  };

  // ===== 완료 화면 (시안 L25~L50 박제) =====
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
            {/* 시안 L29 체크 마크 박제 */}
            ✓
          </div>
          <h1 style={{ margin: "0 0 6px", fontSize: 22, fontWeight: 800 }}>
            코트 제보 완료
          </h1>
          <p
            style={{
              margin: "0 0 14px",
              fontSize: 13,
              color: "var(--ink-mute)",
              lineHeight: 1.6,
            }}
          >
            BDR 운영팀이 <b>24~48시간 내</b> 검토 후 등록합니다.
            <br />
            등록되면 <b>기여 배지</b>와 <b>포인트 500P</b>를 드려요.
          </p>
          <div
            style={{
              padding: "14px 16px",
              background: "var(--bg-alt)",
              borderRadius: 6,
              margin: "16px 0 22px",
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
              제보 요약
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "70px 1fr",
                gap: 8,
                fontSize: 13,
              }}
            >
              <div style={{ color: "var(--ink-dim)" }}>이름</div>
              <div style={{ fontWeight: 700 }}>{data.name || "(이름 없음)"}</div>
              <div style={{ color: "var(--ink-dim)" }}>위치</div>
              <div>
                {data.area} · {data.addr || "—"}
              </div>
              <div style={{ color: "var(--ink-dim)" }}>유형</div>
              <div>
                {data.type === "outdoor"
                  ? "야외"
                  : data.type === "indoor"
                  ? "실내"
                  : "복합"}{" "}
                · 골대 {data.hoops}개
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
            <Link href="/courts" className="btn btn--lg">
              코트 목록
            </Link>
            <button
              type="button"
              className="btn btn--primary btn--lg"
              onClick={() => {
                // 또 제보하기 — 이름/주소만 초기화 (시안 L45 박제)
                setSubmitted(false);
                setStep(0);
                setData((d) => ({ ...d, name: "", addr: "" }));
              }}
            >
              또 제보하기
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ===== 입력 단계 (시안 L59~L228 박제) =====
  return (
    <div className="page">
      {/* 빵부스러기 (시안 L61~L65) */}
      <div
        style={{
          display: "flex",
          gap: 6,
          fontSize: 12,
          color: "var(--ink-mute)",
          marginBottom: 12,
        }}
      >
        <Link href="/" style={{ color: "inherit" }}>
          홈
        </Link>
        <span>›</span>
        <Link href="/courts" style={{ color: "inherit" }}>
          코트
        </Link>
        <span>›</span>
        <span style={{ color: "var(--ink)" }}>코트 제보</span>
      </div>

      {/* 페이지 타이틀 (시안 L67~L71) */}
      <div style={{ marginBottom: 20 }}>
        <div className="eyebrow">COURT REPORT · 코트 제보</div>
        <h1
          style={{
            margin: "6px 0 0",
            fontSize: 28,
            fontWeight: 800,
            letterSpacing: "-0.02em",
          }}
        >
          새 코트 제보
        </h1>
        <p
          style={{
            margin: "4px 0 0",
            color: "var(--ink-mute)",
            fontSize: 13,
          }}
        >
          BDR에 없는 코트를 발견했다면 알려주세요 · 등록되면{" "}
          <b style={{ color: "var(--accent)" }}>500P</b> 지급
        </p>
      </div>

      {/* 메인 + 사이드 2단 레이아웃 (시안 L73) */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0,1fr) 300px",
          gap: 18,
          alignItems: "flex-start",
        }}
      >
        {/* 좌측: StepWizard 카드 (시안 L74) */}
        <div className="card" style={{ padding: "24px 28px" }}>
          <StepWizard
            steps={STEPS}
            currentStep={step}
            onStepChange={setStep}
            canGoNext={canGoNext}
            finishLabel="제보하기"
            onFinish={handleFinish}
          >
            {step === 0 && <Step1Basic data={data} update={update} />}
            {step === 1 && (
              <Step2Facility
                data={data}
                update={update}
                toggleFeature={toggleFeature}
              />
            )}
            {step === 2 && <Step3Photo data={data} update={update} />}
          </StepWizard>
        </div>

        {/* 우측: 보상/기여 카드 (시안 L215~L227) */}
        <aside
          style={{
            position: "sticky",
            top: 120,
            display: "flex",
            flexDirection: "column",
            gap: 14,
          }}
        >
          <div
            className="card"
            style={{
              padding: "18px 20px",
              background: "linear-gradient(135deg, #DC262622, #0F5FCC22)",
            }}
          >
            <div
              style={{
                fontSize: 11,
                color: "var(--ink-dim)",
                fontWeight: 800,
                letterSpacing: ".1em",
                marginBottom: 8,
              }}
            >
              🎁 기여 보상
            </div>
            {/* 시안 L218~L220 박제 — 더미 숫자 그대로 */}
            <RewardRow label="제보 승인" value="+500P" />
            <RewardRow label="사진 3장 이상" value="+200P" />
            <RewardRow label="월 3회 이상 제보" value="🥇 배지" />
          </div>
          <div className="card" style={{ padding: "16px 18px" }}>
            <div
              style={{
                fontSize: 11,
                color: "var(--ink-dim)",
                fontWeight: 700,
                marginBottom: 6,
              }}
            >
              내 기여 현황
            </div>
            {/* 더미 데이터 — 실 사용자 통계 미연동 (백로그) */}
            <div
              style={{
                fontFamily: "var(--ff-display)",
                fontSize: 24,
                fontWeight: 900,
              }}
            >
              3
              <span
                style={{
                  fontSize: 14,
                  color: "var(--ink-dim)",
                  fontWeight: 700,
                }}
              >
                {" "}
                개 제보
              </span>
            </div>
            <div
              style={{
                fontSize: 11,
                color: "var(--ink-dim)",
                marginTop: 2,
              }}
            >
              누적 포인트 1,200P · 🥈 은 기여자
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

/* ---------- 보조 컴포넌트 (시안 박제 분리) ---------- */

// 보상 카드 한 행 (시안 L218 패턴 추출)
function RewardRow({
  label,
  value,
}: {
  label: string;
  value: string;
}): ReactElement {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        padding: "6px 0",
        fontSize: 13,
      }}
    >
      <span>{label}</span>
      <b style={{ fontFamily: "var(--ff-mono)", color: "var(--accent)" }}>
        {value}
      </b>
    </div>
  );
}

// 라벨 공통 스타일 (시안 모든 label 동일 스타일)
const labelStyle = {
  fontSize: 12,
  fontWeight: 700,
  color: "var(--ink-dim)",
  display: "block",
  marginBottom: 6,
} as const;

/* ---------- Step 1: 기본 정보 (시안 L82~L122) ---------- */
function Step1Basic({
  data,
  update,
}: {
  data: FormData;
  update: <K extends keyof FormData>(k: K, v: FormData[K]) => void;
}): ReactElement {
  return (
    <div>
      <h2 style={{ margin: "0 0 14px", fontSize: 16, fontWeight: 700 }}>
        기본 정보
      </h2>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 14,
        }}
      >
        {/* 코트 이름 (시안 L85~L88, gridColumn:'1/-1') */}
        <div style={{ gridColumn: "1/-1" }}>
          <label style={labelStyle}>코트 이름 *</label>
          <input
            className="input"
            value={data.name}
            onChange={(e) => update("name", e.target.value)}
            placeholder="예: 한강공원 반포지구 농구장"
          />
        </div>

        {/* 지역 (시안 L89~L94) */}
        <div>
          <label style={labelStyle}>지역 *</label>
          <select
            className="input"
            value={data.area}
            onChange={(e) => update("area", e.target.value)}
          >
            {AREAS.map((a) => (
              <option key={a}>{a}</option>
            ))}
          </select>
        </div>

        {/* 운영 시간 (시안 L95~L98) */}
        <div>
          <label style={labelStyle}>운영 시간</label>
          <input
            className="input"
            value={data.hours}
            onChange={(e) => update("hours", e.target.value)}
            placeholder="24시간 / 09:00-22:00"
          />
        </div>

        {/* 상세 주소 (시안 L99~L103) */}
        <div style={{ gridColumn: "1/-1" }}>
          <label style={labelStyle}>상세 주소 *</label>
          <input
            className="input"
            value={data.addr}
            onChange={(e) => update("addr", e.target.value)}
            placeholder="예: 서울 서초구 반포동 한강공원 반포지구 내"
          />
          <div
            style={{ fontSize: 11, color: "var(--ink-dim)", marginTop: 4 }}
          >
            📍 주소를 입력하면 자동으로 지도에 표시됩니다
          </div>
        </div>

        {/* 유형 (시안 L104~L111) */}
        <div>
          <label style={labelStyle}>유형</label>
          <div style={{ display: "flex", gap: 6 }}>
            {(
              [
                { v: "outdoor", l: "야외" },
                { v: "indoor", l: "실내" },
                { v: "mixed", l: "복합" },
              ] as const
            ).map((t) => (
              <button
                key={t.v}
                type="button"
                onClick={() => update("type", t.v)}
                className={`btn btn--sm ${
                  data.type === t.v ? "btn--primary" : ""
                }`}
                style={{ flex: 1 }}
              >
                {t.l}
              </button>
            ))}
          </div>
        </div>

        {/* 바닥 (시안 L112~L121) */}
        <div>
          <label style={labelStyle}>바닥</label>
          <select
            className="input"
            value={data.surface}
            onChange={(e) =>
              update("surface", e.target.value as FormData["surface"])
            }
          >
            <option value="urethane">우레탄</option>
            <option value="asphalt">아스팔트</option>
            <option value="wood">우드</option>
            <option value="pvc">PVC</option>
            <option value="concrete">콘크리트</option>
          </select>
        </div>
      </div>
    </div>
  );
}

/* ---------- Step 2: 시설·특징 (시안 L130~L173) ---------- */
function Step2Facility({
  data,
  update,
  toggleFeature,
}: {
  data: FormData;
  update: <K extends keyof FormData>(k: K, v: FormData[K]) => void;
  toggleFeature: (f: string) => void;
}): ReactElement {
  return (
    <div>
      <h2 style={{ margin: "0 0 14px", fontSize: 16, fontWeight: 700 }}>
        시설·특징
      </h2>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 14,
        }}
      >
        {/* 골대 수 (시안 L133~L140) */}
        <div>
          <label style={labelStyle}>골대 수</label>
          <div style={{ display: "flex", gap: 6 }}>
            {[1, 2, 4, 6].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => update("hoops", n)}
                className={`btn btn--sm ${
                  data.hoops === n ? "btn--primary" : ""
                }`}
                style={{ flex: 1 }}
              >
                {n}개
              </button>
            ))}
          </div>
        </div>

        {/* 조명 (시안 L141~L147) */}
        <div>
          <label style={labelStyle}>조명</label>
          <div style={{ display: "flex", gap: 6 }}>
            <button
              type="button"
              onClick={() => update("lighting", true)}
              className={`btn btn--sm ${data.lighting ? "btn--primary" : ""}`}
              style={{ flex: 1 }}
            >
              있음
            </button>
            <button
              type="button"
              onClick={() => update("lighting", false)}
              className={`btn btn--sm ${!data.lighting ? "btn--primary" : ""}`}
              style={{ flex: 1 }}
            >
              없음
            </button>
          </div>
        </div>

        {/* 이용료 (시안 L148~L156) */}
        <div style={{ gridColumn: "1/-1" }}>
          <label style={labelStyle}>이용료</label>
          <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
            <button
              type="button"
              onClick={() => update("fee", "free")}
              className={`btn btn--sm ${
                data.fee === "free" ? "btn--primary" : ""
              }`}
              style={{ flex: 1 }}
            >
              무료
            </button>
            <button
              type="button"
              onClick={() => update("fee", "paid")}
              className={`btn btn--sm ${
                data.fee === "paid" ? "btn--primary" : ""
              }`}
              style={{ flex: 1 }}
            >
              유료
            </button>
            <button
              type="button"
              onClick={() => update("fee", "reserve")}
              className={`btn btn--sm ${
                data.fee === "reserve" ? "btn--primary" : ""
              }`}
              style={{ flex: 2 }}
            >
              예약제
            </button>
          </div>
          {/* 유료 선택 시에만 금액 입력 (시안 L155 박제) */}
          {data.fee === "paid" && (
            <input
              className="input"
              type="number"
              value={data.feeAmount}
              onChange={(e) => update("feeAmount", Number(e.target.value))}
              placeholder="시간당 이용료 (원)"
            />
          )}
        </div>

        {/* 편의시설 (시안 L157~L164) */}
        <div style={{ gridColumn: "1/-1" }}>
          <label style={labelStyle}>편의시설 (복수)</label>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {FEATURES.map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => toggleFeature(f)}
                className={`btn btn--sm ${
                  data.features.includes(f) ? "btn--primary" : ""
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* 분위기 (시안 L165~L172) */}
        <div style={{ gridColumn: "1/-1" }}>
          <label style={labelStyle}>분위기</label>
          <div style={{ display: "flex", gap: 6 }}>
            {(
              [
                { v: "pickup", l: "픽업 위주" },
                { v: "practice", l: "개인 연습" },
                { v: "family", l: "가족·어린이" },
                { v: "mixed", l: "혼합" },
              ] as const
            ).map((t) => (
              <button
                key={t.v}
                type="button"
                onClick={() => update("vibe", t.v)}
                className={`btn btn--sm ${
                  data.vibe === t.v ? "btn--primary" : ""
                }`}
                style={{ flex: 1 }}
              >
                {t.l}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Step 3: 사진·설명 (시안 L182~L212) ---------- */
function Step3Photo({
  data,
  update,
}: {
  data: FormData;
  update: <K extends keyof FormData>(k: K, v: FormData[K]) => void;
}): ReactElement {
  return (
    <div>
      <h2 style={{ margin: "0 0 14px", fontSize: 16, fontWeight: 700 }}>
        사진·설명
      </h2>

      {/* 사진 업로더 (시안 L184~L190 박제) — 미동작 자리 */}
      <label style={labelStyle}>사진 (최대 5장)</label>
      <div
        style={{
          padding: "24px",
          border: "2px dashed var(--border)",
          borderRadius: 8,
          textAlign: "center",
          marginBottom: 8,
          background: "var(--bg-alt)",
        }}
      >
        <div style={{ fontSize: 32, opacity: 0.3, marginBottom: 6 }}>📸</div>
        <div style={{ fontSize: 13, fontWeight: 600 }}>
          드래그하거나 클릭해서 업로드
        </div>
        <div
          style={{ fontSize: 11, color: "var(--ink-dim)", marginTop: 4 }}
        >
          JPG · PNG · 최대 5MB · 코트 전체가 보이는 사진이 좋아요
        </div>
        {/* 실 업로드 미연동 — disabled 로 자리만 차지 (백로그) */}
        <label
          className="btn btn--sm"
          style={{
            marginTop: 12,
            display: "inline-block",
            cursor: "not-allowed",
            opacity: 0.6,
          }}
        >
          파일 선택
          <input
            type="file"
            multiple
            accept="image/jpeg,image/png"
            disabled
            style={{ display: "none" }}
          />
        </label>
      </div>

      {/* 업로드된 사진 더미 썸네일 3장 (시안 L191~L198 박제) */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(5,1fr)",
          gap: 6,
          marginBottom: 18,
        }}
      >
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{
              aspectRatio: "1",
              background: `linear-gradient(135deg, ${
                ["#DC2626", "#0F5FCC", "#10B981"][i]
              }88, ${["#DC2626", "#0F5FCC", "#10B981"][i]}44)`,
              borderRadius: 4,
              display: "grid",
              placeItems: "center",
              color: "#fff",
              fontSize: 22,
              fontWeight: 900,
              position: "relative",
            }}
          >
            <span style={{ opacity: 0.5 }}>🏀</span>
            <button
              type="button"
              aria-label="삭제"
              style={{
                position: "absolute",
                top: 4,
                right: 4,
                width: 18,
                height: 18,
                borderRadius: "50%",
                background: "rgba(0,0,0,.5)",
                color: "#fff",
                border: 0,
                cursor: "pointer",
                fontSize: 10,
              }}
            >
              ×
            </button>
          </div>
        ))}
      </div>

      {/* 한줄 설명 (시안 L200~L201) */}
      <label style={labelStyle}>한줄 설명 (선택)</label>
      <textarea
        className="input"
        rows={3}
        value={data.desc}
        onChange={(e) => update("desc", e.target.value)}
        placeholder="예: 강변북로 바로 옆. 저녁엔 야경이 좋고 조명도 22시까지 켜짐. 평일 저녁·주말 붐빔."
        style={{ resize: "vertical" }}
      />

      {/* 안내 박스 (시안 L203~L205) */}
      <div
        style={{
          marginTop: 18,
          padding: "12px 14px",
          background: "color-mix(in oklab, var(--accent) 5%, transparent)",
          borderLeft: "3px solid var(--accent)",
          borderRadius: 4,
          fontSize: 12,
          color: "var(--ink-soft)",
          lineHeight: 1.6,
        }}
      >
        제보해주신 내용은 BDR 운영팀 검토 후 공개됩니다. 허위 정보나 이미
        등록된 코트일 경우 반려될 수 있어요.
      </div>
    </div>
  );
}

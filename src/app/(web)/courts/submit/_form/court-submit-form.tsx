"use client";

import Link from "next/link";
import { useState, type ReactElement } from "react";

/* ============================================================
 * CourtSubmitForm — 코트 등록 제보 폼 (P1-a 실연결, Phase 12 시안 v2.31 박제 기반)
 *
 * 왜 실연결로 바뀌었나:
 *  - court_submissions 테이블 ADD(P1-a) → 제보 INSERT 대상 확보.
 *  - 기존 정적폼(noop alert)을 실제 POST /api/web/courts/submissions 로 연결.
 *
 * 어떻게:
 *  - 시안 .fm-* 마크업/토큰은 100% 보존(시각 변경 0). 입력값만 useState 로 controlled.
 *  - court_type 한글 옵션 → 영문 키(indoor/outdoor/3x3) value 매핑(API enum 정합).
 *  - 제출 성공 시 폼 카드 → "검토 중" 완료 화면으로 분기(submitted state).
 *  - 비로그인(401)/검증(422) 등 에러는 인라인 메시지로 안내.
 *  - 사진 업로드는 시안 dropzone UI 자리만 유지(미동작) → photos 는 빈 배열 전송.
 * ============================================================ */

// 편의시설 옵션 (시안 amens 박제) — [key, 라벨, Material Symbols 아이콘]
const AMENITIES: [string, string, string][] = [
  ["shower", "샤워실", "shower"],
  ["parking", "주차", "local_parking"],
  ["indoor", "실내", "home"],
  ["light", "야간 조명", "lightbulb"],
  ["locker", "락커", "lock"],
  ["rental", "용품 대여", "sports_basketball"],
];

// 지역 옵션 (시안 박제) — 그대로 텍스트 저장
const REGIONS = ["서울 중구", "서울 송파구", "서울 용산구", "경기 하남시"];

// 코트 유형: 라벨(시안) → API enum 키 매핑
const COURT_TYPES: { label: string; value: "indoor" | "outdoor" | "3x3" }[] = [
  { label: "실내 풀코트", value: "indoor" },
  { label: "실외 풀코트", value: "outdoor" },
  { label: "하프코트 (3x3)", value: "3x3" },
];

export function CourtSubmitForm(): ReactElement {
  // ── 폼 입력 상태 ──
  const [name, setName] = useState("");
  const [region, setRegion] = useState(REGIONS[0]);
  const [courtType, setCourtType] = useState<"indoor" | "outdoor" | "3x3">("indoor");
  const [address, setAddress] = useState("");
  const [operatingHours, setOperatingHours] = useState("");
  const [feeText, setFeeText] = useState("");
  // 편의시설 선택 토글 — 시안 기본값 ['shower'] 박제
  const [amen, setAmen] = useState<string[]>(["shower"]);
  const [description, setDescription] = useState("");

  // ── 제출 흐름 상태 ──
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false); // 성공 → 완료 화면
  const [error, setError] = useState<string | null>(null);

  const toggle = (k: string) =>
    setAmen((a) => (a.includes(k) ? a.filter((x) => x !== k) : [...a, k]));

  // 제보 제출 — POST /api/web/courts/submissions
  const handleSubmit = async () => {
    setError(null);

    // 필수값 클라이언트 1차 검증(서버 Zod 가 최종 검증)
    if (!name.trim() || !address.trim()) {
      setError("코트 이름과 상세 주소는 필수입니다.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/web/courts/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          region,
          court_type: courtType,
          address: address.trim(),
          operating_hours: operatingHours.trim() || null,
          fee_text: feeText.trim() || null,
          amenities: amen,
          photos: [], // 사진 업로드 미동작 단계 → 빈 배열
          description: description.trim() || null,
        }),
      });

      if (res.ok) {
        setSubmitted(true); // 완료 화면으로 전환
        return;
      }

      // 에러 응답 안내(401/422 등)
      if (res.status === 401) {
        setError("로그인이 필요합니다. 로그인 후 다시 제보해 주세요.");
      } else {
        const data = await res.json().catch(() => null);
        setError(data?.error ?? "제출에 실패했습니다. 잠시 후 다시 시도해 주세요.");
      }
    } catch {
      setError("네트워크 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page">
      <div className="ex-page-w page__inner--narrow">
        {/* 브레드크럼 — 홈 › 코트 › 코트 등록 신청 */}
        <div className="ex-crumb">
          <Link href="/">홈</Link>
          <span className="sep">›</span>
          <Link href="/courts">코트</Link>
          <span className="sep">›</span>
          <span className="cur">코트 등록 신청</span>
        </div>

        {/* 페이지 헤더 */}
        <div className="ex-head" style={{ marginBottom: 14 }}>
          <div>
            <div className="eyebrow">COURT · 코트 등록 신청</div>
            <h1 className="ex-head__title">새 코트 제보하기</h1>
            <p className="ex-head__sub">
              아직 등록되지 않은 코트를 제보해 주세요. 운영팀 검수 후 지도에 추가됩니다.
            </p>
          </div>
        </div>

        {/* 제출 완료 → "검토 중" 안내 화면 분기 */}
        {submitted ? (
          <div className="card fm-card" style={{ textAlign: "center" }}>
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 48, color: "var(--color-success)" }}
            >
              check_circle
            </span>
            <h2
              style={{
                margin: "12px 0 6px",
                fontSize: 18,
                fontWeight: 700,
                color: "var(--color-text-primary)",
              }}
            >
              제보가 접수되었습니다
            </h2>
            <p
              style={{
                fontSize: 14,
                lineHeight: 1.6,
                color: "var(--color-text-muted)",
                marginBottom: 18,
              }}
            >
              운영팀 검수(평균 2~3일) 후 지도에 등록되며, 등록 시 안내드립니다.
            </p>
            <div className="fm-actions" style={{ justifyContent: "center" }}>
              <Link href="/courts" className="btn">
                코트 목록으로
              </Link>
              <button
                type="button"
                className="btn btn--accent"
                onClick={() => {
                  // 추가 제보를 위해 폼 초기화
                  setSubmitted(false);
                  setName("");
                  setAddress("");
                  setOperatingHours("");
                  setFeeText("");
                  setDescription("");
                  setAmen(["shower"]);
                }}
              >
                <span className="ico material-symbols-outlined">add</span>
                추가 제보하기
              </button>
            </div>
          </div>
        ) : (
          /* 입력 폼 카드 (시안 .fm-* 박제) */
          <div className="card fm-card">
            {/* 스텝 닷 — 시각 표시용(시안 박제) */}
            <div className="fm-step">
              <span className="fm-step__dot is-on" />
              <span className="fm-step__dot is-on" />
              <span className="fm-step__dot" />
            </div>

            {/* 코트 이름 */}
            <div className="fm-field">
              <label className="fm-label">
                코트 이름<span className="req">*</span>
              </label>
              <input
                className="fm-input"
                placeholder="예: 장충체육관 보조경기장"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            {/* 지역 + 코트 유형 */}
            <div className="fm-row">
              <div className="fm-field">
                <label className="fm-label">
                  지역<span className="req">*</span>
                </label>
                <select
                  className="fm-select"
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                >
                  {REGIONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>
              <div className="fm-field">
                <label className="fm-label">
                  코트 유형<span className="req">*</span>
                </label>
                <select
                  className="fm-select"
                  value={courtType}
                  onChange={(e) =>
                    setCourtType(e.target.value as "indoor" | "outdoor" | "3x3")
                  }
                >
                  {COURT_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 상세 주소 */}
            <div className="fm-field">
              <label className="fm-label">
                상세 주소<span className="req">*</span>
              </label>
              <input
                className="fm-input"
                placeholder="도로명 주소를 입력하세요"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>

            {/* 운영 시간 + 이용료 */}
            <div className="fm-row">
              <div className="fm-field">
                <label className="fm-label">운영 시간</label>
                <input
                  className="fm-input"
                  placeholder="예: 06:00 – 22:00"
                  value={operatingHours}
                  onChange={(e) => setOperatingHours(e.target.value)}
                />
              </div>
              <div className="fm-field">
                <label className="fm-label">이용료</label>
                <input
                  className="fm-input"
                  placeholder="예: 무료 / 시간당 5,000원"
                  value={feeText}
                  onChange={(e) => setFeeText(e.target.value)}
                />
              </div>
            </div>

            {/* 편의시설 (복수 토글) */}
            <div className="fm-field">
              <label className="fm-label">편의시설</label>
              <div className="fm-checks">
                {AMENITIES.map(([k, l, ico]) => (
                  <button
                    key={k}
                    type="button"
                    className={"fm-check" + (amen.includes(k) ? " is-on" : "")}
                    onClick={() => toggle(k)}
                  >
                    <span className="ico material-symbols-outlined">{ico}</span>
                    {l}
                  </button>
                ))}
              </div>
            </div>

            {/* 코트 사진 — dropzone 자리만(업로드 미동작 단계, photos=[] 전송) */}
            <div className="fm-field">
              <label className="fm-label">코트 사진</label>
              <div className="fm-upload">
                <span className="ico material-symbols-outlined">add_a_photo</span>
                사진을 끌어다 놓거나 클릭해 업로드 (최대 5장)
              </div>
            </div>

            {/* 추가 설명 */}
            <div className="fm-field">
              <label className="fm-label">추가 설명</label>
              <textarea
                className="fm-textarea"
                placeholder="바닥 상태, 골대 개수, 주차 안내 등 도움이 될 정보를 적어주세요."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            {/* 검수 안내 노트 */}
            <div className="fm-note">
              <span className="ico material-symbols-outlined">info</span>
              제보해 주신 코트는 운영팀 검수(평균 2~3일) 후 등록되며, 등록 시 알림으로 안내드립니다.
            </div>

            {/* 에러 안내(인라인) */}
            {error && (
              <div
                className="fm-note"
                style={{ color: "var(--color-error)", borderColor: "var(--color-error)" }}
              >
                <span className="ico material-symbols-outlined">error</span>
                {error}
              </div>
            )}

            {/* 액션 — 제보 제출(POST) */}
            <div className="fm-actions">
              <button
                type="button"
                className="btn btn--accent"
                onClick={handleSubmit}
                disabled={submitting}
              >
                <span className="ico material-symbols-outlined">send</span>
                {submitting ? "제출 중..." : "제보 제출"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useState, type ReactElement } from "react";

/* ============================================================
 * CourtSubmitForm — 코트 등록 신청 정적 폼 (Phase 12 Batch B v2.31)
 *
 * 왜 정적 폼인가:
 *  - court_submissions 테이블 부재(grep 0). INSERT 대상 없음 → 신규 DB = Stop condition.
 *  - 시안(CourtAdd.jsx)은 3-step 위저드가 아닌 단일 폼 v2.31 → 기존 StepWizard 박제를
 *    .fm-* 단일 폼으로 시각 교체.
 *  - 폼 입력 UI 는 SF1/RI1 정적 박제 패턴과 동형(mock 아님). 제출만 미연결.
 *
 * 어떻게:
 *  - 시안 .fm-* (field/row/check/upload/note/actions) 그대로. 토큰은 globals.css
 *    Batch B 블록에 이식됨(--r-md→--radius-card / --r-sm·--r-xs→--radius-chip).
 *  - 편의시설 칩 toggle 만 useState 로 동작(시각). 사진 업로드는 dropzone UI 자리만(미동작).
 *  - "제보 제출" = alert("준비 중") + noop. DB INSERT 0 / API 0.
 *  - active 탭(court)은 app-nav 의 pathname 자동판정(/courts/submit) → prop 조작 0.
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

export function CourtSubmitForm(): ReactElement {
  // 편의시설 선택 토글 — 시안 기본값 ['shower'] 박제 (시각만, 제출 미연결)
  const [amen, setAmen] = useState<string[]>(["shower"]);
  const toggle = (k: string) =>
    setAmen((a) => (a.includes(k) ? a.filter((x) => x !== k) : [...a, k]));

  // 제보 제출 — DB 미지원 단계라 안내만(INSERT 0)
  const handleSubmit = () => {
    alert("준비 중 — 코트 제보 기능은 추후 운영자 검수 흐름과 함께 활성화됩니다.");
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

        {/* 정적 폼 카드 (시안 .fm-* 박제) */}
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
            <input className="fm-input" placeholder="예: 장충체육관 보조경기장" />
          </div>

          {/* 지역 + 코트 유형 */}
          <div className="fm-row">
            <div className="fm-field">
              <label className="fm-label">
                지역<span className="req">*</span>
              </label>
              <select className="fm-select" defaultValue="서울 중구">
                <option>서울 중구</option>
                <option>서울 송파구</option>
                <option>서울 용산구</option>
                <option>경기 하남시</option>
              </select>
            </div>
            <div className="fm-field">
              <label className="fm-label">
                코트 유형<span className="req">*</span>
              </label>
              <select className="fm-select" defaultValue="실내 풀코트">
                <option>실내 풀코트</option>
                <option>실외 풀코트</option>
                <option>하프코트 (3x3)</option>
              </select>
            </div>
          </div>

          {/* 상세 주소 */}
          <div className="fm-field">
            <label className="fm-label">
              상세 주소<span className="req">*</span>
            </label>
            <input className="fm-input" placeholder="도로명 주소를 입력하세요" />
          </div>

          {/* 운영 시간 + 이용료 */}
          <div className="fm-row">
            <div className="fm-field">
              <label className="fm-label">운영 시간</label>
              <input className="fm-input" placeholder="예: 06:00 – 22:00" />
            </div>
            <div className="fm-field">
              <label className="fm-label">이용료</label>
              <input className="fm-input" placeholder="예: 무료 / 시간당 5,000원" />
            </div>
          </div>

          {/* 편의시설 (복수 토글 — 시각만) */}
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

          {/* 코트 사진 — dropzone 자리만(업로드 미동작) */}
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
            />
          </div>

          {/* 검수 안내 노트 */}
          <div className="fm-note">
            <span className="ico material-symbols-outlined">info</span>
            제보해 주신 코트는 운영팀 검수(평균 2~3일) 후 등록되며, 등록 시 알림으로 안내드립니다.
          </div>

          {/* 액션 — 제출은 준비중 안내(INSERT 0) */}
          <div className="fm-actions">
            <button type="button" className="btn" onClick={handleSubmit}>
              임시저장
            </button>
            <button type="button" className="btn btn--accent" onClick={handleSubmit}>
              <span className="ico material-symbols-outlined">send</span>제보 제출
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

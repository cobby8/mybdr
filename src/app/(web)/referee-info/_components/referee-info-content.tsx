"use client";

/* ============================================================
 * RefereeInfoContent — /referee-info 클라이언트 본체 (RI1 · v2.31)
 *
 * 왜 클라이언트인가:
 *   시안 RefereeInfo.jsx L60 React.useState(open) — FAQ 아코디언이
 *   클릭 토글(인터랙션)을 필요로 함. 반면 page.tsx 는 SEO metadata
 *   export 가 있는 server component 라 "use client" 를 둘 수 없음.
 *   → metadata(server) + FAQ accordion(client) 분리.
 *
 * 데이터:
 *   심판 제도 안내(통계/하는일/등급/절차/정산/FAQ) = 정적 콘텐츠.
 *   DB 무관 제도 안내이므로 mock 이 아님(상수 박제 허용).
 *
 * 회귀:
 *   /referee-info 라우트 불변 / 비로그인 열람 / 데이터 패칭 0.
 *   CTA href: 시안 "#"·"iu3-help.html" → 운영 실라우트(/referee·/help).
 *   AppNav active = pathname 자동 판정(/referee-info → more). prop 조작 0.
 * ============================================================ */

import Link from "next/link";
import { useState } from "react";

// 통계 4셀 — 제도 안내 정적 수치 (시안 RI_STATS)
const RI_STATS = [
  { v: "180+", k: "활동 공인 심판" },
  { v: "2,400+", k: "월 배정 경기" },
  { v: "48시간", k: "평균 정산 주기" },
  { v: "3등급", k: "자격 체계" },
];

// 심판이 하는 일 4카드 (시안 RI_ROLES)
const RI_ROLES = [
  { ico: "assignment_turned_in", t: "배정 수락", d: "내 지역·일정에 맞는 경기를 골라 배정을 수락합니다." },
  { ico: "sports", t: "경기 진행", d: "규정에 따라 경기를 운영하고 콜·파울을 판정합니다." },
  { ico: "scoreboard", t: "결과 기록", d: "기록앱으로 점수·기록을 입력해 결과를 확정합니다." },
  { ico: "verified_user", t: "공정성 보증", d: "중립 위치에서 양 팀에 공정한 경기 환경을 보장합니다." },
];

// 자격 등급 3카드 (시안 RI_TIERS) — cls 는 ri-tier--N rail 색상 매핑
const RI_TIERS = [
  {
    cls: "3", grade: "3급", name: "준심판 · 입문", feat: false,
    pay: "20,000", payK: "픽업·연습경기 단위",
    req: ["만 18세 이상 누구나 지원", "온라인 규정 교육 이수", "실기 테스트 1회 통과"],
  },
  {
    cls: "2", grade: "2급", name: "정심판 · 대회 예선", feat: true,
    pay: "40,000", payK: "대회 예선 경기 단위",
    req: ["3급 자격 + 배정 20경기 이상", "오프라인 보수 교육 이수", "매너 평가 평균 4.5 이상"],
  },
  {
    cls: "1", grade: "1급", name: "주심 · 대회 본선", feat: false,
    pay: "70,000", payK: "대회 본선·결승 단위",
    req: ["2급 자격 + 배정 80경기 이상", "협회 추천 또는 심사 통과", "결승·준결승 운영 경력"],
  },
];

// 지원 절차 4스텝 (시안 RI_STEPS)
const RI_STEPS = [
  { t: "심판 지원", d: "심판 전용 가입 후 기본 정보와 활동 지역을 등록합니다." },
  { t: "서류·자격 검증", d: "신분 확인과 보유 자격증(있을 경우)을 검증합니다." },
  { t: "교육·테스트", d: "규정 교육을 이수하고 실기 테스트를 통과합니다." },
  { t: "배정 시작", d: "등급이 부여되면 경기 배정을 받아 활동을 시작합니다." },
];

// 정산 안내 표 (시안 RI_PAY)
const RI_PAY = [
  { name: "픽업·게스트 경기", sub: "5v5 풀코트 / 3v3", dur: "약 60분", amt: "20,000원" },
  { name: "연습경기", sub: "팀 간 비공식", dur: "약 60분", amt: "20,000원" },
  { name: "대회 예선", sub: "풀리그·조별", dur: "약 40분", amt: "40,000원" },
  { name: "대회 본선", sub: "토너먼트 16강~4강", dur: "약 40분", amt: "55,000원" },
  { name: "대회 결승·준결승", sub: "주심 기준", dur: "약 40분", amt: "70,000원" },
];

// FAQ 5문항 (시안 RI_FAQ) — 아코디언 토글
const RI_FAQ = [
  { q: "자격증이 없어도 지원할 수 있나요?", a: "네. 만 18세 이상이면 누구나 3급(준심판)으로 지원할 수 있습니다. 온라인 규정 교육과 실기 테스트만 통과하면 입문 등급으로 활동을 시작할 수 있으며, 기존 농구 심판 자격증 보유자는 검증을 거쳐 상위 등급으로 시작할 수 있습니다." },
  { q: "활동 지역과 일정은 어떻게 정하나요?", a: "심판 플랫폼에서 활동 가능 지역과 요일·시간대를 직접 설정합니다. 설정한 조건에 맞는 경기만 배정 알림으로 받게 되며, 각 배정은 수락/거절을 선택할 수 있어 본업과 병행이 가능합니다." },
  { q: "정산은 언제, 어떻게 받나요?", a: "경기 종료 후 결과가 확정되면 정산 대기로 잡히고, 평균 48시간 이내에 등록한 계좌로 지급됩니다. 정산 내역은 심판 플랫폼의 정산 탭에서 경기별로 확인할 수 있습니다." },
  { q: "등급은 어떻게 올라가나요?", a: "하위 등급에서 일정 경기 수를 배정·운영하고 매너 평가 기준을 충족하면 보수 교육을 거쳐 상위 등급으로 승급합니다. 1급(주심)은 협회 추천 또는 별도 심사를 통과해야 합니다." },
  { q: "경기 중 분쟁이 생기면 어떻게 하나요?", a: "심판의 콜이 우선하며, 이의가 있는 경우 경기 종료 후 운영팀에 이의 제기 절차를 통해 검토를 요청할 수 있습니다. 심판은 중립 의무를 가지며, 반복적 분쟁·불공정 판정은 매너 평가와 등급에 반영됩니다." },
];

export function RefereeInfoContent() {
  // FAQ 아코디언 상태 — 시안과 동일하게 0번 항목 기본 펼침
  const [open, setOpen] = useState(0);

  return (
    <div className="page">
      <div className="page__inner ri-wrap">
        {/* Hero — 시안 setRoute 흐름 CTA 를 운영 라우트로 매핑 */}
        <header className="ri-hero">
          <div className="eyebrow">심판 · REFEREE</div>
          <h1 className="ri-hero__title">
            BDR 공인 심판으로<br />
            <span className="accent">전국 코트</span>에서 활동하세요
          </h1>
          <p className="ri-hero__lead">
            전국 농구 매칭 플랫폼 MyBDR의 픽업 경기부터 대회 본선까지,
            공정한 경기를 책임지는 공인 심판을 모집합니다. 자격증이 없어도 입문 등급으로 시작할 수 있습니다.
          </p>
          <div className="ri-hero__cta">
            {/* 시안 href="#"(심판 지원) → 운영 심판 영역 /referee */}
            <Link className="btn btn--primary btn--xl" href="/referee">
              <span className="ico material-symbols-outlined">how_to_reg</span>심판 지원하기
            </Link>
            <Link className="btn btn--accent btn--xl" href="/referee">
              <span className="ico material-symbols-outlined">login</span>심판 로그인
            </Link>
          </div>
        </header>

        {/* 통계 */}
        <div className="ri-stats">
          {RI_STATS.map((s, i) => (
            <div key={i} className="ri-stat">
              <div className="ri-stat__v">{s.v}</div>
              <div className="ri-stat__k">{s.k}</div>
            </div>
          ))}
        </div>

        {/* 하는 일 */}
        <section className="ri-section">
          <h2 className="ri-section__h">심판이 하는 일</h2>
          <p className="ri-section__sub">배정 수락부터 결과 확정까지, 한 경기의 운영 전 과정을 책임집니다.</p>
          <div className="ri-roles">
            {RI_ROLES.map((r, i) => (
              <div key={i} className="ri-role">
                <div className="ri-role__ico"><span className="ico material-symbols-outlined">{r.ico}</span></div>
                <div className="ri-role__t">{r.t}</div>
                <div className="ri-role__d">{r.d}</div>
              </div>
            ))}
          </div>
        </section>

        {/* 자격 등급 */}
        <section className="ri-section">
          <h2 className="ri-section__h">자격 등급</h2>
          <p className="ri-section__sub">3급(입문)부터 1급(주심)까지 3단계. 활동 실적과 매너 평가에 따라 승급합니다.</p>
          <div className="ri-tiers">
            {RI_TIERS.map((t, i) => (
              <div key={i} className={"ri-tier ri-tier--" + t.cls + (t.feat ? " ri-tier--feat" : "")}>
                <div className="ri-tier__rail" />
                <div className="ri-tier__top">
                  <span className="ri-tier__grade">{t.grade}</span>
                  {t.feat && <span className="ri-tier__feat-badge">인기 시작점</span>}
                </div>
                <div className="ri-tier__name">{t.name}</div>
                <div className="ri-tier__pay">
                  <div className="ri-tier__pay-v">{t.pay}<small>원~</small></div>
                  <div className="ri-tier__pay-k">{t.payK}</div>
                </div>
                <ul className="ri-tier__req">
                  {t.req.map((q, j) => (
                    <li key={j}><span className="ico material-symbols-outlined">check_circle</span>{q}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* 지원 절차 */}
        <section className="ri-section">
          <h2 className="ri-section__h">지원 절차</h2>
          <p className="ri-section__sub">지원부터 첫 배정까지 보통 1~2주가 소요됩니다.</p>
          <div className="ri-steps">
            {RI_STEPS.map((s, i) => (
              <div key={i} className="ri-step">
                <div className="ri-step__num">{i + 1}</div>
                <div className="ri-step__t">{s.t}</div>
                <div className="ri-step__d">{s.d}</div>
              </div>
            ))}
          </div>
        </section>

        {/* 정산 안내 */}
        <section className="ri-section">
          <h2 className="ri-section__h">정산 안내</h2>
          <p className="ri-section__sub">경기 유형별 기준 단가입니다. 지역·등급·심판 인원에 따라 달라질 수 있습니다.</p>
          <div className="ri-pay-card">
            <div className="ri-pay-row ri-pay-row--head">
              <span>경기 유형</span><span>소요 시간</span><span style={{ textAlign: "right" }}>심판 단가</span>
            </div>
            {RI_PAY.map((p, i) => (
              <div key={i} className="ri-pay-row">
                <div className="ri-pay-row__name">{p.name}<small>{p.sub}</small></div>
                <div className="ri-pay-row__dur">{p.dur}</div>
                <div className="ri-pay-row__amt">{p.amt}</div>
              </div>
            ))}
          </div>
          <div className="ri-pay-note">
            <span className="ico material-symbols-outlined">info</span>
            <span>정산은 경기 결과 확정 후 평균 48시간 이내에 등록 계좌로 지급되며, 내역은 심판 플랫폼 정산 탭에서 경기별로 확인할 수 있습니다.</span>
          </div>
        </section>

        {/* FAQ — 아코디언 토글 */}
        <section className="ri-section">
          <h2 className="ri-section__h">자주 묻는 질문</h2>
          <p className="ri-section__sub">더 궁금한 점은 도움말 또는 1:1 문의로 확인하세요.</p>
          <div className="card ri-faq">
            {RI_FAQ.map((f, i) => (
              <div key={i} className={"ri-faq__item" + (open === i ? " is-open" : "")}>
                <button className="ri-faq__q" onClick={() => setOpen(open === i ? -1 : i)}>
                  <span className="ri-faq__qnum">Q{i + 1}.</span>
                  <span className="ri-faq__qtext">{f.q}</span>
                  <span className="ri-faq__chev material-symbols-outlined">expand_more</span>
                </button>
                {open === i && <div className="ri-faq__a">{f.a}</div>}
              </div>
            ))}
          </div>
        </section>

        {/* CTA 푸터 — 시안 iu3-help.html → 운영 /help */}
        <div className="ri-cta">
          <h3 className="ri-cta__h">지금 심판으로 시작하세요</h3>
          <p className="ri-cta__d">자격증이 없어도 입문 등급으로 활동을 시작할 수 있습니다. 첫 배정까지 1~2주.</p>
          <div className="ri-cta__btns">
            <Link className="btn btn--primary btn--xl" href="/referee">
              <span className="ico material-symbols-outlined">how_to_reg</span>심판 지원하기
            </Link>
            <Link className="btn btn--ghost" href="/help">
              <span className="ico material-symbols-outlined">help</span>도움말 보기
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

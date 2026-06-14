/* ============================================================
 * /safety — 안전 가이드 (Safety) v2.31 시안 박제 — SF1
 *
 * 이유(왜):
 *   기존 "안전·차단 센터"(차단목록/신고내역/금칙어/프라이버시 4탭)는
 *   전량 더미였고(DB user_blocks/reports/muted_words/privacy 모델 0),
 *   시안 v2.31 은 이를 순수 "안전 가이드"(경기 전후 점검·부상 대응·매너·
 *   안전한 만남·날씨·검증코트 6카드 + 신고/긴급 2카드)로 재정의함.
 *   → 더미 4탭 전량 삭제 = 기능 손실 0(애초에 동작 0인 더미였음).
 *
 * 구조 결정:
 *   시안은 정적(인터랙션 0) → "use client" 제거하고 server component 로
 *   단순화. breadcrumb 은 Next.js Link 만 필요해 server 에서 처리 가능.
 *
 * 시안 출처: Dev/design/BDR-current/screens/Safety.jsx (+ extras-pages.css .sf-*)
 *
 * 원칙: API/Prisma/서비스 0 변경 / 데이터 0(정적 안내) / mock 0 /
 *       토큰 var(--*) 만 / 라우트 /safety 불변.
 * AppNav active: pathname 자동 판정(/safety → more)
 * ============================================================ */

import Link from "next/link";

// 안전 가이드 6카드 — 정적 안내 (시안 guides)
const GUIDES: { ico: string; t: string; d: string; list: string[] }[] = [
  {
    ico: "health_and_safety", t: "경기 전 점검", d: "준비운동과 코트 상태를 확인하세요.",
    list: ["10분 이상 충분한 스트레칭", "바닥 미끄럼·파손 여부 확인", "골대 고정 상태 점검"],
  },
  {
    ico: "medical_services", t: "부상 대응", d: "부상 시 즉시 경기를 멈추고 조치하세요.",
    list: ["무리한 경기 속행 금지", "RICE(휴식·냉찜질·압박·거상) 응급처치", "응급실 위치 사전 확인"],
  },
  {
    ico: "groups", t: "매너와 존중", d: "모두가 안전하게 즐길 수 있는 문화를 지켜요.",
    list: ["과격한 몸싸움·위험 플레이 자제", "심판·상대 판정 존중", "경기 후 매너 평가 참여"],
  },
  {
    ico: "shield_person", t: "안전한 만남", d: "낯선 멤버와의 첫 만남은 신중하게.",
    list: ["공개된 코트에서 첫 경기 진행", "개인정보 과도 공유 주의", "이상 행동 발견 시 즉시 신고"],
  },
  {
    ico: "thermostat", t: "날씨·환경", d: "실외 경기는 환경을 먼저 살피세요.",
    list: ["폭염·한파 시 경기 자제", "수분 충분히 섭취", "미세먼지 나쁨 시 실내 권장"],
  },
  {
    ico: "verified_user", t: "검증된 코트", d: "인증 코트에서 더 안전하게 활동하세요.",
    list: ["BDR 인증 배지 코트 우선", "리뷰·평점 사전 확인", "예약제 코트로 혼잡 방지"],
  },
];

export default function SafetyPage() {
  // 공개 정적 페이지 — getWebSession 가드 미사용. 인터랙션 0.
  return (
    <div className="page">
      <div className="page__inner ex-page-w">
        {/* 브레드크럼 — 시안 setRoute 추상화를 Next.js Link 로 대체 */}
        <div className="ex-crumb">
          <Link href="/">홈</Link>
          <span className="sep">›</span>
          <span className="cur">안전 가이드</span>
        </div>

        {/* Hero — cafe-blue → bdr-navy 그라디언트 */}
        <div className="sf-hero">
          <div className="sf-hero__eyebrow">SAFETY · 안전 가이드</div>
          <h1 className="sf-hero__title">모두가 안전하게 농구하는 법</h1>
          <p className="sf-hero__lead">
            전국 농구 매칭 플랫폼 MyBDR은 모든 멤버의 안전을 최우선으로 합니다.
            경기 전후 점검부터 부상 대응, 안전한 만남까지 — 꼭 기억해 주세요.
          </p>
        </div>

        {/* 안전 가이드 6카드 */}
        <div className="sf-grid" style={{ marginBottom: 30 }}>
          {GUIDES.map((g, i) => (
            <div key={i} className="sf-card">
              <div className="sf-card__ico"><span className="ico material-symbols-outlined">{g.ico}</span></div>
              <div className="sf-card__t">{g.t}</div>
              <div className="sf-card__d">{g.d}</div>
              <ul className="sf-list">
                {g.list.map((x, j) => (
                  <li key={j}><span className="ico material-symbols-outlined">check_circle</span>{x}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* 문제가 생겼을 때 — 신고/긴급 2카드. 신고·긴급 진입은 도움말 센터 링크 유지 */}
        <h2 className="ex-sec__h">문제가 생겼을 때</h2>
        <div className="sf-report">
          <Link href="/help" className="sf-report__card" style={{ textDecoration: "none", color: "inherit" }}>
            <div className="sf-report__ico sf-report__ico--red"><span className="ico material-symbols-outlined">report</span></div>
            <div>
              <div className="sf-report__t">신고하기</div>
              <div className="sf-report__d">위험·비매너·사기 행위를 발견하면 즉시 운영팀에 신고하세요. 24시간 내 검토합니다.</div>
            </div>
          </Link>
          <Link href="/help" className="sf-report__card" style={{ textDecoration: "none", color: "inherit" }}>
            <div className="sf-report__ico sf-report__ico--navy"><span className="ico material-symbols-outlined">support_agent</span></div>
            <div>
              <div className="sf-report__t">긴급 문의</div>
              <div className="sf-report__d">안전 관련 긴급 상황은 1:1 문의 또는 도움말 센터로 연락 주세요.</div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}

/* global React */

/**
 * RefereeInfo — /referee-info (옵션 B SEO 안내 페이지)
 *
 * Why: 사이트 /referee 는 심판 플랫폼 (E등급 자체 셸) 으로 점유됨.
 *      더보기 5그룹 "둘러보기" 의 referee 는 가짜링크 → 별도 안내 페이지로 분리.
 * Pattern: 정적 SEO 카드 (단일 컬럼, 카드 3 + CTA)
 *
 * 진입: 더보기 drawer "둘러보기 → 심판 센터 안내"
 * 복귀: AppNav back / 햄버거
 * 에러: 정적 페이지 — 권한/데이터 없음
 *
 * 참조: uploads/01-user-design-decisions.md §2-2 (refereeInfo 옵션 B)
 */
function RefereeInfo({ setRoute }) {
  return (
    <div className="page">
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        {/* 히어로 */}
        <div style={{ textAlign: 'center', padding: '40px 0 32px' }}>
          <div className="eyebrow" style={{ justifyContent: 'center' }}>심판 센터 · REFEREE</div>
          <h1 style={{ margin: '10px 0 14px', fontSize: 36, fontWeight: 900, letterSpacing: '-0.025em' }}>
            BDR 공식 심판 센터
          </h1>
          <p style={{ fontSize: 15, color: 'var(--ink-soft)', maxWidth: 540, margin: '0 auto', lineHeight: 1.7 }}>
            BDR 공식 대회의 모든 경기는 인증된 심판이 운영합니다.
            심판 등록·교육·배정 시스템에 대해 안내드립니다.
          </p>
        </div>

        {/* 카드 3종 — 등록·교육·배정 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 32 }}>
          {[
          { kicker: '01 · 등록', title: '심판 자격 신청', body: '농구 경력·심판 경험을 토대로 신청하세요. 운영팀 심사 후 승인됩니다.' },
          { kicker: '02 · 교육', title: '룰북 + 정기 워크숍', body: '공식 룰북 학습 + 분기별 워크숍으로 판정 일관성 유지.' },
          { kicker: '03 · 배정', title: '대회별 자동 배정', body: '대회 일정·경력·평점 기반 자동 배정. 출석·페이도 시스템 관리.' }].
          map((c) =>
          <div key={c.kicker} className="card" style={{ padding: '20px 22px', borderLeft: '3px solid var(--accent)' }}>
              <div style={{ fontSize: 11, color: 'var(--ink-mute)', fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: 8 }}>{c.kicker}</div>
              <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>{c.title}</div>
              <div style={{ fontSize: 13, color: 'var(--ink-mute)', lineHeight: 1.6 }}>{c.body}</div>
            </div>
          )}
        </div>

        {/* CTA — 본 시안에서는 외부 안내 링크만 (실 신청은 사이트 /referee 영역) */}
        <div className="card" style={{ padding: '20px 22px', textAlign: 'center', marginBottom: 24 }}>
          <h2 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 700 }}>심판 신청을 원하시나요?</h2>
          <p style={{ fontSize: 13, color: 'var(--ink-mute)', margin: '0 0 14px' }}>
            BDR 운영팀이 심사 후 승인합니다. 평균 3–5일 소요.
          </p>
          <button className="btn btn--primary" onClick={() => setRoute('help')}>
            운영팀 문의 →
          </button>
        </div>
      </div>
    </div>);

}

Object.assign(window, { RefereeInfo });

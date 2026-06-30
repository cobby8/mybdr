/* global React, TOURNAMENTS */

// ============================================================
// TournamentDetail — [대체됨] 공개 대회 페이지로 연결되는 브리지
//
// 통합 결정: 공개 사이트 대회 페이지(단체 사이트)가 canonical.
// 앱 내부의 옛 대회상세 디자인(히어로 6탭·대시보드·운영자전환·우승예측)은 폐기.
// 앱에서 대회 진입 시 이 브리지가 공개 대회 페이지로 연결한다.
//   → Dev/design/BDR v2.41-admin-toss/토너먼트 사이트.html?org=<slug>
// 기록실·라이브·요강 등 살릴 기능은 모두 공개 사이트로 이전 완료.
// ============================================================

const { useEffect: useEffectTD } = React;

// 앱 루트(MyBDR.html) 기준 공개 사이트 경로
const PUBLIC_SITE_URL = 'Dev/design/BDR v2.41-admin-toss/토너먼트 사이트.html';

function tdPublicHref() {
  const t = (typeof TOURNAMENTS !== 'undefined' && TOURNAMENTS[0]) || {};
  const org = t.org_slug || t.orgSlug || 'bdr-basketball';
  const ev = t.slug || t.id || '';
  const q = new URLSearchParams({ org });
  if (ev) q.set('event', ev);
  return `${PUBLIC_SITE_URL}?${q.toString()}`;
}

function TDIco({ n, size = 18, style }) {
  return <span className="material-symbols-outlined" style={{ fontSize: size, lineHeight: 1, verticalAlign: '-3px', ...style }}>{n}</span>;
}

function TournamentDetail({ setRoute }) {
  const href = tdPublicHref();

  // 자동 연결: 잠시 안내 후 공개 대회 페이지로 이동
  useEffectTD(() => {
    const id = setTimeout(() => { window.location.href = href; }, 1100);
    return () => clearTimeout(id);
  }, [href]);

  return (
    <div className="page" style={{ maxWidth: 640 }}>
      <div className="card" style={{ padding: '44px 36px', textAlign: 'center' }}>
        <div style={{ width: 60, height: 60, borderRadius: 16, background: 'var(--cafe-blue)', color: '#fff', display: 'grid', placeItems: 'center', margin: '0 auto 18px' }}>
          <TDIco n="captive_portal" size={32} />
        </div>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, letterSpacing: '-0.01em' }}>대회 공개 페이지로 이동합니다</h1>
        <p style={{ margin: '10px auto 0', maxWidth: 440, fontSize: 14, color: 'var(--ink-soft)', lineHeight: 1.7 }}>
          대회 소개·일정·대진·참가팀·기록실·참가신청은 이제 <b>단체 공개 사이트</b>에서 한 곳에 제공됩니다.
          잠시 후 자동으로 이동합니다.
        </p>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap', marginTop: 22 }}>
          <a href={href} className="btn btn--primary" style={{ minHeight: 46, minWidth: 200, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, textDecoration: 'none' }}>
            <TDIco n="arrow_forward" size={18} />지금 대회 페이지 열기
          </a>
          <button className="btn btn--sm" style={{ minHeight: 46 }} onClick={() => setRoute('match')}>대회 목록으로</button>
        </div>

        <div style={{ marginTop: 24, paddingTop: 18, borderTop: '1px solid var(--border)', display: 'flex', flexWrap: 'wrap', gap: '6px 14px', justifyContent: 'center', fontSize: 12, color: 'var(--ink-mute)' }}>
          {['홈', '일정', '대진·결과', '참가팀', '기록실', '참가신청', '요강'].map(l => (
            <span key={l} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><TDIco n="check_circle" size={14} style={{ color: 'var(--ok)' }} />{l}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

window.TournamentDetail = TournamentDetail;

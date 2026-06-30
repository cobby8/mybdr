/* global React, ORGS */
// ============================================================
// OrgDetail.jsx — [대체됨] 공개 단체 사이트로 연결되는 브리지
//
// 통합 결정: 단체 상세는 canonical "단체 공개 사이트"(SiteApp)와 중복.
//   → Dev/design/BDR v2.41-admin-toss/토너먼트 사이트.html?org=<slug>&page=org-intro
// 단체소개·조직구성·공지·게시판·대회 아카이브는 모두 공개 단체 사이트가 제공.
// (앱의 TournamentDetail 브리지와 동일 패턴)
// ============================================================

const ORG_SITE_URL = 'Dev/design/BDR v2.41-admin-toss/토너먼트 사이트.html';

function orgSiteHref(org) {
  const slug = (org && org.slug) || 'bdr-basketball';
  return encodeURI(ORG_SITE_URL) + '?' + new URLSearchParams({ org: slug, page: 'org-intro' }).toString();
}

function ODIco({ n, size = 18, style }) {
  return <span className="material-symbols-outlined" style={{ fontSize: size, lineHeight: 1, verticalAlign: '-3px', ...style }}>{n}</span>;
}

function OrgDetail({ setRoute }) {
  const org = ORGS.find(x => x.id === window.__orgSel) || ORGS[0];
  const href = orgSiteHref(org);

  // 자동 연결: 잠시 안내 후 공개 단체 사이트로 이동
  React.useEffect(() => {
    const id = setTimeout(() => { window.location.href = href; }, 1100);
    return () => clearTimeout(id);
  }, [href]);

  return (
    <div className="page" style={{ maxWidth: 640 }}>
      <div className="card" style={{ padding: '44px 36px', textAlign: 'center' }}>
        <div style={{ width: 60, height: 60, borderRadius: 16, background: 'var(--cafe-blue)', color: '#fff', display: 'grid', placeItems: 'center', margin: '0 auto 18px' }}>
          <ODIco n="captive_portal" size={32} />
        </div>
        <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '.06em', color: 'var(--ink-dim)', textTransform: 'uppercase' }}>{org.name}</div>
        <h1 style={{ margin: '6px 0 0', fontSize: 22, fontWeight: 800, letterSpacing: '-0.01em' }}>단체 공개 사이트로 이동합니다</h1>
        <p style={{ margin: '10px auto 0', maxWidth: 440, fontSize: 14, color: 'var(--ink-soft)', lineHeight: 1.7 }}>
          단체 소개·조직 구성·공지·게시판·대회 아카이브는 이제 <b>공개 단체 사이트</b>에서 한 곳에 제공됩니다.
          잠시 후 자동으로 이동합니다.
        </p>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap', marginTop: 22 }}>
          <a href={href} className="btn btn--primary" style={{ minHeight: 46, minWidth: 200, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, textDecoration: 'none' }}>
            <ODIco n="arrow_forward" size={18} />지금 단체 사이트 열기
          </a>
          <button className="btn btn--sm" style={{ minHeight: 46 }} onClick={() => setRoute('orgs')}>단체 목록으로</button>
        </div>

        <div style={{ marginTop: 24, paddingTop: 18, borderTop: '1px solid var(--border)', display: 'flex', flexWrap: 'wrap', gap: '6px 14px', justifyContent: 'center', fontSize: 12, color: 'var(--ink-mute)' }}>
          {['단체소개', '조직구성', '공지사항', '자유게시판', '대회'].map(l => (
            <span key={l} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><ODIco n="check_circle" size={14} style={{ color: 'var(--ok)' }} />{l}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

window.OrgDetail = OrgDetail;

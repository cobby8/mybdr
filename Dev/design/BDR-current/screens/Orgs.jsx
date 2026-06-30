/* global React, ORGS, Icon, Avatar */
// ============================================================
// Orgs.jsx — 공개 단체 목록 (BDR v2)
//   실 DB 컬럼만: name·slug·region·description·logo_url·banner_url·series_count·memberCount·verify
//   §2-2 금지(팀 수·설립연도·스폰서) 미표시 · 가입신청 미노출 · auto-fit 그리드 · 폴백(로고/배너 없음) 함께
// ============================================================

// 공용: 인증 배지 (§4-5 deferred 컨셉 — 미인증도 중립 톤)
function OrgVerifyBadge({ verify, onLight }) {
  const v = window.ORG_VERIFY[verify] || window.ORG_VERIFY.basic;
  const toneCls = v.tone === 'ok' ? 'badge--ok' : v.tone === 'warn' ? 'badge--warn' : '';
  const lightStyle = onLight
    ? { background: 'rgba(255,255,255,.18)', color: '#fff', borderColor: 'rgba(255,255,255,.32)' }
    : (v.tone === 'mute' ? { background: 'var(--bg-head)', color: 'var(--ink-mute)' } : {});
  return <span className={'badge ' + toneCls} style={lightStyle} title={v.desc}>{v.icon} {v.label}</span>;
}
window.OrgVerifyBadge = OrgVerifyBadge;

// 공용: 단체 로고 마크 (logo_url 있으면 브랜드 타일 / 없으면 이니셜 폴백)
function OrgLogo({ org, size = 46, radius = 10, onLight }) {
  const c = window.orgColor(org.id);
  const init = (org.name || '?').slice(0, 2);
  if (org.logo_url) {
    return (
      <div style={{
        width: size, height: size, borderRadius: radius, flex: '0 0 auto',
        background: `linear-gradient(140deg, ${c.base}, ${c.deep})`, color: '#fff',
        display: 'grid', placeItems: 'center', fontFamily: 'var(--ff-display)', fontWeight: 900,
        fontSize: size * 0.4, letterSpacing: '-0.02em',
        boxShadow: onLight ? '0 2px 8px rgba(0,0,0,.18)' : 'var(--sh-xs)',
        border: onLight ? '2px solid rgba(255,255,255,.6)' : '1px solid var(--border)',
      }} title={org.name}>{init}</div>
    );
  }
  // 폴백 — 로고 미등록 (중립 이니셜 박스)
  return (
    <div style={{
      width: size, height: size, borderRadius: radius, flex: '0 0 auto',
      background: onLight ? 'rgba(255,255,255,.16)' : 'var(--bg-head)',
      color: onLight ? '#fff' : 'var(--ink-mute)',
      display: 'grid', placeItems: 'center', fontFamily: 'var(--ff-mono)', fontWeight: 700, fontSize: size * 0.3,
      border: onLight ? '2px dashed rgba(255,255,255,.4)' : '1px dashed var(--border-strong)',
    }} title={org.name + ' (로고 미등록)'}>{init}</div>
  );
}
window.OrgLogo = OrgLogo;

function OrgsList({ setRoute }) {
  const regions = ['전체', ...Array.from(new Set(ORGS.map(o => o.region)))];
  const [region, setRegion] = React.useState('전체');
  const shown = ORGS.filter(o => region === '전체' ? true : o.region === region);

  return (
    <div className="page">
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 16, gap: 16, flexWrap: 'wrap' }}>
        <div>
          <div className="eyebrow">단체 · ORGANIZATIONS</div>
          <h1 className="t-display" style={{ margin: '6px 0 4px', fontSize: 30, fontWeight: 900, letterSpacing: '-0.02em' }}>리그 · 협회 · 동호회</h1>
          <div style={{ fontSize: 13, color: 'var(--ink-mute)' }}>여러 팀을 아우르는 {ORGS.length}개의 농구 단체</div>
        </div>
        <button className="btn btn--primary"><Icon.plus /> 단체 등록</button>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap' }}>
        {regions.map(k => (
          <button key={k} className="btn btn--sm" onClick={() => setRegion(k)}
            style={region === k ? { background: 'var(--cafe-blue)', color: '#fff', borderColor: 'var(--cafe-blue-deep)' } : {}}>
            {k}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
        {shown.map(o => {
          const c = window.orgColor(o.id);
          return (
            <div key={o.id} className="card" style={{ padding: 0, overflow: 'hidden', cursor: 'pointer', display: 'flex', flexDirection: 'column', minWidth: 0 }} onClick={() => { window.__orgSel = o.id; setRoute('orgDetail'); }}>
              {/* 배너: banner_url 있으면 브랜드 그라디언트 / 없으면 해시 그라디언트 폴백 */}
              <div style={{
                position: 'relative', minHeight: o.banner_url ? 84 : 72, padding: '16px 18px',
                background: o.banner_url
                  ? `radial-gradient(120% 140% at 85% -20%, color-mix(in srgb, ${c.base} 55%, #fff) 0%, ${c.base} 38%, ${c.deep} 100%)`
                  : `linear-gradient(135deg, ${c.base}, ${c.deep})`,
                color: '#fff', display: 'flex', alignItems: 'flex-start', gap: 12,
              }}>
                <OrgLogo org={o} size={48} radius={10} onLight />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: 'var(--ff-display)', fontWeight: 900, fontSize: 19, letterSpacing: '-0.01em', lineHeight: 1.15, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{o.name}</div>
                  <div style={{ fontSize: 11.5, opacity: .9, marginTop: 3, fontWeight: 600 }}>📍 {o.region} · since {o.createdYear}</div>
                </div>
                <div style={{ flex: '0 0 auto' }}><OrgVerifyBadge verify={o.verify} onLight /></div>
              </div>

              <div style={{ padding: '14px 18px', flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                <div style={{
                  fontSize: 13, color: 'var(--ink-soft)', lineHeight: 1.55, minWidth: 0,
                  display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', minHeight: 40,
                }}>{o.description}</div>
                <div style={{ display: 'flex', gap: 18, marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                  <div>
                    <div style={{ fontSize: 10, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--ink-dim)', fontWeight: 700 }}>시리즈</div>
                    <div style={{ fontFamily: 'var(--ff-display)', fontSize: 18, fontWeight: 900, marginTop: 2, letterSpacing: '-0.01em' }}>{o.series_count}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--ink-dim)', fontWeight: 700 }}>회원</div>
                    <div style={{ fontFamily: 'var(--ff-display)', fontSize: 18, fontWeight: 900, marginTop: 2, letterSpacing: '-0.01em' }}>{o.memberCount}</div>
                  </div>
                  <div style={{ marginLeft: 'auto', alignSelf: 'flex-end' }}>
                    <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--cafe-blue-deep)' }}>상세 →</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

window.OrgsList = OrgsList;

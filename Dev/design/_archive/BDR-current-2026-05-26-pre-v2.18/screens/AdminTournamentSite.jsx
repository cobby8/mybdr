/* global React, AdminShell */

// =====================================================================
// AdminTournamentSite.jsx — Admin-E · 사이트 설정 (v2.15 신규)
//   진입: setRoute('adminTournamentSite')
//   복귀: setRoute('adminTournamentSetupHub')
//
// 패턴: 2열 — 좌 폼 (4 섹션) / 우 sticky 미리보기 카드 (실시간 반영 mock)
//   섹션: 1 사이트 주소(subdomain) / 2 SEO 메타 / 3 디자인 (테마/컬러/로고) / 4 푸터
// 운영 source: src/app/(admin)/tournament-admin/tournaments/[id]/site/page.tsx
//   주의: E-11 EditWizard 의 "사이트 영역 제거" (UI-4) 결정으로 → site 는 별도 페이지로 분리됨.
// =====================================================================

const TSITE_TOURNAMENT = { tournament_id: 'tn_2026_summer_4', name: 'BDR 서머 오픈 #4' };

const TSITE_PRESETS = [
{ key: 'accent', label: 'BDR Red', color: '#E31B23' },
{ key: 'navy', label: 'BDR Navy', color: '#1B3C87' },
{ key: 'ok', label: '그린', color: '#16a34a' },
{ key: 'cobalt', label: '코발트', color: '#2a6fdb' }];


const TSITE_HEROS = [
{ key: 'photo', label: '대회장 사진', desc: '실제 코트 / 행사장 사진' },
{ key: 'gradient', label: '그라데이션', desc: '브랜드 컬러 그라데이션' },
{ key: 'pattern', label: '농구 패턴', desc: '농구공 / 코트라인 SVG' }];


function AdminTournamentSite({ setRoute, theme, setTheme }) {
  const [adminRole, setAdminRole] = React.useState('tournament_admin');
  const [isPublished, setIsPublished] = React.useState(false);
  const [dirty, setDirty] = React.useState(false);
  const [toast, setToast] = React.useState(null);

  // form state
  const [subdomain, setSubdomain] = React.useState('summer-open-4');
  const [siteTitle, setSiteTitle] = React.useState('BDR 서머 오픈 #4');
  const [tagline, setTagline] = React.useState('전국 농구 동호인 여름 오픈전 — 6월 15-22일 잠실');
  const [ogDesc, setOgDesc] = React.useState('서머 시즌 가장 뜨거운 오픈 토너먼트. 44팀 · 4종별 · 6일간.');
  const [colorKey, setColorKey] = React.useState('accent');
  const [heroKey, setHeroKey] = React.useState('photo');
  const [footerCopy, setFooterCopy] = React.useState('문의: oh@mybdr.kr · 010-2345-6789');

  const update = (setter) => (e) => { setter(e.target ? e.target.value : e); setDirty(true); };

  const currentColor = TSITE_PRESETS.find((p) => p.key === colorKey)?.color || '#E31B23';

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2400);
  };

  const handleSave = () => {
    showToast('사이트 설정이 저장되었습니다');
    setDirty(false);
  };

  const dashTopbarRight =
  <button className="admin-user" type="button">
      <div className="admin-user__avatar">OY</div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: 1.2 }}>
        <span style={{ fontWeight: 600, fontSize: 13 }}>오영진</span>
        <span className="admin-user__role">tournament admin</span>
      </div>
      <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'var(--ink-mute)' }}>expand_more</span>
    </button>;


  return (
    <AdminShell route="adminTournamentSite" setRoute={setRoute}
      eyebrow="ADMIN · 대회 운영" title="사이트 설정"
      subtitle={`${TSITE_TOURNAMENT.name} · ${isPublished ? '공개 사이트' : '비공개 (운영자 미리보기만)'}`}
      adminRole={adminRole} setAdminRole={setAdminRole} theme={theme} setTheme={setTheme}
      topbarRight={dashTopbarRight}
      breadcrumbs={[
      { label: 'ADMIN', onClick: () => setRoute('adminDashboard') },
      { label: '대회 운영자 도구', onClick: () => setRoute('adminTournamentAdminHome') },
      { label: TSITE_TOURNAMENT.name, onClick: () => setRoute('adminTournamentSetupHub') },
      { label: '사이트 설정' }]
      }
      actions={
      <>
          <a href={`https://${subdomain}.mybdr.kr`} target="_blank" rel="noopener" className="btn">
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>open_in_new</span>
            새 창으로 미리보기
          </a>
          <button type="button" className={`btn ${dirty ? 'btn--primary' : ''}`} disabled={!dirty} onClick={handleSave}>
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>{dirty ? 'save' : 'check'}</span>
            {dirty ? '저장하기' : '저장됨'}
          </button>
        </>
      }>

      {toast &&
      <div style={{ position: 'fixed', top: 80, right: 24, zIndex: 100, background: 'var(--ok)', color: '#fff', padding: '12px 16px', borderRadius: 4, display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>check_circle</span>
          <span style={{ fontSize: 13, fontWeight: 600 }}>{toast}</span>
        </div>
      }

      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 12, alignItems: 'flex-start' }}>
        {/* 좌 — 폼 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {/* 1. 사이트 주소 */}
          <FormSection num="1" title="사이트 주소" desc="대회 공개 사이트 서브도메인을 설정합니다.">
            <label style={lblS}>서브도메인</label>
            <div style={{ display: 'flex', alignItems: 'stretch', border: '1px solid var(--border)', borderRadius: 4, overflow: 'hidden' }}>
              <input value={subdomain} onChange={update(setSubdomain)}
                style={{ ...inpS, border: 0, borderRadius: 0, flex: 1 }} />
              <div style={{ display: 'flex', alignItems: 'center', padding: '0 12px', background: 'var(--bg-alt)', fontFamily: 'var(--ff-mono)', fontSize: 12, color: 'var(--ink-mute)' }}>
                .mybdr.kr
              </div>
            </div>
            <p style={hintS}>영문 소문자·숫자·하이픈만 허용. 중복 검사 자동 실행.</p>
          </FormSection>

          {/* 2. SEO 메타 */}
          <FormSection num="2" title="SEO 메타데이터" desc="검색엔진·SNS 공유 시 노출될 정보입니다.">
            <label style={lblS}>사이트 제목</label>
            <input value={siteTitle} onChange={update(setSiteTitle)} style={inpS} />
            <label style={{ ...lblS, marginTop: 10 }}>한 줄 소개 (태그라인)</label>
            <input value={tagline} onChange={update(setTagline)} style={inpS} />
            <label style={{ ...lblS, marginTop: 10 }}>OG 설명 (SNS 공유)</label>
            <textarea value={ogDesc} onChange={update(setOgDesc)} rows={2} style={{ ...inpS, resize: 'vertical', fontFamily: 'inherit' }} />
            <p style={hintS}>최대 160자. 카카오톡·페이스북 공유 시 미리보기에 표시됩니다.</p>
          </FormSection>

          {/* 3. 디자인 */}
          <FormSection num="3" title="디자인" desc="사이트 메인 컬러와 히어로 이미지를 선택합니다.">
            <label style={lblS}>메인 컬러</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {TSITE_PRESETS.map((p) =>
              <button
                key={p.key} type="button"
                onClick={() => { setColorKey(p.key); setDirty(true); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '8px 12px', borderRadius: 4,
                  border: colorKey === p.key ? '2px solid var(--ink)' : '1px solid var(--border)',
                  background: 'var(--bg)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, color: 'var(--ink)'
                }}>

                  <span style={{ width: 16, height: 16, borderRadius: 3, background: p.color }} />
                  {p.label}
                </button>
              )}
            </div>
            <label style={{ ...lblS, marginTop: 14 }}>히어로 스타일</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
              {TSITE_HEROS.map((h) =>
              <button
                key={h.key} type="button"
                onClick={() => { setHeroKey(h.key); setDirty(true); }}
                style={{
                  padding: 10, textAlign: 'left',
                  border: heroKey === h.key ? '2px solid var(--accent)' : '1px solid var(--border)',
                  borderRadius: 4, background: heroKey === h.key ? 'var(--bg-alt)' : 'var(--bg)', cursor: 'pointer', fontFamily: 'inherit'
                }}>

                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink)' }}>{h.label}</div>
                  <div style={{ fontSize: 10.5, color: 'var(--ink-mute)', marginTop: 2 }}>{h.desc}</div>
                </button>
              )}
            </div>
          </FormSection>

          {/* 4. 푸터 */}
          <FormSection num="4" title="푸터" desc="대회 문의처 등 사이트 최하단에 표시될 정보입니다.">
            <label style={lblS}>푸터 카피</label>
            <textarea value={footerCopy} onChange={update(setFooterCopy)} rows={2} style={{ ...inpS, resize: 'vertical', fontFamily: 'inherit' }} />
          </FormSection>

          {/* 공개 토글 */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 6, padding: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 24, color: isPublished ? 'var(--ok)' : 'var(--ink-mute)' }}>
              {isPublished ? 'public' : 'lock'}
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: 13.5 }}>공개 상태</div>
              <div style={{ fontSize: 11.5, color: 'var(--ink-mute)' }}>
                {isPublished ? '누구나 접근 가능합니다.' : '운영자 외에는 접근 불가합니다.'}
              </div>
            </div>
            <button
              type="button"
              onClick={() => { setIsPublished((v) => !v); setDirty(true); }}
              className={`btn ${isPublished ? '' : 'btn--primary'}`}>

              {isPublished ? '비공개로 전환' : '공개하기'}
            </button>
          </div>
        </div>

        {/* 우 — sticky 미리보기 */}
        <div style={{ position: 'sticky', top: 88 }}>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 6, overflow: 'hidden' }}>
            {/* preview chrome */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', background: 'var(--bg-alt)', borderBottom: '1px solid var(--border)' }}>
              <span style={{ width: 8, height: 8, borderRadius: 50, background: 'var(--err)' }} />
              <span style={{ width: 8, height: 8, borderRadius: 50, background: '#f5a623' }} />
              <span style={{ width: 8, height: 8, borderRadius: 50, background: 'var(--ok)' }} />
              <div style={{ flex: 1, marginLeft: 8, padding: '3px 8px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 3, fontFamily: 'var(--ff-mono)', fontSize: 10.5, color: 'var(--ink-mute)' }}>
                {subdomain}.mybdr.kr
              </div>
              <span className="material-symbols-outlined" style={{ fontSize: 13, color: 'var(--ink-mute)' }}>refresh</span>
            </div>
            {/* preview hero */}
            <div style={{
              position: 'relative',
              height: 180,
              background:
              heroKey === 'gradient' ? `linear-gradient(135deg, ${currentColor}, ${currentColor}99)` :
              heroKey === 'pattern' ? `${currentColor} repeating-linear-gradient(45deg, transparent 0 8px, rgba(255,255,255,0.08) 8px 10px)` :
              `linear-gradient(135deg, ${currentColor}cc, ${currentColor}99), var(--bg-alt)`,
              backgroundBlendMode: 'multiply',
              padding: 16, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
              color: '#fff'
            }}>
              {heroKey === 'photo' &&
              <div style={{ position: 'absolute', top: 8, right: 8, fontSize: 10, padding: '2px 6px', background: 'rgba(0,0,0,0.4)', borderRadius: 3, fontFamily: 'var(--ff-mono)' }}>
                  ← 실 이미지 자리
                </div>
              }
              <div style={{ fontSize: 11, opacity: 0.85, marginBottom: 4 }}>BDR · 대회</div>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}>{siteTitle}</h3>
              <p style={{ margin: '4px 0 0 0', fontSize: 11.5, opacity: 0.95 }}>{tagline}</p>
            </div>
            {/* preview body */}
            <div style={{ padding: 14 }}>
              <div style={{ fontSize: 10.5, color: 'var(--ink-mute)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600, marginBottom: 6 }}>대회 소개</div>
              <p style={{ margin: 0, fontSize: 11.5, color: 'var(--ink-soft)', lineHeight: 1.6 }}>{ogDesc}</p>
              <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                <button type="button" style={{ background: currentColor, color: '#fff', border: 0, borderRadius: 4, padding: '8px 10px', fontSize: 11.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>참가 신청</button>
                <button type="button" style={{ background: 'var(--bg-alt)', color: 'var(--ink)', border: 0, borderRadius: 4, padding: '8px 10px', fontSize: 11.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>대진표 보기</button>
              </div>
            </div>
            {/* footer */}
            <div style={{ padding: 12, borderTop: '1px solid var(--border)', fontSize: 10.5, color: 'var(--ink-mute)', background: 'var(--bg-alt)' }}>
              {footerCopy}
            </div>
          </div>

          <div style={{ background: 'var(--bg-alt)', borderRadius: 4, padding: 10, marginTop: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 13, color: 'var(--ink-mute)' }}>info</span>
              <span style={{ fontSize: 11, color: 'var(--ink-mute)' }}>
                미리보기는 데스크톱 기준입니다. 실제 사이트는 모바일에서도 자동 대응됩니다.
              </span>
            </div>
          </div>
        </div>
      </div>
    </AdminShell>);

}

function FormSection({ num, title, desc, children }) {
  return (
    <section style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 6, padding: 18 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 14 }}>
        <div style={{ width: 24, height: 24, borderRadius: 4, background: 'var(--bg-alt)', color: 'var(--ink-soft)', display: 'grid', placeItems: 'center', fontFamily: 'var(--ff-mono)', fontSize: 11, fontWeight: 700 }}>{num}</div>
        <div>
          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>{title}</h3>
          <p style={{ margin: '2px 0 0 0', fontSize: 11.5, color: 'var(--ink-mute)' }}>{desc}</p>
        </div>
      </div>
      {children}
    </section>);

}

const lblS = { display: 'block', fontSize: 11, color: 'var(--ink-mute)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600, marginBottom: 6 };
const inpS = { width: '100%', padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 4, background: 'var(--bg)', color: 'var(--ink)', fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box' };
const hintS = { margin: '6px 0 0 0', fontSize: 11, color: 'var(--ink-mute)' };

window.AdminTournamentSite = AdminTournamentSite;

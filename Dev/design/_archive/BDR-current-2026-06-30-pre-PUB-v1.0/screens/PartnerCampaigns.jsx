/* global React */
// ============================================================
// BDR v2.28 — PartnerCampaigns (VP3 · Phase 8A · 통합 신규 · BV6 ★★★)
// 운영: campaigns(355) + [id](366) = 721 · 박제 ❌ → 통합 hub.
// 측: Court Operator (파트너).
//
// list = 캠페인 카드 grid (노출/클릭/매출 + status) + 상태 필터 + "새 캠페인" 모달
//   + 상세 모달 (partners 모델). 새 라우트 ❌.
// ============================================================
const VP3_FILTERS = [
  { key: 'all', lbl: '전체' }, { key: 'approved', lbl: '게재 중' },
  { key: 'pending_review', lbl: '심사 대기' }, { key: 'ended', lbl: '종료' },
];

function PartnerCampaigns() {
  const all = window.CAMPAIGNS;
  const [filter, setFilter] = React.useState('all');
  const [modal, setModal] = React.useState(null); // 'new' | campaign obj
  const rows = filter === 'all' ? all : all.filter(c => c.status === filter);

  const totals = {
    impressions: all.reduce((a, c) => a + c.impressions, 0),
    clicks: all.reduce((a, c) => a + c.clicks, 0),
    revenue: all.reduce((a, c) => a + c.revenue, 0),
  };

  return (
    <div className="pm-page">
      <div className="pm-page__inner bl-wide">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: 16 }}>
          <div>
            <window.CourtOperatorBadge />
            <h1 style={{ fontFamily: 'var(--ff-display)', fontSize: 26, fontWeight: 900, letterSpacing: '-0.02em', margin: '8px 0 0', color: 'var(--ink)' }}>광고 캠페인</h1>
            <div style={{ fontSize: 13, color: 'var(--ink-mute)', marginTop: 2 }}>노출 {totals.impressions.toLocaleString('ko-KR')} · 클릭 {totals.clicks.toLocaleString('ko-KR')} · 매출 {window.wonRaw(totals.revenue)}</div>
          </div>
          <button className="btn btn--primary" onClick={() => setModal('new')}><span className="ico material-symbols-outlined">add</span>새 캠페인</button>
        </div>

        {/* filter */}
        <div className="cv-filters">
          {VP3_FILTERS.map(f => (
            <button key={f.key} className={'cv-fchip' + (filter === f.key ? ' is-on' : '')} onClick={() => setFilter(f.key)}>{f.lbl}</button>
          ))}
        </div>

        {/* campaign grid */}
        <div className="cv-cmp-grid">
          {rows.map(c => (
            <div key={c.id} className="cv-cmp" onClick={() => setModal(c)}>
              <div className="cv-cmp__top">
                <div style={{ minWidth: 0 }}>
                  <div className="cv-cmp__title">{c.title}</div>
                  <div className="cv-cmp__head">{c.headline}</div>
                </div>
                <window.CvStatusBadge status={c.status} map={Object.fromEntries(Object.entries(window.CAMPAIGN_STATUS).map(([k, v]) => [k, { label: v.label, tone: v.tone }]))} />
              </div>
              <div className="cv-cmp__metrics">
                <div><div className="cv-cmp__m-v">{c.impressions.toLocaleString('ko-KR')}</div><div className="cv-cmp__m-l">노출</div></div>
                <div><div className="cv-cmp__m-v">{c.clicks.toLocaleString('ko-KR')}</div><div className="cv-cmp__m-l">클릭 · {c.ctr}%</div></div>
                <div><div className="cv-cmp__m-v">{window.wonRaw(c.revenue)}</div><div className="cv-cmp__m-l">매출</div></div>
              </div>
              <div className="cv-cmp__period"><span className="ico material-symbols-outlined" style={{ fontFamily: 'Material Symbols Outlined', fontSize: 13, verticalAlign: '-2px' }}>date_range</span> {c.start} ~ {c.end} · 예산 {window.wonRaw(c.budget)} (소진 {Math.round(c.spent / c.budget * 100)}%)</div>
            </div>
          ))}
        </div>
      </div>

      {/* 새 캠페인 모달 */}
      {modal === 'new' && (
        <div className="bl-modal-stage" onClick={() => setModal(null)}>
          <div className="bl-modal bl-modal--wide" onClick={e => e.stopPropagation()}>
            <div className="bl-modal__head">
              <div><h3 className="bl-modal__title"><span className="ico material-symbols-outlined" style={{ color: 'var(--cafe-blue-deep)' }}>campaign</span>새 캠페인</h3><div className="bl-modal__sub">생성 후 관리자 심사를 거쳐 게재됩니다</div></div>
              <button className="bl-modal__close" onClick={() => setModal(null)}><span className="ico material-symbols-outlined">close</span></button>
            </div>
            <div className="bl-modal__body">
              <div className="bl-modal-row2">
                <div className="bl-field"><label className="bl-field__l">캠페인명 (내부용)</label><input className="pm-input" placeholder="2026 봄 시즌 프로모션" /></div>
                <div className="bl-field"><label className="bl-field__l">광고 제목 (표시용)</label><input className="pm-input" placeholder="장충체육관 대관 30% 할인" /></div>
              </div>
              <div className="bl-modal-row2">
                <div className="bl-field"><label className="bl-field__l">기간 시작</label><input className="pm-input" type="date" /></div>
                <div className="bl-field"><label className="bl-field__l">기간 종료</label><input className="pm-input" type="date" /></div>
              </div>
              <div className="bl-modal-row2">
                <div className="bl-field"><label className="bl-field__l">예산</label><input className="pm-input" placeholder="₩500,000" /></div>
                <div className="bl-field"><label className="bl-field__l">대상 지역</label><select className="pm-select"><option>서울 전체</option><option>중구</option><option>송파구</option></select></div>
              </div>
              <div className="bl-field" style={{ marginBottom: 0 }}><label className="bl-field__l">광고 자산 (이미지)</label>
                <div style={{ height: 80, borderRadius: 4, border: '1px dashed var(--border-strong)', background: 'var(--bg-alt)', display: 'grid', placeItems: 'center', color: 'var(--ink-mute)', fontSize: 12, gap: 4 }}><span className="ico material-symbols-outlined">upload</span>이미지 업로드 (권장 1200×628)</div>
              </div>
            </div>
            <div className="bl-modal__foot">
              <button className="btn" onClick={() => setModal(null)}>취소</button>
              <button className="btn btn--primary" onClick={() => setModal(null)}><span className="ico material-symbols-outlined">send</span>생성 + 심사 요청</button>
            </div>
          </div>
        </div>
      )}

      {/* 상세 모달 */}
      {modal && modal !== 'new' && (
        <div className="bl-modal-stage" onClick={() => setModal(null)}>
          <div className="bl-modal bl-modal--wide" onClick={e => e.stopPropagation()}>
            <div className="bl-modal__head">
              <div><h3 className="bl-modal__title">{modal.title}</h3><div className="bl-modal__sub">{modal.headline}</div></div>
              <button className="bl-modal__close" onClick={() => setModal(null)}><span className="ico material-symbols-outlined">close</span></button>
            </div>
            <div className="bl-modal__body">
              <div style={{ marginBottom: 14 }}><window.CvStatusBadge status={modal.status} map={Object.fromEntries(Object.entries(window.CAMPAIGN_STATUS).map(([k, v]) => [k, { label: v.label, tone: v.tone }]))} /></div>
              <div className="cv-cmp__metrics" style={{ borderTop: 0, marginBottom: 16 }}>
                <div><div className="cv-cmp__m-v">{modal.impressions.toLocaleString('ko-KR')}</div><div className="cv-cmp__m-l">노출</div></div>
                <div><div className="cv-cmp__m-v">{modal.clicks.toLocaleString('ko-KR')}</div><div className="cv-cmp__m-l">클릭</div></div>
                <div><div className="cv-cmp__m-v">{modal.ctr}%</div><div className="cv-cmp__m-l">CTR</div></div>
              </div>
              <div className="au-summary">
                <div className="au-summary__row"><span className="au-summary__l">기간</span><span className="au-summary__v">{modal.start} ~ {modal.end}</span></div>
                <div className="au-summary__row"><span className="au-summary__l">예산 / 소진</span><span className="au-summary__v">{window.wonRaw(modal.budget)} / {window.wonRaw(modal.spent)}</span></div>
                <div className="au-summary__row"><span className="au-summary__l">매출</span><span className="au-summary__v">{window.wonRaw(modal.revenue)}</span></div>
              </div>
            </div>
            <div className="bl-modal__foot">
              {modal.status === 'approved' && <button className="btn btn-suspend"><span className="ico material-symbols-outlined">pause</span>일시정지</button>}
              <button className="btn" onClick={() => setModal(null)}>닫기</button>
              <button className="btn btn--primary"><span className="ico material-symbols-outlined">edit</span>수정</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

window.PartnerCampaigns = PartnerCampaigns;

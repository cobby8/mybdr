/* global React */
// ============================================================
// BDR v2.28 — AdminCourtsPartners (VA1 · Phase 8A · 통합 신규 · BV7 ★★)
// 운영: /admin/courts(132) + /admin/partners(279) = 411 · 박제 ❌ → Phase 4 OA1 + 6.1 PA1 답습.
// 측: Site Operator (super-admin · dark+gold badge).
//
// Hero (전체/활성/미승인/파트너/캠페인) + Site Operator badge + 4 탭
//   (코트 / 파트너 / 신고 / 편집 제안) + 상태 모달 (Phase 2 UD1 답습 · 알림 ✅).
// ============================================================
const VA1_TABS = [
  { key: 'courts',   lbl: '코트',     ico: 'stadium' },
  { key: 'partners', lbl: '파트너',   ico: 'handshake' },
  { key: 'reports',  lbl: '신고',     ico: 'flag' },
  { key: 'edits',    lbl: '편집 제안', ico: 'edit_note' },
];

function AdminCourtsPartners() {
  const courts = window.ADMIN_COURTS;
  const partners = window.ADMIN_PARTNERS;
  const reports = window.COURT_REPORTS;
  const edits = window.COURT_EDITS;
  const [tab, setTab] = React.useState('courts');
  const [modal, setModal] = React.useState(null);
  const [notify, setNotify] = React.useState(true);

  const counts = {
    courts: courts.length,
    partners: partners.length,
    reports: reports.filter(r => r.status === 'pending').length,
    edits: edits.filter(e => e.status === 'pending').length,
  };
  const activeCourts = courts.filter(c => c.status === 'active').length;
  const pendingCourts = courts.filter(c => c.status === 'pending').length;

  return (
    <div className="oa1-page">
      <header className="oa1-hero">
        <div>
          <window.OperatorBadge />
          <h1 className="oa1-hero__title" style={{ marginTop: 8 }}>코트·파트너 관리</h1>
          <div className="oa1-hero__sub">ADMIN · 콘텐츠 · 코트 승인 / 파트너 검수 / 신고 처리</div>
        </div>
        <div className="oa1-hero__stats">
          <div className="oa1-hero__stat"><div className="oa1-hero__stat-num">{courts.length}</div><div className="oa1-hero__stat-lbl">전체 코트</div></div>
          <div className="oa1-hero__stat"><div className="oa1-hero__stat-num oa1-hero__stat-num--approved">{activeCourts}</div><div className="oa1-hero__stat-lbl">활성</div></div>
          <div className="oa1-hero__stat"><div className="oa1-hero__stat-num oa1-hero__stat-num--pending">{pendingCourts}</div><div className="oa1-hero__stat-lbl">미승인</div></div>
          <div className="oa1-hero__stat"><div className="oa1-hero__stat-num">{partners.length}</div><div className="oa1-hero__stat-lbl">파트너</div></div>
        </div>
      </header>

      {/* filter */}
      <div className="oa1-filter">
        <div className="tu1-filter__search" style={{ minWidth: 220, maxWidth: 320 }}>
          <span className="ico material-symbols-outlined">search</span>
          <input placeholder="코트명 / 파트너 / 주소" />
        </div>
      </div>

      {/* tabs */}
      <div className="ca1-tabs">
        {VA1_TABS.map(t => (
          <button key={t.key} className={'ca1-tab' + (tab === t.key ? ' is-on' : '')} data-active={tab === t.key} onClick={() => setTab(t.key)}>
            <span className="ico material-symbols-outlined">{t.ico}</span>{t.lbl}
            <span className="ca1-tab__count">{counts[t.key]}</span>
          </button>
        ))}
      </div>

      {/* COURTS */}
      {tab === 'courts' && (
        <div className="cv-atable">
          <div className="cv-atable__head cv-courts-cols"><div>코트</div><div>파트너</div><div>유형</div><div>리뷰</div><div style={{ textAlign: 'right' }}>상태</div></div>
          {courts.map(c => (
            <div key={c.id} className="cv-atable__row cv-courts-cols" onClick={() => setModal({ kind: 'court', data: c })}>
              <div><div className="cv-a-name">{c.name}</div><div className="cv-a-sub">{c.city} · {c.created}</div></div>
              <div className="cv-a-cell">{c.partner || '공공'}</div>
              <div className="cv-a-cell">{c.type === 'indoor' ? '실내' : '야외'}</div>
              <div className="cv-a-cell">{c.reviews}</div>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}><window.CvStatusBadge status={c.status} /></div>
            </div>
          ))}
        </div>
      )}

      {/* PARTNERS */}
      {tab === 'partners' && (
        <div className="cv-atable">
          <div className="cv-atable__head cv-partners-cols"><div>파트너</div><div>코트</div><div>캠페인</div><div>담당자</div><div style={{ textAlign: 'right' }}>상태</div></div>
          {partners.map(p => (
            <div key={p.id} className="cv-atable__row cv-partners-cols" onClick={() => setModal({ kind: 'partner', data: p })}>
              <div><div className="cv-a-name">{p.name}</div><div className="cv-a-sub">가입 {p.joined}</div></div>
              <div className="cv-a-cell">{p.courts}개</div>
              <div className="cv-a-cell">{p.campaigns}개</div>
              <div className="cv-a-cell">{p.contact}</div>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}><window.CvStatusBadge status={p.status} /></div>
            </div>
          ))}
        </div>
      )}

      {/* REPORTS */}
      {tab === 'reports' && (
        <div className="cv-atable">
          <div className="cv-atable__head cv-reports-cols"><div>코트</div><div>신고 사유</div><div>신고자</div><div style={{ textAlign: 'right' }}>상태</div></div>
          {reports.map(r => (
            <div key={r.id} className="cv-atable__row cv-reports-cols" onClick={() => setModal({ kind: 'report', data: r })}>
              <div><div className="cv-a-name">{r.court}</div><div className="cv-a-sub">{r.date}</div></div>
              <div className="cv-a-cell">{r.reason}</div>
              <div className="cv-a-cell">{r.reporter}</div>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}><window.CvStatusBadge status={r.status} /></div>
            </div>
          ))}
        </div>
      )}

      {/* EDITS */}
      {tab === 'edits' && (
        <div className="cv-atable">
          <div className="cv-atable__head cv-edits-cols"><div>코트</div><div>항목</div><div>변경 내용</div><div>제안자</div><div style={{ textAlign: 'right' }}>상태</div></div>
          {edits.map(e => (
            <div key={e.id} className="cv-atable__row cv-edits-cols" onClick={() => setModal({ kind: 'edit', data: e })}>
              <div><div className="cv-a-name">{e.court}</div><div className="cv-a-sub">{e.date}</div></div>
              <div className="cv-a-cell">{e.field}</div>
              <div className="cv-a-edit"><del>{e.from}</del> → <ins>{e.to}</ins></div>
              <div className="cv-a-cell">{e.user}</div>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}><window.CvStatusBadge status={e.status} /></div>
            </div>
          ))}
        </div>
      )}

      {/* 상태 모달 (Phase 2 UD1 답습 · 알림 ✅) */}
      {modal && (
        <div className="bl-modal-stage" onClick={() => setModal(null)}>
          <div className="bl-modal" onClick={e => e.stopPropagation()}>
            <div className="bl-modal__head">
              <div>
                <h3 className="bl-modal__title">
                  {modal.kind === 'court' && <><span className="ico material-symbols-outlined" style={{ color: 'var(--cafe-blue-deep)' }}>stadium</span>코트 상태 변경</>}
                  {modal.kind === 'partner' && <><span className="ico material-symbols-outlined" style={{ color: 'var(--cafe-blue-deep)' }}>handshake</span>파트너 검수</>}
                  {modal.kind === 'report' && <><span className="ico material-symbols-outlined" style={{ color: 'var(--accent)' }}>flag</span>신고 처리</>}
                  {modal.kind === 'edit' && <><span className="ico material-symbols-outlined" style={{ color: 'var(--ok)' }}>edit_note</span>편집 제안 검토</>}
                </h3>
                <div className="bl-modal__sub">{modal.data.name || modal.data.court}</div>
              </div>
              <button className="bl-modal__close" onClick={() => setModal(null)}><span className="ico material-symbols-outlined">close</span></button>
            </div>
            <div className="bl-modal__body">
              {modal.kind === 'court' && (
                <div className="pm-field" style={{ marginBottom: 0 }}>
                  <label className="pm-field__l">상태</label>
                  <select className="pm-select" defaultValue={modal.data.status}>
                    <option value="active">활성</option><option value="pending">미승인</option><option value="suspended">정지</option><option value="reported">신고됨</option>
                  </select>
                </div>
              )}
              {modal.kind === 'partner' && (
                <div className="pm-field" style={{ marginBottom: 0 }}>
                  <label className="pm-field__l">검수 결과</label>
                  <select className="pm-select" defaultValue={modal.data.status}><option value="active">승인 (활성)</option><option value="review">검수 대기</option><option value="suspended">정지</option></select>
                </div>
              )}
              {modal.kind === 'report' && (
                <>
                  <div className="bl-refund-note" style={{ marginBottom: 14 }}>
                    <span className="ico material-symbols-outlined">flag</span>
                    <div><div className="bl-refund-note__t">{modal.data.reason}</div><div className="bl-refund-note__d">신고자 {modal.data.reporter} · {modal.data.date}</div></div>
                  </div>
                  <div className="pm-field" style={{ marginBottom: 0 }}><label className="pm-field__l">처리</label><select className="pm-select"><option>정보 수정 후 해결</option><option>코트 정지</option><option>반려 (정상)</option></select></div>
                </>
              )}
              {modal.kind === 'edit' && (
                <div className="au-summary" style={{ marginBottom: 0 }}>
                  <div className="au-summary__row"><span className="au-summary__l">항목</span><span className="au-summary__v">{modal.data.field}</span></div>
                  <div className="au-summary__row"><span className="au-summary__l">기존</span><span className="au-summary__v" style={{ color: 'var(--ink-dim)' }}>{modal.data.from}</span></div>
                  <div className="au-summary__row"><span className="au-summary__l">제안</span><span className="au-summary__v" style={{ color: 'var(--ok)' }}>{modal.data.to}</span></div>
                </div>
              )}
            </div>
            <div className="bl-modal__foot">
              <div className="bl-modal__notify">
                <input type="checkbox" id="va1-notify" checked={notify} onChange={() => setNotify(!notify)} />
                <div><strong>처리 결과를 {modal.kind === 'partner' ? '파트너' : '사용자'}에게 알림</strong><div style={{ fontFamily: 'var(--ff-mono)', fontSize: 10.5, color: 'var(--ink-mute)', marginTop: 2 }}>카카오 알림톡 + 이메일</div></div>
              </div>
              <button className="btn btn--sm" onClick={() => setModal(null)}>취소</button>
              {modal.kind === 'edit'
                ? <button className="btn btn--sm btn-approve" onClick={() => setModal(null)}><span className="ico material-symbols-outlined">check</span>반영 + 알림</button>
                : <button className="btn btn--sm btn--primary" onClick={() => setModal(null)}><span className="ico material-symbols-outlined">check</span>적용 + 알림</button>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

window.AdminCourtsPartners = AdminCourtsPartners;

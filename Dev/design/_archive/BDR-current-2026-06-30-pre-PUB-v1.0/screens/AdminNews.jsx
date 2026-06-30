/* global React */
// ============================================================
// BDR v2.30 — AdminNews (IA1 · Phase 10A · 신규 · BI5 ★★ · super-admin)
// 운영: /admin/news (163 · 박제 ❌) → Phase 4 OA1 + 9 NA1 답습.
// 측: Site Operator (super-admin).
//
// Hero stat(전체/발행/임시저장/이달) + 작성 form(카테고리 4 + 제목/본문 rich +
//   대표 이미지 + 매치 cross-domain + 발행 옵션) + 미리보기 + 발행 이력 +
//   발행 모달(★ 사용자 알림 보내기 ✅ 기본 · NU1 동기화).
// ============================================================
function AdminNews() {
  const s = window.ANW_STATS;
  const cats = window.ANW_CATS;
  const [cat, setCat] = React.useState('magazine');
  const [title, setTitle] = React.useState('');
  const [content, setContent] = React.useState('');
  const [pub, setPub] = React.useState('publish');
  const [confirm, setConfirm] = React.useState(false);

  const catMeta = cats.find(c => c.key === cat);
  const richBtns = ['format_bold', 'format_italic', 'format_list_bulleted', 'format_quote', 'link', 'image'];

  return (
    <div className="oa1-page">
      <header className="oa1-hero">
        <div>
          <window.OperatorBadge />
          <h1 className="oa1-hero__title" style={{ marginTop: 8 }}>BDR NEWS 발행</h1>
          <div className="oa1-hero__sub">ADMIN · 콘텐츠 · 매거진·매치 단신 발행 hub</div>
        </div>
        <div className="oa1-hero__stats">
          <div className="oa1-hero__stat"><div className="oa1-hero__stat-num">{s.total}</div><div className="oa1-hero__stat-lbl">전체 뉴스</div></div>
          <div className="oa1-hero__stat"><div className="oa1-hero__stat-num oa1-hero__stat-num--approved">{s.published}</div><div className="oa1-hero__stat-lbl">발행됨</div></div>
          <div className="oa1-hero__stat"><div className="oa1-hero__stat-num">{s.draft}</div><div className="oa1-hero__stat-lbl">임시저장</div></div>
          <div className="oa1-hero__stat"><div className="oa1-hero__stat-num">{s.this_month}</div><div className="oa1-hero__stat-lbl">이달 발행</div></div>
        </div>
      </header>

      <div className="anw-grid">
        {/* 작성 form */}
        <div className="pm-card">
          <h2 className="pm-card__h" style={{ marginBottom: 16 }}><span className="ico material-symbols-outlined">edit_note</span>새 기사 작성</h2>

          {/* 카테고리 4 */}
          <div className="bl-field">
            <label className="bl-field__l">카테고리</label>
            <div className="anw-catrow">
              {cats.map(c => (
                <button key={c.key} className={'anw-cat' + (cat === c.key ? ' is-on' : '')} data-k={c.key} onClick={() => setCat(c.key)}>
                  <span className="anw-cat__top"><span className="anw-cat__dot" /><span className="anw-cat__l">{c.label}</span></span>
                  <span className="anw-cat__d">{c.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 매치 cross-domain (category=match) */}
          {cat === 'match' && (
            <div className="bl-field">
              <div className="anw-xlink">
                <div className="anw-xlink__h"><span className="ico material-symbols-outlined">link</span>매치 연결 (Phase 1 대회 / Phase 2 경기 cross-domain)</div>
                <div className="anw-xlink__row">
                  <select className="anw-select">
                    <option value="">대회 선택…</option>
                    {window.ANW_TN_OPTIONS.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                  <select className="anw-select">
                    <option value="">경기 선택…</option>
                    {window.ANW_MATCH_OPTIONS.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                </div>
              </div>
            </div>
          )}

          <div className="bl-field">
            <label className="bl-field__l">제목 <span style={{ color: 'var(--accent)' }}>*</span></label>
            <input className="pm-input" value={title} onChange={e => setTitle(e.target.value)} placeholder="기사 제목" maxLength={120} />
          </div>

          {/* 본문 rich text mock */}
          <div className="bl-field">
            <label className="bl-field__l">본문</label>
            <div className="anw-rich">
              <div className="anw-rich__bar">
                {richBtns.map((b, i) => (
                  <React.Fragment key={b}>
                    {i === 4 && <span className="anw-rich__sep" />}
                    <button className="anw-rich__btn" tabIndex={-1}><span className="ico material-symbols-outlined">{b}</span></button>
                  </React.Fragment>
                ))}
              </div>
              <textarea value={content} onChange={e => setContent(e.target.value)} placeholder="기사 본문을 입력하세요. 매치 단신은 알기자가 작성한 초안을 검수·수정합니다." />
            </div>
          </div>

          {/* 대표 이미지 */}
          <div className="bl-field">
            <label className="bl-field__l">대표 이미지</label>
            <div className="anw-cover"><span className="ico material-symbols-outlined">add_photo_alternate</span><span>클릭 또는 드래그하여 대표 이미지 업로드</span></div>
          </div>

          {/* 발행 옵션 */}
          <div className="bl-field" style={{ marginBottom: 18 }}>
            <label className="bl-field__l">발행 방식</label>
            <div className="anw-opts">
              {[['publish', 'send', '바로 발행'], ['draft', 'save', '임시저장'], ['schedule', 'schedule', '예약 발행']].map(([k, ico, l]) => (
                <button key={k} className={'anw-opt' + (pub === k ? ' is-on' : '')} onClick={() => setPub(k)}>
                  <span className="anw-opt__radio" />
                  <span className="ico material-symbols-outlined">{ico}</span>{l}
                </button>
              ))}
            </div>
          </div>

          <button className="btn btn--primary" style={{ width: '100%' }} disabled={!title.trim()} onClick={() => setConfirm(true)}>
            <span className="ico material-symbols-outlined">{pub === 'draft' ? 'save' : pub === 'schedule' ? 'schedule' : 'send'}</span>
            {pub === 'draft' ? '임시저장' : pub === 'schedule' ? '예약 발행 설정' : '발행하기'}
          </button>
        </div>

        {/* 미리보기 */}
        <aside>
          <div className="anw-preview-h"><span className="ico material-symbols-outlined">visibility</span>미리보기 (사용자 IU2)</div>
          <div className="anw-preview">
            <div className="anw-preview__cover"><span className="ico material-symbols-outlined">{cat === 'match' ? 'sports_basketball' : cat === 'event' ? 'celebration' : cat === 'notice' ? 'campaign' : 'photo'}</span></div>
            <div className="anw-preview__body">
              <div className="anw-preview__cat">
                <span className={'nw-tag nw-tag--' + (cat === 'magazine' ? 'news' : cat)}>{catMeta.label}</span>
              </div>
              {title.trim()
                ? <><div className="anw-preview__title">{title}</div>{content && <div className="anw-preview__content">{content.slice(0, 100)}{content.length > 100 ? '…' : ''}</div>}</>
                : <div className="anw-preview__empty">제목을 입력하면 미리보기가 표시됩니다</div>}
            </div>
          </div>
          <div className="bl-refund-note" style={{ marginTop: 12 }}>
            <span className="ico material-symbols-outlined">hub</span>
            <div>
              <div className="bl-refund-note__t">발행 시 자동 동기화</div>
              <div className="bl-refund-note__d">발행된 기사는 <a href="iu2-news.html" style={{ color: 'var(--cafe-blue-deep)', fontWeight: 700 }}>News 매거진(IU2)</a>에 즉시 노출되고, 알림 발송 시 <a href="nu1-notifications.html" style={{ color: 'var(--cafe-blue-deep)', fontWeight: 700 }}>알림(NU1)</a>으로 전달됩니다.</div>
            </div>
          </div>
        </aside>
      </div>

      {/* 발행 이력 */}
      <div className="pm-card" style={{ marginTop: 4 }}>
        <h2 className="pm-card__h" style={{ marginBottom: 14 }}><span className="ico material-symbols-outlined">history</span>발행 이력</h2>
        <div className="anw-hist">
          {window.ANW_HISTORY.map(h => {
            const cm = cats.find(c => c.key === h.cat);
            return (
              <div key={h.id} className="anw-hrow">
                <span className={'nw-tag nw-tag--' + (h.cat === 'magazine' ? 'news' : h.cat)}>{cm.label}</span>
                <div className="anw-hrow__body">
                  <div className="anw-hrow__title">{h.title}</div>
                  <div className="anw-hrow__meta"><span>{h.time}</span><span>by {h.sender}</span></div>
                </div>
                <div className="anw-hrow__views">{h.views.toLocaleString('ko-KR')}<small>조회</small></div>
                <span className={'anw-status anw-status--' + h.status}>
                  <span className="ico material-symbols-outlined" style={{ fontSize: 12 }}>{h.status === 'published' ? 'check_circle' : h.status === 'draft' ? 'edit' : 'schedule'}</span>
                  {h.status === 'published' ? '발행됨' : h.status === 'draft' ? '임시저장' : '예약'}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 발행 확인 모달 — ★ 사용자 알림 보내기 ✅ 기본 */}
      {confirm && (
        <div className="bl-modal-stage" onClick={() => setConfirm(false)}>
          <div className="bl-modal" onClick={e => e.stopPropagation()}>
            <div className="bl-modal__head">
              <h3 className="bl-modal__title"><span className="ico material-symbols-outlined" style={{ color: 'var(--accent)' }}>send</span>기사를 발행할까요?</h3>
              <button className="bl-modal__close" onClick={() => setConfirm(false)}><span className="ico material-symbols-outlined">close</span></button>
            </div>
            <div className="bl-modal__body">
              <div className="au-summary" style={{ marginBottom: 14 }}>
                <div className="au-summary__row"><span className="au-summary__l">카테고리</span><span className="au-summary__v">{catMeta.label}</span></div>
                <div className="au-summary__row"><span className="au-summary__l">제목</span><span className="au-summary__v">{title || '—'}</span></div>
              </div>
              {/* ★ 알림 보내기 기본 체크 (NU1 동기화) */}
              <label className="anw-modal-notify" htmlFor="anw-notify">
                <input type="checkbox" id="anw-notify" defaultChecked />
                <div>
                  <div className="anw-modal-notify__t">사용자에게 알림 보내기</div>
                  <div className="anw-modal-notify__d">발행과 동시에 전체 사용자의 알림(NU1)으로 새 기사 알림이 전송됩니다.</div>
                </div>
              </label>
            </div>
            <div className="bl-modal__foot">
              <button className="btn btn--sm" onClick={() => setConfirm(false)}>취소</button>
              <button className="btn btn--sm btn--primary" onClick={() => setConfirm(false)}><span className="ico material-symbols-outlined">send</span>발행 + 알림</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

window.AdminNews = AdminNews;

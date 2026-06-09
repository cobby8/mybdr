/* global React */
// ============================================================
// BDR v2.29 — AdminNotifications (NA1 · Phase 9A · 신규 · BN4 ★★ · super-admin)
// 운영: /admin/notifications (251) · 박제 ❌ → Phase 4 OA1 + 6.1 PA1 답습.
// 측: Site Operator (super-admin).
//
// Hero (발송 이력/이달/수신자) + 작성 form (target chip 4 + 제목/본문/카테고리/URL +
//   미리보기) + 발송 이력 list + 발송 확인 모달 ("X명에게 발송"). BN4 = NU1 수신.
// ============================================================
function AdminNotifications() {
  const targets = window.NA1_TARGETS;
  const s = window.NA1_STATS;
  const [target, setTarget] = React.useState('all');
  const [title, setTitle] = React.useState('');
  const [content, setContent] = React.useState('');
  const [cat, setCat] = React.useState('system');
  const [confirm, setConfirm] = React.useState(false);

  const tgt = targets.find(t => t.key === target);
  const cats = window.NOTIF_CATS.filter(c => c.key !== 'all');

  return (
    <div className="oa1-page">
      <header className="oa1-hero">
        <div>
          <window.OperatorBadge />
          <h1 className="oa1-hero__title" style={{ marginTop: 8 }}>알림 발송</h1>
          <div className="oa1-hero__sub">ADMIN · 시스템 · 대상별 알림 발송 (신중히 진행)</div>
        </div>
        <div className="oa1-hero__stats">
          <div className="oa1-hero__stat"><div className="oa1-hero__stat-num">{s.total}</div><div className="oa1-hero__stat-lbl">발송 이력</div></div>
          <div className="oa1-hero__stat"><div className="oa1-hero__stat-num oa1-hero__stat-num--approved">{s.this_month}</div><div className="oa1-hero__stat-lbl">이달 발송</div></div>
          <div className="oa1-hero__stat"><div className="oa1-hero__stat-num">{s.recipients_sum.toLocaleString('ko-KR')}</div><div className="oa1-hero__stat-lbl">수신자 합계</div></div>
        </div>
      </header>

      <div className="nt-na-grid">
        {/* 작성 form */}
        <div className="pm-card">
          <h2 className="pm-card__h" style={{ marginBottom: 16 }}><span className="ico material-symbols-outlined">edit_notifications</span>새 알림 작성</h2>

          <div className="bl-field">
            <label className="bl-field__l">발송 대상</label>
            <div className="nt-target-row">
              {targets.map(t => (
                <button key={t.key} className={'nt-target' + (target === t.key ? ' is-on' : '')} onClick={() => setTarget(t.key)}>
                  <span className="ico material-symbols-outlined">{t.ico}</span>
                  <span className="nt-target__l">{t.label}</span>
                  <span className="nt-target__c">{t.count.toLocaleString('ko-KR')}명</span>
                </button>
              ))}
            </div>
          </div>

          <div className="bl-field">
            <label className="bl-field__l">카테고리</label>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {cats.map(c => (
                <button key={c.key} className={'pm-chip' + (cat === c.key ? ' is-on' : '')} onClick={() => setCat(c.key)}>
                  {cat === c.key && <span className="ico material-symbols-outlined">check</span>}{c.label}
                </button>
              ))}
            </div>
          </div>

          <div className="bl-field">
            <label className="bl-field__l">제목 <span style={{ color: 'var(--accent)' }}>*</span></label>
            <input className="pm-input" value={title} onChange={e => setTitle(e.target.value)} placeholder="알림 제목" maxLength={100} />
          </div>
          <div className="bl-field">
            <label className="bl-field__l">내용</label>
            <textarea className="pm-input" value={content} onChange={e => setContent(e.target.value)} rows={3} placeholder="알림 내용 (선택)" maxLength={500}></textarea>
          </div>
          <div className="bl-field" style={{ marginBottom: 18 }}>
            <label className="bl-field__l">이동 URL (선택)</label>
            <input className="pm-input" placeholder="/tournaments/123" />
          </div>
          <button className="btn btn--primary" style={{ width: '100%' }} disabled={!title.trim()} onClick={() => setConfirm(true)}>
            <span className="ico material-symbols-outlined">send</span>{tgt.count.toLocaleString('ko-KR')}명에게 발송
          </button>
        </div>

        {/* 미리보기 */}
        <aside>
          <div className="pm-sec-title" style={{ marginBottom: 10 }}>미리보기</div>
          <div className="nt-preview">
            <div className="nt-preview__bar"><span className="ico material-symbols-outlined" style={{ fontFamily: 'Material Symbols Outlined', fontSize: 13 }}>smartphone</span>MyBDR · 알림</div>
            <div className="nt-preview__body">
              {title.trim() ? (
                <div className="nt-preview__notif">
                  <window.NotifIcon cat={cat} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}><window.CatBadge cat={cat} /><span style={{ fontFamily: 'var(--ff-mono)', fontSize: 9.5, color: 'var(--ink-dim)' }}>방금</span></div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--ink)' }}>{title}</div>
                    {content && <div style={{ fontSize: 12, color: 'var(--ink-mute)', marginTop: 2, lineHeight: 1.5 }}>{content}</div>}
                  </div>
                </div>
              ) : <div className="nt-preview__empty">제목을 입력하면 미리보기가 표시됩니다</div>}
            </div>
          </div>
          <div className="bl-refund-note" style={{ marginTop: 12 }}>
            <span className="ico material-symbols-outlined">hub</span>
            <div><div className="bl-refund-note__t">사용자 NU1에 표시됩니다</div><div className="bl-refund-note__d">발송된 알림은 수신자의 <a href="nu1-notifications.html" style={{ color: 'var(--cafe-blue-deep)', fontWeight: 700 }}>알림(NU1)</a> 화면에 카테고리별로 표시됩니다.</div></div>
          </div>
        </aside>
      </div>

      {/* 발송 이력 */}
      <div className="pm-card" style={{ marginTop: 4 }}>
        <h2 className="pm-card__h" style={{ marginBottom: 14 }}><span className="ico material-symbols-outlined">history</span>발송 이력</h2>
        {window.NA1_HISTORY.map(h => (
          <div key={h.id} className="nt-hist">
            <window.NotifIcon cat={h.cat} />
            <div className="nt-hist__body">
              <div className="nt-hist__t">{h.title}</div>
              <div className="nt-hist__m"><span>{h.target}</span><span>{h.time}</span><span>by {h.sender}</span></div>
            </div>
            <div className="nt-hist__recip"><div className="nt-hist__recip-v">{h.recipients.toLocaleString('ko-KR')}</div><div className="nt-hist__recip-l">수신</div></div>
            <button className="btn btn--sm" onClick={() => setConfirm(h)}><span className="ico material-symbols-outlined">replay</span>재발송</button>
          </div>
        ))}
      </div>

      {/* 발송 확인 모달 */}
      {confirm && (
        <div className="bl-modal-stage" onClick={() => setConfirm(false)}>
          <div className="bl-modal" onClick={e => e.stopPropagation()}>
            <div className="bl-modal__head">
              <h3 className="bl-modal__title"><span className="ico material-symbols-outlined" style={{ color: 'var(--accent)' }}>send</span>알림을 발송할까요?</h3>
              <button className="bl-modal__close" onClick={() => setConfirm(false)}><span className="ico material-symbols-outlined">close</span></button>
            </div>
            <div className="bl-modal__body">
              <div className="gw-ph" style={{ background: 'var(--accent-soft)', borderColor: 'var(--accent-hair)', marginBottom: 14 }}>
                <span className="gw-ph__ico ico material-symbols-outlined" style={{ color: 'var(--accent)' }}>priority_high</span>
                <div className="gw-ph__body">
                  <div className="gw-ph__t" style={{ color: 'var(--accent-deep)' }}>{confirm.recipients ? confirm.recipients.toLocaleString('ko-KR') : tgt.count.toLocaleString('ko-KR')}명에게 발송됩니다</div>
                  <div className="gw-ph__d" style={{ color: 'var(--accent-deep)' }}>발송 후 취소할 수 없습니다. 대상과 내용을 다시 확인하세요.</div>
                </div>
              </div>
              <div className="au-summary">
                <div className="au-summary__row"><span className="au-summary__l">대상</span><span className="au-summary__v">{confirm.target || tgt.label}</span></div>
                <div className="au-summary__row"><span className="au-summary__l">제목</span><span className="au-summary__v">{confirm.title || title || '—'}</span></div>
              </div>
            </div>
            <div className="bl-modal__foot">
              <div className="bl-modal__notify">
                <input type="checkbox" id="na1-confirm" defaultChecked />
                <div><strong>발송 결과를 활동 로그에 기록</strong></div>
              </div>
              <button className="btn btn--sm" onClick={() => setConfirm(false)}>취소</button>
              <button className="btn btn--sm btn--primary" onClick={() => setConfirm(false)}><span className="ico material-symbols-outlined">send</span>발송</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

window.AdminNotifications = AdminNotifications;

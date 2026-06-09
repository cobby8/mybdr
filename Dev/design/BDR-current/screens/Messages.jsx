/* global React */
// ============================================================
// BDR v2.29 — Messages (NU2 · Phase 9B · 보강 carry · BN2 ★★★)
// 운영: /messages (655 · Phase 8 v2 박제 · DB 미지원 정적 더미) — 시각 정리.
//
// ★ DB 0% 지원 — messages 모델 없음. mock 더미 carry (변경 ❌) + "준비 중" warn-soft 통일.
// 3컬럼 (스레드 list / 대화창 / 프로필 레일). 모바일 = list↔convo 토글.
// ============================================================
function Messages() {
  const threads = window.MSG_THREADS;
  const [active, setActive] = React.useState('t1');
  const [text, setText] = React.useState('');
  const current = threads.find(t => t.id === active) || threads[0];
  const unreadTotal = threads.reduce((s, t) => s + (t.unread || 0), 0);

  return (
    <div className="pm-page">
      <div className="pm-page__inner bl-wide">
        {/* 준비 중 안내 (warn-soft 통일 · Phase 6.3 GU2 답습) */}
        <div className="gw-ph" style={{ marginBottom: 14 }}>
          <span className="gw-ph__ico ico material-symbols-outlined">construction</span>
          <div className="gw-ph__body">
            <div className="gw-ph__t">메시지는 준비 중이에요 <span className="gw-soon"><span className="ico material-symbols-outlined">schedule</span>준비 중</span></div>
            <div className="gw-ph__d">현재 화면은 UI 미리보기로만 동작합니다. 실시간 메시지 기능이 곧 제공됩니다.</div>
          </div>
        </div>

        <div className="bl-crumb">
          <a href="p2-uc2-home.html">홈</a><span className="sep">›</span><span className="cur">쪽지</span>
        </div>

        <div className="nt-msg-shell">
          {/* LIST */}
          <div className="nt-msg-col nt-msg-col--list">
            <div className="nt-msg-head">
              <h2>쪽지 <span className="nt-msg-head__count">{unreadTotal}</span></h2>
              <button className="btn btn--sm" style={{ minHeight: 32 }}><span className="ico material-symbols-outlined">edit_square</span></button>
            </div>
            <div className="nt-msg-search"><input placeholder="대화 검색" /></div>
            <div className="nt-thread-list">
              {threads.map(t => (
                <div key={t.id} className={'nt-thread' + (active === t.id ? ' is-on' : '')} onClick={() => setActive(t.id)}>
                  <window.MsgAvatar tag={t.tag} color={t.color} online={t.online} />
                  <div className="nt-thread__body">
                    <div className="nt-thread__top">
                      <span className="nt-thread__name">
                        {t.pinned && <span className="ico material-symbols-outlined">push_pin</span>}
                        {t.group && <span className="ico material-symbols-outlined">groups</span>}
                        {t.official && <span className="ico material-symbols-outlined">verified</span>}
                        {t.name}
                      </span>
                      <span className="nt-thread__time">{t.time}</span>
                    </div>
                    <div className="nt-thread__top">
                      <span className="nt-thread__last">{t.last}</span>
                      {t.unread > 0 && <span className="nt-thread__unread">{t.unread}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CONVO */}
          <div className="nt-msg-col nt-msg-col--convo nt-convo">
            <div className="nt-convo__head">
              <window.MsgAvatar tag={current.tag} color={current.color} size={36} online={current.online} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="nt-convo__name">{current.name}</div>
                {current.online && <div className="nt-convo__status">● 온라인</div>}
              </div>
              <button className="btn btn--sm" style={{ minHeight: 32 }}><span className="ico material-symbols-outlined">more_horiz</span></button>
            </div>
            <div className="nt-convo__body">
              {window.MSG_CONVO.map((m, i) => (
                <div key={i} className={'nt-bubble nt-bubble--' + m.from}>
                  {m.body}
                  {m.attach && (
                    <div className="nt-attach">
                      <div className="nt-attach__t"><span className="ico material-symbols-outlined">sports_basketball</span>{m.attach.title}</div>
                      <div className="nt-attach__m">{m.attach.date} · {m.attach.court}</div>
                    </div>
                  )}
                  <div className="nt-bubble__time">{m.time}</div>
                </div>
              ))}
            </div>
            <div className="nt-convo__input">
              <input value={text} onChange={e => setText(e.target.value)} placeholder="메시지 입력 (준비 중)" />
              <button className="nt-convo__send" onClick={() => setText('')}><span className="ico material-symbols-outlined">send</span></button>
            </div>
          </div>

          {/* RAIL */}
          <div className="nt-msg-col nt-msg-col--rail nt-rail">
            <div className="nt-rail__center">
              <window.MsgAvatar tag={current.tag} color={current.color} size={64} />
              <div className="nt-rail__name">{current.name}</div>
              <div className="nt-rail__tag">{current.team ? current.team + ' 팀' : current.group ? '단체 대화' : '1:1 대화'}{current.members ? ' · ' + current.members + '명' : ''}</div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <div className="nt-rail__section-t">바로가기</div>
              <a className="cv-xlink" href="tu2-team-detail.html" style={{ marginBottom: 6 }}>
                <span className="cv-xlink__ico" style={{ background: 'var(--ok-soft)' }}><span className="ico material-symbols-outlined" style={{ color: 'var(--ok)' }}>groups</span></span>
                <div className="cv-xlink__body"><div className="cv-xlink__t">팀 페이지</div></div>
                <span className="cv-xlink__arr ico material-symbols-outlined">chevron_right</span>
              </a>
            </div>
            <div>
              <div className="nt-rail__section-t">알림 설정</div>
              <label className="gw-srow" style={{ padding: '8px 0' }}><div className="gw-srow__body"><div className="gw-srow__t" style={{ fontSize: 12.5 }}>메시지 알림</div></div><input type="checkbox" defaultChecked style={{ width: 16, height: 16, accentColor: 'var(--cafe-blue)' }} /></label>
              <label className="gw-srow" style={{ padding: '8px 0', borderBottom: 0 }}><div className="gw-srow__body"><div className="gw-srow__t" style={{ fontSize: 12.5 }}>상단 고정</div></div><input type="checkbox" style={{ width: 16, height: 16, accentColor: 'var(--cafe-blue)' }} /></label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

window.Messages = Messages;

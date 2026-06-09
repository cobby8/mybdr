/* global React */
// ============================================================
// BDR v2.29 — Notifications (NU1 · Phase 9B · 보강 · BN1 ★★★★)
// 운영: /notifications (96 · NotificationsClient v2) — 카테고리 보강.
//
// Hero + 카테고리 chip sticky(NotifCategory: 전체/대회/경기/팀/커뮤니티/시스템) +
// 읽음/안읽음 토글 + 카드 list(아이콘+카테고리 badge+시간) + "모두 읽음" +
// main bar 카운트 동기화 + deep link (Phase 1~8).
// ============================================================
function Notifications() {
  const all = window.NOTIFICATIONS;
  const cats = window.NOTIF_CATS;
  const [cat, setCat] = React.useState('all');
  const [unreadOnly, setUnreadOnly] = React.useState(false);
  const [items, setItems] = React.useState(all);

  // 카테고리별 unread count
  const unreadByCat = {};
  cats.forEach(c => { unreadByCat[c.key] = items.filter(n => n.status === 'unread' && (c.key === 'all' || n.cat === c.key)).length; });
  const totalUnread = items.filter(n => n.status === 'unread').length;

  let rows = items;
  if (cat !== 'all') rows = rows.filter(n => n.cat === cat);
  if (unreadOnly) rows = rows.filter(n => n.status === 'unread');

  const markAll = () => setItems(items.map(n => ({ ...n, status: 'read' })));
  const markOne = (id) => setItems(items.map(n => n.id === id ? { ...n, status: 'read' } : n));

  return (
    <div className="pm-page">
      <div className="pm-page__inner bl-wide">
        {/* Hero */}
        <header className="pm-hero" style={{ marginBottom: 12 }}>
          <div className="pm-hero__row">
            <div className="pm-hero__body">
              <div className="pm-hero__namerow">
                <h1 className="pm-hero__name">알림</h1>
                {totalUnread > 0 && <span className="bl-pstat" data-tone="err" style={{ fontSize: 12 }}>{totalUnread} 안 읽음</span>}
              </div>
              <p className="pm-hero__bio">경기 초대, 팀 소식, 대회·결제 알림을 한 곳에서 확인하세요.</p>
            </div>
          </div>
        </header>

        {/* main bar 동기화 안내 */}
        <div className="nt-synced">
          <span className="ico material-symbols-outlined">sync</span>
          상단 알림 아이콘의 빨간 점 카운트({totalUnread})와 실시간 동기화됩니다.
        </div>

        {/* 카테고리 chip (sticky) */}
        <div className="nt-chiprow">
          {cats.map(c => (
            <button key={c.key} className={'nt-chip' + (cat === c.key ? ' is-on' : '')} onClick={() => setCat(c.key)}>
              <span className="ico material-symbols-outlined">{c.ico}</span>{c.label}
              {unreadByCat[c.key] > 0 && <span className="nt-chip__count">{unreadByCat[c.key]}</span>}
            </button>
          ))}
        </div>

        {/* toolbar */}
        <div className="nt-toolbar">
          <div className="nt-seg">
            <button className={!unreadOnly ? 'is-on' : ''} onClick={() => setUnreadOnly(false)}>전체</button>
            <button className={unreadOnly ? 'is-on' : ''} onClick={() => setUnreadOnly(true)}>안 읽음</button>
          </div>
          <button className="btn btn--sm" onClick={markAll}><span className="ico material-symbols-outlined">done_all</span>모두 읽음</button>
        </div>

        {/* list */}
        {rows.length > 0 ? rows.map(n => (
          <a key={n.id} className="nt-card" data-unread={n.status === 'unread'} href={n.href} onClick={() => markOne(n.id)}>
            <window.NotifIcon cat={n.cat} />
            <div className="nt-card__body">
              <div className="nt-card__top">
                <window.CatBadge cat={n.cat} />
                <span className="nt-card__title">{n.title}</span>
                <span className="nt-card__time">{n.time}</span>
              </div>
              <div className="nt-card__content">{n.content}</div>
            </div>
            <span className="nt-card__arr ico material-symbols-outlined">chevron_right</span>
          </a>
        )) : (
          <div className="pm-empty"><span className="ico material-symbols-outlined">notifications_off</span><p>해당 알림이 없습니다</p></div>
        )}
      </div>
    </div>
  );
}

window.Notifications = Notifications;

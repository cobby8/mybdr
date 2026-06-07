/* global React */
// ============================================================
// BDR v2.28 — PartnerVenue (VP2 · Phase 8A · 신규 · BV5 ★★★)
// 운영: /partner-admin/venue (259) · 박제 ❌ → Phase 4 OO2 답습 4 sub-tab.
// 측: Court Operator (파트너).
//
// 탭1 기본 정보 / 탭2 시간·가격 / 탭3 정책 / 탭4 통계 (예약·매출·평점 추세).
// ============================================================
const VP2_TABS = [
  { key: 'basic',  lbl: '기본 정보', ico: 'badge' },
  { key: 'hours',  lbl: '시간·가격', ico: 'schedule' },
  { key: 'policy', lbl: '정책',      ico: 'gavel' },
  { key: 'stats',  lbl: '통계',      ico: 'analytics' },
];

function Field({ label, value, type = 'text', children }) {
  return (
    <div className="bl-field">
      <label className="bl-field__l">{label}</label>
      {children || <input className="pm-input" defaultValue={value} type={type} />}
    </div>
  );
}

function PartnerVenue() {
  const [tab, setTab] = React.useState('basic');
  const c = window.PARTNER_COURTS[0];

  return (
    <div className="pm-page">
      <div className="pm-page__inner bl-wide">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: 16 }}>
          <div>
            <window.CourtOperatorBadge />
            <h1 style={{ fontFamily: 'var(--ff-display)', fontSize: 26, fontWeight: 900, letterSpacing: '-0.02em', margin: '8px 0 0', color: 'var(--ink)' }}>대관 정보 관리</h1>
            <div style={{ fontSize: 13, color: 'var(--ink-mute)', marginTop: 2 }}>{c.name} · {c.city}</div>
          </div>
          <button className="btn btn--primary"><span className="ico material-symbols-outlined">save</span>저장</button>
        </div>

        {/* sub-tabs */}
        <div className="cv-vtabs">
          {VP2_TABS.map(t => (
            <button key={t.key} className={'cv-vtab' + (tab === t.key ? ' is-on' : '')} onClick={() => setTab(t.key)}>
              <span className="ico material-symbols-outlined">{t.ico}</span>{t.lbl}
            </button>
          ))}
        </div>

        {/* TAB 1 — 기본 */}
        {tab === 'basic' && (
          <div className="pm-card">
            <h2 className="pm-card__h" style={{ marginBottom: 16 }}><span className="ico material-symbols-outlined">badge</span>기본 정보</h2>
            <div className="bl-modal-row2">
              <Field label="체육관명" value={c.name} />
              <Field label="유형"><select className="pm-select"><option>실내</option><option>야외</option></select></Field>
            </div>
            <Field label="주소" value="서울 중구 동호로 241" />
            <div className="bl-modal-row2">
              <Field label="담당자 연락처" value="010-2841-7793" type="tel" />
              <Field label="최근역" value="동대입구역 5번 출구" />
            </div>
            <Field label="소개"><textarea className="pm-input" rows={3} defaultValue="동대입구역 인근 실내 농구 전용 체육관입니다." /></Field>
            <div className="pm-sec-title" style={{ margin: '8px 0 10px' }}>코트 사진</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
              {[1, 2, 3].map(i => (<div key={i} style={{ aspectRatio: '1', borderRadius: 4, border: '1px solid var(--border)', display: 'grid', placeItems: 'center', color: 'var(--ink-dim)', fontSize: 10, fontFamily: 'var(--ff-mono)', background: 'repeating-linear-gradient(45deg, var(--bg-alt) 0 8px, var(--bg-head) 8px 16px)' }}>PHOTO {i}</div>))}
              <button style={{ aspectRatio: '1', borderRadius: 4, border: '1px dashed var(--border-strong)', background: 'var(--bg-alt)', cursor: 'pointer', display: 'grid', placeItems: 'center', color: 'var(--ink-mute)' }}><span className="ico material-symbols-outlined">add_photo_alternate</span></button>
            </div>
          </div>
        )}

        {/* TAB 2 — 시간·가격 */}
        {tab === 'hours' && (
          <div className="pm-grid">
            <div className="pm-main">
              <div className="pm-card">
                <h2 className="pm-card__h" style={{ marginBottom: 14 }}><span className="ico material-symbols-outlined">schedule</span>영업 시간</h2>
                {window.VENUE_HOURS.map((h, i) => (
                  <div key={i} className="gw-srow">
                    <div className="gw-srow__body"><div className="gw-srow__t">{h.day}</div></div>
                    <div className="gw-srow__v">{h.close ? h.open + ' – ' + h.close : h.open}</div>
                  </div>
                ))}
              </div>
            </div>
            <aside className="pm-aside">
              <div className="pm-card">
                <h2 className="pm-card__h" style={{ marginBottom: 14 }}><span className="ico material-symbols-outlined">payments</span>대관 가격</h2>
                {window.VENUE_PRICE.map((p, i) => (
                  <div key={i} className="gw-srow">
                    <div className="gw-srow__body"><div className="gw-srow__t" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>{p.label}{p.badge && <span className="bl-tag" style={{ background: 'var(--ok-soft)', color: 'var(--ok)' }}>{p.badge}</span>}</div></div>
                    <div className="gw-srow__v" style={{ fontFamily: 'var(--ff-display)', fontSize: 15, fontWeight: 800 }}>{window.wonRaw(p.price)}</div>
                  </div>
                ))}
              </div>
            </aside>
          </div>
        )}

        {/* TAB 3 — 정책 */}
        {tab === 'policy' && (
          <div className="pm-card">
            <h2 className="pm-card__h" style={{ marginBottom: 16 }}><span className="ico material-symbols-outlined">gavel</span>운영 정책</h2>
            <Field label="예약 정책"><textarea className="pm-input" rows={2} defaultValue="최소 1시간 단위 예약. 예약 시간 10분 전 입장 가능." /></Field>
            <Field label="환불 정책"><textarea className="pm-input" rows={2} defaultValue="이용 24시간 전 취소 시 100% 환불, 24시간 이내 50% 환불." /></Field>
            <Field label="이용 규정"><textarea className="pm-input" rows={3} defaultValue="실내화 필수. 음식물 반입 금지. 시설물 파손 시 배상 책임." /></Field>
          </div>
        )}

        {/* TAB 4 — 통계 */}
        {tab === 'stats' && (
          <div>
            <div className="gw-kpis" style={{ marginBottom: 16 }}>
              <div className="gw-kpi" data-tone="red"><div className="gw-kpi__label">이번달 예약</div><div className="gw-kpi__val">86<span className="gw-kpi__unit">건</span></div><div className="gw-kpi__delta" data-dir="up">▲ 12 <span>vs 지난달</span></div></div>
              <div className="gw-kpi" data-tone="ok"><div className="gw-kpi__label">매출</div><div className="gw-kpi__val">258<span className="gw-kpi__unit">만</span></div><div className="gw-kpi__delta" data-dir="up">▲ 34만 <span>vs 지난달</span></div></div>
              <div className="gw-kpi" data-tone="blue"><div className="gw-kpi__label">평점</div><div className="gw-kpi__val">4.8</div><div className="gw-kpi__delta" data-dir="flat">— <span>유지</span></div></div>
              <div className="gw-kpi" data-tone="gold"><div className="gw-kpi__label">체크인</div><div className="gw-kpi__val">412</div><div className="gw-kpi__delta" data-dir="up">▲ 58 <span>vs 지난달</span></div></div>
            </div>
            <div className="pm-card">
              <h2 className="pm-card__h" style={{ marginBottom: 14 }}><span className="ico material-symbols-outlined">show_chart</span>최근 12주 예약 추세</h2>
              <window.GrowthSpark data={[5, 6, 4, 7, 8, 6, 9, 7, 10, 8, 11, 9]} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

window.PartnerVenue = PartnerVenue;

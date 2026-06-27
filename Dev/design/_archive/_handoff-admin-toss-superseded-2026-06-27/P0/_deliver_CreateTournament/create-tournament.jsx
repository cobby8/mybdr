/* global React, window, Icon, Btn, Badge, Modal, CardHead, Field, CTGameSettings, GAME_SETTINGS_DEFAULTS */

// =====================================================================
// create-tournament.jsx — 새 대회 만들기 (2컬럼 단일 페이지 · Toss)
//   레퍼런스: BDR-join-v1 /admin/tournaments/create
//   · 좌: 대회 정보 + 대회 일정·장소(날짜별 장소 매칭)
//   · 우: 종별·디비전(디비전별 경기날짜·장소 매칭) + 경기 설정(기록앱 정합)
//   종별 = window.Generator(종별 마스터 admin_categories 연동) 재사용.
// =====================================================================
const CT0 = () => window.TOSS;
const CTN = () => window.TN;

// 이전 대회 (불러오기 모달 시드) ─────────────────────────────────────────
const PAST_TOURNAMENTS = [
  { id: 'pt9', name: '강남구협회장배 #9', date: '2026-08-15', venue: '장충체육관', gender: '남성', host: '강남구농구협회', cats: 1, divs: 3 },
  { id: 'pt8', name: '강남구협회장배 #8', date: '2026-05-10', venue: '잠실학생체육관', gender: '남성', host: '강남구농구협회', cats: 2, divs: 5 },
  { id: 'pt-w3', name: '전국 여성부 챌린지 #3', date: '2026-04-12', venue: '올림픽공원 핸드볼경기장', gender: '여성', host: 'BDR 운영위', cats: 1, divs: 4 },
  { id: 'pt-y2', name: '유청소년 스킬업 리그 #2', date: '2026-03-01', venue: '목동 실내체육관', gender: '혼성', host: 'BDR 유소년본부', cats: 1, divs: 5 },
];

// 경기장 검색 DB (코트 마스터 · 지도 API 연결 예정) ──────────────────────
const VENUE_DB = [
  { name: '장충체육관', region: '서울 중구' },
  { name: '잠실학생체육관', region: '서울 송파구' },
  { name: '올림픽공원 핸드볼경기장', region: '서울 송파구' },
  { name: '목동 실내체육관', region: '서울 양천구' },
  { name: '성동구민종합체육관', region: '서울 성동구' },
  { name: '강남구민체육관', region: '서울 강남구' },
  { name: '서초구민체육관', region: '서울 서초구' },
  { name: '마포구민체육센터', region: '서울 마포구' },
  { name: '안양실내체육관', region: '경기 안양시' },
  { name: '수원실내체육관', region: '경기 수원시' },
  { name: '인천삼산월드체육관', region: '인천 부평구' },
];
const TOUR_STATUS = [
  { v: 'draft', label: '작성중' }, { v: 'registering', label: '접수중' },
  { v: 'closed', label: '접수마감' }, { v: 'ongoing', label: '진행중' }, { v: 'done', label: '종료' },
];

// 정규대회(시리즈) — 현재 '시리즈' 백엔드 영역에 연결 예정. 추후 관리 페이지 리뉴얼 시 시리즈 관리포인트 추가.
const REGULAR_SERIES = ['강남구협회장배 시리즈', 'BDR 전국투어', '유청소년 스킬업 리그', '서울시 생활체육 리그'];

const uid = (p) => `${p}${Date.now()}_${Math.random().toString(36).slice(2, 5)}`;
const courtSuffix = (venue, i) => venue.naming === 'alpha' ? String.fromCharCode(65 + i) : String(i + 1);
const courtsOf = (venue) => {
  const cnt = Math.max(1, venue.courtCount || 1);
  if (cnt === 1) return [{ id: `${venue.id}_c0`, label: venue.name, full: venue.name, venueId: venue.id }];
  return Array.from({ length: cnt }, (_, i) => { const c = `${courtSuffix(venue, i)}\ucf54\ud2b8`; return { id: `${venue.id}_c${i}`, label: c, full: `${venue.name} ${c}`, venueId: venue.id }; });
};
const allCourts = (venues) => venues.flatMap(courtsOf);
const fmtDate = (s) => {
  if (!s) return '날짜 미정';
  const dt = new Date(s + 'T00:00:00');
  if (isNaN(dt)) return s;
  const wk = ['일', '월', '화', '수', '목', '금', '토'][dt.getDay()];
  return `${dt.getMonth() + 1}.${dt.getDate()} (${wk})`;
};

// ── 종별 카드 (Generator 산출 · 디비전별 경기날짜·장소 매칭) ──────────────
function CategoryCard({ cat, dates, courts, onUpdateDiv, onRemoveDiv, onRemoveCat }) {
  const genderIcon = cat.gender === '여성' ? 'venus' : cat.gender === '혼성' ? 'venus-and-mars' : 'mars';
  const canMatch = dates.length > 0 || courts.length > 0;
  return (
    <div className="ct-cat">
      <div className="ct-cat__head">
        <Icon name={genderIcon} size={16} color="var(--ink-mute)" />
        <span style={{ fontWeight: 800, fontSize: 14.5, color: 'var(--ink)', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cat.name}</span>
        <Badge tone="grey">{cat.divisions.length}디비전</Badge>
        <button type="button" className="ct-iconbtn" onClick={onRemoveCat} aria-label="종별 삭제"><Icon name="trash-2" size={15} /></button>
      </div>
      <div className="ct-cat__body">
        {cat.divisions.map((dv) =>
          <div key={dv.id} className="ct-dvn">
            <div className="ct-dvn__top">
              <input className="ct-dvn__name" value={dv.name} onChange={(e) => onUpdateDiv(dv.id, { name: e.target.value })} aria-label="디비전명" />
              <select className="ct-dvn__method" value={dv.method} onChange={(e) => onUpdateDiv(dv.id, { method: e.target.value })}>
                {Object.values(CT0().METHODS).map((m) => <option key={m.code} value={m.code}>{m.short}</option>)}
              </select>
              <button type="button" className="ct-iconbtn" onClick={() => onRemoveDiv(dv.id)} aria-label="디비전 삭제"><Icon name="x" size={15} /></button>
            </div>
            <div className="ct-dvn__bottom">
              <label className="ct-inline">
                <span>정원</span>
                <input type="number" min="0" value={dv.cap} onChange={(e) => onUpdateDiv(dv.id, { cap: +e.target.value || 0 })} />
                <span className="ct-unit">팀</span>
              </label>
              <label className="ct-inline">
                <span>참가비</span>
                <span className="ct-unit">₩</span>
                <input type="number" min="0" step="5000" value={dv.fee} onChange={(e) => onUpdateDiv(dv.id, { fee: +e.target.value || 0 })} />
              </label>
            </div>
            {/* 경기 날짜 · 장소 매칭 (의뢰) */}
            {canMatch ?
              <div className="ct-dvn__match">
                <label className="ct-msel">
                  <Icon name="calendar" size={14} color="var(--ink-mute)" />
                  <select value={dv.dateId || ''} onChange={(e) => onUpdateDiv(dv.id, { dateId: e.target.value })}>
                    <option value="">경기 날짜</option>
                    {dates.map((dt) => <option key={dt.id} value={dt.id}>{fmtDate(dt.date)}</option>)}
                  </select>
                </label>
                <label className="ct-msel">
                  <Icon name="map-pin" size={14} color="var(--ink-mute)" />
                  <select value={dv.courtId || ''} onChange={(e) => onUpdateDiv(dv.id, { courtId: e.target.value })}>
                    <option value="">코트</option>
                    {(() => { const sd = dates.find((dt) => dt.id === dv.dateId); const opts = sd && sd.courtIds && sd.courtIds.length ? courts.filter((c) => sd.courtIds.includes(c.id)) : courts; return opts.map((c) => <option key={c.id} value={c.id}>{c.full}</option>); })()}
                  </select>
                </label>
              </div> :
              <div className="ct-dvn__matchempty"><Icon name="info" size={13} />좌측 <b>대회 일정·장소</b>를 추가하면 디비전별 경기날짜·코트를 매칭할 수 있습니다</div>}
          </div>)}
      </div>
    </div>);
}

// ── DivisionGenerator (종별 마스터 연동 · 연령 축) ────────────────────────
function DivisionGenerator({ open, onClose, onGenerate, toast }) {
  const T0 = CT0();
  const [gender, setGender] = React.useState('남성');
  const [tplId, setTplId] = React.useState('');
  const [divs, setDivs] = React.useState([]);
  const [ages, setAges] = React.useState([]);
  React.useEffect(() => { if (open) { setGender('남성'); setTplId(''); setDivs([]); setAges([]); } }, [open]);
  const tpl = T0.CATEGORY_MASTER.find((c) => c.id === tplId);
  const hasAges = tpl && tpl.ages && tpl.ages.length > 0;
  const toggle = (arr, set, v) => set(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);
  const wfix = (dn) => gender === '여성' ? `${dn}w` : dn;

  const gen = () => {
    if (!tpl || !divs.length) return;
    const method = T0.METHODS.group_stage_knockout ? 'group_stage_knockout' : 'single_elimination';
    let divisions;
    if (hasAges && ages.length) {
      divisions = [];
      divs.forEach((dn) => ages.forEach((ag) => divisions.push(window.TN.tnDivision(`${wfix(dn)} ${ag}`, method, { age: ag }))));
    } else {
      divisions = divs.map((dn) => window.TN.tnDivision(wfix(dn), method));
    }
    const cat = { id: uid('c'), name: `${gender} ${tpl.name}`.trim(), gender, divisions };
    onGenerate(cat);
    toast(`'${cat.name}' 종별 생성 · 디비전 ${divisions.length}개`);
    onClose();
  };
  const totalDivs = hasAges && ages.length ? divs.length * ages.length : divs.length;

  return (
    <Modal open={open} onClose={onClose} title="새 종별 추가" sub="성별·종별 템플릿을 고르고 디비전을 선택하면 종별이 생성됩니다. 유청소년 등은 연령도 함께 선택합니다."
      foot={<><Btn variant="secondary" onClick={onClose} style={{ flex: 1 }}>취소</Btn><Btn onClick={gen} disabled={!tpl || !divs.length} icon="plus" style={{ flex: 2, opacity: (tpl && divs.length) ? 1 : .5 }}>종별 생성 {totalDivs ? `(${totalDivs})` : ''}</Btn></>}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div>
          <div className="ts-field__label">1단계 · 성별</div>
          <div className="ts-segment">{['남성', '여성'].map((g) => <button key={g} type="button" className="ts-segment__btn" data-active={gender === g ? 'true' : 'false'} onClick={() => setGender(g)}>{g}</button>)}</div>
        </div>
        <div>
          <div className="ts-field__label">2단계 · 종별 템플릿</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>{T0.CATEGORY_MASTER.map((c) => <button key={c.id} type="button" className="ts-chip" data-active={tplId === c.id ? 'true' : 'false'} onClick={() => { setTplId(c.id); setDivs([]); setAges([]); }}>{c.name}{c.ages && c.ages.length ? <span style={{ fontSize: 11, color: 'var(--ink-dim)', marginLeft: 4 }}>연령</span> : null}</button>)}</div>
        </div>
        <div style={{ opacity: tpl ? 1 : .4, pointerEvents: tpl ? 'auto' : 'none' }}>
          <div className="ts-field__label">3단계 · 디비전 {divs.length > 0 && <span style={{ color: 'var(--primary)' }}>({divs.length})</span>}</div>
          {tpl ? <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>{tpl.divisions.map((dn) => <button key={dn} type="button" className="ts-chip" data-active={divs.includes(dn) ? 'true' : 'false'} onClick={() => toggle(divs, setDivs, dn)}>{divs.includes(dn) && <Icon name="check" size={13} />}{gender === '여성' ? wfix(dn) : dn}</button>)}</div>
            : <div style={{ padding: 18, textAlign: 'center', color: 'var(--ink-dim)', fontSize: 13, background: 'var(--grey-50)', borderRadius: 12 }}>종별 템플릿을 먼저 선택하세요</div>}
          {tpl && gender === '여성' && <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: '#6D5AE6', marginTop: 9 }}><Icon name="info" size={14} color="#6D5AE6" />여성부는 디비전 뒤에 <b style={{ margin: '0 2px' }}>w</b>가 붙습니다 (예: D4 → D4w).</div>}
        </div>
        {hasAges &&
          <div>
            <div className="ts-field__label">4단계 · 연령 <span style={{ color: 'var(--ink-mute)', fontWeight: 600 }}>(선택)</span> {ages.length > 0 && <span style={{ color: '#6D5AE6' }}>({ages.length})</span>}</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>{tpl.ages.map((ag) => <button key={ag} type="button" className="ts-chip ts-chip--age" data-active={ages.includes(ag) ? 'true' : 'false'} style={ages.includes(ag) ? { borderColor: '#6D5AE6', background: '#F3F0FE', color: '#6D5AE6' } : undefined} onClick={() => toggle(ages, setAges, ag)}>{ages.includes(ag) && <Icon name="check" size={12} />}{ag}</button>)}</div>
            <div style={{ fontSize: 12.5, color: 'var(--ink-mute)', marginTop: 9 }}>{ages.length ? <>디비전 {divs.length} × 연령 {ages.length} = <b style={{ color: 'var(--ink)' }}>{totalDivs}개</b> 디비전 생성 (예: <b style={{ color: 'var(--ink)' }}>{wfix(divs[0] || '하모니')} {ages[0]}</b>)</> : '연령을 선택하면 디비전별로 연령 디비전이 생성됩니다. 미선택 시 디비전만 생성됩니다.'}</div>
          </div>}
      </div>
    </Modal>);
}

// ── 이전 대회 불러오기 모달 ───────────────────────────────────────────
function LoadPreviousModal({ open, onClose, onLoad }) {
  const [q, setQ] = React.useState('');
  React.useEffect(() => { if (open) setQ(''); }, [open]);
  const rows = PAST_TOURNAMENTS.filter((t) => t.name.toLowerCase().includes(q.trim().toLowerCase()));
  return (
    <Modal open={open} onClose={onClose} title="이전 대회 불러오기"
      sub="기존 대회의 형식·설정·종별 구성을 그대로 가져와 채웁니다. 날짜·참가팀은 제외됩니다.">
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, padding: '0 14px', background: 'var(--grey-100)', borderRadius: 'var(--radius-input)' }}>
        <Icon name="search" size={18} color="var(--ink-dim)" />
        <input className="ts-input" style={{ background: 'transparent', padding: '13px 0' }} value={q} onChange={(e) => setQ(e.target.value)} placeholder="대회명으로 검색" />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {rows.map((t) =>
          <button key={t.id} type="button" className="ct-pastrow" onClick={() => onLoad(t)}>
            <span className="ct-pastrow__icon"><Icon name="trophy" size={18} color="var(--primary)" /></span>
            <span style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
              <span style={{ display: 'block', fontWeight: 700, fontSize: 14.5, color: 'var(--ink)' }}>{t.name}</span>
              <span style={{ display: 'block', fontSize: 12.5, color: 'var(--ink-mute)', marginTop: 2 }}>{t.date} · {t.venue} · {t.cats}종별 {t.divs}디비전</span>
            </span>
            <Icon name="chevron-right" size={18} color="var(--ink-dim)" />
          </button>)}
        {rows.length === 0 && <div style={{ padding: '32px 0', textAlign: 'center', color: 'var(--ink-mute)', fontSize: 14 }}>검색 결과가 없습니다</div>}
      </div>
    </Modal>);
}

// 경기장 검색 (코트 마스터 자동완성 + 직접 추가) ────────────────────────
function VenueSearch({ venues, onAdd }) {
  const [q, setQ] = React.useState('');
  const [open, setOpen] = React.useState(false);
  const ql = q.trim().toLowerCase();
  const names = venues.map((v) => v.name);
  const results = VENUE_DB.filter((v) => !names.includes(v.name) && (v.name + ' ' + v.region).toLowerCase().includes(ql)).slice(0, 8);
  const exact = VENUE_DB.some((v) => v.name === q.trim()) || names.includes(q.trim());
  const pick = (name, region) => { onAdd(name, region); setQ(''); setOpen(false); };
  return (
    <div className="ct-vsearch">
      <div className="ct-vsearch__inputwrap">
        <Icon name="search" size={18} color="var(--ink-dim)" />
        <input value={q} placeholder="경기장명·지역으로 검색 (지도 연결 예정)" onChange={(e) => { setQ(e.target.value); setOpen(true); }} onFocus={() => setOpen(true)} onBlur={() => setTimeout(() => setOpen(false), 150)} onKeyDown={(e) => { if (e.key === 'Enter' && q.trim()) { e.preventDefault(); pick(q.trim(), ''); } }} />
        {q && <button type="button" className="ct-iconbtn" onMouseDown={(e) => e.preventDefault()} onClick={() => setQ('')} aria-label="지우기"><Icon name="x" size={15} /></button>}
      </div>
      {open && (results.length > 0 || (ql && !exact)) &&
        <div className="ct-vsearch__menu">
          {results.map((v) =>
            <button key={v.name} type="button" className="ct-vsearch__opt" onMouseDown={(e) => e.preventDefault()} onClick={() => pick(v.name, v.region)}>
              <Icon name="map-pin" size={16} color="var(--primary)" />
              <span style={{ flex: 1, minWidth: 0 }}><span style={{ display: 'block', fontWeight: 600, fontSize: 14, color: 'var(--ink)' }}>{v.name}</span><span style={{ fontSize: 12, color: 'var(--ink-mute)' }}>{v.region}</span></span>
            </button>)}
          {ql && !exact &&
            <button type="button" className="ct-vsearch__opt ct-vsearch__add" onMouseDown={(e) => e.preventDefault()} onClick={() => pick(q.trim(), '')}>
              <Icon name="plus" size={16} color="var(--primary)" /><span style={{ fontWeight: 700, color: 'var(--primary)' }}>“{q.trim()}” 직접 추가</span>
            </button>}
        </div>}
    </div>);
}

// 대회 일정 · 장소 (날짜 다중 + 장소 다중 + 날짜별 장소 매칭) ──────────────
// 캘린더 다중 선택 모달 (대회 일정) ──────────────────────────────────────
const _CAL_WK = ['일', '월', '화', '수', '목', '금', '토'];
const _pad2 = (n) => String(n).padStart(2, '0');
const _dkey = (y, m, d) => `${y}-${_pad2(m + 1)}-${_pad2(d)}`;
const fmtDateFull = (s) => {
  if (!s) return '날짜 미정';
  const dt = new Date(s + 'T00:00:00');
  if (isNaN(dt)) return s;
  return `${dt.getFullYear()}.${_pad2(dt.getMonth() + 1)}.${_pad2(dt.getDate())} (${_CAL_WK[dt.getDay()]})`;
};

function CalendarModal({ open, selected, onClose, onConfirm }) {
  const [sel, setSel] = React.useState(() => new Set(selected));
  const [cur, setCur] = React.useState(() => { const s0 = selected.slice().sort()[0]; const base = s0 ? new Date(s0 + 'T00:00:00') : new Date(); return { y: base.getFullYear(), m: base.getMonth() }; });
  React.useEffect(() => {
    if (!open) return;
    setSel(new Set(selected));
    const s0 = selected.slice().sort()[0];
    const base = s0 ? new Date(s0 + 'T00:00:00') : new Date();
    setCur({ y: base.getFullYear(), m: base.getMonth() });
  }, [open]);
  const startWd = new Date(cur.y, cur.m, 1).getDay();
  const days = new Date(cur.y, cur.m + 1, 0).getDate();
  const now = new Date();
  const todayK = _dkey(now.getFullYear(), now.getMonth(), now.getDate());
  const cells = [];
  for (let i = 0; i < startWd; i++) cells.push(null);
  for (let dd = 1; dd <= days; dd++) cells.push(dd);
  const toggle = (dd) => { const k = _dkey(cur.y, cur.m, dd); const ns = new Set(sel); ns.has(k) ? ns.delete(k) : ns.add(k); setSel(ns); };
  const move = (delta) => { let m = cur.m + delta, y = cur.y; if (m < 0) { m = 11; y--; } if (m > 11) { m = 0; y++; } setCur({ y, m }); };
  return (
    <Modal open={open} onClose={onClose} title="대회 일정 선택" maxWidth={440}
      sub="경기가 열리는 날짜를 여러 날 선택하세요. 선택된 날짜를 다시 누르면 해제됩니다."
      foot={<><Btn variant="secondary" onClick={onClose} style={{ flex: 1 }}>취소</Btn><Btn icon="check" style={{ flex: 2 }} onClick={() => onConfirm([...sel])}>선택 완료 ({sel.size}일)</Btn></>}>
      <div className="ct-cal">
        <div className="ct-cal__nav">
          <button type="button" onClick={() => move(-1)} aria-label="이전 달"><Icon name="chevron-left" size={18} /></button>
          <span className="ct-cal__title">{cur.y}년 {cur.m + 1}월</span>
          <button type="button" onClick={() => move(1)} aria-label="다음 달"><Icon name="chevron-right" size={18} /></button>
        </div>
        <div className="ct-cal__wk">{_CAL_WK.map((w, i) => <span key={w} data-wd={i}>{w}</span>)}</div>
        <div className="ct-cal__grid">
          {cells.map((dd, i) => {
            if (dd === null) return <span key={'e' + i} className="ct-cal__pad" />;
            const k = _dkey(cur.y, cur.m, dd);
            const wd = (startWd + dd - 1) % 7;
            return <button key={k} type="button" className="ct-cal__day" data-on={sel.has(k) ? 'true' : 'false'} data-today={k === todayK ? 'true' : 'false'} data-wd={wd} onClick={() => toggle(dd)}>{dd}</button>;
          })}
        </div>
        {sel.size > 0 && <div className="ct-cal__count"><Icon name="calendar-check" size={14} color="var(--primary)" />{sel.size}일 선택됨</div>}
      </div>
    </Modal>);
}

function ScheduleVenue({ dates, venues, courts, syncDates, removeDate, addVenue, updateVenue, removeVenue, toggleDateCourt, toast }) {
  const [calOpen, setCalOpen] = React.useState(false);
  return (
    <section className="ts-card">
      <CardHead icon="calendar-days" title="대회 일정 · 장소" />

      {/* 장소 · 코트 */}
      <Field label="장소 · 코트" required hint="장소를 등록하고 코트 수를 지정하세요 · 한 장소에 여러 코트 가능">
        <VenueSearch venues={venues} onAdd={addVenue} />
        {venues.length === 0 ?
          <div className="ct-emptybox"><Icon name="map-pin-off" size={22} color="var(--ink-dim)" /><span>등록된 장소가 없습니다</span></div> :
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {venues.map((v) =>
              <div key={v.id} className="ct-venuerow">
                <div className="ct-venuerow__top">
                  <Icon name="map-pin" size={15} color="var(--primary)" />
                  <span className="ct-venuerow__nm">{v.name}</span>
                  {v.region && <span className="ct-venuerow__rg">{v.region}</span>}
                  <button type="button" className="ct-iconbtn" onClick={() => removeVenue(v.id)} aria-label="장소 삭제"><Icon name="x" size={15} /></button>
                </div>
                <div className="ct-venuerow__ctrl">
                  <span className="ct-venuerow__lbl">코트 수</span>
                  <window.Stepper value={v.courtCount || 1} unit="개" min={1} max={8} onChange={(n) => updateVenue(v.id, { courtCount: n })} />
                  {(v.courtCount || 1) >= 2 &&
                    <div className="ct-namesel">
                      <span className="ct-venuerow__lbl">명칭</span>
                      <window.SegSm options={['숫자', '알파벳']} index={v.naming === 'alpha' ? 1 : 0} onSelect={(i) => updateVenue(v.id, { naming: i === 1 ? 'alpha' : 'num' })} />
                    </div>}
                </div>
                {(v.courtCount || 1) >= 2 &&
                  <div className="ct-courtchips">
                    {courtsOf(v).map((c) => <span key={c.id} className="ct-courttag">{c.label}</span>)}
                  </div>}
              </div>)}
          </div>}
      </Field>

      {/* 대회 일정 (캘린더 다중 선택 · 날짜별 코트 배정) */}
      <Field label="대회 일정" required hint="캘린더에서 경기일을 선택 · 날짜별로 코트를 배정하세요">
        {dates.length > 0 &&
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 10 }}>
            {dates.map((dt, i) =>
              <div key={dt.id} className="ct-dateblock">
                <div className="ct-dateblock__head">
                  <span className="ct-daterow__idx">{i + 1}일차</span>
                  <span className="ct-daterow__label">{fmtDateFull(dt.date)}</span>
                  <span className="ct-dateblock__n">{(dt.courtIds || []).length}코트</span>
                  <button type="button" className="ct-iconbtn" onClick={() => removeDate(dt.id)} aria-label="날짜 삭제"><Icon name="x" size={15} /></button>
                </div>
                {courts.length > 0 ?
                  <div className="ct-courtpick">
                    {courts.map((c) => { const on = (dt.courtIds || []).includes(c.id); return <button key={c.id} type="button" className="ct-courtpick__chip" data-on={on ? 'true' : 'false'} onClick={() => toggleDateCourt(dt.id, c.id)}>{on && <Icon name="check" size={12} />}{c.full}</button>; })}
                  </div> :
                  <div className="ct-courthint"><Icon name="info" size={13} />장소·코트를 먼저 등록하면 날짜별로 코트를 배정할 수 있습니다</div>}
              </div>)}
          </div>}
        <button type="button" className="ct-adddate" onClick={() => setCalOpen(true)}><Icon name="calendar-plus" size={16} />일정 선택{dates.length > 0 ? ` · ${dates.length}일` : ''}</button>
      </Field>
      <CalendarModal open={calOpen} selected={dates.map((dt) => dt.date).filter(Boolean)} onClose={() => setCalOpen(false)} onConfirm={(ds) => { syncDates(ds); setCalOpen(false); }} />
    </section>);
}

// 후원사 (로고 슬롯 포함 — 드래그&드롭) ──────────────────────────────────
function SponsorField({ sponsors, setSponsors, toast }) {
  const [name, setName] = React.useState('');
  const add = () => { const v = name.trim(); if (!v) return; if (sponsors.some((s) => s.name === v)) { toast('이미 추가된 후원사입니다'); return; } setSponsors([...sponsors, { id: uid('sp'), name: v }]); setName(''); };
  const remove = (id) => setSponsors(sponsors.filter((s) => s.id !== id));
  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: sponsors.length ? 12 : 0 }}>
        <input className="ts-input" value={name} placeholder="후원사명을 입력하세요" onChange={(e) => setName(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add(); } }} />
        <Btn variant="secondary" icon="plus" onClick={add}>추가</Btn>
      </div>
      {sponsors.length > 0 &&
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
          {sponsors.map((s) =>
            <div key={s.id} className="ct-sptile">
              <button type="button" className="ct-sptile__x" onClick={() => remove(s.id)} aria-label="후원사 삭제"><Icon name="x" size={13} /></button>
              <image-slot id={`spl_${s.id}`} shape="rounded" radius="10" placeholder="로고 드래그" style={{ width: '100%', height: 74, display: 'block' }}></image-slot>
              <div className="ct-sptile__name">{s.name}</div>
            </div>)}
        </div>}
    </div>);
}

// 대회 게시 설정 모달 (대회 생성 시 — 게시/참가신청/참가비/결제/계좌) ─────
const PAY_METHODS = [['계좌이체', 'bank', false], ['간편결제', 'easy', true], ['카드 결제', 'card', true]];
const BANKS = ['국민', '신한', '우리', '하나', '농협', '기업', '카카오뱅크', '토스뱅크', '새마을금고'];

function PublishModal({ open, name, saving, onClose, onConfirm }) {
  const blank = { postStart: '', postEnd: '', regStart: '', regEnd: '', pays: ['bank'], bank: '국민', account: '', holder: '' };
  const [p, setP] = React.useState(blank);
  React.useEffect(() => { if (open) setP(blank); }, [open]);
  const set = (k, v) => setP((s) => ({ ...s, [k]: v }));
  return (
    <Modal open={open} onClose={onClose} title="대회 게시 설정" maxWidth={540}
      sub="게시·참가신청·결제 정보를 입력하고 대회를 생성하세요.">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '11px 13px', background: 'var(--primary-weak)', borderRadius: 12 }}>
          <Icon name="trophy" size={17} color="var(--primary)" />
          <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--ink)' }}>{name || '새 대회'}</span>
        </div>
        <Field label="게시 기간" hint="대회 페이지가 공개되는 기간">
          <div className="ct-daterange">
            <input className="ts-input" type="date" value={p.postStart} onChange={(e) => set('postStart', e.target.value)} />
            <span className="ct-daterange__sep">~</span>
            <input className="ts-input" type="date" value={p.postEnd} onChange={(e) => set('postEnd', e.target.value)} />
          </div>
        </Field>
        <Field label="참가신청 기간" hint="참가팀이 신청할 수 있는 기간">
          <div className="ct-daterange">
            <input className="ts-input" type="date" value={p.regStart} onChange={(e) => set('regStart', e.target.value)} />
            <span className="ct-daterange__sep">~</span>
            <input className="ts-input" type="date" value={p.regEnd} onChange={(e) => set('regEnd', e.target.value)} />
          </div>
        </Field>
        <Field label="결제 방법" hint="여러 개 선택 가능 · 현재 계좌이체만 지원">
          <div className="ct-paygrid">{PAY_METHODS.map(([lbl, val, soon]) => { const on = p.pays.includes(val); return (
            <button key={val} type="button" className="ct-paychip" data-on={on ? 'true' : 'false'} disabled={soon}
              onClick={() => { if (soon) return; set('pays', on ? p.pays.filter((x) => x !== val) : [...p.pays, val]); }}>
              <span className="ct-paychip__box">{on && <Icon name="check" size={13} />}</span>
              <span className="ct-paychip__lbl">{lbl}</span>
              {soon && <span className="ct-paychip__soon">준비 중</span>}
            </button>); })}</div>
        </Field>
        {p.pays.includes('bank') &&
          <Field label="입금 계좌" hint="참가비를 입금받을 계좌">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', gap: 8 }}>
                <select className="ts-select" style={{ flex: '0 0 130px' }} value={p.bank} onChange={(e) => set('bank', e.target.value)}>{BANKS.map((b) => <option key={b} value={b}>{b}</option>)}</select>
                <input className="ts-input" value={p.account} onChange={(e) => set('account', e.target.value)} placeholder="계좌번호" inputMode="numeric" />
              </div>
              <input className="ts-input" value={p.holder} onChange={(e) => set('holder', e.target.value)} placeholder="예금주" />
            </div>
          </Field>}
      </div>
      <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
        <Btn variant="secondary" onClick={onClose} style={{ flex: 1 }} disabled={saving}>취소</Btn>
        <Btn icon={saving ? undefined : 'check'} style={{ flex: 2, opacity: saving ? .7 : 1 }} disabled={saving} onClick={() => onConfirm(p)}>{saving ? <span className="ct-spin" /> : null}{saving ? '생성 중…' : '대회 생성'}</Btn>
      </div>
    </Modal>);
}

// ── 메인 ──────────────────────────────────────────────────────────────
function CreateTournament({ onCancel, onCreated, toast }) {
  const [d, setD] = React.useState({
    name: '', isRegular: false, seriesId: '', seriesName: '',
    organizer: '', host: '', poster: '',
    ...GAME_SETTINGS_DEFAULTS,
  });
  const [dates, setDates] = React.useState([]);
  const [venues, setVenues] = React.useState([]);
  const [sponsors, setSponsors] = React.useState([]);
  const [categories, setCategories] = React.useState([]);
  const [genOpen, setGenOpen] = React.useState(false);
  const [loadOpen, setLoadOpen] = React.useState(false);
  const [touched, setTouched] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [pubOpen, setPubOpen] = React.useState(false);

  const set = (k, v) => setD((p) => ({ ...p, [k]: v }));
  const nameOk = d.name.trim().length > 0;
  const totalDiv = categories.reduce((a, c) => a + c.divisions.length, 0);

  // 장소 · 코트
  const addVenue = (name, region) => { const v = name.trim(); if (!v) return; if (venues.some((x) => x.name === v)) { toast('이미 등록된 장소입니다'); return; } setVenues((p) => [...p, { id: uid('v'), name: v, region: region || '', courtCount: 1, naming: 'num' }]); };
  const pruneCourts = (nextVenues) => { const valid = new Set(allCourts(nextVenues).map((c) => c.id)); setDates((ds) => ds.map((dt) => ({ ...dt, courtIds: (dt.courtIds || []).filter((cid) => valid.has(cid)) }))); setCategories((cs) => cs.map((c) => ({ ...c, divisions: c.divisions.map((dv) => dv.courtId && !valid.has(dv.courtId) ? { ...dv, courtId: '' } : dv) }))); };
  const updateVenue = (id, patch) => { const next = venues.map((v) => v.id === id ? { ...v, ...patch } : v); setVenues(next); pruneCourts(next); };
  const removeVenue = (id) => { const next = venues.filter((x) => x.id !== id); setVenues(next); pruneCourts(next); };
  // 날짜 · 코트 배정
  const syncDates = (dateStrings) => {
    const sorted = [...dateStrings].sort();
    const next = sorted.map((ds) => dates.find((p) => p.date === ds) || { id: uid('dt'), date: ds, courtIds: [] });
    setDates(next);
    const keptIds = new Set(next.map((n) => n.id));
    setCategories((cs) => cs.map((c) => ({ ...c, divisions: c.divisions.map((dv) => dv.dateId && !keptIds.has(dv.dateId) ? { ...dv, dateId: '' } : dv) })));
  };
  const removeDate = (id) => { setDates((p) => p.filter((dt) => dt.id !== id)); setCategories((cs) => cs.map((c) => ({ ...c, divisions: c.divisions.map((dv) => dv.dateId === id ? { ...dv, dateId: '' } : dv) }))); };
  const toggleDateCourt = (dateId, courtId) => setDates((ds) => ds.map((dt) => dt.id === dateId ? { ...dt, courtIds: (dt.courtIds || []).includes(courtId) ? dt.courtIds.filter((c) => c !== courtId) : [...(dt.courtIds || []), courtId] } : dt));
  // 종별/디비전
  const updateDiv = (cid, did, patch) => setCategories((cs) => cs.map((c) => c.id === cid ? { ...c, divisions: c.divisions.map((dv) => dv.id === did ? { ...dv, ...patch } : dv) } : c));
  const removeDiv = (cid, did) => setCategories((cs) => cs.map((c) => c.id === cid ? { ...c, divisions: c.divisions.filter((dv) => dv.id !== did) } : c).filter((c) => c.divisions.length > 0));
  const removeCat = (cid) => setCategories((cs) => cs.filter((c) => c.id !== cid));

  const loadPrevious = (t) => {
    const nextNum = (t.name.match(/#(\d+)/) || [])[1];
    set('name', nextNum ? t.name.replace(/#\d+/, `#${+nextNum + 1}`) : `${t.name} (복사)`);
    setD((p) => ({ ...p, host: t.host, organizer: t.host }));
    if (t.venue) setVenues([{ id: uid('v'), name: t.venue, region: '' }]);
    setLoadOpen(false);
    toast(`'${t.name}' 형식·설정 불러옴`);
  };

  const submit = () => {
    setTouched(true);
    const miss = [];
    if (!d.name.trim()) miss.push('대회명');
    if (!d.organizer.trim()) miss.push('주최');
    if (!d.host.trim()) miss.push('주관');
    if (d.isRegular && !d.seriesId) miss.push('정규대회 선택');
    if (d.isRegular && d.seriesId === '__new' && !d.seriesName.trim()) miss.push('정규대회명');
    if (venues.length === 0) miss.push('장소');
    if (dates.length === 0) miss.push('대회 일정');
    if (totalDiv === 0) miss.push('종별·디비전');
    if (miss.length) { toast(`필수 입력 누락: ${miss.join(', ')}`); return; }
    setPubOpen(true);
  };
  const publish = () => {
    setSaving(true);
    setTimeout(() => { setSaving(false); setPubOpen(false); onCreated({ name: d.name.trim(), divCount: totalDiv }); }, 900);
  };

  return (
    <div className="ct-page">
      {/* 헤더 */}
      <div className="ct-head">
        <div className="ct-head__txt">
          <div className="ts-ph__eyebrow">대회 운영 · 생성</div>
          <h1 className="ts-ph__title">새 대회 만들기</h1>
          <p className="ts-ph__sub" style={{ marginTop: 6 }}>이름만 입력하면 바로 생성됩니다. 일정·장소·종별·경기 설정은 나중에 추가해도 됩니다.</p>
        </div>
        <div className="ct-head__aux">
          <Btn variant="secondary" size="sm" icon="copy" onClick={() => setLoadOpen(true)}>이전 대회 불러오기</Btn>
          <Btn variant="secondary" size="sm" icon="file-text" onClick={() => toast('PDF 요강 채우기 — 보조 진입점 (준비중)')}>PDF로 채우기</Btn>
          <Btn variant="secondary" size="sm" icon="wand-sparkles" onClick={() => toast('협회 대회 마법사 — super admin 전용')}>협회 마법사</Btn>
        </div>
      </div>

      <div className="ct-grid ct-grid--2">
        {/* 좌측 — 대회 정보 + 일정·장소 */}
        <div className="ct-col" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <section className="ts-card">
            <CardHead icon="clipboard-list" title="대회 정보" />
            <Field label="대회명" required hint={touched && !nameOk ? undefined : '예: 강남구협회장배 #10'}>
              <input className="ts-input" value={d.name} onChange={(e) => set('name', e.target.value)} onBlur={() => setTouched(true)}
                placeholder="대회 이름을 입력하세요" aria-invalid={touched && !nameOk}
                style={touched && !nameOk ? { boxShadow: '0 0 0 2px var(--danger)', background: '#fff' } : undefined} />
              {touched && !nameOk && <div style={{ fontSize: 12.5, color: 'var(--danger)', marginTop: 6, display: 'flex', alignItems: 'center', gap: 5 }}><Icon name="alert-circle" size={14} />대회명은 필수입니다</div>}
            </Field>
            <Field label="정규대회 여부" required hint="협회 정규대회 / 오픈·이벤트 대회">
              <div className="ts-segment" style={{ maxWidth: 280 }}>{[['일반대회', false], ['정규대회', true]].map(([lbl, val]) => <button key={lbl} type="button" className="ts-segment__btn" data-active={d.isRegular === val ? 'true' : 'false'} onClick={() => set('isRegular', val)}>{lbl}</button>)}</div>
            </Field>
            {d.isRegular &&
              <Field label="정규대회 선택" required hint="기존 정규대회에서 선택하거나 새로 생성하세요">
                <select className="ts-select" value={d.seriesId} onChange={(e) => set('seriesId', e.target.value)} aria-invalid={touched && !d.seriesId}
                  style={touched && !d.seriesId ? { boxShadow: '0 0 0 2px var(--danger)' } : undefined}>
                  <option value="">정규대회를 선택하세요</option>
                  {REGULAR_SERIES.map((s) => <option key={s} value={s}>{s}</option>)}
                  <option value="__new">＋ 새 정규대회 생성</option>
                </select>
                {d.seriesId === '__new' &&
                  <input className="ts-input" value={d.seriesName} onChange={(e) => set('seriesName', e.target.value)} placeholder="새 정규대회명을 입력하세요" autoFocus
                    style={touched && !d.seriesName.trim() ? { marginTop: 10, boxShadow: '0 0 0 2px var(--danger)' } : { marginTop: 10 }} />}
              </Field>}
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: 12 }}>
              <Field label="주최" required><input className="ts-input" value={d.organizer} onChange={(e) => set('organizer', e.target.value)} placeholder="예: 강남구농구협회" /></Field>
              <Field label="주관" required><input className="ts-input" value={d.host} onChange={(e) => set('host', e.target.value)} placeholder="예: BDR 운영위" /></Field>
            </div>
            <Field label="후원사" hint="선택 · 로고가 있으면 각 슬롯에 이미지를 드래그하세요">
              <SponsorField sponsors={sponsors} setSponsors={setSponsors} toast={toast} />
            </Field>
            <Field label="포스터" hint="선택 · 대회 포스터 이미지를 직접 첨부하세요">
              <image-slot id="ct_poster" shape="rounded" radius="14" placeholder="포스터 이미지 드래그 / 클릭 첨부" style={{ width: '100%', height: 200, display: 'block' }}></image-slot>
            </Field>
          </section>

          <ScheduleVenue dates={dates} venues={venues} courts={allCourts(venues)} syncDates={syncDates} removeDate={removeDate} addVenue={addVenue} updateVenue={updateVenue} removeVenue={removeVenue} toggleDateCourt={toggleDateCourt} toast={toast} />
        </div>

        {/* 우측 — 종별 빌더 + 경기 설정 */}
        <div className="ct-col" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <section className="ts-card">
            <CardHead icon="layout-grid" title="종별·디비전" action={<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span className="ct-reqtag">1개 이상 필수</span><Btn size="sm" icon="plus" onClick={() => setGenOpen(true)}>추가</Btn></div>} />
            {categories.length === 0 ?
              <div className="ct-emptybox ct-emptybox--tall">
                <Icon name="layout-grid" size={26} color="var(--ink-dim)" />
                <span style={{ fontWeight: 700, color: 'var(--ink-soft)' }}>종별이 없습니다</span>
                <span style={{ fontSize: 13 }}>우측 상단 <b style={{ color: 'var(--primary)' }}>추가</b>로 종별을 추가하세요</span>
              </div> :
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {categories.map((c) =>
                  <CategoryCard key={c.id} cat={c} dates={dates} courts={allCourts(venues)}
                    onUpdateDiv={(did, patch) => updateDiv(c.id, did, patch)}
                    onRemoveDiv={(did) => removeDiv(c.id, did)}
                    onRemoveCat={() => removeCat(c.id)} />)}
                <div className="ct-banner">
                  <Icon name="zap" size={17} color="var(--ok)" />
                  <span>저장하면 <b style={{ color: 'var(--ink)' }}>종별 규칙 {totalDiv}건</b>이 자동 생성됩니다 — 대회명·진행방식·정원·참가비·경기날짜·코트.</span>
                </div>
              </div>}
          </section>

          <CTGameSettings d={d} set={set} homeName="홈팀" awayName="원정팀" />
        </div>
      </div>

      {/* 하단 고정 바 */}
      <div className="ct-bar">
        <div className="ct-bar__inner">
          <Btn variant="ghost" onClick={onCancel}>취소</Btn>
          <div style={{ flex: 1 }} />
          <span className="ct-bar__meta">{categories.length}종별 · {totalDiv}디비전 · {dates.length}일차 · {venues.length} 장소</span>
          <Btn size="lg" style={{ width: 'auto', minWidth: 150 }} icon="check" onClick={submit}>대회 생성</Btn>
        </div>
      </div>

      <DivisionGenerator open={genOpen} onClose={() => setGenOpen(false)} onGenerate={(c) => setCategories((p) => [...p, c])} toast={toast} />
      <LoadPreviousModal open={loadOpen} onClose={() => setLoadOpen(false)} onLoad={loadPrevious} />
      <PublishModal open={pubOpen} name={d.name} saving={saving} onClose={() => { if (!saving) setPubOpen(false); }} onConfirm={publish} />
    </div>);
}

window.CreateTournament = CreateTournament;

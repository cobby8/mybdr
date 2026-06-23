/* global React, window */

// =====================================================================
// ct-game-settings.jsx — 경기 설정 카드 (기록앱 정합)
//   소스(truth): bdr_stat_v3 / lib/presentation/screens/pregame/
//     game_settings_gate_screen.dart (PG1 경기 설정 확인 게이트)
//   + domain/models/game_rules.dart (GameRules 기본값/범위)
//   + util/team_color.dart · game_settings_panel(유니폼 16색 팔레트)
//
//   ⚠ 대회 생성 단계의 "경기 기본값" — 경기마다 기록원이 현장 확인/조정하는
//      그 값의 원본(대회 공통). 항목·범위·프리셋을 기록앱과 1:1로 맞춘다.
//   유니폼 hex 는 도메인 데이터(저지색) — DS 토큰 예외(기록앱 동일 규칙).
// =====================================================================
const { Icon, Btn, Badge, Modal } = window;

// ── 유니폼 16색 팔레트 (기록앱 showUniformPalette 큐레이션과 동일) ───────
//   [이름, hex]. 도메인 저지색이라 hex 직접 사용 = 기록앱 승인 예외.
const UNIFORM_PALETTE = [
  ['화이트', '#FFFFFF'], ['레드', '#E31B23'], ['블루', '#0F5FCC'], ['네이비', '#1B2A4A'],
  ['블랙', '#1A1E27'], ['그린', '#1CA05E'], ['옐로', '#E8A33B'], ['오렌지', '#E8821B'],
  ['퍼플', '#6D3AD1'], ['스카이', '#3DA9E0'], ['민트', '#19C3A6'], ['핑크', '#E85FA0'],
  ['그레이', '#8A93A0'], ['마룬', '#7A1620'], ['틸', '#0E7C86'], ['골드', '#C9A227'],
];
// 디폴트(의뢰): 홈=밝은색 / 원정=어두운색 (팀정보에서 불러오는 기본값).
const UNI_HOME_DEFAULT = '#FFFFFF'; // 화이트 (밝은색)
const UNI_AWAY_DEFAULT = '#1B2A4A'; // 네이비 (어두운색)

// 경기 방식 프리셋 (기록앱 _kPresets 와 동일 — 시간구성만, 운영방식은 별도 축).
const GAME_PRESETS = [
  { label: '6분 4쿼터', quarterType: '4Q', minutes: 6, toFirst: 1, toSecond: 1 },
  { label: '7분 4쿼터', quarterType: '4Q', minutes: 7, toFirst: 1, toSecond: 2 },
  { label: '10분 4쿼터', quarterType: '4Q', minutes: 10, toFirst: 2, toSecond: 3 },
  { label: '10분 전후반', quarterType: 'HALF', minutes: 10, toFirst: 1, toSecond: 1 },
];

// 경기 설정 기본값 (game_rules.dart GameRules.defaults · 유니폼만 의뢰 디폴트로 교체).
const GAME_SETTINGS_DEFAULTS = {
  homeColor: UNI_HOME_DEFAULT, awayColor: UNI_AWAY_DEFAULT, vestProvided: false,
  quarterType: '4Q', quarterMinutes: 10, clockMode: 'dead', shotClock: true,
  foulLimit: 5, teamFoulBonus: 5, firstHalfTimeouts: 2, secondHalfTimeouts: 3,
  timeoutDuration: 30,
};

const _hexName = (hex) => {
  const up = (hex || '').toUpperCase();
  const f = UNIFORM_PALETTE.find((e) => e[1].toUpperCase() === up);
  return f ? f[0] : '사용자 지정';
};
// 휘도 기반 대비 잉크 (기록앱 _jerseyInk 1:1).
const _jerseyInk = (hex) => {
  const s = (hex || '#000').replace('#', '');
  const n = s.length === 3 ? s.split('').map((c) => c + c).join('') : s;
  const r = parseInt(n.slice(0, 2), 16) || 0, g = parseInt(n.slice(2, 4), 16) || 0, b = parseInt(n.slice(4, 6), 16) || 0;
  return (0.299 * r + 0.587 * g + 0.114 * b) > 165 ? 'var(--ink)' : '#fff';
};

// ── 공통 소품 (create-tournament 와 공유 · window 노출) ──────────────────
function CardHead({ icon, title, action }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: 18 }}>
      <span className="ct-headicon"><Icon name={icon} size={18} color="var(--primary)" /></span>
      <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--ink)', letterSpacing: '-0.02em' }}>{title}</span>
      {action && <span style={{ marginLeft: 'auto' }}>{action}</span>}
    </div>);
}
function Field({ label, required, hint, children }) {
  return (
    <div className="ts-field">
      <label className="ts-field__label">{label}{required && <span style={{ color: 'var(--danger)', marginLeft: 3 }}>*</span>}</label>
      {children}
      {hint && <div className="ts-field__hint">{hint}</div>}
    </div>);
}
function Subhead({ icon, label, hint }) {
  return (
    <div className="ct-subhead">
      <Icon name={icon} size={15} color="var(--ink-mute)" />
      <span>{label}</span>
      {hint && <span className="ct-subhead__hint">{hint}</span>}
    </div>);
}
function Stepper({ value, unit, min, max, step = 1, onChange }) {
  return (
    <div className="ct-stepper">
      <button type="button" disabled={value <= min} onClick={() => onChange(Math.max(min, value - step))} aria-label="감소"><Icon name="minus" size={17} /></button>
      <span className="ct-stepper__val">{value}<span className="u">{unit}</span></span>
      <button type="button" disabled={value >= max} onClick={() => onChange(Math.min(max, value + step))} aria-label="증가"><Icon name="plus" size={17} /></button>
    </div>);
}
function SegSm({ options, index, onSelect }) {
  return (
    <div className="ct-segsm">
      {options.map((o, i) => <button key={o} type="button" data-active={i === index ? 'true' : 'false'} onClick={() => onSelect(i)}>{o}</button>)}
    </div>);
}
function SetRow({ name, hint, control }) {
  return (
    <div className="ct-set">
      <div className="ct-set__txt">
        <div className="ct-set__name">{name}</div>
        {hint && <div className="ct-set__hint">{hint}</div>}
      </div>
      {control}
    </div>);
}

// ── 유니폼 16색 선택 모달 (기록앱 showUniformPalette) ────────────────────
function UniformModal({ open, side, current, onClose, onPick }) {
  const [hex, setHex] = React.useState(current || '#FFFFFF');
  React.useEffect(() => { if (open) setHex(current || '#FFFFFF'); }, [open, current]);
  const valid = /^#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})$/.test(hex.trim());
  return (
    <Modal open={open} onClose={onClose} title={`${side} 유니폼 색상`} sub="대회·팀 세팅 기본값입니다. 16색에서 고르거나 직접 입력하세요."
      foot={<><Btn variant="secondary" onClick={onClose} style={{ flex: 1 }}>취소</Btn><Btn disabled={!valid} icon="check" style={{ flex: 2, opacity: valid ? 1 : .5 }} onClick={() => valid && onPick(hex.trim().toUpperCase())}>이 색으로 적용</Btn></>}>
      <div className="ct-pal">
        {UNIFORM_PALETTE.map(([nm, hx]) =>
          <button key={hx} type="button" className="ct-palsw" data-active={hex.toUpperCase() === hx.toUpperCase() ? 'true' : 'false'}
            style={{ background: hx }} title={`${nm} ${hx}`} onClick={() => setHex(hx)}>
            {hex.toUpperCase() === hx.toUpperCase() && <Icon name="check" size={18} color={_jerseyInk(hx)} />}
          </button>)}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 16 }}>
        <span style={{ width: 42, height: 42, borderRadius: 10, background: valid ? hex : 'var(--grey-100)', border: '2px solid var(--border-strong)', flex: '0 0 auto' }} />
        <div style={{ flex: 1 }}>
          <div className="ts-field__label" style={{ marginBottom: 4 }}>직접 입력 (HEX)</div>
          <input className="ts-input ct-hexinput" value={hex} onChange={(e) => setHex(e.target.value)} placeholder="#1B3C87" spellCheck={false}
            style={!valid && hex ? { boxShadow: '0 0 0 2px var(--danger)' } : undefined} />
        </div>
        <div style={{ textAlign: 'right', minWidth: 78 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--ink)' }}>{_hexName(hex)}</div>
          <div style={{ fontSize: 11, fontFamily: 'var(--ff-mono)', color: 'var(--ink-mute)' }}>{(hex || '').toUpperCase()}</div>
        </div>
      </div>
    </Modal>);
}

// ── 유니폼 셀 (홈/원정) ─────────────────────────────────────────────────
const _lum = (hex) => { const s = (hex || '#000').replace('#', ''); const n = s.length === 3 ? s.split('').map((c) => c + c).join('') : s; const r = parseInt(n.slice(0, 2), 16) || 0, g = parseInt(n.slice(2, 4), 16) || 0, b = parseInt(n.slice(4, 6), 16) || 0; return 0.299 * r + 0.587 * g + 0.114 * b; };
const toneOf = (hex) => _lum(hex) > 165 ? '밝은색' : '어두운색';

function UniformCell({ team, tone }) {
  return (
    <div className="ct-unicell ct-unicell--text">
      <span className="ct-unicell__team">{team}</span>
      <div className="ct-unicell__tone">{tone}</div>
    </div>);
}

// ── 경기 설정 카드 본체 ─────────────────────────────────────────────────
function CTGameSettings({ d, set, homeName = '홈팀', awayName = '원정팀' }) {
  const setMany = (patch) => Object.entries(patch).forEach(([k, v]) => set(k, v));
  const activePreset = (p) => d.quarterType === p.quarterType && d.quarterMinutes === p.minutes && d.firstHalfTimeouts === p.toFirst && d.secondHalfTimeouts === p.toSecond;

  return (
    <section className="ts-card">
      <CardHead icon="sliders-horizontal" title="경기 설정" action={<Badge tone="primary">기록앱 정합</Badge>} />

      {/* 유니폼 색상 */}
      <Subhead icon="shirt" label="유니폼 색상" hint="홈 밝은색 · 어웨이 어두운색" />
      <div className="ct-uni">
        <UniformCell team={homeName} tone={toneOf(d.homeColor)} />
        <UniformCell team={awayName} tone={toneOf(d.awayColor)} />
      </div>
      <button type="button" className="ct-uniswap" onClick={() => setMany({ homeColor: d.awayColor, awayColor: d.homeColor })}>
        <Icon name="arrow-left-right" size={16} />홈 · 어웨이 색 교체
      </button>
      <label className="ct-vest">
        <input type="checkbox" checked={d.vestProvided} onChange={(e) => set('vestProvided', e.target.checked)} />
        <span className="ct-vest__box"><Icon name="check" size={13} /></span>
        <span className="ct-vest__txt">
          <span className="ct-vest__name">팀 조끼(번호 조끼) 제공</span>
          <span className="ct-vest__hint">주최 측이 조끼를 지급하는 경우 선택 (선택 옵션)</span>
        </span>
      </label>

      {/* 경기 방식 */}
      <Subhead icon="clock" label="경기 방식" hint="프리셋 또는 직접 조정" />
      <div className="ct-presets" style={{ marginBottom: 4 }}>
        {GAME_PRESETS.map((p) =>
          <button key={p.label} type="button" className="ts-chip" data-active={activePreset(p) ? 'true' : 'false'}
            onClick={() => setMany({ quarterType: p.quarterType, quarterMinutes: p.minutes, firstHalfTimeouts: p.toFirst, secondHalfTimeouts: p.toSecond })}>{p.label}</button>)}
      </div>
      <SetRow name="운영 방식" hint="논스탑=러닝클락 · 데드=데드볼 정지"
        control={<SegSm options={['논스탑', '데드']} index={d.clockMode === 'nonstop' ? 0 : 1} onSelect={(i) => set('clockMode', i === 0 ? 'nonstop' : 'dead')} />} />
      <SetRow name="쿼터 수" hint="정규 쿼터 구성"
        control={<SegSm options={['4쿼터', '전후반']} index={d.quarterType === 'HALF' ? 1 : 0} onSelect={(i) => set('quarterType', i === 1 ? 'HALF' : '4Q')} />} />
      <SetRow name="쿼터 시간" hint="분 / 쿼터"
        control={<Stepper value={d.quarterMinutes} unit="분" min={1} max={20} onChange={(v) => set('quarterMinutes', v)} />} />
      <SetRow name="샷클락" hint="24초 · 리바운드 14초"
        control={<SegSm options={['사용', '미사용']} index={d.shotClock ? 0 : 1} onSelect={(i) => set('shotClock', i === 0)} />} />

      {/* 파울 · 타임아웃 */}
      <Subhead icon="flag" label="파울 · 타임아웃" />
      <SetRow name="개인 파울 한도" hint="초과 시 강제 교체"
        control={<Stepper value={d.foulLimit} unit="파울" min={4} max={6} onChange={(v) => set('foulLimit', v)} />} />
      <SetRow name="팀파울 보너스" hint="쿼터당 · 초과 시 자유투"
        control={<Stepper value={d.teamFoulBonus} unit="파울" min={3} max={7} onChange={(v) => set('teamFoulBonus', v)} />} />
      <SetRow name="타임아웃 · 전반" hint="1·2쿼터 합산"
        control={<Stepper value={d.firstHalfTimeouts} unit="회" min={0} max={4} onChange={(v) => set('firstHalfTimeouts', v)} />} />
      <SetRow name="타임아웃 · 후반" hint="3·4쿼터 합산"
        control={<Stepper value={d.secondHalfTimeouts} unit="회" min={0} max={4} onChange={(v) => set('secondHalfTimeouts', v)} />} />
      <SetRow name="타임아웃 시간" hint="1회당 · 기본 30초"
        control={<Stepper value={d.timeoutDuration} unit="초" min={30} max={90} step={10} onChange={(v) => set('timeoutDuration', v)} />} />
    </section>);
}

Object.assign(window, { CTGameSettings, CardHead, Field, Subhead, Stepper, SegSm, SetRow, GAME_SETTINGS_DEFAULTS, GAME_PRESETS, UNIFORM_PALETTE });

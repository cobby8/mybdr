/* global React, window, Icon, Btn, Badge, Check, StepDots */

// =====================================================================
// Apply.jsx — 참가신청서 (사용자용) 3단계 — Toss 룩
//   Step 1 참가팀 선택 + 정보 확인  (로그인 세션 · 비번 불필요)
//   Step 2 종별 · 디비전 선택       (정원 표시 · 초과 시 대기접수)
//   Step 3 출전 선수 선택           (기존 로스터 체크 · 명단 입력 X)
//   유니폼 단계 폐지(팀 페이지 설정). 완료 = 입금 안내.
//   ⏳ 출전 최소인원 가드 · 게스트 추가 = 추후 결정 (토글로 자리만)
// =====================================================================

const AP = window.TOSS;

// 출전 최소인원 / 게스트 = 추후 결정. 토글로 자리만 마련.
const MIN_PLAYERS_GUARD = false;  // 켜면 최소 5명 가드
const MIN_PLAYERS = 5;
const ALLOW_GUEST = false;        // 켜면 게스트(팀원 외) 추가 UI 노출

function TeamCard({ team, active, onSelect }) {
  return (
    <button type="button" className="ts-card" onClick={onSelect}
      style={{ textAlign: 'left', cursor: 'pointer', border: active ? '2px solid var(--primary)' : '2px solid transparent', boxShadow: active ? '0 0 0 4px var(--primary-weak)' : 'var(--sh-sm)', padding: 18, width: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 46, height: 46, borderRadius: 14, background: team.uniformHome, border: '2px solid var(--border)', flex: '0 0 auto', display: 'grid', placeItems: 'center' }}>
          <Icon name="shield" size={22} color={team.uniformHome === '#FFFFFF' ? 'var(--ink-dim)' : '#fff'} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 800, fontSize: 16, color: 'var(--ink)' }}>{team.name_ko} <span style={{ fontSize: 12, color: 'var(--ink-dim)', fontWeight: 600 }}>{team.name_en}</span></div>
          <div style={{ fontSize: 13, color: 'var(--ink-mute)', marginTop: 3 }}>{team.province} {team.city} · 로스터 {team.roster.length}명</div>
        </div>
        {active && <Icon name="check-circle-2" size={22} color="var(--primary)" />}
      </div>
    </button>);
}

function InfoRow({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '11px 0', borderBottom: '1px solid var(--border)' }}>
      <span style={{ fontSize: 14, color: 'var(--ink-mute)' }}>{label}</span>
      <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>{value}</span>
    </div>);
}

function Apply({ master }) {
  const [step, setStep] = React.useState(0);
  const [teamId, setTeamId] = React.useState(AP.MY_TEAMS.length === 1 ? AP.MY_TEAMS[0].id : null);
  const [category, setCategory] = React.useState('');
  const [division, setDivision] = React.useState('');
  const [selected, setSelected] = React.useState({});  // playerId -> bool

  const team = AP.MY_TEAMS.find((t) => t.id === teamId);
  // 종별: 마스터에서 (시연: 일반부·유청소년)
  const cats = master.filter((c) => ['일반부', '유청소년'].includes(c.name));
  const curCat = cats.find((c) => c.name === category);
  const divCap = (d) => AP.DIVISION_CAPS[d] || { cap: 0, current: 0 };
  const selCount = team ? team.roster.filter((p) => selected[p.id]).length : 0;
  const isFull = division && (() => { const c = divCap(division); return c.cap > 0 && c.current >= c.cap; })();

  const canNext = step === 0 ? !!team : step === 1 ? (!!category && !!division) : true;
  const minOk = !MIN_PLAYERS_GUARD || selCount >= MIN_PLAYERS;

  const next = () => { if (step < 3) setStep(step + 1); };
  const prev = () => setStep(Math.max(0, step - 1));

  return (
    <div className="ts-phone">
      <div className="ts-ph" style={{ marginBottom: 18 }}>
        <div className="ts-ph__eyebrow">참가신청 미리보기</div>
        <h1 className="ts-ph__title" style={{ fontSize: 22 }}>{AP.TOURNAMENT.name}</h1>
        <p className="ts-ph__sub" style={{ fontSize: 13.5 }}>신청자(로그인 사용자)가 보게 될 화면입니다. 선수 명단은 가입된 팀 로스터에서 선택합니다.</p>
      </div>

      <div className="ts-card">
        {step < 3 && <StepDots step={step} total={3} />}

        {/* Step 1 — 참가팀 선택 + 확인 */}
        {step === 0 &&
          <div>
            <h2 style={{ fontSize: 19, fontWeight: 800, marginBottom: 4 }}>참가할 팀을 선택하세요</h2>
            <p style={{ fontSize: 13.5, color: 'var(--ink-mute)', marginBottom: 18 }}>가입된 팀에서 선택하면 팀 정보가 자동으로 채워집니다.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {AP.MY_TEAMS.map((t) => <TeamCard key={t.id} team={t} active={teamId === t.id} onSelect={() => setTeamId(t.id)} />)}
            </div>
            {team &&
              <div className="ts-card ts-card--flat" style={{ marginTop: 16, padding: 18 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink-soft)', marginBottom: 8 }}>팀 정보 확인</div>
                <InfoRow label="팀명" value={`${team.name_ko} (${team.name_en})`} />
                <InfoRow label="대표자" value={team.manager} />
                <InfoRow label="연락처" value={team.phone.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3')} />
                <InfoRow label="지역" value={`${team.province} ${team.city}`} />
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '11px 0 0' }}>
                  <span style={{ fontSize: 14, color: 'var(--ink-mute)' }}>유니폼</span>
                  <span style={{ display: 'flex', gap: 6 }}>
                    <span style={{ width: 22, height: 22, borderRadius: 6, background: team.uniformHome, border: '1px solid var(--border)' }} />
                    <span style={{ width: 22, height: 22, borderRadius: 6, background: team.uniformAway, border: '1px solid var(--border)' }} />
                  </span>
                </div>
              </div>}
          </div>}

        {/* Step 2 — 종별·디비전 */}
        {step === 1 &&
          <div>
            <h2 style={{ fontSize: 19, fontWeight: 800, marginBottom: 4 }}>종별·디비전을 선택하세요</h2>
            <p style={{ fontSize: 13.5, color: 'var(--ink-mute)', marginBottom: 18 }}>디비전별 모집 정원을 확인하세요. 정원 초과 시 대기 접수됩니다.</p>
            <div style={{ marginBottom: 18 }}>
              <div className="ts-field__label">종별</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {cats.map((c) => <button key={c.id} type="button" className="ts-chip" data-active={category === c.name ? 'true' : 'false'} onClick={() => { setCategory(c.name); setDivision(''); }}>{c.name}</button>)}
              </div>
            </div>
            {curCat &&
              <div>
                <div className="ts-field__label">디비전 (모집정원)</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {curCat.divisions.map((d) => {
                    const c = divCap(d); const full = c.cap > 0 && c.current >= c.cap; const active = division === d;
                    return (
                      <button key={d} type="button" onClick={() => setDivision(d)}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderRadius: 16, border: active ? `2px solid ${full ? 'var(--warn)' : 'var(--primary)'}` : '2px solid var(--border)', background: active ? (full ? 'var(--warn-weak)' : 'var(--primary-weak)') : '#fff', cursor: 'pointer', fontFamily: 'var(--ff)' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontWeight: 800, fontSize: 15, color: 'var(--ink)' }}>{d}</span>
                          {full && <Badge tone="warn">대기접수</Badge>}
                        </span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: full ? 'var(--warn)' : 'var(--ink-mute)' }}>{c.cap > 0 ? `${c.current}/${c.cap}팀` : '정원 미정'}</span>
                      </button>);
                  })}
                </div>
              </div>}
          </div>}

        {/* Step 3 — 출전 선수 선택 */}
        {step === 2 &&
          <div>
            <h2 style={{ fontSize: 19, fontWeight: 800, marginBottom: 4 }}>출전 선수를 선택하세요</h2>
            <p style={{ fontSize: 13.5, color: 'var(--ink-mute)', marginBottom: 16 }}>{team.name_ko} 로스터에서 이번 대회 출전 선수를 선택합니다. 선수 정보는 이미 등록되어 있어요.</p>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <Badge tone={selCount > 0 ? 'primary' : 'grey'}>{selCount}명 선택</Badge>
              <button type="button" className="ts-btn ts-btn--ghost ts-btn--sm" onClick={() => { const all = {}; team.roster.forEach((p) => all[p.id] = true); setSelected(selCount === team.roster.length ? {} : all); }}>
                {selCount === team.roster.length ? '전체 해제' : '전체 선택'}
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {team.roster.map((p) => {
                const on = !!selected[p.id];
                return (
                  <button key={p.id} type="button" onClick={() => setSelected((s) => ({ ...s, [p.id]: !on }))}
                    style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 16, border: on ? '2px solid var(--primary)' : '2px solid var(--border)', background: on ? 'var(--primary-weak)' : '#fff', cursor: 'pointer', fontFamily: 'var(--ff)', textAlign: 'left' }}>
                    <span className="ts-check" data-on={on ? 'true' : 'false'}>{on && <Icon name="check" size={15} />}</span>
                    <span style={{ width: 30, textAlign: 'center', fontFamily: 'var(--ff-mono)', fontWeight: 800, fontSize: 15, color: on ? 'var(--primary)' : 'var(--ink-mute)' }}>{p.no}</span>
                    <span style={{ flex: 1 }}>
                      <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--ink)' }}>{p.name}</span>
                      <span style={{ fontSize: 12.5, color: 'var(--ink-mute)', marginLeft: 8 }}>{p.pos} · {p.birth.slice(0, 2)}년생</span>
                    </span>
                    {p.elite && <Badge tone="danger">선출</Badge>}
                  </button>);
              })}
            </div>
            {ALLOW_GUEST &&
              <button type="button" className="ts-btn ts-btn--secondary ts-btn--block" style={{ marginTop: 10 }}><Icon name="user-plus" size={16} /> 게스트 선수 추가</button>}
            {MIN_PLAYERS_GUARD && !minOk &&
              <p style={{ fontSize: 12.5, color: 'var(--warn)', marginTop: 10 }}>최소 {MIN_PLAYERS}명 이상 선택해야 합니다.</p>}
            <p style={{ fontSize: 11.5, color: 'var(--ink-dim)', marginTop: 12 }}>※ 출전 최소 인원 · 게스트(팀원 외) 추가 정책은 추후 확정됩니다.</p>
          </div>}

        {/* Step 4 — 완료 */}
        {step === 3 &&
          <div style={{ textAlign: 'center', padding: '12px 0' }}>
            <div style={{ width: 72, height: 72, borderRadius: '50%', background: isFull ? 'var(--warn)' : 'var(--ok)', color: '#fff', display: 'grid', placeItems: 'center', margin: '0 auto 16px' }}><Icon name={isFull ? 'clock' : 'check'} size={36} /></div>
            <h2 style={{ fontSize: 21, fontWeight: 800 }}>{isFull ? '대기 접수되었습니다' : '신청이 완료되었습니다!'}</h2>
            <p style={{ fontSize: 14, color: 'var(--ink-mute)', margin: '8px 0 20px', lineHeight: 1.6 }}>아래 계좌로 참가비를 입금하시면<br />관리자 확인 후 확정됩니다.</p>
            <div style={{ background: 'var(--grey-50)', borderRadius: 20, padding: 22, textAlign: 'left' }}>
              <div style={{ fontSize: 13, color: 'var(--ink-mute)', marginBottom: 4 }}>{AP.TOURNAMENT.bank}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 21, fontWeight: 800, color: 'var(--primary)' }}>{AP.TOURNAMENT.account}</span>
                <button type="button" className="ts-btn ts-btn--ghost ts-btn--sm" style={{ padding: 6 }}><Icon name="copy" size={16} /></button>
              </div>
              <div style={{ fontSize: 13, color: 'var(--ink-mute)', marginTop: 4 }}>예금주 {AP.TOURNAMENT.holder}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
                <span style={{ fontSize: 14, color: 'var(--ink-soft)' }}>입금 금액</span>
                <span style={{ fontSize: 20, fontWeight: 800, color: 'var(--ink)' }}>{AP.TOURNAMENT.fee.toLocaleString()}원</span>
              </div>
            </div>
            <button type="button" className="ts-btn ts-btn--secondary ts-btn--block" style={{ marginTop: 16 }} onClick={() => { setStep(0); setSelected({}); }}><Icon name="rotate-ccw" size={16} /> 처음부터 다시 보기</button>
          </div>}

        {/* nav */}
        {step < 3 &&
          <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
            {step > 0 && <button type="button" className="ts-btn ts-btn--secondary" style={{ flex: 1 }} onClick={prev}>이전</button>}
            <button type="button" className="ts-btn ts-btn--primary" style={{ flex: 2, opacity: (canNext && (step !== 2 || minOk)) ? 1 : .5 }} disabled={!canNext || (step === 2 && !minOk)}
              onClick={next}>
              {step === 2 ? (isFull ? '대기 접수하기' : '신청서 제출하기') : '다음'}
            </button>
          </div>}
      </div>
    </div>);
}

window.Apply = Apply;

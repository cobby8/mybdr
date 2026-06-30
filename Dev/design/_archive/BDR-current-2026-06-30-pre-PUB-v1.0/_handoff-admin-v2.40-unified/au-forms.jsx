/* global React, window */
// =====================================================================
// au-forms.jsx — 생성/작성 플로우 & 추가 모달
//   대회 생성 마법사 · 알림 작성 · 캠페인 생성 · NEWS 기사 작성 · AddModal
//   셸/사이드바 유지. route = create-tournament / compose-notification /
//   create-campaign / write-news.
// =====================================================================
(function () {
const { useState } = React;
const D = window.ADMIN;
const { Panel, Icon, Btn, Badge, Modal } = window;
const won = window.auWon;

// ── 폼 프리미티브 ─────────────────────────────────────────────────────
function Field({ label, opt, hint, children }) {
  return (
    <div className="au-field">
      <label className="au-flabel">{label}{opt && <span className="au-flabel__opt">{opt}</span>}</label>
      {children}
      {hint && <div className="au-fhint">{hint}</div>}
    </div>
  );
}
function TextInput(props) { return <input className="ts-input" {...props} />; }
function TextArea(props) { return <textarea className="au-textarea" {...props} />; }
function Select({ options, ...rest }) {
  return <select className="ts-select" {...rest}>{options.map((o) => <option key={o} value={o}>{o}</option>)}</select>;
}
function PickRow({ options, value, onChange, multi }) {
  const isOn = (v) => multi ? (value || []).includes(v) : value === v;
  const toggle = (v) => {
    if (!multi) return onChange(v);
    const set = new Set(value || []); set.has(v) ? set.delete(v) : set.add(v); onChange([...set]);
  };
  return (
    <div className="au-pickrow">
      {options.map((o) => {
        const id = o.id || o, label = o.label || o;
        return <button type="button" key={id} className="au-pick" data-on={isOn(id) ? 'true' : 'false'} onClick={() => toggle(id)}>{o.icon && <Icon name={o.icon} size={16} />}{label}</button>;
      })}
    </div>
  );
}
function Upload({ t, d }) {
  return <div className="au-upload"><div className="au-upload__icon"><Icon name="image-plus" size={22} /></div><div className="au-upload__t">{t}</div><div className="au-upload__d">{d}</div></div>;
}
function FormHead({ go, back, eyebrow, icon, title, sub }) {
  return (
    <div>
      <button type="button" className="au-back" onClick={() => go(back)}><Icon name="arrow-left" size={16} /> 취소하고 돌아가기</button>
      <div className="au-head"><div className="au-head__row"><div style={{ minWidth: 0 }}>
        <div className="au-head__eyebrow"><Icon name={icon} size={15} />{eyebrow}</div>
        <h1>{title}</h1>{sub && <div className="au-head__sub">{sub}</div>}
      </div></div></div>
    </div>
  );
}

// =====================================================================
// 추가 모달 — fields 설정으로 구동되는 공용 입력 모달
//   fields: [{ type:'text'|'number'|'select'|'textarea'|'pick', label, opt, hint, options, placeholder }]
// =====================================================================
function AddModal({ open, onClose, title, sub, fields, submitLabel = '저장' }) {
  const [picks, setPicks] = useState({});
  return (
    <Modal open={open} onClose={onClose} title={title} sub={sub}
      foot={<><Btn variant="secondary" block onClick={onClose}>취소</Btn><Btn variant="primary" block icon="check" onClick={onClose}>{submitLabel}</Btn></>}>
      {(fields || []).map((f, i) => (
        <Field key={i} label={f.label} opt={f.opt} hint={f.hint}>
          {f.type === 'select' ? <Select options={f.options} />
            : f.type === 'textarea' ? <TextArea placeholder={f.placeholder} />
            : f.type === 'pick' ? <PickRow options={f.options} value={picks[i]} onChange={(v) => setPicks((p) => ({ ...p, [i]: v }))} multi={f.multi} />
            : <TextInput type={f.type === 'number' ? 'number' : 'text'} placeholder={f.placeholder} />}
        </Field>
      ))}
    </Modal>
  );
}

// =====================================================================
// 1. 대회 생성 마법사
// =====================================================================
function AuCreateTournament({ go }) {
  const [step, setStep] = useState(0);
  const [f, setF] = useState({ name: '', organizer: 'BDR', cap: '64', fee: '80000', start: '', cats: ['일반부'], court: '장충체육관' });
  const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target ? e.target.value : e }));
  const steps = ['기본 정보', '종별 · 정원', '일정 · 장소', '참가비 · 정산', '검토 · 생성'];
  const last = steps.length - 1;
  return (
    <div>
      <FormHead go={go} back="tournaments" eyebrow="대회 관리" icon="trophy" title="새 대회 만들기" sub="5단계로 대회를 생성합니다. 생성 후 접수·대진·정산을 관리할 수 있습니다." />
      <div className="au-wizard">
        <div className="au-wsteps">
          {steps.map((s, i) => (
            <button type="button" key={s} className="au-wstep" data-active={step === i ? 'true' : 'false'} data-done={step > i ? 'true' : 'false'} onClick={() => setStep(i)}>
              <span className="au-wstep__n">{step > i ? <Icon name="check" size={14} /> : i + 1}</span>
              <span className="au-wstep__t">{s}</span>
            </button>
          ))}
        </div>
        <Panel>
          {step === 0 && <div className="au-form">
            <Field label="대회명" hint="참가자에게 노출되는 공식 명칭입니다."><TextInput value={f.name} onChange={set('name')} placeholder="예: 강남구협회장배 #10" /></Field>
            <div className="au-frow">
              <Field label="주최"><Select options={['BDR', '서울시농구협회', '강남구농구협회', '대학농구연맹']} value={f.organizer} onChange={set('organizer')} /></Field>
              <Field label="대회 유형"><Select options={['토너먼트', '리그전', '풀리그+토너먼트']} /></Field>
            </div>
            <Field label="대회 소개" opt="선택"><TextArea placeholder="대회 취지, 시상 내역, 유의사항 등을 입력하세요." /></Field>
          </div>}
          {step === 1 && <div className="au-form">
            <Field label="종별 선택" hint="종별 마스터에 등록된 항목 중 선택합니다. 복수 선택 가능.">
              <PickRow multi options={D.CATEGORIES.map((c) => c.name)} value={f.cats} onChange={set('cats')} />
            </Field>
            <div className="au-frow">
              <Field label="총 정원" opt="팀"><TextInput type="number" value={f.cap} onChange={set('cap')} /></Field>
              <Field label="팀당 최대 인원"><TextInput type="number" defaultValue="12" /></Field>
            </div>
          </div>}
          {step === 2 && <div className="au-form">
            <div className="au-frow">
              <Field label="개최일"><TextInput type="date" value={f.start} onChange={set('start')} /></Field>
              <Field label="접수 마감일"><TextInput type="date" /></Field>
            </div>
            <Field label="개최 코트"><Select options={D.COURTS.map((c) => c.name)} value={f.court} onChange={set('court')} /></Field>
            <Field label="대회 요강" opt="선택"><Upload t="요강 파일 업로드" d="PDF · 최대 10MB" /></Field>
          </div>}
          {step === 3 && <div className="au-form">
            <div className="au-frow">
              <Field label="참가비" opt="팀당 · 원"><TextInput type="number" value={f.fee} onChange={set('fee')} /></Field>
              <Field label="심판 배정비" opt="경기당 · 원"><TextInput type="number" defaultValue="60000" /></Field>
            </div>
            <Field label="환불 정책"><Select options={['접수 마감 7일 전 100% 환불', '접수 마감 전 50% 환불', '환불 불가']} /></Field>
            <Field label="입금 안내 SMS" opt="선택"><PickRow options={[{ id: 'on', label: '자동 발송' }, { id: 'off', label: '발송 안 함' }]} value="on" onChange={() => {}} /></Field>
          </div>}
          {step === last && <div className="au-form">
            <div className="au-section-title">입력 내용 확인</div>
            <div className="au-dl">
              {[['대회명', f.name || '— 미입력'], ['주최', f.organizer], ['종별', (f.cats || []).join(', ') || '—'], ['정원', `${f.cap}팀`], ['개최일', f.start || '— 미입력'], ['개최 코트', f.court], ['참가비', won(Number(f.fee) || 0)]].map(([k, v]) => (
                <div className="au-dl__row" key={k}><span className="au-dl__k">{k}</span><span className="au-dl__v">{v}</span></div>
              ))}
            </div>
            <div style={{ marginTop: 18, padding: 16, background: 'var(--primary-weak)', borderRadius: 12, fontSize: 13.5, color: 'var(--primary)', fontWeight: 600, display: 'flex', gap: 8 }}>
              <Icon name="info" size={18} />생성 시 대회는 <b style={{ margin: '0 4px' }}>작성중</b> 상태로 저장되며, 접수 시작 시 공개됩니다.
            </div>
          </div>}

          <div className="au-wfoot">
            <Btn variant="ghost" icon="arrow-left" disabled={step === 0} onClick={() => setStep((s) => Math.max(0, s - 1))}>이전</Btn>
            {step < last
              ? <Btn variant="primary" iconRight="arrow-right" onClick={() => setStep((s) => Math.min(last, s + 1))}>다음</Btn>
              : <Btn variant="primary" icon="check" onClick={() => go('tournaments')}>대회 생성</Btn>}
          </div>
        </Panel>
      </div>
    </div>
  );
}

// =====================================================================
// 2. 알림 작성
// =====================================================================
function AuComposeNotification({ go }) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [ch, setCh] = useState(['app']);
  const [when, setWhen] = useState('now');
  return (
    <div>
      <FormHead go={go} back="notifications" eyebrow="시스템" icon="bell" title="알림 작성" sub="대상과 채널을 선택해 알림을 발송하거나 예약합니다." />
      <div className="au-dgrid au-dgrid--wide">
        <Panel>
          <div className="au-form au-form--wide">
            <Field label="제목"><TextInput value={title} onChange={(e) => setTitle(e.target.value)} placeholder="예: 서머 오픈 #4 접수 시작 안내" /></Field>
            <Field label="내용"><TextArea value={body} onChange={(e) => setBody(e.target.value)} placeholder="알림 본문을 입력하세요." /></Field>
            <Field label="발송 대상"><Select options={D.OPT_TARGETS} /></Field>
            <Field label="발송 채널" hint="복수 선택 시 각 채널로 동시 발송됩니다."><PickRow multi options={D.OPT_CHANNELS} value={ch} onChange={setCh} /></Field>
            <Field label="발송 시점">
              <PickRow options={[{ id: 'now', label: '즉시 발송' }, { id: 'schedule', label: '예약 발송' }]} value={when} onChange={setWhen} />
              {when === 'schedule' && <div style={{ marginTop: 12 }}><TextInput type="datetime-local" /></div>}
            </Field>
          </div>
        </Panel>
        <div className="au-dstack">
          <Panel title="미리보기">
            <div className="au-notiprev">
              <div className="au-notiprev__phone">
                <div className="au-notiprev__ic">B</div>
                <div style={{ minWidth: 0 }}>
                  <div className="au-notiprev__t">{title || '알림 제목이 여기에 표시됩니다'}</div>
                  <div className="au-notiprev__b">{body || '알림 본문 미리보기'}</div>
                  <div className="au-notiprev__m">MyBDR · 지금</div>
                </div>
              </div>
            </div>
          </Panel>
          <Panel title="발송 요약">
            <div className="au-dl">
              <div className="au-dl__row"><span className="au-dl__k">채널</span><span className="au-dl__v">{ch.map((c) => D.OPT_CHANNELS.find((x) => x.id === c)?.label).join(', ') || '—'}</span></div>
              <div className="au-dl__row"><span className="au-dl__k">시점</span><span className="au-dl__v">{when === 'now' ? '즉시' : '예약'}</span></div>
            </div>
            <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <Btn variant="secondary" block icon="save">임시저장</Btn>
              <Btn variant="primary" block icon="send" onClick={() => go('notifications')}>{when === 'now' ? '지금 발송' : '예약 등록'}</Btn>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}

// =====================================================================
// 3. 캠페인 생성
// =====================================================================
function AuCreateCampaign({ go }) {
  const [type, setType] = useState('배너');
  const [slot, setSlot] = useState('홈 상단');
  return (
    <div>
      <FormHead go={go} back="campaigns" eyebrow="비즈니스" icon="megaphone" title="캠페인 생성" sub="배너·푸시 광고를 설정하고 노출 위치와 기간을 지정합니다." />
      <div className="au-dgrid au-dgrid--wide">
        <Panel>
          <div className="au-form au-form--wide">
            <Field label="캠페인명"><TextInput placeholder="예: 여름 챌린지 배너" /></Field>
            <Field label="유형"><PickRow options={D.OPT_CAMP_TYPE} value={type} onChange={setType} /></Field>
            <Field label="노출 위치"><PickRow options={D.OPT_CAMP_SLOT} value={slot} onChange={setSlot} /></Field>
            <div className="au-frow">
              <Field label="시작일"><TextInput type="date" /></Field>
              <Field label="종료일"><TextInput type="date" /></Field>
            </div>
            <div className="au-frow">
              <Field label="예산" opt="원"><TextInput type="number" defaultValue="2000000" /></Field>
              <Field label="연결 파트너" opt="선택"><Select options={['—', ...D.PARTNERS.map((p) => p.name)]} /></Field>
            </div>
            <Field label="소재 업로드"><Upload t="배너 이미지 업로드" d={type === '배너' ? '1200×400 권장' : '아이콘 256×256'} /></Field>
          </div>
        </Panel>
        <Panel title="발행">
          <div className="au-dl">
            <div className="au-dl__row"><span className="au-dl__k">유형</span><span className="au-dl__v">{type}</span></div>
            <div className="au-dl__row"><span className="au-dl__k">위치</span><span className="au-dl__v">{slot}</span></div>
            <div className="au-dl__row"><span className="au-dl__k">상태</span><span className="au-dl__v"><Badge tone="grey">초안</Badge></span></div>
          </div>
          <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <Btn variant="secondary" block icon="eye">미리보기</Btn>
            <Btn variant="primary" block icon="check" onClick={() => go('campaigns')}>캠페인 등록</Btn>
          </div>
        </Panel>
      </div>
    </div>
  );
}

// =====================================================================
// 4. NEWS 기사 작성
// =====================================================================
function AuWriteNews({ go }) {
  return (
    <div>
      <FormHead go={go} back="community" eyebrow="사용자·커뮤니티" icon="newspaper" title="BDR NEWS 기사 작성" sub="기자 콘텐츠를 작성하고 검수 후 게시합니다." />
      <div className="au-dgrid au-dgrid--wide">
        <Panel>
          <div className="au-form au-form--wide">
            <Field label="제목"><TextInput placeholder="기사 제목을 입력하세요" /></Field>
            <Field label="카테고리"><PickRow options={D.OPT_NEWS_CAT} value="대회" onChange={() => {}} /></Field>
            <Field label="썸네일"><Upload t="대표 이미지 업로드" d="1200×630 권장" /></Field>
            <Field label="본문"><TextArea style={{ minHeight: 280 }} placeholder="기사 본문을 입력하세요." /></Field>
          </div>
        </Panel>
        <Panel title="게시 설정">
          <div className="au-dl">
            <div className="au-dl__row"><span className="au-dl__k">작성자</span><span className="au-dl__v">알기자</span></div>
            <div className="au-dl__row"><span className="au-dl__k">상태</span><span className="au-dl__v"><Badge tone="grey">임시저장</Badge></span></div>
          </div>
          <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <Btn variant="secondary" block icon="save">임시저장</Btn>
            <Btn variant="secondary" block icon="eye">검수 요청</Btn>
            <Btn variant="primary" block icon="send" onClick={() => go('community')}>게시</Btn>
          </div>
        </Panel>
      </div>
    </div>
  );
}

Object.assign(window, { AuCreateTournament, AuComposeNotification, AuCreateCampaign, AuWriteNews, AuAddModal: AddModal });
})();

/* global React, Avatar, PasswordInput */

// ============================================================
// Phase D — EditProfile (프로필 편집)
//
// 4 그룹 구조 (의뢰서 정합):
//   1. 기본 정보 (닉네임 / 실명 / 생년월일 / 한 줄 소개 / 본인인증)
//   2. 농구 정보 (포지션 / 신장·체중 / 주 사용손 / 실력 / 강점)
//   3. 활동 환경 (활동 지역 / 활동 시간대 / 가용 요일 / 선호 코트)
//   4. 계정·보안 (이메일 / 휴대폰 / 비밀번호 변경 / 2단계 / 연결계정)
//
// 룰: var(--*) 토큰만 / 16px 입력 / 44px 터치 / PasswordInput 재사용
// ============================================================

const { useState } = React;

function EditProfile({ setRoute }) {
  const [section, setSection] = useState('basic');
  const [saved, setSaved] = useState(false);

  const sections = [
    { id: 'basic',   label: '기본 정보',   sub: '공개 프로필' },
    { id: 'play',    label: '농구 정보',   sub: '플레이 스타일' },
    { id: 'env',     label: '활동 환경',   sub: '지역·시간' },
    { id: 'account', label: '계정·보안',   sub: '로그인·인증' },
  ];

  const onSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="page edit-profile">
      {/* Breadcrumb */}
      <div style={{display:'flex', gap:6, fontSize:12, color:'var(--ink-mute)', marginBottom:12}}>
        <a onClick={()=>setRoute('home')} style={{cursor:'pointer'}}>홈</a><span>›</span>
        <a onClick={()=>setRoute('profile')} style={{cursor:'pointer'}}>마이페이지</a><span>›</span>
        <span style={{color:'var(--ink)'}}>프로필 편집</span>
      </div>

      {/* Hero */}
      <header style={{
        display:'grid', gridTemplateColumns:'1fr auto', alignItems:'flex-end',
        gap:12, marginBottom:20, flexWrap:'wrap',
      }}>
        <div style={{minWidth:0}}>
          <div className="eyebrow">EDIT PROFILE</div>
          <h1 style={{margin:'4px 0 2px', fontFamily:'var(--ff-display)', fontSize:'var(--fs-h1)', fontWeight:800, letterSpacing:'-0.015em'}}>
            프로필 편집
          </h1>
          <div style={{fontSize:13, color:'var(--ink-mute)'}}>
            마이페이지에 표시되는 정보를 수정합니다
          </div>
        </div>
        <div style={{display:'flex', gap:8, alignItems:'center', flex:'0 0 auto'}}>
          {saved && (
            <span style={{
              fontSize:12, fontWeight:700, color:'var(--ok)',
              padding:'4px 10px', background:'color-mix(in oklab, var(--ok) 12%, transparent)',
              borderRadius:'var(--radius-chip)',
            }}>
              ✓ 저장 완료
            </span>
          )}
          <button className="btn btn--sm" onClick={()=>setRoute('profile')}>취소</button>
          <button className="btn btn--sm btn--primary" onClick={onSave}>저장</button>
        </div>
      </header>

      {/* Two-column layout: 좌 nav / 우 폼 */}
      <div className="edit-profile__split" style={{
        display:'grid', gridTemplateColumns:'220px minmax(0, 1fr)',
        gap:20, alignItems:'flex-start',
      }}>
        {/* 좌측 섹션 nav */}
        <aside className="edit-profile__nav" style={{
          position:'sticky', top:120,
          display:'flex', flexDirection:'column', gap:2,
        }}>
          {sections.map(s => (
            <button key={s.id} onClick={()=>setSection(s.id)} style={{
              textAlign:'left', padding:'12px 14px',
              background: section === s.id ? 'var(--bg-alt)' : 'transparent',
              border: 0,
              borderLeft: section === s.id ? '3px solid var(--accent)' : '3px solid transparent',
              cursor:'pointer',
              minHeight:44,
            }}>
              <div style={{
                fontSize:13, fontWeight: section === s.id ? 700 : 500,
                color: section === s.id ? 'var(--ink)' : 'var(--ink-soft)',
              }}>
                {s.label}
              </div>
              <div style={{fontSize:11, color:'var(--ink-dim)', marginTop:1}}>{s.sub}</div>
            </button>
          ))}
        </aside>

        {/* 우측 폼 */}
        <div className="card" style={{padding:'24px 28px'}}>
          {section === 'basic'   && <BasicSection/>}
          {section === 'play'    && <PlaySection/>}
          {section === 'env'     && <EnvSection/>}
          {section === 'account' && <AccountSection setRoute={setRoute}/>}
        </div>
      </div>

      <style>{`
        @media (max-width: 720px) {
          .edit-profile__split { grid-template-columns: 1fr !important; }
          .edit-profile__nav { position: static !important; flex-direction: row !important; overflow-x: auto; gap: 4px !important; padding-bottom: 4px; }
          .edit-profile__nav button { white-space: nowrap; border-left: 0 !important; border-bottom: 2px solid transparent; min-width: max-content; }
          .edit-profile__nav button[style*="3px solid var(--accent)"] { border-left: 0 !important; border-bottom: 2px solid var(--accent) !important; }
        }
      `}</style>
    </div>
  );
}

// ============================================================
// BasicSection — 기본 정보
// ============================================================
function BasicSection() {
  const [bio, setBio] = useState('주말 아침 코트 즐겨찾기. 좌공 좌포 · 스팟업 슈터.');
  const [verified] = useState(true); // Phase 12 본인인증

  return (
    <div>
      <SectionHead title="기본 정보" desc="마이페이지에 공개되는 기본 프로필"/>

      {/* 아바타 */}
      <Field label="프로필 사진" sub="정방형 PNG·JPG · 최대 2MB" full>
        <div style={{display:'flex', gap:14, alignItems:'center'}}>
          <Avatar tag="RDM" color="var(--accent)" ink="#fff" size={72} radius={6}/>
          <div style={{display:'flex', flexDirection:'column', gap:6, flex:1}}>
            <div style={{display:'flex', gap:6, flexWrap:'wrap'}}>
              <button className="btn btn--sm">새 사진 업로드</button>
              <button className="btn btn--sm" style={{color:'var(--err)'}}>제거</button>
            </div>
            <div style={{fontSize:11, color:'var(--ink-dim)'}}>
              부적절한 사진은 운영 가이드라인에 따라 자동 제거될 수 있습니다.
            </div>
          </div>
        </div>
      </Field>

      <FieldGrid>
        <Field label="닉네임" required sub="커뮤니티에 노출">
          <input className="input" defaultValue="리딤캡틴" style={{fontSize:16, minHeight:44}}/>
        </Field>
        <Field label={
          <span style={{display:'inline-flex', alignItems:'center', gap:6}}>
            실명
            {verified && <VerifiedBadge/>}
          </span>
        } sub="비공개 · 대회 등록 시 확인용">
          <input className="input" defaultValue="김현우" disabled={verified}
            style={{fontSize:16, minHeight:44, background: verified ? 'var(--bg-alt)' : ''}}/>
        </Field>
        <Field label="생년월일" sub="비공개 · 연령별 대회 매칭용">
          <input className="input" type="date" defaultValue="1998-05-12" style={{fontSize:16, minHeight:44}}/>
        </Field>
        <Field label="성별" sub="비공개 · 대회 부문 분리용">
          <select className="input" defaultValue="M" style={{fontSize:16, minHeight:44}}>
            <option value="M">남성</option>
            <option value="F">여성</option>
            <option value="N">미공개</option>
          </select>
        </Field>
      </FieldGrid>

      <Field label="한 줄 소개" sub={`${bio.length}/200`} full style={{marginTop:16}}>
        <textarea className="input" rows={3} value={bio}
          onChange={(e)=>setBio(e.target.value.slice(0, 200))}
          style={{fontSize:16, resize:'vertical'}}/>
      </Field>

      {/* 본인인증 영역 */}
      <div style={{
        marginTop:20, padding:'14px 16px',
        background: verified ? 'color-mix(in oklab, var(--ok) 8%, transparent)' : 'var(--bg-alt)',
        border:`1px solid ${verified ? 'color-mix(in oklab, var(--ok) 30%, var(--border))' : 'var(--border)'}`,
        borderRadius:6,
        display:'flex', alignItems:'center', justifyContent:'space-between', gap:12, flexWrap:'wrap',
      }}>
        <div style={{minWidth:0}}>
          <div style={{display:'flex', alignItems:'center', gap:6, marginBottom:2}}>
            <span style={{fontWeight:700, fontSize:13}}>본인 인증</span>
            {verified && <VerifiedBadge/>}
          </div>
          <div style={{fontSize:12, color:'var(--ink-mute)'}}>
            {verified
              ? '2026.03.12 인증 완료 · 대회 등록·결제 가능'
              : '대회 참가, 결제 등 일부 기능 사용 시 본인인증이 필요합니다'}
          </div>
        </div>
        {!verified && <button className="btn btn--sm btn--primary">인증하기</button>}
      </div>
    </div>
  );
}

// ============================================================
// PlaySection — 농구 정보
// ============================================================
function PlaySection() {
  const [pos, setPos] = useState('SG');
  const [hand, setHand] = useState('R');
  const [level, setLevel] = useState('중-상급');
  const [strengths, setStrengths] = useState(['3점슛', '패싱', '수비']);
  const allStrengths = ['3점슛','돌파','미드레인지','스크린','리바운드','스틸','패싱','체력','수비','BQ'];

  const toggleStrength = (s) => {
    setStrengths(strengths.includes(s)
      ? strengths.filter(x => x !== s)
      : strengths.length < 5 ? [...strengths, s] : strengths);
  };

  return (
    <div>
      <SectionHead title="농구 정보" desc="매칭·게스트 지원 시 호스트에게 노출되는 정보"/>

      <Field label="주 포지션" required sub="단일 선택" full>
        <ChipGroup options={['PG','SG','SF','PF','C']} value={pos} onChange={setPos}/>
      </Field>

      <FieldGrid style={{marginTop:16}} cols={3}>
        <Field label="신장 (cm)">
          <input className="input" type="number" defaultValue={182} style={{fontSize:16, minHeight:44}}/>
        </Field>
        <Field label="체중 (kg)" sub="비공개">
          <input className="input" type="number" defaultValue={78} style={{fontSize:16, minHeight:44}}/>
        </Field>
        <Field label="윙스팬 (cm)" sub="선택">
          <input className="input" type="number" placeholder="190" style={{fontSize:16, minHeight:44}}/>
        </Field>
      </FieldGrid>

      <Field label="주 사용손" full style={{marginTop:16}}>
        <ChipGroup
          options={[{v:'L', l:'왼손'},{v:'R', l:'오른손'},{v:'B', l:'양손'}]}
          value={hand} onChange={setHand}/>
      </Field>

      <Field label="실력 수준" required sub="자체 평가 · 매칭 필터에 사용" full style={{marginTop:16}}>
        <ChipGroup
          options={['초보','초-중급','중급','중-상급','상급','선출급']}
          value={level} onChange={setLevel}/>
      </Field>

      <Field label={`강점 (${strengths.length}/5)`} sub="최대 5개 · 게스트 지원 시 표시" full style={{marginTop:16}}>
        <div style={{display:'flex', gap:6, flexWrap:'wrap'}}>
          {allStrengths.map(s => {
            const on = strengths.includes(s);
            return (
              <button key={s} onClick={()=>toggleStrength(s)} style={{
                padding:'8px 14px', minHeight:36, fontSize:13,
                background: on ? 'var(--cafe-blue-soft)' : 'transparent',
                color: on ? 'var(--cafe-blue-deep)' : 'var(--ink-soft)',
                border:`1px solid ${on ? 'var(--cafe-blue-hair)' : 'var(--border)'}`,
                borderRadius:'var(--radius-chip)',
                fontWeight: on ? 700 : 500,
                cursor:'pointer',
              }}>
                {s}
              </button>
            );
          })}
        </div>
      </Field>

      <FieldGrid style={{marginTop:16}}>
        <Field label="농구 시작" sub="연도">
          <select className="input" defaultValue={2019} style={{fontSize:16, minHeight:44}}>
            {Array.from({length:30}, (_, i)=>2026-i).map(y =>
              <option key={y} value={y}>{y}년</option>)}
          </select>
        </Field>
        <Field label="선출 여부" sub="중·고·대 농구부 출신">
          <select className="input" defaultValue="amateur" style={{fontSize:16, minHeight:44}}>
            <option value="amateur">아마추어</option>
            <option value="middle">중학교</option>
            <option value="high">고등학교</option>
            <option value="college">대학교</option>
            <option value="pro">실업·프로</option>
          </select>
        </Field>
      </FieldGrid>
    </div>
  );
}

// ============================================================
// EnvSection — 활동 환경
// ============================================================
function EnvSection() {
  const [days, setDays] = useState(['토', '일']);
  const [times, setTimes] = useState(['아침', '저녁']);
  const allDays = ['월','화','수','목','금','토','일'];
  const allTimes = [
    { v:'새벽', l:'새벽 (5–8시)' },
    { v:'아침', l:'아침 (8–12시)' },
    { v:'오후', l:'오후 (12–18시)' },
    { v:'저녁', l:'저녁 (18–22시)' },
    { v:'심야', l:'심야 (22–02시)' },
  ];

  const toggle = (arr, setArr, v) =>
    setArr(arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v]);

  return (
    <div>
      <SectionHead title="활동 환경" desc="언제, 어디서 주로 농구를 하는지 알려주세요"/>

      <FieldGrid>
        <Field label="활동 시·도" required>
          <select className="input" defaultValue="seoul" style={{fontSize:16, minHeight:44}}>
            <option value="seoul">서울특별시</option>
            <option value="gyeonggi">경기도</option>
            <option value="incheon">인천광역시</option>
            <option value="busan">부산광역시</option>
            <option value="daegu">대구광역시</option>
            <option value="other">기타</option>
          </select>
        </Field>
        <Field label="활동 시·군·구" required>
          <input className="input" defaultValue="성동구" style={{fontSize:16, minHeight:44}}/>
        </Field>
      </FieldGrid>

      <Field label="가용 요일" required sub="복수 선택" full style={{marginTop:16}}>
        <div style={{display:'flex', gap:6, flexWrap:'wrap'}}>
          {allDays.map(d => {
            const on = days.includes(d);
            return (
              <button key={d} onClick={()=>toggle(days, setDays, d)} style={{
                width:44, height:44, fontSize:14, fontWeight:700,
                background: on ? 'var(--accent)' : 'transparent',
                color: on ? '#fff' : 'var(--ink-soft)',
                border: `1px solid ${on ? 'var(--accent)' : 'var(--border)'}`,
                borderRadius:6,
                cursor:'pointer',
              }}>
                {d}
              </button>
            );
          })}
        </div>
      </Field>

      <Field label="활동 시간대" sub="복수 선택" full style={{marginTop:16}}>
        <div style={{display:'flex', gap:6, flexWrap:'wrap'}}>
          {allTimes.map(t => {
            const on = times.includes(t.v);
            return (
              <button key={t.v} onClick={()=>toggle(times, setTimes, t.v)} style={{
                padding:'10px 14px', minHeight:44, fontSize:13,
                background: on ? 'var(--cafe-blue-soft)' : 'transparent',
                color: on ? 'var(--cafe-blue-deep)' : 'var(--ink-soft)',
                border:`1px solid ${on ? 'var(--cafe-blue-hair)' : 'var(--border)'}`,
                borderRadius:'var(--radius-chip)',
                fontWeight: on ? 700 : 500,
                cursor:'pointer',
              }}>
                {t.l}
              </button>
            );
          })}
        </div>
      </Field>

      <Field label="선호 코트" sub="자주 가는 코트 (3개까지)" full style={{marginTop:16}}>
        <div style={{display:'flex', flexDirection:'column', gap:6}}>
          {['미사강변체육관', '잠실종합운동장 외부코트', '한강 뚝섬코트'].map((c, i) => (
            <div key={i} style={{
              display:'flex', alignItems:'center', justifyContent:'space-between',
              padding:'10px 14px', minHeight:44,
              background:'var(--bg-alt)', border:'1px solid var(--border)', borderRadius:6,
            }}>
              <span style={{fontSize:13, fontWeight:500}}>{c}</span>
              <button style={{
                background:'transparent', border:0, cursor:'pointer',
                color:'var(--err)', fontSize:12, padding:6,
              }}>제거</button>
            </div>
          ))}
          <button className="btn btn--sm" style={{alignSelf:'flex-start', minHeight:44}}>
            + 코트 추가
          </button>
        </div>
      </Field>
    </div>
  );
}

// ============================================================
// AccountSection — 계정·보안
// ============================================================
function AccountSection({ setRoute }) {
  const [phoneVerified, setPhoneVerified] = useState(true);
  const [twoFA, setTwoFA] = useState(false);

  return (
    <div>
      <SectionHead title="계정·보안" desc="로그인, 비밀번호, 2단계 인증을 관리합니다"/>

      <FieldGrid>
        <Field label="이메일" required sub="로그인 ID">
          <input className="input" type="email" defaultValue="rdm@example.com"
            style={{fontSize:16, minHeight:44}}/>
        </Field>
        <Field label={
          <span style={{display:'inline-flex', alignItems:'center', gap:6}}>
            휴대폰
            {phoneVerified && <VerifiedBadge/>}
          </span>
        } sub="2단계 인증 · 대회 연락용">
          <div style={{display:'flex', gap:6}}>
            <input className="input" defaultValue="010-****-**89"
              style={{flex:1, fontSize:16, minHeight:44}}/>
            <button className="btn btn--sm" style={{minHeight:44, padding:'0 14px'}}>
              {phoneVerified ? '재인증' : '인증'}
            </button>
          </div>
        </Field>
      </FieldGrid>

      {/* 비밀번호 변경 */}
      <div style={{marginTop:24, paddingTop:20, borderTop:'1px solid var(--border)'}}>
        <div style={{fontSize:14, fontWeight:700, marginBottom:4}}>비밀번호 변경</div>
        <div style={{fontSize:12, color:'var(--ink-mute)', marginBottom:12}}>
          마지막 변경 3개월 전 · 영문·숫자·특수문자 포함 8자 이상
        </div>
        <div style={{display:'flex', flexDirection:'column', gap:10, maxWidth:420}}>
          <Field label="현재 비밀번호">
            <PasswordInput autoComplete="current-password" placeholder="현재 비밀번호"/>
          </Field>
          <Field label="새 비밀번호">
            <PasswordInput autoComplete="new-password" placeholder="새 비밀번호"/>
          </Field>
          <Field label="새 비밀번호 확인">
            <PasswordInput autoComplete="new-password" placeholder="새 비밀번호 다시 입력"/>
          </Field>
          <button className="btn btn--sm btn--primary" style={{alignSelf:'flex-start', minHeight:44}}>
            비밀번호 변경
          </button>
        </div>
      </div>

      {/* 2단계 인증 */}
      <div style={{
        marginTop:24, padding:'14px 16px',
        background:'var(--bg-alt)', border:'1px solid var(--border)', borderRadius:6,
        display:'flex', alignItems:'center', justifyContent:'space-between', gap:12, flexWrap:'wrap',
      }}>
        <div style={{minWidth:0}}>
          <div style={{display:'flex', alignItems:'center', gap:6, marginBottom:2}}>
            <span style={{fontWeight:700, fontSize:13}}>2단계 인증 (OTP)</span>
            {twoFA && (
              <span style={{
                fontSize:10, fontWeight:800, padding:'2px 6px',
                background:'var(--ok)', color:'#fff', borderRadius:3, letterSpacing:'.04em',
              }}>활성</span>
            )}
          </div>
          <div style={{fontSize:12, color:'var(--ink-mute)'}}>
            로그인 시 SMS로 6자리 인증번호를 추가 입력합니다
          </div>
        </div>
        <button className="btn btn--sm" style={{minHeight:44, padding:'0 14px'}}
          onClick={()=>setTwoFA(!twoFA)}>
          {twoFA ? '해제' : '활성화'}
        </button>
      </div>

      {/* 연결된 계정 */}
      <div style={{marginTop:24}}>
        <div style={{fontSize:14, fontWeight:700, marginBottom:12}}>연결된 계정</div>
        <div style={{display:'flex', flexDirection:'column', gap:6}}>
          {[
            { name:'카카오', linked:true, sub:'kakao_8842' },
            { name:'구글', linked:true, sub:'rdm@gmail.com' },
            { name:'애플', linked:false, sub:'연결되지 않음' },
            { name:'네이버', linked:false, sub:'연결되지 않음' },
          ].map(p => (
            <div key={p.name} style={{
              display:'flex', alignItems:'center', justifyContent:'space-between',
              padding:'12px 14px', minHeight:44,
              background:'var(--bg-alt)', border:'1px solid var(--border)', borderRadius:6,
              gap:10,
            }}>
              <div style={{minWidth:0}}>
                <div style={{fontWeight:600, fontSize:13}}>{p.name}</div>
                <div style={{fontSize:11, color:'var(--ink-dim)', fontFamily:'var(--ff-mono)'}}>{p.sub}</div>
              </div>
              <button className="btn btn--sm" style={{minHeight:36}}>
                {p.linked ? '해제' : '연결'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// 공통 헬퍼
// ============================================================

function SectionHead({ title, desc }) {
  return (
    <div style={{marginBottom:20}}>
      <h2 style={{margin:0, fontSize:18, fontWeight:700, letterSpacing:'-0.01em'}}>{title}</h2>
      {desc && <div style={{fontSize:12, color:'var(--ink-mute)', marginTop:4}}>{desc}</div>}
    </div>
  );
}

function Field({ label, sub, required, children, full, style }) {
  return (
    <div style={{gridColumn: full ? '1 / -1' : 'auto', ...style}}>
      <div style={{display:'flex', alignItems:'baseline', justifyContent:'space-between', marginBottom:6, gap:6}}>
        <label style={{fontSize:12, fontWeight:700, color:'var(--ink-soft)'}}>
          {label}
          {required && <span style={{color:'var(--accent)', marginLeft:2}}>*</span>}
        </label>
        {sub && <span style={{fontSize:11, color:'var(--ink-dim)'}}>{sub}</span>}
      </div>
      {children}
    </div>
  );
}

function FieldGrid({ children, cols = 2, style }) {
  return (
    <div style={{
      display:'grid',
      gridTemplateColumns:`repeat(${cols}, minmax(0, 1fr))`,
      gap:14,
      ...style,
    }}>
      {React.Children.map(children, (c, i) => (
        <div key={i} style={{minWidth:0}}>{c}</div>
      ))}
      <style>{`
        @media (max-width: 720px) {
          .edit-profile div[style*="repeat(${cols}, minmax(0, 1fr))"] { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}

function ChipGroup({ options, value, onChange }) {
  const opts = options.map(o => typeof o === 'string' ? { v: o, l: o } : o);
  return (
    <div style={{display:'flex', gap:6, flexWrap:'wrap'}}>
      {opts.map(o => {
        const on = value === o.v;
        return (
          <button key={o.v} onClick={()=>onChange(o.v)} style={{
            padding:'10px 16px', minHeight:44, fontSize:13,
            background: on ? 'var(--accent)' : 'transparent',
            color: on ? '#fff' : 'var(--ink-soft)',
            border:`1px solid ${on ? 'var(--accent)' : 'var(--border)'}`,
            borderRadius:6,
            fontWeight: on ? 700 : 500,
            cursor:'pointer',
          }}>
            {o.l}
          </button>
        );
      })}
    </div>
  );
}

function VerifiedBadge() {
  return (
    <span title="본인인증 완료" style={{
      display:'inline-flex', alignItems:'center', gap:3,
      fontSize:10, fontWeight:800,
      padding:'2px 6px',
      background: 'color-mix(in oklab, var(--ok) 14%, transparent)',
      color:'var(--ok)',
      border: '1px solid color-mix(in oklab, var(--ok) 35%, transparent)',
      borderRadius:3,
      letterSpacing:'.04em',
    }}>
      ✓ 인증
    </span>
  );
}

window.EditProfile = EditProfile;

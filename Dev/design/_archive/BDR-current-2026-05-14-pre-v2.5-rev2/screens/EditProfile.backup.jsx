/* global React, Avatar */

function EditProfile({ setRoute }) {
  const [tab, setTab] = React.useState('basic');
  const [saved, setSaved] = React.useState(false);
  const [profile, setProfile] = React.useState({
    nickname: 'rdm_captain',
    realName: '김현우',
    bio: '좌공 좌포 · 스팟업 슈터. 주말 아침 코트 즐겨찾기.',
    pos: 'G',
    height: 182,
    weight: 78,
    hand: 'R',
    level: '중-상급',
    since: 2019,
    area: '서울 성동구',
    phone: '010-****-**89',
    email: 'rdm@example.com',
    avatar: null,
    banner: null,
  });

  const update = (k, v) => setProfile({...profile, [k]:v});

  const tabs = [
    { id:'basic',    l:'기본 정보', icon:'👤' },
    { id:'skill',    l:'플레이 정보', icon:'🏀' },
    { id:'contact',  l:'연락 정보', icon:'📧' },
    { id:'photo',    l:'사진', icon:'🖼' },
    { id:'privacy',  l:'공개 설정', icon:'🔒' },
  ];

  return (
    <div className="page">
      <div style={{display:'flex', gap:6, fontSize:12, color:'var(--ink-mute)', marginBottom:12}}>
        <a onClick={()=>setRoute('home')} style={{cursor:'pointer'}}>홈</a><span>›</span>
        <a onClick={()=>setRoute('profile')} style={{cursor:'pointer'}}>마이페이지</a><span>›</span>
        <span style={{color:'var(--ink)'}}>프로필 편집</span>
      </div>

      <div style={{marginBottom:20, display:'flex', justifyContent:'space-between', alignItems:'flex-end', gap:10}}>
        <div>
          <div className="eyebrow">EDIT PROFILE · 프로필 편집</div>
          <h1 style={{margin:'6px 0 0', fontSize:28, fontWeight:800, letterSpacing:'-0.02em'}}>프로필 편집</h1>
        </div>
        <div style={{display:'flex', gap:8, alignItems:'center'}}>
          {saved && <span style={{color:'var(--ok)', fontSize:12, fontWeight:700}}>✓ 저장됨</span>}
          <button className="btn" onClick={()=>setRoute('profile')}>취소</button>
          <button className="btn btn--primary" onClick={()=>{ setSaved(true); setTimeout(()=>setSaved(false), 2000); }}>저장</button>
        </div>
      </div>

      <div style={{display:'grid', gridTemplateColumns:'220px minmax(0,1fr)', gap:18, alignItems:'flex-start'}}>
        {/* Sidebar tabs */}
        <aside style={{position:'sticky', top:120, display:'flex', flexDirection:'column', gap:2}}>
          {tabs.map(t => (
            <button key={t.id} onClick={()=>setTab(t.id)} style={{
              textAlign:'left', padding:'11px 14px',
              background: tab===t.id ? 'var(--bg-alt)' : 'transparent',
              border:0, borderLeft: tab===t.id ? '3px solid var(--accent)' : '3px solid transparent',
              cursor:'pointer', fontSize:13, fontWeight: tab===t.id?700:500,
              display:'flex', gap:10, alignItems:'center',
              color: tab===t.id ? 'var(--ink)' : 'var(--ink-soft)',
            }}>
              <span style={{width:20, textAlign:'center'}}>{t.icon}</span>
              {t.l}
            </button>
          ))}
        </aside>

        <div className="card" style={{padding:'28px 32px'}}>
          {tab === 'basic' && (
            <div>
              <h2 style={{margin:'0 0 20px', fontSize:18, fontWeight:700}}>기본 정보</h2>
              <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:16}}>
                <Field label="닉네임 *" sub="커뮤니티에 표시되는 이름">
                  <input className="input" value={profile.nickname} onChange={e=>update('nickname', e.target.value)}/>
                </Field>
                <Field label="실명" sub="비공개 · 대회 등록 시 확인용">
                  <input className="input" value={profile.realName} onChange={e=>update('realName', e.target.value)}/>
                </Field>
                <Field label="활동 지역" sub="주 활동 시·구" full>
                  <input className="input" value={profile.area} onChange={e=>update('area', e.target.value)}/>
                </Field>
                <Field label="소개" sub={`${profile.bio.length}/200`} full>
                  <textarea className="input" rows={3} value={profile.bio} onChange={e=>update('bio', e.target.value)} style={{resize:'vertical'}}/>
                </Field>
                <Field label="농구 시작" sub="연도">
                  <select className="input" value={profile.since} onChange={e=>update('since', Number(e.target.value))}>
                    {Array.from({length:30}, (_, i)=>2026-i).map(y=> <option key={y} value={y}>{y}년</option>)}
                  </select>
                </Field>
                <Field label="생년월일" sub="비공개 · 나이별 대회용">
                  <input className="input" type="date" defaultValue="1998-05-12"/>
                </Field>
              </div>
            </div>
          )}

          {tab === 'skill' && (
            <div>
              <h2 style={{margin:'0 0 20px', fontSize:18, fontWeight:700}}>플레이 정보</h2>
              <Field label="주 포지션 *" sub="게스트·매칭 필터링에 사용">
                <div style={{display:'flex', gap:8, flexWrap:'wrap'}}>
                  {['PG','SG','SF','PF','C'].map(p => (
                    <button key={p} onClick={()=>update('pos', p)} className={`btn ${profile.pos===p?'btn--primary':''} btn--sm`}>{p}</button>
                  ))}
                </div>
              </Field>
              <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:16, marginTop:16}}>
                <Field label="신장 (cm)">
                  <input className="input" type="number" value={profile.height} onChange={e=>update('height', Number(e.target.value))}/>
                </Field>
                <Field label="체중 (kg)" sub="비공개">
                  <input className="input" type="number" value={profile.weight} onChange={e=>update('weight', Number(e.target.value))}/>
                </Field>
                <Field label="주 사용 손">
                  <div style={{display:'flex', gap:6}}>
                    {[{v:'L', l:'왼손'},{v:'R', l:'오른손'},{v:'B', l:'양손'}].map(h => (
                      <button key={h.v} onClick={()=>update('hand', h.v)} className={`btn btn--sm ${profile.hand===h.v?'btn--primary':''}`} style={{flex:1}}>{h.l}</button>
                    ))}
                  </div>
                </Field>
              </div>
              <Field label="실력 수준 *" sub="자체 평가 · 레이팅 반영 안 됨" style={{marginTop:16}}>
                <div style={{display:'flex', gap:6, flexWrap:'wrap'}}>
                  {['초보','초-중급','중급','중-상급','상급','선출급'].map(l => (
                    <button key={l} onClick={()=>update('level', l)} className={`btn btn--sm ${profile.level===l?'btn--primary':''}`}>{l}</button>
                  ))}
                </div>
              </Field>
              <Field label="강점 (복수)" sub="게스트 지원 시 호스트에게 보임" style={{marginTop:16}}>
                <div style={{display:'flex', gap:6, flexWrap:'wrap'}}>
                  {['3점슛','돌파','미드레인지','스크린','리바운드','스틸','패싱','체력','수비'].map(s => (
                    <button key={s} className="btn btn--sm" style={{background:'var(--bg-alt)'}}>{s}</button>
                  ))}
                </div>
              </Field>
            </div>
          )}

          {tab === 'contact' && (
            <div>
              <h2 style={{margin:'0 0 4px', fontSize:18, fontWeight:700}}>연락 정보</h2>
              <p style={{margin:'0 0 20px', fontSize:13, color:'var(--ink-mute)'}}>공개 여부는 [공개 설정] 탭에서 개별 조정할 수 있습니다.</p>
              <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:16}}>
                <Field label="이메일 *" sub="계정 로그인·알림용">
                  <input className="input" type="email" value={profile.email} onChange={e=>update('email', e.target.value)}/>
                </Field>
                <Field label="휴대폰" sub="2단계 인증·대회 연락용">
                  <div style={{display:'flex', gap:6}}>
                    <input className="input" value={profile.phone} onChange={e=>update('phone', e.target.value)} style={{flex:1}}/>
                    <button className="btn btn--sm">인증</button>
                  </div>
                </Field>
                <Field label="인스타그램" sub="@아이디만 (선택)">
                  <input className="input" placeholder="@rdm_hoops"/>
                </Field>
                <Field label="유튜브" sub="개인 채널 (선택)">
                  <input className="input" placeholder="https://…"/>
                </Field>
              </div>
            </div>
          )}

          {tab === 'photo' && (
            <div>
              <h2 style={{margin:'0 0 20px', fontSize:18, fontWeight:700}}>사진</h2>
              <Field label="프로필 사진" sub="정방형 권장 · 최대 2MB">
                <div style={{display:'flex', gap:16, alignItems:'center'}}>
                  <div style={{width:96, height:96, borderRadius:'50%', background:'#0F5FCC', color:'#fff', display:'grid', placeItems:'center', fontWeight:900, fontSize:32, fontFamily:'var(--ff-display)'}}>R</div>
                  <div style={{flex:1}}>
                    <button className="btn btn--sm">새 사진 업로드</button>
                    <button className="btn btn--sm" style={{marginLeft:6, color:'var(--err)'}}>제거</button>
                    <div style={{fontSize:11, color:'var(--ink-dim)', marginTop:8}}>PNG·JPG · 정방형 권장 · 최대 2MB</div>
                  </div>
                </div>
              </Field>
              <Field label="배너 이미지" sub="프로필 상단 · 1600×400 권장" style={{marginTop:18}}>
                <div style={{padding:'24px', border:'2px dashed var(--border)', borderRadius:8, textAlign:'center', background:'linear-gradient(135deg, #0F5FCC22, #DC262622)'}}>
                  <div style={{fontSize:28, opacity:.3, marginBottom:6}}>📁</div>
                  <div style={{fontSize:13, fontWeight:600}}>드래그 또는 클릭해서 업로드</div>
                  <div style={{fontSize:11, color:'var(--ink-dim)', marginTop:4}}>💎 BDR+ 멤버 전용</div>
                </div>
              </Field>
            </div>
          )}

          {tab === 'privacy' && (
            <div>
              <h2 style={{margin:'0 0 20px', fontSize:18, fontWeight:700}}>공개 설정</h2>
              <div style={{display:'flex', flexDirection:'column', gap:0}}>
                {[
                  { l:'프로필 전체', d:'나의 프로필 페이지 자체', v:'all', opts:['all','friends','none'] },
                  { l:'실명', d:'김현우', v:'none' },
                  { l:'연락처', d:'휴대폰·이메일', v:'friends' },
                  { l:'경기 기록', d:'스탯·이력', v:'all' },
                  { l:'매너 평가', d:'받은 리뷰', v:'all' },
                  { l:'활동 지역', d:'서울 성동구', v:'all' },
                  { l:'신장·체중', d:'프로필 정보', v:'friends' },
                ].map((r, i) => (
                  <div key={i} style={{display:'grid', gridTemplateColumns:'1fr auto', gap:10, padding:'14px 0', borderTop: i>0?'1px solid var(--border)':'none', alignItems:'center'}}>
                    <div>
                      <div style={{fontWeight:700, fontSize:13}}>{r.l}</div>
                      <div style={{fontSize:11, color:'var(--ink-dim)'}}>{r.d}</div>
                    </div>
                    <div style={{display:'flex', gap:4}}>
                      {[{v:'all', l:'전체'},{v:'friends', l:'친구'},{v:'none', l:'비공개'}].map(o => (
                        <button key={o.v} className={`btn btn--sm ${r.v===o.v?'btn--primary':''}`}>{o.l}</button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, sub, children, full, style }) {
  return (
    <div style={{gridColumn: full ? '1 / -1' : 'auto', ...style}}>
      <div style={{display:'flex', alignItems:'baseline', justifyContent:'space-between', marginBottom:6}}>
        <label style={{fontSize:12, fontWeight:700, color:'var(--ink-dim)'}}>{label}</label>
        {sub && <span style={{fontSize:11, color:'var(--ink-dim)'}}>{sub}</span>}
      </div>
      {children}
    </div>
  );
}

window.EditProfile = EditProfile;

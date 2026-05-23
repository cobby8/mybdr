/* global React */

/**
 * GameEdit — /games/[id]/edit (D등급 P0-2 신규)
 *
 * Why: 본인 호스트 경기 수정 (날짜·코트·인원·회비·모집 조건)
 * Pattern: CreateGame.jsx 의 3카드 분할 (정보/조건/고급) + prefill + edge case
 *
 * 진입: /games/[id] 호스트 본인일 때 "경기 수정" 버튼
 * 복귀: 저장 → /games/[id] / 취소 → /games/[id]
 * Edge: 신청자 ≥ 1명 → 인원·회비·날짜 잠금 (안내 배너) / 신청자 0 → 모든 필드 편집
 *       경기 시작 < 24시간 → 취소만 가능 / 경기 종료 → noEdit view
 *
 * 회귀 검수 매트릭스:
 *   기능              | 옛 페이지 | 시안 v2.2          | 진입점     | 모바일
 *   기본 정보 수정    | -        | ✅ prefill + 잠금     | host btn | 1열
 *   신청 조건 수정    | -        | ✅ checkbox 그룹      | host btn | 2→1열
 *   경기 취소         | -        | ✅ 위험 액션 카드     | host btn | OK
 *   호스트 권한 체크  | -        | ✅ noPermission view  | -        | OK
 */

function GameEdit({ setRoute, isHost = true, gameStatus = 'open', applicantCount = 0 }) {
  // gameStatus: 'open' (모집중) / 'closed' (마감) / 'finished' (종료)
  const [kind, setKind] = React.useState('pickup');
  const kinds = [
    { id:'pickup', label:'픽업', desc:'개인 단위 즉석 경기' },
    { id:'guest', label:'게스트', desc:'우리 팀에 일회성 게스트 모집' },
    { id:'scrimmage', label:'연습경기', desc:'팀 vs 팀 연습경기' },
  ];

  const lockedByApplicants = applicantCount > 0;
  const finishedView = gameStatus === 'finished';

  // ── 권한 없음 ──
  if (!isHost) {
    return (
      <div className="page">
        <div className="card" style={{padding:'48px 28px', textAlign:'center', maxWidth:520, margin:'40px auto'}}>
          <span className="material-symbols-outlined" style={{fontSize:56, color:'var(--ink-dim)'}}>lock</span>
          <h2 style={{margin:'14px 0 8px', fontSize:20}}>호스트만 수정할 수 있습니다</h2>
          <p style={{margin:'0 0 20px', color:'var(--ink-mute)', fontSize:14, lineHeight:1.6}}>
            이 경기를 개설한 호스트만 수정 권한이 있어요.<br/>
            게스트 신청을 원하시면 상세 페이지로 돌아가 주세요.
          </p>
          <button className="btn btn--primary" onClick={()=>setRoute('gameDetail')}>경기 상세로</button>
        </div>
      </div>
    );
  }

  // ── 종료된 경기 ──
  if (finishedView) {
    return (
      <div className="page">
        <div className="card" style={{padding:'48px 28px', textAlign:'center', maxWidth:520, margin:'40px auto'}}>
          <span className="material-symbols-outlined" style={{fontSize:56, color:'var(--ink-dim)'}}>event_busy</span>
          <h2 style={{margin:'14px 0 8px', fontSize:20}}>종료된 경기는 수정할 수 없어요</h2>
          <p style={{margin:'0 0 20px', color:'var(--ink-mute)', fontSize:14, lineHeight:1.6}}>
            경기가 끝나면 결과·기록만 작성할 수 있습니다.
          </p>
          <div style={{display:'flex', gap:8, justifyContent:'center'}}>
            <button className="btn" onClick={()=>setRoute('gameDetail')}>경기 상세</button>
            <button className="btn btn--primary" onClick={()=>setRoute('gameReport')}>경기 결과 작성</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div style={{maxWidth:760, margin:'0 auto'}}>
        {/* breadcrumb */}
        <div style={{display:'flex', gap:6, fontSize:12, color:'var(--ink-mute)', marginBottom:12, flexWrap:'wrap'}}>
          <a onClick={()=>setRoute('games')} style={{cursor:'pointer'}}>경기</a>
          <span>›</span>
          <a onClick={()=>setRoute('gameDetail')} style={{cursor:'pointer'}}>목요일 저녁 미사 픽업</a>
          <span>›</span>
          <span style={{color:'var(--ink)'}}>수정</span>
        </div>

        <div style={{marginBottom:20}}>
          <div className="eyebrow">EDIT · GAME</div>
          <h1 style={{margin:'6px 0 4px', fontSize:30, fontWeight:800, letterSpacing:'-0.015em'}}>경기 수정</h1>
          <div style={{fontSize:13, color:'var(--ink-mute)'}}>호스트 본인만 수정할 수 있습니다</div>
        </div>

        {/* ── 신청자 있는 경우 잠금 배너 ── */}
        {lockedByApplicants && (
          <div className="card" style={{padding:'14px 18px', marginBottom:14, background:'color-mix(in oklab, var(--bdr-red) 8%, transparent)', borderColor:'var(--bdr-red)', display:'flex', gap:10, alignItems:'flex-start'}}>
            <span className="material-symbols-outlined" style={{color:'var(--bdr-red)', fontSize:22, flexShrink:0}}>warning</span>
            <div style={{fontSize:13, lineHeight:1.6}}>
              <b>이미 {applicantCount}명이 신청했습니다.</b><br/>
              <span style={{color:'var(--ink-mute)'}}>날짜·인원·참가비는 변경할 수 없어요. 변경이 필요하면 경기를 취소하고 다시 개설해 주세요.</span>
            </div>
          </div>
        )}

        {/* ── 1. 경기 종류 (잠금) ── */}
        <div className="card" style={{padding:'24px 26px', marginBottom:14, opacity:0.8}}>
          <div style={{display:'flex', alignItems:'baseline', justifyContent:'space-between', marginBottom:14}}>
            <h2 style={{margin:0, fontSize:16, fontWeight:700}}>1. 경기 종류</h2>
            <span style={{fontSize:11, color:'var(--ink-dim)'}}>경기 종류는 변경할 수 없습니다</span>
          </div>
          <div style={{display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:10}}>
            {kinds.map(k => (
              <div key={k.id} style={{
                padding:'16px 14px', textAlign:'left',
                background: kind === k.id ? 'color-mix(in oklab, var(--cafe-blue) 8%, transparent)' : 'var(--bg-alt)',
                border: kind === k.id ? '2px solid var(--cafe-blue)' : '2px solid var(--border)',
                borderRadius:8, opacity: kind === k.id ? 1 : 0.5, cursor:'not-allowed',
              }}>
                <div style={{fontWeight:800, fontSize:15, marginBottom:4}}>{k.label}</div>
                <div style={{fontSize:11, color:'var(--ink-mute)'}}>{k.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── 2. 경기 정보 (prefill + 일부 잠금) ── */}
        <div className="card" style={{padding:'24px 26px', marginBottom:14}}>
          <h2 style={{margin:'0 0 14px', fontSize:16, fontWeight:700}}>2. 경기 정보</h2>
          <div style={{display:'grid', gridTemplateColumns:'1fr', gap:14}}>
            <div>
              <label style={{fontSize:12, fontWeight:700, color:'var(--ink-mute)'}}>제목</label>
              <input className="input" style={{marginTop:6}} defaultValue="목요일 저녁 미사 픽업 · 6:4"/>
            </div>
          </div>
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginTop:14}}>
            <div>
              <label style={{fontSize:12, fontWeight:700, color:'var(--ink-mute)'}}>
                날짜 {lockedByApplicants && <span style={{color:'var(--bdr-red)', fontSize:10}}>· 잠김</span>}
              </label>
              <input className="input" style={{marginTop:6}} type="date" defaultValue="2026-05-02" disabled={lockedByApplicants}/>
            </div>
            <div>
              <label style={{fontSize:12, fontWeight:700, color:'var(--ink-mute)'}}>
                시간 {lockedByApplicants && <span style={{color:'var(--bdr-red)', fontSize:10}}>· 잠김</span>}
              </label>
              <input className="input" style={{marginTop:6}} defaultValue="20:30 – 22:30" disabled={lockedByApplicants}/>
            </div>
            <div>
              <label style={{fontSize:12, fontWeight:700, color:'var(--ink-mute)'}}>코트</label>
              <input className="input" style={{marginTop:6}} defaultValue="미사강변체육관"/>
            </div>
            <div>
              <label style={{fontSize:12, fontWeight:700, color:'var(--ink-mute)'}}>지역</label>
              <input className="input" style={{marginTop:6}} defaultValue="하남시"/>
            </div>
          </div>
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:14, marginTop:14}}>
            <div>
              <label style={{fontSize:12, fontWeight:700, color:'var(--ink-mute)'}}>수준</label>
              <select className="input" style={{marginTop:6, appearance:'auto'}} defaultValue="중급+">
                <option>초-중급</option>
                <option>중급</option>
                <option>중급+</option>
                <option>상급</option>
                <option>전연령</option>
              </select>
            </div>
            <div>
              <label style={{fontSize:12, fontWeight:700, color:'var(--ink-mute)'}}>
                정원 {lockedByApplicants && <span style={{color:'var(--bdr-red)', fontSize:10}}>· 잠김</span>}
              </label>
              <input className="input" style={{marginTop:6}} defaultValue="10" disabled={lockedByApplicants}/>
            </div>
            <div>
              <label style={{fontSize:12, fontWeight:700, color:'var(--ink-mute)'}}>
                참가비 {lockedByApplicants && <span style={{color:'var(--bdr-red)', fontSize:10}}>· 잠김</span>}
              </label>
              <input className="input" style={{marginTop:6}} defaultValue="₩5,000" disabled={lockedByApplicants}/>
            </div>
          </div>
          <div style={{marginTop:14}}>
            <label style={{fontSize:12, fontWeight:700, color:'var(--ink-mute)'}}>상세 설명</label>
            <textarea className="input" rows={5} style={{marginTop:6, resize:'vertical'}} defaultValue="매주 목요일 정기 픽업입니다. 6:4 팀 분배, 21점 선취제. 주차장 무료 이용 가능, 실내 탈의실·샤워실 완비."/>
          </div>
        </div>

        {/* ── 3. 신청 조건 ── */}
        <div className="card" style={{padding:'24px 26px', marginBottom:14}}>
          <h2 style={{margin:'0 0 14px', fontSize:16, fontWeight:700}}>3. 신청 조건</h2>
          <div style={{display:'grid', gridTemplateColumns:'repeat(2, 1fr)', gap:10}}>
            {['초보 환영','레이팅 1400 이상','여성 우대','학생 우대','자차 가능자','프로필 공개 필수'].map((t, i) => (
              <label key={t} style={{display:'flex', alignItems:'center', gap:10, padding:'10px 14px', background:'var(--bg-alt)', borderRadius:6, cursor:'pointer'}}>
                <input type="checkbox" defaultChecked={i === 0}/>
                <span style={{fontSize:13, fontWeight:600}}>{t}</span>
              </label>
            ))}
          </div>
        </div>

        {/* ── 4. 위험 액션 (경기 취소) ── */}
        <div className="card" style={{padding:'18px 26px', marginBottom:14, borderColor:'var(--bdr-red)'}}>
          <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', gap:14, flexWrap:'wrap'}}>
            <div>
              <div style={{fontSize:14, fontWeight:700, color:'var(--bdr-red)', marginBottom:2}}>경기 취소</div>
              <div style={{fontSize:12, color:'var(--ink-mute)'}}>
                {applicantCount > 0 ? `신청자 ${applicantCount}명에게 자동으로 취소 알림이 전송됩니다.` : '아직 신청자가 없어 안전하게 취소할 수 있습니다.'}
              </div>
            </div>
            <button className="btn" style={{color:'var(--bdr-red)', borderColor:'var(--bdr-red)'}}>경기 취소하기</button>
          </div>
        </div>

        <div style={{display:'flex', gap:10, justifyContent:'flex-end', marginBottom:40}}>
          <button className="btn" onClick={()=>setRoute('gameDetail')}>취소</button>
          <button className="btn btn--primary" onClick={()=>setRoute('gameDetail')}>변경사항 저장</button>
        </div>
      </div>
    </div>
  );
}

window.GameEdit = GameEdit;

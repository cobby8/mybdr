/* global React */

// ============================================================
// ProfileBasketball — /profile/basketball (5/9 reverse-sync W-1)
//
// 5/9 갱신 (운영 동등 박제 — CLAUDE.md §🔄 운영→시안 동기화 룰):
//  - 운영 page.tsx 가 server component 로 재구성 + 10 영역 super-set
//  - 공개 프로필 흡수 + 본인 전용 강화 (사용자 결재 Q1~Q6)
//  - 시안도 운영 10 영역 동등 노출 (역방향 박제 — 5/7 갭 재발 방지)
//
// 10 영역:
//  ① 진행 중 신청 (MyPendingRequestsCard) — 본인 전용 신규
//  ② Hero — PlayerHero 패턴 (그라디언트 + jersey + 신체)
//  ③ 통산 8열 + [더보기 →]
//  ④ 활동 로그 5건
//  ⑤ 최근 경기 (PlayerMatchCard 5건)
//  ⑥ 소속 팀 (풀 리스트)
//  ⑦ 참가 대회
//  ⑧ 다음 대회 매치 (NextTournamentMatchCard) — 본인 전용 신규
//  ⑨ 픽업 게임 신청
//  ⑩ 주간 운동 리포트 링크
// ============================================================

function ProfileBasketball({ setRoute }) {
  // ① 진행 중 신청 mock (3종 통합)
  const pending = [
    { kind: 'jersey_change', label: '등번호 변경', detail: 'REDEEM · #88 → #99', when: '1일 전', icon: 'tag' },
    { kind: 'team_join',     label: '가입 신청',   detail: 'XYZ 농구단 · #15 희망',  when: '3일 전', icon: 'group_add' },
    { kind: 'transfer_in',   label: '이적 신청 (입단)', detail: 'OLD CREW → REDEEM',    when: '5일 전', icon: 'south_west' },
  ];

  // ② Hero mock — PlayerHero 패턴 (jersey/신체/지역/평점)
  const hero = {
    name: '김수빈',
    nickname: 'snukobe',
    jersey: 99,
    position: 'PG · 포인트가드',
    teamName: 'REDEEM',
    primaryColor: '#1B3C87',
    location: '서울 강남구',
    height: 178,
    weight: 72,
    rating: 4.6,
    level: 8,
    levelTitle: 'Hooper',
    lastSeen: '12분 전',
    bio: '주말 픽업 + 동호회 대회 위주. 패스 성향 가드.',
  };

  // ③ 통산 8열 mock (CareerStatsGrid 시안)
  const career = {
    games: 47, winRate: 64, ppg: 14.2, rpg: 3.8, apg: 5.1, mpg: 24.8, fgPct: 47.3, threePct: 36.1,
  };

  // ④ 활동 로그 5건 mock (ActivityLog 패턴)
  const events = [
    { type: 'mvp',       title: '몰텐배 21회 MVP 수상',         when: '5/2',  icon: 'star' },
    { type: 'match',     title: 'REDEEM vs MONKEYS · 21:17',    result: 'W', when: '5/2',  icon: 'sports_basketball' },
    { type: 'jersey',    title: 'REDEEM 등번호 #88 → #99',       when: '4/30', icon: 'tag' },
    { type: 'team_in',   title: 'REDEEM 가입',                  when: '4/12', icon: 'group_add' },
    { type: 'signup',    title: 'MyBDR 가입',                   when: '2024.07.21', icon: 'person_add' },
  ];

  // ⑤ 최근 경기 5건 mock (PlayerMatchCard 패턴)
  const recent = [
    { code: '26-GG-MD21-006', name: '몰텐배 21회',  group: 'B조 2경기',  when: '5/2 15:30',  status: '종료', home: 'REDEEM', homeScore: 24, away: 'MONKEYS', awayScore: 18, mySide: 'home', myStat: '22-14-3-2', result: 'W' },
    { code: '26-GG-MD21-004', name: '몰텐배 21회',  group: 'B조 1경기',  when: '5/2 13:00',  status: '종료', home: 'REDEEM', homeScore: 32, away: 'XYZ',     awayScore: 38, mySide: 'home', myStat: '12-5-7-1',  result: 'L' },
    { code: '26-GG-AP05-008', name: '아마프로 5회', group: '결승',       when: '4/20 18:00', status: '종료', home: 'OLD',    homeScore: 21, away: 'REDEEM',  awayScore: 18, mySide: 'away', myStat: '18-4-6-3',  result: 'L' },
    { code: '26-GG-AP05-005', name: '아마프로 5회', group: '4강',        when: '4/17 19:30', status: '종료', home: 'REDEEM', homeScore: 24, away: 'BLAZE',   awayScore: 20, mySide: 'home', myStat: '16-3-4-2',  result: 'W' },
    { code: '26-GG-AP05-003', name: '아마프로 5회', group: '8강',        when: '4/12 20:00', status: '종료', home: 'REDEEM', homeScore: 20, away: 'KINGS',   awayScore: 17, mySide: 'home', myStat: '11-4-8-2',  result: 'W' },
  ];

  // ⑥ 소속 팀 (풀 리스트)
  const teams = [
    { id: 't1', name: 'REDEEM',    color: '#1B3C87', sub: '소속 중' },
    { id: 't2', name: 'OLD CREW',  color: '#E31B23', sub: '소속 중' },
  ];

  // ⑦ 참가 대회
  const tournaments = [
    { id: 'tn1', name: '몰텐배 21회',  status: '진행 중' },
    { id: 'tn2', name: '아마프로 5회', status: '종료' },
    { id: 'tn3', name: '강남배 3x3',   status: '신청 완료' },
  ];

  // ⑧ 다음 대회 매치 mock
  const nextMatch = {
    code: '26-GG-MD21-019',
    when: '5/12 (월) 19:30',
    dDay: 'D-3',
    name: '몰텐배 21회 · B조 결승',
    court: '코트 2',
    home: 'REDEEM',
    away: 'XYZ',
    mySide: 'home',
  };

  // ⑨ 픽업 게임 신청 mock (game_applications)
  const games = [
    { id: 'g1', title: '강남구 주말 픽업',  when: '5/11', status: '예정' },
    { id: 'g2', title: '용산 야간 픽업',    when: '5/3',  status: '종료' },
    { id: 'g3', title: '반포 주말 3x3',    when: '4/12', status: '종료' },
  ];

  return (
    <div className="page" style={{maxWidth:960}}>
      {/* Breadcrumb */}
      <div style={{display:'flex', gap:6, fontSize:12, color:'var(--ink-mute)', marginBottom:12}}>
        <a onClick={()=>setRoute('home')} style={{cursor:'pointer'}}>홈</a><span>›</span>
        <a onClick={()=>setRoute('profile')} style={{cursor:'pointer'}}>마이페이지</a><span>›</span>
        <span style={{color:'var(--ink)'}}>내 농구</span>
      </div>

      {/* 페이지 헤더 — 운영 [← 마이페이지] / 내 농구 */}
      <div style={{display:'flex', alignItems:'center', gap:12, marginBottom:16}}>
        <a onClick={()=>setRoute('profile')} style={{
          width:36, height:36, display:'grid', placeItems:'center',
          borderRadius:6, cursor:'pointer', background:'transparent',
          border:'1px solid var(--border)',
        }}>
          <span className="material-symbols-outlined" style={{fontSize:20, color:'var(--ink-soft)'}}>arrow_back</span>
        </a>
        <h1 style={{margin:0, fontSize:18, fontWeight:700, color:'var(--ink)'}}>내 농구</h1>
      </div>

      {/* ① 진행 중 신청 카드 (MyPendingRequestsCard) */}
      <div className="card" style={{padding:'18px 20px', marginBottom:14}}>
        <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12}}>
          <div style={{display:'flex', alignItems:'center', gap:8}}>
            <span className="material-symbols-outlined" style={{fontSize:18, color:'var(--accent)'}}>schedule</span>
            <h2 style={{margin:0, fontSize:15, fontWeight:700, color:'var(--ink)'}}>진행 중 신청</h2>
            <span style={{
              fontSize:11, fontWeight:700, color:'var(--accent)',
              padding:'1px 6px',
              background:'color-mix(in srgb, var(--accent) 14%, transparent)',
              borderRadius:4,
            }}>{pending.length}</span>
          </div>
        </div>
        <div style={{display:'flex', flexDirection:'column', gap:8}}>
          {pending.map((p, i) => (
            <a key={i} onClick={()=>setRoute('teamDetail')} style={{
              display:'flex', gap:10, alignItems:'center',
              padding:'10px 12px',
              background:'var(--bg-alt)', borderRadius:6,
              cursor:'pointer', textDecoration:'none', color:'inherit',
            }}>
              <span style={{
                width:32, height:32, display:'grid', placeItems:'center',
                background:'var(--bg)', borderRadius:4, border:'1px solid var(--border)', flexShrink:0,
              }}>
                <span className="material-symbols-outlined" style={{fontSize:18, color:'var(--ink-soft)'}}>{p.icon}</span>
              </span>
              <div style={{flex:1, minWidth:0}}>
                <div style={{fontSize:13, fontWeight:700, color:'var(--ink)'}}>{p.label}</div>
                <div style={{fontSize:11, color:'var(--ink-dim)', marginTop:2}}>{p.detail}</div>
              </div>
              <div style={{display:'flex', flexDirection:'column', alignItems:'flex-end', gap:4, flexShrink:0}}>
                <span style={{fontSize:10.5, color:'var(--ink-dim)', fontFamily:'var(--ff-mono)'}}>{p.when}</span>
                <span style={{
                  fontSize:10, fontWeight:700, color:'var(--accent)',
                  padding:'1px 5px',
                  background:'color-mix(in srgb, var(--accent) 12%, transparent)',
                  borderRadius:3, letterSpacing:'.02em',
                }}>대기 중</span>
              </div>
            </a>
          ))}
        </div>
      </div>

      {/* ② Hero — PlayerHero 패턴 (그라디언트 배경 + 아바타 + 신체) */}
      <div className="card" style={{padding:0, overflow:'hidden', marginBottom:14}}>
        <div className="pb-hero-grid" style={{
          padding:'24px 24px 20px',
          background: `linear-gradient(135deg, ${hero.primaryColor} 0%, color-mix(in oklab, ${hero.primaryColor} 50%, #000) 100%)`,
          color:'#fff',
          display:'grid', gridTemplateColumns:'120px 1fr auto', gap:18, alignItems:'center',
        }}>
          {/* 아바타 */}
          <div style={{
            width:120, height:120, borderRadius:'50%', overflow:'hidden',
            background:'rgba(255,255,255,0.18)', backdropFilter:'blur(4px)',
            display:'grid', placeItems:'center',
            fontFamily:'var(--ff-display)', fontWeight:900, fontSize:42, color:'#fff',
            border:'3px solid rgba(255,255,255,0.3)',
          }}>
            {hero.name.slice(0, 2)}
          </div>
          {/* 정보 */}
          <div style={{minWidth:0}}>
            {/* eyebrow #N · 포지션 · 팀명 */}
            <div style={{display:'flex', gap:8, fontSize:12, fontWeight:700, color:'rgba(255,255,255,0.9)', marginBottom:4, alignItems:'center'}}>
              <span style={{fontFamily:'var(--ff-mono)'}}>#{hero.jersey}</span>
              <span>·</span>
              <span>{hero.position}</span>
              <span>·</span>
              <span>{hero.teamName.toUpperCase()}</span>
            </div>
            {/* 이름 */}
            <h1 style={{
              margin:'0 0 4px',
              fontFamily:'var(--ff-display)', fontWeight:800, fontSize:36, letterSpacing:'-0.015em',
              color:'#fff',
            }}>{hero.name}</h1>
            {/* 메타 — 닉네임 · 지역 */}
            <div style={{fontSize:13, color:'rgba(255,255,255,0.85)', marginBottom:8}}>
              {hero.nickname} · {hero.location}
            </div>
            {/* 배지 — Lv / ★평점 */}
            <div style={{display:'flex', gap:6, flexWrap:'wrap'}}>
              <span style={{
                fontSize:11, fontWeight:700,
                padding:'3px 8px',
                background:'rgba(255,255,255,0.18)', color:'#fff', borderRadius:4,
              }}>Lv.{hero.level} {hero.levelTitle}</span>
              <span style={{
                fontSize:11, fontWeight:700,
                padding:'3px 8px',
                background:'rgba(255,255,255,0.18)', color:'#fff', borderRadius:4,
              }}>★ {hero.rating}</span>
            </div>
          </div>
          {/* 우측 신체 strip */}
          <div className="pb-hero-physical" style={{textAlign:'right', fontSize:12, color:'rgba(255,255,255,0.85)', lineHeight:1.6}}>
            <div>키 <b style={{color:'#fff'}}>{hero.height}</b></div>
            <div>체중 <b style={{color:'#fff'}}>{hero.weight}</b></div>
            <div>최근 <b style={{color:'#fff'}}>{hero.lastSeen}</b></div>
          </div>
        </div>
        {/* 자기소개 */}
        {hero.bio && (
          <div style={{padding:'14px 22px', borderTop:'1px solid var(--border)', fontSize:13, color:'var(--ink-soft)', lineHeight:1.6}}>
            {hero.bio}
          </div>
        )}
      </div>

      {/* ③ 통산 8열 + [더보기 →] (CareerStatsGrid) */}
      <div className="card" style={{padding:'22px 24px', marginBottom:14}}>
        <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14}}>
          <h2 style={{margin:0, fontSize:16, fontWeight:700, color:'var(--ink)'}}>통산 스탯</h2>
          <a style={{
            fontSize:12, fontWeight:500, color:'var(--ink-dim)',
            padding:'4px 6px', cursor:'pointer',
          }}>더보기 →</a>
        </div>
        <div className="pb-career-grid" style={{
          display:'grid', gridTemplateColumns:'repeat(8, 1fr)',
          border:'1px solid var(--border)', borderRadius:8, overflow:'hidden',
        }}>
          {[
            ['경기',  career.games],
            ['승률',  `${career.winRate}%`],
            ['PPG',   career.ppg.toFixed(1)],
            ['RPG',   career.rpg.toFixed(1)],
            ['APG',   career.apg.toFixed(1)],
            ['MIN',   career.mpg.toFixed(1)],
            ['FG%',   `${career.fgPct.toFixed(1)}%`],
            ['3P%',   `${career.threePct.toFixed(1)}%`],
          ].map(([label, value], i) => (
            <div key={label} style={{
              padding:'14px 8px', textAlign:'center',
              borderLeft: i > 0 ? '1px solid var(--border)' : 0,
              background:'var(--bg-alt)',
            }}>
              <div style={{fontFamily:'var(--ff-display)', fontWeight:900, fontSize:24, letterSpacing:'-0.01em', color:'var(--ink)'}}>{value}</div>
              <div style={{fontSize:10.5, color:'var(--ink-dim)', fontWeight:600, letterSpacing:'.04em', marginTop:2}}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ④ 활동 로그 5건 (ActivityLog) */}
      <div className="card" style={{padding:'18px 20px', marginBottom:14}}>
        <div style={{fontSize:11, color:'var(--ink-dim)', fontWeight:700, letterSpacing:'.08em', textTransform:'uppercase', marginBottom:10}}>활동</div>
        <div style={{display:'flex', flexDirection:'column', gap:8}}>
          {events.map((e, i) => (
            <div key={i} style={{display:'flex', gap:10, alignItems:'center', padding:'8px 0'}}>
              <span style={{
                width:28, height:28, display:'grid', placeItems:'center',
                background:'var(--bg-alt)', borderRadius:4, flexShrink:0,
              }}>
                <span className="material-symbols-outlined" style={{fontSize:16, color:'var(--ink-soft)'}}>{e.icon}</span>
              </span>
              <div style={{flex:1, minWidth:0, fontSize:13, color:'var(--ink)'}}>
                {e.title}
                {e.result && (
                  <span className={`badge ${e.result === 'W' ? 'badge--ok' : 'badge--red'}`} style={{fontSize:10, marginLeft:6, padding:'1px 4px', borderRadius:3}}>
                    {e.result}
                  </span>
                )}
              </div>
              <span style={{fontSize:11, color:'var(--ink-dim)', fontFamily:'var(--ff-mono)'}}>{e.when}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ⑤ 최근 경기 (PlayerMatchCard 5건) */}
      <div style={{marginBottom:14}}>
        <div style={{fontSize:13, fontWeight:700, color:'var(--ink-soft)', marginBottom:10, padding:'0 4px'}}>최근 경기 (대회)</div>
        <div style={{display:'flex', flexDirection:'column', gap:10}}>
          {recent.map((r, i) => (
            <a key={i} className="card" onClick={()=>setRoute('liveMatch')} style={{
              display:'block', padding:'14px 16px', cursor:'pointer',
              textDecoration:'none', color:'inherit',
            }}>
              {/* 헤더 — 매치코드 + 라운드 + 시간 + 상태 */}
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10, fontSize:11, color:'var(--ink-dim)', fontFamily:'var(--ff-mono)'}}>
                <span>{r.code} · {r.group} · {r.when}</span>
                <span className="badge badge--gray" style={{fontSize:10, padding:'1px 6px', borderRadius:3}}>{r.status}</span>
              </div>
              {/* 팀 vs 팀 */}
              <div style={{display:'grid', gridTemplateColumns:'1fr auto 1fr', alignItems:'center', gap:12, padding:'8px 0', borderTop:'1px solid var(--border)', borderBottom:'1px solid var(--border)'}}>
                <div style={{textAlign:'left', fontSize:14, fontWeight: r.mySide === 'home' ? 800 : 600, color: r.mySide === 'home' ? 'var(--ink)' : 'var(--ink-soft)'}}>
                  {r.home}
                </div>
                <div style={{display:'flex', gap:8, alignItems:'baseline', fontFamily:'var(--ff-mono)', fontWeight:700}}>
                  <span style={{fontSize:18, color:'var(--ink)'}}>{r.homeScore}</span>
                  <span style={{fontSize:11, color:'var(--ink-dim)'}}>:</span>
                  <span style={{fontSize:18, color:'var(--ink)'}}>{r.awayScore}</span>
                </div>
                <div style={{textAlign:'right', fontSize:14, fontWeight: r.mySide === 'away' ? 800 : 600, color: r.mySide === 'away' ? 'var(--ink)' : 'var(--ink-soft)'}}>
                  {r.away}
                </div>
              </div>
              {/* 본인 기록 줄 */}
              <div style={{paddingTop:8, fontSize:12, color:'var(--ink-soft)', fontFamily:'var(--ff-mono)'}}>
                내 기록: <b style={{color:'var(--ink)'}}>{r.myStat}</b>
                <span className={`badge ${r.result === 'W' ? 'badge--ok' : 'badge--red'}`} style={{fontSize:10, marginLeft:8, padding:'1px 5px', borderRadius:3}}>
                  {r.result}
                </span>
              </div>
            </a>
          ))}
        </div>
      </div>

      {/* ⑥ 소속 팀 (운영 보존) */}
      <div className="card" style={{padding:0, marginBottom:14}}>
        <div style={{padding:'14px 18px 8px', display:'flex', justifyContent:'space-between', alignItems:'center', borderBottom:'1px solid var(--border)'}}>
          <div style={{fontSize:13, fontWeight:700, color:'var(--ink)'}}>소속 팀</div>
          <a onClick={()=>setRoute('teams')} style={{fontSize:11, color:'var(--ink-dim)', cursor:'pointer'}}>전체보기 →</a>
        </div>
        {teams.map((t) => (
          <a key={t.id} onClick={()=>setRoute('teamDetail')} style={{
            display:'flex', gap:12, alignItems:'center', padding:'12px 18px',
            borderBottom:'1px solid var(--border)', cursor:'pointer', color:'inherit', textDecoration:'none',
          }}>
            <span style={{
              width:36, height:36, borderRadius:4,
              background: t.color, color:'#fff',
              display:'grid', placeItems:'center',
              fontFamily:'var(--ff-mono)', fontSize:11, fontWeight:700,
            }}>{t.name.slice(0, 3).toUpperCase()}</span>
            <div style={{flex:1, minWidth:0}}>
              <div style={{fontSize:13, fontWeight:700, color:'var(--ink)'}}>{t.name}</div>
              <div style={{fontSize:11, color:'var(--ink-dim)', marginTop:2}}>{t.sub}</div>
            </div>
            <span className="material-symbols-outlined" style={{fontSize:18, color:'var(--ink-dim)'}}>chevron_right</span>
          </a>
        ))}
      </div>

      {/* ⑦ 참가 대회 (운영 보존) */}
      <div className="card" style={{padding:0, marginBottom:14}}>
        <div style={{padding:'14px 18px 8px', display:'flex', justifyContent:'space-between', alignItems:'center', borderBottom:'1px solid var(--border)'}}>
          <div style={{fontSize:13, fontWeight:700, color:'var(--ink)'}}>참가 대회</div>
          <a onClick={()=>setRoute('tournaments')} style={{fontSize:11, color:'var(--ink-dim)', cursor:'pointer'}}>전체보기 →</a>
        </div>
        {tournaments.map((t) => (
          <a key={t.id} onClick={()=>setRoute('tournamentDetail')} style={{
            display:'flex', gap:12, alignItems:'center', padding:'12px 18px',
            borderBottom:'1px solid var(--border)', cursor:'pointer', color:'inherit', textDecoration:'none',
          }}>
            <span style={{
              width:36, height:36, borderRadius:4,
              background: 'var(--tier-gold, #D4AF37)', color:'#fff',
              display:'grid', placeItems:'center',
            }}>
              <span className="material-symbols-outlined" style={{fontSize:20}}>emoji_events</span>
            </span>
            <div style={{flex:1, minWidth:0}}>
              <div style={{fontSize:13, fontWeight:700, color:'var(--ink)'}}>{t.name}</div>
              <div style={{fontSize:11, color:'var(--ink-dim)', marginTop:2}}>{t.status}</div>
            </div>
            <span className="material-symbols-outlined" style={{fontSize:18, color:'var(--ink-dim)'}}>chevron_right</span>
          </a>
        ))}
      </div>

      {/* ⑧ 다음 대회 매치 (NextTournamentMatchCard) */}
      <a onClick={()=>setRoute('liveMatch')} className="card" style={{
        display:'block', padding:'18px 20px', marginBottom:14,
        cursor:'pointer', color:'inherit', textDecoration:'none',
      }}>
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10}}>
          <div style={{display:'flex', gap:8, alignItems:'center'}}>
            <span className="material-symbols-outlined" style={{fontSize:18, color:'var(--accent)'}}>event</span>
            <span style={{fontSize:11, fontWeight:700, color:'var(--ink-dim)', letterSpacing:'.06em', textTransform:'uppercase'}}>다음 매치</span>
          </div>
          <span style={{
            fontSize:11, fontWeight:700, color:'var(--accent)',
            padding:'2px 6px',
            background:'color-mix(in srgb, var(--accent) 14%, transparent)',
            borderRadius:4, fontFamily:'var(--ff-mono)',
          }}>{nextMatch.dDay}</span>
        </div>
        <div style={{fontSize:14, fontWeight:700, color:'var(--ink)', marginBottom:4}}>
          {nextMatch.when}
          <span style={{fontSize:12, color:'var(--ink-dim)', marginLeft:8, fontWeight:400}}>· {nextMatch.court}</span>
        </div>
        <div style={{fontSize:11.5, color:'var(--ink-dim)', marginBottom:12, fontFamily:'var(--ff-mono)'}}>
          {nextMatch.code} · {nextMatch.name}
        </div>
        <div style={{
          display:'grid', gridTemplateColumns:'1fr auto 1fr',
          alignItems:'center', gap:10,
          padding:'10px 12px', background:'var(--bg-alt)', borderRadius:6,
        }}>
          <div style={{fontSize:13, fontWeight: nextMatch.mySide === 'home' ? 800 : 600, color: nextMatch.mySide === 'home' ? 'var(--ink)' : 'var(--ink-soft)'}}>
            {nextMatch.home} {nextMatch.mySide === 'home' && <span style={{fontSize:10.5, color:'var(--accent)', marginLeft:4}}>(우리팀)</span>}
          </div>
          <div style={{fontSize:11, color:'var(--ink-dim)', fontFamily:'var(--ff-mono)', fontWeight:700}}>VS</div>
          <div style={{textAlign:'right', fontSize:13, fontWeight: nextMatch.mySide === 'away' ? 800 : 600, color: nextMatch.mySide === 'away' ? 'var(--ink)' : 'var(--ink-soft)'}}>
            {nextMatch.away} {nextMatch.mySide === 'away' && <span style={{fontSize:10.5, color:'var(--accent)', marginLeft:4}}>(우리팀)</span>}
          </div>
        </div>
      </a>

      {/* ⑨ 픽업 게임 신청 (운영 보존 — game_applications) */}
      <div className="card" style={{padding:0, marginBottom:14}}>
        <div style={{padding:'14px 18px 8px', display:'flex', justifyContent:'space-between', alignItems:'center', borderBottom:'1px solid var(--border)'}}>
          <div style={{fontSize:13, fontWeight:700, color:'var(--ink)'}}>픽업 게임 신청</div>
          <a onClick={()=>setRoute('games')} style={{fontSize:11, color:'var(--ink-dim)', cursor:'pointer'}}>전체보기 →</a>
        </div>
        {games.map((g) => (
          <a key={g.id} onClick={()=>setRoute('gameDetail')} style={{
            display:'flex', gap:12, alignItems:'center', padding:'12px 18px',
            borderBottom:'1px solid var(--border)', cursor:'pointer', color:'inherit', textDecoration:'none',
          }}>
            <span style={{
              width:36, height:36, borderRadius:4,
              background:'var(--accent)', color:'#fff',
              display:'grid', placeItems:'center',
            }}>
              <span className="material-symbols-outlined" style={{fontSize:20}}>sports_basketball</span>
            </span>
            <div style={{flex:1, minWidth:0}}>
              <div style={{fontSize:13, fontWeight:700, color:'var(--ink)'}}>{g.title}</div>
              <div style={{fontSize:11, color:'var(--ink-dim)', marginTop:2}}>{g.when}</div>
            </div>
            <span style={{fontSize:11, color:'var(--ink-dim)', fontFamily:'var(--ff-mono)'}}>{g.status}</span>
          </a>
        ))}
      </div>

      {/* ⑩ 주간 운동 리포트 링크 (운영 보존) */}
      <a onClick={()=>setRoute('profileWeeklyReport')} className="card" style={{
        display:'flex', gap:12, alignItems:'center', padding:'14px 18px',
        cursor:'pointer', color:'inherit', textDecoration:'none', marginBottom:14,
      }}>
        <span style={{
          width:36, height:36, borderRadius:4,
          background:'var(--info, #0079B9)', color:'#fff',
          display:'grid', placeItems:'center',
        }}>
          <span className="material-symbols-outlined" style={{fontSize:20}}>bar_chart</span>
        </span>
        <div style={{flex:1, minWidth:0}}>
          <div style={{fontSize:13, fontWeight:700, color:'var(--ink)'}}>주간 운동 리포트</div>
          <div style={{fontSize:11, color:'var(--ink-dim)', marginTop:2}}>이번주 운동 요약과 지난주 비교</div>
        </div>
        <span className="material-symbols-outlined" style={{fontSize:18, color:'var(--ink-dim)'}}>chevron_right</span>
      </a>

      <style>{`
        @media (max-width: 720px) {
          .pb-hero-grid {
            grid-template-columns: 80px 1fr !important;
          }
          .pb-hero-physical { display: none !important; }
          .pb-career-grid {
            grid-template-columns: repeat(4, 1fr) !important;
          }
          .pb-career-grid > div {
            border-top: 1px solid var(--border);
          }
          .pb-career-grid > div:nth-child(-n+4) { border-top: 0 !important; }
          .pb-career-grid > div:nth-child(4n+1) { border-left: 0 !important; }
        }
      `}</style>
    </div>
  );
}

window.ProfileBasketball = ProfileBasketball;

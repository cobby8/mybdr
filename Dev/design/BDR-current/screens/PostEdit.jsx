/* global React, BOARDS, POST_DETAIL, Sidebar, Icon */

/**
 * PostEdit — /community/[id]/edit (D등급 P0-1 신규)
 *
 * Why: 본인 게시글 수정 (제목 / 본문 / 카테고리 / 첨부 사진)
 * Pattern: PostWrite.jsx 와 동일 + 기존 데이터 prefill + "취소"·"수정 완료"
 *
 * 진입: /community/[id] 본인 글 점-3개 dropdown "수정"
 * 복귀: 저장 → /community/[id] / 취소 → /community/[id]
 * 에러: 권한 없음 (작성자 != 본인) → 권한 안내 + 상세 복귀
 *
 * 회귀 검수 매트릭스:
 *   기능              | 옛 페이지 | 시안 v2.2          | 진입점     | 모바일
 *   본문 수정         | -        | ✅ textarea prefill | dropdown | 1열
 *   사진 추가/삭제    | -        | ✅ 첨부 리스트       | dropdown | 가로 hscroll
 *   비밀글 토글       | -        | ✅ checkbox         | dropdown | OK
 *   권한 체크         | -        | ✅ noPermission view | -        | OK
 */

function PostEdit({ setRoute, activeBoard, setActiveBoard, currentUserId = 'me' }) {
  const p = POST_DETAIL;
  // 권한 체크: POST_DETAIL.authorId 가 없으면 시안용 dummy로 본인 처리
  const isOwner = (p.authorId || 'me') === currentUserId;

  // Prefill state
  const [board, setBoard] = React.useState(p.board || activeBoard || 'free');
  const [title, setTitle] = React.useState(p.title || '');
  const [body, setBody] = React.useState(p.bodyText || p.body?.[0]?.text || '게시글 본문이 여기에 prefill 됩니다. 수정하실 내용을 입력하세요.');
  const [attachments, setAttachments] = React.useState(p.images || []);
  const [secret, setSecret] = React.useState(false);
  const [allowComments, setAllowComments] = React.useState(true);
  const [savedAt, setSavedAt] = React.useState('방금');

  if (!isOwner) {
    // ── 권한 없음 view (§7-5 표준) ──
    return (
      <div className="page">
        <div className="with-aside">
          <Sidebar active={activeBoard} setActive={setActiveBoard} setRoute={setRoute}/>
          <main>
            <div className="card" style={{padding:'48px 28px', textAlign:'center', maxWidth:520, margin:'40px auto'}}>
              <div style={{fontSize:42, marginBottom:14, color:'var(--ink-dim)'}}>
                <span className="material-symbols-outlined" style={{fontSize:56}}>lock</span>
              </div>
              <h2 style={{margin:'0 0 8px', fontSize:20}}>수정 권한이 없습니다</h2>
              <p style={{margin:'0 0 20px', color:'var(--ink-mute)', fontSize:14, lineHeight:1.6}}>
                본인이 작성한 글만 수정할 수 있어요.<br/>
                다른 사용자가 작성한 글은 신고/차단 기능을 이용해 주세요.
              </p>
              <div style={{display:'flex', gap:8, justifyContent:'center'}}>
                <button className="btn" onClick={()=>setRoute('post')}>상세로 돌아가기</button>
                <button className="btn btn--primary" onClick={()=>setRoute('board')}>목록으로</button>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="with-aside">
        <Sidebar active={activeBoard} setActive={setActiveBoard} setRoute={setRoute}/>
        <main>
          {/* breadcrumb */}
          <div style={{display:'flex', alignItems:'center', gap:6, fontSize:12, color:'var(--ink-mute)', marginBottom:10, whiteSpace:'nowrap', flexWrap:'wrap'}}>
            <a onClick={()=>setRoute('home')} style={{cursor:'pointer'}}>홈</a>
            <span>›</span>
            <a onClick={()=>{setActiveBoard(p.board); setRoute('board');}} style={{cursor:'pointer'}}>{p.boardName}</a>
            <span>›</span>
            <a onClick={()=>setRoute('post')} style={{cursor:'pointer'}}>{p.title}</a>
            <span>›</span>
            <span style={{color:'var(--ink)'}}>수정</span>
          </div>

          <div style={{display:'flex', alignItems:'baseline', justifyContent:'space-between', marginBottom:16, gap:12}}>
            <div>
              <div className="eyebrow" style={{marginBottom:4}}>EDIT · COMMUNITY</div>
              <h1 style={{margin:0, fontSize:24, fontWeight:700, letterSpacing:'-0.01em'}}>게시글 수정</h1>
            </div>
            <div style={{fontSize:12, color:'var(--ink-dim)', whiteSpace:'nowrap'}}>자동저장 · {savedAt}</div>
          </div>

          <div className="card" style={{padding:20}}>
            <div style={{display:'grid', gridTemplateColumns:'160px 1fr', gap:12, marginBottom:14}}>
              <div>
                <label className="label">게시판 선택</label>
                <select className="select" value={board} onChange={e=>setBoard(e.target.value)}>
                  {BOARDS.filter(b => b.id !== 'notice').map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">제목</label>
                <input className="input" value={title} onChange={e=>setTitle(e.target.value)} placeholder="제목을 입력하세요 (최대 80자)" maxLength={80}/>
              </div>
            </div>

            {/* Toolbar */}
            <div className="editor-toolbar hscroll" style={{display:'flex', gap:4, padding:'6px 8px', border:'1px solid var(--border)', borderBottom:0, borderRadius:'var(--radius-chip) var(--radius-chip) 0 0', background:'var(--bg-alt)', flexWrap:'wrap'}}>
              {['B','I','U','S'].map(t => <button key={t} className="btn btn--sm" style={{fontWeight: t === 'B' ? 800 : 500, fontStyle: t === 'I' ? 'italic' : 'normal', textDecoration: t === 'U' ? 'underline' : t === 'S' ? 'line-through' : 'none', minWidth:32}}>{t}</button>)}
              <div style={{width:1, background:'var(--border)', margin:'4px 4px'}}/>
              <button className="btn btn--sm">H1</button>
              <button className="btn btn--sm">H2</button>
              <button className="btn btn--sm">인용</button>
              <button className="btn btn--sm">목록</button>
              <div style={{width:1, background:'var(--border)', margin:'4px 4px'}}/>
              <button className="btn btn--sm"><Icon.image/> 사진</button>
              <button className="btn btn--sm">링크</button>
              <button className="btn btn--sm">영상</button>
              <span style={{flex:1}}/>
              <button className="btn btn--sm">미리보기</button>
            </div>
            <textarea className="textarea" value={body} onChange={e=>{setBody(e.target.value); setSavedAt('수정 중');}} placeholder="내용을 입력하세요" style={{minHeight:340, borderTopLeftRadius:0, borderTopRightRadius:0, fontFamily:'var(--ff-body)', lineHeight:1.7}}/>

            {/* 첨부 사진 prefill */}
            {attachments.length > 0 && (
              <div style={{marginTop:14}}>
                <div className="label" style={{marginBottom:8}}>첨부된 사진 ({attachments.length}장)</div>
                <div className="hscroll" style={{display:'flex', gap:8, overflowX:'auto', paddingBottom:4}}>
                  {attachments.map((src, i) => (
                    <div key={i} style={{position:'relative', flex:'0 0 auto'}}>
                      <div style={{width:96, height:96, background:'var(--bg-alt)', border:'1px solid var(--border)', borderRadius:6, display:'grid', placeItems:'center', color:'var(--ink-dim)', fontSize:11}}>
                        사진 {i+1}
                      </div>
                      <button
                        onClick={()=>setAttachments(attachments.filter((_,j)=>j!==i))}
                        style={{position:'absolute', top:-6, right:-6, width:22, height:22, borderRadius:'50%', background:'var(--bdr-red)', color:'#fff', border:'none', display:'grid', placeItems:'center', cursor:'pointer', fontSize:14, lineHeight:1}}
                        aria-label="사진 삭제"
                      >×</button>
                    </div>
                  ))}
                  <button className="btn" style={{flex:'0 0 auto', width:96, height:96, fontSize:11, color:'var(--ink-mute)'}}>
                    + 추가
                  </button>
                </div>
              </div>
            )}

            <div style={{display:'flex', alignItems:'center', gap:10, marginTop:14, fontSize:13, color:'var(--ink-mute)', flexWrap:'wrap'}}>
              <label style={{display:'flex', alignItems:'center', gap:6, cursor:'pointer'}}>
                <input type="checkbox" checked={allowComments} onChange={e=>setAllowComments(e.target.checked)}/> 댓글 허용
              </label>
              <label style={{display:'flex', alignItems:'center', gap:6, cursor:'pointer'}}>
                <input type="checkbox" checked={secret} onChange={e=>setSecret(e.target.checked)}/> 비밀글
              </label>
              <span style={{flex:1}}/>
              <span style={{fontSize:12}}>{body.length} / 20,000자</span>
            </div>

            {/* 수정 이력 안내 */}
            <div style={{marginTop:14, padding:'10px 12px', background:'var(--bg-alt)', borderRadius:6, fontSize:12, color:'var(--ink-mute)', display:'flex', alignItems:'center', gap:8}}>
              <span className="material-symbols-outlined" style={{fontSize:16, color:'var(--ink-dim)'}}>history</span>
              수정된 글은 상세 페이지에 <b style={{color:'var(--ink)'}}>"수정됨"</b> 표시가 붙습니다. 원본은 복원할 수 없어요.
            </div>

            <div style={{display:'flex', justifyContent:'flex-end', gap:8, marginTop:20, paddingTop:16, borderTop:'1px solid var(--border)'}}>
              <button className="btn" onClick={()=>setRoute('post')}>취소</button>
              <button className="btn">임시저장</button>
              <button className="btn btn--primary" onClick={()=>{setSavedAt('저장 완료'); setRoute('post');}}>수정 완료</button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

window.PostEdit = PostEdit;

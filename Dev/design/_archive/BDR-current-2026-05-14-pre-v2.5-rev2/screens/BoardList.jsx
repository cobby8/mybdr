/* global React, BOARDS, POSTS, Icon, Sidebar, Pager, LevelBadge */

// ============================================================
// Phase A.6 §5 — BoardList 운영 정합 (mybdr.kr/community 패턴)
// - Hero 헤더 grid 1fr auto (eyebrow 카테고리 + h1 게시판명 + 부제 글 수)
// - 검색 토글 (.app-nav__icon-btn 패턴 — 검색 input 노출/숨김)
// - with-aside 2열 (좌 Sidebar + 우 board 테이블) — 모바일 1열 stack
// - 핀 글 + 24h NEW 뱃지 + 조회수 + 댓글 수 (BoardRow 패턴)
// ============================================================

function BoardHeader({ board, setRoute }) {
  const [searchOpen, setSearchOpen] = React.useState(false);
  const [q, setQ] = React.useState('');
  const categoryLabel = board.category === 'main' ? '메인' : board.category === 'play' ? '플레이' : '이야기';
  return (
    <div style={{display:'grid', gridTemplateColumns:'1fr auto', alignItems:'flex-end', gap:16, marginBottom:16, flexWrap:'wrap'}}>
      <div style={{minWidth:0}}>
        <div className="eyebrow">{categoryLabel}</div>
        <h1 style={{margin:'6px 0 4px', fontSize:24, fontWeight:700, letterSpacing:'-0.01em', whiteSpace:'nowrap'}}>{board.name}</h1>
        <div style={{fontSize:13, color:'var(--ink-mute)', whiteSpace:'nowrap'}}>전체 {board.count.toLocaleString()}개의 글</div>
      </div>
      <div style={{display:'flex', gap:8, flexShrink:0, alignItems:'center'}}>
        {searchOpen && (
          <input
            autoFocus
            value={q}
            onChange={e=>setQ(e.target.value)}
            placeholder="게시판 내 검색"
            className="input"
            style={{width:200, fontSize:13, padding:'8px 12px', borderRadius:'var(--radius-chip)'}}
          />
        )}
        <button
          className="app-nav__icon-btn"
          onClick={()=>{ setSearchOpen(!searchOpen); if (searchOpen) setQ(''); }}
          title="검색"
          aria-label="검색"
        >
          <Icon.search/>
        </button>
        <button className="btn btn--primary" onClick={()=>setRoute('write')}>
          <Icon.plus/> 글쓰기
        </button>
      </div>
    </div>
  );
}

function BoardList({ activeBoard, setActiveBoard, setRoute }) {
  const board = BOARDS.find(b => b.id === activeBoard) || BOARDS[1];
  const allPosts = POSTS; // in real impl, filter by board
  const pinned = allPosts.filter(p => p.pinned);
  const rest = allPosts.filter(p => !p.pinned);

  return (
    <div className="page">
      <div className="with-aside">
        <Sidebar active={activeBoard} setActive={setActiveBoard} setRoute={setRoute}/>
        <main>
          {/* Phase A.6 §5 — Hero 헤더 grid 1fr auto + 검색 토글 (.app-nav__icon-btn 패턴) */}
          <BoardHeader board={board} setRoute={setRoute}/>

          {/* Filter row */}
          <div style={{display:'flex', alignItems:'center', gap:10, marginBottom:10, padding:'10px 12px', background:'var(--bg-elev)', border:'1px solid var(--border)', borderRadius:'var(--radius-chip)', fontSize:13, whiteSpace:'nowrap', flexWrap:'wrap'}}>
            <span style={{color:'var(--ink-dim)', fontSize:12, fontWeight:600, flexShrink:0}}>정렬</span>
            {['최신순','인기순','댓글많은순','조회순'].map((s,i) => (
              <button key={s} style={{padding:'4px 8px', border:0, background: i === 0 ? 'var(--cafe-blue-soft)' : 'transparent', color: i === 0 ? 'var(--cafe-blue-deep)' : 'var(--ink-mute)', borderRadius:4, cursor:'pointer', fontWeight: i===0 ? 700 : 500, fontSize:13, whiteSpace:'nowrap', flexShrink:0}}>{s}</button>
            ))}
            <span style={{flex:1}}/>
            <span style={{color:'var(--ink-dim)', fontSize:12, whiteSpace:'nowrap', flexShrink:0}}>한 페이지 20개</span>
          </div>

          <div className="board">
            <div className="board__head">
              <div>번호</div><div>제목</div><div>작성자</div><div>날짜</div><div>조회</div><div>추천</div>
            </div>
            {pinned.map(p => (
              <div key={p.id} className="board__row notice" onClick={()=>setRoute('post')}>
                <div className="num">공지</div>
                <div className="title">
                  <span className="badge badge--blue">공지</span>
                  <a>{p.title}</a>
                  {p.comments > 0 && <span className="comment-count">[{p.comments}]</span>}
                </div>
                <div style={{fontSize:12}}>{p.author}</div>
                <div style={{fontSize:12, color:'var(--ink-dim)'}}>{p.date.slice(5)}</div>
                <div style={{fontSize:12, color:'var(--ink-dim)'}}>{p.views}</div>
                <div style={{fontSize:12, color:'var(--ink-dim)'}}>-</div>
              </div>
            ))}
            {rest.map(p => (
              <div key={p.id} className="board__row" onClick={()=>setRoute('post')}>
                <div className="num">{p.id}</div>
                <div className="title">
                  {p.hasImage && <Icon.image style={{color:'var(--ink-dim)'}}/>}
                  <a>{p.title}</a>
                  {p.comments > 0 && <span className="comment-count">[{p.comments}]</span>}
                  {p.isNew && <span className="badge badge--new" style={{marginLeft:4}}>N</span>}
                </div>
                <div style={{fontSize:12}}>{p.author}</div>
                <div style={{fontSize:12, color:'var(--ink-dim)'}}>{p.date.slice(5)}</div>
                <div style={{fontSize:12, color:'var(--ink-dim)'}}>{p.views}</div>
                <div style={{fontSize:12, color:'var(--ink-dim)'}}>{Math.floor(p.views/30)}</div>
              </div>
            ))}
          </div>

          <Pager current={1} total={12}/>
        </main>
      </div>
    </div>
  );
}

window.BoardList = BoardList;

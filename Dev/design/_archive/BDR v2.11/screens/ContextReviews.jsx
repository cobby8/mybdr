/* global React */

/**
 * ContextReviews — 코트/대회/플레이어 상세 페이지에 삽입되는 재사용 리뷰 섹션
 *
 * [Phase 16] 통합 Reviews 페이지 폐기 → 컨텍스트별 인라인 리뷰
 *   - 코트:    "방문 후기"  — 시설·접근성·픽업 분위기 평가
 *   - 대회:    "참가 후기"  — 운영·진행·수준 평가
 *   - 플레이어: "매너 평가" — 함께 뛴 사람만 작성 (인증)
 *
 * Props:
 *   kind        : 'court' | 'series' | 'player'
 *   targetName  : 표기 라벨 (예: "장충체육관")
 *   reviews     : [{ author, authorLevel, rating, date, body, tags?, verified?, helpful? }]
 *   summary     : { avg, total, dist:[5★,4★,3★,2★,1★] } — 미제공 시 reviews 로 자동 계산
 *   onWrite     : '리뷰 쓰기' 클릭 핸들러
 *   onViewAll   : '전체 보기' 링크 (생략 시 미표시)
 *   maxVisible  : 본 섹션에 노출할 리뷰 개수 (기본 3)
 */
function ContextReviews({ kind = 'court', targetName, reviews = [], summary, onWrite, onViewAll, maxVisible = 3 }) {
  // 컨텍스트별 라벨
  const labels = {
    court:  { title: '방문 후기', cta: '+ 방문 후기 쓰기',  empty: '아직 등록된 후기가 없어요. 첫 후기를 남겨보세요.', authorHint: '실제 방문 인증' },
    series: { title: '참가 후기', cta: '+ 참가 후기 쓰기',  empty: '아직 등록된 참가 후기가 없어요.',                authorHint: '대회 참가 인증' },
    player: { title: '매너 평가', cta: '+ 매너 평가하기',    empty: '아직 매너 평가가 없어요.',                       authorHint: '함께 뛴 사람만' },
  };
  const L = labels[kind] || labels.court;

  // summary 자동 계산
  const total = summary?.total ?? reviews.length;
  const avg = summary?.avg ?? (reviews.length ? (reviews.reduce((a,r)=>a+r.rating,0)/reviews.length).toFixed(1) : '0.0');
  const dist = summary?.dist ?? [5,4,3,2,1].map(n => reviews.filter(r=>r.rating===n).length);

  const visible = reviews.slice(0, maxVisible);

  return (
    <section className="card" style={{padding:'18px 22px'}}>
      {/* head */}
      <div style={{display:'flex', alignItems:'baseline', justifyContent:'space-between', flexWrap:'wrap', gap:8, marginBottom:14}}>
        <div style={{display:'flex', alignItems:'baseline', gap:10, flexWrap:'wrap'}}>
          <h2 style={{margin:0, fontSize:16, fontWeight:700, letterSpacing:'-0.01em'}}>{L.title}</h2>
          <span style={{fontFamily:'var(--ff-mono)', fontSize:12, color:'var(--ink-mute)'}}>{total}건</span>
          <span style={{fontSize:11, color:'var(--ink-dim)'}}>· {L.authorHint}</span>
        </div>
        <div style={{display:'flex', gap:6, alignItems:'center'}}>
          {onViewAll && total > maxVisible && (
            <a onClick={onViewAll} style={{fontSize:12, color:'var(--cafe-blue)', cursor:'pointer'}}>전체 보기 →</a>
          )}
          {onWrite && (
            <button className="btn btn--accent btn--sm" onClick={onWrite} style={{minHeight:36}}>{L.cta}</button>
          )}
        </div>
      </div>

      {/* summary — 평균 + 분포 */}
      {total > 0 && (
        <div style={{
          display:'grid',
          gridTemplateColumns:'minmax(120px, 160px) 1fr',
          gap:18,
          padding:'14px 0 16px',
          borderTop:'1px solid var(--border)',
          borderBottom:'1px solid var(--border)',
          marginBottom:14,
        }}>
          {/* avg */}
          <div style={{display:'flex', flexDirection:'column', justifyContent:'center', alignItems:'center', textAlign:'center', borderRight:'1px solid var(--border)', paddingRight:14}}>
            <div style={{fontSize:34, fontWeight:800, fontFamily:'var(--ff-mono)', letterSpacing:'-0.02em', lineHeight:1}}>{avg}</div>
            <div style={{color:'var(--accent)', fontSize:14, marginTop:6}}>
              {'★'.repeat(Math.round(avg))}
              <span style={{color:'var(--border)'}}>{'★'.repeat(5-Math.round(avg))}</span>
            </div>
            <div style={{fontSize:10, color:'var(--ink-dim)', marginTop:4, fontFamily:'var(--ff-mono)'}}>{total} REVIEWS</div>
          </div>
          {/* dist */}
          <div style={{display:'flex', flexDirection:'column', gap:4, justifyContent:'center'}}>
            {[5,4,3,2,1].map((n, i) => {
              const c = dist[i] || 0;
              const pct = total ? Math.round((c/total)*100) : 0;
              return (
                <div key={n} style={{display:'flex', alignItems:'center', gap:8, fontSize:11, fontFamily:'var(--ff-mono)'}}>
                  <span style={{width:18, color:'var(--ink-mute)'}}>{n}★</span>
                  <div style={{flex:1, height:6, background:'var(--bg-alt)', borderRadius:3, overflow:'hidden'}}>
                    <div style={{width:`${pct}%`, height:'100%', background:'var(--accent)'}}/>
                  </div>
                  <span style={{width:28, textAlign:'right', color:'var(--ink-mute)'}}>{c}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* reviews list */}
      {total === 0 ? (
        <div style={{padding:'24px 0', textAlign:'center', fontSize:13, color:'var(--ink-mute)'}}>
          {L.empty}
        </div>
      ) : (
        <div style={{display:'grid', gap:12}}>
          {visible.map((r, i) => (
            <article key={i} style={{
              padding:'12px 14px',
              background:'var(--bg-alt)',
              borderRadius:4,
              border:'1px solid var(--border)',
            }}>
              <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:6, gap:8, flexWrap:'wrap'}}>
                <div style={{display:'flex', alignItems:'center', gap:8, fontSize:12}}>
                  <strong style={{color:'var(--ink)'}}>{r.author}</strong>
                  {r.authorLevel && <span style={{color:'var(--ink-dim)', fontFamily:'var(--ff-mono)', fontSize:11}}>{r.authorLevel}</span>}
                  {r.verified && <span style={{fontSize:10, color:'var(--ok)', fontWeight:700}}>✓ 인증</span>}
                </div>
                <div style={{display:'flex', alignItems:'center', gap:8}}>
                  <span style={{color:'var(--accent)', fontSize:12}}>
                    {'★'.repeat(r.rating)}<span style={{color:'var(--border)'}}>{'★'.repeat(5-r.rating)}</span>
                  </span>
                  <span style={{fontSize:11, color:'var(--ink-dim)', fontFamily:'var(--ff-mono)'}}>{r.date}</span>
                </div>
              </div>
              <p style={{margin:0, fontSize:13, lineHeight:1.6, color:'var(--ink-soft, var(--ink))'}}>{r.body}</p>
              {r.tags?.length > 0 && (
                <div style={{display:'flex', gap:4, marginTop:8, flexWrap:'wrap'}}>
                  {r.tags.map((t, j) => (
                    <span key={j} style={{fontSize:10, padding:'2px 6px', background:'var(--bg-card, var(--bg))', borderRadius:3, color:'var(--ink-mute)', fontFamily:'var(--ff-mono)'}}>#{t}</span>
                  ))}
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

window.ContextReviews = ContextReviews;

/* global React, Icon */

/**
 * CourtCheckin — /courts/[id]/checkin 운영 정합 mock (역박제 5/9)
 *
 * 시안 룰: 색/폰트만 v2 유지 + 레이아웃 운영 정합
 * 운영 핵심: QR 스캔 시 자동 체크인 처리 (loading → success / already / error)
 *           QR 방식이라 GPS 검증 스킵 (현장 증거 = QR 자체)
 * 진입: 코트 부착 QR 스캔 (외부 → /courts/[id]/checkin)
 * 복귀: 성공 후 /courts/[id] / 이미 체크인 시 다른 코트로 이동 안내
 */
function CourtCheckin({ setRoute }) {
  // mock 상태 — 시안 데모용 4 케이스를 토글로 보여줌 (실제 운영은 자동 마운트 1회)
  const [status, setStatus] = React.useState('loading');
  const ICON = {
    loading: { icon:'⏳', color:'var(--ink-dim)', label:'체크인 처리 중...' },
    success: { icon:'✓', color:'var(--ok)', label:'체크인 완료!' },
    already: { icon:'ⓘ', color:'var(--cafe-blue)', label:'다른 코트에 이미 체크인 중이에요' },
    error:   { icon:'!', color:'var(--err)', label:'체크인에 실패했습니다' },
  };
  const m = ICON[status];

  return (
    <div className="page" style={{minHeight:'60vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', textAlign:'center', padding:'40px 20px'}}>
      {/* 상태 아이콘 */}
      <div style={{
        width:96, height:96, borderRadius:'50%', display:'grid', placeItems:'center',
        background:'color-mix(in srgb, ' + m.color + ' 12%, transparent)',
        marginBottom:18,
        fontSize:42, fontWeight:800, color:m.color,
      }}>
        {m.icon}
      </div>

      {/* 상태 라벨 */}
      <h1 style={{margin:'0 0 6px', fontSize:22, fontWeight:800, color:m.color, fontFamily:'var(--ff-display)', letterSpacing:'-0.02em'}}>{m.label}</h1>

      {/* 부가 메시지 */}
      <p style={{margin:'0 0 20px', fontSize:13, color:'var(--ink-mute)', lineHeight:1.6, maxWidth:320}}>
        {status === 'loading' && '잠시만 기다려주세요. QR 인증을 처리하고 있습니다.'}
        {status === 'success' && '장충체육관에 체크인되었습니다. 즐거운 농구 되세요!'}
        {status === 'already' && '한 번에 한 코트에만 체크인할 수 있어요. 기존 코트에서 체크아웃 후 다시 시도하세요.'}
        {status === 'error'   && '네트워크 오류 또는 인증 실패입니다. 다시 시도하거나 운영자에게 문의하세요.'}
      </p>

      {/* 액션 버튼 */}
      {status === 'success' && (
        <button className="btn btn--primary" onClick={()=>setRoute('courtDetail')}>코트 상세 보기</button>
      )}
      {status === 'already' && (
        <div style={{display:'flex', gap:8}}>
          <button className="btn" onClick={()=>setRoute('courtDetail')}>기존 코트로</button>
          <button className="btn btn--primary" onClick={()=>setStatus('loading')}>다시 시도</button>
        </div>
      )}
      {status === 'error' && (
        <button className="btn btn--primary" onClick={()=>setStatus('loading')}>다시 시도</button>
      )}

      {/* 시안 데모 — 상태 토글 (운영에서는 제거됨) */}
      <div style={{marginTop:36, padding:'10px 14px', border:'1px dashed var(--border)', borderRadius:8, fontSize:11, color:'var(--ink-dim)'}}>
        <div style={{marginBottom:6, fontFamily:'var(--ff-mono)'}}>※ 시안 데모용 — 운영에서는 자동 처리</div>
        <div style={{display:'flex', gap:6, flexWrap:'wrap', justifyContent:'center'}}>
          {['loading','success','already','error'].map(s => (
            <button key={s} onClick={()=>setStatus(s)} className="btn btn--sm" style={{opacity: status===s ? 1 : .5}}>{s}</button>
          ))}
        </div>
      </div>

      {/* 안내 푸터 */}
      <p style={{marginTop:24, fontSize:11, color:'var(--ink-dim)', lineHeight:1.5, maxWidth:340}}>
        QR 체크인은 GPS 위치 검증 없이 즉시 처리됩니다. 코트에 부착된 공식 QR을 스캔해주세요.
      </p>
    </div>
  );
}

window.CourtCheckin = CourtCheckin;

/* global React, window */
// ============================================================
// preview-shell.jsx — v2.42 보강 시안용 공용 미리보기 셸
//   · 상단 sticky 툴바: 제목 + viewport 전환(390/720/1024/1440/full) + 상태 가이드 토글
//   · 본문: 폭 제한 프레임 안에 실제 운영 패널 컴포넌트를 그대로 마운트
//   목적: 별도 mock 없이 운영 코드(panels-*/schedule/bracket)를 상태별로 구동해 검수.
// ============================================================
(function () {
  const { useState } = React;
  const { Icon } = window;
  const VPS = [
    { id: "390", w: 390, label: "모바일 390" },
    { id: "720", w: 720, label: "모바일 720" },
    { id: "1024", w: 1024, label: "태블릿 1024" },
    { id: "1440", w: 1440, label: "데스크톱 1440" },
    { id: "full", w: null, label: "전체 폭" },
  ];

  // states: [{ name, how }]  — 검수자가 직접 구동할 상태 목록
  window.PreviewShell = function PreviewShell({ title, sub, states = [], children, defaultVp = "1440" }) {
    const [vp, setVp] = useState(defaultVp);
    const [guide, setGuide] = useState(true);
    const cur = VPS.find(v => v.id === vp);
    const framed = cur.w != null;
    return (
      <div className="pv-root">
        <header className="pv-bar">
          <div className="pv-bar__title">
            <span className="pv-bar__badge">v2.42</span>
            <div style={{ minWidth: 0 }}>
              <b>{title}</b>
              {sub && <span className="pv-bar__sub">{sub}</span>}
            </div>
          </div>
          <div className="pv-bar__vps">
            {VPS.map(v => (
              <button key={v.id} className="pv-vp" data-on={vp === v.id} onClick={() => setVp(v.id)}>{v.label}</button>
            ))}
            {states.length > 0 && (
              <button className="pv-vp pv-vp--guide" data-on={guide} onClick={() => setGuide(g => !g)}>
                <Icon name="list-checks" size={14} />상태 가이드
              </button>
            )}
          </div>
        </header>

        {guide && states.length > 0 && (
          <div className="pv-guide">
            <div className="pv-guide__h"><Icon name="info" size={14} color="var(--primary)" />구동할 상태 — 패널은 실제 운영 컴포넌트입니다. 아래 순서로 직접 조작해 상태를 확인하세요.</div>
            <ol className="pv-guide__list">
              {states.map((s, i) => (
                <li key={i}><b>{s.name}</b>{s.how && <span> — {s.how}</span>}</li>
              ))}
            </ol>
          </div>
        )}

        <div className="pv-stage" data-framed={framed}>
          <div className="pv-frame" style={framed ? { width: cur.w, maxWidth: "100%" } : { width: "100%" }} data-w={vp}>
            {framed && <div className="pv-frame__caption">{cur.label} · {cur.w}px</div>}
            <div className="pv-frame__body">
              {children}
            </div>
          </div>
        </div>
      </div>
    );
  };
})();

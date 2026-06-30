/* global React */
// BDR v2.31 — Gallery (/gallery · 자체 디자인 · 사진 갤러리)
function Gallery() {
  const albums = [
    { t: '봄맞이 마포컵 결승', meta: ['사진 42', '2026.03.16'] },
    { t: 'BDR 서머 오픈 #4', meta: ['사진 88', '2026.06.21'] },
    { t: '한강 3x3 챌린지', meta: ['사진 31', '2026.05.25'] },
  ];
  const shots = [
    { cap: '결승전 종료 직후', sub: '강남BC vs 서초파이브', cls: 'wide' },
    { cap: 'MVP 김지훈', sub: '24득점 8어시', cls: 'tall' },
    { cap: '시상식', sub: '마포컵' },
    { cap: '관중석 응원', sub: '장충체육관' },
    { cap: '덩크 모먼트', sub: '정성훈', cls: 'tall' },
    { cap: '하프타임', sub: '벤치 작전' },
    { cap: '3점 세리머니', sub: '이태우', cls: 'wide' },
    { cap: '단체 사진', sub: '강남BC' },
  ];
  return (
    <div className="page">
      <div className="page__inner page__inner--wide">
        <div className="ex-crumb"><a>홈</a><span className="sep">›</span><span className="cur">갤러리</span></div>
        <div className="ex-head">
          <div>
            <div className="eyebrow">갤러리 · GALLERY</div>
            <h1 className="ex-head__title">코트의 명장면</h1>
            <p className="ex-head__sub">전국 대회와 경기의 순간들을 모았습니다. 앨범을 열어 더 많은 사진을 확인하세요.</p>
          </div>
          <div className="ex-head__actions">
            <button className="btn"><span className="ico material-symbols-outlined">upload</span>사진 업로드</button>
          </div>
        </div>

        <h2 className="ex-sec__h">앨범 <span className="n">{albums.length}</span></h2>
        <div className="gl-albums">
          {albums.map((a, i) => (
            <div key={i} className="gl-album">
              <div className="gl-album__cover ex-ph"><span className="ico material-symbols-outlined">photo_library</span><span>앨범 커버</span></div>
              <div className="gl-album__body">
                <div className="gl-album__t">{a.t}</div>
                <div className="gl-album__meta">{a.meta.map((m, j) => <span key={j}>{m}</span>)}</div>
              </div>
            </div>
          ))}
        </div>

        <h2 className="ex-sec__h">최근 업로드</h2>
        <div className="gl-grid">
          {shots.map((s, i) => (
            <div key={i} className={'gl-item' + (s.cls ? ' ' + s.cls : '')}>
              <div className="ex-ph"><span className="ico material-symbols-outlined">image</span><span>경기 사진</span></div>
              <div className="gl-item__cap">{s.cap}<small>{s.sub}</small></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
window.Gallery = Gallery;

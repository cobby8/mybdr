/* global React */
// BDR v2.31 — Shop (/shop · 자체 디자인 · BDR 샵)
function Shop() {
  const [cat, setCat] = React.useState('all');
  const cats = [['all', '전체'], ['ball', '농구공'], ['shoes', '슈즈'], ['wear', '의류'], ['acc', '액세서리'], ['goods', 'BDR 굿즈']];
  const items = [
    { brand: 'MOLTEN', name: 'GG7X 공인구 7호', cat: 'ball', price: '54,000', tag: ['ex-badge--ok', 'BEST'] },
    { brand: 'NIKE', name: '지오메트리 엘리트 농구화', cat: 'shoes', price: '129,000', was: '159,000', off: '19%' },
    { brand: 'BDR', name: 'BDR 리버서블 저지', cat: 'wear', price: '38,000', tag: ['ex-badge--red', 'NEW'] },
    { brand: 'SPALDING', name: 'TF-1000 실내용 농구공', cat: 'ball', price: '78,000' },
    { brand: 'UNDER ARMOUR', name: '컴프레션 암슬리브', cat: 'acc', price: '19,000' },
    { brand: 'ADIDAS', name: '데임 서티 농구화', cat: 'shoes', price: '109,000', was: '139,000', off: '21%' },
    { brand: 'BDR', name: 'BDR 로고 볼파우치', cat: 'goods', price: '24,000', tag: ['ex-badge--red', 'NEW'] },
    { brand: 'MOLTEN', name: '에어펌프 + 바늘 세트', cat: 'acc', price: '12,000' },
  ];
  const shown = cat === 'all' ? items : items.filter(i => i.cat === cat);
  return (
    <div className="page">
      <div className="page__inner page__inner--wide">
        <div className="ex-crumb"><a>홈</a><span className="sep">›</span><span className="cur">BDR 샵</span></div>
        <div className="ex-head">
          <div>
            <div className="eyebrow">샵 · SHOP</div>
            <h1 className="ex-head__title">코트 위 모든 것</h1>
            <p className="ex-head__sub">공인구부터 슈즈, BDR 한정 굿즈까지. 멤버 전용 할인가로 만나보세요.</p>
          </div>
          <div className="ex-head__actions">
            <button className="btn"><span className="ico material-symbols-outlined">shopping_cart</span>장바구니</button>
          </div>
        </div>

        <div className="ex-chips">
          {cats.map(([k, l]) => (
            <button key={k} className={'ex-chip' + (cat === k ? ' is-on' : '')} onClick={() => setCat(k)}>{l}</button>
          ))}
        </div>

        <div className="sh-grid">
          {shown.map((it, i) => (
            <div key={i} className="sh-card">
              <div className="sh-card__img ex-ph">
                {it.tag && <span className="sh-card__tag"><span className={'ex-badge ' + it.tag[0]}>{it.tag[1]}</span></span>}
                <span className="ico material-symbols-outlined">image</span><span>상품 이미지</span>
              </div>
              <div className="sh-card__body">
                <div className="sh-card__brand">{it.brand}</div>
                <div className="sh-card__name">{it.name}</div>
                <div className="sh-card__price">
                  {it.was && <del>{it.was}</del>}
                  {it.off && <span className="off">{it.off}</span>}
                  {it.price}원
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
window.Shop = Shop;

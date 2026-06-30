/* global React */
// BDR v2.31 — Coaches (/coaches · 자체 디자인 · 코치 찾기)
function Coaches() {
  const [cat, setCat] = React.useState('all');
  const cats = [['all', '전체'], ['skill', '개인 스킬'], ['team', '팀 지도'], ['youth', '유소년'], ['shoot', '슈팅']];
  const coaches = [
    { av: '강', name: '강민석', cert: true, role: '개인 스킬 · 가드 전문', cat: 'skill', bio: '프로 출신 12년 경력. 드리블·핸들링·1대1 돌파 중심 1:1 레슨.', tags: ['1:1', '드리블', '돌파'], rate: '60,000', per: '회', rating: '4.9' },
    { av: '오', name: '오세라', cert: true, role: '유소년 지도 · U12~U15', cat: 'youth', bio: '초중등 농구 교실 운영 8년. 기초 체력과 흥미 중심 그룹 클래스.', tags: ['유소년', '그룹', '기초'], rate: '35,000', per: '회', rating: '4.8' },
    { av: '정', name: '정태현', cert: false, role: '슈팅 코치 · 폼 교정', cat: 'shoot', bio: '슈팅 메커닉·릴리스 교정 전문. 영상 분석 피드백 제공.', tags: ['슈팅', '폼교정', '영상분석'], rate: '50,000', per: '회', rating: '4.9' },
    { av: '한', name: '한지우', cert: true, role: '팀 전술 · 시스템', cat: 'team', bio: '아마추어 팀 전담 코치. 모션 오펜스·존 디펜스 시스템 구축.', tags: ['팀지도', '전술', '디펜스'], rate: '120,000', per: '세션', rating: '5.0' },
    { av: '문', name: '문상혁', cert: true, role: '개인 스킬 · 빅맨', cat: 'skill', bio: '포스트 무브·풋워크 전문. 빅맨 개인기 향상 프로그램.', tags: ['빅맨', '포스트', '풋워크'], rate: '55,000', per: '회', rating: '4.7' },
    { av: '배', name: '배수진', cert: false, role: '유소년 · 여성부', cat: 'youth', bio: '여성·유소년 그룹 클래스. 즐기는 농구 중심 커리큘럼.', tags: ['여성부', '그룹', '입문'], rate: '30,000', per: '회', rating: '4.8' },
  ];
  const shown = cat === 'all' ? coaches : coaches.filter(c => c.cat === cat);
  return (
    <div className="page">
      <div className="page__inner">
        <div className="ex-crumb"><a>홈</a><span className="sep">›</span><span className="cur">코치 찾기</span></div>
        <div className="ex-head">
          <div>
            <div className="eyebrow">코치 · COACHES</div>
            <h1 className="ex-head__title">나에게 맞는 코치 찾기</h1>
            <p className="ex-head__sub">개인 스킬부터 팀 전술, 유소년 지도까지 — 검증된 코치와 1:1 또는 그룹으로 실력을 키우세요.</p>
          </div>
          <div className="ex-head__actions">
            <button className="btn btn--accent"><span className="ico material-symbols-outlined">add</span>코치 등록 신청</button>
          </div>
        </div>

        <div className="ex-chips">
          {cats.map(([k, l]) => (
            <button key={k} className={'ex-chip' + (cat === k ? ' is-on' : '')} onClick={() => setCat(k)}>{l}</button>
          ))}
        </div>

        <div className="co-grid">
          {shown.map((c, i) => (
            <div key={i} className="co-card">
              <div className="co-card__top">
                <div className="co-card__av">{c.av}</div>
                <div>
                  <div className="co-card__name">{c.name}{c.cert && <span className="ico material-symbols-outlined" title="인증 코치">verified</span>}</div>
                  <div className="co-card__role">{c.role}</div>
                </div>
              </div>
              <div className="co-card__bio">{c.bio}</div>
              <div className="co-card__tags">
                {c.tags.map((t, j) => <span key={j} className="ex-badge ex-badge--soft">{t}</span>)}
              </div>
              <div className="co-card__foot">
                <div className="co-card__rate">{c.rate}원<small>/{c.per}</small></div>
                <div className="co-card__rating"><span className="ico material-symbols-outlined">star</span>{c.rating}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
window.Coaches = Coaches;

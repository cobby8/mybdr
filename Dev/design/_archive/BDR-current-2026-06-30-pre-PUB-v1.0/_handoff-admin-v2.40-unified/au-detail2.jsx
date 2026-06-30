/* global React, window */
// =====================================================================
// au-detail2.jsx — 상세(드릴다운) 화면 2
//   신고 · 결제 · 캠페인 · 파트너 · 게시글 · NEWS 기사
//   au-detail.jsx 의 DetailHead/Tabs/MiniStat 재사용.
// =====================================================================
(function () {
const { useState } = React;
const D = window.ADMIN;
const { Panel, DL, StatusBadge, Icon, Btn, Badge } = window;
const DetailHead = window.AuDetailHead, Tabs = window.AuTabs, MiniStat = window.AuMiniStat;
const won = window.auWon, ini = window.auIni;

// =====================================================================
// 1. 신고 상세
// =====================================================================
function AuReportDetail({ id, go }) {
  const r = D.REPORTS.find((x) => x.id === id) || D.REPORTS[0];
  const X = D.REPORT_EXTRA;
  return (
    <div>
      <DetailHead go={go} back="reports" eyebrow="신고 검토" eyebrowIcon="flag"
        avatar="⚠️" avatarGrey title={r.target}
        sub={`${r.kind} 신고 · ${r.reporter} 접수`}
        badges={<><StatusBadge map={D.REPORT_STATUS} value={r.status} /><Badge tone="grey">{r.kind}</Badge>{X.prior > 0 && <Badge tone="danger">누적 신고 {X.prior}</Badge>}</>}
        actions={<><Btn variant="secondary" icon="x" size="sm">기각</Btn><Btn variant="danger" icon="gavel" size="sm">제재</Btn></>} />
      <div className="au-dgrid">
        <div className="au-dstack">
          <Panel title="신고 사유">
            <div style={{ fontSize: 15, color: 'var(--ink)', lineHeight: 1.6 }}>{r.reason}</div>
          </Panel>
          <Panel title="증거" sub="신고 대상의 문제 메시지">
            {X.evidence.map((e, i) => (
              <div className="au-evidence" data-flag={e.flagged ? 'true' : 'false'} key={i}>
                <div className="au-evidence__top"><span className="au-evidence__who">{e.who}</span><span className="au-evidence__when">{e.when}</span></div>
                <div className="au-evidence__text">{e.text}</div>
              </div>
            ))}
          </Panel>
          <Panel title="처리 이력">
            <div className="au-feed">
              {X.history.map((l, i) => (
                <div className="au-feed__row" key={i}>
                  <span className="au-feed__dot" style={{ background: D.LOG_SEV[l.sev] }} />
                  <div className="au-feed__body"><div className="au-feed__title">{l.action}</div><div className="au-feed__desc">{l.desc}</div><div className="au-feed__meta">{l.when}</div></div>
                </div>
              ))}
            </div>
          </Panel>
        </div>
        <div className="au-dstack">
          <Panel title="신고 정보">
            <DL rows={[['대상', r.target], ['유형', r.kind], ['신고자', r.reporter], ['접수일시', r.when], ['상태', <StatusBadge map={D.REPORT_STATUS} value={r.status} />]]} />
          </Panel>
          <Panel title="제재 처리">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <Btn variant="secondary" block icon="message-square">경고 발송</Btn>
              <Btn variant="secondary" block icon="eye-off">콘텐츠 숨김</Btn>
              <Btn variant="danger" block icon="ban">계정 정지</Btn>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}

// =====================================================================
// 2. 결제 상세 (영수증)
// =====================================================================
function AuPaymentDetail({ id, go }) {
  const p = D.PAYMENTS.find((x) => x.id === id) || D.PAYMENTS[0];
  const X = D.PAY_EXTRA;
  return (
    <div>
      <DetailHead go={go} back="payments" eyebrow="결제" eyebrowIcon="credit-card"
        avatar="₩" title={p.ref}
        sub={`${p.type} · ${p.method} · ${p.when}`}
        badges={<><StatusBadge map={D.PAY_STATUS} value={p.status} /><Badge tone="grey">{p.type}</Badge></>}
        actions={p.status === 'paid' ? <Btn variant="danger" icon="rotate-ccw" size="sm">환불</Btn> : p.status === 'pending' ? <Btn variant="primary" icon="check" size="sm">입금 확인</Btn> : null} />
      <div className="au-dgrid">
        <Panel title="영수증" pad={0} style={{ overflow: 'hidden' }}>
          <div style={{ padding: '20px 24px' }}>
            {X.items.map(([label, amt], i) => (
              <div className="au-settle__row" key={i}><div className="au-settle__lbl">{label}</div><div className="au-settle__amt" data-dir="in">{won(amt)}</div></div>
            ))}
            <div className="au-settle__total"><span style={{ fontWeight: 700, color: 'var(--primary)' }}>결제 금액</span><b>{won(p.amount)}</b></div>
          </div>
        </Panel>
        <div className="au-dstack">
          <Panel title="결제자">
            <DL rows={[['이름', X.payer.name], ['소속팀', X.payer.team], ['연락처', X.payer.phone]]} />
          </Panel>
          <Panel title="결제 정보">
            <DL rows={[['수단', p.method], ['카드', X.card], ['승인번호', X.approval], ['일시', p.when], ['상태', <StatusBadge map={D.PAY_STATUS} value={p.status} />]]} />
          </Panel>
        </div>
      </div>
    </div>
  );
}

// =====================================================================
// 3. 캠페인 상세 (성과 대시보드)
// =====================================================================
function AuCampaignDetail({ id, go }) {
  const c = D.CAMPAIGNS.find((x) => x.id === id) || D.CAMPAIGNS[0];
  const X = D.CAMP_EXTRA;
  const maxV = Math.max(...X.daily.map((d) => d[1]));
  const ctr = c.views ? ((c.clicks / c.views) * 100).toFixed(1) : '0';
  return (
    <div>
      <DetailHead go={go} back="campaigns" eyebrow="광고 캠페인" eyebrowIcon="megaphone"
        avatar="📣" avatarGrey title={c.name}
        sub={`${c.type} · ${c.period}`}
        badges={<StatusBadge map={D.CAMP_STATUS} value={c.status} />}
        actions={<><Btn variant="secondary" icon="pause" size="sm">일시중지</Btn><Btn variant="secondary" icon="settings-2" size="sm">설정</Btn></>} />
      <MiniStat items={[{ v: c.views.toLocaleString(), l: '총 노출' }, { v: c.clicks.toLocaleString(), l: '총 클릭' }, { v: ctr + '%', l: 'CTR' }, { v: won(X.spent), l: '집행 예산' }]} />
      <div style={{ height: 20 }} />
      <div className="au-dgrid">
        <Panel title="일별 노출" sub="최근 6일">
          <div className="au-bars">
            {X.daily.map((d) => (
              <div className="au-bars__col" key={d[0]}>
                <div className="au-bars__bar" style={{ height: `${Math.round((d[1] / maxV) * 100)}%` }} title={`${d[1].toLocaleString()} 노출`} />
                <div className="au-bars__lbl">{d[0].slice(3)}</div>
              </div>
            ))}
          </div>
        </Panel>
        <div className="au-dstack">
          <Panel title="예산">
            <div className="au-hbar"><div className="au-hbar__row"><span className="au-cell--mut">집행</span><span className="au-hbar__track"><span className="au-hbar__fill" style={{ width: `${(X.spent / X.budget) * 100}%` }} /></span><span className="au-hbar__val">{Math.round((X.spent / X.budget) * 100)}%</span></div></div>
            <div style={{ marginTop: 12 }}><DL rows={[['총 예산', won(X.budget)], ['집행', won(X.spent)], ['잔여', won(X.budget - X.spent)]]} /></div>
          </Panel>
          <Panel title="소재"><div className="au-fhint" style={{ marginTop: 0, marginBottom: 10 }}>{X.creative}</div><div className="au-upload" style={{ cursor: 'default' }}><div className="au-upload__d">{X.creative}</div></div></Panel>
        </div>
      </div>
    </div>
  );
}

// =====================================================================
// 4. 파트너 상세 (계약)
// =====================================================================
function AuPartnerDetail({ id, go }) {
  const p = D.PARTNERS.find((x) => x.id === id) || D.PARTNERS[0];
  const X = D.PARTNER_EXTRA;
  return (
    <div>
      <DetailHead go={go} back="partners" eyebrow="파트너 관리" eyebrowIcon="handshake"
        avatar={ini(p.name)} title={p.name}
        sub={`${p.field} · ${p.region}`}
        badges={<><StatusBadge map={D.PARTNER_STATUS} value={p.status} /><Badge tone="grey">{p.field}</Badge></>}
        actions={<><Btn variant="secondary" icon="file-text" size="sm">계약서</Btn><Btn variant="primary" icon="pencil" size="sm">수정</Btn></>} />
      <div className="au-dgrid">
        <div className="au-dstack">
          <Panel title="계약 정보">
            <DL rows={[['시작일', X.contract.start], ['종료일', X.contract.end], ['계약 금액', X.contract.fee], ['자동 갱신', X.contract.auto ? <Badge tone="ok">사용</Badge> : <Badge tone="grey">미사용</Badge>]]} />
          </Panel>
          <Panel title="활동 이력">
            <div className="au-feed">
              {X.history.map((l, i) => (
                <div className="au-feed__row" key={i}><span className="au-feed__dot" style={{ background: D.LOG_SEV[l.sev] }} /><div className="au-feed__body"><div className="au-feed__title">{l.action}</div><div className="au-feed__desc">{l.desc}</div><div className="au-feed__meta">{l.when}</div></div></div>
              ))}
            </div>
          </Panel>
        </div>
        <Panel title="담당 연락처">
          <DL rows={X.contacts} />
        </Panel>
      </div>
    </div>
  );
}

// =====================================================================
// 5. 게시글 상세 (검수)
// =====================================================================
function AuPostDetail({ id, go }) {
  const p = D.POSTS.find((x) => x.id === id) || D.POSTS[0];
  const X = D.POST_EXTRA;
  return (
    <div>
      <DetailHead go={go} back="community" eyebrow="커뮤니티" eyebrowIcon="message-square"
        avatar={ini(p.author)} avatarGrey title={p.title}
        sub={`${p.board} · ${p.author} · ${p.date}`}
        badges={<><StatusBadge map={D.POST_STATUS} value={p.status} /><Badge tone="grey">댓글 {p.comments}</Badge>{p.reports > 0 && <Badge tone="danger" icon="flag">신고 {p.reports}</Badge>}</>}
        actions={<><Btn variant="danger" icon="eye-off" size="sm">숨김</Btn><Btn variant="secondary" icon="trash-2" size="sm">삭제</Btn></>} />
      <div className="au-dgrid">
        <div className="au-dstack">
          <Panel title="본문">
            <div className="au-readbody">{X.body}</div>
            <div style={{ display: 'flex', gap: 16, marginTop: 18, fontSize: 13, color: 'var(--ink-mute)', fontWeight: 600 }}>
              <span style={{ display: 'inline-flex', gap: 5, alignItems: 'center' }}><Icon name="heart" size={15} />{p.likes}</span>
              <span style={{ display: 'inline-flex', gap: 5, alignItems: 'center' }}><Icon name="message-circle" size={15} />{p.comments}</span>
            </div>
          </Panel>
          <Panel title={`댓글 ${X.comments.length}`}>
            {X.comments.map((c, i) => (
              <div className="au-comment" data-flagged={c.reports > 0 ? 'true' : 'false'} key={i}>
                <span className="au-comment__av">{ini(c.who)}</span>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div className="au-comment__top"><span className="au-comment__who">{c.who}</span><span className="au-comment__when">{c.when}</span>{c.reports > 0 && <Badge tone="danger" icon="flag">{c.reports}</Badge>}</div>
                  <div className="au-comment__body">{c.text}</div>
                </div>
                {c.reports > 0 && <Btn variant="danger" size="sm" icon="eye-off">숨김</Btn>}
              </div>
            ))}
          </Panel>
        </div>
        <Panel title="검수">
          <DL rows={[['게시판', p.board], ['작성자', p.author], ['작성일', p.date], ['신고', `${p.reports}건`]]} />
          <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <Btn variant="secondary" block icon="check">정상 처리</Btn>
            <Btn variant="danger" block icon="eye-off">게시글 숨김</Btn>
          </div>
        </Panel>
      </div>
    </div>
  );
}

// =====================================================================
// 6. NEWS 기사 상세
// =====================================================================
function AuNewsDetail({ id, go }) {
  const n = D.NEWS.find((x) => x.id === id) || D.NEWS[0];
  const X = D.NEWS_EXTRA;
  return (
    <div>
      <DetailHead go={go} back="community" eyebrow="BDR NEWS" eyebrowIcon="newspaper"
        avatar="📰" avatarGrey title={n.title}
        sub={`${n.cat} · ${n.author} · ${n.when}`}
        badges={<><StatusBadge map={D.NEWS_STATUS} value={n.status} /><Badge tone="grey">조회 {n.views.toLocaleString()}</Badge></>}
        actions={n.status === 'published' ? <Btn variant="secondary" icon="pencil" size="sm">수정</Btn> : <><Btn variant="secondary" icon="x" size="sm">반려</Btn><Btn variant="primary" icon="send" size="sm">게시</Btn></>} />
      <div className="au-dgrid">
        <div className="au-dstack">
          <Panel title="대표 이미지" pad={16}><div className="au-upload" style={{ cursor: 'default' }}><div className="au-upload__d">{X.thumb}</div></div></Panel>
          <Panel title="본문"><div className="au-readbody">{X.body}</div></Panel>
        </div>
        <Panel title="기사 정보">
          <DL rows={[['카테고리', n.cat], ['작성자', n.author], ['게시일', n.when], ['조회수', n.views.toLocaleString()], ['상태', <StatusBadge map={D.NEWS_STATUS} value={n.status} />]]} />
          {n.status !== 'published' && <div style={{ marginTop: 16 }}><Btn variant="primary" block icon="send" onClick={() => go('community')}>게시 승인</Btn></div>}
        </Panel>
      </div>
    </div>
  );
}

Object.assign(window, { AuReportDetail, AuPaymentDetail, AuCampaignDetail, AuPartnerDetail, AuPostDetail, AuNewsDetail });
})();

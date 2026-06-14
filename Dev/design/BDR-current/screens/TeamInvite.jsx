/* global React */
// BDR v2.31 — TeamInvite (/team-invite · 자체 디자인 · 팀 초대 수락)
function TeamInvite() {
  return (
    <div className="page">
      <div className="page__inner page__inner--narrow ti-wrap">
        <div className="card ti-card">
          <div className="ti-banner">
            <div className="ti-banner__av">MNK</div>
            <div className="ti-banner__inv">팀 초대가 도착했어요</div>
            <div className="ti-banner__team">MONKEYZ</div>
          </div>
          <div className="ti-body">
            <div className="ti-from">
              <div className="ti-from__av">몽</div>
              <div>
                <div className="ti-from__name">monkey_cap · 팀장</div>
                <div className="ti-from__msg">"같이 대회 나가요! 가드 한 자리 비었습니다."</div>
              </div>
            </div>

            <div className="ti-stats">
              <div className="ti-stat"><div className="ti-stat__v">1812</div><div className="ti-stat__k">팀 레이팅</div></div>
              <div className="ti-stat"><div className="ti-stat__v">18-6</div><div className="ti-stat__k">시즌 전적</div></div>
              <div className="ti-stat"><div className="ti-stat__v">9명</div><div className="ti-stat__k">현재 멤버</div></div>
            </div>

            <div style={{ fontSize: 12.5, color: 'var(--ink-mute)', lineHeight: 1.6, marginBottom: 20 }}>
              초대를 수락하면 <b style={{ color: 'var(--ink)' }}>MONKEYZ</b>의 팀원이 되어 팀 경기·대회·스크림에 함께 참여할 수 있습니다. 가입 후 팀장이 등번호와 포지션을 배정합니다.
            </div>

            <div className="ti-actions">
              <button className="btn btn--ghost">거절</button>
              <button className="btn btn--accent"><span className="ico material-symbols-outlined">check</span>초대 수락</button>
            </div>
            <div className="ti-note">이 초대는 2026.05.05까지 유효합니다.</div>
          </div>
        </div>
      </div>
    </div>
  );
}
window.TeamInvite = TeamInvite;

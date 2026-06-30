/* global React */
// ============================================================
// BDR v2.23 — CommunityEdit (CU4 · Phase 5B · 신규 · BC5)
// 운영 박제 대상: /community/[id]/edit
// 패턴: CU3 CommunityWizard 재사용 (별 컴포넌트 ❌ — prefill 만 차이)
//   - 기존 데이터 prefill (title / content / category / type / image_count / team_id)
//   - 본인 author_id 검증 (시각 가드 — is_owner)
//   - 사후 안내 = "수정되었습니다" + CU2 진입
// A 등급
// ============================================================

// 운영 기존 게시글 prefill (CU2 본인 글 진입 가정)
const CU4_PREFILL = {
  category: 'review',
  type: 'image',
  title: 'BDR 서머 오픈 #4 예선 후기 — 우리 팀 8강 진출까지',
  content: '첫 출전이라 긴장했는데 조 2위로 8강 진출했습니다.\n\n코트별 분위기랑 운영, 대진 흐름을 정리해봤어요. 다음 출전하실 분들께 도움이 되면 좋겠습니다.',
  image_count: 4,
  tournament_id: '',
  team_id: 'tm-3',
};

function CommunityEdit({ isOwner = true }) {
  // 본인 author_id 검증 가드 (시각만 — 운영 서버 액션에서 재검증)
  if (!isOwner) {
    return (
      <div className="ou3-page">
        <div className="ou3-success">
          <div className="ou3-success__icon material-symbols-outlined" style={{ color: 'var(--ink-dim)' }}>lock</div>
          <h2 className="ou3-success__h">수정 권한이 없습니다</h2>
          <p className="ou3-success__sub">본인이 작성한 글만 수정할 수 있어요.<br />다른 사용자의 글은 신고 기능을 이용해 주세요.</p>
          <div className="ou3-success__cta">
            <a className="btn" href="cu2-community-detail.html">상세로 돌아가기</a>
            <a className="btn btn--primary" href="cu1-community-list.html">목록으로</a>
          </div>
        </div>
      </div>
    );
  }
  // CU3 마법사 재사용 — mode="edit" + prefill
  return <window.CommunityWizard mode="edit" prefill={{ ...CU4_PREFILL }} />;
}

window.CommunityEdit = CommunityEdit;

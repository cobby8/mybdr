/* global React, AdminShell, AdminEmptyState */

// =====================================================================
// AdminTournamentDivisions.jsx — Admin-E · 종별 관리 (v2.15 신규)
//   진입: setRoute('adminTournamentDivisions')
//   복귀: setRoute('adminTournamentSetupHub')
//
// 패턴: 종별 카드 list (정렬 가능) + 하단 + 종별 추가 inline form
//   각 카드: 이름 / 연령 / 성별 / 팀 수 / 등록 상태 / [수정][삭제]
// 운영 source: src/app/(admin)/tournament-admin/tournaments/[id]/divisions/page.tsx
// =====================================================================

const TD_TOURNAMENT = { tournament_id: 'tn_2026_summer_4', name: 'BDR 서머 오픈 #4' };

const TD_INITIAL = [
{ division_id: 'd_open', label: '오픈', age_min: 19, age_max: null, gender: 'mixed', gender_label: '혼성', team_count: 16, team_max: 16, fee: 250000 },
{ division_id: 'd_u18', label: 'U18', age_min: 16, age_max: 18, gender: 'mixed', gender_label: '혼성', team_count: 8, team_max: 12, fee: 180000 },
{ division_id: 'd_u15', label: 'U15', age_min: 13, age_max: 15, gender: 'mixed', gender_label: '혼성', team_count: 6, team_max: 12, fee: 150000 },
{ division_id: 'd_women', label: '여자부', age_min: 19, age_max: null, gender: 'female', gender_label: '여성', team_count: 8, team_max: 8, fee: 200000 }];



function AdminTournamentDivisions({ setRoute, theme, setTheme }) {
  const [adminRole, setAdminRole] = React.useState('tournament_admin');
  const [mockState, setMockState] = React.useState('filled');
  const [divisions, setDivisions] = React.useState(TD_INITIAL);
  const [editingId, setEditingId] = React.useState(null);
  const [draft, setDraft] = React.useState({ label: '', age_min: '', age_max: '', gender: 'mixed', team_max: 16, fee: 200000 });
  const [adding, setAdding] = React.useState(false);
  const [toast, setToast] = React.useState(null);

  const rows = mockState === 'empty' ? [] : divisions;

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  };

  const startEdit = (d) => {
    setEditingId(d.division_id);
    setAdding(false);
    setDraft({
      label: d.label,
      age_min: d.age_min,
      age_max: d.age_max || '',
      gender: d.gender,
      team_max: d.team_max,
      fee: d.fee
    });
  };

  const saveEdit = () => {
    setDivisions((curr) => curr.map((d) => d.division_id === editingId ? {
      ...d, label: draft.label, age_min: Number(draft.age_min),
      age_max: draft.age_max ? Number(draft.age_max) : null,
      gender: draft.gender, gender_label: draft.gender === 'female' ? '여성' : draft.gender === 'male' ? '남성' : '혼성',
      team_max: Number(draft.team_max), fee: Number(draft.fee)
    } : d));
    setEditingId(null);
    showToast('종별 정보가 저장되었습니다');
  };

  const startAdd = () => {
    setAdding(true);
    setEditingId(null);
    setDraft({ label: '', age_min: '', age_max: '', gender: 'mixed', team_max: 16, fee: 200000 });
  };

  const saveAdd = () => {
    if (!draft.label.trim()) {
      showToast('종별 이름을 입력하세요');
      return;
    }
    const newDiv = {
      division_id: `d_${Date.now()}`,
      label: draft.label,
      age_min: Number(draft.age_min) || 0,
      age_max: draft.age_max ? Number(draft.age_max) : null,
      gender: draft.gender,
      gender_label: draft.gender === 'female' ? '여성' : draft.gender === 'male' ? '남성' : '혼성',
      team_count: 0,
      team_max: Number(draft.team_max),
      fee: Number(draft.fee)
    };
    setDivisions((curr) => [...curr, newDiv]);
    setAdding(false);
    showToast(`${draft.label} 종별이 추가되었습니다`);
  };

  const removeDiv = (id) => {
    const d = divisions.find((x) => x.division_id === id);
    if (d.team_count > 0) {
      showToast(`${d.team_count}팀이 등록되어 삭제할 수 없습니다`);
      return;
    }
    setDivisions((curr) => curr.filter((x) => x.division_id !== id));
    showToast(`${d.label} 종별이 삭제되었습니다`);
  };

  const dashTopbarRight =
  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <div style={{ padding: '4px 10px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 4, display: 'flex', gap: 6, alignItems: 'center', fontFamily: 'var(--ff-mono)', fontSize: 11, color: 'var(--ink-mute)' }}>
        <span style={{ fontWeight: 700, color: 'var(--accent)' }}>MOCK</span>
        <select value={mockState} onChange={(e) => setMockState(e.target.value)} style={{ fontSize: 11, padding: '2px 4px', border: 0, background: 'transparent', color: 'inherit' }}>
          <option value="filled">D · filled (4종별)</option>
          <option value="empty">D · empty (신규)</option>
        </select>
      </div>
      <button className="admin-user" type="button">
        <div className="admin-user__avatar">OY</div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: 1.2 }}>
          <span style={{ fontWeight: 600, fontSize: 13 }}>오영진</span>
          <span className="admin-user__role">tournament admin</span>
        </div>
        <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'var(--ink-mute)' }}>expand_more</span>
      </button>
    </div>;


  const totalTeams = rows.reduce((s, r) => s + r.team_count, 0);
  const totalMax = rows.reduce((s, r) => s + r.team_max, 0);

  return (
    <AdminShell route="adminTournamentDivisions" setRoute={setRoute}
      eyebrow="ADMIN · 대회 운영" title="종별 관리"
      subtitle={`${TD_TOURNAMENT.name} · 종별 ${rows.length}개 · 총 ${totalTeams}/${totalMax}팀`}
      adminRole={adminRole} setAdminRole={setAdminRole} theme={theme} setTheme={setTheme}
      topbarRight={dashTopbarRight}
      breadcrumbs={[
      { label: 'ADMIN', onClick: () => setRoute('adminDashboard') },
      { label: '대회 운영자 도구', onClick: () => setRoute('adminTournamentAdminHome') },
      { label: TD_TOURNAMENT.name, onClick: () => setRoute('adminTournamentSetupHub') },
      { label: '종별' }]
      }
      actions={
      <button type="button" className="btn btn--primary" onClick={startAdd}>
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add_circle</span>
          종별 추가
        </button>
      }>

      {toast &&
      <div style={{ position: 'fixed', top: 80, right: 24, zIndex: 100, background: 'var(--ok)', color: '#fff', padding: '12px 16px', borderRadius: 4, display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>check_circle</span>
          <span style={{ fontSize: 13, fontWeight: 600 }}>{toast}</span>
        </div>
      }

      {rows.length === 0 && !adding ?
      <AdminEmptyState icon="category" title="아직 종별이 정의되지 않았어요"
        description="오픈·U18·여자부 등 종별을 1건 이상 정의해야 팀이 신청할 수 있습니다."
        ctaLabel="첫 종별 추가" onCta={startAdd} /> :


      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {rows.map((d) => editingId === d.division_id ?
        <DivisionFormCard key={d.division_id} draft={draft} setDraft={setDraft}
          onSave={saveEdit} onCancel={() => setEditingId(null)}
          mode="edit" /> :

        <DivisionViewCard key={d.division_id} d={d}
          onEdit={() => startEdit(d)} onRemove={() => removeDiv(d.division_id)} />

        )}

          {adding &&
        <DivisionFormCard draft={draft} setDraft={setDraft}
          onSave={saveAdd} onCancel={() => setAdding(false)}
          mode="add" />
        }

          {!adding && rows.length > 0 &&
        <button type="button" onClick={startAdd}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            padding: 14, background: 'var(--bg-card)', border: '1px dashed var(--border)',
            borderRadius: 4, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, color: 'var(--ink-mute)'
          }}>

              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add_circle</span>
              종별 추가
            </button>
        }
        </div>
      }
    </AdminShell>);

}

function DivisionViewCard({ d, onEdit, onRemove }) {
  const fill = d.team_count / d.team_max;
  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 6,
      padding: 16, display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1.2fr 1fr 80px', gap: 14, alignItems: 'center'
    }}>
      {/* label + id */}
      <div>
        <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink)' }}>{d.label}</div>
        <div style={{ fontFamily: 'var(--ff-mono)', fontSize: 10.5, color: 'var(--ink-dim)', marginTop: 2 }}>{d.division_id}</div>
      </div>
      {/* age */}
      <div>
        <div style={{ fontSize: 10, color: 'var(--ink-mute)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>연령</div>
        <div style={{ fontFamily: 'var(--ff-mono)', fontSize: 13, color: 'var(--ink-soft)', marginTop: 2 }}>
          {d.age_max ? `${d.age_min}~${d.age_max}세` : `${d.age_min}세 이상`}
        </div>
      </div>
      {/* gender */}
      <div>
        <div style={{ fontSize: 10, color: 'var(--ink-mute)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>성별</div>
        <div style={{ marginTop: 4 }}>
          <span className="admin-stat-pill" data-tone={d.gender === 'female' ? 'accent' : 'mute'}>
            <span className="material-symbols-outlined" style={{ fontSize: 11 }}>
              {d.gender === 'female' ? 'female' : d.gender === 'male' ? 'male' : 'transgender'}
            </span>
            {d.gender_label}
          </span>
        </div>
      </div>
      {/* teams + bar */}
      <div>
        <div style={{ fontSize: 10, color: 'var(--ink-mute)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>참가팀</div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginTop: 2 }}>
          <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 15, fontWeight: 700, color: 'var(--ink)' }}>{d.team_count}</span>
          <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 11, color: 'var(--ink-mute)' }}>/ {d.team_max}</span>
        </div>
        <div style={{ height: 4, background: 'var(--bg-alt)', borderRadius: 2, marginTop: 4 }}>
          <div style={{ height: '100%', width: `${fill * 100}%`, background: fill >= 1 ? 'var(--ok)' : 'var(--accent)', borderRadius: 2 }} />
        </div>
      </div>
      {/* fee */}
      <div>
        <div style={{ fontSize: 10, color: 'var(--ink-mute)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>참가비</div>
        <div style={{ fontFamily: 'var(--ff-mono)', fontSize: 13, color: 'var(--ink-soft)', marginTop: 2 }}>
          {d.fee.toLocaleString()}원
        </div>
      </div>
      {/* actions */}
      <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
        <button type="button" onClick={onEdit} title="수정"
          style={{ width: 32, height: 32, borderRadius: 4, background: 'var(--bg-alt)', border: 0, display: 'grid', placeItems: 'center', cursor: 'pointer', color: 'var(--ink-soft)' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>edit</span>
        </button>
        <button type="button" onClick={onRemove} title="삭제"
          style={{ width: 32, height: 32, borderRadius: 4, background: 'var(--bg-alt)', border: 0, display: 'grid', placeItems: 'center', cursor: 'pointer', color: 'var(--err)' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>delete</span>
        </button>
      </div>
    </div>);

}

function DivisionFormCard({ draft, setDraft, onSave, onCancel, mode }) {
  const u = (k) => (e) => setDraft({ ...draft, [k]: e.target.value });
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--accent)', borderRadius: 6, padding: 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'var(--accent)' }}>{mode === 'add' ? 'add_circle' : 'edit'}</span>
        <span style={{ fontWeight: 700, fontSize: 14 }}>{mode === 'add' ? '종별 추가' : '종별 수정'}</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1.2fr 1fr', gap: 10 }}>
        <Field label="종별 이름" req>
          <input value={draft.label} onChange={u('label')} placeholder="예: 오픈, U18, 여자부" style={inpDS} />
        </Field>
        <Field label="최소 연령" req>
          <input type="number" value={draft.age_min} onChange={u('age_min')} placeholder="13" style={inpDS} />
        </Field>
        <Field label="최대 연령">
          <input type="number" value={draft.age_max} onChange={u('age_max')} placeholder="제한 없음" style={inpDS} />
        </Field>
        <Field label="성별" req>
          <select value={draft.gender} onChange={u('gender')} style={inpDS}>
            <option value="mixed">혼성</option>
            <option value="male">남성</option>
            <option value="female">여성</option>
          </select>
        </Field>
        <Field label="최대 팀 수" req>
          <input type="number" value={draft.team_max} onChange={u('team_max')} placeholder="16" style={inpDS} />
        </Field>
      </div>
      <div style={{ marginTop: 10, display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 10 }}>
        <Field label="참가비 (원)" req>
          <input type="number" value={draft.fee} onChange={u('fee')} placeholder="200000" style={inpDS} />
        </Field>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--border)' }}>
        <button type="button" className="btn" onClick={onCancel}>취소</button>
        <button type="button" className="btn btn--primary" onClick={onSave}>
          {mode === 'add' ? '추가' : '저장'}
        </button>
      </div>
    </div>);

}

function Field({ label, req, children }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 10.5, color: 'var(--ink-mute)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600, marginBottom: 4 }}>
        {label}{req && <span style={{ color: 'var(--accent)' }}> *</span>}
      </label>
      {children}
    </div>);

}

const inpDS = { width: '100%', padding: '7px 9px', border: '1px solid var(--border)', borderRadius: 4, background: 'var(--bg)', color: 'var(--ink)', fontSize: 12.5, fontFamily: 'inherit', boxSizing: 'border-box' };

window.AdminTournamentDivisions = AdminTournamentDivisions;

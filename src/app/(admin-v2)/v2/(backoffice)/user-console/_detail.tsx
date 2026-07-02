"use client";

// ============================================================
// _detail.tsx — R2-A 유저 콘솔 상세 화면 (정본 bo-detail-2.jsx 1:1)
//   UserDetail(회원 + 계정 정지 모달) · TeamDetail(팀 + 선수 명단)
//   OrgDetail(단체 + 인증 처리 모달). 공용 Field/Stat/DetailHead.
//   - 회원 정지 = 실 server action(updateUserStatusAction · status "suspended"/"active")
//   - 단체 인증 = 실 REST(adminFetch approve/reject)
//   - 정본 mock 보강 데이터(타임라인/매너/서류 등)는 실데이터 없음 → 미렌더(보고).
// ============================================================

import React from "react";
import { useRouter } from "next/navigation";
import { Icon, Btn, Badge, Modal, useAdminShell } from "@/components/admin-v2";
import { OrgEditModal } from "./_org-modals";
import {
  approveOrganization,
  rejectOrganization,
  AdminApiError,
  type AdminBoUser,
  type AdminBoTeam,
  type AdminBoOrg,
} from "@/lib/admin-v2/data";

// ── 공용 ──────────────────────────────────────────────────
function Field({ k, children, mono }: { k: React.ReactNode; children: React.ReactNode; mono?: boolean }) {
  return (
    <div className="bo-field">
      <span className="bo-field__k">{k}</span>
      <span className="bo-field__v" style={mono ? { fontFamily: "var(--ff-mono)" } : undefined}>{children}</span>
    </div>
  );
}
function Stat({ k, v, tone }: { k: React.ReactNode; v: React.ReactNode; tone?: string }) {
  return (
    <div className="bo-stat">
      <div className="bo-stat__v" data-tone={tone || ""}>{v}</div>
      <div className="bo-stat__k">{k}</div>
    </div>
  );
}
function DetailHead({ eyebrow, title, sub, actions }: { eyebrow: React.ReactNode; title: React.ReactNode; sub?: React.ReactNode; actions?: React.ReactNode }) {
  return (
    <div className="bo-detail-head">
      <div style={{ minWidth: 0 }}>
        <div className="ts-ph__eyebrow">{eyebrow}</div>
        <div className="ts-ph__title">{title}</div>
        {sub && <div className="ts-ph__sub">{sub}</div>}
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>{actions}</div>
    </div>
  );
}

// ── 회원 상세 ──────────────────────────────────────────────
export function UserDetail({
  row,
  onBack,
  currentUserId,
  suspendAction,
}: {
  row: AdminBoUser & { color: string };
  onBack: () => void;
  currentUserId: string | null;
  suspendAction: (formData: FormData) => Promise<void>;
}) {
  const { toast } = useAdminShell();
  const router = useRouter();
  const [status, setStatus] = React.useState(row.badge);
  const [tone, setTone] = React.useState(row.tone);
  const [suspendOpen, setSuspendOpen] = React.useState(false);
  const [reason, setReason] = React.useState("약관 위반 신고 누적");
  const [pending, startTransition] = React.useTransition();
  const suspended = status === "정지";
  const isSelf = currentUserId != null && currentUserId === row.id;

  const run = (next: "suspended" | "active", okMsg: string) => {
    const fd = new FormData();
    fd.set("user_id", row.id);
    fd.set("status", next);
    startTransition(async () => {
      try {
        await suspendAction(fd);
        setStatus(next === "suspended" ? "정지" : "활성");
        setTone(next === "suspended" ? "danger" : "ok");
        setSuspendOpen(false);
        toast(okMsg);
        router.refresh();
      } catch {
        toast("처리에 실패했습니다");
      }
    });
  };

  return (
    <div>
      <button className="ad-backlink" onClick={onBack}><Icon name="arrow-left" size={16} />사용자 목록</button>
      <DetailHead
        eyebrow="백오피스 · 회원 관리"
        title={row.name}
        sub={<>{row.email} · 가입 <b style={{ fontFamily: "var(--ff-mono)", color: "var(--ink-soft)" }}>{row.joined}</b></>}
        actions={<>
          <Btn variant="secondary" icon="mail" onClick={() => toast("쪽지 보내기는 준비 중입니다")}>쪽지</Btn>
          {isSelf ? (
            <Btn variant="secondary" icon="shield" disabled>본인 계정</Btn>
          ) : suspended ? (
            <Btn icon="rotate-ccw" disabled={pending} onClick={() => run("active", row.name + " 계정 정지를 해제했습니다")}>정지 해제</Btn>
          ) : (
            <Btn variant="danger" icon="ban" disabled={pending} onClick={() => setSuspendOpen(true)}>계정 정지</Btn>
          )}
        </>}
      />

      <div className="ts-card" style={{ marginBottom: 20 }}>
        <div className="bo-hero">
          <span className="bo-hero__av" data-round="true" style={{ background: row.color }}>{row.name.slice(0, 1)}</span>
          <div className="bo-hero__meta">
            <div className="bo-hero__name">{row.name}</div>
            <div className="bo-hero__sub">{row.region} · {row.membershipLabel}</div>
            <div className="bo-hero__badges">
              <Badge tone={(tone as never) || "grey"}>{status}</Badge>
              <Badge tone="grey">{row.membershipLabel}</Badge>
            </div>
          </div>
        </div>
        <div className="bo-statgrid">
          <Stat k="소속 팀" v={row.teams.length + "팀"} />
          <Stat k="가입 경로" v={row.provider || "-"} />
          <Stat k="등급" v={row.membershipLabel} tone="primary" />
          <Stat k="상태" v={status} tone={tone} />
        </div>
      </div>

      <div className="ad-cols">
        <div className="ad-panel">
          <div className="ad-panel__title" style={{ marginBottom: 8 }}>계정 정보</div>
          <Field k="이메일" mono>{row.email}</Field>
          <Field k="연락처" mono>{row.phone || "-"}</Field>
          <Field k="활동 지역">{row.region}</Field>
          <Field k="가입 경로">{row.provider || "-"}</Field>
          <Field k="가입일" mono>{row.joined}</Field>
          <Field k="최근 접속" mono>{row.lastSeen || "-"}</Field>
        </div>

        <div className="ad-panel">
          <div className="ad-panel__head"><div className="ad-panel__title">소속 팀</div><Badge tone="grey">{row.teams.length}</Badge></div>
          {row.teams.length ? (
            <div className="bo-roster">
              {row.teams.map((t, i) => (
                <div key={i} className="bo-rowitem">
                  <span className="bo-rowitem__av" data-square="true" style={{ background: t.color }}>{t.name.slice(0, 1)}</span>
                  <div className="bo-rowitem__body">
                    <div className="bo-rowitem__t">{t.name}</div>
                    <div className="bo-rowitem__s">{t.kind}</div>
                  </div>
                  <span className="bo-chip" data-tone={t.role === "주장" ? "primary" : ""}>{t.role}</span>
                </div>
              ))}
            </div>
          ) : <div className="ad-cell-muted" style={{ padding: "10px 0", fontWeight: 600 }}>소속된 팀이 없습니다.</div>}
        </div>
      </div>

      <Modal open={suspendOpen} onClose={() => setSuspendOpen(false)} title="계정 정지" sub={row.name + " · " + row.email}
        foot={<>
          <Btn variant="secondary" onClick={() => setSuspendOpen(false)}>취소</Btn>
          <Btn variant="danger" icon="ban" disabled={pending} onClick={() => run("suspended", row.name + " 계정을 정지했습니다")}>정지 확정</Btn>
        </>}>
        <div className="ts-field">
          <label className="ts-field__label">정지 사유</label>
          <select className="ts-select" value={reason} onChange={(e) => setReason(e.target.value)}>
            <option>약관 위반 신고 누적</option>
            <option>비방·욕설 게시</option>
            <option>노쇼·매너 점수 미달</option>
            <option>결제 사기 의심</option>
            <option>기타</option>
          </select>
        </div>
        <div style={{ display: "flex", gap: 10, padding: "12px 14px", background: "var(--danger-weak)", borderRadius: 12, alignItems: "flex-start" }}>
          <Icon name="alert-triangle" size={17} color="var(--danger)" style={{ marginTop: 1, flex: "0 0 auto" }} />
          <div style={{ fontSize: 13, color: "var(--ink-soft)", lineHeight: 1.5 }}>정지 시 즉시 로그인·매칭·결제가 차단됩니다. 정지 해제 전까지 모든 활동이 제한됩니다.</div>
        </div>
      </Modal>
    </div>
  );
}

// ── 팀 상세 ────────────────────────────────────────────────
export function TeamDetail({ row, onBack }: { row: AdminBoTeam; onBack: () => void }) {
  const { toast } = useAdminShell();
  const total = row.wins + row.losses;
  const winPct = total ? Math.round((row.wins / total) * 100) : 0;

  return (
    <div>
      <button className="ad-backlink" onClick={onBack}><Icon name="arrow-left" size={16} />팀 목록</button>
      <DetailHead
        eyebrow="백오피스 · 팀 관리"
        title={row.name}
        sub={<>{row.sub} · 활동 지역 <b style={{ color: "var(--ink-soft)" }}>{row.region}</b></>}
        actions={<Btn variant="secondary" icon="mail" onClick={() => toast("팀 대표 쪽지는 준비 중입니다")}>쪽지</Btn>}
      />

      <div className="ts-card" style={{ marginBottom: 20 }}>
        <div className="bo-hero">
          <span className="bo-hero__av" style={{ background: row.color }}>{row.name.slice(0, 1)}</span>
          <div className="bo-hero__meta">
            <div className="bo-hero__name">{row.name}</div>
            <div className="bo-hero__sub">{row.region} · 주장 {row.captain}</div>
            <div className="bo-hero__badges">
              <Badge tone={(row.sttone === "mute" ? "grey" : "ok") as never}>{row.status}</Badge>
            </div>
          </div>
        </div>
        <div className="bo-statgrid">
          <Stat k="선수" v={row.members} />
          <Stat k="전적 (승-패)" v={row.wins + "-" + row.losses} tone="primary" />
          <Stat k="창단" v={row.foundedYear ? String(row.foundedYear) : "-"} />
          <Stat k="승률" v={winPct + "%"} tone="ok" />
        </div>
      </div>

      <div className="ad-cols">
        <div className="ad-panel">
          <div className="ad-panel__head"><div className="ad-panel__title">선수 명단</div><Badge tone="grey">{row.roster.length}명</Badge></div>
          {row.roster.length ? (
            <div className="bo-roster">
              {row.roster.map((p, i) => (
                <div key={i} className="bo-rowitem">
                  <span className="bo-rowitem__av" style={{ background: p.color }}>{p.name.slice(0, 1)}</span>
                  <div className="bo-rowitem__body">
                    <div className="bo-rowitem__t">{p.name}{p.jersey ? ` · ${p.jersey}` : ""}</div>
                    <div className="bo-rowitem__s">{p.pos}</div>
                  </div>
                  <span className="bo-chip" data-tone={p.role === "주장" ? "primary" : ""}>{p.role}</span>
                </div>
              ))}
            </div>
          ) : <div className="ad-cell-muted" style={{ padding: "10px 0", fontWeight: 600 }}>등록된 선수가 없습니다.</div>}
        </div>

        <div className="ad-panel">
          <div className="ad-panel__title" style={{ marginBottom: 8 }}>팀 정보</div>
          <Field k="창단" mono>{row.foundedYear ? String(row.foundedYear) : "-"}</Field>
          <Field k="주장">{row.captain}</Field>
          <Field k="전적" mono>{row.wins}승 {row.losses}패 {row.draws}무</Field>
          <Field k="승률" mono>{winPct}%</Field>
          <div style={{ marginTop: 4 }}>
            <div className="bo-wl">
              <span className="bo-wl__w" style={{ width: winPct + "%" }} />
              <span className="bo-wl__l" style={{ width: (100 - winPct) + "%" }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── 단체 상세 ──────────────────────────────────────────────
export function OrgDetail({ row, onBack }: { row: AdminBoOrg & { color: string }; onBack: () => void }) {
  const { toast } = useAdminShell();
  const router = useRouter();
  const [badge, setBadge] = React.useState(row.badge);
  const [tone, setTone] = React.useState(row.tone);
  const [verifyOpen, setVerifyOpen] = React.useState(false);
  const [editOpen, setEditOpen] = React.useState(false);
  const [reason, setReason] = React.useState("제출 서류 미비");
  const [busy, setBusy] = React.useState(false);
  const pending = badge === "대기";

  const approve = async () => {
    setBusy(true);
    try {
      await approveOrganization(row.id);
      setBadge("인증됨"); setTone("primary"); setVerifyOpen(false);
      toast(row.name + " 단체를 인증 처리했습니다");
      router.refresh();
    } catch (e) {
      toast(e instanceof AdminApiError ? e.message : "인증 처리에 실패했습니다");
    } finally {
      setBusy(false);
    }
  };
  const reject = async () => {
    setBusy(true);
    try {
      await rejectOrganization(row.id, reason);
      setBadge("반려"); setTone("danger"); setVerifyOpen(false);
      toast(row.name + " 인증 요청을 반려했습니다");
      router.refresh();
    } catch (e) {
      toast(e instanceof AdminApiError ? e.message : "반려 처리에 실패했습니다");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <button className="ad-backlink" onClick={onBack}><Icon name="arrow-left" size={16} />단체 목록</button>
      <DetailHead
        eyebrow="백오피스 · 단체 관리"
        title={row.name}
        sub={<>{row.type} · 주최 시리즈 <b style={{ color: "var(--ink-soft)" }}>{row.tourn}</b></>}
        actions={<>
          {/* Task B: slug 방어 체크 — slug 없는 레거시 단체 대응 */}
          {row.slug ? (
            <a href={`/organizations/${row.slug}`} target="_blank" rel="noopener noreferrer" className="ts-btn ts-btn--secondary">
              <Icon name="external-link" size={17} />공개 페이지
            </a>
          ) : (
            <button className="ts-btn ts-btn--secondary" disabled title="slug 미등록 단체">
              <Icon name="external-link" size={17} />공개 페이지
            </button>
          )}
          <Btn variant="secondary" icon="pencil" onClick={() => setEditOpen(true)}>편집</Btn>
          {pending && <Btn icon="badge-check" disabled={busy} onClick={() => setVerifyOpen(true)}>인증 처리</Btn>}
        </>}
      />

      <div className="ts-card" style={{ marginBottom: 20 }}>
        <div className="bo-hero">
          <span className="bo-hero__av" style={{ background: row.color }}><Icon name="building-2" size={28} color="#fff" /></span>
          <div className="bo-hero__meta">
            <div className="bo-hero__name">{row.name}</div>
            <div className="bo-hero__sub">{row.type} · {row.region}</div>
            <div className="bo-hero__badges">
              <Badge tone={(tone as never) || "grey"}>{badge === "인증됨" ? "인증됨" : badge === "반려" ? "반려" : "인증 대기"}</Badge>
              <Badge tone="grey">{row.region}</Badge>
            </div>
          </div>
        </div>
        <div className="bo-statgrid">
          <Stat k="주최 시리즈" v={row.tourn} />
          <Stat k="소속 회원" v={row.membersCount + "명"} />
          <Stat k="운영진" v={row.staff.length + "명"} />
          <Stat k="등록일" v={row.createdAt} tone="primary" />
        </div>
      </div>

      <div className="ad-cols">
        <div className="ad-panel">
          <div className="ad-panel__title" style={{ marginBottom: 8 }}>단체 정보</div>
          <Field k="유형">{row.type}</Field>
          <Field k="slug" mono>{row.slug}</Field>
          <Field k="지역">{row.region}</Field>
          <Field k="연락 이메일" mono>{row.contactEmail || "-"}</Field>
          <Field k="웹사이트" mono>{row.website || "-"}</Field>
          <Field k="등록일" mono>{row.createdAt}</Field>
          <Field k="대표자">{row.owner ? row.owner.name : "-"}</Field>
          <Field k="인증 상태">{badge === "인증됨" ? "인증 완료" : badge === "반려" ? "반려됨" : "인증 검토 대기"}</Field>
        </div>

        <div className="ad-panel">
          <div className="ad-panel__head"><div className="ad-panel__title">운영진</div><Badge tone="grey">{row.staff.length}</Badge></div>
          {row.staff.length ? (
            <div className="bo-roster">
              {row.staff.map((s, i) => (
                <div key={i} className="bo-rowitem">
                  <span className="bo-rowitem__av" style={{ background: s.color }}>{s.name.slice(0, 1)}</span>
                  <div className="bo-rowitem__body"><div className="bo-rowitem__t">{s.name}</div></div>
                  <span className="bo-chip" data-tone={i === 0 ? "primary" : ""}>{s.role}</span>
                </div>
              ))}
            </div>
          ) : <div className="ad-cell-muted" style={{ padding: "10px 0", fontWeight: 600 }}>등록된 운영진이 없습니다.</div>}
        </div>
      </div>

      <OrgEditModal row={row} open={editOpen} onClose={() => setEditOpen(false)} />

      <Modal open={verifyOpen} onClose={() => setVerifyOpen(false)} title="단체 인증 처리" sub={row.name + " · " + row.type}
        foot={<>
          <Btn variant="danger" icon="x" disabled={busy} onClick={reject}>반려</Btn>
          <Btn icon="badge-check" disabled={busy} onClick={approve}>인증 승인</Btn>
        </>}>
        <div className="ts-field">
          <label className="ts-field__label">반려 사유 (반려 시 필수)</label>
          <select className="ts-select" value={reason} onChange={(e) => setReason(e.target.value)}>
            <option>제출 서류 미비</option>
            <option>사업자/단체 정보 불일치</option>
            <option>활동 실적 부족</option>
            <option>중복 신청</option>
            <option>기타</option>
          </select>
        </div>
        <div style={{ display: "flex", gap: 10, padding: "12px 14px", background: "var(--primary-weak)", borderRadius: 12, alignItems: "flex-start" }}>
          <Icon name="info" size={17} color="var(--primary)" style={{ marginTop: 1, flex: "0 0 auto" }} />
          <div style={{ fontSize: 13, color: "var(--ink-soft)", lineHeight: 1.5 }}>승인 시 단체에 대회 주최·정산 권한이 부여됩니다. 정보가 미비하면 사유를 선택해 반려하세요.</div>
        </div>
      </Modal>
    </div>
  );
}

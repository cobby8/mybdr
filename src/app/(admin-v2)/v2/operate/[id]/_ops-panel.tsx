"use client";

// ============================================================
// operate/[id]/_ops-panel.tsx — 운영관리 패널 (R4-D)
//   정본 1:1 포팅: Dev/design/BDR v2.41-admin-toss/operate.jsx (OpsManage)
//   - 정본은 전부 클라 mock(WS.admins/recorders/notices/leagues)이지만,
//     실 백엔드 엔드포인트가 존재 → 실데이터 READ + 실 mutation 배선.
//   - 카드 4: 정규대회 연결(읽기·위임) / 운영 인력(운영진·기록원·심판) /
//     참가팀 공지(settings.notice 단건) / 기록 모드(bulk).
//   - mutation = adminFetch(단일변환) · 기존 엔드포인트 재사용(백엔드 0변경):
//       · 운영진  GET/POST{email,role}/DELETE[adminId]  /api/web/tournaments/[id]/admins
//       · 기록원  GET/POST{email}/DELETE{recorderId}     /api/web/tournaments/[id]/recorders
//                 자동배정 POST{overwrite}               /recorders/auto-assign
//       · 기록모드 POST{mode,scope,reason}  /api/web/admin/tournaments/[id]/recording-mode/bulk
//       · 공지     PATCH{settings:{notice}} /api/web/tournaments/[id]
//   className(ops-*/ts-*/ct-*)·마크업은 정본 verbatim.
//
//   ⚠️ 의도적 deviation(보고):
//     ① 정규대회 연결 = 읽기 전용 칩 + "정규대회 관리" 위임(연결 변경/생성은
//        series-admin 단일 진실 — 레거시 ops-panel 동일). LeagueCreateModal(정본
//        org+league 생성 체인)은 운영 워크스페이스용 백엔드 부재 → 미배선(위임).
//     ② 공지 = settings.notice 단일 string(배열 아님). 등록 시 기존 공지 교체.
//        푸시 발송 = 백엔드 미구현 → 비활성 안내(레거시 ops-panel 동일).
//     ③ 심판 = 대회별 심판 배정 모델/엔드포인트 부재 → "심판 관리자에서 배정" 위임(읽기).
//     ④ 기록모드 = scope "new_only"(대회 기본값 변경 + override 없는 매치만 적용 = 정본
//        "기본 설정, 매치별 변경 가능" 의미 보존). reason 필수 → 고정 사유 전송.
// ============================================================

import React from "react";
import { useRouter } from "next/navigation";
import { Icon, Btn, Badge, Modal, Check, useAdminShell } from "@/components/admin-v2";
import { adminFetch, AdminApiError } from "@/lib/admin-v2/data/client";

// ── 도메인 타입(서버 단일 매핑) ──────────────────────────────────────────
export type RecordMode = "flutter" | "paper" | "manual";
export type OpsData = {
  notice: string;
  recordMode: RecordMode; // 대회 기본 기록모드(settings.default_recording_mode)
  series: { id: string; name: string } | null;
};

// 정본 RECORD_MODES — id = 실 enum(flutter/paper/manual). 라벨/태그/아이콘/설명 정본 verbatim.
const RECORD_MODES: {
  id: RecordMode;
  label: string;
  tag: string;
  icon: string;
  desc: string;
}[] = [
  { id: "flutter", label: "BDR full stat", tag: "앱", icon: "smartphone", desc: "기록앱(BDR full stat)으로 실시간 상세 기록 — 득점·리바운드·어시스트 등 전 스탯." },
  { id: "paper", label: "BDR stat", tag: "웹·전자기록지", icon: "tablet", desc: "웹·전자기록지(BDR stat)로 스코어와 기본 기록을 입력합니다." },
  { id: "manual", label: "수기", tag: "종이", icon: "pen-line", desc: "종이 기록지로 수기 기록 후 결과(스코어)만 등록합니다." },
];
const modeOf = (id: RecordMode) => RECORD_MODES.find((m) => m.id === id) ?? RECORD_MODES[0];

// GET 응답(adminFetch camel 변환 후)
type AdminRow = {
  id: string | number;
  role: string;
  user: { id: string | number; nickname: string | null; email: string | null } | null;
};
type RecorderRow = {
  id: string | number;
  recorderId: string | number;
  isActive: boolean;
  recorder: { id: string | number; email: string | null; nickname: string | null } | null;
};

function errMsg(e: unknown): string {
  if (e instanceof AdminApiError) return e.message || "요청을 처리하지 못했습니다";
  return "요청을 처리하지 못했습니다";
}

// ── 운영관리 ────────────────────────────────────────────────────────────
export function OpsPanel({
  tournamentId,
  data,
}: {
  tournamentId: string;
  data: OpsData;
}) {
  const { toast } = useAdminShell();
  const router = useRouter();

  // 운영 인력 — 실 GET(운영진/기록원 풀). 카운트 + HrModal 공용.
  const [admins, setAdmins] = React.useState<AdminRow[] | null>(null);
  const [recorders, setRecorders] = React.useState<RecorderRow[] | null>(null);
  const reloadHr = React.useCallback(async () => {
    try {
      const [a, r] = await Promise.all([
        adminFetch<AdminRow[]>(`/api/web/tournaments/${tournamentId}/admins`),
        adminFetch<RecorderRow[]>(`/api/web/tournaments/${tournamentId}/recorders`),
      ]);
      setAdmins(Array.isArray(a) ? a : []);
      setRecorders(Array.isArray(r) ? r : []);
    } catch {
      setAdmins((p) => p ?? []);
      setRecorders((p) => p ?? []);
    }
  }, [tournamentId]);
  React.useEffect(() => {
    void reloadHr();
  }, [reloadHr]);

  const adminCount = admins?.length ?? 0;
  const recorderCount = recorders?.filter((r) => r.isActive).length ?? 0;

  // 모달 상태
  const [hr, setHr] = React.useState<"admins" | "recorders" | "referees" | null>(null);
  const [noticeOpen, setNoticeOpen] = React.useState(false);
  const [recordOpen, setRecordOpen] = React.useState(false);

  // 공지(단건 string) + 기록모드 — 서버 props → 로컬(낙관적). props 갱신 동기화.
  const [notice, setNotice] = React.useState(data.notice);
  const [recordMode, setRecordMode] = React.useState<RecordMode>(data.recordMode);
  React.useEffect(() => setNotice(data.notice), [data.notice]);
  React.useEffect(() => setRecordMode(data.recordMode), [data.recordMode]);

  // 공지 저장(PATCH settings.notice). 빈 문자열 = 공지 삭제.
  const saveNotice = async (text: string) => {
    const prev = notice;
    setNotice(text);
    setNoticeOpen(false);
    try {
      await adminFetch(`/api/web/tournaments/${tournamentId}`, {
        method: "PATCH",
        body: { settings: { notice: text } },
      });
      toast(text ? "공지를 등록했습니다" : "공지를 삭제했습니다");
      router.refresh();
    } catch (e) {
      setNotice(prev);
      toast(errMsg(e));
    }
  };

  // 기록모드 변경(bulk · scope new_only · reason 필수)
  const applyMode = async (mode: RecordMode) => {
    const prev = recordMode;
    setRecordMode(mode);
    setRecordOpen(false);
    try {
      await adminFetch(
        `/api/web/admin/tournaments/${tournamentId}/recording-mode/bulk`,
        {
          method: "POST",
          body: {
            mode,
            scope: "new_only",
            reason: "운영 워크스페이스에서 대회 기본 기록 모드 변경",
          },
        }
      );
      toast(`${modeOf(mode).label} 기록 모드로 설정했습니다`);
      router.refresh();
    } catch (e) {
      setRecordMode(prev);
      toast(errMsg(e));
    }
  };

  const noticeList = notice.trim() ? [notice.trim()] : [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {/* 정규대회 연결(읽기 전용 + 위임) */}
      <div className="ts-card ts-card--flat">
        <div className="ops-card-h">
          <div>
            <h3>정규대회 연결</h3>
            <p>연결하면 회차·랭킹이 누적됩니다. 연결 변경은 정규대회 관리에서 처리합니다.</p>
          </div>
          <Btn
            variant="secondary"
            size="sm"
            iconRight="arrow-up-right"
            onClick={() => router.push("/v2/ta/series")}
          >
            정규대회 관리
          </Btn>
        </div>
        <div style={{ marginTop: 10 }}>
          {data.series ? (
            <div className="ops-linked">
              <Icon name="link" size={15} color="var(--primary)" />
              <b>{data.series.name}</b>
              <span className="ct-pill" data-tone="ok">연결됨</span>
            </div>
          ) : (
            <span className="ct-pill" data-tone="mute">연결 안 됨</span>
          )}
        </div>
      </div>

      {/* 운영 인력(운영진/심판/기록원) */}
      <div className="ts-card ts-card--flat">
        <div className="ops-card-h">
          <div>
            <h3>운영 인력</h3>
            <p>운영진 · 심판 · 기록원 배정</p>
          </div>
        </div>
        <div style={{ marginTop: 4 }}>
          {(
            [
              ["운영진", "shield", admins === null ? "—" : `${adminCount}명`, "admins"],
              ["심판", "flag", "콘솔", "referees"],
              ["기록원", "pencil", recorders === null ? "—" : `${recorderCount}명`, "recorders"],
            ] as [string, string, string, "admins" | "recorders" | "referees"][]
          ).map(([l, ic, n, k]) => (
            <div key={k} className="ops-hrrow">
              <span className="ops-hrrow__ic">
                <Icon name={ic} size={16} />
              </span>
              <span className="ops-hrrow__nm">{l}</span>
              <span className="ops-hrrow__n">{n}</span>
              <Btn variant="secondary" size="sm" onClick={() => setHr(k)}>
                관리
              </Btn>
            </div>
          ))}
        </div>
      </div>

      {/* 참가팀 공지(단건) */}
      <div className="ts-card ts-card--flat">
        <div className="ops-card-h">
          <div>
            <h3>참가팀 공지</h3>
            <p>등록된 공지 {noticeList.length}건</p>
          </div>
          <Btn size="sm" icon={noticeList.length ? "pencil" : "plus"} onClick={() => setNoticeOpen(true)}>
            {noticeList.length ? "공지 수정" : "공지 등록"}
          </Btn>
        </div>
        <div style={{ marginTop: 6 }}>
          {noticeList.length ? (
            noticeList.map((text) => (
              <div key="notice" className="ops-noticerow">
                <div className="ops-noticerow__body">
                  <div className="ops-noticerow__t">{text}</div>
                </div>
                <button
                  className="ct-iconbtn"
                  title="삭제"
                  onClick={() => saveNotice("")}
                >
                  <Icon name="trash-2" size={15} />
                </button>
              </div>
            ))
          ) : (
            <div className="ct-emptybox" style={{ padding: 18 }}>
              등록된 공지가 없습니다.
            </div>
          )}
        </div>
      </div>

      {/* 기록 모드 */}
      <div className="ts-card ts-card--flat">
        <div className="ops-card-h">
          <div>
            <h3>경기 운영 · 기록 모드</h3>
            <p>
              대회 기본: <b>{modeOf(recordMode).label}</b> ({modeOf(recordMode).tag}) · 매치별 변경 가능
            </p>
          </div>
          <Btn
            variant="secondary"
            size="sm"
            icon="sliders-horizontal"
            onClick={() => setRecordOpen(true)}
          >
            설정
          </Btn>
        </div>
      </div>

      {hr && (
        <HrModal
          kind={hr}
          tournamentId={tournamentId}
          admins={admins ?? []}
          recorders={recorders ?? []}
          reload={reloadHr}
          onClose={() => setHr(null)}
          toast={toast}
        />
      )}
      {noticeOpen && (
        <NoticeModal
          initial={notice}
          onClose={() => setNoticeOpen(false)}
          onSubmit={saveNotice}
        />
      )}
      {recordOpen && (
        <RecordModeModal
          value={recordMode}
          onClose={() => setRecordOpen(false)}
          onSubmit={applyMode}
        />
      )}
    </div>
  );
}

// ── 운영 인력 모달(운영진 / 기록원 / 심판) ───────────────────────────────
function HrModal({
  kind,
  tournamentId,
  admins,
  recorders,
  reload,
  onClose,
  toast,
}: {
  kind: "admins" | "recorders" | "referees";
  tournamentId: string;
  admins: AdminRow[];
  recorders: RecorderRow[];
  reload: () => Promise<void>;
  onClose: () => void;
  toast: (m: React.ReactNode) => void;
}) {
  if (kind === "admins") {
    return (
      <Modal
        open
        onClose={onClose}
        maxWidth={600}
        title="운영진 관리"
        sub="대회 운영 권한을 가진 인원을 관리합니다."
        foot={<Btn onClick={onClose}>닫기</Btn>}
      >
        <AdminsManager
          tournamentId={tournamentId}
          admins={admins}
          reload={reload}
          toast={toast}
        />
      </Modal>
    );
  }
  if (kind === "recorders") {
    return (
      <Modal
        open
        onClose={onClose}
        maxWidth={620}
        title="기록원 배정"
        sub="기록원 풀과 경기별 배정을 관리합니다."
        foot={<Btn onClick={onClose}>닫기</Btn>}
      >
        <RecordersManager
          tournamentId={tournamentId}
          recorders={recorders}
          reload={reload}
          toast={toast}
        />
      </Modal>
    );
  }
  // 심판 — 대회별 배정 모델 부재 → 심판 관리자 위임(읽기)
  return (
    <Modal
      open
      onClose={onClose}
      maxWidth={520}
      title="심판 배정"
      sub="대회별 심판 배정은 심판 관리자에서 처리합니다."
      foot={<Btn onClick={onClose}>닫기</Btn>}
    >
      <div className="ct-emptybox" style={{ padding: 24 }}>
        <Icon name="flag" size={32} color="var(--ink-dim)" />
        <b style={{ color: "var(--ink)" }}>심판 관리자에서 배정</b>
        <span>대회별 심판 지정·등급 관리는 별도 심판 관리자 콘솔에서 제공됩니다.</span>
      </div>
    </Modal>
  );
}

// 운영진 관리(실 GET/POST/DELETE)
function AdminsManager({
  tournamentId,
  admins,
  reload,
  toast,
}: {
  tournamentId: string;
  admins: AdminRow[];
  reload: () => Promise<void>;
  toast: (m: React.ReactNode) => void;
}) {
  const [email, setEmail] = React.useState("");
  const [role, setRole] = React.useState("admin");
  const [busy, setBusy] = React.useState(false);

  const add = async () => {
    const v = email.trim();
    if (!v || busy) return;
    setBusy(true);
    try {
      // email/role = 단일 단어 키 → adminFetch camel→snake 무해(rawBody 불필요)
      await adminFetch(`/api/web/tournaments/${tournamentId}/admins`, {
        method: "POST",
        body: { email: v, role },
      });
      setEmail("");
      await reload();
      toast("운영진을 추가했습니다");
    } catch (e) {
      toast(errMsg(e));
    } finally {
      setBusy(false);
    }
  };
  const remove = async (id: string | number) => {
    try {
      await adminFetch(`/api/web/tournaments/${tournamentId}/admins/${id}`, {
        method: "DELETE",
      });
      await reload();
      toast("운영진을 제거했습니다");
    } catch (e) {
      toast(errMsg(e));
    }
  };

  return (
    <div>
      <div className="ts-card ts-card--flat" style={{ marginBottom: 14 }}>
        <h3 style={{ fontSize: 14, marginBottom: 10 }}>운영진 추가</h3>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          <input
            className="ts-input"
            style={{ flex: "1 1 200px" }}
            type="email"
            placeholder="이메일 주소"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => {
              if (!e.nativeEvent.isComposing && e.key === "Enter") add();
            }}
          />
          <select
            className="ts-select"
            style={{ width: "auto" }}
            value={role}
            onChange={(e) => setRole(e.target.value)}
          >
            <option value="admin">관리자</option>
            <option value="staff">스태프</option>
            <option value="scorer">기록원</option>
          </select>
          <Btn onClick={add} {...(email.trim() && !busy ? {} : { disabled: true })}>
            추가
          </Btn>
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {admins.length === 0 ? (
          <p style={{ fontSize: 13, color: "var(--ink-mute)" }}>
            등록된 운영진이 없습니다.
          </p>
        ) : (
          admins.map((a) => {
            const nm = a.user?.nickname || a.user?.email?.split("@")[0] || "운영진";
            return (
              <div
                key={String(a.id)}
                className="ts-card ts-card--tight"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 10,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                  <span
                    className="ts-avatar"
                    style={{ background: "var(--primary-weak)", color: "var(--primary)" }}
                  >
                    {nm.slice(0, 1).toUpperCase()}
                  </span>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontWeight: 600 }}>{nm}</p>
                    <p style={{ fontSize: 12, color: "var(--ink-mute)" }}>{a.user?.email ?? ""}</p>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <Badge tone="grey">{a.role}</Badge>
                  <button
                    style={{
                      border: 0,
                      background: "transparent",
                      color: "var(--danger)",
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                    onClick={() => remove(a.id)}
                  >
                    제거
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// 기록원 관리(실 GET/POST/DELETE/auto-assign)
function RecordersManager({
  tournamentId,
  recorders,
  reload,
  toast,
}: {
  tournamentId: string;
  recorders: RecorderRow[];
  reload: () => Promise<void>;
  toast: (m: React.ReactNode) => void;
}) {
  const [email, setEmail] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const active = recorders.filter((r) => r.isActive);

  const add = async () => {
    const v = email.trim();
    if (!v || busy) return;
    setBusy(true);
    try {
      // email = 단일 단어 키 → camel→snake 무해
      await adminFetch(`/api/web/tournaments/${tournamentId}/recorders`, {
        method: "POST",
        body: { email: v },
      });
      setEmail("");
      await reload();
      toast("기록원을 추가했습니다");
    } catch (e) {
      toast(errMsg(e));
    } finally {
      setBusy(false);
    }
  };
  const remove = async (recorderId: string | number) => {
    try {
      // ★ 라우트가 body.recorderId(camelCase)를 raw req.json 으로 읽음 → rawBody:true(변환 우회)
      await adminFetch(`/api/web/tournaments/${tournamentId}/recorders`, {
        method: "DELETE",
        body: { recorderId: String(recorderId) },
        rawBody: true,
      });
      await reload();
      toast("기록원을 제거했습니다");
    } catch (e) {
      toast(errMsg(e));
    }
  };
  const autoAssign = async () => {
    try {
      await adminFetch(`/api/web/tournaments/${tournamentId}/recorders/auto-assign`, {
        method: "POST",
        body: { overwrite: false },
      });
      toast("경기별 기록원을 자동 배정했습니다");
    } catch (e) {
      toast(errMsg(e));
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div className="ts-card ts-card--flat">
        <h3 style={{ fontSize: 14, marginBottom: 6 }}>기록원 추가</h3>
        <p style={{ fontSize: 13, color: "var(--ink-mute)", marginBottom: 10 }}>
          mybdr 회원 이메일로 기록원을 지정합니다. bdr_stat 앱으로 실시간 기록 가능.
        </p>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            className="ts-input"
            type="email"
            placeholder="이메일 주소"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => {
              if (!e.nativeEvent.isComposing && e.key === "Enter") add();
            }}
          />
          <Btn onClick={add} {...(email.trim() && !busy ? {} : { disabled: true })}>
            추가
          </Btn>
        </div>
      </div>

      <div className="ts-card ts-card--flat">
        <h3 style={{ fontSize: 14, marginBottom: 10 }}>현재 기록원 ({active.length}명)</h3>
        {active.length === 0 ? (
          <p style={{ fontSize: 13, color: "var(--ink-mute)" }}>등록된 기록원이 없습니다.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {active.map((r) => {
              const nm = r.recorder?.nickname || r.recorder?.email?.split("@")[0] || "기록원";
              return (
                <div
                  key={String(r.id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: 12,
                    background: "var(--grey-50)",
                    borderRadius: 14,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                    <span className="ts-avatar" style={{ width: 32, height: 32, fontSize: 13 }}>
                      {nm.slice(0, 1).toUpperCase()}
                    </span>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontSize: 14, fontWeight: 600 }}>{nm}</p>
                      <p style={{ fontSize: 12, color: "var(--ink-mute)" }}>{r.recorder?.email ?? ""}</p>
                    </div>
                  </div>
                  <button
                    style={{
                      border: 0,
                      background: "transparent",
                      color: "var(--danger)",
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                    onClick={() => remove(r.recorderId)}
                  >
                    제거
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="ts-card ts-card--flat">
        <div className="ops-card-h">
          <div>
            <h3>경기별 기록자 배정</h3>
            <p>풀의 기록원을 각 경기에 라운드로빈으로 자동 배정합니다.</p>
          </div>
          <Btn
            variant="secondary"
            size="sm"
            icon="wand-2"
            onClick={autoAssign}
            {...(active.length ? {} : { disabled: true })}
          >
            자동 배정
          </Btn>
        </div>
        <p style={{ fontSize: 12, color: "var(--ink-mute)", marginTop: 6 }}>
          개별 경기 기록자 변경은 경기 관리에서 가능합니다.
        </p>
      </div>
    </div>
  );
}

// ── 공지 등록 모달(단건 string) ──────────────────────────────────────────
function NoticeModal({
  initial,
  onClose,
  onSubmit,
}: {
  initial: string;
  onClose: () => void;
  onSubmit: (text: string) => void;
}) {
  const [text, setText] = React.useState(initial);
  return (
    <Modal
      open
      onClose={onClose}
      maxWidth={560}
      title="공지 등록"
      sub="참가팀에게 전달할 공지를 저장합니다. 운영 중 언제든 수정할 수 있어요."
      foot={
        <>
          <Btn variant="secondary" onClick={onClose}>
            취소
          </Btn>
          <Btn
            icon="check"
            onClick={() => onSubmit(text.trim())}
            {...(text.trim() ? {} : { disabled: true })}
          >
            공지 저장
          </Btn>
        </>
      }
    >
      <label className="ts-field">
        <span className="ts-field__label">공지 내용 *</span>
        <textarea
          className="ts-textarea"
          style={{ minHeight: 120 }}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="예: 2일차 경기장이 잠실학생체육관으로 변경되었습니다."
        />
      </label>
      {/* 푸시 발송 = 백엔드 미구현 → 비활성 안내(정본 push 토글 자리) */}
      <label className="ops-pushrow" style={{ cursor: "default" }}>
        <Check on={false} onChange={() => {}} />
        <div>
          <div className="ops-pushrow__t">참가팀 푸시 발송</div>
          <div className="ops-pushrow__s">즉시 푸시 발송은 추후 지원됩니다. 현재는 공지 저장만 됩니다.</div>
        </div>
      </label>
    </Modal>
  );
}

// ── 기록 모드 설정 모달 ──────────────────────────────────────────────────
function RecordModeModal({
  value,
  onClose,
  onSubmit,
}: {
  value: RecordMode;
  onClose: () => void;
  onSubmit: (v: RecordMode) => void;
}) {
  const [sel, setSel] = React.useState<RecordMode>(value);
  return (
    <Modal
      open
      onClose={onClose}
      maxWidth={560}
      title="기록 모드 설정"
      sub="대회 기본 기록 방식을 선택합니다. 매치별로 따로 변경할 수 있습니다."
      foot={
        <>
          <Btn variant="secondary" onClick={onClose}>
            취소
          </Btn>
          <Btn icon="check" onClick={() => onSubmit(sel)}>
            적용
          </Btn>
        </>
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {RECORD_MODES.map((m) => (
          <button
            key={m.id}
            type="button"
            className="ops-modeopt"
            data-on={sel === m.id ? "true" : "false"}
            onClick={() => setSel(m.id)}
          >
            <span className="ops-modeopt__ic">
              <Icon name={m.icon} size={18} />
            </span>
            <span className="ops-modeopt__body">
              <span className="ops-modeopt__t">
                {m.label}
                <span className="ops-modeopt__tag">{m.tag}</span>
              </span>
              <span className="ops-modeopt__d">{m.desc}</span>
            </span>
            <span className="ops-modeopt__radio" data-on={sel === m.id ? "true" : "false"}>
              {sel === m.id && <Icon name="check" size={14} />}
            </span>
          </button>
        ))}
      </div>
    </Modal>
  );
}

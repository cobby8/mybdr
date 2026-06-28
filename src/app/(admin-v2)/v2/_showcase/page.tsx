"use client";

// ============================================================
// _showcase/page.tsx — admin-v2 디자인시스템 쇼케이스 (R1, 보존)
//   R2-A 에서 /v2 가 백오피스 홈으로 전환됨 → 쇼케이스는 이 private 폴더로 이동.
//   ⚠ "_" prefix 폴더 = Next.js private(라우트 미생성). 참조용 보존 코드.
// ============================================================

import React from "react";
import {
  PageHead,
  KpiGrid,
  DataTable,
  Btn,
  Badge,
  Toggle,
  Check,
  StepDots,
  Empty,
  Modal,
  Icon,
  SchemaList,
  AdBarPanel,
  AdListPanel,
  AdSettings,
  type Schema,
  type KpiItem,
  type DataCol,
  type DataRow,
} from "@/components/admin-v2";

const KPIS: KpiItem[] = [
  { label: "진행 대회", value: "12", icon: "trophy", tone: "primary", delta: 8 },
  { label: "참가팀", value: "318", icon: "users", tone: "ok", delta: 12 },
  { label: "대기 승인", value: "7", icon: "clock", tone: "warn", delta: -3 },
  { label: "미납", value: "4", icon: "credit-card", tone: "danger" },
];

const TABLE_COLS: DataCol[] = [
  { key: "name", label: "대회", w: "2fr" },
  { key: "div", label: "종별" },
  { key: "teams", label: "팀", align: "right" },
  { key: "status", label: "상태" },
];
const TABLE_ROWS: DataRow[] = [
  { id: 1, name: "강남구협회장배", div: "일반부", teams: 36, status: "진행중" },
  { id: 2, name: "유스챌린지 2차", div: "U12", teams: 10, status: "모집중" },
  { id: 3, name: "스타터스리그 8차", div: "일반부", teams: 6, status: "예선" },
];

const TEAM_SCHEMA: Schema = {
  head: "참가팀",
  sub: "정본 SchemaList 1:1 — 행 클릭 시 상세 드로어",
  addLabel: "팀 추가",
  cols: [
    { key: "name", label: "팀", type: "avatar", w: "2fr" },
    { key: "div", label: "종별", type: "muted" },
    { key: "pay", label: "납부", type: "badge" },
    { key: "stcol", label: "상태", type: "status" },
    { key: "token", label: "코드", type: "mono" },
    { key: "act", label: "", type: "actions", w: "92px", align: "right" },
  ],
  rows: [
    { id: 1, name: "제이크루", sub: "서울 강남", color: "#3182F6", div: "일반부", badge: "완납", tone: "ok", st: "승인", sttone: "ok", token: "A1B2" },
    { id: 2, name: "펜타곤", sub: "서울 송파", color: "#15B86A", div: "일반부", badge: "미납", tone: "warn", st: "대기", sttone: "warn", token: "C3D4" },
    { id: 3, name: "썬더스", sub: "서울 마포", color: "#6D5AE6", div: "U18", badge: "완납", tone: "ok", st: "승인", sttone: "ok", token: "E5F6" },
  ],
};

const BAR_DATA = [
  { m: "1월", v: 24 },
  { m: "2월", v: 38 },
  { m: "3월", v: 31 },
  { m: "4월", v: 52, soft: true },
];
const LIST_ITEMS = [
  { id: "a", icon: "user-plus", t: "신규 가입 승인 7건", s: "오늘 09:12", time: "방금", tone: "primary" },
  { id: "b", icon: "credit-card", t: "참가비 입금 확인 대기", s: "어제 18:40", time: "1일", tone: "warn" },
  { id: "c", icon: "shield", t: "운영자 권한 요청", s: "어제 11:02", time: "1일", tone: "ok" },
];

const SETTINGS_GROUPS = [
  {
    group: "알림",
    items: [
      { k: "n1", type: "toggle" as const, label: "신규 신청 알림", desc: "참가 신청 시 이메일 발송", on: true },
      { k: "n2", type: "toggle" as const, label: "입금 알림", desc: "참가비 입금 시 알림", on: false },
      { k: "v1", type: "value" as const, label: "보존 기간", desc: "로그 자동 삭제 주기", value: "180일" },
    ],
  },
];

export default function AdminV2Showcase() {
  const [tog, setTog] = React.useState(true);
  const [chk, setChk] = React.useState(false);
  const [modal, setModal] = React.useState(false);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
      <section>
        <PageHead
          eyebrow="ADMIN-V2 · R1 토대"
          title="디자인시스템 쇼케이스"
          sub="정본(toss.css·admin-pages.css·kit·shell·blocks)을 1:1 포팅한 토대. 시안 screenshots/ 와 육안 대조."
          actions={
            <>
              <Btn variant="secondary" icon="download" size="sm">
                내보내기
              </Btn>
              <Btn icon="plus" onClick={() => setModal(true)}>
                모달 열기
              </Btn>
            </>
          }
        />
        <KpiGrid items={KPIS} />
      </section>

      <section className="ts-card">
        <div className="ts-ph__title" style={{ fontSize: 20, marginBottom: 18 }}>
          원시 컴포넌트 (kit)
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 18 }}>
          <Btn>Primary</Btn>
          <Btn variant="secondary">Secondary</Btn>
          <Btn variant="ghost">Ghost</Btn>
          <Btn variant="danger" icon="trash-2">
            Danger
          </Btn>
          <Btn size="sm" icon="plus">
            Small
          </Btn>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 18 }}>
          <Badge tone="primary">primary</Badge>
          <Badge tone="ok" icon="check">
            ok
          </Badge>
          <Badge tone="warn">warn</Badge>
          <Badge tone="danger">danger</Badge>
          <Badge tone="grey">grey</Badge>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 24, marginBottom: 18 }}>
          <Toggle on={tog} onChange={setTog} />
          <Check on={chk} onChange={setChk} />
          <span className="ts-chip" data-active="true">
            <Icon name="check" size={14} />칩
          </span>
          <span className="ts-chip">비활성 칩</span>
        </div>
        <div style={{ maxWidth: 420 }}>
          <StepDots step={1} total={4} />
        </div>
      </section>

      <section>
        <div className="ts-ph__title" style={{ fontSize: 20, marginBottom: 14 }}>
          기본 테이블 (DataTable)
        </div>
        <DataTable
          cols={TABLE_COLS}
          rows={TABLE_ROWS}
          render={(r, k) =>
            k === "status" ? (
              <Badge tone="primary">{String(r[k])}</Badge>
            ) : (
              String(r[k] ?? "")
            )
          }
        />
      </section>

      <section>
        <SchemaList schema={TEAM_SCHEMA} eyebrow="BLOCKS" />
      </section>

      <section className="ad-cols">
        <AdBarPanel title="월별 참가 추이" badge="2026" data={BAR_DATA} />
        <AdListPanel title="처리 대기" badge="3" items={LIST_ITEMS} />
      </section>

      <section>
        <AdSettings
          eyebrow="BLOCKS"
          title="알림 설정"
          sub="AdSettings — 토글/값 그룹"
          groups={SETTINGS_GROUPS}
        />
      </section>

      <section>
        <div className="ts-card">
          <Empty
            icon="inbox"
            title="표시할 항목이 없습니다"
            desc="정본 Empty 컴포넌트 — 빈 목록 안내"
          >
            <Btn size="sm" icon="plus">
              새로 만들기
            </Btn>
          </Empty>
        </div>
      </section>

      <Modal
        open={modal}
        onClose={() => setModal(false)}
        title="정본 모달"
        sub="ts-modal — ESC/오버레이 클릭으로 닫힘"
        foot={
          <>
            <Btn variant="secondary" block onClick={() => setModal(false)}>
              취소
            </Btn>
            <Btn block icon="check" onClick={() => setModal(false)}>
              확인
            </Btn>
          </>
        }
      >
        <p style={{ margin: 0, color: "var(--ink-soft)", lineHeight: 1.6 }}>
          이 모달은 정본 toss-kit Modal 을 1:1 포팅한 것입니다. 헤더/본문/푸터
          구조와 애니메이션(tsrise)이 시안과 동일합니다.
        </p>
      </Modal>
    </div>
  );
}

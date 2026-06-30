"use client";

// =====================================================================
// _audit-table.tsx — 대회 감사 로그 테이블 (클라). 레거시 audit-log/page.tsx 표시부 1:1.
//   서버(page.tsx)가 admin_logs READ + 유저 매핑 + description enrich 까지 끝낸
//   직렬화 행(AuditRow[])만 받아 admin-v2 키트(PageHead/DataTable/Badge)로 렌더한다.
//   ⚠ 상호작용 0(읽기 전용) — mutation/추가 fetch 없음. 디자인 토큰/클래스만 admin-v2.
//   ⚠ DataTable 의 render 는 함수 prop(서버→클라 전달 불가)이라 이 클라 컴포넌트에서 정의.
// =====================================================================

import {
  PageHead,
  DataTable,
  Badge,
  Btn,
  type DataCol,
  type DataRow,
  type BadgeTone,
} from "@/components/admin-v2";

// ── 직렬화 행 타입(page.tsx 서버 매핑과 1:1) ──
export interface AuditRow {
  id: string;
  time: string; // KST 로 이미 포맷된 문자열
  action: string;
  adminName: string; // nickname ?? email ?? "-"
  adminRealName: string | null; // name 이 nickname 과 다를 때만
  adminId: string;
  description: string; // enrich 완료된 문자열
  severity: string; // 원본 severity(info/warning/error/critical)
}

// severity → ts-badge 톤 매핑(admin-v2 톤: primary/ok/warn/danger/grey).
// 레거시 info/warning/error/critical 를 가용 톤으로 대응(info=중립 grey).
const SEVERITY_TONE: Record<string, BadgeTone> = {
  info: "grey",
  warning: "warn",
  error: "danger",
  critical: "danger",
};

// ── 표 컬럼(admin-v2 DataTable·grid) ──
const COLS: DataCol[] = [
  { key: "time", label: "시각", w: "minmax(0,150px)" },
  { key: "action", label: "액션", w: "minmax(0,1fr)" },
  { key: "admin", label: "관리자", w: "minmax(0,1fr)" },
  { key: "desc", label: "설명", w: "minmax(0,2.2fr)" },
  { key: "severity", label: "레벨", w: "92px", align: "center" },
];

export function AuditTable({
  tournamentName,
  rows,
}: {
  tournamentName: string;
  rows: AuditRow[];
}) {
  // 표 셀 렌더 — DataRow 를 AuditRow 로 복원해 표시
  const renderCell = (row: DataRow, key: string) => {
    const l = row as unknown as AuditRow;
    switch (key) {
      case "time":
        return (
          <span style={{ fontSize: 12, color: "var(--ink-mute)", whiteSpace: "nowrap" }}>
            {l.time}
          </span>
        );
      case "action":
        return (
          <span style={{ fontWeight: 700, color: "var(--ink)" }}>{l.action}</span>
        );
      case "admin":
        return (
          <div style={{ minWidth: 0 }}>
            <div style={{ color: "var(--ink-soft)" }}>{l.adminName}</div>
            {l.adminRealName && (
              <div style={{ fontSize: 11, color: "var(--ink-mute)" }}>{l.adminRealName}</div>
            )}
            <div style={{ fontSize: 11, color: "var(--ink-dim)" }}>userId {l.adminId}</div>
          </div>
        );
      case "desc":
        return (
          <span style={{ fontSize: 12, color: "var(--ink-soft)", wordBreak: "break-word" }}>
            {l.description}
          </span>
        );
      case "severity":
        return (
          <Badge tone={SEVERITY_TONE[l.severity] ?? "grey"}>
            {(l.severity || "info").toUpperCase()}
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <div>
      <PageHead
        eyebrow={`대회 관리자 · ${tournamentName}`}
        title="감사 로그"
        sub={`${tournamentName} · 최근 ${rows.length}건`}
        actions={
          <Btn
            variant="secondary"
            size="sm"
            icon="arrow-left"
            onClick={() => {
              window.location.href = "/v2/ta/tournaments";
            }}
          >
            대회 관리
          </Btn>
        }
      />

      <DataTable
        cols={COLS}
        rows={rows as unknown as DataRow[]}
        render={renderCell}
        empty="감사 로그가 없습니다."
      />

      <p style={{ marginTop: 16, fontSize: 12, color: "var(--ink-mute)" }}>
        ※ admin_logs.resource_id 가 BigInt 라 UUID Tournament 매칭 불가 — description 필드 검색
        fallback. 향후 schema 확장 시 resource_uuid 컬럼 신설 권장.
      </p>
    </div>
  );
}

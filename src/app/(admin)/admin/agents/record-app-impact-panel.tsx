"use client";

import Link from "next/link";
import React from "react";
import { Badge, Btn, Icon } from "@/components/admin-toss";
import { PageHead, Panel, StatRow } from "@/components/admin/console-kit";

type ImpactLevel = "none" | "needs_review" | "risk";
type ContractChange =
  | "none"
  | "field_addition"
  | "field_removal"
  | "field_rename"
  | "semantic_change"
  | "auth_change";
type Compatibility = "maintained" | "may_break" | "unknown";

type ImpactResponse = {
  record_app: {
    repository: string;
    branch: string;
    checked_commit: string;
    app_version: string;
  };
  impact: ImpactLevel;
  impact_label: ImpactLevel;
  api_contract_changes: ContractChange[];
  backward_compatibility: Compatibility;
  user_decision_required: boolean;
  reasons: string[];
  record_app_check_requests: string[];
  recommended_record_app_files: string[];
  recommended_record_app_tests: string[];
  server_tests: string[];
};

const API = "/api/web/admin/agents/record-app-impact";

const IMPACT_LABEL: Record<ImpactLevel, string> = {
  none: "영향 없음",
  needs_review: "확인 필요",
  risk: "위험",
};

const IMPACT_TONE: Record<ImpactLevel, "grey" | "warn" | "danger"> = {
  none: "grey",
  needs_review: "warn",
  risk: "danger",
};

const CONTRACT_LABEL: Record<ContractChange, string> = {
  none: "변경 없음",
  field_addition: "필드 추가",
  field_removal: "필드 삭제",
  field_rename: "필드 이름 변경",
  semantic_change: "의미 변경",
  auth_change: "인증 변경",
};

const COMPATIBILITY_LABEL: Record<Compatibility, string> = {
  maintained: "유지",
  may_break: "깨질 수 있음",
  unknown: "확인 필요",
};

function linesToList(value: string) {
  return value
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

async function postImpact(payload: unknown) {
  const response = await fetch(API, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  const json = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message =
      typeof json?.error === "string"
        ? json.error
        : "기록앱 영향 판정에 실패했습니다.";
    throw new Error(message);
  }
  return json as ImpactResponse;
}

function ResultList({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <div className="mb-2 text-sm font-semibold">{title}</div>
      {items.length ? (
        <ul className="space-y-2 text-sm" style={{ color: "var(--color-text-muted)" }}>
          {items.map((item) => (
            <li key={item} className="flex gap-2">
              <Icon name="check-circle-2" size={15} style={{ color: "var(--color-accent)" }} />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      ) : (
        <div className="text-sm" style={{ color: "var(--color-text-muted)" }}>
          없음
        </div>
      )}
    </div>
  );
}

function TextAreaField({
  label,
  value,
  onChange,
  rows = 3,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (next: string) => void;
  rows?: number;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-semibold">{label}</span>
      <textarea
        className="ts-input"
        rows={rows}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        style={{ minHeight: rows * 38, resize: "vertical" }}
      />
    </label>
  );
}

export function RecordAppImpactPanel() {
  const [summary, setSummary] = React.useState("");
  const [diffSummary, setDiffSummary] = React.useState("");
  const [changedFiles, setChangedFiles] = React.useState("");
  const [apiPaths, setApiPaths] = React.useState("");
  const [dbModels, setDbModels] = React.useState("");
  const [addedFields, setAddedFields] = React.useState("");
  const [removedFields, setRemovedFields] = React.useState("");
  const [renamedFields, setRenamedFields] = React.useState("");
  const [semanticChanges, setSemanticChanges] = React.useState("");
  const [result, setResult] = React.useState<ImpactResponse | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();

  const hasInput =
    summary.trim() ||
    diffSummary.trim() ||
    changedFiles.trim() ||
    apiPaths.trim() ||
    dbModels.trim() ||
    addedFields.trim() ||
    removedFields.trim() ||
    renamedFields.trim() ||
    semanticChanges.trim();

  function analyze() {
    setError(null);
    startTransition(async () => {
      try {
        // API는 snake/camel 둘 다 받지만, UI에서는 서버 응답 규칙에 맞춰 snake로 보낸다.
        const payload = {
          summary: summary.trim(),
          diff_summary: diffSummary.trim(),
          changed_files: linesToList(changedFiles),
          api_paths: linesToList(apiPaths),
          db_models: linesToList(dbModels),
          response_fields: {
            added: linesToList(addedFields),
            removed: linesToList(removedFields),
            renamed: linesToList(renamedFields),
            semantic_changes: linesToList(semanticChanges),
          },
        };
        setResult(await postImpact(payload));
      } catch (caught) {
        setResult(null);
        setError(caught instanceof Error ? caught.message : "요청에 실패했습니다.");
      }
    });
  }

  function loadRiskSample() {
    setSummary("경기 기록 이벤트 응답 필드 정리");
    setDiffSummary("legacy_score 필드를 제거하고 이벤트 응답 구조를 정리");
    setChangedFiles("src/app/api/v1/matches/[id]/events/route.ts");
    setApiPaths("/api/v1/matches/:id/events");
    setDbModels("MatchEvent");
    setAddedFields("");
    setRemovedFields("legacy_score");
    setRenamedFields("");
    setSemanticChanges("");
    setResult(null);
    setError(null);
  }

  function clearForm() {
    setSummary("");
    setDiffSummary("");
    setChangedFiles("");
    setApiPaths("");
    setDbModels("");
    setAddedFields("");
    setRemovedFields("");
    setRenamedFields("");
    setSemanticChanges("");
    setResult(null);
    setError(null);
  }

  return (
    <>
      <PageHead
        icon="bot"
        eyebrow="ADMIN / 에이전트"
        title="운영 에이전트"
        sub="서버 변경이 bdr_stat_v3 기록앱 계약에 미치는 영향을 점검합니다."
        actions={
          <Link href="/admin/logs?kind=record-app" className="btn">
            <Icon name="list-checks" size={16} />
            기록앱 로그
          </Link>
        }
      />

      <StatRow
        items={[
          {
            icon: "smartphone",
            label: "기록앱",
            value: "bdr_stat_v3",
            delta: "0.1.10+12",
            trend: "flat",
          },
          {
            icon: "git-commit-horizontal",
            label: "기준 커밋",
            value: "7676a1a",
            delta: "main",
            trend: "flat",
          },
          {
            icon: result?.impact === "risk" ? "triangle-alert" : "shield-check",
            label: "최근 판정",
            value: result ? IMPACT_LABEL[result.impact] : "대기",
            delta: result ? COMPATIBILITY_LABEL[result.backward_compatibility] : "미실행",
            trend: result?.impact === "risk" ? "down" : result?.impact === "needs_review" ? "flat" : "up",
          },
        ]}
      />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
        <Panel
          title="기록앱 영향 판정"
          sub="작업 요약과 변경 계약을 입력한 뒤 판정을 실행합니다."
          right={
            <div className="flex flex-wrap gap-2">
              <Btn variant="secondary" size="sm" icon="file-warning" onClick={loadRiskSample}>
                위험 예시
              </Btn>
              <Btn variant="ghost" size="sm" icon="rotate-ccw" onClick={clearForm} disabled={!hasInput && !result}>
                초기화
              </Btn>
            </div>
          }
        >
          <div className="grid gap-4">
            <TextAreaField
              label="작업 요약"
              value={summary}
              onChange={setSummary}
              rows={2}
              placeholder="경기 기록 이벤트 응답에 필드 추가"
            />
            <TextAreaField
              label="diff 요약"
              value={diffSummary}
              onChange={setDiffSummary}
              rows={2}
              placeholder="응답 필드 추가, 기존 필드 유지"
            />
            <div className="grid gap-4 lg:grid-cols-2">
              <TextAreaField
                label="변경 파일"
                value={changedFiles}
                onChange={setChangedFiles}
                placeholder="src/app/api/v1/..."
              />
              <TextAreaField
                label="API 경로"
                value={apiPaths}
                onChange={setApiPaths}
                placeholder="/api/v1/matches/:id/events"
              />
              <TextAreaField
                label="DB 모델"
                value={dbModels}
                onChange={setDbModels}
                placeholder="MatchEvent"
              />
              <TextAreaField
                label="추가 필드"
                value={addedFields}
                onChange={setAddedFields}
                placeholder="server_time"
              />
              <TextAreaField
                label="삭제 필드"
                value={removedFields}
                onChange={setRemovedFields}
                placeholder="legacy_score"
              />
              <TextAreaField
                label="이름 변경 필드"
                value={renamedFields}
                onChange={setRenamedFields}
                placeholder="old_name -> new_name"
              />
            </div>
            <TextAreaField
              label="의미 변경 필드"
              value={semanticChanges}
              onChange={setSemanticChanges}
              rows={2}
              placeholder="game_time"
            />
            {error && (
              <div
                className="rounded border px-3 py-2 text-sm"
                style={{
                  borderColor: "var(--color-error)",
                  color: "var(--color-error)",
                }}
              >
                {error}
              </div>
            )}
            <div className="flex justify-end">
              <Btn variant="primary" icon="sparkles" onClick={analyze} disabled={pending || !hasInput}>
                {pending ? "판정 중" : "영향 판정"}
              </Btn>
            </div>
          </div>
        </Panel>

        <Panel title="판정 결과" sub="record-app-liaison 보고 형식으로 정리됩니다.">
          {result ? (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone={IMPACT_TONE[result.impact]} icon={result.impact === "risk" ? "triangle-alert" : "shield"}>
                  {IMPACT_LABEL[result.impact]}
                </Badge>
                <Badge tone={result.user_decision_required ? "danger" : "grey"}>
                  사용자 결정 {result.user_decision_required ? "필요" : "불필요"}
                </Badge>
                <Link href="/admin/logs?kind=record-app" className="btn btn--sm">
                  <Icon name="list-checks" size={15} />
                  로그 확인
                </Link>
              </div>

              <div className="grid gap-3 text-sm">
                <div className="flex justify-between gap-3">
                  <span style={{ color: "var(--color-text-muted)" }}>하위 호환성</span>
                  <b>{COMPATIBILITY_LABEL[result.backward_compatibility]}</b>
                </div>
                <div className="flex justify-between gap-3">
                  <span style={{ color: "var(--color-text-muted)" }}>API 계약</span>
                  <b>{result.api_contract_changes.map((item) => CONTRACT_LABEL[item]).join(", ")}</b>
                </div>
                <div className="flex justify-between gap-3">
                  <span style={{ color: "var(--color-text-muted)" }}>기준 repo</span>
                  <b>{result.record_app.checked_commit}</b>
                </div>
              </div>

              <ResultList title="판정 이유" items={result.reasons} />
              <ResultList title="기록앱 확인 요청" items={result.record_app_check_requests} />
              <ResultList title="서버 검증" items={result.server_tests} />
              <ResultList title="기록앱 테스트 후보" items={result.recommended_record_app_tests} />
            </div>
          ) : (
            <div className="ts-empty">
              <div className="ts-empty__icon">
                <Icon name="clipboard-check" size={30} />
              </div>
              <div className="ts-empty__title">아직 판정 결과가 없습니다.</div>
              <div className="ts-empty__desc">입력값을 채우고 영향 판정을 실행하세요.</div>
            </div>
          )}
        </Panel>
      </div>
    </>
  );
}

"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  canPublish,
  type ChecklistItem,
  type ChecklistStatus,
  type SetupProgress,
} from "@/lib/tournaments/setup-status";
import { Icon } from "@/components/admin-toss";
import { SetupChecklist } from "./SetupChecklist";

type WorkspaceStatus = ChecklistStatus;

type WorkspaceAction = {
  label: string;
  href: string;
  icon: string;
};

type WorkspaceFact = {
  label: string;
  value: string;
  tone?: "ok" | "warn" | "info" | "mute";
};

type WorkspaceSection = {
  id: string;
  title: string;
  subtitle: string;
  status: WorkspaceStatus;
  summary: string;
  icon: string;
  actions: WorkspaceAction[];
  lockedReason?: string;
  itemKeys: string[];
  facts?: WorkspaceFact[];
};

type Props = {
  progress: SetupProgress;
  tournamentId: string;
  teamCount: number;
  maxTeams: number | null;
  matchCount: number;
  isSitePublished: boolean;
  hasSite: boolean;
  siteSubdomain?: string | null;
  isCompleted: boolean;
  readyFacts: WorkspaceFact[];
};

const STATUS_LABEL: Record<WorkspaceStatus, string> = {
  complete: "완료",
  in_progress: "진행 중",
  empty: "미설정",
  locked: "잠금",
};

const STATUS_TONE: Record<WorkspaceStatus, "ok" | "warn" | "mute"> = {
  complete: "ok",
  in_progress: "warn",
  empty: "mute",
  locked: "mute",
};

const READABLE_ITEM_TITLE: Record<string, string> = {
  basic: "기본 정보",
  series: "시리즈 연결",
  registration: "신청 정책",
  site: "사이트 설정",
  divisions: "종별/운영 방식",
  recording: "기록 설정",
  bracket: "대진표 생성",
};

function getItem(progress: SetupProgress, key: string): ChecklistItem | undefined {
  return progress.items.find((item) => item.key === key);
}

function combineStatus(items: Array<ChecklistItem | undefined>): WorkspaceStatus {
  const existing = items.filter(Boolean) as ChecklistItem[];
  if (existing.length === 0) return "empty";
  if (existing.some((item) => item.status === "locked")) return "locked";
  if (existing.every((item) => item.status === "complete")) return "complete";
  if (existing.some((item) => item.status === "complete" || item.status === "in_progress")) {
    return "in_progress";
  }
  return "empty";
}

function countComplete(items: Array<ChecklistItem | undefined>): string {
  const existing = items.filter(Boolean) as ChecklistItem[];
  const complete = existing.filter((item) => item.status === "complete").length;
  return `필수 ${existing.length}개 중 ${complete}개 완료`;
}

function firstLockedReason(items: Array<ChecklistItem | undefined>): string | undefined {
  return items.find((item) => item?.status === "locked" && item.lockedReason)?.lockedReason;
}

function statusIcon(status: WorkspaceStatus): string {
  if (status === "complete") return "circle-check";
  if (status === "in_progress") return "clock";
  if (status === "locked") return "lock";
  return "circle";
}

export function TournamentWorkspace({
  progress,
  tournamentId,
  teamCount,
  maxTeams,
  matchCount,
  isSitePublished,
  hasSite,
  siteSubdomain,
  isCompleted,
  readyFacts,
}: Props) {
  const base = `/tournament-admin/tournaments/${tournamentId}`;
  const gate = canPublish(progress);
  const percent = Math.round((progress.completed / progress.total) * 100);
  const nextRequiredItem = progress.items.find(
    (item) => item.required && item.status !== "complete" && item.status !== "locked"
  ) ?? progress.items.find((item) => item.required && item.status !== "complete");

  const sections = useMemo<WorkspaceSection[]>(() => {
    const basic = getItem(progress, "basic");
    const series = getItem(progress, "series");
    const registration = getItem(progress, "registration");
    const site = getItem(progress, "site");
    const divisions = getItem(progress, "divisions");
    const recording = getItem(progress, "recording");
    const bracket = getItem(progress, "bracket");
    const publicItems = [basic, registration, site];
    const divisionItems = [divisions];
    const matchItems = [recording, bracket];

    return [
      {
        id: "summary",
        title: "요약",
        subtitle: "상태, 공개 가능 여부, 다음 작업",
        status: gate.ok ? "complete" : "in_progress",
        summary: gate.ok ? "공개 가능 상태입니다" : `필수 ${gate.missing.length}개 남음`,
        icon: "layout-dashboard",
        itemKeys: [],
        actions: [
          { label: "사이트 설정", href: `${base}/site`, icon: "globe" },
          { label: "경기 관리", href: `${base}/matches`, icon: "list-checks" },
        ],
      },
      {
        id: "ready",
        title: "공개 준비",
        subtitle: "기본 정보, 시리즈, 신청 정책, 사이트",
        status: combineStatus(publicItems),
        summary: countComplete(publicItems),
        icon: "globe-2",
        itemKeys: ["basic", "registration", "site"],
        facts: readyFacts,
        lockedReason: firstLockedReason(publicItems),
        actions: [
          { label: "기본 정보 수정", href: `${base}/wizard`, icon: "pencil" },
          { label: "신청 정책", href: `${base}/wizard?step=2`, icon: "settings" },
          { label: "사이트 설정", href: `${base}/site`, icon: "external-link" },
        ],
      },
      {
        id: "teams",
        title: "참가팀",
        subtitle: "신청 승인, 입금, 로스터, 시드",
        status: teamCount > 0 ? "in_progress" : "empty",
        summary: maxTeams ? `${teamCount} / ${maxTeams}팀 등록됨` : `${teamCount}팀 등록됨`,
        icon: "users",
        itemKeys: [],
        actions: [{ label: "참가팀 관리", href: `${base}/teams`, icon: "users" }],
      },
      {
        id: "divisions",
        title: "종별/운영 방식",
        subtitle: "종별 정의, format, group settings",
        status: combineStatus(divisionItems),
        summary: divisions?.summary ?? "종별 설정 상태를 확인하세요",
        icon: "layout-grid",
        itemKeys: ["divisions"],
        lockedReason: divisions?.lockedReason,
        actions: [{ label: "종별 설정", href: `${base}/divisions`, icon: "layout-grid" }],
      },
      {
        id: "matches",
        title: "경기/기록",
        subtitle: "기록 모드, 경기 목록, 스코어 입력",
        status: combineStatus(matchItems),
        summary: `${matchCount}경기 생성됨 · ${recording?.summary ?? "기록 설정 확인"}`,
        icon: "clipboard-list",
        itemKeys: ["recording", "bracket"],
        lockedReason: firstLockedReason(matchItems),
        actions: [{ label: "경기/기록 관리", href: `${base}/matches`, icon: "clipboard-list" }],
      },
      {
        id: "bracket",
        title: "대진/순위전",
        subtitle: "bracket, playoffs, 결승/순위전",
        status: bracket?.status ?? "empty",
        summary: bracket?.summary ?? "대진표 상태를 확인하세요",
        icon: "git-branch",
        itemKeys: ["bracket"],
        lockedReason: bracket?.lockedReason,
        actions: [
          { label: "대진표", href: `${base}/bracket`, icon: "git-branch" },
          { label: "순위전", href: `${base}/playoffs`, icon: "trophy" },
        ],
      },
      {
        id: "staff",
        title: "운영 인력/종료",
        subtitle: "관리자, 기록원, 종료 처리",
        status: isCompleted ? "complete" : "in_progress",
        summary: isCompleted ? "종료 후 정리 단계입니다" : "운영 권한과 종료 처리를 준비하세요",
        icon: "shield-user",
        itemKeys: [],
        actions: [
          { label: "관리자", href: `${base}/admins`, icon: "shield-user" },
          { label: "기록원", href: `${base}/recorders`, icon: "file-pen" },
          { label: "종료 처리", href: `${base}/completed`, icon: "trophy" },
        ],
      },
    ];
  }, [
    base,
    gate.missing.length,
    gate.ok,
    isCompleted,
    matchCount,
    maxTeams,
    progress,
    readyFacts,
    teamCount,
  ]);

  const [activeId, setActiveId] = useState("summary");

  useEffect(() => {
    const currentHash = window.location.hash.replace("#", "");
    if (sections.some((section) => section.id === currentHash)) {
      setActiveId(currentHash);
    }
  }, [sections]);

  const selectSection = (id: string) => {
    setActiveId(id);
    window.history.replaceState(null, "", `#${id}`);
    document.getElementById(`workspace-${id}`)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  return (
    <section className="space-y-4">
      <div
        className="rounded-[var(--radius-card)] border p-4 sm:p-5"
        style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}
      >
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
          <div>
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className="admin-stat-pill" data-tone={gate.ok ? "ok" : "warn"}>
                {gate.ok ? "공개 가능" : `필수 ${gate.missing.length}개 남음`}
              </span>
              <span className="admin-stat-pill" data-tone={isSitePublished ? "ok" : "mute"}>
                {isSitePublished ? "사이트 공개 중" : hasSite ? "사이트 비공개" : "사이트 미생성"}
              </span>
            </div>
            <h2 className="text-lg font-bold text-[var(--color-text-primary)]">
              운영 워크스페이스
            </h2>
            <p className="mt-1 text-sm text-[var(--color-text-muted)]">
              공개 준비부터 경기 운영, 기록원 지정, 종료 처리까지 한 화면에서 이동합니다.
            </p>
          </div>
          <div className="rounded-[4px] border p-3" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-elevated)" }}>
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="font-semibold text-[var(--color-text-primary)]">진행률</span>
              <span className="font-semibold text-[var(--color-text-primary)]">
                {progress.completed} / {progress.total} ({percent}%)
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-[4px]" style={{ backgroundColor: "var(--color-card)" }}>
              <div
                className="h-full transition-all duration-300"
                style={{ width: `${percent}%`, backgroundColor: "var(--color-accent)" }}
              />
            </div>
            <p className="mt-2 text-xs text-[var(--color-text-muted)]">
              다음 추천 작업:{" "}
              <span className="font-semibold text-[var(--color-text-primary)]">
                {nextRequiredItem ? READABLE_ITEM_TITLE[nextRequiredItem.key] ?? nextRequiredItem.title : "후속 운영 확인"}
              </span>
            </p>
          </div>
        </div>
      </div>

      <div className="-mx-1 overflow-x-auto px-1">
        <div className="flex min-w-max gap-2 pb-1">
          {sections.map((section) => (
            <button
              key={section.id}
              type="button"
              onClick={() => selectSection(section.id)}
              className="inline-flex min-h-[44px] items-center gap-1.5 rounded-[4px] border px-3 py-2 text-sm font-semibold transition-colors"
              style={{
                borderColor:
                  activeId === section.id ? "var(--color-primary)" : "var(--color-border)",
                backgroundColor:
                  activeId === section.id ? "var(--color-primary)" : "var(--color-card)",
                color:
                  activeId === section.id ? "var(--color-on-primary)" : "var(--color-text-primary)",
              }}
            >
              <Icon name={section.icon} size={16} />
              {section.title}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        {sections.map((section) => (
          <WorkspaceSectionCard
            key={section.id}
            section={section}
            progress={progress}
            active={activeId === section.id}
            isSitePublished={isSitePublished}
            siteSubdomain={siteSubdomain}
          />
        ))}
      </div>

      <details
        className="rounded-[var(--radius-card)] border p-4"
        style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}
      >
        <summary className="cursor-pointer text-sm font-bold text-[var(--color-text-primary)]">
          상세 체크리스트와 공개 게이트
        </summary>
        <div className="mt-4">
          <SetupChecklist
            progress={progress}
            tournamentId={tournamentId}
            isSitePublished={isSitePublished}
            hasSite={hasSite}
          />
        </div>
      </details>
    </section>
  );
}

function WorkspaceSectionCard({
  section,
  progress,
  active,
  isSitePublished,
  siteSubdomain,
}: {
  section: WorkspaceSection;
  progress: SetupProgress;
  active: boolean;
  isSitePublished: boolean;
  siteSubdomain?: string | null;
}) {
  const relatedItems = section.itemKeys
    .map((key) => getItem(progress, key))
    .filter(Boolean) as ChecklistItem[];

  return (
    <div
      id={`workspace-${section.id}`}
      className="rounded-[var(--radius-card)] border p-4 sm:p-5"
      style={{
        borderColor: active ? "var(--color-primary)" : "var(--color-border)",
        backgroundColor: "var(--color-card)",
        opacity: section.status === "locked" ? 0.78 : 1,
      }}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="admin-stat-pill" data-tone={STATUS_TONE[section.status]}>
              <Icon name={statusIcon(section.status)} size={12} />
              {STATUS_LABEL[section.status]}
            </span>
            <span className="text-xs font-semibold text-[var(--color-text-muted)]">
              {section.summary}
            </span>
          </div>
          <h3 className="text-xl font-bold text-[var(--color-text-primary)]">{section.title}</h3>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">{section.subtitle}</p>
        </div>
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[4px]"
          style={{ backgroundColor: "var(--color-elevated)", color: "var(--color-text-primary)" }}
        >
          <Icon name={section.icon} size={22} />
        </div>
      </div>

      {section.lockedReason && (
        <p className="mt-4 rounded-[4px] border p-3 text-sm text-[var(--color-text-muted)]" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-elevated)" }}>
          <Icon name="lock" size={14} className="align-middle" /> {section.lockedReason}
        </p>
      )}

      {section.facts && section.facts.length > 0 && (
        <div className="mt-4 divide-y" style={{ borderColor: "var(--color-border)" }}>
          {section.facts.map((fact) => (
            <div
              key={fact.label}
              className="flex flex-col gap-1 py-2 first:pt-0 last:pb-0 sm:flex-row sm:items-start sm:justify-between"
            >
              <span className="text-sm font-semibold text-[var(--color-text-primary)]">
                {fact.label}
              </span>
              <span className="text-sm text-[var(--color-text-muted)] sm:max-w-[70%] sm:text-right">
                {fact.value}
              </span>
            </div>
          ))}
        </div>
      )}

      {relatedItems.length > 0 && (
        <div className="mt-4 divide-y" style={{ borderColor: "var(--color-border)" }}>
          {relatedItems.map((item) => (
            <div
              key={item.key}
              className="flex flex-col gap-1 py-2 first:pt-0 last:pb-0 sm:flex-row sm:items-start sm:justify-between"
            >
              <div className="min-w-0">
                <span className="text-sm font-semibold text-[var(--color-text-primary)]">
                  {READABLE_ITEM_TITLE[item.key] ?? item.title}
                </span>
                <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">{item.summary}</p>
              </div>
              <span className="admin-stat-pill shrink-0 self-start" data-tone={STATUS_TONE[item.status]}>
                {STATUS_LABEL[item.status]}
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        {section.actions.map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className="inline-flex min-h-[44px] items-center gap-1.5 rounded-[4px] border px-3 py-2 text-sm font-semibold transition-colors hover:bg-[var(--color-elevated)]"
            style={{ borderColor: "var(--color-border)", color: "var(--color-text-primary)" }}
          >
            <Icon name={action.icon} size={16} />
            {action.label}
          </Link>
        ))}
        {section.id === "summary" && isSitePublished && siteSubdomain && (
          <a
            href={`https://${siteSubdomain}.mybdr.kr`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-[44px] items-center gap-1.5 rounded-[4px] border px-3 py-2 text-sm font-semibold transition-colors hover:bg-[var(--color-elevated)]"
            style={{ borderColor: "var(--color-border)", color: "var(--color-text-primary)" }}
          >
            <Icon name="external-link" size={16} />
            공개 사이트 보기
          </a>
        )}
      </div>
    </div>
  );
}

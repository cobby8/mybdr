"use client";

import { useState } from "react";
import Link from "next/link";

// 왜 client component: 4탭 전환 상태(useState) 필요. 데이터는 props로 주입받아 캐시 보존
type Edition = {
  id: string;
  name: string;
  edition_number: number | null;
  startDate: string | null;
  status: string | null;
  venue_name: string | null;
  city: string | null;
  maxTeams: number | null;
  teams_count: number | null;
};

type StatsProps = {
  totalEditions: number;
  totalTeams: number;
  latestActiveLabel: string | null;
};

type AboutProps = {
  seriesName: string;
  description: string | null;
  host: string | null;
  foundedYear: number;
};

const STATUS_INFO: Record<
  string,
  { label: string; tone: "success" | "warning" | "info" | "default" | "error" }
> = {
  draft: { label: "준비중", tone: "default" },
  registration_open: { label: "모집중", tone: "success" },
  registration_closed: { label: "접수마감", tone: "warning" },
  ongoing: { label: "진행중", tone: "info" },
  completed: { label: "완료", tone: "default" },
  cancelled: { label: "취소", tone: "error" },
};

const TONE_CLASS: Record<string, string> = {
  success: "bg-[var(--color-success)] text-white",
  warning: "bg-[var(--color-warning)] text-white",
  info: "bg-[var(--color-info)] text-white",
  error: "bg-[var(--color-error)] text-white",
  default:
    "bg-[var(--color-surface-bright)] text-[var(--color-text-muted)] border border-[var(--color-border)]",
};

type TabKey = "editions" | "honors" | "stats" | "about";

const TABS: Array<[TabKey, string]> = [
  ["editions", "회차 계보"],
  ["honors", "명예의 전당"],
  ["stats", "통계"],
  ["about", "소개"],
];

export function SeriesDetailTabs({
  editions,
  stats,
  about,
}: {
  editions: Edition[];
  stats: StatsProps;
  about: AboutProps;
}) {
  const [tab, setTab] = useState<TabKey>("editions");

  return (
    <div>
      {/* 탭 헤더 — 시안: bottom-border 강조 + active는 cafe-blue */}
      <div
        className="mb-5 flex flex-wrap"
        style={{ borderBottom: "2px solid var(--color-border)" }}
      >
        {TABS.map(([k, l]) => {
          const active = tab === k;
          return (
            <button
              key={k}
              type="button"
              onClick={() => setTab(k)}
              className="-mb-0.5 cursor-pointer border-0 bg-transparent px-4 py-3 text-[14px]"
              style={{
                borderBottom: active
                  ? "3px solid var(--color-info)"
                  : "3px solid transparent",
                color: active ? "var(--color-text)" : "var(--color-text-muted)",
                fontWeight: active ? 700 : 500,
              }}
            >
              {l}
            </button>
          );
        })}
      </div>

      {/* editions — 회차 계보 (시안 박제, DB 회차 데이터 사용) */}
      {tab === "editions" && (
        <div className="overflow-hidden rounded-[12px] border border-[var(--color-border)]">
          {editions.length === 0 && (
            <div className="px-6 py-12 text-center text-[var(--color-text-muted)]">
              <p className="text-sm">아직 공개된 회차가 없습니다.</p>
            </div>
          )}
          {editions.map((e, i) => {
            const info =
              STATUS_INFO[e.status ?? "draft"] ?? {
                label: e.status ?? "-",
                tone: "default" as const,
              };
            const isActive =
              e.status === "registration_open" || e.status === "ongoing";
            return (
              <Link key={e.id} href={`/tournaments/${e.id}`}>
                <div
                  className="grid cursor-pointer items-center gap-3.5 px-5 py-4 transition-colors hover:bg-[var(--color-surface-bright)]"
                  style={{
                    gridTemplateColumns:
                      "52px 96px minmax(0,1fr) minmax(0,1fr) 80px",
                    borderBottom:
                      i < editions.length - 1
                        ? "1px solid var(--color-border)"
                        : 0,
                    background: isActive
                      ? "color-mix(in srgb, var(--color-info) 8%, transparent)"
                      : "transparent",
                  }}
                >
                  {/* #회차 */}
                  <div
                    className="text-[22px] font-black text-[var(--color-text-muted)]"
                    style={{ fontFamily: "var(--font-heading)" }}
                  >
                    #{e.edition_number ?? "-"}
                  </div>
                  {/* 날짜 */}
                  <div className="text-[12px] text-[var(--color-text-muted)] tabular-nums">
                    {e.startDate
                      ? new Date(e.startDate).toLocaleDateString("ko-KR", {
                          timeZone: "Asia/Seoul",
                        })
                      : "-"}
                  </div>
                  {/* 이름 + 참가 */}
                  <div className="min-w-0">
                    <div className="truncate text-[15px] font-bold">
                      {e.name}
                    </div>
                    <div className="mt-0.5 text-[12px] text-[var(--color-text-muted)]">
                      {(e.teams_count ?? 0)}/{e.maxTeams ?? "?"}팀 참가
                      {e.city || e.venue_name
                        ? ` · ${[e.city, e.venue_name].filter(Boolean).join(" ")}`
                        : ""}
                    </div>
                  </div>
                  {/* 우승팀 — DB 미지원: 상태 배지로 대체 (winner/MVP 컬럼 없음) */}
                  <div>
                    <span
                      className={`inline-flex items-center rounded-[3px] px-2 py-0.5 text-[11px] font-semibold ${TONE_CLASS[info.tone]}`}
                    >
                      {info.label}
                    </span>
                  </div>
                  {/* 우측 액션 */}
                  <div className="text-right">
                    <span className="inline-flex items-center rounded border border-[var(--color-border)] bg-[var(--color-surface-bright)] px-2.5 py-1 text-[12px] font-medium text-[var(--color-text)]">
                      {isActive ? "참가" : "기록"}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* honors — 명예의 전당 (DB winner 컬럼 미지원: 안내) */}
      {tab === "honors" && (
        <div className="rounded-[12px] border border-[var(--color-border)] bg-[var(--color-surface)] px-7 py-6">
          <h2 className="m-0 mb-4 text-[18px] font-bold">🏆 다수 우승팀</h2>
          <div className="rounded-[8px] bg-[var(--color-surface-bright)] px-5 py-8 text-center text-[var(--color-text-muted)]">
            <p className="text-sm">
              회차별 우승팀·MVP 기록은 추후 제공될 예정입니다.
            </p>
            <p className="mt-1 text-xs">(DB 스키마 확장 대기)</p>
          </div>
        </div>
      )}

      {/* stats — 통계 (DB 가능 항목만, 미지원은 폴백) */}
      {tab === "stats" && (
        <div className="grid gap-3.5 sm:grid-cols-2">
          <StatCard
            label="누적 회차"
            value={`${stats.totalEditions}회`}
            sub={
              stats.totalEditions > 0
                ? "공개된 시리즈 회차 합계"
                : "아직 진행된 회차가 없습니다"
            }
          />
          <StatCard
            label="누적 참가팀"
            value={`${stats.totalTeams}팀`}
            sub={
              stats.totalEditions > 0
                ? `회당 평균 ${Math.round(
                    stats.totalTeams / Math.max(stats.totalEditions, 1)
                  )}팀`
                : "회차 진행 후 집계됩니다"
            }
          />
          <StatCard
            label="현재 진행중"
            value={stats.latestActiveLabel ?? "-"}
            sub={
              stats.latestActiveLabel
                ? "모집중 또는 진행중인 회차"
                : "현재 활성 회차 없음"
            }
          />
          <StatCard
            label="평균 득점"
            value="-"
            sub="경기 데이터 집계 후 제공"
            muted
          />
        </div>
      )}

      {/* about — 소개 */}
      {tab === "about" && (
        <div className="rounded-[12px] border border-[var(--color-border)] bg-[var(--color-surface)] px-7 py-6">
          <h2 className="m-0 mb-3 text-[18px] font-bold">
            {about.seriesName} 소개
          </h2>
          {about.description ? (
            <p className="m-0 mb-3.5 leading-[1.75] text-[var(--color-text-muted)]">
              {about.description}
            </p>
          ) : (
            <p className="m-0 mb-3.5 leading-[1.75] text-[var(--color-text-muted)]">
              아직 시리즈 소개가 등록되지 않았습니다.
            </p>
          )}
          <div
            className="grid rounded-[8px] bg-[var(--color-surface-bright)] px-4 py-3.5 text-[14px]"
            style={{
              gridTemplateColumns: "140px 1fr",
              rowGap: 10,
              columnGap: 16,
            }}
          >
            {about.host && (
              <>
                <div className="text-[12px] text-[var(--color-text-muted)]">주최</div>
                <div>{about.host}</div>
              </>
            )}
            <div className="text-[12px] text-[var(--color-text-muted)]">설립</div>
            <div>{about.foundedYear}년</div>
            <div className="text-[12px] text-[var(--color-text-muted)]">경기 방식</div>
            <div>3v3 토너먼트</div>
            <div className="text-[12px] text-[var(--color-text-muted)]">대상</div>
            <div>참가 자격은 각 회차 페이지에서 확인하세요</div>
          </div>
        </div>
      )}
    </div>
  );
}

// 통계 카드 — 시안의 큰 숫자 + label/sub 박제
function StatCard({
  label,
  value,
  sub,
  muted = false,
}: {
  label: string;
  value: string;
  sub: string;
  muted?: boolean;
}) {
  return (
    <div className="rounded-[12px] border border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-5">
      <div className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--color-text-muted)]">
        {label}
      </div>
      <div
        className={`mb-1.5 text-[32px] leading-none font-black ${muted ? "text-[var(--color-text-muted)]" : "text-[var(--color-text)]"}`}
        style={{ fontFamily: "var(--font-heading)" }}
      >
        {value}
      </div>
      <div className="text-[12px] text-[var(--color-text-muted)]">{sub}</div>
    </div>
  );
}

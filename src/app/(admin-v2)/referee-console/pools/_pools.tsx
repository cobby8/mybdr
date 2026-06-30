"use client";

// ============================================================
// referee-console/pools/_pools.tsx — 일자별 운영(풀 대시보드) (클라)
//   4-4e 컷오버: 레거시 (referee)/referee/admin/pools/page.tsx 를 v2(Toss) 디자인으로
//   1:1 포팅. 대회 선택 → 일자+역할별 선정 인원/책임자 현황 카드 + 공고 상세 진입.
//
//   흐름(레거시 동일):
//     1) 대회 검색/선택 → 2) pools + announcements 동시 로드
//     3) 클라에서 date+role_type 그룹화 → 카드 → 4) 첫 연관 공고 상세로 이동
//
//   ★백엔드 0변경 — 기존 referee-admin API만 재사용:
//     - GET /api/web/referee-admin/tournaments?q=&limit=20   (대회 검색)
//     - GET /api/web/referee-admin/pools?tournament_id=       (풀 목록)
//     - GET /api/web/referee-admin/announcements?tournament_id=&limit=100 (필요 인원/대표 공고)
//
//   ★데이터 변환 = adminFetch 단일 변환점. required_count(jsonb) 는 rawJsonKeys 로 verbatim 보존.
//   ★권한 스코프 = 글로벌 super(layout.tsx). 조회는 모든 관리자 허용(referee-admin GET).
// ============================================================

import React from "react";
import { useRouter } from "next/navigation";
import { Btn, Badge, Icon } from "@/components/admin-v2";
import { adminFetch, AdminApiError } from "@/lib/admin-v2/data/client";

// ── 타입(adminFetch 응답 = snake→camel 변환 후) ──
type Tournament = {
  id: string;
  name: string;
};

type PoolItem = {
  id: string | number;
  tournamentId: string;
  date: string; // ISO
  refereeId: string | number;
  roleType: "referee" | "game_official";
  isChief: boolean;
  refereeName: string;
  refereeLevel: string | null;
  refereeCertGrade: string | null;
};

type AnnouncementLite = {
  id: string | number;
  tournamentId: string;
  title: string;
  roleType: "referee" | "game_official";
  dates: string[];
  requiredCount: Record<string, number>; // jsonb(rawJsonKeys 보존)
};

const ROLE_LABELS: Record<string, string> = {
  referee: "심판",
  game_official: "경기원",
};

function toYmd(iso: string): string {
  return new Date(iso).toISOString().slice(0, 10);
}

// 카드 그룹 키 = "YYYY-MM-DD|role_type"
function groupKey(ymd: string, role: string) {
  return `${ymd}|${role}`;
}

const errorBoxStyle: React.CSSProperties = {
  fontSize: 13.5,
  color: "var(--danger)",
  background: "var(--danger-weak, rgba(240,68,82,0.08))",
  border: "1px solid var(--danger)",
  borderRadius: 6,
  padding: "10px 12px",
  lineHeight: 1.5,
};

export function PoolsDashboard() {
  const router = useRouter();

  const [tournaments, setTournaments] = React.useState<Tournament[]>([]);
  const [tSearch, setTSearch] = React.useState("");
  const [selected, setSelected] = React.useState<Tournament | null>(null);

  const [pools, setPools] = React.useState<PoolItem[]>([]);
  const [announcements, setAnnouncements] = React.useState<AnnouncementLite[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [pageError, setPageError] = React.useState<string | null>(null);

  // ── 대회 검색 ──
  const searchTournaments = React.useCallback(async (q: string) => {
    try {
      const qs = new URLSearchParams({ limit: "20" });
      if (q) qs.set("q", q);
      const data = await adminFetch<{ items: Tournament[] }>(
        `/api/web/referee-admin/tournaments?${qs.toString()}`
      );
      setTournaments(data.items ?? []);
    } catch {
      // 무시(레거시 동일)
    }
  }, []);

  React.useEffect(() => {
    searchTournaments("");
  }, [searchTournaments]);

  // ── 대회 선택 시 풀 + 관련 공고 동시 로드 ──
  const loadForTournament = React.useCallback(async (t: Tournament) => {
    setLoading(true);
    setPageError(null);
    try {
      const [poolsData, annData] = await Promise.all([
        adminFetch<{ items: PoolItem[] }>(
          `/api/web/referee-admin/pools?tournament_id=${encodeURIComponent(t.id)}`
        ),
        adminFetch<{ items: AnnouncementLite[] }>(
          `/api/web/referee-admin/announcements?tournament_id=${encodeURIComponent(t.id)}&limit=100`,
          { rawJsonKeys: ["requiredCount"] }
        ).catch(() => ({ items: [] as AnnouncementLite[] })),
      ]);
      setPools(poolsData.items ?? []);
      setAnnouncements(annData.items ?? []);
    } catch (e) {
      setPageError(
        e instanceof AdminApiError ? e.message : "풀을 불러오지 못했습니다."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  function onSelectTournament(t: Tournament) {
    setSelected(t);
    loadForTournament(t);
  }

  // ── 일자+역할별 그룹(레거시 동일) ──
  const groups = React.useMemo(() => {
    const map = new Map<
      string,
      {
        date: string;
        role: "referee" | "game_official";
        items: PoolItem[];
        chief: PoolItem | null;
      }
    >();
    for (const p of pools) {
      const ymd = toYmd(p.date);
      const k = groupKey(ymd, p.roleType);
      const g = map.get(k) ?? { date: ymd, role: p.roleType, items: [], chief: null };
      g.items.push(p);
      if (p.isChief) g.chief = p;
      map.set(k, g);
    }
    return [...map.values()].sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return a.role.localeCompare(b.role);
    });
  }, [pools]);

  // date+role별 필요 인원 합계(해당 대회 공고 전부 합산)
  const needFor = React.useCallback(
    (ymd: string, role: "referee" | "game_official") => {
      let total = 0;
      for (const a of announcements) {
        if (a.roleType !== role) continue;
        total += a.requiredCount?.[ymd] ?? 0;
      }
      return total;
    },
    [announcements]
  );

  // date+role별 대표 공고(상세 이동 대상)
  const announcementFor = React.useCallback(
    (ymd: string, role: "referee" | "game_official") =>
      announcements.find(
        (a) => a.roleType === role && a.dates.some((d) => toYmd(d) === ymd)
      ) ?? null,
    [announcements]
  );

  // ── 상단 요약 ──
  const summary = React.useMemo(() => {
    const uniqueDates = new Set(groups.map((g) => g.date));
    const withChief = groups.filter((g) => g.chief).length;
    return {
      dateCount: uniqueDates.size,
      groupCount: groups.length,
      chiefCount: withChief,
      totalSelected: pools.length,
    };
  }, [groups, pools.length]);

  return (
    <div>
      {/* ── 페이지 헤더 ── */}
      <div className="ts-ph">
        <div className="ts-ph__eyebrow">심판 콘솔</div>
        <div className="ts-ph__title">일자별 운영</div>
        <div className="ts-ph__sub">
          대회를 선택하면 일자별 선정 인원과 책임자 지정 현황을 확인할 수 있습니다.
        </div>
      </div>

      {/* ── 대회 선택 ── */}
      <div className="ad-panel" style={{ marginBottom: 20 }}>
        <label
          style={{
            display: "block",
            fontSize: 11,
            fontWeight: 700,
            color: "var(--ink-mute)",
            marginBottom: 8,
          }}
        >
          대회 검색
        </label>
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <input
            className="ts-input"
            value={tSearch}
            onChange={(e) => setTSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.nativeEvent.isComposing) return;
              if (e.key === "Enter") {
                e.preventDefault();
                searchTournaments(tSearch);
              }
            }}
            placeholder="대회명 검색 (Enter)"
            style={{ flex: 1 }}
          />
          <Btn variant="primary" icon="search" onClick={() => searchTournaments(tSearch)}>
            검색
          </Btn>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {tournaments.length === 0 ? (
            <div style={{ fontSize: 12.5, color: "var(--ink-mute)" }}>검색 결과 없음</div>
          ) : (
            tournaments.map((t) => {
              const active = selected?.id === t.id;
              return (
                <Btn
                  key={t.id}
                  variant={active ? "primary" : "secondary"}
                  size="sm"
                  onClick={() => onSelectTournament(t)}
                >
                  {t.name}
                </Btn>
              );
            })
          )}
        </div>
      </div>

      {pageError && <div style={{ ...errorBoxStyle, marginBottom: 20 }}>{pageError}</div>}

      {!selected ? (
        <div className="ad-panel" style={{ padding: "48px 0", textAlign: "center", color: "var(--ink-mute)" }}>
          대회를 선택해 주세요.
        </div>
      ) : loading ? (
        <div className="ad-panel" style={{ padding: "48px 0", textAlign: "center", color: "var(--ink-mute)" }}>
          불러오는 중...
        </div>
      ) : (
        <>
          {/* 상단 요약 KPI */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
              gap: 12,
              marginBottom: 20,
            }}
          >
            {[
              { label: "일자 수", value: summary.dateCount },
              { label: "일자·역할 그룹", value: summary.groupCount },
              { label: "책임자 지정", value: summary.chiefCount },
              { label: "총 선정 인원", value: summary.totalSelected },
            ].map((s) => (
              <div key={s.label} className="ad-panel">
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--ink-mute)" }}>
                  {s.label}
                </div>
                <div style={{ fontSize: 22, fontWeight: 800, color: "var(--ink)", marginTop: 4 }}>
                  {s.value}
                </div>
              </div>
            ))}
          </div>

          {/* 그룹 카드 */}
          {groups.length === 0 ? (
            <div className="ad-panel" style={{ padding: "48px 0", textAlign: "center", color: "var(--ink-mute)" }}>
              선정된 인원이 없습니다. 공고 상세에서 신청자를 선정하세요.
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                gap: 12,
              }}
            >
              {groups.map((g) => {
                const need = needFor(g.date, g.role);
                const ann = announcementFor(g.date, g.role);
                return (
                  <div key={`${g.date}|${g.role}`} className="ad-panel">
                    <div
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        justifyContent: "space-between",
                        marginBottom: 10,
                      }}
                    >
                      <div>
                        <div style={{ fontSize: 15, fontWeight: 800, color: "var(--ink)" }}>
                          {g.date}
                        </div>
                        <div style={{ fontSize: 11.5, fontWeight: 600, color: "var(--ink-mute)" }}>
                          {ROLE_LABELS[g.role] ?? g.role}
                        </div>
                      </div>
                      <div style={{ textAlign: "right", fontSize: 12, color: "var(--ink-mute)" }}>
                        <div>
                          <span style={{ fontSize: 17, fontWeight: 800, color: "var(--ink)" }}>
                            {g.items.length}
                          </span>
                          <span style={{ margin: "0 4px" }}>/</span>
                          <span>{need}</span>
                        </div>
                        <div>선정</div>
                      </div>
                    </div>

                    {/* 책임자 표시 */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        marginBottom: 10,
                      }}
                    >
                      {g.chief ? (
                        <Badge tone="primary" icon="star">
                          책임자 {g.chief.refereeName}
                        </Badge>
                      ) : (
                        <Badge tone="grey">책임자 미지정</Badge>
                      )}
                    </div>

                    {/* 선정 인원 이름(최대 5명) */}
                    <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 2 }}>
                      {g.items.slice(0, 5).map((p) => (
                        <li key={String(p.id)} style={{ fontSize: 12.5, color: "var(--ink-soft)" }}>
                          • {p.refereeName}
                          {p.isChief && (
                            <span style={{ marginLeft: 4, color: "var(--primary)" }}>(책임)</span>
                          )}
                        </li>
                      ))}
                      {g.items.length > 5 && (
                        <li style={{ fontSize: 12.5, color: "var(--ink-mute)" }}>
                          … 외 {g.items.length - 5}명
                        </li>
                      )}
                    </ul>

                    {/* 상세 이동 */}
                    {ann && (
                      <Btn
                        variant="ghost"
                        size="sm"
                        iconRight="chevron-right"
                        onClick={() => router.push(`/referee-console/announcements/${ann.id}`)}
                        style={{ marginTop: 12 }}
                      >
                        공고 상세
                      </Btn>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}

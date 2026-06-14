"use client";

/* ============================================================
 * AwardsContent — /awards 클라이언트 본체 (AW1 · v2.31 시안 박제)
 *
 * 왜 클라이언트인가:
 *   시안 시즌 셀렉터가 클릭 인터랙션 → ?series=<slug> 로 router.push 후
 *   서버(page.tsx)가 재페치. (page.tsx 는 절대 미변경 — 데이터 패칭 보존)
 *
 * v2.31 변경 (vs 이전 awards-content):
 *   - UI 셸만 v2.31 시안(aw-hero / aw-mvp / aw-best5 / aw-cats) 으로 재작성.
 *   - 데이터 출처는 page.tsx 의 기존 DTO(seasonMvp/leaders/champions) 그대로.
 *   - best5: 시안은 PG~C 5명이나 DTO 에 포지션별 best5 없음 →
 *     가용한 leaders(득점/어시/리바 3명) 실데이터로 채우고 나머지 슬롯은
 *     "준비 중" 빈 슬롯. mock 금지(시안 더미 "김지훈" 등 박제 안 함).
 *   - cats: scoring/assists/rebounds 실데이터, 스틸왕/레이팅/매너상은
 *     DTO 미지원 → "준비 중".
 *
 * 시안 출처: Dev/design/BDR-current/screens/Awards.jsx (+ extras-pages.css .aw-*)
 * AppNav active: pathname 자동 판정(/awards → rankings)
 * ============================================================ */

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import type { AwardsDataDTO, PlayerRefDTO, SeasonAwardPlayerDTO } from "../page";

interface Props {
  data: AwardsDataDTO;
}

/** 아바타 이니셜 — 이름 첫 글자(이미지 미사용 폴백) */
function initial(name: string | null | undefined): string {
  if (!name) return "-";
  const t = name.trim();
  return t ? t[0] : "-";
}

/** 메트릭 표시 — null 이면 "—" */
function fmtMetric(v: number | null | undefined, suffix: string): string {
  if (v === null || v === undefined || isNaN(v)) return "—";
  return `${v.toFixed(1)} ${suffix}`;
}

export function AwardsContent({ data }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // 시즌 셀렉터 — ?series=<slug> 로 URL 동기화(서버 재페치 트리거). page.tsx 보존.
  const handleSeasonChange = (slug: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (slug === "all") {
      params.delete("series");
    } else {
      params.set("series", slug);
    }
    const query = params.toString();
    router.push(`/awards${query ? "?" + query : ""}`);
  };

  const mvp = data.seasonMvp;
  const mvpPlayer = mvp?.player ?? null;

  // 슬롯 정규화 타입 — leaders(PlayerRefDTO·메트릭 보유) 와 season_awards(SeasonAwardPlayerDTO·메트릭 없음)
  // 둘 다 같은 셀로 렌더하기 위한 공통 형태.
  type Slot = {
    name: string | null;
    teamName: string | null;
    /** 표시 메트릭 텍스트 (예: "22.4 PPG") — season_awards 슬롯은 코멘트 또는 "—" */
    metricText: string;
  } | null;

  // PlayerRefDTO → 슬롯 (메트릭 텍스트 = value + label)
  const fromLeader = (p: PlayerRefDTO | null): Slot =>
    p ? { name: p.name, teamName: p.teamName, metricText: fmtMetric(p.metricValue, p.metricLabel) } : null;

  // SeasonAwardPlayerDTO → 슬롯 (메트릭 자리에 코멘트 또는 "—")
  const fromAward = (a: SeasonAwardPlayerDTO | null): Slot =>
    a && (a.name || a.comment)
      ? { name: a.name ?? "수상", teamName: a.teamName, metricText: a.comment ?? "—" }
      : null;

  // 베스트5 슬롯 — 득점/어시/리바 = leaders 실데이터, 수비/신인 = season_awards(P1-b).
  // 미입력이면 null → "집계 중" 빈상태(mock 금지).
  const best5Slots: { label: string; slot: Slot }[] = [
    { label: "득점", slot: fromLeader(data.scoringLeader) },
    { label: "어시", slot: fromLeader(data.assistsLeader) },
    { label: "리바", slot: fromLeader(data.reboundsLeader) },
    { label: "수비", slot: fromAward(data.bestDefense) },
    { label: "신인", slot: fromAward(data.newFace) },
  ];

  // 부문별 수상 — 득점/어시/리바왕 = leaders, 스틸(수비)왕/레이팅/매너 = season_awards(P1-b).
  const catSlots: { ico: string; label: string; slot: Slot }[] = [
    { ico: "sports_score", label: "득점왕", slot: fromLeader(data.scoringLeader) },
    { ico: "volunteer_activism", label: "어시스트왕", slot: fromLeader(data.assistsLeader) },
    { ico: "open_with", label: "리바운드왕", slot: fromLeader(data.reboundsLeader) },
    { ico: "bolt", label: "스틸왕", slot: fromAward(data.bestDefense) },
    { ico: "trending_up", label: "레이팅 상승", slot: fromAward(data.ratingUp) },
    { ico: "handshake", label: "매너상", slot: fromAward(data.mannerAward) },
  ];

  // 올스타팀 — display_order 순 배열. 미입력이면 빈배열 → 섹션 빈상태.
  const allStarTeams: { label: string; players: SeasonAwardPlayerDTO[] }[] = [
    { label: "1ST TEAM", players: data.allStar1st },
    { label: "2ND TEAM", players: data.allStar2nd },
  ];
  const hasAllStar = data.allStar1st.length > 0 || data.allStar2nd.length > 0;

  return (
    <div className="page">
      <div className="page__inner ex-page-w">
        {/* 브레드크럼 */}
        <div className="ex-crumb">
          <Link href="/">홈</Link>
          <span className="sep">›</span>
          <span className="cur">시즌 시상</span>
        </div>

        {/* Hero — bdr-navy 그라디언트 + 시즌 칩 + 시즌 셀렉터(기존 흐름 보존) */}
        <div className="aw-hero">
          <div>
            <div className="aw-hero__eyebrow">AWARDS · 시즌 시상</div>
            <h1 className="aw-hero__t">{data.currentSeasonLabel}</h1>
            <p className="aw-hero__d">전국 코트에서 펼쳐진 한 시즌, 가장 빛난 선수와 팀을 기록합니다.</p>
          </div>
          {/* 시즌 셀렉터 — ?series= router.push (page.tsx 재페치). 단일 시즌이면 칩 표시만 */}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "flex-end" }}>
            {data.seasons.map((s) => {
              const active = s.slug === data.currentSeasonSlug;
              return (
                <button
                  key={s.slug}
                  type="button"
                  className="aw-hero__season"
                  onClick={() => handleSeasonChange(s.slug)}
                  style={{
                    cursor: "pointer",
                    border: active ? "1px solid rgba(255,255,255,.5)" : undefined,
                    opacity: active ? 1 : 0.7,
                  }}
                >
                  {s.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* 시즌 MVP — seasonMvp DTO. 0건이면 빈상태 폴백 */}
        <h2 className="ex-sec__h">시즌 MVP</h2>
        {mvpPlayer ? (
          <div className="card aw-mvp">
            <div className="aw-mvp__face">
              <div className="aw-mvp__av">{initial(mvpPlayer.name)}</div>
              <div className="aw-mvp__tag">MOST VALUABLE PLAYER</div>
            </div>
            <div className="aw-mvp__body">
              <div className="aw-mvp__name">{mvpPlayer.name}</div>
              <div className="aw-mvp__team">
                {mvpPlayer.teamName ?? "—"}
                {mvpPlayer.position ? ` · ${mvpPlayer.position}` : ""}
              </div>
              <div className="aw-mvp__stats">
                <div className="aw-mvp__stat">
                  <div className="v">{mvp?.ppg !== null && mvp?.ppg !== undefined ? mvp.ppg.toFixed(1) : "—"}</div>
                  <div className="k">PPG</div>
                </div>
                <div className="aw-mvp__stat">
                  <div className="v">{mvp?.apg !== null && mvp?.apg !== undefined ? mvp.apg.toFixed(1) : "—"}</div>
                  <div className="k">APG</div>
                </div>
                <div className="aw-mvp__stat">
                  <div className="v">{mvp?.rpg !== null && mvp?.rpg !== undefined ? mvp.rpg.toFixed(1) : "—"}</div>
                  <div className="k">RPG</div>
                </div>
                <div className="aw-mvp__stat">
                  <div className="v">{mvp?.winPct !== null && mvp?.winPct !== undefined ? `${mvp.winPct.toFixed(0)}%` : "—"}</div>
                  <div className="k">승률</div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          // MVP 0건 — 빈상태(page.tsx 가 mvp_player_id 없으면 null 반환)
          <div className="card aw-mvp aw-mvp--empty">
            <div className="ex-empty">
              <span className="ico material-symbols-outlined">emoji_events</span>
              <div className="ex-empty__t">선정된 MVP가 없습니다</div>
              <div className="ex-empty__d">해당 시즌 종료 대회에 MVP가 등록되면 자동으로 표시됩니다.</div>
            </div>
          </div>
        )}

        {/* 베스트 5 — leaders 3명 실데이터, 나머지 슬롯 준비 중(mock 금지) */}
        <h2 className="ex-sec__h" style={{ marginTop: 30 }}>베스트 5</h2>
        <div className="aw-best5" style={{ marginBottom: 30 }}>
          {best5Slots.map((s, i) => (
            <div key={i} className="aw-p">
              <div className="aw-p__pos">{s.label}</div>
              {s.slot ? (
                <>
                  <div className="aw-p__av">{initial(s.slot.name)}</div>
                  <div className="aw-p__name">{s.slot.name}</div>
                  <div className="aw-p__team">{s.slot.teamName ?? "—"}</div>
                  <div className="aw-p__stat">{s.slot.metricText}</div>
                </>
              ) : (
                <>
                  <div className="aw-p__av aw-p__av--empty">
                    <span className="ico material-symbols-outlined" style={{ fontSize: 22 }}>schedule</span>
                  </div>
                  <div className="aw-p__name" style={{ color: "var(--ink-mute)" }}>준비 중</div>
                  <div className="aw-p__team">집계 예정</div>
                  <div className="aw-p__stat">—</div>
                </>
              )}
            </div>
          ))}
        </div>

        {/* 부문별 수상 — leaders 실데이터, 미지원 부문은 준비 중 */}
        <h2 className="ex-sec__h">부문별 수상</h2>
        <div className="aw-cats">
          {catSlots.map((c, i) => (
            <div key={i} className="aw-cat">
              <div className="aw-cat__ico"><span className="ico material-symbols-outlined">{c.ico}</span></div>
              <div>
                <div className="aw-cat__label">{c.label}</div>
                {c.slot ? (
                  <>
                    <div className="aw-cat__name">{c.slot.name}</div>
                    <div className="aw-cat__sub">{c.slot.teamName ?? "—"}</div>
                  </>
                ) : (
                  <>
                    <div className="aw-cat__name" style={{ color: "var(--ink-mute)" }}>준비 중</div>
                    <div className="aw-cat__sub">집계 예정</div>
                  </>
                )}
              </div>
              <div className="aw-cat__v">
                {c.slot ? c.slot.metricText || "—" : "—"}
              </div>
            </div>
          ))}
        </div>

        {/* ── 올스타 팀 (P1-b season_awards) — 미입력 시 빈상태 ── */}
        <h2 className="ex-sec__h" style={{ marginTop: 30 }}>올스타 팀</h2>
        {hasAllStar ? (
          allStarTeams.map((team) =>
            team.players.length > 0 ? (
              <div key={team.label} style={{ marginBottom: 20 }}>
                {/* 강조색 = var(--cafe-blue) (errors 06-10 빨강 폴백 함정 회피) */}
                <div
                  className="aw-hero__eyebrow"
                  style={{ color: "var(--cafe-blue)", marginBottom: 10 }}
                >
                  {team.label}
                </div>
                <div className="aw-best5">
                  {team.players.map((p, i) => (
                    <div key={i} className="aw-p">
                      <div className="aw-p__pos">{i + 1}</div>
                      <div className="aw-p__av">{initial(p.name)}</div>
                      <div className="aw-p__name">{p.name ?? "수상"}</div>
                      <div className="aw-p__team">{p.teamName ?? "—"}</div>
                      <div className="aw-p__stat">{p.comment ?? "—"}</div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null,
          )
        ) : (
          <div className="card aw-mvp aw-mvp--empty">
            <div className="ex-empty">
              <span className="ico material-symbols-outlined">groups</span>
              <div className="ex-empty__t">올스타 팀이 아직 선정되지 않았습니다</div>
              <div className="ex-empty__d">시즌 결산 시 운영팀이 올스타 1st/2nd 팀을 등록합니다.</div>
            </div>
          </div>
        )}

        {/* ── 올해의 감독 · NEW FACE · MVP 코멘트 (P1-b) ── */}
        <h2 className="ex-sec__h" style={{ marginTop: 30 }}>특별 시상</h2>
        <div className="aw-cats">
          {/* 올해의 감독 */}
          <div className="aw-cat">
            <div className="aw-cat__ico"><span className="ico material-symbols-outlined">sports</span></div>
            <div>
              <div className="aw-cat__label">올해의 감독</div>
              {data.coachOfYear?.name ? (
                <>
                  <div className="aw-cat__name">{data.coachOfYear.name}</div>
                  <div className="aw-cat__sub">{data.coachOfYear.teamName ?? "—"}</div>
                </>
              ) : (
                <>
                  <div className="aw-cat__name" style={{ color: "var(--ink-mute)" }}>준비 중</div>
                  <div className="aw-cat__sub">집계 예정</div>
                </>
              )}
            </div>
            <div className="aw-cat__v">—</div>
          </div>

          {/* NEW FACE */}
          <div className="aw-cat">
            <div className="aw-cat__ico"><span className="ico material-symbols-outlined">star</span></div>
            <div>
              <div className="aw-cat__label">NEW FACE</div>
              {data.newFace?.name ? (
                <>
                  <div className="aw-cat__name">{data.newFace.name}</div>
                  <div className="aw-cat__sub">{data.newFace.teamName ?? "—"}</div>
                </>
              ) : (
                <>
                  <div className="aw-cat__name" style={{ color: "var(--ink-mute)" }}>준비 중</div>
                  <div className="aw-cat__sub">집계 예정</div>
                </>
              )}
            </div>
            <div className="aw-cat__v">—</div>
          </div>
        </div>

        {/* MVP 코멘트 — 인용 강조(cafe-blue) */}
        {data.mvpQuote && (data.mvpQuote.name || data.mvpQuote.comment) ? (
          <div className="card aw-mvp" style={{ marginTop: 14 }}>
            <div className="aw-mvp__body">
              <div
                className="aw-hero__eyebrow"
                style={{ color: "var(--cafe-blue)", marginBottom: 8 }}
              >
                MVP 코멘트
              </div>
              {data.mvpQuote.comment ? (
                <p style={{ fontSize: 16, lineHeight: 1.6 }}>“{data.mvpQuote.comment}”</p>
              ) : null}
              <div className="aw-mvp__team" style={{ marginTop: 8 }}>
                {data.mvpQuote.name ?? "—"}
                {data.mvpQuote.teamName ? ` · ${data.mvpQuote.teamName}` : ""}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

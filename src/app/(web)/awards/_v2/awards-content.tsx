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

import type { AwardsDataDTO, PlayerRefDTO } from "../page";

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

  // 베스트5 슬롯 — DTO leaders 3명 실데이터 매핑. 포지션별 best5 데이터 없음 →
  // 부문 라벨(득점/어시/리바)로 채우고 나머지 2슬롯은 준비 중(mock 금지).
  const best5Slots: { label: string; player: PlayerRefDTO | null }[] = [
    { label: "득점", player: data.scoringLeader },
    { label: "어시", player: data.assistsLeader },
    { label: "리바", player: data.reboundsLeader },
    { label: "수비", player: null },
    { label: "신인", player: null },
  ];

  // 부문별 수상 — scoring/assists/rebounds 실데이터, 나머지는 DTO 미지원(준비 중).
  const catSlots: {
    ico: string;
    label: string;
    player: PlayerRefDTO | null;
    suffix: string;
  }[] = [
    { ico: "sports_score", label: "득점왕", player: data.scoringLeader, suffix: "PPG" },
    { ico: "volunteer_activism", label: "어시스트왕", player: data.assistsLeader, suffix: "APG" },
    { ico: "open_with", label: "리바운드왕", player: data.reboundsLeader, suffix: "RPG" },
    { ico: "bolt", label: "스틸왕", player: null, suffix: "SPG" },
    { ico: "trending_up", label: "레이팅 상승", player: null, suffix: "" },
    { ico: "handshake", label: "매너상", player: null, suffix: "" },
  ];

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
          {best5Slots.map((slot, i) => (
            <div key={i} className="aw-p">
              <div className="aw-p__pos">{slot.label}</div>
              {slot.player ? (
                <>
                  <div className="aw-p__av">{initial(slot.player.name)}</div>
                  <div className="aw-p__name">{slot.player.name}</div>
                  <div className="aw-p__team">{slot.player.teamName ?? "—"}</div>
                  <div className="aw-p__stat">
                    {fmtMetric(slot.player.metricValue, slot.player.metricLabel)}
                  </div>
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
                {c.player ? (
                  <>
                    <div className="aw-cat__name">{c.player.name}</div>
                    <div className="aw-cat__sub">{c.player.teamName ?? "—"}</div>
                  </>
                ) : (
                  <>
                    <div className="aw-cat__name" style={{ color: "var(--ink-mute)" }}>준비 중</div>
                    <div className="aw-cat__sub">집계 예정</div>
                  </>
                )}
              </div>
              <div className="aw-cat__v">
                {c.player ? fmtMetric(c.player.metricValue, "").trim() || "—" : "—"}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

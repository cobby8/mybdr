"use client";

/* ============================================================
 * NewsContent — /news IU2 v2.30 박제 (BDR NEWS 매거진 메인)
 *
 * 왜 IU2 재박제:
 * - 시안 Dev/design/BDR-current/screens/News.jsx (BDR v2.30 · IU2 · Phase 10B) 톤 박제.
 * - 카테고리 chip + 트렌딩 spotlight + 카드 grid + NEW badge(created_at 기준 UI 처리).
 *
 * 데이터/Props 무변경:
 * - page.tsx 서버 데이터(community_posts category=news, status=published 쿼리)·
 *   NewsItem 인터페이스 그대로 사용. schema/api/데이터 패칭 0 변경. UI 렌더링만 교체.
 *
 * ★ 운영 데이터 기반 카테고리 (mock 금지):
 * - 시안 5종 chip(전체/매치 단신/매거진/공지/이벤트) 중, community_posts 에 실제
 *   존재하는 종류만 노출한다. 알기자 기사 period_type = "match" | "round" | "daily".
 *     · period_type="match" (tournament_match_id 有)  → "매치 단신"
 *     · period_type="round"/"daily" (종합 기사)       → "매거진"
 *   공지/이벤트는 news 카테고리에 데이터 소스가 없어 chip 자체를 omit (mock 금지).
 *   해당 종류 데이터가 추후 생기면 chip 자동 노출되도록 countByCat 으로 0건 chip 숨김.
 *
 * NEW badge: created_at 이 7일 이내면 표시 (신규 컬럼 X — UI 판정만).
 * trending spotlight: view_count 최다 글 (없으면 첫 글).
 * cross-domain: 카드 클릭 → /news/match/{matchId} (E2 단신 상세, linkify 는 상세에서 처리).
 * ============================================================ */

import { useMemo, useState } from "react";
import Link from "next/link";

// ---- 서버 → 클라 데이터 타입 (page.tsx 와 일치 — 변경 금지) ----
export interface NewsItem {
  id: string;
  title: string;
  preview: string;
  date: string; // 표시용 "6월 14일" 등
  isNew: boolean; // created_at 7일 이내 (서버에서 판정)
  views: number;
  likes: number;
  comments: number;
  matchId: string | null; // tournament_match_id (있으면 단신 상세 link)
  cat: "match" | "magazine"; // period_type 파생 (운영 데이터 기반)
}

// 카테고리 chip 정의 — 시안 NEWS_CATS carry.
// 공지/이벤트는 데이터 소스가 없어 제외 (mock 금지). 0건이면 런타임에서 추가 숨김.
const CATS: { key: "all" | "match" | "magazine"; label: string; ico: string }[] = [
  { key: "all", label: "전체", ico: "list" },
  { key: "match", label: "매치 단신", ico: "sports_basketball" },
  { key: "magazine", label: "매거진", ico: "photo" },
];

// 카테고리별 태그 라벨/클래스 (시안 catTag 답습)
function catTag(c: NewsItem["cat"]): { cls: string; label: string } {
  if (c === "match") return { cls: "nw-tag--match", label: "매치 단신" };
  return { cls: "nw-tag--news", label: "매거진" };
}

export function NewsContent({ items }: { items: NewsItem[] }) {
  const [cat, setCat] = useState<"all" | "match" | "magazine">("all");

  // 카테고리별 건수 (chip count 배지 + 0건 chip 숨김 판정)
  const countByCat = useMemo(() => {
    const m: Record<string, number> = { all: items.length, match: 0, magazine: 0 };
    items.forEach((n) => {
      m[n.cat] = (m[n.cat] ?? 0) + 1;
    });
    return m;
  }, [items]);

  // 현재 chip 으로 필터된 글
  const rows = useMemo(
    () => (cat === "all" ? items : items.filter((n) => n.cat === cat)),
    [items, cat],
  );

  // 트렌딩 spotlight = view 최다 (없으면 첫 글). 나머지는 grid 카드.
  const spotlight = useMemo(() => {
    if (rows.length === 0) return null;
    return rows.reduce((best, n) => (n.views > best.views ? n : best), rows[0]);
  }, [rows]);
  const rest = useMemo(
    () => rows.filter((n) => n !== spotlight),
    [rows, spotlight],
  );

  return (
    <div className="page">
      <div className="page__inner" style={{ maxWidth: 1080 }}>
        {/* 헤더 */}
        <header className="nw-head">
          <div className="nw-head__row">
            <h1 className="nw-head__title">BDR NEWS</h1>
            <span className="nw-head__by">
              <span className="ico material-symbols-outlined" style={{ fontSize: 14 }}>
                smart_toy
              </span>
              알기자 · BDR NEWS AI
            </span>
          </div>
          <p className="nw-head__sub">
            매치 종료 후 AI 기자 <b>알기자</b>가 자동으로 작성하고, 운영자 검수 후 발행되는
            BDR 동호회 단신·매거진입니다.
          </p>
        </header>

        {items.length === 0 ? (
          // 빈 상태 — 발행 기사 없음 (mock 금지)
          <div
            className="card"
            style={{ padding: 48, textAlign: "center", color: "var(--ink-mute)" }}
          >
            아직 발행된 기사가 없습니다.
          </div>
        ) : (
          <>
            {/* 카테고리 chip — 0건 chip 은 숨김(전체 제외) */}
            <div className="nw-cats">
              {CATS.filter(
                (c) => c.key === "all" || (countByCat[c.key] ?? 0) > 0,
              ).map((c) => (
                <button
                  key={c.key}
                  type="button"
                  className={"nw-cat" + (cat === c.key ? " is-on" : "")}
                  onClick={() => setCat(c.key)}
                >
                  <span className="ico material-symbols-outlined" style={{ fontSize: 15 }}>
                    {c.ico}
                  </span>
                  {c.label}
                  <span className="nw-cat__count">{countByCat[c.key] ?? 0}</span>
                </button>
              ))}
            </div>

            {/* 카드 grid */}
            <div className="nw-grid">
              {/* 트렌딩 spotlight */}
              {spotlight && (
                <Link
                  className="nw-spotlight"
                  href={spotlight.matchId ? `/news/match/${spotlight.matchId}` : "/news"}
                >
                  <div className="nw-spotlight__cover">
                    <span className="ico material-symbols-outlined">
                      {spotlight.cat === "match" ? "sports_basketball" : "photo"}
                    </span>
                  </div>
                  <div className="nw-spotlight__body">
                    <div className="nw-spotlight__eyebrow">
                      <span
                        className="ico material-symbols-outlined"
                        style={{ fontSize: 14 }}
                      >
                        local_fire_department
                      </span>
                      트렌딩 · 가장 많이 본 기사
                    </div>
                    <div className="nw-spotlight__title">{spotlight.title}</div>
                    <p className="nw-spotlight__preview">{spotlight.preview}</p>
                    <div className="nw-spotlight__foot">
                      <span>
                        <span
                          className="ico material-symbols-outlined"
                          style={{ fontSize: 15 }}
                        >
                          visibility
                        </span>
                        {spotlight.views.toLocaleString()}
                      </span>
                      <span>
                        <span
                          className="ico material-symbols-outlined"
                          style={{ fontSize: 15 }}
                        >
                          favorite
                        </span>
                        {spotlight.likes}
                      </span>
                      <span>
                        <span
                          className="ico material-symbols-outlined"
                          style={{ fontSize: 15 }}
                        >
                          chat_bubble
                        </span>
                        {spotlight.comments}
                      </span>
                      <span style={{ marginLeft: "auto" }}>{spotlight.date}</span>
                    </div>
                  </div>
                </Link>
              )}

              {/* 나머지 카드 */}
              {rest.map((n) => {
                const t = catTag(n.cat);
                return (
                  <Link
                    key={n.id}
                    className="nw-card"
                    href={n.matchId ? `/news/match/${n.matchId}` : "/news"}
                  >
                    <div className="nw-card__cover">
                      <span className="nw-card__cover-icon material-symbols-outlined">
                        {n.cat === "match" ? "sports_basketball" : "photo"}
                      </span>
                      {n.isNew && (
                        <span className="nw-card__cover-tag">
                          <span className="nw-tag nw-tag--new">NEW</span>
                        </span>
                      )}
                    </div>
                    <div className="nw-card__body">
                      <div className="nw-card__meta-top">
                        <span className={"nw-tag " + t.cls}>{t.label}</span>
                        <span className="nw-card__date">{n.date}</span>
                      </div>
                      <div className="nw-card__title">{n.title}</div>
                      <p className="nw-card__preview">{n.preview}</p>
                      <div className="nw-card__foot">
                        <span>
                          <span
                            className="ico material-symbols-outlined"
                            style={{ fontSize: 14 }}
                          >
                            visibility
                          </span>
                          {n.views.toLocaleString()}
                        </span>
                        <span>
                          <span
                            className="ico material-symbols-outlined"
                            style={{ fontSize: 14 }}
                          >
                            favorite
                          </span>
                          {n.likes}
                        </span>
                        <span>
                          <span
                            className="ico material-symbols-outlined"
                            style={{ fontSize: 14 }}
                          >
                            chat_bubble
                          </span>
                          {n.comments}
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </>
        )}

        {/* 푸터 안내 */}
        <footer className="nw-footer">
          BDR NEWS는 AI 기자 알기자가 매치 종료 후 자동으로 작성한 기사이며, 운영자 검수 후
          발행됩니다.
          <br />
          사실 오류는 <Link href="/help">문의하기</Link>로 알려주세요.
        </footer>
      </div>
    </div>
  );
}

"use client";

/* ============================================================
 * SavedContent — /saved v2.31 클라이언트 (탭 + 카드 그리드)
 *
 * Phase 12 Batch B (v2.31): 시각만 시안 .sv-* / .ex-tabs 로 교체.
 * 데이터패칭·인증·IDOR·직렬화는 page.tsx(server)가 전담 → 본 파일은 시각만.
 *
 * 왜 클라이언트:
 * - 7탭 필터링 = useState 단일 상태. 서버에서 전체 prefetch, 클라는 활성 탭 섹션만 표시.
 *
 * 데이터 가용성(실모델 우선):
 *   - 게시판(boards) ← board_favorites 실데이터  → 코트 .sv-grid-3 타일
 *   - 코트(courts)   ← user_favorite_courts 실데이터 → 코트 .sv-grid-3 타일
 *   - 게시글/경기/대회/팀 ← DB 모델 없음 → 빈 배열, .ex-empty "북마크 시스템 준비 중"
 *   - 시안 더미(games/tns/teams/MONKEYZ 등) 박제 금지 — 실데이터만 타일로.
 *
 * 디자인:
 *   - .ex-page-w / .ex-crumb / .ex-head / .ex-tabs / .ex-sec / .sv-grid-3 / .sv-tile / .ex-empty
 *   - 토큰만(globals.css Batch B 이식분). 하드코딩 hex / lucide / pill 9999 없음.
 * ============================================================ */

import { useState, useMemo } from "react";
import Link from "next/link";

// ---- 서버 → 클라 데이터 타입 (page.tsx 와 일치 — 변경 금지) ----
export interface SavedBoard {
  id: string;
  category: string; // 슬러그 (notice/general/...)
  label: string;    // 한글 라벨
  savedAt: string;  // ISO
}

export interface SavedCourt {
  id: string;
  courtPublicId: string; // 상세 페이지 링크용
  name: string;
  area: string | null;
  indoor: boolean | null;
  rentalFee: number | null;
  openingHours: string | null;
  nickname: string | null;
  useCount: number;
  savedAt: string; // ISO (last_used_at 또는 created_at)
}

export interface SavedContentProps {
  boards: SavedBoard[];
  courts: SavedCourt[];
}

// 7탭 정의 — 전체/게시글/게시판/경기/대회/팀/코트
type TabId = "all" | "posts" | "boards" | "games" | "tourney" | "teams" | "courts";

// "북마크 시스템 준비 중" 안내가 필요한 미지원 탭
const PENDING_TABS: TabId[] = ["posts", "games", "tourney", "teams"];

// ISO → "YYYY.MM.DD" mono 표기
function fmtDate(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "-";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}.${m}.${day}`;
}

export function SavedContent({ boards, courts }: SavedContentProps) {
  const [tab, setTab] = useState<TabId>("all");

  // 탭별 카운트(=총 항목 수). 미지원 탭은 0.
  const counts = useMemo(
    () => ({
      all: boards.length + courts.length,
      posts: 0,
      boards: boards.length,
      games: 0,
      tourney: 0,
      teams: 0,
      courts: courts.length,
    }),
    [boards.length, courts.length]
  );

  // 탭별 표시 여부 (전체 탭일 때는 "데이터가 있는 섹션"만 표시)
  const showBoards = (tab === "all" && boards.length > 0) || tab === "boards";
  const showCourts = (tab === "all" && courts.length > 0) || tab === "courts";

  // 미지원 탭(전용 탭 클릭 시) → 안내 카드 표시
  const showPending = PENDING_TABS.includes(tab);

  // 전체 비어 있고 전체 탭일 때만 글로벌 빈상태
  const isAllEmpty = tab === "all" && boards.length === 0 && courts.length === 0;

  // 탭 정의 (label + count) — .ex-tabs 박제
  const tabs: { id: TabId; label: string }[] = [
    { id: "all", label: "전체" },
    { id: "posts", label: "게시글" },
    { id: "boards", label: "게시판" },
    { id: "games", label: "경기" },
    { id: "tourney", label: "대회" },
    { id: "teams", label: "팀" },
    { id: "courts", label: "코트" },
  ];

  return (
    <div className="page">
      <div className="ex-page-w page__inner--wide">
        {/* breadcrumb */}
        <div className="ex-crumb">
          <Link href="/">홈</Link>
          <span className="sep">›</span>
          <span className="cur">보관함</span>
        </div>

        {/* 헤더 — 타이틀 + 액션 */}
        <div className="ex-head">
          <div>
            <div className="eyebrow">SAVED · 보관함</div>
            <h1 className="ex-head__title">저장한 항목</h1>
            <p className="ex-head__sub">북마크한 게시판과 코트를 한 곳에서 모아 보세요.</p>
          </div>
          {/* 내보내기 / 폴더 관리 — 추후 구현. 현재는 disabled */}
          <div className="ex-head__actions">
            <button type="button" className="btn btn--sm" disabled title="준비 중">
              내보내기
            </button>
            <button type="button" className="btn btn--sm" disabled title="준비 중">
              폴더 관리
            </button>
          </div>
        </div>

        {/* 탭 — .ex-tabs (활성 시 accent 언더라인) */}
        <div className="ex-tabs">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              className={"ex-tab" + (tab === t.id ? " is-on" : "")}
              onClick={() => setTab(t.id)}
            >
              {t.label}
              <span className="ex-tab__n">{counts[t.id]}</span>
            </button>
          ))}
        </div>

        {/* ====== 게시판 섹션 (board_favorites 실데이터) ====== */}
        {showBoards && (
          <div className="ex-sec">
            {tab === "all" && (
              <h2 className="ex-sec__h">
                게시판 <span className="n">{boards.length}</span>
              </h2>
            )}
            <div className="sv-grid-3">
              {boards.map((b) => (
                <Link key={b.id} href={`/community?category=${b.category}`} className="sv-tile">
                  <div className="sv-tile__top">
                    <div className="sv-tile__title" style={{ marginBottom: 0 }}>
                      {b.label}
                    </div>
                    {/* 북마크됨 표시 (토글 동작은 추후) */}
                    <span
                      className="sv-tile__bm material-symbols-outlined"
                      aria-label="북마크됨"
                      title="북마크됨"
                    >
                      bookmark
                    </span>
                  </div>
                  <div className="sv-tile__date">
                    <span className="ico material-symbols-outlined">event</span>
                    저장 {fmtDate(b.savedAt)}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* ====== 코트 섹션 (user_favorite_courts 실데이터) ====== */}
        {showCourts && (
          <div className="ex-sec">
            {tab === "all" && (
              <h2 className="ex-sec__h">
                코트 <span className="n">{courts.length}</span>
              </h2>
            )}
            <div className="sv-grid-3">
              {courts.map((c) => (
                <Link key={c.id} href={`/courts/${c.courtPublicId}`} className="sv-tile">
                  <div className="sv-tile__top">
                    <div className="sv-tile__title" style={{ marginBottom: 0 }}>
                      {c.nickname ? c.nickname : c.name}
                      {/* 별칭 사용 시 본명을 보조로 노출 */}
                      {c.nickname && (
                        <span
                          style={{
                            fontSize: 11,
                            color: "var(--ink-dim)",
                            fontWeight: 500,
                            marginLeft: 6,
                          }}
                        >
                          ({c.name})
                        </span>
                      )}
                    </div>
                    <span
                      className="sv-tile__bm material-symbols-outlined"
                      aria-label="북마크됨"
                      title="북마크됨"
                    >
                      bookmark
                    </span>
                  </div>
                  {/* 지역 */}
                  {c.area && (
                    <div style={{ fontSize: 12, color: "var(--ink-mute)", marginBottom: 8 }}>
                      {c.area}
                    </div>
                  )}
                  {/* 메타 — 운영시간/요금/실내외 */}
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 12,
                      fontFamily: "var(--ff-mono)",
                      fontSize: 11,
                      color: "var(--ink-dim)",
                    }}
                  >
                    {c.openingHours && <span>{c.openingHours}</span>}
                    {c.rentalFee != null && (
                      <span>{c.rentalFee === 0 ? "무료" : `₩${c.rentalFee.toLocaleString()}`}</span>
                    )}
                    {c.indoor != null && <span>{c.indoor ? "실내" : "실외"}</span>}
                  </div>
                  {/* 사용 횟수 + 저장일 */}
                  <div className="sv-tile__date" style={{ justifyContent: "space-between" }}>
                    <span>사용 {c.useCount}회</span>
                    <span>저장 {fmtDate(c.savedAt)}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* ====== 미지원 탭 안내 (게시글/경기/대회/팀) ====== */}
        {showPending && (
          <div className="card">
            <div className="ex-empty">
              <span className="ico material-symbols-outlined">construction</span>
              <div className="ex-empty__t">북마크 시스템 준비 중</div>
              <div className="ex-empty__d">
                {tab === "posts" && "게시글 북마크 기능은 곧 추가됩니다."}
                {tab === "games" && "경기 북마크 기능은 곧 추가됩니다."}
                {tab === "tourney" && "대회 북마크 기능은 곧 추가됩니다."}
                {tab === "teams" && "팀 팔로우 기능은 곧 추가됩니다."}
              </div>
            </div>
          </div>
        )}

        {/* ====== 전체 탭 + 데이터 0건 빈상태 ====== */}
        {isAllEmpty && (
          <div className="card">
            <div className="ex-empty">
              <span className="ico material-symbols-outlined">bookmark_border</span>
              <div className="ex-empty__t">아직 보관한 항목이 없어요</div>
              <div className="ex-empty__d">
                관심있는 게시판·코트를 북마크하면 여기에서 모아볼 수 있습니다.
              </div>
            </div>
          </div>
        )}

        {/* ====== 게시판 전용 탭 + 0건 ====== */}
        {tab === "boards" && boards.length === 0 && (
          <div className="card">
            <div className="ex-empty">
              <span className="ico material-symbols-outlined">forum</span>
              <div className="ex-empty__t">즐겨찾는 게시판이 없어요</div>
              <div className="ex-empty__d">커뮤니티에서 게시판을 추가해보세요.</div>
            </div>
          </div>
        )}

        {/* ====== 코트 전용 탭 + 0건 ====== */}
        {tab === "courts" && courts.length === 0 && (
          <div className="card">
            <div className="ex-empty">
              <span className="ico material-symbols-outlined">place</span>
              <div className="ex-empty__t">즐겨찾는 코트가 없어요</div>
              <div className="ex-empty__d">
                코트 페이지에서 자주 가는 코트를 등록해보세요.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

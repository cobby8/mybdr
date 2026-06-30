"use client";

/* ============================================================
 * HomeBoardFeed — 홈 "방금 올라온 글" 탭 필터 피드
 *
 * 시안: Dev/design/BDR-current/screens/Home.jsx L638~729 (NewsFeed)
 *
 * 왜 클라이언트 컴포넌트인가:
 *   탭 필터(전체/자유/매치/팀원/후기) 가 useState를 사용하기 때문.
 *   데이터는 부모 서버 컴포넌트(page.tsx)에서 prefetchCommunity로
 *   가져온 latestPosts를 props로 받는다 — 신규 fetch 0.
 *
 * 디자인 토큰: var(--*) DS v4 전용. 하드코딩 색상 0.
 * 아이콘: Material Symbols Outlined (lucide 금지).
 * ============================================================ */

import { useState } from "react";
import Link from "next/link";

export interface BoardPost {
  id: string;
  public_id: string | null;
  title: string;
  category: string | null;
  view_count: number;
  comments_count: number;
  created_at: string | null;
  author_nickname: string;
}

const TABS: { id: string; label: string }[] = [
  { id: "all", label: "전체" },
  { id: "free", label: "자유" },
  { id: "match", label: "매치" },
  { id: "team", label: "팀원" },
  { id: "review", label: "후기" },
];

/* 카테고리 코드 → 한글 라벨 */
const BOARD_LABELS: Record<string, string> = {
  free: "자유",
  notice: "공지",
  qna: "Q&A",
  match: "매치",
  team: "팀원",
  review: "후기",
};

/* 짧은 날짜 포맷 "MM-DD" */
function formatShortDate(iso: string | null): string {
  if (!iso) return "";
  return iso.slice(5, 10);
}

/* 24시간 이내 여부 (NEW 뱃지) */
function isWithin24h(iso: string | null): boolean {
  if (!iso) return false;
  const diff = Date.now() - new Date(iso).getTime();
  return diff >= 0 && diff < 24 * 60 * 60 * 1000;
}

export function HomeBoardFeed({ posts }: { posts: BoardPost[] }) {
  const [tab, setTab] = useState<string>("all");

  const filtered =
    tab === "all" ? posts : posts.filter((p) => p.category === tab);

  return (
    <section style={{ marginTop: 24 }}>
      {/* 섹션 헤더 — 시안 L653~665 */}
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          marginBottom: 12,
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <div>
          <div className="eyebrow">COMMUNITY · 방금</div>
          <h3
            style={{
              margin: "4px 0 0",
              fontSize: 18,
              fontWeight: 800,
              letterSpacing: "-0.01em",
            }}
          >
            방금 올라온 글
          </h3>
        </div>
        <Link
          href="/community"
          style={{
            fontSize: 12,
            color: "var(--ink-mute)",
            textDecoration: "none",
            flex: "0 0 auto",
          }}
        >
          전체 보기 →
        </Link>
      </div>

      {/* 탭 필터 chips — 시안 L667~684 */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              background:
                tab === t.id ? "var(--cafe-blue-soft)" : "transparent",
              color:
                tab === t.id ? "var(--cafe-blue-deep)" : "var(--ink-mute)",
              border: `1px solid ${
                tab === t.id ? "var(--cafe-blue-hair)" : "var(--border)"
              }`,
              borderRadius: "var(--radius-chip)",
              padding: "5px 11px",
              minHeight: 36,
              fontSize: 12,
              fontWeight: tab === t.id ? 700 : 500,
              cursor: "pointer",
              whiteSpace: "nowrap",
              fontFamily: "inherit",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* 피드 카드 — 시안 L686~728 */}
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        {filtered.length === 0 ? (
          <div
            style={{
              padding: "40px 20px",
              textAlign: "center",
              color: "var(--ink-mute)",
              fontSize: 13,
            }}
          >
            아직 새 글이 없습니다.
          </div>
        ) : (
          filtered.map((p, i) => (
            <Link
              key={p.id}
              href={`/community/${p.public_id ?? p.id}`}
              style={{
                display: "grid",
                gridTemplateColumns: "auto 1fr",
                gap: 12,
                alignItems: "center",
                padding: "12px 16px",
                borderBottom:
                  i < filtered.length - 1 ? "1px solid var(--border)" : "none",
                color: "var(--ink)",
                textDecoration: "none",
              }}
            >
              {/* 카테고리 배지 */}
              <span className="badge badge--soft" style={{ flex: "0 0 auto" }}>
                {BOARD_LABELS[p.category ?? ""] ?? "자유"}
              </span>

              {/* 제목 + 메타 */}
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 500,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    marginBottom: 2,
                  }}
                >
                  {p.title}
                  {p.comments_count > 0 && (
                    <span
                      style={{
                        color: "var(--accent)",
                        fontWeight: 700,
                        fontSize: 12,
                        marginLeft: 4,
                      }}
                    >
                      [{p.comments_count}]
                    </span>
                  )}
                  {isWithin24h(p.created_at) && (
                    <span
                      className="badge badge--new"
                      style={{ marginLeft: 6 }}
                    >
                      N
                    </span>
                  )}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: "var(--ink-dim)",
                    display: "flex",
                    gap: 6,
                    alignItems: "center",
                  }}
                >
                  <span>{p.author_nickname}</span>
                  <span>·</span>
                  <span style={{ fontFamily: "var(--ff-mono)" }}>
                    {formatShortDate(p.created_at)}
                  </span>
                  <span>·</span>
                  <span style={{ fontFamily: "var(--ff-mono)" }}>
                    조회 {p.view_count}
                  </span>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </section>
  );
}

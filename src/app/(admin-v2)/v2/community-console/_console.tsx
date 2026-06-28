"use client";

// ============================================================
// _console.tsx — R2-C 커뮤니티 콘솔(BO-3) 클라. 정본 bo-pages ConsolePage 1:1.
//   탭 4(자유/모집/후기/건의). 자유·모집·후기 = community_posts(category),
//   건의 = suggestions 모델. 리스트 데이터는 서버에서 실 Prisma 매핑되어 props 로
//   전달(추가 fetch 0). 행 클릭 = SchemaList 기본 드로어(정본 커스텀 상세 없음).
// ============================================================

import React from "react";
import { SchemaList, type Schema, type SchemaCol, type SchemaRow } from "@/components/admin-v2";
import type { AdminBoPostRow, AdminBoSuggestionRow } from "@/lib/admin-v2/data";

// ── 컬럼 정의(정본 bo-data _board / suggestions 1:1, mock 제외) ──
// 게시판 3종 공통 컬럼(정본 _board): 게시글 / 반응 / 상태 / 액션
const BOARD_COLS: SchemaCol[] = [
  { key: "name", label: "게시글", w: "minmax(0,2.4fr)", type: "title" },
  { key: "engage", label: "반응", w: "120px", align: "center", type: "mono" },
  { key: "status", label: "상태", w: "96px", align: "center", type: "badge" },
  { key: "act", label: "", w: "60px", align: "right", type: "actions" },
];
// 건의(제안) 컬럼(정본 suggestions에서 votes 제외 — DB 미지원)
const SUGGEST_COLS: SchemaCol[] = [
  { key: "name", label: "제안", w: "minmax(0,2.2fr)", type: "title" },
  { key: "category", label: "분류", w: "minmax(0,1fr)", type: "badge" },
  { key: "status", label: "상태", w: "100px", align: "center", type: "status" },
  { key: "act", label: "", w: "60px", align: "right", type: "actions" },
];

// 탭 정의(정본 communityConsole.tabs 라벨 1:1)
const TABS = [
  { id: "free", label: "자유게시판" },
  { id: "recruit", label: "팀원 모집" },
  { id: "review", label: "후기" },
  { id: "suggestions", label: "제안" },
] as const;
type TabId = (typeof TABS)[number]["id"];

export function CommunityConsole({
  free,
  recruit,
  review,
  suggestions,
}: {
  free: AdminBoPostRow[];
  recruit: AdminBoPostRow[];
  review: AdminBoPostRow[];
  suggestions: AdminBoSuggestionRow[];
}) {
  const [tab, setTab] = React.useState<TabId>("free");

  // ── 탭별 스키마(정본 _board head/sub 1:1) ──
  const schema: Schema = React.useMemo(() => {
    // 게시판 공통 스키마 빌더
    const board = (head: string, name: string, rows: AdminBoPostRow[]): Schema => ({
      head,
      sub: `${name} 게시글·댓글과 신고를 관리합니다.`,
      cols: BOARD_COLS,
      rows: rows as unknown as SchemaRow[],
    });
    if (tab === "recruit") return board("팀원 모집", "팀원 모집 게시판의", recruit);
    if (tab === "review") return board("후기", "후기 게시판의", review);
    if (tab === "suggestions") {
      return {
        head: "제안 관리",
        sub: "사용자 기능 제안·피드백을 관리합니다.",
        cols: SUGGEST_COLS,
        rows: suggestions as unknown as SchemaRow[],
      };
    }
    return board("자유게시판", "자유게시판의", free);
  }, [tab, free, recruit, review, suggestions]);

  return (
    <div>
      <div className="bo-constabs">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            className="bo-constab"
            data-on={tab === t.id ? "true" : "false"}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>
      <SchemaList schema={schema} eyebrow="커뮤니티 콘솔" />
    </div>
  );
}

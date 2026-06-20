"use client";

// 2026-05-04: (web) community 디자인 시스템 통일 (Phase C-1)
// - <Card> wrapper 제거 → 직접 .admin-table-wrap (5/2 통일된 board 톤)
// - <Badge> → .badge--soft (web 동일 클래스)
// - admin-table 은 이미 5/2 작업으로 (web) .board.data-table 톤 정합 (globals.css L2174~)
//
// 2026-05-15 Admin-4-C 박제 — 카테고리/상태 뱃지를 admin-stat-pill[data-tone] 으로 통일
//   시안 source: Dev/design/BDR-current/screens/AdminCommunity.jsx (v2.9)
//   - 카테고리 뱃지: badge--soft → admin-stat-pill data-tone="mute" (시안 type_label 박제)
//   - 상태 뱃지: 신규 추가 (hidden=warn / 그 외=ok). 시안 status_tone 패턴 일관
//
// 2026-05-31 5C-5 CA1 박제 (BDR v2.23 · BC6 · OA1 답습)
//   시안 source: Dev/design/BDR-current/screens/AdminCommunity.jsx (v2.23)
//   - Hero 4-stat (전체/핀/신고/삭제됨) — posts 배열 실측 집계. 추가 쿼리 0
//     · 핀: community_posts에 핀 필드 부재 → "—" hide (mock 0)
//     · 신고: 신고(Report) 데이터 모델 운영 부재 (A2 lock) → "—" hide
//   - 상태 탭: 시안 활성/핀/신고/삭제됨 → 운영 활성/삭제됨 2탭만 (핀·신고 hide)
//   - 카테고리 chip 필터: 동적 (운영 레거시 taxonomy — 존재 카테고리만)
//   - 모달: 삭제됨 글 = 복구버튼 hide(복구 액션 부재) / 핀버튼·알림 체크박스 hide
//   - page.tsx 서버쿼리·requireSuperAdmin·hide/unhide/delete 3 액션 0 변경

import { useState } from "react";
import { AdminStatusTabs } from "@/components/admin/admin-status-tabs";
import {
  AdminDetailModal,
  ModalInfoSection,
} from "@/components/admin/admin-detail-modal";
// Phase 1 (Toss 전환) — Material Symbols → lucide(<Icon>)
import { Icon } from "@/components/admin-toss";

// 2026-05-15 Admin-4-C 박제 — 상태별 admin-stat-pill data-tone 매핑
//   hidden 일 때만 warn(주황), 정상 게시는 ok(녹) (시안 v2.9 status_tone 패턴 박제)
const STATUS_LABEL: Record<string, string> = {
  published: "게시중",
  hidden: "숨김",
  deleted: "삭제됨",
};
const STATUS_TONE: Record<string, "ok" | "warn" | "mute" | "err"> = {
  published: "ok",
  hidden: "warn",
  deleted: "err",
};

// 서버에서 직렬화된 게시글 타입
interface SerializedPost {
  id: string;
  publicId: string | null;
  title: string;
  category: string | null;
  viewCount: number;
  commentsCount: number;
  likesCount: number;
  status: string | null;
  createdAt: string;
  authorName: string | null;
  authorEmail: string | null;
}

// 카테고리 한글 매핑
const CATEGORY_LABEL: Record<string, string> = {
  general: "자유게시판",
  recruit: "팀원모집",
  review: "대회후기",
  info: "정보공유",
  qna: "질문답변",
  notice: "공지사항",
  marketplace: "농구장터",
};

interface Props {
  posts: SerializedPost[];
  hidePostAction: (formData: FormData) => Promise<void>;
  unhidePostAction: (formData: FormData) => Promise<void>;
  deletePostAction: (formData: FormData) => Promise<void>;
}

export function AdminCommunityContent({
  posts,
  hidePostAction,
  unhidePostAction,
  deletePostAction,
}: Props) {
  // 5C-5 CA1 — 상태 탭(활성/삭제됨) + 카테고리 chip 필터 분리
  //   시안의 status 탭(활성/핀/신고/삭제됨) 중 핀·신고는 hide → 활성/삭제됨 2탭만
  const [statusTab, setStatusTab] = useState("active");
  const [catFilter, setCatFilter] = useState("all");
  const [selected, setSelected] = useState<SerializedPost | null>(null);

  // 5C-5 CA1 — Hero 4-stat 실측 집계 (posts 배열 기준, 추가 쿼리 0)
  //   삭제됨 = status "deleted" / 활성 = 그 외(published·hidden·draft 등)
  const deletedPosts = posts.filter((p) => p.status === "deleted");
  const activePosts = posts.filter((p) => p.status !== "deleted");

  // 5C-5 CA1 — 상태 탭으로 1차 분류 후, 카테고리 chip으로 2차 필터
  const tabPosts = statusTab === "deleted" ? deletedPosts : activePosts;
  const filtered =
    catFilter === "all"
      ? tabPosts
      : tabPosts.filter((p) => p.category === catFilter);

  // 5C-5 CA1 — 상태 탭 (활성/삭제됨 2탭). 시안 핀·신고 탭은 데이터/모델 부재로 hide
  const statusTabs = [
    { key: "active", label: "활성", count: activePosts.length },
    { key: "deleted", label: "삭제됨", count: deletedPosts.length },
  ];

  // 5C-5 CA1 — 카테고리 chip: 동적 (운영 레거시 taxonomy — 현재 탭에 존재하는 카테고리만)
  const categoryKeys = [
    ...new Set(tabPosts.map((p) => p.category).filter(Boolean)),
  ] as string[];
  const catChips = [
    { key: "all", label: "전체" },
    ...categoryKeys.map((key) => ({
      key,
      label: CATEGORY_LABEL[key] ?? key,
    })),
  ];

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString("ko-KR");

  return (
    <>
      {/* 5C-5 CA1 — Hero 4-stat (전체/핀/신고/삭제됨) 실측 집계. 핀·신고는 데이터/모델 부재 "—" hide
          OA1(단체 관리) Hero 4분면 grid 패턴 답습 */}
      <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[
          { label: "전체", value: posts.length, tone: "ok" as const },
          // 핀: community_posts 핀 필드 부재 → mock 0 → "—"
          { label: "핀", value: "—", tone: "mute" as const },
          // 신고: 신고(Report) 모델 운영 부재 (A2 lock) → "—"
          { label: "신고", value: "—", tone: "mute" as const },
          { label: "삭제됨", value: deletedPosts.length, tone: "err" as const },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-md border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-3"
          >
            {/* 숫자: 상태별 토큰 색 (OA1 Hero stat 톤 매핑 동일) */}
            <div
              className="text-2xl font-black tabular-nums"
              style={{
                color:
                  s.tone === "ok"
                    ? "var(--color-success)"
                    : s.tone === "err"
                      ? "var(--color-error)"
                      : "var(--color-text-muted)",
              }}
            >
              {s.value}
            </div>
            <div className="mt-0.5 text-xs font-medium text-[var(--color-text-muted)]">
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {/* 5C-5 CA1 — 상태 탭 (활성/삭제됨). 탭 전환 시 카테고리 필터 초기화 */}
      <AdminStatusTabs
        tabs={statusTabs}
        activeTab={statusTab}
        onChange={(k) => {
          setStatusTab(k);
          setCatFilter("all");
        }}
      />

      {/* 5C-5 CA1 — 카테고리 chip 필터 (동적, 운영 레거시 taxonomy). (web) .btn 패턴 */}
      <div className="mb-4 flex flex-wrap gap-2">
        {catChips.map((c) => (
          <button
            key={c.key}
            onClick={() => setCatFilter(c.key)}
            className={`btn btn--sm ${catFilter === c.key ? "btn--primary" : ""}`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* 2026-05-04: <Card> wrapper 제거 — (web) board 와 동일 단순 구조 */}
      <div className="overflow-x-auto admin-table-wrap">
        {/* admin-table: 모바일 ≤720px 카드 변환 (globals.css [Admin Phase B]) */}
        <table className="admin-table w-full text-left text-sm">
          <thead>
            <tr>
              <th className="px-5 py-4 font-medium">제목</th>
              <th className="w-[100px] px-5 py-4 font-medium">카테고리</th>
              <th className="w-[100px] px-5 py-4 font-medium">작성자</th>
              <th className="w-[90px] px-5 py-4 font-medium">날짜</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => {
              const isHidden = p.status === "hidden";
              // 5C-5 CA1 — 삭제됨 글도 prefix + dim 처리 (삭제됨 탭 표시용)
              const isDeleted = p.status === "deleted";
              return (
                <tr
                  key={p.id}
                  onClick={() => setSelected(p)}
                  className={`cursor-pointer ${isHidden || isDeleted ? "opacity-60" : ""}`}
                >
                  <td data-primary="true" className="px-5 py-3">
                    <p className="truncate font-medium" style={{ color: "var(--color-text-primary)" }}>
                      {isHidden && (
                        <span className="mr-1.5 text-xs" style={{ color: "var(--color-error)" }}>[숨김]</span>
                      )}
                      {isDeleted && (
                        <span className="mr-1.5 text-xs" style={{ color: "var(--color-error)" }}>[삭제됨]</span>
                      )}
                      {p.title}
                    </p>
                  </td>
                  <td data-label="카테고리" className="px-5 py-3">
                    {/* 2026-05-15 Admin-4-C 박제 — admin-stat-pill[data-tone="mute"] 통일
                        (시안 v2.9 type_label 패턴 — 카테고리는 의미 톤 0 = mute) */}
                    <span className="admin-stat-pill" data-tone="mute">
                      {CATEGORY_LABEL[p.category ?? ""] ?? p.category ?? "기타"}
                    </span>
                  </td>
                  <td data-label="작성자" className="px-5 py-3 truncate" style={{ color: "var(--color-text-muted)" }}>
                    {p.authorName ?? p.authorEmail ?? "-"}
                  </td>
                  <td data-label="날짜" className="px-5 py-3" style={{ color: "var(--color-text-muted)" }}>
                    {fmtDate(p.createdAt)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="p-8 text-center" style={{ color: "var(--color-text-muted)" }}>
            게시글이 없습니다.
          </div>
        )}
      </div>

      {/* 상세 모달 */}
      {selected && (
        <AdminDetailModal
          isOpen={!!selected}
          onClose={() => setSelected(null)}
          title={selected.title}
          actions={
            // 5C-5 CA1 — 삭제됨 글은 액션 hide (복구 서버 액션 부재 → mock 0).
            //   활성(published·hidden 등) 글에만 기존 숨김/삭제 액션 노출 (0 변경)
            selected.status === "deleted" ? (
              <span className="text-xs text-[var(--color-text-muted)]">
                삭제된 게시글입니다 (복구 미지원)
              </span>
            ) : (
              <div className="flex items-center gap-2">
                {/* 숨김/복원 토글 */}
                <form action={selected.status === "hidden" ? unhidePostAction : hidePostAction}>
                  <input type="hidden" name="post_id" value={selected.id} />
                  <button
                    type="submit"
                    className={`inline-flex items-center gap-1 rounded-[8px] px-3 py-2 text-sm font-medium transition-colors ${
                      selected.status === "hidden"
                        ? "bg-[var(--color-success)]/10 text-[var(--color-success)] hover:bg-[var(--color-success)]/20"
                        : "bg-[var(--color-warning)]/10 text-[var(--color-warning)] hover:bg-[var(--color-warning)]/20"
                    }`}
                  >
                    <Icon name={selected.status === "hidden" ? "eye" : "eye-off"} size={16} />
                    {selected.status === "hidden" ? "복원" : "숨김"}
                  </button>
                </form>
                {/* 삭제 */}
                <form action={deletePostAction}>
                  <input type="hidden" name="post_id" value={selected.id} />
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1 rounded-[8px] bg-[var(--color-error)]/10 px-3 py-2 text-sm font-medium text-[var(--color-error)] transition-colors hover:bg-[var(--color-error)]/20"
                  >
                    <Icon name="trash-2" size={16} />
                    삭제
                  </button>
                </form>
              </div>
            )
          }
        >
          <div className="space-y-4">
            <ModalInfoSection
              title="게시글 정보"
              rows={[
                [
                  "카테고리",
                  // 2026-05-15 Admin-4-C 박제 — admin-stat-pill 통일 (시안 v2.9 modal header pill 박제)
                  <span key="cat" className="admin-stat-pill" data-tone="mute">
                    {CATEGORY_LABEL[selected.category ?? ""] ?? selected.category ?? "기타"}
                  </span>,
                ],
                ["작성자", selected.authorName ?? selected.authorEmail ?? "-"],
                [
                  "상태",
                  // 2026-05-15 Admin-4-C 박제 — 상태 pill (hidden=warn / 게시중=ok)
                  <span
                    key="st"
                    className="admin-stat-pill"
                    data-tone={STATUS_TONE[selected.status ?? "published"] ?? "ok"}
                  >
                    {STATUS_LABEL[selected.status ?? "published"] ?? "게시중"}
                  </span>,
                ],
              ]}
            />
            <ModalInfoSection
              title="통계"
              rows={[
                ["조회수", String(selected.viewCount)],
                ["댓글수", String(selected.commentsCount)],
                ["좋아요", String(selected.likesCount)],
              ]}
            />
            <ModalInfoSection
              title="일시"
              rows={[["작성일", fmtDate(selected.createdAt)]]}
            />
          </div>
        </AdminDetailModal>
      )}
    </>
  );
}

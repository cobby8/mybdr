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

import { useState } from "react";
import { AdminStatusTabs } from "@/components/admin/admin-status-tabs";
import {
  AdminDetailModal,
  ModalInfoSection,
} from "@/components/admin/admin-detail-modal";

// 2026-05-15 Admin-4-C 박제 — 상태별 admin-stat-pill data-tone 매핑
//   hidden 일 때만 warn(주황), 정상 게시는 ok(녹) (시안 v2.9 status_tone 패턴 박제)
const STATUS_LABEL: Record<string, string> = {
  published: "게시중",
  hidden: "숨김",
};
const STATUS_TONE: Record<string, "ok" | "warn" | "mute"> = {
  published: "ok",
  hidden: "warn",
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
  const [activeTab, setActiveTab] = useState("all");
  const [selected, setSelected] = useState<SerializedPost | null>(null);

  // 탭: 전체 + 카테고리별
  const filtered =
    activeTab === "all"
      ? posts
      : posts.filter((p) => p.category === activeTab);

  // 동적 탭 생성 — 존재하는 카테고리만 탭으로 표시
  const categoryKeys = [...new Set(posts.map((p) => p.category).filter(Boolean))] as string[];
  const tabs = [
    { key: "all", label: "전체", count: posts.length },
    ...categoryKeys.map((key) => ({
      key,
      label: CATEGORY_LABEL[key] ?? key,
      count: posts.filter((p) => p.category === key).length,
    })),
  ];

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString("ko-KR");

  return (
    <>
      <AdminStatusTabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

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
              return (
                <tr
                  key={p.id}
                  onClick={() => setSelected(p)}
                  className={`cursor-pointer ${isHidden ? "opacity-60" : ""}`}
                >
                  <td data-primary="true" className="px-5 py-3">
                    <p className="truncate font-medium" style={{ color: "var(--color-text-primary)" }}>
                      {isHidden && (
                        <span className="mr-1.5 text-xs" style={{ color: "var(--color-error)" }}>[숨김]</span>
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
                  <span className="material-symbols-outlined text-base">
                    {selected.status === "hidden" ? "visibility" : "visibility_off"}
                  </span>
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
                  <span className="material-symbols-outlined text-base">delete</span>
                  삭제
                </button>
              </form>
            </div>
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

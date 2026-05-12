"use client";

// 2026-05-03: Phase D — 알기자 운영자 검수 client 컴포넌트
// 좌 sidebar (status 탭) + 우 main (목록 + 미리보기 + 액션)

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LinkifyNewsBody, type LinkifyEntry } from "@/lib/news/linkify-news-body";
// 2026-05-04: 알기자 기사 사진 업로드/관리 (모바일 카메라 + 멀티 + Hero 지정 + 삭제)
import { NewsPhotoManager, type NewsPhoto } from "./_components/news-photo-manager";

type NewsPost = {
  id: string;
  title: string;
  content: string;
  status: string;
  created_at: string;
  updated_at: string;
  likes_count: number;
  comments_count: number;
  view_count: number;
  tournament_match_id: string | null;
  tournament_id: string | null;
  period_type: string | null;
  period_key: string | null;
  linkifyEntries: LinkifyEntry[];
  // 2026-05-04: 알기자 사진 (server props)
  photos: NewsPhoto[];
};

type Counts = { draft: number; published: number; rejected: number };

type ActionResult = { ok: boolean; error?: string };

interface Props {
  posts: NewsPost[];
  currentStatus: "draft" | "published" | "rejected";
  counts: Counts;
  publishAction: (id: bigint) => Promise<ActionResult>;
  rejectAction: (id: bigint) => Promise<ActionResult>;
  regenerateAction: (id: bigint) => Promise<ActionResult>;
  // 2026-05-04: Phase 1 (라이브 페이지 [Lead] 요약) 재생성 액션
  regenerateSummaryAction: (matchId: bigint) => Promise<ActionResult>;
  editAction: (
    id: bigint,
    data: { title?: string; content?: string },
  ) => Promise<ActionResult>;
}

export function AdminNewsContent({
  posts,
  currentStatus,
  counts,
  publishAction,
  rejectAction,
  regenerateAction,
  regenerateSummaryAction,
  editAction,
}: Props) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string | null>(posts[0]?.id ?? null);
  // 2026-05-04: 모바일 미리보기 모달 토글 — 데스크톱 인라인은 항상 표시 (selectedId 기반)
  const [previewOpen, setPreviewOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");

  const selected = posts.find((p) => p.id === selectedId);

  const handleAction = (
    action: () => Promise<ActionResult>,
    successMsg: string,
  ) => {
    startTransition(async () => {
      const result = await action();
      if (result.ok) {
        // 성공 시 목록 갱신 (revalidatePath 가 처리)
        router.refresh();
        // 사용자 알림 — 단순 alert (admin UI 단순화)
        if (successMsg) console.log(`[admin-news] ${successMsg}`);
      } else {
        alert(`실패: ${result.error}`);
      }
    });
  };

  const handlePublish = (id: string) =>
    handleAction(() => publishAction(BigInt(id)), "발행 완료");
  const handleReject = (id: string) => {
    if (!confirm("거절하시겠습니까? (rejected 처리, 노출 X)")) return;
    handleAction(() => rejectAction(BigInt(id)), "거절 완료");
  };
  const handleRegenerate = (id: string) => {
    if (!confirm("재생성하시겠습니까? (기존 게시물 삭제 + LLM 새로 호출, 30~60초 소요)")) return;
    handleAction(() => regenerateAction(BigInt(id)), "재생성 완료");
  };
  const handleRegenerateSummary = (matchId: string) => {
    if (!confirm("라이브 페이지 요약을 재생성하시겠습니까? (LLM 재호출, 본기사 영향 X)")) return;
    handleAction(() => regenerateSummaryAction(BigInt(matchId)), "요약 재생성 완료");
  };
  const handleEditStart = (post: NewsPost) => {
    setEditTitle(post.title);
    setEditContent(post.content);
    setEditing(true);
  };
  const handleEditSave = (id: string) => {
    handleAction(
      () => editAction(BigInt(id), { title: editTitle, content: editContent }),
      "수정 완료",
    );
    setEditing(false);
  };

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* 상단 status 탭 — 가로 배치 (모바일/데스크톱 모두)
          2026-05-04 사용자 요청: "검수대기/발행됨/거절됨 탭 가로 배치" */}
      <aside className="flex flex-row gap-1 overflow-x-auto">
        <Link href="/admin/news?status=draft" className="aside__link shrink-0 flex-1 lg:flex-initial lg:min-w-[180px]" data-active={currentStatus === "draft"}>
          <span>🟡 검수 대기</span>
          <span className="count">{counts.draft}</span>
        </Link>
        <Link href="/admin/news?status=published" className="aside__link shrink-0 flex-1 lg:flex-initial lg:min-w-[180px]" data-active={currentStatus === "published"}>
          <span>✅ 발행됨</span>
          <span className="count">{counts.published}</span>
        </Link>
        <Link href="/admin/news?status=rejected" className="aside__link shrink-0 flex-1 lg:flex-initial lg:min-w-[180px]" data-active={currentStatus === "rejected"}>
          <span>🚫 거절됨</span>
          <span className="count">{counts.rejected}</span>
        </Link>
      </aside>

      {/* 본문 — 모바일 stack / 데스크톱 2컬럼 (list + 미리보기, 1:1.5 비율)
          2026-05-04: Tailwind v4 lg:grid + lg:grid-cols-[...] 임의값 빌드 누락 이슈 →
          globals.css 명시 미디어쿼리 클래스 .admin-news-body-grid 사용 (확실 작동) */}
      <div className="admin-news-body-grid">
      {/* 목록 — 데스크톱 좌측 컬럼 / 모바일 stack */}
      <section className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] overflow-hidden">
        {/* 2026-05-04: sticky 헤더 z-index 명시 + 첫 카드 잘림 fix */}
        <header
          className="border-b border-[var(--color-border)] p-3 text-sm font-medium sticky top-0 z-10 bg-[var(--color-bg)]"
        >
          {currentStatus === "draft" ? "검수 대기" : currentStatus === "published" ? "발행됨" : "거절됨"} ({posts.length}건)
        </header>
          <div className="max-h-[70vh] overflow-y-auto">
            {posts.length === 0 ? (
              <div className="p-8 text-center text-sm text-[var(--color-text-dim)]">
                목록 없음
              </div>
            ) : (
              <ul>
                {posts.map((p) => (
                  <li
                    key={p.id}
                    onClick={() => {
                      setSelectedId(p.id);
                      setEditing(false);
                      // 2026-05-04: 모바일에서 클릭 시 미리보기 모달 자동 열림 (데스크톱은 인라인 그대로)
                      setPreviewOpen(true);
                    }}
                    className={`cursor-pointer border-b border-[var(--color-border)] p-3 text-sm flex gap-2 items-start ${
                      selectedId === p.id
                        ? "bg-[var(--color-bg-elev1)]"
                        : "hover:bg-[var(--color-bg-hover)]"
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-medium line-clamp-2">{p.title}</div>
                      {/* 2026-05-04: 모든 status 에 조회수/좋아요/댓글 표시 (사용자 요청) */}
                      <div className="mt-1 flex flex-wrap gap-x-2 gap-y-1 text-xs text-[var(--color-text-dim)]">
                        <span>match {p.tournament_match_id ?? "-"}</span>
                        <span>·</span>
                        <span>{new Date(p.created_at).toLocaleString("ko-KR")}</span>
                        <span>·</span>
                        <span>👁 {p.view_count}</span>
                        <span>❤ {p.likes_count}</span>
                        <span>💬 {p.comments_count}</span>
                      </div>
                    </div>
                    {/* 2026-05-04: 매치 페이지 빠른 링크 — 카드 우측 (클릭 시 새 탭, list 선택과 분리) */}
                    {p.tournament_match_id && (
                      <Link
                        href={`/live/${p.tournament_match_id}`}
                        target="_blank"
                        onClick={(e) => e.stopPropagation()}
                        title="매치 페이지로 이동"
                        className="shrink-0 mt-0.5 flex h-7 w-7 items-center justify-center rounded text-[var(--color-text-dim)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-info)]"
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>open_in_new</span>
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        {/* 미리보기 — 데스크톱 인라인 컬럼 / 모바일 fixed inset-0 모달 (previewOpen 토글)
            2026-05-04: Phase 1+2 레이아웃 — 모바일에서 list 클릭 시 모달 진입
            2026-05-04 추가 fix: 백드롭 (bg-black/50 z-40) + 모달 명시적 불투명 배경 (var(--color-surface)) */}
        {previewOpen && (
          <div
            aria-hidden="true"
            onClick={() => setPreviewOpen(false)}
            className="lg:hidden fixed inset-0 z-40 bg-black/50 transition-opacity"
          />
        )}
        <section
          className={`
            rounded-lg border border-[var(--color-border)] overflow-hidden flex flex-col
            ${previewOpen
              ? "fixed inset-0 z-50 lg:relative lg:inset-auto lg:z-auto rounded-none lg:rounded-lg"
              : "hidden lg:flex"}
          `}
          style={{ background: "var(--color-surface, var(--bg-elev, #fff))" }}
        >
          <header className="border-b border-[var(--color-border)] p-3 text-sm font-medium flex justify-between items-center shrink-0">
            <span className="flex items-center gap-2">
              {/* 모바일 뒤로가기 버튼 — previewOpen 닫기 */}
              <button
                onClick={() => setPreviewOpen(false)}
                aria-label="목록으로"
                className="lg:hidden flex h-7 w-7 items-center justify-center rounded hover:bg-[var(--color-bg-hover)]"
              >
                <span className="material-symbols-outlined" style={{ fontSize: 20 }}>arrow_back</span>
              </button>
              미리보기
            </span>
            {selected && !editing && (
              <button
                onClick={() => handleEditStart(selected)}
                className="text-xs text-[var(--color-info)] hover:underline"
              >
                ✏️ 수정
              </button>
            )}
          </header>
          {selected ? (
            <div className="p-4 space-y-3 overflow-y-auto flex-1">
              {editing ? (
                <>
                  <input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full rounded border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-base"
                    placeholder="제목"
                  />
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    rows={12}
                    className="w-full rounded border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm leading-relaxed"
                    placeholder="본문"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditSave(selected.id)}
                      disabled={isPending}
                      className="btn btn--primary btn--sm"
                    >
                      저장
                    </button>
                    <button
                      onClick={() => setEditing(false)}
                      className="btn btn--sm"
                    >
                      취소
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <h2 className="text-lg font-semibold">{selected.title}</h2>
                  <div className="text-xs text-[var(--color-text-dim)]">
                    match #{selected.tournament_match_id} · {selected.status} ·{" "}
                    {new Date(selected.created_at).toLocaleString("ko-KR")}
                  </div>
                  <LinkifyNewsBody
                    content={selected.content}
                    entries={selected.linkifyEntries}
                    className="text-sm leading-relaxed text-[var(--color-text)]"
                  />
                  {selected.linkifyEntries.length > 0 && (
                    <div className="text-xs text-[var(--color-text-dim)]">
                      🔗 자동 링크: 팀 {selected.linkifyEntries.filter((e) => e.type === "team").length} ·
                      선수 {selected.linkifyEntries.filter((e) => e.type === "player").length}
                    </div>
                  )}
                  <div className="text-xs text-[var(--color-text-dim)] pt-2 border-t border-[var(--color-border)]">
                    {selected.content.length}자
                  </div>

                  {/* 액션 — draft 상태에서만 publish/reject, 모든 상태에서 regenerate
                      2026-05-04: (web) .btn 클래스 통일 */}
                  <div className="flex flex-wrap gap-2 pt-2">
                    {selected.status === "draft" && (
                      <>
                        <button
                          onClick={() => handlePublish(selected.id)}
                          disabled={isPending}
                          className="btn btn--primary btn--sm"
                        >
                          ✅ 발행
                        </button>
                        <button
                          onClick={() => handleReject(selected.id)}
                          disabled={isPending}
                          className="btn btn--sm"
                          style={{ borderColor: "var(--color-err)", color: "var(--color-err)" }}
                        >
                          🚫 거절
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => handleRegenerate(selected.id)}
                      disabled={isPending}
                      className="btn btn--ghost btn--sm"
                    >
                      🔄 본기사 재생성
                    </button>
                    {/* 2026-05-04: Phase 1 (라이브 페이지 [Lead] 요약) 재생성 — 본기사와 독립 */}
                    {selected.tournament_match_id && (
                      <button
                        onClick={() => handleRegenerateSummary(selected.tournament_match_id!)}
                        disabled={isPending}
                        className="btn btn--ghost btn--sm"
                        title="라이브 페이지 [Lead] 요약 재생성 (본기사 영향 X)"
                      >
                        📝 요약 재생성
                      </button>
                    )}
                    {selected.tournament_match_id && (
                      <Link
                        href={`/live/${selected.tournament_match_id}`}
                        target="_blank"
                        className="btn btn--ghost btn--sm"
                      >
                        매치 페이지 ↗
                      </Link>
                    )}
                  </div>

                  {/* 2026-05-04: 알기자 사진 업로드/관리 — 매치 있을 때만 노출 */}
                  {selected.tournament_match_id && (
                    <NewsPhotoManager
                      matchId={selected.tournament_match_id}
                      initialPhotos={selected.photos}
                    />
                  )}
                </>
              )}
            </div>
          ) : (
            <div className="p-8 text-center text-sm text-[var(--color-text-dim)]">
              왼쪽 목록에서 게시물을 선택하세요
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

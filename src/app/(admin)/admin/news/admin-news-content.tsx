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
  editAction,
}: Props) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string | null>(posts[0]?.id ?? null);
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
    <div className="flex gap-4 p-4">
      {/* 좌 sidebar — status 탭 */}
      <aside className="w-48 shrink-0 space-y-2">
        <Link
          href="/admin/news?status=draft"
          className={`block rounded-md px-3 py-2 text-sm ${
            currentStatus === "draft"
              ? "bg-[var(--color-accent)] text-white"
              : "bg-[var(--color-bg-elev1)] text-[var(--color-text)] hover:bg-[var(--color-bg-hover)]"
          }`}
        >
          🟡 검수 대기 ({counts.draft})
        </Link>
        <Link
          href="/admin/news?status=published"
          className={`block rounded-md px-3 py-2 text-sm ${
            currentStatus === "published"
              ? "bg-[var(--color-accent)] text-white"
              : "bg-[var(--color-bg-elev1)] text-[var(--color-text)] hover:bg-[var(--color-bg-hover)]"
          }`}
        >
          ✅ 발행됨 ({counts.published})
        </Link>
        <Link
          href="/admin/news?status=rejected"
          className={`block rounded-md px-3 py-2 text-sm ${
            currentStatus === "rejected"
              ? "bg-[var(--color-accent)] text-white"
              : "bg-[var(--color-bg-elev1)] text-[var(--color-text)] hover:bg-[var(--color-bg-hover)]"
          }`}
        >
          🚫 거절됨 ({counts.rejected})
        </Link>
      </aside>

      {/* 우 main — 목록 + 미리보기 */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* 목록 */}
        <section className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] overflow-hidden">
          <header className="border-b border-[var(--color-border)] p-3 text-sm font-medium">
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
                    }}
                    className={`cursor-pointer border-b border-[var(--color-border)] p-3 text-sm ${
                      selectedId === p.id
                        ? "bg-[var(--color-bg-elev1)]"
                        : "hover:bg-[var(--color-bg-hover)]"
                    }`}
                  >
                    <div className="font-medium line-clamp-2">{p.title}</div>
                    <div className="mt-1 flex gap-2 text-xs text-[var(--color-text-dim)]">
                      <span>match {p.tournament_match_id ?? "-"}</span>
                      <span>·</span>
                      <span>{new Date(p.created_at).toLocaleString("ko-KR")}</span>
                      {p.status === "published" && (
                        <>
                          <span>·</span>
                          <span>👁 {p.view_count}</span>
                          <span>❤ {p.likes_count}</span>
                          <span>💬 {p.comments_count}</span>
                        </>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        {/* 미리보기 */}
        <section className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] overflow-hidden">
          <header className="border-b border-[var(--color-border)] p-3 text-sm font-medium flex justify-between items-center">
            <span>미리보기</span>
            {selected && !editing && (
              <button
                onClick={() => handleEditStart(selected)}
                className="text-xs text-[var(--color-accent)] hover:underline"
              >
                ✏️ 수정
              </button>
            )}
          </header>
          {selected ? (
            <div className="p-4 space-y-3">
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
                      className="rounded bg-[var(--color-accent)] px-4 py-2 text-sm text-white disabled:opacity-50"
                    >
                      저장
                    </button>
                    <button
                      onClick={() => setEditing(false)}
                      className="rounded border border-[var(--color-border)] px-4 py-2 text-sm"
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

                  {/* 액션 — draft 상태에서만 publish/reject, 모든 상태에서 regenerate */}
                  <div className="flex flex-wrap gap-2 pt-2">
                    {selected.status === "draft" && (
                      <>
                        <button
                          onClick={() => handlePublish(selected.id)}
                          disabled={isPending}
                          className="rounded bg-[var(--color-accent)] px-4 py-2 text-sm text-white disabled:opacity-50"
                        >
                          ✅ 발행
                        </button>
                        <button
                          onClick={() => handleReject(selected.id)}
                          disabled={isPending}
                          className="rounded border border-[var(--color-err)] px-4 py-2 text-sm text-[var(--color-err)] disabled:opacity-50"
                        >
                          🚫 거절
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => handleRegenerate(selected.id)}
                      disabled={isPending}
                      className="rounded border border-[var(--color-border)] px-4 py-2 text-sm disabled:opacity-50"
                    >
                      🔄 재생성
                    </button>
                    {selected.tournament_match_id && (
                      <Link
                        href={`/live/${selected.tournament_match_id}`}
                        target="_blank"
                        className="rounded border border-[var(--color-border)] px-4 py-2 text-sm"
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
      </main>
    </div>
  );
}

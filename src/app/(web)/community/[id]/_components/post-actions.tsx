"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { deletePostAction } from "@/app/actions/community";

/**
 * PostActions - 게시글 수정/삭제 드롭다운
 *
 * 본인 게시글인 경우에만 렌더링됨 (서버에서 isOwner로 제어).
 * more_vert 아이콘 클릭 시 드롭다운 메뉴 표시.
 * DS v4 토큰 교체 (PR-PUB-2-4): --color-* → 직접 토큰
 */
export function PostActions({
  postPublicId,
}: {
  postPublicId: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // 드롭다운 외부 클릭 시 닫기
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  // 수정 버튼 클릭 -> 수정 페이지로 이동
  function handleEdit() {
    setOpen(false);
    router.push(`/community/${postPublicId}/edit`);
  }

  // 삭제 버튼 클릭 -> 확인 후 삭제
  async function handleDelete() {
    if (!confirm("정말로 이 글을 삭제하시겠습니까?")) return;
    setDeleting(true);
    const result = await deletePostAction(postPublicId);
    if (result.error) {
      alert(result.error);
      setDeleting(false);
      return;
    }
    // 삭제 성공 시 목록으로 이동
    router.push("/community");
    router.refresh();
  }

  return (
    <div className="relative" ref={menuRef}>
      {/* 더보기 아이콘 버튼 */}
      <button
        onClick={() => setOpen(!open)}
        className="p-2 transition-colors"
        style={{ color: "var(--ink-mute)" }}
        aria-label="게시글 메뉴"
      >
        <span className="material-symbols-outlined">more_vert</span>
      </button>

      {/* 드롭다운 메뉴 */}
      {open && (
        <div
          className="absolute right-0 top-full mt-1 w-32 rounded border shadow-lg z-50 py-1"
          style={{
            backgroundColor: "var(--bg-elev)",
            borderColor: "var(--border)",
          }}
        >
          <button
            onClick={handleEdit}
            className="flex items-center gap-2 w-full px-4 py-2 text-sm text-left transition-colors hover:bg-white/5"
            style={{ color: "var(--ink)" }}
          >
            <span className="material-symbols-outlined text-base">edit</span>
            수정
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="flex items-center gap-2 w-full px-4 py-2 text-sm text-left transition-colors hover:bg-white/5 disabled:opacity-50"
            style={{ color: "var(--bdr-red)" }}
          >
            <span className="material-symbols-outlined text-base">delete</span>
            {deleting ? "삭제 중..." : "삭제"}
          </button>
        </div>
      )}
    </div>
  );
}

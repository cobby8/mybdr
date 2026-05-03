"use client";

// 2026-05-04: 알기자 기사 사진 관리 컴포넌트 — admin/news 검수 페이지 통합
// 모바일 카메라 직접 호출 (capture="environment") + 드래그앤드롭 + Hero 지정 + 삭제
//
// props.photos = 초기 사진 list (server props), 이후 mutation 시 router.refresh() 로 재조회
// 멀티 업로드 지원 — 한 번에 N장 선택 → 순차 업로드 (rate-limit 회피 + 진행률)

import { useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

export type NewsPhoto = {
  id: string;
  url: string;
  width: number | null;
  height: number | null;
  isHero: boolean;
  displayOrder: number;
  caption: string | null;
};

interface Props {
  matchId: string;
  initialPhotos: NewsPhoto[];
}

export function NewsPhotoManager({ matchId, initialPhotos }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<{ current: number; total: number }>({
    current: 0,
    total: 0,
  });
  const [error, setError] = useState<string | null>(null);

  // 업로드 핸들러 — 멀티 파일 순차 처리
  const handleUpload = async (files: FileList | null, isHero: boolean) => {
    if (!files || files.length === 0) return;
    setError(null);
    setUploading(true);
    setProgress({ current: 0, total: files.length });

    let lastError: string | null = null;
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fd = new FormData();
      fd.append("file", file);
      fd.append("matchId", matchId);
      // 첫 사진만 isHero=true (멀티 업로드 시) — 사용자가 isHero 체크 시 첫 1장만 적용
      fd.append("isHero", String(isHero && i === 0));

      try {
        const res = await fetch("/api/web/upload/news-photo", {
          method: "POST",
          body: fd,
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          lastError = body?.error?.message ?? `HTTP ${res.status}`;
          break;
        }
      } catch (e) {
        lastError = e instanceof Error ? e.message : "업로드 실패";
        break;
      }

      setProgress({ current: i + 1, total: files.length });
    }

    setUploading(false);
    if (lastError) {
      setError(lastError);
    } else {
      // 성공 — server props 갱신
      startTransition(() => router.refresh());
    }
  };

  // 삭제 핸들러
  const handleDelete = async (photoId: string) => {
    if (!confirm("이 사진을 삭제할까요?")) return;
    try {
      const res = await fetch(`/api/web/upload/news-photo?id=${photoId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        alert("삭제 실패");
        return;
      }
      startTransition(() => router.refresh());
    } catch (e) {
      alert(`삭제 실패: ${e instanceof Error ? e.message : "?"}`);
    }
  };

  return (
    <div className="space-y-2 pt-3 border-t border-[var(--color-border)]">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">📸 사진 ({initialPhotos.length})</h3>
        <div className="flex gap-2">
          {/* 카메라 직접 호출 — 모바일에서 즉시 카메라 앱 */}
          <label className="cursor-pointer rounded border border-[var(--color-border)] px-3 py-1.5 text-xs hover:bg-[var(--color-bg-hover)]">
            📷 카메라
            <input
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              disabled={uploading}
              onChange={(e) => {
                handleUpload(e.target.files, false);
                e.target.value = ""; // 같은 파일 재선택 가능
              }}
            />
          </label>
          {/* 일반 파일 선택 (멀티) */}
          <label className="cursor-pointer rounded border border-[var(--color-border)] px-3 py-1.5 text-xs hover:bg-[var(--color-bg-hover)]">
            🖼️ 갤러리 (멀티)
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              disabled={uploading}
              onChange={(e) => {
                handleUpload(e.target.files, false);
                e.target.value = "";
              }}
            />
          </label>
          {/* Hero 단독 업로드 */}
          <label className="cursor-pointer rounded border border-[var(--color-accent)] px-3 py-1.5 text-xs text-[var(--color-accent)] hover:bg-[var(--color-accent-light)]">
            ⭐ 대표 사진
            <input
              type="file"
              accept="image/*"
              className="hidden"
              disabled={uploading}
              onChange={(e) => {
                handleUpload(e.target.files, true);
                e.target.value = "";
              }}
            />
          </label>
        </div>
      </div>

      {/* 업로드 progress */}
      {uploading && (
        <div className="text-xs text-[var(--color-text-dim)]">
          업로드 중… ({progress.current}/{progress.total})
        </div>
      )}
      {error && (
        <div className="text-xs text-[var(--color-err)]">❌ {error}</div>
      )}

      {/* 사진 grid */}
      {initialPhotos.length === 0 ? (
        <div className="rounded border border-dashed border-[var(--color-border)] py-6 text-center text-xs text-[var(--color-text-dim)]">
          사진이 없습니다. 위 버튼으로 업로드하세요.
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {initialPhotos.map((p) => (
            <div
              key={p.id}
              className="group relative aspect-square overflow-hidden rounded border border-[var(--color-border)]"
            >
              <Image
                src={p.url}
                alt={p.caption ?? "알기자 사진"}
                fill
                sizes="(max-width: 640px) 33vw, 25vw"
                className="object-cover"
                unoptimized
              />
              {p.isHero && (
                <div className="absolute left-1 top-1 rounded bg-[var(--color-accent)] px-1.5 py-0.5 text-[10px] font-semibold text-white">
                  ⭐ 대표
                </div>
              )}
              <button
                onClick={() => handleDelete(p.id)}
                disabled={isPending || uploading}
                className="absolute right-1 top-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] text-white opacity-0 transition-opacity group-hover:opacity-100"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="text-[10px] text-[var(--color-text-dim)]">
        💡 모바일 카메라 = 즉시 촬영 / 갤러리 = 여러 장 / 대표 사진 = 카드 썸네일 + 본문 상단 Hero
      </div>
    </div>
  );
}

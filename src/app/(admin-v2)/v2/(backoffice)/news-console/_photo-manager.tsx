"use client";

// =====================================================================
// _photo-manager.tsx — 알기자 기사 사진 관리 (admin-v2 / 옵션 B)
//   레거시 (admin)/admin/news/_components/news-photo-manager.tsx 의
//   **mutation 로직(업로드/삭제/압축/EXIF/hero)을 1:1 복제**하고, **디자인만 admin-v2**로 교체.
//
//   ⚠ 백엔드 0변경 — 기존 REST 만 호출:
//     · 업로드 = POST   /api/web/upload/news-photo   (FormData: file, matchId, isHero)
//     · 삭제   = DELETE /api/web/upload/news-photo?id=<photoId>
//   ⚠ 동작 보존(1:1): 멀티 순차 업로드 / 1MB+ 클라 압축(browser-image-compression·EXIF 보존)
//     / EXIF 추천매치 불일치 경고 / 압축 통계 / 성공 시 router.refresh().
//   ⚠ 디자인 교체점(레거시 → admin-v2):
//     · text-white/bg-black/60/이모지 → admin-v2 Icon(lucide) + var(--*) 토큰 + color-mix.
//     · var(--color-*) → admin-v2 토큰(--ink/--border/--card/--primary/--warn/--danger…).
//     · 하드코딩 색상(#fff/hex/rgba) 0 / pill 9999px 0(아바타/배지 없음).
// =====================================================================

import { useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
// 클라이언트 측 이미지 압축 — 레거시와 동일 lib(EXIF 보존). 모바일 5MB → ~1MB.
import imageCompression from "browser-image-compression";
import { Icon } from "@/components/admin-v2";

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

// 업로드 트리거 라벨(파일 input wrapper) 공통 스타일 — ts-btn--secondary 룩을 토큰으로 재현.
// (Btn 컴포넌트는 button 을 렌더하므로 file input <label> 에는 직접 못 씀 → 토큰 인라인.)
const labelBase: React.CSSProperties = {
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  fontSize: 13,
  fontWeight: 700,
  padding: "8px 12px",
  borderRadius: "var(--radius-btn)",
  border: "1px solid var(--border)",
  color: "var(--ink-soft)",
  background: "var(--card)",
};

export function NewsPhotoManager({ matchId, initialPhotos }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<{ current: number; total: number }>({
    current: 0,
    total: 0,
  });
  const [error, setError] = useState<string | null>(null);
  // EXIF 추천 매치 — 업로드된 사진 EXIF 가 현재 selected 매치와 다른 시각이면 경고 (레거시 동일)
  const [exifWarning, setExifWarning] = useState<string | null>(null);
  // 압축 통계 (트래픽 절감 안내) — 원본 / 압축 후 합계
  const [compressStats, setCompressStats] = useState<{ original: number; compressed: number } | null>(
    null,
  );

  // 클라이언트 측 압축 — 1MB+ 사진만 압축 (작은 사진은 원본 그대로). [레거시 1:1]
  // EXIF 메타는 lib 가 보존 — 서버 EXIF 자동 매핑에 영향 0.
  const compressIfNeeded = async (file: File): Promise<File> => {
    if (file.size < 1024 * 1024) return file; // 1MB 이하 그대로
    try {
      const compressed = await imageCompression(file, {
        maxSizeMB: 1.5, // 1.5MB 이하로
        maxWidthOrHeight: 2048, // long-edge 2048 (서버 sharp 1920 보다 약간 크게 — 화질 마진)
        useWebWorker: true, // 메인스레드 미차단
        preserveExif: true, // EXIF 보존 (서버 EXIF 자동 매핑 위해)
      });
      return compressed;
    } catch (e) {
      console.warn("[image-compression] 실패, 원본 사용:", e);
      return file;
    }
  };

  // 업로드 핸들러 — 멀티 파일 순차 처리. [레거시 mutation 1:1]
  const handleUpload = async (files: FileList | null, isHero: boolean) => {
    if (!files || files.length === 0) return;
    setError(null);
    setExifWarning(null);
    setCompressStats(null);
    setUploading(true);
    setProgress({ current: 0, total: files.length });

    let lastError: string | null = null;
    const warnings: string[] = [];
    let totalOriginal = 0;
    let totalCompressed = 0;
    for (let i = 0; i < files.length; i++) {
      const original = files[i];
      // 1) 클라이언트 측 압축 (1MB+ 사진만, 그 외 원본)
      const file = await compressIfNeeded(original);
      totalOriginal += original.size;
      totalCompressed += file.size;

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
        // EXIF 추천 매치 검증 — 현재 matchId 와 다르면 경고
        const body = await res.json().catch(() => ({}));
        const data = body?.data ?? body;
        if (data?.recommendedMatchId && data.recommendedMatchId !== matchId) {
          const info = data.recommendedMatchInfo;
          const label = info
            ? `매치 #${info.matchNumber ?? "?"} (${info.tournamentName ?? "?"})`
            : `매치 ID ${data.recommendedMatchId}`;
          warnings.push(
            `${file.name}: EXIF 촬영시각이 ${label} 와 일치 (현재 매치와 다를 수 있음)`,
          );
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
      if (warnings.length > 0) setExifWarning(warnings.join("\n"));
      // 압축 통계 (트래픽 절감 안내)
      if (totalOriginal > totalCompressed) {
        setCompressStats({ original: totalOriginal, compressed: totalCompressed });
      }
      // 성공 — server props 갱신
      startTransition(() => router.refresh());
    }
  };

  // 삭제 핸들러. [레거시 mutation 1:1 — confirm 문구 보존]
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
    <div
      style={{
        marginTop: 14,
        paddingTop: 14,
        borderTop: "1px solid var(--border)",
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      {/* 헤더 — 사진 수 + 업로드 트리거 3종(카메라 / 갤러리 멀티 / 대표) */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
        <h3 style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 14, fontWeight: 800, color: "var(--ink)" }}>
          <Icon name="image" size={16} />
          사진 ({initialPhotos.length})
        </h3>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {/* 카메라 직접 호출 — 모바일에서 즉시 카메라 앱 */}
          <label style={labelBase}>
            <Icon name="camera" size={15} />
            카메라
            <input
              type="file"
              accept="image/*"
              capture="environment"
              style={{ display: "none" }}
              disabled={uploading}
              onChange={(e) => {
                handleUpload(e.target.files, false);
                e.target.value = ""; // 같은 파일 재선택 가능
              }}
            />
          </label>
          {/* 일반 파일 선택 (멀티) */}
          <label style={labelBase}>
            <Icon name="images" size={15} />
            갤러리
            <input
              type="file"
              accept="image/*"
              multiple
              style={{ display: "none" }}
              disabled={uploading}
              onChange={(e) => {
                handleUpload(e.target.files, false);
                e.target.value = "";
              }}
            />
          </label>
          {/* Hero 단독 업로드 — 대표 강조(primary 톤) */}
          <label style={{ ...labelBase, borderColor: "var(--primary)", color: "var(--primary)", background: "var(--primary-weak)" }}>
            <Icon name="star" size={15} />
            대표 사진
            <input
              type="file"
              accept="image/*"
              style={{ display: "none" }}
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
        <div style={{ fontSize: 12, color: "var(--ink-mute)" }}>
          업로드 중… ({progress.current}/{progress.total})
        </div>
      )}
      {error && (
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--danger)" }}>
          <Icon name="circle-alert" size={14} />
          {error}
        </div>
      )}
      {/* EXIF 자동 매핑 — 추천 매치가 현재와 다를 때 경고 */}
      {exifWarning && (
        <div
          style={{
            display: "flex",
            gap: 8,
            borderRadius: "var(--radius-input)",
            border: "1px solid var(--warn)",
            background: "var(--warn-weak)",
            padding: 8,
            fontSize: 12,
            whiteSpace: "pre-line",
            color: "var(--ink)",
          }}
        >
          <Icon name="triangle-alert" size={14} style={{ color: "var(--warn)", flexShrink: 0 }} />
          <span>EXIF 촬영시각 불일치 가능성{"\n"}{exifWarning}</span>
        </div>
      )}
      {/* 클라이언트 압축 통계 (트래픽 절감 안내) */}
      {compressStats && (
        <div style={{ fontSize: 11, color: "var(--ink-mute)" }}>
          압축: {(compressStats.original / 1024 / 1024).toFixed(2)}MB →{" "}
          {(compressStats.compressed / 1024 / 1024).toFixed(2)}MB (
          {Math.round((1 - compressStats.compressed / compressStats.original) * 100)}% 절감)
        </div>
      )}

      {/* 사진 grid */}
      {initialPhotos.length === 0 ? (
        <div
          style={{
            borderRadius: "var(--radius-input)",
            border: "1px dashed var(--border-strong)",
            padding: "24px 0",
            textAlign: "center",
            fontSize: 12,
            color: "var(--ink-mute)",
          }}
        >
          사진이 없습니다. 위 버튼으로 업로드하세요.
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
          {initialPhotos.map((p) => (
            <div
              key={p.id}
              className="news-photo-cell"
              style={{
                position: "relative",
                aspectRatio: "1 / 1",
                overflow: "hidden",
                borderRadius: "var(--radius-chip)",
                border: "1px solid var(--border)",
              }}
            >
              <Image
                src={p.url}
                alt={p.caption ?? "알기자 사진"}
                fill
                sizes="(max-width: 640px) 33vw, 200px"
                style={{ objectFit: "cover" }}
                unoptimized
              />
              {p.isHero && (
                <span
                  style={{
                    position: "absolute",
                    left: 4,
                    top: 4,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 2,
                    borderRadius: "var(--radius-chip)",
                    background: "var(--primary)",
                    color: "var(--primary-fg)",
                    padding: "2px 6px",
                    fontSize: 10,
                    fontWeight: 800,
                  }}
                >
                  <Icon name="star" size={10} />
                  대표
                </span>
              )}
              <button
                type="button"
                onClick={() => handleDelete(p.id)}
                disabled={isPending || uploading}
                aria-label="사진 삭제"
                title="사진 삭제"
                style={{
                  position: "absolute",
                  right: 4,
                  top: 4,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 22,
                  height: 22,
                  borderRadius: "var(--radius-chip)",
                  border: "none",
                  cursor: "pointer",
                  // 하드코딩 rgba 금지 → 토큰 color-mix 로 반투명 스크림 재현
                  background: "color-mix(in srgb, var(--ink) 60%, transparent)",
                  color: "var(--card)",
                }}
              >
                <Icon name="x" size={13} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "var(--ink-mute)" }}>
        <Icon name="info" size={13} style={{ flexShrink: 0 }} />
        <span>
          모바일 카메라 = 즉시 촬영 / 갤러리 = 여러 장 / 대표 사진 = 카드 썸네일 + 본문 상단 Hero · 매치당 최대 15장
        </span>
      </div>
    </div>
  );
}

// 2026-05-04: 알기자 기사 사진 갤러리 컴포넌트 (server-friendly, no client state)
//
// 노출 위치 (3곳 동일 룰):
//   - community/[id]/page.tsx (본문 위 Hero + 본문 아래 갤러리)
//   - news/match/[matchId]/page.tsx (동일)
//   - admin/news 미리보기 (Phase 2 큐 — 별도 NewsPhotoManager 사용 중)
//
// 정책:
//   - Hero (is_hero=true 1장) → 본문 위 큰 사진 (16:9 또는 원본 비율 유지)
//   - 나머지 사진 → 본문 아래 썸네일 grid (3~4 열, 클릭 시 새 탭 원본)
//   - 사진 0건 → 아예 렌더 X (조건부 마운트 권장)

import Image from "next/image";

export type NewsPhotoForGallery = {
  id: string;
  url: string;
  width: number | null;
  height: number | null;
  isHero: boolean;
  displayOrder: number;
  caption: string | null;
};

interface HeroProps {
  photos: NewsPhotoForGallery[];
}

/**
 * Hero 사진 — is_hero=true 1장 (없으면 첫 사진).
 * 본문 위에 마운트.
 */
export function NewsPhotoHero({ photos }: HeroProps) {
  if (photos.length === 0) return null;
  const hero = photos.find((p) => p.isHero) ?? photos[0];
  const aspectRatio =
    hero.width && hero.height ? hero.width / hero.height : 16 / 9;

  return (
    <figure className="relative w-full overflow-hidden rounded-lg bg-[var(--color-bg-soft)]">
      <div style={{ aspectRatio }}>
        <Image
          src={hero.url}
          alt={hero.caption ?? "알기자 사진"}
          fill
          sizes="(max-width: 768px) 100vw, 720px"
          className="object-cover"
          priority
          unoptimized
        />
      </div>
      {hero.caption && (
        <figcaption className="px-2 py-1.5 text-xs text-[var(--color-text-dim)]">
          {hero.caption}
        </figcaption>
      )}
    </figure>
  );
}

interface GalleryProps {
  photos: NewsPhotoForGallery[];
  /** Hero 사진 제외 여부 (NewsPhotoHero 와 동시 사용 시 true 권장) */
  excludeHero?: boolean;
}

/**
 * 갤러리 — Hero 외 사진 grid. 본문 아래에 마운트.
 * 클릭 시 새 탭 원본 (lightbox 는 Phase 2 큐).
 */
export function NewsPhotoGallery({ photos, excludeHero = true }: GalleryProps) {
  const heroId = photos.find((p) => p.isHero)?.id;
  const list = excludeHero && heroId
    ? photos.filter((p) => p.id !== heroId)
    : photos;
  if (list.length === 0) return null;

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-[var(--color-text)]">📸 사진</h3>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {list.map((p) => (
          <a
            key={p.id}
            href={p.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative aspect-square overflow-hidden rounded border border-[var(--color-border)] hover:opacity-90"
          >
            <Image
              src={p.url}
              alt={p.caption ?? "알기자 사진"}
              fill
              sizes="(max-width: 640px) 33vw, 25vw"
              className="object-cover transition-transform group-hover:scale-105"
              unoptimized
            />
          </a>
        ))}
      </div>
    </div>
  );
}

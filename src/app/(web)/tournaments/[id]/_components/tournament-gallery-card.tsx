/**
 * UB1 시안 — 카드 03 명장면 갤러리
 *
 * 시안 원본: Dev/design/BDR-current/screens/TournamentCompleted.jsx L123~142
 *
 * 운영 데이터 매핑:
 *  - 운영 미지원 (대회 사진 갤러리 API/스키마 0건)
 *  - 사진 placeholder/mock 노출 ❌ (의뢰서 §3 제약)
 *  → photos.length === 0 면 카드 자체 미렌더 (return null)
 *
 * 향후 확장:
 *  - tournament_photos 테이블 또는 BlobStorage 연동 시 photos prop 전달하여 자연 흡수 가능
 *
 * 시안 css: tournament-completed.css `.tc-photos*` / `.tc-photo*` 박제
 */

interface Photo {
  /** 사진 id (URL 또는 DB id) */
  id: string;
  /** 캡션 (예: "결승전 마지막 슛") */
  caption: string;
  /** 이미지 URL (null 시 시안 그라데이션 placeholder) */
  imageUrl: string | null;
}

interface Props {
  /** 사진 배열 — 빈 배열이면 카드 미렌더 */
  photos: Photo[];
}

export function TournamentGalleryCard({ photos }: Props) {
  // 운영 데이터 X → photos.length === 0 → 카드 hide (의뢰서 §3 / Step 8 룰)
  if (photos.length === 0) return null;

  return (
    <article className="tc-card tc-card--photos">
      <header className="tc-card__head">
        <span className="tc-card__num">03</span>
        <h2 className="tc-card__h">명장면 갤러리</h2>
        <span className="tc-card__sub">{photos.length}장</span>
      </header>
      <div className="tc-photos">
        {photos.map((p, i) => (
          // CSS custom property --i 로 그라데이션 hue 회전. inline style 필수
          <div
            key={p.id}
            className="tc-photo"
            style={{ ["--i" as string]: i } as React.CSSProperties}
          >
            <span className="tc-photo__cap">{p.caption}</span>
            {p.imageUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={p.imageUrl}
                alt={p.caption}
                style={{
                  position: "absolute",
                  inset: 0,
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
            ) : (
              <span className="ico material-symbols-outlined">image</span>
            )}
          </div>
        ))}
      </div>
      <button type="button" className="btn btn--ghost btn--sm tc-card__more">
        전체 보기 →
      </button>
    </article>
  );
}

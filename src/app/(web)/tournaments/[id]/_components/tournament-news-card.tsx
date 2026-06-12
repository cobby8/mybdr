/**
 * 대회 종료 — 카드 04 대회 기사 (B안 §2 / 2열: 대표 + 목록 최신순)
 *
 * 시안 원본: td-completed.jsx ResultPane L226~246 (tc-card--article / tdc-news)
 *
 * 운영 데이터 매핑:
 *   - 목록(우) = 본 대회 알기자 글 = community_posts (category='news', tournament_id, period_type in match/round/daily)
 *   - 대표(좌) = 목록 최신글 (보통 결승 리포트) — 본문 lead + 대표사진
 *   - 대표사진 = 최신글 tournament_match_id → news_photo(is_hero) url. 없으면 placeholder(시안 그라디언트 박스)
 *   - 시안 mock C_ARTICLES 박제 ❌ → props articles 와이어
 *   - 기사 링크 = /community/{public_id} (운영 상세 라우트 존재 확인됨)
 *
 * Hide 조건:
 *   - articles.length === 0 (알기자 글 0건) → 카드 자체 미렌더
 *
 * 시안 css: tournament-completed.css `.tdc-news*` 박제 (append)
 *   강조색: feat tag / active row = var(--cafe-blue) 계열 (시안 --accent 빨강 → 치환됨)
 */

import Link from "next/link";

/** 기사 한 건 (community_posts 매핑) */
export interface NewsArticle {
  /** community_posts.public_id — /community/{public_id} 링크용 */
  publicId: string;
  /** 기사 제목 */
  title: string;
  /** 본문 (대표 기사 lead 용 — 앞부분만 발췌) */
  content: string | null;
  /** period_type 기반 태그 라벨 ("매치"/"라운드"/"일자" 등) */
  tag: string;
  /** 작성일 표시 ("2026.03.15") */
  dateLabel: string;
}

interface Props {
  /** 알기자 글 목록 (최신순) — 0건이면 카드 hide */
  articles: NewsArticle[];
  /** 대표 기사 사진 URL (최신글 매치 news_photo is_hero). 없으면 placeholder */
  heroPhotoUrl: string | null;
}

/** 본문에서 lead 발췌 (3줄 clamp 는 CSS / 여기선 길이 컷만) */
function toLead(content: string | null): string {
  if (!content) return "";
  // 마크다운/HTML 태그 단순 제거 후 200자 컷 (CSS line-clamp 가 시각 처리)
  const plain = content.replace(/<[^>]+>/g, "").replace(/[#*_>`]/g, "").trim();
  return plain.length > 200 ? plain.slice(0, 200) + "…" : plain;
}

export function TournamentNewsCard({ articles, heroPhotoUrl }: Props) {
  // 데이터 0 → 카드 미렌더
  if (articles.length === 0) return null;

  const feature = articles[0]; // 대표 = 최신글
  const featureLead = toLead(feature.content);

  return (
    <article className="tc-card tc-card--article">
      <header className="tc-card__head">
        <span className="tc-card__num">04</span>
        <h2 className="tc-card__h">대회 기사</h2>
        <span className="tc-card__sub">{feature.dateLabel} 업데이트</span>
      </header>
      <div className="tdc-news">
        {/* 좌: 대표 기사 (사진 + 제목 + lead) */}
        <Link className="tdc-news__feat" href={`/community/${feature.publicId}`}>
          {heroPhotoUrl ? (
            <div className="tdc-news__media tdc-news__media--photo">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={heroPhotoUrl} alt={feature.title} />
            </div>
          ) : (
            // 사진 없으면 시안 placeholder (CSS 그라디언트 + 라벨)
            <div className="tdc-news__media" role="img" aria-label="대표 기사 사진">
              <span className="tdc-news__ph">대회 사진</span>
            </div>
          )}
          <span className="tdc-news__tag tdc-news__tag--feat">{feature.tag}</span>
          <h3 className="tdc-news__title">{feature.title}</h3>
          {featureLead && <p className="tdc-news__lead">{featureLead}</p>}
          <div className="tdc-news__by">MyBDR 매치 리포트 · {feature.dateLabel}</div>
        </Link>

        {/* 우: 전체 목록 (최신순) */}
        <div className="tdc-news__list">
          <div className="tdc-news__listh">
            <b>전체 기사</b>
            <span>{articles.length}건 · 최신순</span>
          </div>
          {articles.map((a, i) => (
            <Link
              key={a.publicId}
              href={`/community/${a.publicId}`}
              className={"tdc-newsrow" + (i === 0 ? " is-active" : "")}
            >
              <div className="tdc-newsrow__meta">
                <span className="tdc-news__tag">{a.tag}</span>
                <span className="tdc-newsrow__date">{a.dateLabel}</span>
              </div>
              <div className="tdc-newsrow__title">{a.title}</div>
            </Link>
          ))}
        </div>
      </div>
    </article>
  );
}

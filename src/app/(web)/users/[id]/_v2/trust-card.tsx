/* ============================================================
 * TrustCard — /users/[id] v2 "신뢰" 카드 (시안 D · Phase 10 manner_score 기반)
 *
 * 왜:
 * - 시안 D Profile.jsx "신뢰 카드"(HeroCard 와 별도) 박제. 함께 뛰기 좋은 상대인지를
 *   매너 "등급 라벨" + MVP 선정 횟수 + 참여 경기 수로 요약한다.
 *
 * ⚠️ manner_score "숫자" 는 이 컴포넌트가 받지도(props 에 없음) 표시하지도 않는다.
 *    등급 라벨(gradeLabel) + 토큰 키(gradeKey)만 받아 색상/게이지로만 추상 표현한다.
 *    (점수 직접 비교/낙인 방지 — 01-user-design-decisions §3 / DATA-BINDING §2-4)
 *
 * - hasRatings=false(평가 0건) → "아직 기록 없음" 빈 상태(시안 D 그대로).
 *
 * 디자인 룰:
 * - var(--*) 토큰만(색상=manner-grade 유틸의 mannerGradeColor). 하드코딩 hex 0.
 * - 등급 점 = 정사각(9x9) 50% 라운딩(pill 9999px 회피 예외 — 허용).
 * - 720px 분기는 시안 .trust-grid 미디어쿼리 박제(좌측 등급 셀 full-width).
 * - server component 로 두어도 무방하나 page 가 client 트리에 슬롯으로 끼우므로 순수 표현 컴포넌트.
 * ============================================================ */

import type { MannerGradeKey } from "@/lib/games/manner-grade";
import { mannerGradeColor, mannerGradeStep } from "@/lib/games/manner-grade";

import "./trust-card.css";

export interface TrustCardProps {
  /** 매너 평가를 한 건이라도 받았는지(false → "아직 기록 없음") */
  hasRatings: boolean;
  /** 등급 라벨("아주 좋음"/"좋음"/"보통"/"주의 필요"). 평가 0건이면 null. */
  gradeLabel: string | null;
  /** 등급 토큰 키 — 색상/게이지 매핑용(숫자 점수 비노출 대체). */
  gradeKey: MannerGradeKey;
  /** 받은 MVP 선정 횟수(final_mvp_user_id 카운트). */
  mvpCount: number;
  /** 참여(실출석) 경기 수. */
  gamesPlayed: number;
}

export function TrustCard({
  hasRatings,
  gradeLabel,
  gradeKey,
  mvpCount,
  gamesPlayed,
}: TrustCardProps) {
  // 등급 색상/게이지 step — manner-grade 유틸 단일 매핑 재사용(키→토큰 중복 정의 0).
  const tone = mannerGradeColor(gradeKey);
  const step = mannerGradeStep(gradeKey);

  return (
    <div className="card" style={{ padding: "20px 24px" }}>
      {/* 헤더 — "신뢰 · 함께 뛰기 좋은 상대"(시안 D 카피 그대로) */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          marginBottom: 14,
        }}
      >
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "var(--ink)" }}>
          신뢰{" "}
          <span
            style={{
              fontSize: 12,
              color: "var(--ink-mute)",
              fontWeight: 500,
              marginLeft: 4,
            }}
          >
            함께 뛰기 좋은 상대
          </span>
        </h2>
      </div>

      {hasRatings ? (
        // 3열 — 매너 등급(1.4fr) / MVP 선정(1fr) / 참여 경기(1fr). 720px 에서 .trust-card.css 분기.
        <div
          className="trust-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "1.4fr 1fr 1fr",
            gap: 0,
            border: "1px solid var(--border)",
            borderRadius: 8,
            overflow: "hidden",
          }}
        >
          {/* (1) 매너 등급 — 점(등급색) + 라벨(등급색) + 4칸 게이지 */}
          <div style={{ padding: "16px 18px" }}>
            <div
              style={{
                fontSize: 11,
                color: "var(--ink-dim)",
                fontWeight: 700,
                letterSpacing: ".04em",
                marginBottom: 6,
              }}
            >
              매너 등급
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 8,
              }}
            >
              {/* 등급 점 — 정사각 50% 라운딩(원형 예외 허용) */}
              <span
                style={{
                  width: 9,
                  height: 9,
                  borderRadius: "50%",
                  background: tone,
                  flexShrink: 0,
                }}
                aria-hidden
              />
              <span
                style={{
                  fontWeight: 800,
                  fontSize: 18,
                  color: tone,
                  letterSpacing: "-0.01em",
                }}
              >
                {/* gradeLabel 은 hasRatings=true 일 때 항상 채워짐(유틸 보장) */}
                {gradeLabel ?? "—"}
              </span>
            </div>
            {/* 4칸 게이지 — step 이하 칸만 등급색, 나머지는 빈칸 토큰 */}
            <div style={{ display: "flex", gap: 3 }}>
              {[1, 2, 3, 4].map((n) => (
                <span
                  key={n}
                  style={{
                    flex: 1,
                    height: 4,
                    borderRadius: 2,
                    background: n <= step ? tone : "var(--bg-elev)",
                  }}
                />
              ))}
            </div>
          </div>

          {/* (2) MVP 선정 횟수 */}
          <div
            style={{
              padding: "16px 14px",
              borderLeft: "1px solid var(--border)",
              background: "var(--bg-alt)",
            }}
          >
            <div
              style={{
                fontFamily: "var(--ff-display)",
                fontWeight: 900,
                fontSize: 24,
                letterSpacing: "-0.01em",
                color: "var(--ink)",
              }}
            >
              {mvpCount}
              <span style={{ fontSize: 13, color: "var(--ink-mute)", marginLeft: 2 }}>회</span>
            </div>
            <div
              style={{
                fontSize: 11,
                color: "var(--ink-dim)",
                fontWeight: 600,
                marginTop: 2,
              }}
            >
              MVP 선정
            </div>
          </div>

          {/* (3) 참여 경기 수 */}
          <div
            style={{
              padding: "16px 14px",
              borderLeft: "1px solid var(--border)",
              background: "var(--bg-alt)",
            }}
          >
            <div
              style={{
                fontFamily: "var(--ff-display)",
                fontWeight: 900,
                fontSize: 24,
                letterSpacing: "-0.01em",
                color: "var(--ink)",
              }}
            >
              {gamesPlayed}
              <span style={{ fontSize: 13, color: "var(--ink-mute)", marginLeft: 2 }}>경기</span>
            </div>
            <div
              style={{
                fontSize: 11,
                color: "var(--ink-dim)",
                fontWeight: 600,
                marginTop: 2,
              }}
            >
              참여 경기
            </div>
          </div>
        </div>
      ) : (
        // 빈 상태 — 평가 0건(시안 D "아직 기록 없음")
        <div
          style={{
            padding: 24,
            textAlign: "center",
            background: "var(--bg-alt)",
            borderRadius: 8,
            color: "var(--ink-mute)",
            fontSize: 13,
          }}
        >
          아직 기록 없음
        </div>
      )}
    </div>
  );
}

import Link from "next/link";
import type { Metadata } from "next";

// SEO: 용어 사전 페이지 메타데이터
export const metadata: Metadata = {
  title: "용어 사전 | MyBDR",
  description:
    "MyBDR에서 쓰는 농구 관련 용어(대회, 경기, 픽업, 게스트, 디비전, 시드, 토너먼트, 풀리그)를 쉽게 정리했습니다.",
};

/* ============================================================
 * 용어 사전 (Help > Glossary) — Phase 9 D-P3 v2 박제
 *
 * 이유: /help (Phase 6) 통합 허브의 "전체 용어 사전 보기 →" 링크
 *      대상 페이지. /help의 GLOSSARY(16건 짧은 정의)와 달리,
 *      이 페이지는 9건 핵심 용어를 더 풍부하게 (설명 + 예시 +
 *      관련 페이지 링크) 다룬다. 의도적 분리 — redirect 금지.
 *
 * 박제 변경 (Phase 9):
 *  - .page 래퍼 + eyebrow + h1(BDR v2 톤)
 *  - 카드형 .card 래핑 + var(--cafe-blue) 강조 (탭형 페이지와 통일)
 *  - 변수: var(--ink), var(--ink-soft), var(--ink-mute), var(--ink-dim),
 *         var(--accent), var(--border), var(--bg-alt) (BDR v2 토큰)
 *  - 상단 "← 도움말로 돌아가기" 링크 (탐색 일관성)
 *
 * 보존:
 *  - 9건 용어 데이터 (entries) + 예시 + 관련 링크 = 외부 링크 호환성
 *  - SEO metadata 그대로
 * ============================================================ */

// 용어 1건 타입 — 섹션 반복 렌더링을 위한 구조화
type GlossaryEntry = {
  term: string; // 한글 용어
  english?: string; // 영문/부연
  icon: string; // Material Symbols 이름
  description: string; // 1~2문장 설명
  example?: string; // 예시 (선택)
  links?: { href: string; label: string }[]; // 관련 내부 링크
};

// 최소 스코프 9개 — 기획서 권장(대회/경기/픽업/게스트/디비전/시드/토너먼트/풀리그 등)
const entries: GlossaryEntry[] = [
  {
    term: "대회",
    english: "Tournament",
    icon: "emoji_events",
    description:
      "정해진 기간 동안 여러 팀이 우승을 다투는 경기 묶음입니다. 토너먼트, 풀리그, 혼합(리그+토너먼트) 방식이 있습니다.",
    example: "예: BDR 서울 오픈 2026 (16팀 · 2일간 · 풀리그+결선 토너먼트)",
    links: [{ href: "/tournaments", label: "진행 중인 대회 보기" }],
  },
  {
    term: "경기",
    english: "Game",
    icon: "sports_basketball",
    description:
      "단일 경기 단위입니다. 픽업·게스트·연습경기 3가지 유형으로 구분되며, 대회 내 경기와는 별개로 누구나 만들고 참가 신청할 수 있습니다.",
    example: "예: 강남구 토요일 저녁 픽업, A팀 게스트 모집",
    links: [{ href: "/games", label: "모집 중인 경기 보기" }],
  },
  {
    term: "픽업",
    english: "Pickup",
    icon: "group_add",
    description:
      "개인이 서로 모여 즉석에서 팀을 짜는 공개 경기입니다. 개인 단위 참가 신청으로 팀이 구성됩니다.",
    example: "예: 10명 모집 → 추첨/순서대로 5:5 팀 배정",
    links: [{ href: "/games?type=pickup", label: "픽업 경기 보기" }],
  },
  {
    term: "게스트",
    english: "Guest",
    icon: "person_add",
    description:
      "기존 팀이 부족한 인원을 채우기 위해 외부 선수를 초청하는 경기입니다. 주축은 팀원이고, 게스트 몇 명이 합류합니다.",
    example: "예: A팀 주축 7명 + 게스트 3명 모집",
    links: [{ href: "/games?type=guest", label: "게스트 경기 보기" }],
  },
  {
    term: "연습경기",
    english: "Practice Match",
    icon: "fitness_center",
    description:
      "두 팀이 비공식적으로 만나 치르는 경기입니다. 승패나 개인 기록이 공식 랭킹·커리어에 반영되지 않습니다.",
    example: "예: B팀 vs C팀 주말 연습경기",
    links: [{ href: "/games?type=practice", label: "연습경기 보기" }],
  },
  {
    term: "디비전",
    english: "Division",
    icon: "category",
    description:
      "대회 내에서 실력·나이 등 기준으로 나눈 참가 그룹입니다. 한 대회 안에서 여러 디비전이 동시에 진행될 수 있습니다.",
    example: "예: 오픈 · 챌린저 · 비기너 3개 디비전",
  },
  {
    term: "시드",
    english: "Seed",
    icon: "star",
    description:
      "대진 추첨 시 상위 팀에게 부여하는 우선 배정입니다. 강팀끼리 초반에 만나지 않도록 분산 배치하는 역할을 합니다.",
    example: "예: 직전 대회 4강 이상 팀에게 1~4번 시드",
  },
  {
    term: "토너먼트 (싱글/더블 엘리미네이션)",
    english: "Single/Double Elimination",
    icon: "account_tree",
    description:
      "승자만 다음 라운드로 올라가는 방식입니다. 한 번 지면(싱글) 또는 두 번 지면(더블) 탈락합니다.",
    example: "예: 8강 → 4강 → 결승 (싱글 엘리미네이션)",
  },
  {
    term: "풀리그",
    english: "Round Robin",
    icon: "swap_horiz",
    description:
      "모든 팀이 서로 한 번씩 경기를 치르는 방식입니다. 순위는 누적 승수와 득실점 차로 결정합니다.",
    example: "예: 4팀 풀리그 → 총 6경기 → 1~4위 확정",
  },
];

export default function GlossaryPage() {
  return (
    // .page = BDR v2 공통 래퍼 (좌우 패딩 + 상단 여백 통일)
    <div className="page">
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        {/* 상단 "← 도움말로 돌아가기" — /help 통합 허브로 복귀 동선 */}
        <div style={{ marginBottom: 16 }}>
          <Link
            href="/help"
            style={{
              fontSize: 13,
              color: "var(--ink-mute)",
              fontWeight: 500,
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16 }} aria-hidden>
              arrow_back
            </span>
            도움말로 돌아가기
          </Link>
        </div>

        {/* 헤더: eyebrow + h1 (BDR v2 톤, /help 페이지와 통일) */}
        <div style={{ marginBottom: 28 }}>
          <div className="eyebrow">용어 사전 · GLOSSARY</div>
          <h1
            style={{
              margin: "10px 0 8px",
              fontSize: 28,
              fontWeight: 800,
              letterSpacing: "-0.02em",
              color: "var(--ink)",
            }}
          >
            농구 용어 한눈에 보기
          </h1>
          <p style={{ fontSize: 14, color: "var(--ink-mute)", lineHeight: 1.6 }}>
            MyBDR에서 자주 쓰는 핵심 용어 9개를 예시·관련 페이지와 함께 정리했습니다.
          </p>
        </div>

        {/* 용어 목록 — .card 한 장에 9개 섹션 (탭형 정책 카드와 일관성) */}
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          {entries.map((e, i) => (
            <section
              key={e.term}
              // 항목 사이 구분선 — 마지막 항목은 제외
              style={{
                padding: "20px 22px",
                borderBottom: i < entries.length - 1 ? "1px solid var(--border)" : 0,
              }}
            >
              {/* 제목 줄: 아이콘(accent) + 한글 + 영문 부연 */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 8,
                }}
              >
                <span
                  className="material-symbols-outlined"
                  style={{ color: "var(--accent)", fontSize: 20 }}
                  aria-hidden
                >
                  {e.icon}
                </span>
                <h2
                  style={{
                    fontSize: 16,
                    fontWeight: 700,
                    color: "var(--ink)",
                    margin: 0,
                  }}
                >
                  {e.term}
                </h2>
                {e.english && (
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 500,
                      color: "var(--ink-mute)",
                    }}
                  >
                    · {e.english}
                  </span>
                )}
              </div>

              {/* 설명 */}
              <p
                style={{
                  fontSize: 14,
                  lineHeight: 1.7,
                  color: "var(--ink-soft)",
                  margin: 0,
                }}
              >
                {e.description}
              </p>

              {/* 예시 (선택) — 살짝 약한 톤으로 부연 */}
              {e.example && (
                <p
                  style={{
                    marginTop: 8,
                    fontSize: 12.5,
                    lineHeight: 1.6,
                    color: "var(--ink-dim)",
                  }}
                >
                  {e.example}
                </p>
              )}

              {/* 관련 링크 (선택) — cafe-blue 톤 라벨, 하드코딩 색상 금지 */}
              {e.links && e.links.length > 0 && (
                <div
                  style={{
                    marginTop: 12,
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 8,
                  }}
                >
                  {e.links.map((l) => (
                    <Link
                      key={l.href}
                      href={l.href}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                        padding: "6px 12px",
                        fontSize: 12,
                        fontWeight: 600,
                        color: "var(--cafe-blue)",
                        background: "var(--bg-alt)",
                        border: "1px solid var(--border)",
                        borderRadius: 4,
                      }}
                    >
                      {l.label}
                      <span
                        className="material-symbols-outlined"
                        style={{ fontSize: 14 }}
                        aria-hidden
                      >
                        arrow_forward
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </section>
          ))}
        </div>

        {/* 하단 안내 카드 — 추가 용어 요청 동선 (1:1 문의는 /help 허브로 유도) */}
        <div
          className="card"
          style={{
            marginTop: 20,
            padding: "16px 20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
            flexWrap: "wrap",
          }}
        >
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, color: "var(--ink)" }}>
              찾는 용어가 없나요?
            </div>
            <div
              style={{
                fontSize: 12.5,
                color: "var(--ink-mute)",
                marginTop: 4,
                lineHeight: 1.6,
              }}
            >
              FAQ·정책은 도움말 통합 페이지에서, 직접 문의는 운영팀 메일로 부탁드립니다.
            </div>
          </div>
          <Link href="/help" className="btn btn--primary" style={{ fontSize: 13 }}>
            도움말 허브로 이동
          </Link>
        </div>
      </div>
    </div>
  );
}

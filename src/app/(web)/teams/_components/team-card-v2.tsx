import Link from "next/link";

// Phase 3 Teams — v2 시안 카드 (2026-04-29 모바일 최적화 간소화)
// 이유: 모바일 2열 그리드(폭 ~170px)에 맞춰 카드 정보를 핵심만 남김.
// - 제거: 우상단 #랭크 / 3열 stat (레이팅·승·패) / 매치 신청 버튼 / 매치 신청 disabled UI
// - 유지: 로고(이니셜) / 팀명 / 창단 연도 / 상세 버튼 (full-width)
// - 가입 버튼은 카드에서 제거 — 상세 페이지에 이미 가입 액션이 있어 단순화
// API/Prisma 변경 없음.

interface TeamCardV2Data {
  id: string;
  name: string;
  name_en: string | null;
  // primary/secondary 색상 — 카드 상단 accent 블록 배경용
  primaryColor: string | null;
  secondaryColor: string | null;
  logoUrl: string | null;
  city: string | null;
  district: string | null;
  accepting_members: boolean | null;
  created_at: string | null;
}

// 기존 team-card.tsx 의 resolveAccent 와 동일 로직.
// #ffffff 같은 너무 밝은 primary 는 가독성 떨어져 secondary 또는 BDR 빨강으로 대체.
function resolveAccent(primary: string | null, secondary: string | null): string {
  if (!primary || primary.toLowerCase() === "#ffffff" || primary.toLowerCase() === "#fff") {
    return secondary ?? "#E31B23";
  }
  return primary;
}

// tag 생성: 영문명이 있으면 그 첫 3글자, 없으면 한글 첫 3글자를 대문자로.
// 이유: DB에 tag 컬럼 없음 → 로고 없을 때 이니셜 폴백용.
function buildTag(name: string, nameEn: string | null): string {
  const src = (nameEn && nameEn.trim()) || name;
  return src.trim().slice(0, 3).toUpperCase();
}

// created_at → 창단 연도
function foundedYear(createdAt: string | null): string {
  if (!createdAt) return "—";
  const y = new Date(createdAt).getFullYear();
  return Number.isFinite(y) ? String(y) : "—";
}

export function TeamCardV2({ team }: { team: TeamCardV2Data }) {
  const accent = resolveAccent(team.primaryColor, team.secondaryColor);
  const tag = buildTag(team.name, team.name_en);
  const founded = foundedYear(team.created_at);

  // accent 위에는 흰 글자가 가장 안전 (primary 색상은 보통 중간~진한 채도)
  const inkOnAccent = "#FFFFFF";

  return (
    <div
      className="card"
      style={{
        padding: 0,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* 상단 accent 블록: 로고 + 팀명 + 창단 (모바일 2열 폭 대응 — padding 축소) */}
      <div
        style={{
          background: accent,
          color: inkOnAccent,
          padding: "14px 14px 12px",
          position: "relative",
          minHeight: 86,
          display: "flex",
          gap: 10,
          alignItems: "center",
        }}
      >
        {/* 로고 또는 이니셜 박스 — 모바일 폭 좁으니 44px (기존 54px → 축소) */}
        {team.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- 외부 이미지 최적화 불필요 (v2 시안 일관성)
          <img
            src={team.logoUrl}
            alt=""
            style={{
              width: 44,
              height: 44,
              borderRadius: 8,
              objectFit: "cover",
              flexShrink: 0,
              background: "rgba(255,255,255,.18)",
            }}
          />
        ) : (
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 8,
              flexShrink: 0,
              background: "rgba(255,255,255,.18)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: "var(--ff-display)",
              fontWeight: 900,
              fontSize: 16,
              letterSpacing: ".06em",
            }}
          >
            {tag}
          </div>
        )}

        <div style={{ flex: 1, minWidth: 0 }}>
          {/* 팀명 — 모바일 2열 폭(~170px)에 맞춰 22px → 16px 축소 */}
          <div
            style={{
              fontFamily: "var(--ff-display)",
              fontWeight: 900,
              fontSize: 16,
              letterSpacing: "-0.01em",
              lineHeight: 1.15,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {team.name}
          </div>

          {/* 창단 연도 */}
          <div style={{ fontSize: 11, opacity: 0.85, marginTop: 4 }}>
            창단 {founded}
          </div>
        </div>
      </div>

      {/* 하단 액션 — 상세 보기 단일 버튼 (full-width) */}
      <div
        style={{
          padding: "10px 12px 12px",
          borderTop: "1px solid var(--border)",
          marginTop: "auto",
        }}
      >
        <Link
          href={`/teams/${team.id}`}
          className="btn btn--sm"
          style={{
            display: "flex",
            width: "100%",
            justifyContent: "center",
            alignItems: "center",
            textDecoration: "none",
          }}
        >
          상세 보기
        </Link>
      </div>
    </div>
  );
}

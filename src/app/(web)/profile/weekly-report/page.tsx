"use client";

/**
 * 주간 운동 리포트 페이지 (/profile/weekly-report)
 *
 * Why: 주간 단위 활동 리포트 (이메일 주간 발송 미리보기 톤)
 *      ProfileGrowth 가 12주 trends 라면, 이건 "이번 주 vs 지난 주" 비교 + 인사이트
 * Pattern: 이메일 뉴스레터 레이아웃 — 좁은 칼럼 (max 720), 카드 stack, 명확한 섹션 헤더
 *
 * 시안 출처: Dev/design/BDR v2.2/screens/ProfileWeeklyReport.jsx (D등급 P1-4)
 * 진입: /profile "주간 리포트" 카드 / 알림 "주간 리포트가 도착했어요"
 * 복귀: AppNav 뒤로 / "이메일 구독 관리" → /profile/notification-settings
 *
 * 회귀 검수 매트릭스:
 *   기능              | 옛 페이지                | v2.2          | 진입점     | 모바일
 *   주차 navigation   | -                        | ✅ < W47 >    | -          | OK
 *   요약 통계         | ✅ 4 StatCard            | ✅ 4 KPI      | -          | 2열
 *   비교 (vs 지난주)  | ✅ row 비교              | ✅ delta KPI  | -          | OK
 *   자주 방문 코트    | ✅ TOP 3                 | ✅ TOP 3      | -          | 1열
 *   인사이트 카피     | -                        | ✅ 3 인사이트 | -          | 1열
 *   이메일 구독 토글  | -                        | ✅ footer     | settings   | OK
 *
 * 박제 룰 준수:
 * - var(--*) 토큰만 (시안 var(--accent) → 사이트 var(--color-primary) 매핑)
 * - Material Symbols Outlined 만
 * - radius 4px
 * - alert 신규 X
 * - API/데이터 패칭 0 변경 (SWR /api/web/profile/weekly-report 그대로)
 */

import { useRouter } from "next/navigation";
import useSWR from "swr";
import Link from "next/link";

// ── 타입 정의 ── (기존 그대로 보존)
interface WeekData {
  session_count: number;
  total_minutes: number;
  unique_courts: number;
  active_days: number;
  total_xp: number;
  top_courts: { court_id: string; name: string; visits: number }[];
}

interface ReportData {
  nickname: string;
  level: number;
  title: string;
  emoji: string;
  streak: number;
  this_week: WeekData;
  last_week: WeekData;
  minutes_change: number;
  period: {
    this_week_start: string;
    last_week_start: string;
    last_week_end: string;
  };
}

// 분 -> "1.5시간" 또는 "45분" 포맷 (KPI 카드용)
function formatHours(minutes: number): string {
  if (minutes <= 0) return "0";
  const h = minutes / 60;
  // 1시간 미만은 분 단위 그대로, 이상은 시간(소수점 1자리)
  if (h < 1) return `${minutes}`;
  return h % 1 === 0 ? `${h}` : h.toFixed(1);
}

// 단위 라벨
function hoursUnit(minutes: number): string {
  return minutes < 60 ? "분" : "시간";
}

// 날짜 포맷: "11/17 (월)"
function formatDate(isoStr: string): string {
  const d = new Date(isoStr);
  // KST 변환
  const kst = new Date(d.getTime() + 9 * 60 * 60 * 1000);
  const month = kst.getUTCMonth() + 1;
  const day = kst.getUTCDate();
  const dayNames = ["일", "월", "화", "수", "목", "금", "토"];
  const dayName = dayNames[kst.getUTCDay()];
  return `${month}/${day} (${dayName})`;
}

// ISO 주차 계산 (W47 형태로 표기)
function getWeekNumber(isoStr: string): number {
  const d = new Date(isoStr);
  const target = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = (target.getUTCDay() + 6) % 7;
  target.setUTCDate(target.getUTCDate() - dayNum + 3);
  const firstThursday = new Date(Date.UTC(target.getUTCFullYear(), 0, 4));
  const diff = target.getTime() - firstThursday.getTime();
  return 1 + Math.round(diff / (7 * 24 * 60 * 60 * 1000));
}

// 시안의 Delta 컴포넌트 — KPI 카드 하단 변화량 표시 (var(--ok)/var(--bdr-red) 토큰)
function Delta({ now, prev, prevWeek }: { now: number; prev: number; prevWeek: string }) {
  const diff = now - prev;
  const flat = Math.abs(diff) < 0.05;
  const up = diff > 0;
  const sign = flat ? "" : up ? "↑" : "↓";
  const txt = Math.abs(diff).toFixed(diff % 1 === 0 ? 0 : 1);
  // flat: 회색 / up: 성공색 / down: BDR red
  const color = flat
    ? "var(--color-text-muted)"
    : up
      ? "var(--ok, #22C55E)"
      : "var(--bdr-red, var(--color-primary))";
  return (
    <span
      style={{
        fontSize: 11,
        fontWeight: 700,
        color,
        fontFamily: "var(--ff-mono, ui-monospace, monospace)",
      }}
    >
      {sign} {txt}{" "}
      <span style={{ color: "var(--color-text-muted)", fontWeight: 500 }}>
        vs {prevWeek}
      </span>
    </span>
  );
}

// 시안의 Section 컴포넌트 — eyebrow 번호 + 제목 + 구분선
function Section({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section style={{ marginBottom: 28 }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 12 }}>
        <span
          style={{
            fontFamily: "var(--ff-mono, ui-monospace, monospace)",
            fontSize: 11,
            color: "var(--color-text-muted)",
            fontWeight: 700,
          }}
        >
          {eyebrow}
        </span>
        <h2
          style={{
            margin: 0,
            fontSize: 16,
            fontWeight: 800,
            letterSpacing: "-0.01em",
            color: "var(--color-text-primary)",
          }}
        >
          {title}
        </h2>
        <div
          style={{
            flex: 1,
            height: 1,
            background: "var(--color-border-subtle)",
          }}
        />
      </div>
      {children}
    </section>
  );
}

export default function WeeklyReportPage() {
  const router = useRouter();

  // 주간 리포트 데이터 패칭 (사이트 기존 방식 0 변경)
  const { data, isLoading, error } = useSWR<ReportData>(
    "/api/web/profile/weekly-report",
    { revalidateOnFocus: false, dedupingInterval: 60000 }
  );

  // 로딩 상태
  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
            리포트를 불러오는 중...
          </p>
        </div>
      </div>
    );
  }

  // 에러 또는 미인증 상태
  if (error || !data) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <span
            className="material-symbols-outlined text-5xl mb-4 block"
            style={{ color: "var(--color-text-disabled)" }}
          >
            error_outline
          </span>
          <p className="text-sm mb-4" style={{ color: "var(--color-text-secondary)" }}>
            리포트를 불러올 수 없습니다
          </p>
          <Link
            href="/profile"
            className="inline-block rounded-md px-6 py-2.5 text-sm font-bold text-white"
            style={{ backgroundColor: "var(--color-primary)" }}
          >
            프로필로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  const { this_week: tw, last_week: lw } = data;

  // 주차 라벨 계산 (period.this_week_start 기반)
  const weekNum = getWeekNumber(data.period.this_week_start);
  const year = new Date(data.period.this_week_start).getFullYear();
  const weekLabel = `${year}년 ${weekNum}주차`;
  const prevWeekLabel = `W${weekNum - 1}`;
  const nextWeekLabel = `W${weekNum + 1}`;

  // 이번주가 비어있으면 안내
  const hasThisWeekData = tw.session_count > 0;
  const hasLastWeekData = lw.session_count > 0;

  // 4 KPI 정의 — 사이트 데이터를 시안 KPI 슬롯에 매핑
  const kpis = [
    {
      label: "경기",
      val: tw.session_count,
      prev: lw.session_count,
      unit: "회",
      tone: "var(--color-primary)", // 시안 var(--accent) 매핑
    },
    {
      label: "운동 시간",
      val: parseFloat(formatHours(tw.total_minutes)),
      prev: parseFloat(formatHours(lw.total_minutes)),
      unit: hoursUnit(tw.total_minutes),
      tone: "var(--cafe-blue, #0079B9)",
    },
    {
      label: "획득 XP",
      val: tw.total_xp,
      prev: lw.total_xp,
      unit: "XP",
      tone: "var(--ok, #22C55E)",
    },
    {
      label: "방문 코트",
      val: tw.unique_courts,
      prev: lw.unique_courts,
      unit: "곳",
      tone: "var(--color-accent, #F59E0B)",
    },
  ];

  // 인사이트 동적 생성 — streak/평균/변화율 기반 카피
  const insights = [
    // 인사이트 1: 연속 출석 — streak 기반
    data.streak > 0
      ? {
          icon: "local_fire_department",
          head: `${data.streak}일 연속 출석 중`,
          body: "꾸준함이 가장 강력한 무기입니다. 다음 주에도 이 흐름을 이어가세요.",
          tone: "var(--color-accent, #F59E0B)",
        }
      : {
          icon: "calendar_month",
          head: "이번 주 활동을 시작해보세요",
          body: "코트에서 체크인하면 streak이 시작됩니다.",
          tone: "var(--color-text-muted)",
        },
    // 인사이트 2: 운동 시간 변화
    data.minutes_change > 0
      ? {
          icon: "trending_up",
          head: "운동 시간이 늘었습니다",
          body: `지난주 대비 ${data.minutes_change}% 증가. 체력이 붙고 있습니다.`,
          tone: "var(--ok, #22C55E)",
        }
      : data.minutes_change < 0
        ? {
            icon: "trending_down",
            head: "운동 시간이 줄었습니다",
            body: `지난주 대비 ${Math.abs(data.minutes_change)}% 감소. 다음 주에 회복해봅시다.`,
            tone: "var(--bdr-red, var(--color-primary))",
          }
        : {
            icon: "fitness_center",
            head: "안정적인 페이스를 유지 중",
            body: "지난주와 비슷한 운동량을 유지하고 있습니다.",
            tone: "var(--cafe-blue, #0079B9)",
          },
    // 인사이트 3: 다음 도전 (정적 카피, 추후 추천 엔진 연동 큐)
    {
      icon: "lightbulb",
      head: "다음 도전: 새로운 코트",
      body: "단골 코트 외 다른 곳도 방문해보세요. 새로운 멤버와의 매칭은 실력 향상의 지름길입니다.",
      tone: "var(--color-accent, #F59E0B)",
    },
  ];

  return (
    // 시안 max-width 720 — 이메일 뉴스레터 좁은 칼럼
    <div className="page" style={{ maxWidth: 720, margin: "0 auto", padding: "0 16px" }}>
      {/* 빵부스러기 — 시안 L80 */}
      <div
        style={{
          display: "flex",
          gap: 6,
          fontSize: 12,
          color: "var(--color-text-muted)",
          marginBottom: 12,
          flexWrap: "wrap",
          paddingTop: 8,
        }}
      >
        <Link href="/" style={{ cursor: "pointer" }}>
          홈
        </Link>
        <span>›</span>
        <Link href="/profile" style={{ cursor: "pointer" }}>
          내 프로필
        </Link>
        <span>›</span>
        <span style={{ color: "var(--color-text-primary)" }}>주간 리포트</span>
      </div>

      {/* HERO — 이메일 뉴스레터 톤 (시안 L86-97) */}
      <div
        style={{
          textAlign: "center",
          padding: "24px 0 28px",
          borderBottom: "1px solid var(--color-border-subtle)",
          marginBottom: 20,
        }}
      >
        {/* eyebrow — 발송 주기 표기 */}
        <div
          className="eyebrow"
          style={{
            marginBottom: 8,
            fontFamily: "var(--ff-mono, ui-monospace, monospace)",
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.12em",
            color: "var(--color-text-muted)",
            textTransform: "uppercase",
          }}
        >
          WEEKLY REPORT · 매주 월요일 도착
        </div>
        <h1
          style={{
            margin: "0 0 6px",
            fontSize: 30,
            fontWeight: 800,
            letterSpacing: "-0.015em",
            color: "var(--color-text-primary)",
          }}
        >
          {weekLabel}
        </h1>
        <div
          style={{
            fontSize: 13,
            color: "var(--color-text-muted)",
            marginBottom: 16,
          }}
        >
          {formatDate(data.period.this_week_start)} ~{" "}
          {formatDate(data.period.last_week_end)}
        </div>
        {/* 주차 navigation — 시안 L92-96 (현재 주차 고정, 이전/다음은 disabled — 추후 확장 큐) */}
        <div style={{ display: "flex", justifyContent: "center", gap: 8 }}>
          <button
            type="button"
            disabled
            style={{
              minWidth: 100,
              padding: "8px 14px",
              fontSize: 13,
              fontWeight: 600,
              borderRadius: 4,
              border: "1px solid var(--color-border-subtle)",
              background: "transparent",
              color: "var(--color-text-disabled)",
              cursor: "not-allowed",
              opacity: 0.6,
            }}
          >
            ← {prevWeekLabel}
          </button>
          <button
            type="button"
            disabled
            style={{
              minWidth: 120,
              padding: "8px 14px",
              fontSize: 13,
              fontWeight: 700,
              borderRadius: 4,
              border: "1px solid var(--color-primary)",
              background: "var(--color-primary)",
              color: "#FFFFFF",
              cursor: "default",
            }}
          >
            이번 주
          </button>
          <button
            type="button"
            disabled
            style={{
              minWidth: 100,
              padding: "8px 14px",
              fontSize: 13,
              fontWeight: 600,
              borderRadius: 4,
              border: "1px solid var(--color-border-subtle)",
              background: "transparent",
              color: "var(--color-text-disabled)",
              cursor: "not-allowed",
              opacity: 0.6,
            }}
          >
            {nextWeekLabel} →
          </button>
        </div>
      </div>

      {/* 인사 + 레벨 (사이트 고유 — 시안 미존재이지만 사용자 식별 정보 보존) */}
      <div
        style={{
          textAlign: "center",
          marginBottom: 20,
          padding: "12px 0",
        }}
      >
        <p style={{ fontSize: 24, marginBottom: 6 }}>{data.emoji || ""}</p>
        <p
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: "var(--color-text-primary)",
            marginBottom: 2,
          }}
        >
          {data.nickname}님
        </p>
        <p
          style={{
            fontSize: 12,
            color: "var(--color-text-muted)",
          }}
        >
          Lv.{data.level} {data.title}
          {data.streak > 0 && (
            <span style={{ marginLeft: 8 }}>
              <span
                className="material-symbols-outlined"
                style={{
                  fontSize: 14,
                  color: "var(--color-accent, #F59E0B)",
                  verticalAlign: "middle",
                }}
              >
                local_fire_department
              </span>{" "}
              {data.streak}일 연속
            </span>
          )}
        </p>
      </div>

      {/* SECTION 1: KPI 4 — 시안 L100-113 */}
      <Section eyebrow="01" title="이번 주 요약">
        {hasThisWeekData ? (
          // 시안의 인라인 grid repeat(2, 1fr) — 모바일 분기는 globals.css 자동 처리 안 됨,
          // 인라인이라 minmax 패턴으로 모바일 1열 자동 wrap 확보
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(min(160px, 100%), 1fr))",
              gap: 10,
            }}
          >
            {kpis.map((k) => (
              <div
                key={k.label}
                style={{
                  padding: "16px 18px",
                  background: "var(--color-surface, var(--color-bg-card))",
                  border: "1px solid var(--color-border-subtle)",
                  borderRadius: 4,
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    color: "var(--color-text-muted)",
                    fontWeight: 700,
                    letterSpacing: ".08em",
                    textTransform: "uppercase",
                    marginBottom: 6,
                  }}
                >
                  {k.label}
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "baseline",
                    gap: 4,
                    marginBottom: 6,
                  }}
                >
                  <span
                    style={{
                      fontSize: 28,
                      fontWeight: 900,
                      fontFamily: "var(--ff-display, var(--ff-base))",
                      color: k.tone,
                    }}
                  >
                    {k.val}
                  </span>
                  <span
                    style={{
                      fontSize: 12,
                      color: "var(--color-text-muted)",
                    }}
                  >
                    {k.unit}
                  </span>
                </div>
                {hasLastWeekData && (
                  <Delta now={k.val} prev={k.prev} prevWeek={prevWeekLabel} />
                )}
              </div>
            ))}
          </div>
        ) : (
          // 빈 상태 — 사이트 기존 카피 보존
          <div
            style={{
              textAlign: "center",
              padding: "32px 24px",
              background: "var(--color-surface, var(--color-bg-card))",
              border: "1px solid var(--color-border-subtle)",
              borderRadius: 4,
            }}
          >
            <span
              className="material-symbols-outlined"
              style={{
                fontSize: 36,
                color: "var(--color-text-disabled)",
                display: "block",
                marginBottom: 12,
              }}
            >
              fitness_center
            </span>
            <p
              style={{
                fontSize: 13,
                fontWeight: 500,
                color: "var(--color-text-secondary)",
                marginBottom: 4,
              }}
            >
              이번 주는 아직 운동 기록이 없어요
            </p>
            <p style={{ fontSize: 12, color: "var(--color-text-muted)" }}>
              코트에서 체크인하면 리포트에 반영됩니다
            </p>
            <Link
              href="/courts"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                marginTop: 16,
                padding: "8px 16px",
                fontSize: 13,
                fontWeight: 500,
                color: "var(--color-primary)",
                borderRadius: 4,
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                search
              </span>
              근처 코트 찾기
            </Link>
          </div>
        )}
      </Section>

      {/* SECTION 2: 자주 방문 코트 — 사이트 데이터 (시안 하이라이트 슬롯에 매핑) */}
      {tw.top_courts.length > 0 && (
        <Section eyebrow="02" title="자주 방문한 코트">
          <div
            style={{
              background: "var(--color-surface, var(--color-bg-card))",
              border: "1px solid var(--color-border-subtle)",
              borderRadius: 4,
              overflow: "hidden",
            }}
          >
            {tw.top_courts.map((court, idx) => (
              <Link key={court.court_id} href={`/courts/${court.court_id}`}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "14px 18px",
                    borderBottom:
                      idx === tw.top_courts.length - 1
                        ? "none"
                        : "1px solid var(--color-border-subtle)",
                  }}
                >
                  {/* 순위 뱃지 — 1금/2은/3동 */}
                  <div
                    style={{
                      flexShrink: 0,
                      width: 32,
                      height: 32,
                      borderRadius: 16, // 원형 — 순위 뱃지는 시안에서 시각 강조
                      display: "grid",
                      placeItems: "center",
                      fontSize: 13,
                      fontWeight: 700,
                      color: "#FFFFFF",
                      background:
                        idx === 0
                          ? "var(--color-accent, #F59E0B)"
                          : idx === 1
                            ? "var(--color-tier-silver, #94A3B8)"
                            : "var(--color-tier-bronze, #CD7F32)",
                    }}
                  >
                    {idx + 1}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: "var(--color-text-primary)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {court.name}
                    </p>
                  </div>
                  <span
                    style={{
                      flexShrink: 0,
                      fontSize: 13,
                      fontWeight: 700,
                      color: "var(--color-primary)",
                    }}
                  >
                    {court.visits}회
                  </span>
                  <span
                    className="material-symbols-outlined"
                    style={{
                      fontSize: 18,
                      color: "var(--color-text-disabled)",
                    }}
                  >
                    chevron_right
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </Section>
      )}

      {/* SECTION 3: 인사이트 — 시안 L145-159 (3 인사이트 동적 카피) */}
      <Section eyebrow="03" title="이번 주 인사이트">
        <div style={{ display: "grid", gap: 10 }}>
          {insights.map((ins, i) => (
            <div
              key={i}
              style={{
                padding: "14px 18px",
                display: "grid",
                gridTemplateColumns: "40px 1fr",
                gap: 14,
                alignItems: "flex-start",
                background: "var(--color-surface, var(--color-bg-card))",
                border: "1px solid var(--color-border-subtle)",
                borderRadius: 4,
              }}
            >
              {/* 아이콘 박스 — color-mix 14% 배경 (시안 L149) */}
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 4, // 4px 룰
                  background: `color-mix(in oklab, ${ins.tone} 14%, transparent)`,
                  color: ins.tone,
                  display: "grid",
                  placeItems: "center",
                }}
              >
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: 22 }}
                >
                  {ins.icon}
                </span>
              </div>
              <div>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    marginBottom: 3,
                    color: "var(--color-text-primary)",
                  }}
                >
                  {ins.head}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: "var(--color-text-secondary)",
                    lineHeight: 1.6,
                  }}
                >
                  {ins.body}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* SECTION 4: 지난주 비교 (사이트 고유 — 데이터 풍부함 보존) */}
      {hasLastWeekData && (
        <Section eyebrow="04" title="지난주 상세 비교">
          <div
            style={{
              padding: "16px 18px",
              background: "var(--color-surface, var(--color-bg-card))",
              border: "1px solid var(--color-border-subtle)",
              borderRadius: 4,
            }}
          >
            <p
              style={{
                fontSize: 11,
                color: "var(--color-text-muted)",
                marginBottom: 14,
                fontFamily: "var(--ff-mono, ui-monospace, monospace)",
              }}
            >
              {formatDate(data.period.last_week_start)} ~{" "}
              {formatDate(data.period.last_week_end)}
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {/* 행: 지난주 → 이번주 */}
              {[
                {
                  label: "운동 횟수",
                  prev: `${lw.session_count}회`,
                  now: `${tw.session_count}회`,
                },
                {
                  label: "운동 일수",
                  prev: `${lw.active_days}일`,
                  now: `${tw.active_days}일`,
                },
                {
                  label: "방문 코트",
                  prev: `${lw.unique_courts}곳`,
                  now: `${tw.unique_courts}곳`,
                },
                {
                  label: "획득 XP",
                  prev: `+${lw.total_xp}`,
                  now: `+${tw.total_xp}`,
                },
              ].map((row) => (
                <div
                  key={row.label}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    fontSize: 13,
                  }}
                >
                  <span style={{ color: "var(--color-text-secondary)" }}>
                    {row.label}
                  </span>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <span
                      style={{
                        fontWeight: 700,
                        color: "var(--color-text-muted)",
                      }}
                    >
                      {row.prev}
                    </span>
                    <span
                      style={{
                        fontSize: 11,
                        color: "var(--color-text-disabled)",
                      }}
                    >
                      →
                    </span>
                    <span
                      style={{
                        fontWeight: 700,
                        color: "var(--color-text-primary)",
                      }}
                    >
                      {row.now}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Section>
      )}

      {/* FOOTER — 구독 관리 + 12주 추이 (시안 L177-183) */}
      <div
        style={{
          textAlign: "center",
          padding: "28px 0 16px",
          borderTop: "1px solid var(--color-border-subtle)",
          marginTop: 24,
          fontSize: 12,
          color: "var(--color-text-muted)",
          lineHeight: 1.7,
        }}
      >
        매주 월요일 오전 9시에 받아보고 있습니다.
        <br />
        {/* 사용자 결정: 이메일 구독 관리 → /profile/notification-settings */}
        <Link
          href="/profile/notification-settings"
          style={{
            color: "var(--cafe-blue, #0079B9)",
            cursor: "pointer",
          }}
        >
          이메일 구독 관리
        </Link>
        {" · "}
        <Link
          href="/profile/growth"
          style={{
            color: "var(--cafe-blue, #0079B9)",
            cursor: "pointer",
          }}
        >
          12주 성장 추이 보기 →
        </Link>
      </div>

      {/* 뒤로가기 — AppNav 호환 (사이트 기존 패턴 보존) */}
      <div style={{ textAlign: "center", padding: "8px 0 24px" }}>
        <button
          type="button"
          onClick={() => router.back()}
          style={{
            background: "transparent",
            border: "none",
            color: "var(--color-text-muted)",
            fontSize: 12,
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
          }}
          aria-label="뒤로가기"
        >
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
            arrow_back
          </span>
          뒤로
        </button>
      </div>
    </div>
  );
}

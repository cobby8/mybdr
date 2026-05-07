"use client";

/* ============================================================
 * ProfileSettingsPage — Settings v2.3 허브 (7 섹션 + 좌측 sticky nav)
 *
 * 왜 (Phase 5 → Phase A 재구성 2026-05-01):
 *  - BDR v2.3 시안 Settings.jsx 의 7 섹션 구조로 재구성:
 *      account / feed / notify / bottomNav / billing / display / danger
 *  - 사용자 결정 7건 반영:
 *      A1-DB-direct: feed = preferences 풀 흡수 (PreferenceForm mode="settings")
 *      B3-fallback : profile 섹션 삭제 + IdentityVerifyButton → account 섹션 이전
 *      C3          : BottomNav 풀 도입 (Phase B). 여기서는 편집기 (bottomNav 섹션)만
 *      D2          : display 풀 박제 + 9999px → 50% (정사각형 원형)
 *      Q1=①        : /profile/preferences redirect ?section=feed 매핑
 *      Q2=전체     : PreferenceForm 8섹션 풀 폼 흡수
 *      Q3=빼기     : 성별 chip 시안에서만 / DB 신설 안 함 (PreferenceForm 그대로 사용)
 *  - 기존 ?tab=preferences|notifications 외부 링크/북마크는 ?section= 로 폴백.
 *  - API/Prisma/서비스는 0 변경 — 신규 fetch 추가 안 함.
 *
 * 어떻게:
 *  - 활성 섹션은 URL ?section=... 으로 관리 (새로고침/공유/뒤로가기 보존).
 *  - 좌측 220px sticky nav + 우측 카드. 모바일에서는 1열 스택.
 *  - 페이지 마운트 시 GET /api/web/profile + GET /api/web/profile/subscription 만 호출
 *    (notify 섹션은 내부에서 GET notification-settings 1회 — v1 동일 패턴).
 *  - 비활성 섹션은 조건부 렌더 안 함(=mount 안 함) 으로 무거운 sub fetch 회피.
 * ============================================================ */

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { SettingsSideNavV2 } from "./_components_v2/settings-side-nav-v2";
import { resolveSection, type SectionKey } from "./_components_v2/section-key";
import { AccountSectionV2 } from "./_components_v2/account-section-v2";
import { FeedSectionV2 } from "./_components_v2/feed-section-v2";
import { NotifySectionV2 } from "./_components_v2/notify-section-v2";
import { BottomNavEditorSectionV2 } from "./_components_v2/bottom-nav-editor-v2";
import {
  BillingSectionV2,
  type BillingSummary,
} from "./_components_v2/billing-section-v2";
import { DisplaySectionV2 } from "./_components_v2/display-section-v2";
import { DangerSectionV2 } from "./_components_v2/danger-section-v2";

// 섹션 사이에 공유되는 사용자 요약 (account/billing 에 사용)
interface ProfileApiUser {
  email?: string | null;
  name?: string | null;
  // Phase 12-5: AccountSectionV2 IdentityVerifyButton 의 initialVerified 로 전달
  name_verified?: boolean | null;
}

// 단일 정수 → "₩4,900" 같은 표시 — Intl 사용 (브라우저 내장)
function formatKRW(value: number): string {
  return new Intl.NumberFormat("ko-KR", {
    style: "currency",
    currency: "KRW",
    maximumFractionDigits: 0,
  }).format(value);
}

// 만료일 ISO → "YYYY.MM.DD"
function formatYMD(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}.${m}.${day}`;
}

export default function ProfileSettingsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // 활성 섹션: ?section= 우선, ?tab= 폴백, 기본 account
  const rawSection = searchParams.get("section");
  const rawTab = searchParams.get("tab");
  const activeSection: SectionKey = resolveSection(rawSection, rawTab);

  const handleSectionChange = useCallback(
    (id: SectionKey) => {
      // history 누적 방지 + 스크롤 점프 방지
      router.replace(`/profile/settings?section=${id}`, { scroll: false });
    },
    [router],
  );

  /* ----------- 공유 데이터 (account/billing 사용) ----------- */
  const [user, setUser] = useState<ProfileApiUser | null>(null);
  const [billing, setBilling] = useState<BillingSummary | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let aborted = false;

    // 두 GET 병렬. 신규 추가 fetch 0건 — 이미 시스템에 있던 라우트.
    Promise.all([
      fetch("/api/web/profile", { credentials: "include" })
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null),
      fetch("/api/web/profile/subscription", { credentials: "include" })
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null),
    ]).then(([profileData, subData]) => {
      if (aborted) return;

      // 1) profile 응답 파싱 — apiSuccess 가 snake_case 직렬화
      if (profileData?.user) {
        const u = profileData.user as Record<string, unknown>;
        setUser({
          email: (u.email as string | null) ?? null,
          name: (u.name as string | null) ?? null,
          // AccountSectionV2 IdentityVerifyButton 의 initialVerified 로 전달
          name_verified: (u.name_verified as boolean | null) ?? false,
        });
      }

      // 2) subscription 응답 파싱 — 활성/유효한 구독 1건 추출
      if (subData?.subscriptions && Array.isArray(subData.subscriptions)) {
        type SubItem = {
          plan: { name: string; price?: number | null };
          status: string;
          expires_at: string | null;
          is_usable: boolean;
        };
        const items = subData.subscriptions as SubItem[];
        // is_usable 인 것 중 가장 최근. 없으면 무료 플랜 표기.
        const usable = items.find((s) => s.is_usable);
        if (usable) {
          const priceStr =
            typeof usable.plan.price === "number"
              ? `${formatKRW(usable.plan.price)}/월 · `
              : "";
          const ymd = formatYMD(usable.expires_at);
          const caption = `${priceStr}${ymd ? `다음 결제 ${ymd}` : "활성 구독"}`;
          setBilling({
            plan_label: usable.plan.name,
            next_billing_caption: caption,
            is_paid_member: true,
            payment_method_masked: null, // DB 미지원
          });
        } else {
          setBilling({
            plan_label: "BDR 베이직",
            next_billing_caption: "무료 플랜 사용 중",
            is_paid_member: false,
            payment_method_masked: null,
          });
        }
      } else {
        setBilling({
          plan_label: "BDR 베이직",
          next_billing_caption: "무료 플랜 사용 중",
          is_paid_member: false,
          payment_method_masked: null,
        });
      }

      setLoaded(true);
    });

    return () => {
      aborted = true;
    };
  }, []);

  // 5/7 PR1.3: handleIdentityVerified 제거 — settings 가 더 이상 본인인증 직접 처리 X.
  // 인증은 /onboarding/identity 단일 진입점에서만 이루어짐 (다른 페이지로 redirect 후 재로드).

  return (
    <div className="page" style={{ minHeight: "100vh" }}>
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "0 16px 80px" }}>
        {/* ============== 페이지 헤더 (시안 eyebrow + h1 + 캡션) ============== */}
        <div style={{ marginBottom: 20 }}>
          <div className="eyebrow">SETTINGS · 환경 설정</div>
          <h1
            style={{
              margin: "6px 0 2px",
              fontSize: 28,
              fontWeight: 800,
              letterSpacing: "-0.015em",
            }}
          >
            환경 설정
          </h1>
          <div style={{ fontSize: 13, color: "var(--ink-mute)" }}>
            계정·보안·알림·결제 등 시스템 설정. 프로필 콘텐츠 편집은{" "}
            <a
              href="/profile/edit"
              style={{
                color: "var(--cafe-blue)",
                textDecoration: "underline",
              }}
            >
              프로필 편집
            </a>{" "}
            으로 이동.
          </div>
        </div>

        {/* ============== 좌측 sticky nav + 우측 카드 ============== */}
        {/* grid 분기: <1024px 1열 + ≥1024px 220px+1fr (side-nav lg:block 과 일치).
            inline style 의 gridTemplateColumns 는 제거 — inline 이 styled-jsx 보다
            CSS specificity 가 높아 미디어 쿼리가 무시되는 회귀 (2026-05-01 fix). */}
        <div
          style={{
            display: "grid",
            gap: 24,
            alignItems: "flex-start",
          }}
          className="settings-grid-v2"
        >
          <SettingsSideNavV2
            activeSection={activeSection}
            onSectionChange={handleSectionChange}
          />

          <div
            className="card"
            style={{ padding: "24px 28px", minWidth: 0 }}
            // 우측 카드: 시안의 padding 24/28
          >
            {/* 비활성 섹션은 mount 안 함 → 불필요한 fetch/렌더 회피 */}
            {activeSection === "account" && (
              // user 가 아직 도착 안 했으면 자리 표시
              <AccountSectionV2 user={loaded ? user : null} />
            )}
            {activeSection === "feed" && <FeedSectionV2 />}
            {activeSection === "notify" && <NotifySectionV2 />}
            {activeSection === "bottomNav" && <BottomNavEditorSectionV2 />}
            {activeSection === "billing" && (
              <BillingSectionV2 summary={loaded ? billing : null} />
            )}
            {activeSection === "display" && <DisplaySectionV2 />}
            {activeSection === "danger" && <DangerSectionV2 />}
          </div>
        </div>
      </div>

      {/* ============== 반응형: <1024px 1열 + ≥1024px 2열 ==============
          lg(1024px) — side-nav 의 `hidden lg:block` / 모바일 탭 `lg:hidden` 분기와 일치.
          768~1023px 폭에서는 모바일 탭 + 본문(1열) 스택 (시안 동일). */}
      <style jsx>{`
        .settings-grid-v2 {
          grid-template-columns: minmax(0, 1fr);
        }
        @media (min-width: 1024px) {
          .settings-grid-v2 {
            grid-template-columns: 220px minmax(0, 1fr);
          }
        }
      `}</style>
    </div>
  );
}

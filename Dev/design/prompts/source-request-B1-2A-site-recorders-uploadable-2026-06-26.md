# B1.2A Site and Recorders Panels - Uploadable Markdown

Use this file after B1/B1.1 analysis. It contains only the remaining source files requested by Claude.ai.

## Request

- Update _qa/current-src-inventory.md with B1.2A source measurements.
- Extend _qa/reverse-bake-gap.md with B1.2A findings.
- Extend _qa/bake-fix-checklist-B1.md with B1.2A BDR-current reverse-bake steps.
- Keep scope to BDR-current reverse-bake checklist. Do not propose runtime API, Prisma, or route changes.
- Translate Toss/lucide/rounded-full/ui-kit patterns into BDR 13-rule equivalents in the checklist.

## Files

### File: src/app/(admin)/tournament-admin/tournaments/[id]/_panels/site-panel.tsx

````tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { PanelLoadingState } from "./panel-loading-state";
import Link from "next/link";
import { Button } from "@/components/ui/button";
// 2026-05-11: BDR 브랜드 hex hardcode 단일화
import { BDR_PRIMARY_HEX } from "@/lib/constants/colors";

// ─── 상수 ─────────────────────────────────────────────────────────────────────

// 미리보기 시뮬레이션 — 사용자가 선택할 수 있는 사이트 템플릿의 미리보기용 hex.
// CSS 변수 (`var(--*)`) 미사용 의도: 미리보기 카드는 실제 사이트의 적용 결과를
// 시각적으로 시뮬레이션해야 함 → 사용자의 다크/라이트 모드 영향을 받지 않도록 고정 hex.
const TEMPLATES = [
  {
    slug: "classic-tournament",
    name: "Classic",
    desc: "깔끔한 화이트 배경의 모던 레이아웃",
    navBg: "#1B3C87",
    bg: "#F5F7FA",
    cardBg: "#FFFFFF",
  },
  {
    slug: "the-process",
    name: "Dark",
    desc: "강렬한 다크 배경의 대담한 스타일",
    navBg: "#1F2937",
    bg: "#0F172A",
    cardBg: "#1E293B",
  },
  {
    slug: "minimal-white",
    name: "Minimal",
    desc: "타이포그래피 중심의 미니멀한 느낌",
    navBg: "#FFFFFF",
    bg: "#FFFFFF",
    cardBg: "#F5F7FA",
  },
];

// 색상 팔레트 — 사용자가 대회 사이트 primary 색상으로 고를 수 있는 선택지.
// `BDR_PRIMARY_HEX` 만 lib/constants/colors.ts 단일 source 적용 (브랜드 원색은 단일 관리).
// 그 외 팔레트는 사용자 선택지 자체가 의도 → 별도 상수화 X.
const COLOR_PRESETS = [
  { hex: "#1B3C87", name: "토스 블루" },
  { hex: "#EF4444", name: "레드" },
  // 2026-05-11 fix — 기존 "오렌지" 라벨은 hex (#E31B23 = BDR Red) 와 불일치 → "BDR Red" 로 정정
  { hex: BDR_PRIMARY_HEX, name: "BDR Red" },
  { hex: "#22C55E", name: "그린" },
  { hex: "#8B5CF6", name: "퍼플" },
  { hex: "#FBBF24", name: "골드" },
  { hex: "#0EA5E9", name: "스카이" },
  { hex: "#1F2937", name: "다크" },
];

// ─── 타입 ─────────────────────────────────────────────────────────────────────

// 2026-05-15 (Snake-case sync fix) — apiSuccess() 가 응답 키를 자동 snake_case
// 변환하므로 GET /site 응답 = snake_case. 이전에 camelCase (isPublished) 로
// 정의해서 site?.isPublished = undefined → 발행 후 UI 전환 실패.
// errors.md "재발 5회" 패턴 6회째 회귀 차단.
type Site = {
  id: string;
  subdomain: string;
  is_published: boolean;
  primary_color: string | null;
  secondary_color: string | null;
  site_name: string | null;
  site_template_slug?: string | null;
};

// ─── 템플릿 미리보기 카드 ────────────────────────────────────────────────────

function TemplateMockup({
  template,
  accentColor,
}: {
  template: (typeof TEMPLATES)[0];
  accentColor: string;
}) {
  const nav = template.slug === "minimal-white" ? "#FFFFFF" : accentColor;
  const navTextColor = template.slug === "minimal-white" ? accentColor : "#FFFFFF";

  return (
    <div
      className="overflow-hidden rounded-md border-2 border-transparent"
      style={{ backgroundColor: template.bg, height: 120 }}
    >
      {/* 네비 */}
      <div
        className="flex h-7 items-center gap-1 px-2"
        style={{ backgroundColor: nav }}
      >
        <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: navTextColor, opacity: 0.5 }} />
        <div className="h-1.5 w-8 rounded-full" style={{ backgroundColor: navTextColor, opacity: 0.8 }} />
        <div className="ml-auto flex gap-1">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-1.5 w-4 rounded-full" style={{ backgroundColor: navTextColor, opacity: 0.5 }} />
          ))}
        </div>
      </div>
      {/* 히어로 */}
      <div className="mx-2 mt-2 h-5 rounded-lg" style={{ backgroundColor: accentColor, opacity: 0.15 }}>
        <div className="flex h-full items-center justify-center">
          <div className="h-1.5 w-16 rounded-full" style={{ backgroundColor: accentColor, opacity: 0.7 }} />
        </div>
      </div>
      {/* 콘텐츠 행 */}
      <div className="mx-2 mt-2 space-y-1.5">
        {[0.8, 0.5, 0.3].map((op, i) => (
          <div
            key={i}
            className="h-2 rounded-full"
            style={{ backgroundColor: template.cardBg, opacity: op, width: `${[80, 60, 45][i]}%` }}
          />
        ))}
      </div>
    </div>
  );
}

// ─── 메인 컴포넌트 ───────────────────────────────────────────────────────────

export default function TournamentSitePage() {
  const { id } = useParams<{ id: string }>();
  const [site, setSite] = useState<Site | null>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState("");

  // 상태
  const [selectedTemplate, setSelectedTemplate] = useState("classic-tournament");
  const [selectedColor, setSelectedColor] = useState("#1B3C87");
  const [subdomain, setSubdomain] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/web/tournaments/${id}/site`);
      if (res.ok) {
        // 2026-05-15 — 응답 = snake_case (apiSuccess 자동 변환). site_template relation 도 site_template 로 변환됨.
        const data: Site & { site_template?: { slug: string } | null } = await res.json();
        if (data?.id) {
          setSite(data);
          if (data.site_template?.slug) setSelectedTemplate(data.site_template.slug);
          if (data.primary_color) setSelectedColor(data.primary_color);
          if (data.subdomain) setSubdomain(data.subdomain);
        }
      }
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  // PATCH 저장 (템플릿 + 색상 + 서브도메인)
  const save = async (opts?: { andPublish?: boolean }) => {
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/web/tournaments/${id}/site`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subdomain: subdomain.trim().toLowerCase(),
          siteTemplateSlug: selectedTemplate,
          primaryColor: selectedColor,
          secondaryColor: selectedColor,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "저장 실패");
      await load();

      if (opts?.andPublish) {
        await togglePublish(true);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "오류 발생");
      setSaving(false);
      return false;
    }
    setSaving(false);
    return true;
  };

  const togglePublish = async (forcePublish?: boolean) => {
    setPublishing(true);
    setError("");
    try {
      const res = await fetch(`/api/web/tournaments/${id}/site/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publish: forcePublish ?? !site?.is_published }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "실패");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "오류 발생");
    } finally {
      setPublishing(false);
    }
  };

  const handleNextFromStep2 = async () => {
    // Step 2 → Step 3: subdomain 입력은 Step 3 에서 받음 → subdomain 있을 때만 중간 저장.
    // (2026-05-15 fix: subdomain 빈 상태 PATCH 시 BFF 가 400 "서브도메인이 필요합니다" 반환 → UX 차단.)
    if (subdomain.trim()) {
      const ok = await save();
      if (!ok) return;
    }
    setStep(3);
  };

  if (loading) return <PanelLoadingState label="사이트 설정을 준비 중입니다." />;

  // ─── 발행 완료 상태 ──────────────────────────────────────────────────────

  if (site?.is_published) {
    return (
      <div data-skin="toss">
        <div className="mb-6">
          <Link href={`/tournament-admin/tournaments/${id}`} className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]">
            ← 대회 관리
          </Link>
          <h1 className="mt-1 text-xl font-bold sm:text-2xl">사이트 관리</h1>
        </div>

        {/* 발행 중 상태 카드 */}
        <div className="mb-6 rounded-md border border-[var(--color-success)]/30 bg-[var(--color-success)]/5 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[var(--color-success)]">● 사이트 공개 중</p>
              <p className="mt-0.5 font-mono text-lg font-semibold text-[var(--color-text-primary)]">
                {site.subdomain}.mybdr.kr
              </p>
            </div>
            <div className="flex gap-2">
              {/* 2026-05-12 — pill 9999px ❌ → btn 클래스 (4px 라운딩 표준) */}
              <a
                href={`https://${site.subdomain}.mybdr.kr`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn--sm"
              >
                방문하기 ↗
              </a>
              <button
                onClick={() => togglePublish(false)}
                disabled={publishing}
                className="rounded-[4px] border border-[var(--color-error)]/30 px-4 py-2 text-sm text-[var(--color-error)] hover:bg-[var(--color-error)]/5 disabled:opacity-50"
              >
                {publishing ? "처리 중..." : "비공개 전환"}
              </button>
            </div>
          </div>
        </div>

        {/* [2026-04-22] 하드코딩 색상 → --color-* 토큰화 */}
        {error && (
          <div
            className="mb-4 rounded-md px-4 py-3 text-sm"
            style={{
              backgroundColor: "color-mix(in srgb, var(--color-error) 10%, transparent)",
              color: "var(--color-error)",
            }}
          >
            {error}
          </div>
        )}

        {/* 수정 버튼들 */}
        <div className="grid gap-3 md:grid-cols-3">
          <button
            onClick={() => setStep(1)}
            className="rounded-md border border-[var(--color-border)] bg-white p-5 text-left shadow-sm transition-shadow hover:shadow-md"
          >
            <p className="text-2xl mb-2">🎨</p>
            <p className="font-semibold text-[var(--color-text-primary)]">템플릿 변경</p>
            <p className="mt-0.5 text-sm text-[var(--color-text-muted)]">
              {TEMPLATES.find((t) => t.slug === selectedTemplate)?.name ?? "Classic"}
            </p>
          </button>
          <button
            onClick={() => setStep(2)}
            className="rounded-md border border-[var(--color-border)] bg-white p-5 text-left shadow-sm transition-shadow hover:shadow-md"
          >
            <div
              className="mb-2 h-8 w-8 rounded-full border-2 border-white shadow"
              style={{ backgroundColor: selectedColor }}
            />
            <p className="font-semibold text-[var(--color-text-primary)]">색상 변경</p>
            <p className="mt-0.5 font-mono text-sm text-[var(--color-text-muted)]">{selectedColor}</p>
          </button>
          <Link
            href={`/tournament-admin/tournaments/${id}#publish`}
            className="rounded-md border border-[var(--color-border)] bg-white p-5 text-left shadow-sm transition-shadow hover:shadow-md"
          >
            <p className="text-2xl mb-2">📄</p>
            <p className="font-semibold text-[var(--color-text-primary)]">공지 페이지</p>
            <p className="mt-0.5 text-sm text-[var(--color-text-muted)]">공지사항 작성</p>
          </Link>
        </div>

        {/* 스텝 1 오버레이 */}
        {step === 1 && (
          <Step1
            selected={selectedTemplate}
            accentColor={selectedColor}
            onChange={setSelectedTemplate}
            onNext={() => setStep(2)}
            onCancel={() => setStep(0)}
          />
        )}
        {step === 2 && (
          <Step2
            selected={selectedColor}
            onChange={setSelectedColor}
            onNext={handleNextFromStep2}
            onBack={() => setStep(1)}
            saving={saving}
          />
        )}
      </div>
    );
  }

  // ─── 위자드 (3단계) ──────────────────────────────────────────────────────

  return (
    // Track B-c — Toss 토큰 적용 루트 opt-in
    <div data-skin="toss">
      {/* 헤더 */}
      <div className="mb-8">
        <Link href={`/tournament-admin/tournaments/${id}`} className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]">
          ← 대회 관리
        </Link>
        <h1 className="mt-1 text-xl font-bold sm:text-2xl">사이트 만들기</h1>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
          3단계로 대회 전용 웹사이트를 만들어보세요
        </p>
      </div>

      {/* 진행 표시 */}
      <div className="mb-8 flex items-center gap-2">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div
              // 2026-05-12 — admin 빨강 본문 금지 (step indicator) → info(Navy)
              className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold transition-colors ${
                step === s
                  ? "bg-[var(--color-info)] text-white"
                  : step > s
                  ? "bg-[var(--color-success)] text-white"
                  : "bg-[var(--color-border)] text-[var(--color-text-muted)]"
              }`}
            >
              {step > s ? "✓" : s}
            </div>
            <span
              className={`text-sm font-medium ${
                step === s ? "text-[var(--color-text-primary)]" : "text-[var(--color-text-muted)]"
              }`}
            >
              {["템플릿", "색상", "발행"][s - 1]}
            </span>
            {s < 3 && <div className="h-px w-8 bg-[var(--color-border)]" />}
          </div>
        ))}
      </div>

      {/* [2026-04-22] 하드코딩 색상 → --color-* 토큰화 */}
      {error && (
        <div
          className="mb-4 rounded-md px-4 py-3 text-sm"
          style={{
            backgroundColor: "color-mix(in srgb, var(--color-error) 10%, transparent)",
            color: "var(--color-error)",
          }}
        >
          {error}
        </div>
      )}

      {/* 단계별 컨텐츠 */}
      {step === 1 && (
        <Step1
          selected={selectedTemplate}
          accentColor={selectedColor}
          onChange={setSelectedTemplate}
          onNext={() => setStep(2)}
        />
      )}

      {step === 2 && (
        <Step2
          selected={selectedColor}
          onChange={setSelectedColor}
          onNext={handleNextFromStep2}
          onBack={() => setStep(1)}
          saving={saving}
        />
      )}

      {step === 3 && (
        <Step3
          subdomain={subdomain}
          onChange={setSubdomain}
          selectedTemplate={selectedTemplate}
          selectedColor={selectedColor}
          siteId={site?.id}
          saving={saving || publishing}
          onBack={() => setStep(2)}
          onPublish={async () => {
            const ok = await save({ andPublish: true });
            if (!ok) return;
          }}
          onSaveDraft={async () => {
            await save();
          }}
          error={error}
        />
      )}
    </div>
  );
}

// ─── 스텝 1: 템플릿 선택 ────────────────────────────────────────────────────

function Step1({
  selected,
  accentColor,
  onChange,
  onNext,
  onCancel,
}: {
  selected: string;
  accentColor: string;
  onChange: (slug: string) => void;
  onNext: () => void;
  onCancel?: () => void;
}) {
  return (
    <div>
      <h2 className="mb-2 text-lg font-bold text-[var(--color-text-primary)]">템플릿 선택</h2>
      <p className="mb-6 text-sm text-[var(--color-text-muted)]">
        대회 사이트의 전체 스타일을 선택하세요. 언제든지 변경할 수 있습니다.
      </p>

      <div className="grid gap-4 md:grid-cols-3">
        {TEMPLATES.map((tpl) => (
          <button
            key={tpl.slug}
            onClick={() => onChange(tpl.slug)}
            className={`rounded-md border-2 p-4 text-left transition-all ${
              selected === tpl.slug
                ? "border-[var(--color-accent)] shadow-[0_0_0_4px_rgba(0,102,255,0.1)]"
                : "border-[var(--color-border)] hover:border-[var(--color-text-muted)]"
            }`}
          >
            <TemplateMockup template={tpl} accentColor={accentColor} />
            <div className="mt-3">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-[var(--color-text-primary)]">{tpl.name}</p>
                {selected === tpl.slug && (
                  /* 2026-05-12 — 선택됨 ✓ = 긍정 결과 → success(Green) (룰 11 — 승자/긍정 = success) */
                  <span className="text-xs font-medium text-[var(--color-success)]">선택됨 ✓</span>
                )}
              </div>
              <p className="mt-0.5 text-sm text-[var(--color-text-muted)]">{tpl.desc}</p>
            </div>
          </button>
        ))}
      </div>

      <div className="mt-8 flex justify-between">
        {onCancel && (
          <button onClick={onCancel} className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]">
            취소
          </button>
        )}
        <Button onClick={onNext} className="ml-auto">
          다음: 색상 선택 →
        </Button>
      </div>
    </div>
  );
}

// ─── 스텝 2: 색상 선택 ──────────────────────────────────────────────────────

function Step2({
  selected,
  onChange,
  onNext,
  onBack,
  saving,
}: {
  selected: string;
  onChange: (hex: string) => void;
  onNext: () => void;
  onBack: () => void;
  saving: boolean;
}) {
  return (
    <div>
      <h2 className="mb-2 text-lg font-bold text-[var(--color-text-primary)]">대표 색상 선택</h2>
      <p className="mb-6 text-sm text-[var(--color-text-muted)]">
        사이트 네비게이션과 강조 색상으로 사용됩니다.
      </p>

      {/* 색상 팔레트 */}
      <div className="flex flex-wrap gap-4">
        {COLOR_PRESETS.map((c) => (
          <button
            key={c.hex}
            onClick={() => onChange(c.hex)}
            title={c.name}
            className={`group relative flex flex-col items-center gap-2 ${
              selected === c.hex ? "" : "opacity-80 hover:opacity-100"
            }`}
          >
            <div
              className={`h-14 w-14 rounded-full shadow-md transition-transform ${
                selected === c.hex
                  ? "scale-110 ring-4 ring-[var(--color-accent)]/30 ring-offset-2"
                  : "hover:scale-105"
              }`}
              style={{ backgroundColor: c.hex }}
            />
            <span className="text-xs text-[var(--color-text-muted)]">{c.name}</span>
            {selected === c.hex && (
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-lg text-white drop-shadow">✓</span>
              </div>
            )}
          </button>
        ))}
      </div>

      {/* 미리보기 */}
      <div className="mt-8 rounded-md border border-[var(--color-border)] p-4">
        <p className="mb-3 text-xs font-medium text-[var(--color-text-muted)]">미리보기</p>
        <div className="overflow-hidden rounded-md" style={{ height: 64 }}>
          <div
            className="flex h-10 items-center gap-2 px-4"
            style={{ backgroundColor: selected }}
          >
            <div className="h-5 w-5 rounded-full bg-white/20" />
            <div className="h-2 w-20 rounded-full bg-white/80" />
            <div className="ml-auto flex gap-2">
              {["홈", "팀", "일정", "결과"].map((l) => (
                <span key={l} className="text-xs text-white/80">{l}</span>
              ))}
            </div>
          </div>
          <div
            className="flex items-center justify-center"
            style={{ height: 24, backgroundColor: `${selected}15` }}
          >
            <div className="h-1.5 w-24 rounded-full" style={{ backgroundColor: selected, opacity: 0.5 }} />
          </div>
        </div>
      </div>

      <div className="mt-8 flex justify-between">
        <button onClick={onBack} className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]">
          ← 이전
        </button>
        <Button onClick={onNext} disabled={saving}>
          {saving ? "저장 중..." : "다음: 주소 설정 →"}
        </Button>
      </div>
    </div>
  );
}

// ─── 스텝 3: 주소 설정 + 발행 ────────────────────────────────────────────────

function Step3({
  subdomain,
  onChange,
  selectedTemplate,
  selectedColor,
  siteId,
  saving,
  onBack,
  onPublish,
  onSaveDraft,
  error,
}: {
  subdomain: string;
  onChange: (v: string) => void;
  selectedTemplate: string;
  selectedColor: string;
  siteId?: string;
  saving: boolean;
  onBack: () => void;
  onPublish: () => void;
  onSaveDraft: () => void;
  error: string;
}) {
  const tplName = TEMPLATES.find((t) => t.slug === selectedTemplate)?.name ?? "Classic";

  return (
    <div>
      <h2 className="mb-2 text-lg font-bold text-[var(--color-text-primary)]">주소 설정 및 발행</h2>
      <p className="mb-6 text-sm text-[var(--color-text-muted)]">
        대회 사이트 URL을 설정하고 바로 공개하거나 임시 저장할 수 있습니다.
      </p>

      {/* 요약 */}
      <div className="mb-6 grid gap-3 rounded-md bg-[var(--color-surface)] p-4 md:grid-cols-2">
        <div>
          <p className="text-xs text-[var(--color-text-muted)]">선택한 템플릿</p>
          <p className="mt-1 font-semibold text-[var(--color-text-primary)]">{tplName}</p>
        </div>
        <div>
          <p className="text-xs text-[var(--color-text-muted)]">대표 색상</p>
          <div className="mt-1 flex items-center gap-2">
            <div
              className="h-5 w-5 rounded-full border border-white shadow-sm"
              style={{ backgroundColor: selectedColor }}
            />
            <span className="font-mono text-sm font-semibold text-[var(--color-text-primary)]">
              {selectedColor}
            </span>
          </div>
        </div>
      </div>

      {/* URL 설정 */}
      <div className="mb-6">
        <label className="mb-2 block text-sm font-medium text-[var(--color-text-primary)]">
          사이트 주소 <span className="text-[var(--color-error)]">*</span>
        </label>
        <div className="flex items-center gap-2">
          <input
            className="flex-1 rounded-md border-none bg-[var(--color-border)] px-4 py-3 text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/50"
            value={subdomain}
            onChange={(e) =>
              onChange(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))
            }
            placeholder="my-tournament"
            autoFocus
          />
          <span className="whitespace-nowrap text-sm font-medium text-[var(--color-text-muted)]">
            .mybdr.kr
          </span>
        </div>
        {subdomain && (
          <p className="mt-2 text-sm text-[var(--color-text-muted)]">
            https://<span className="text-[var(--color-info)]">{subdomain}</span>.mybdr.kr
          </p>
        )}
      </div>

      {/* [2026-04-22] 하드코딩 색상 → --color-* 토큰화 */}
      {error && (
        <div
          className="mb-4 rounded-md px-4 py-3 text-sm"
          style={{
            backgroundColor: "color-mix(in srgb, var(--color-error) 10%, transparent)",
            color: "var(--color-error)",
          }}
        >
          {error}
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
        <button
          onClick={onBack}
          className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
          disabled={saving}
        >
          ← 이전
        </button>
        <div className="flex gap-3">
          {/* 2026-05-12 — pill 9999px ❌ → btn 클래스 (4px 라운딩 표준) */}
          <button
            onClick={onSaveDraft}
            disabled={saving || !subdomain.trim()}
            className="btn disabled:opacity-40"
          >
            {saving ? "저장 중..." : "임시 저장"}
          </button>
          <Button
            onClick={onPublish}
            disabled={saving || !subdomain.trim()}
            className="min-w-[120px]"
          >
            {saving ? "처리 중..." : "🚀 공개하기"}
          </Button>
        </div>
      </div>

      <p className="mt-4 text-center text-xs text-[var(--color-text-muted)]">
        공개 후에도 언제든지 설정을 변경하거나 비공개로 전환할 수 있습니다
      </p>
    </div>
  );
}


````

### File: src/app/(admin)/tournament-admin/tournaments/[id]/_panels/recorders-panel.tsx

````tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// 2026-06-13 HOTFIX: GET 응답은 apiSuccess→convertKeysToSnakeCase 거쳐 snake_case.
//   camelCase(recorderId/isActive/createdAt)로 읽으면 전 행 undefined → 빈 목록 버그.
type Recorder = {
  id: string;
  recorder_id: string;
  is_active: boolean;
  created_at: string;
  recorder: {
    id: string;
    nickname: string | null;
    email: string;
    profile_image_url: string | null;
  };
};

// Track B-d — 경기별 기록자 배정용 매치 타입.
//   GET /matches 응답(snake_case). settings.recorder_id 가 경기별 배정된 기록자 userId(string).
type MatchRow = {
  id: string;
  // 2026-06-21 정합: GET /matches 응답은 apiSuccess→convertKeysToSnakeCase 거쳐 snake_case.
  //   Prisma 필드 roundName/scheduledAt 은 응답에서 round_name/scheduled_at 로 변환됨.
  //   camelCase 로 읽으면 round_name 라벨이 항상 fallback("라운드 N")으로만 떨어짐 → snake 로 교정.
  round_name: string | null;
  round_number: number | null;
  match_number: number | null;
  scheduled_at: string | null;
  venue_name: string | null;
  homeTeam: { team: { name: string } } | null;
  awayTeam: { team: { name: string } } | null;
  settings: { recorder_id?: string | null; division_code?: string | null; [k: string]: unknown } | null;
};

// 매치 settings 에서 경기별 배정된 기록자 userId 추출 (없으면 null).
function getMatchRecorderId(m: MatchRow): string | null {
  const s = m.settings as Record<string, unknown> | null;
  if (!s) return null;
  const rid = s.recorder_id;
  return rid != null && rid !== "" ? String(rid) : null;
}

export default function TournamentRecordersPage() {
  const { id } = useParams<{ id: string }>();
  const [recorders, setRecorders] = useState<Recorder[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Track B-d — 경기별 기록자 배정 state
  const [matches, setMatches] = useState<MatchRow[]>([]);
  const [matchesLoading, setMatchesLoading] = useState(true);
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [autoAssigning, setAutoAssigning] = useState(false);
  const [matchError, setMatchError] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/web/tournaments/${id}/recorders`);
      if (res.ok) setRecorders(await res.json());
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  }, [id]);

  // Track B-d — 경기 목록 로드 (경기별 배정 현황 표시용)
  const loadMatches = useCallback(async () => {
    try {
      const res = await fetch(`/api/web/tournaments/${id}/matches`);
      if (res.ok) setMatches(await res.json());
    } catch { /* ignore */ } finally {
      setMatchesLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { loadMatches(); }, [loadMatches]);

  const addRecorder = async () => {
    if (!email.trim()) return;
    setAdding(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch(`/api/web/tournaments/${id}/recorders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "추가 실패");
      setEmail("");
      setSuccess(`${data.recorder?.nickname ?? email} 님을 기록원으로 추가했습니다.`);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "오류 발생");
    } finally {
      setAdding(false);
    }
  };

  const removeRecorder = async (recorderId: string, name: string) => {
    if (!confirm(`${name} 님의 기록원 권한을 제거하시겠습니까?`)) return;
    try {
      await fetch(`/api/web/tournaments/${id}/recorders`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recorderId }),
      });
      await load();
    } catch { /* ignore */ }
  };

  const activeRecorders = recorders.filter((r) => r.is_active);

  // Track B-d — 경기별 기록자 배정/해제 (settings.recorder_id PATCH).
  //   recorderUserId="" → 해제. 풀 인원만 select 에 노출되므로 클라단 검증 추가 불요(서버 풀 검증 존재).
  const assignRecorder = async (matchId: string, recorderUserId: string) => {
    setAssigningId(matchId);
    setMatchError("");
    try {
      const res = await fetch(
        `/api/web/tournaments/${id}/matches/${matchId}/recorder`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          // snake_case 키 — 서버가 body.recorder_id 로 수신
          body: JSON.stringify({ recorder_id: recorderUserId || null }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "배정 실패");
      // 낙관 갱신 — 해당 매치 settings.recorder_id 만 로컬 반영
      setMatches((prev) =>
        prev.map((m) =>
          m.id === matchId
            ? {
                ...m,
                settings: {
                  ...(m.settings ?? {}),
                  recorder_id: recorderUserId || null,
                },
              }
            : m
        )
      );
    } catch (e) {
      setMatchError(e instanceof Error ? e.message : "오류 발생");
      // 실패 시 서버 진실로 재동기화
      await loadMatches();
    } finally {
      setAssigningId(null);
    }
  };

  // Track B-d — 자동 배정 (풀 라운드로빈). 미배정 경기만 채움(overwrite=false).
  const autoAssign = async () => {
    if (activeRecorders.length === 0) {
      setMatchError("먼저 기록원 풀에 인원을 추가하세요.");
      return;
    }
    if (!confirm("미배정 경기에 기록원 풀을 순환 배정합니다. 진행할까요?")) return;
    setAutoAssigning(true);
    setMatchError("");
    try {
      const res = await fetch(
        `/api/web/tournaments/${id}/recorders/auto-assign`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ overwrite: false }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "자동 배정 실패");
      await loadMatches(); // 서버 결과로 전체 재동기화
    } catch (e) {
      setMatchError(e instanceof Error ? e.message : "오류 발생");
    } finally {
      setAutoAssigning(false);
    }
  };

  // 기록자 userId → 표시명 매핑 (활성 풀에서 조회)
  const recorderNameById = (userId: string | null): string => {
    if (!userId) return "미배정";
    const found = activeRecorders.find((r) => r.recorder_id === userId);
    return found ? (found.recorder.nickname ?? found.recorder.email) : "(풀 외 인원)";
  };

  // 미배정 경기 수 (자동배정 버튼 보조 안내)
  const unassignedCount = matches.filter((m) => !getMatchRecorderId(m)).length;

  return (
    // Track B-c — Toss 토큰 적용 루트 opt-in
    <div data-skin="toss" className="max-w-2xl mx-auto p-6 space-y-6">
      {/* 헤더 */}
      <div className="flex items-center gap-3">
        <Link
          href={`/tournament-admin/tournaments/${id}`}
          className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
        >
          ← 대회 관리
        </Link>
        <h1 className="text-xl font-bold">기록원 관리</h1>
      </div>

      {/* 기록원 추가 */}
      <Card className="p-4 space-y-3">
        <h2 className="font-semibold text-[var(--color-text-primary)]">기록원 추가</h2>
        <p className="text-sm text-[var(--color-text-muted)]">
          mybdr 가입 회원의 이메일로 기록원을 지정합니다. 기록원은 bdr_stat 앱으로 경기를 실시간 기록할 수 있습니다.
        </p>
        <div className="flex gap-2">
          <input
            type="email"
            placeholder="이메일 주소"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => {
              if (e.nativeEvent.isComposing) return;
              if (e.key === "Enter") addRecorder();
            }}
            className="flex-1 px-3 py-2 border border-[var(--color-border)] rounded-lg bg-[var(--color-surface)] text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/50"
          />
          <Button onClick={addRecorder} disabled={adding || !email.trim()}>
            {adding ? "추가 중..." : "추가"}
          </Button>
        </div>
        {error && <p className="text-sm text-[var(--color-error)]">{error}</p>}
        {success && <p className="text-sm text-[var(--color-success)]">{success}</p>}
      </Card>

      {/* 기록원 목록 */}
      <Card className="p-4 space-y-3">
        <h2 className="font-semibold text-[var(--color-text-primary)]">
          현재 기록원 {activeRecorders.length > 0 && `(${activeRecorders.length}명)`}
        </h2>

        {loading ? (
          <p className="text-sm text-[var(--color-text-muted)]">불러오는 중...</p>
        ) : activeRecorders.length === 0 ? (
          <p className="text-sm text-[var(--color-text-muted)]">등록된 기록원이 없습니다.</p>
        ) : (
          <ul className="space-y-2">
            {activeRecorders.map((r) => (
              <li
                key={r.id}
                className="flex items-center justify-between p-3 bg-[var(--color-elevated)] rounded-lg"
              >
                <div className="flex items-center gap-3">
                  {r.recorder.profile_image_url ? (
                    <Image
                      src={r.recorder.profile_image_url}
                      alt=""
                      width={32}
                      height={32}
                      className="w-8 h-8 rounded-full object-cover"
                      unoptimized /* 외부 프로필 이미지 URL — 도메인이 다양 */
                    />
                  ) : (
                    /* 2026-05-12 — admin 빨강 본문 금지 → info(Navy) 토큰 */
                    <div className="w-8 h-8 rounded-full bg-[var(--color-info)]/10 flex items-center justify-center text-[var(--color-info)] text-xs font-bold">
                      {(r.recorder.nickname ?? r.recorder.email)[0].toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium text-[var(--color-text-primary)]">
                      {r.recorder.nickname ?? r.recorder.email}
                    </p>
                    <p className="text-xs text-[var(--color-text-muted)]">{r.recorder.email}</p>
                  </div>
                </div>
                <button
                  onClick={() =>
                    removeRecorder(
                      r.recorder_id,
                      r.recorder.nickname ?? r.recorder.email
                    )
                  }
                  className="text-xs text-[var(--color-error)] hover:text-[var(--color-error)] px-2 py-1 rounded hover:bg-[var(--color-error)]/10"
                >
                  제거
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {/* Track B-d — 경기별 기록자 배정 (settings.recorder_id).
          위 "기록원 풀"에 등록된 인원을 개별 경기에 배정한다. */}
      <Card className="p-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-semibold text-[var(--color-text-primary)]">경기별 기록자 배정</h2>
          {/* 자동 배정 — 미배정 경기에 풀 라운드로빈 */}
          <Button
            variant="secondary"
            onClick={autoAssign}
            disabled={autoAssigning || activeRecorders.length === 0 || unassignedCount === 0}
            className="text-xs"
          >
            {autoAssigning ? "배정 중..." : "자동 배정"}
          </Button>
        </div>
        <p className="text-sm text-[var(--color-text-muted)]">
          위 풀에 등록된 기록원을 각 경기에 지정합니다.
          {unassignedCount > 0 && ` 미배정 ${unassignedCount}경기.`}
        </p>

        {matchError && <p className="text-sm text-[var(--color-error)]">{matchError}</p>}

        {matchesLoading ? (
          <p className="text-sm text-[var(--color-text-muted)]">불러오는 중...</p>
        ) : matches.length === 0 ? (
          <p className="text-sm text-[var(--color-text-muted)]">
            등록된 경기가 없습니다. 대진표를 먼저 생성하세요.
          </p>
        ) : activeRecorders.length === 0 ? (
          <p className="text-sm text-[var(--color-text-muted)]">
            먼저 기록원 풀에 인원을 추가하면 경기별 배정을 할 수 있습니다.
          </p>
        ) : (
          <ul className="space-y-2">
            {matches.map((m) => {
              const recorderId = getMatchRecorderId(m);
              // 라벨: 라운드/경기번호 + 대진(홈 vs 원정)
              const roundLabel =
                m.round_name ?? (m.round_number != null ? `라운드 ${m.round_number}` : "경기");
              const vsLabel = `${m.homeTeam?.team.name ?? "미정"} vs ${m.awayTeam?.team.name ?? "미정"}`;
              return (
                <li
                  key={m.id}
                  className="flex flex-col gap-2 p-3 bg-[var(--color-elevated)] rounded-lg sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">
                      {roundLabel}
                      {m.match_number != null && ` · #${m.match_number}`}
                    </p>
                    <p className="text-xs text-[var(--color-text-muted)] truncate">{vsLabel}</p>
                    {/* 현재 배정 상태 라벨 */}
                    <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                      배정:{" "}
                      <span className={recorderId ? "text-[var(--color-info)]" : ""}>
                        {recorderNameById(recorderId)}
                      </span>
                    </p>
                  </div>
                  {/* 기록자 select — 풀 활성 인원 + (미배정) */}
                  <select
                    value={recorderId ?? ""}
                    disabled={assigningId === m.id}
                    onChange={(e) => assignRecorder(m.id, e.target.value)}
                    className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/50 disabled:opacity-50 sm:w-48"
                  >
                    <option value="">(미배정)</option>
                    {activeRecorders.map((r) => (
                      <option key={r.recorder_id} value={r.recorder_id}>
                        {r.recorder.nickname ?? r.recorder.email}
                      </option>
                    ))}
                  </select>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}

````


"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { PanelLoadingState } from "./panel-loading-state";
import Link from "next/link";
import { Icon } from "@/components/admin-toss";
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
      className="tsite-mockup"
      style={{ backgroundColor: template.bg, height: 120 }}
    >
      {/* 네비 */}
      <div
        className="tsite-mockup__nav"
        style={{ backgroundColor: nav }}
      >
        <div className="tsite-mockup__dot" style={{ backgroundColor: navTextColor, opacity: 0.5 }} />
        <div className="tsite-mockup__bar tsite-mockup__bar--nav" style={{ backgroundColor: navTextColor, opacity: 0.8 }} />
        <div className="tsite-mockup__links">
          {[1, 2, 3].map((i) => (
            <div key={i} className="tsite-mockup__bar tsite-mockup__bar--link" style={{ backgroundColor: navTextColor, opacity: 0.5 }} />
          ))}
        </div>
      </div>
      {/* 히어로 */}
      <div className="tsite-mockup__hero" style={{ backgroundColor: accentColor, opacity: 0.15 }}>
        <div className="tsite-mockup__hero-inner">
          <div className="tsite-mockup__bar tsite-mockup__bar--hero" style={{ backgroundColor: accentColor, opacity: 0.7 }} />
        </div>
      </div>
      {/* 콘텐츠 행 */}
      <div className="tsite-mockup__body">
        {[0.8, 0.5, 0.3].map((op, i) => (
          <div
            key={i}
            className="tsite-mockup__bar tsite-mockup__bar--content"
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
        {/* 발행 중 상태 카드 */}
        <div className="tsite-published-card">
          <div className="tsite-published-card__inner">
            <div>
              <p className="tsite-state-label" data-tone="ok">● 사이트 공개 중</p>
              <p className="tsite-url">
                {site.subdomain}.mybdr.kr
              </p>
            </div>
            <div className="tsite-published-card__actions">
              {/* 2026-05-12 — pill 9999px ❌ → btn 클래스 (4px 라운딩 표준) */}
              <a
                href={`https://${site.subdomain}.mybdr.kr`}
                target="_blank"
                rel="noopener noreferrer"
                className="ts-btn ts-btn--secondary ts-btn--sm"
              >
                <Icon name="external-link" size={14} />
                방문하기
              </a>
              <button
                onClick={() => togglePublish(false)}
                disabled={publishing}
                className="ts-btn ts-btn--danger ts-btn--sm"
              >
                {publishing ? "처리 중..." : "비공개 전환"}
              </button>
            </div>
          </div>
        </div>

        {/* Toss error message */}
        {error && (
          <div className="tsite-message" data-tone="danger">
            {error}
          </div>
        )}

        {/* 수정 버튼들 */}
        <div className="tsite-action-grid">
          <button
            onClick={() => setStep(1)}
            className="tsite-action-card"
          >
            <span className="tsite-action-card__icon"><Icon name="layout-template" size={18} /></span>
            <p className="tsite-action-card__title">템플릿 변경</p>
            <p className="tsite-action-card__meta">
              {TEMPLATES.find((t) => t.slug === selectedTemplate)?.name ?? "Classic"}
            </p>
          </button>
          <button
            onClick={() => setStep(2)}
            className="tsite-action-card"
          >
            <div
              className="tsite-color-dot tsite-color-dot--large"
              style={{ backgroundColor: selectedColor }}
            />
            <p className="tsite-action-card__title">색상 변경</p>
            <p className="tsite-action-card__meta tsite-mono">{selectedColor}</p>
          </button>
          <Link
            href={`/tournament-admin/tournaments/${id}#publish`}
            className="tsite-action-card"
          >
            <span className="tsite-action-card__icon"><Icon name="file-text" size={18} /></span>
            <p className="tsite-action-card__title">공지 페이지</p>
            <p className="tsite-action-card__meta">공지사항 작성</p>
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
      <p className="tsite-wizard-copy">
        3단계로 대회 전용 웹사이트를 만들어보세요
      </p>

      {/* 진행 표시 */}
      <div className="tsite-steps">
        {[1, 2, 3].map((s) => (
          <div key={s} className="tsite-step">
            <div
              // 2026-05-12 — admin 빨강 본문 금지 (step indicator) → info(Navy)
              className="tsite-step__dot"
              data-state={step === s ? "active" : step > s ? "done" : "todo"}
            >
              {step > s ? <Icon name="check" size={15} /> : s}
            </div>
            <span
              className="tsite-step__label"
              data-current={step === s ? "true" : "false"}
            >
              {["템플릿", "색상", "발행"][s - 1]}
            </span>
            {s < 3 && <div className="tsite-step__line" />}
          </div>
        ))}
      </div>

      {/* Toss error message */}
      {error && (
        <div className="tsite-message" data-tone="danger">
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
    <div className="tsite-step-panel">
      <h2 className="tsite-step-title">템플릿 선택</h2>
      <p className="tsite-step-desc">
        대회 사이트의 전체 스타일을 선택하세요. 언제든지 변경할 수 있습니다.
      </p>

      <div className="tsite-template-grid">
        {TEMPLATES.map((tpl) => (
          <button
            key={tpl.slug}
            onClick={() => onChange(tpl.slug)}
            className="tsite-template-card"
            data-active={selected === tpl.slug ? "true" : "false"}
          >
            <TemplateMockup template={tpl} accentColor={accentColor} />
            <div className="tsite-template-card__body">
              <div className="tsite-template-card__head">
                <p className="tsite-template-card__name">{tpl.name}</p>
                {selected === tpl.slug && (
                  /* 2026-05-12 — 선택됨 ✓ = 긍정 결과 → success(Green) (룰 11 — 승자/긍정 = success) */
                  <span className="tsite-selected-badge"><Icon name="check" size={12} />선택됨</span>
                )}
              </div>
              <p className="tsite-template-card__desc">{tpl.desc}</p>
            </div>
          </button>
        ))}
      </div>

      <div className="tsite-step-actions">
        {onCancel && (
          <button onClick={onCancel} className="tsite-text-button">
            취소
          </button>
        )}
        <button type="button" onClick={onNext} className="ts-btn ts-btn--primary tsite-next-button">
          다음: 색상 선택 →
        </button>
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
    <div className="tsite-step-panel">
      <h2 className="tsite-step-title">대표 색상 선택</h2>
      <p className="tsite-step-desc">
        사이트 네비게이션과 강조 색상으로 사용됩니다.
      </p>

      {/* 색상 팔레트 */}
      <div className="tsite-color-grid">
        {COLOR_PRESETS.map((c) => (
          <button
            key={c.hex}
            onClick={() => onChange(c.hex)}
            title={c.name}
            className="tsite-color-option"
            data-selected={selected === c.hex ? "true" : "false"}
          >
            <div
              className="tsite-color-swatch"
              style={{ backgroundColor: c.hex }}
            />
            <span className="tsite-color-label">{c.name}</span>
            {selected === c.hex && (
              <div className="tsite-color-check">
                <Icon name="check" size={18} />
              </div>
            )}
          </button>
        ))}
      </div>

      {/* 미리보기 */}
      <div className="tsite-preview-box">
        <p className="tsite-preview-label">미리보기</p>
        <div className="tsite-color-preview">
          <div
            className="tsite-color-preview__nav"
            style={{ backgroundColor: selected }}
          >
            <div className="tsite-color-preview__mark" />
            <div className="tsite-color-preview__bar" />
            <div className="tsite-color-preview__links">
              {["홈", "팀", "일정", "결과"].map((l) => (
                <span key={l}>{l}</span>
              ))}
            </div>
          </div>
          <div
            className="tsite-color-preview__body"
            style={{ height: 24, backgroundColor: `${selected}15` }}
          >
            <div className="tsite-color-preview__body-bar" style={{ backgroundColor: selected, opacity: 0.5 }} />
          </div>
        </div>
      </div>

      <div className="tsite-step-actions">
        <button onClick={onBack} className="tsite-text-button">
          ← 이전
        </button>
        <button type="button" onClick={onNext} disabled={saving} className="ts-btn ts-btn--primary">
          {saving ? "저장 중..." : "다음: 주소 설정 →"}
        </button>
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
    <div className="tsite-step-panel">
      <h2 className="tsite-step-title">주소 설정 및 발행</h2>
      <p className="tsite-step-desc">
        대회 사이트 URL을 설정하고 바로 공개하거나 임시 저장할 수 있습니다.
      </p>

      {/* 요약 */}
      <div className="tsite-summary-grid">
        <div>
          <p className="tsite-summary-label">선택한 템플릿</p>
          <p className="tsite-summary-value">{tplName}</p>
        </div>
        <div>
          <p className="tsite-summary-label">대표 색상</p>
          <div className="tsite-summary-color">
            <div
              className="tsite-color-dot"
              style={{ backgroundColor: selectedColor }}
            />
            <span className="tsite-summary-value tsite-mono">
              {selectedColor}
            </span>
          </div>
        </div>
      </div>

      {/* URL 설정 */}
      <div className="tsite-field">
        <label className="ts-field__label">
          사이트 주소 <span className="tsite-required">*</span>
        </label>
        <div className="tsite-url-field">
          <input
            className="ts-input tsite-url-input"
            value={subdomain}
            onChange={(e) =>
              onChange(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))
            }
            placeholder="my-tournament"
            autoFocus
          />
          <span className="tsite-url-suffix">
            .mybdr.kr
          </span>
        </div>
        {subdomain && (
          <p className="tsite-url-preview">
            https://<span>{subdomain}</span>.mybdr.kr
          </p>
        )}
      </div>

      {/* Toss error message */}
      {error && (
        <div className="tsite-message" data-tone="danger">
          {error}
        </div>
      )}

      <div className="tsite-step-actions">
        <button
          onClick={onBack}
          className="tsite-text-button"
          disabled={saving}
        >
          ← 이전
        </button>
        <div className="tsite-action-row">
          {/* 2026-05-12 — pill 9999px ❌ → btn 클래스 (4px 라운딩 표준) */}
          <button
            onClick={onSaveDraft}
            disabled={saving || !subdomain.trim()}
            className="ts-btn ts-btn--secondary"
          >
            {saving ? "저장 중..." : "임시 저장"}
          </button>
          <button
            type="button"
            onClick={onPublish}
            disabled={saving || !subdomain.trim()}
            className="ts-btn ts-btn--primary tsite-publish-button"
          >
            {saving ? "처리 중..." : "🚀 공개하기"}
          </button>
        </div>
      </div>

      <p className="tsite-footnote">
        공개 후에도 언제든지 설정을 변경하거나 비공개로 전환할 수 있습니다
      </p>
    </div>
  );
}


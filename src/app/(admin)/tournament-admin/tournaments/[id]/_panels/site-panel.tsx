"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { Btn, Icon, SkelTable } from "@/components/admin-toss";

type Site = {
  id: string;
  subdomain: string;
  is_published: boolean | null;
  primary_color: string | null;
  secondary_color: string | null;
  site_name: string | null;
  site_template?: { slug?: string | null; name?: string | null } | null;
  siteTemplate?: { slug?: string | null; name?: string | null } | null;
};

type SiteTemplate = {
  slug: string;
  name: string;
  desc: string;
  navBg: string;
  bg: string;
  cardBg: string;
};

type ColorPreset = {
  hex: string;
  name: string;
};

const DEFAULT_TEMPLATE = "classic-tournament";
const DEFAULT_COLOR = "#1B3C87";

const TEMPLATES: SiteTemplate[] = [
  {
    slug: "classic-tournament",
    name: "Classic",
    desc: "깔끔한 화이트 배경의 표준 대회 사이트",
    navBg: "#1B3C87",
    bg: "#F5F7FA",
    cardBg: "#FFFFFF",
  },
  {
    slug: "the-process",
    name: "Dark",
    desc: "강한 대비의 다크형 대회 사이트",
    navBg: "#1F2937",
    bg: "#0F172A",
    cardBg: "#1E293B",
  },
  {
    slug: "minimal-white",
    name: "Minimal",
    desc: "텍스트와 경기 정보 중심의 미니멀 사이트",
    navBg: "#FFFFFF",
    bg: "#FFFFFF",
    cardBg: "#F5F7FA",
  },
];

const COLOR_PRESETS: ColorPreset[] = [
  { hex: "#1B3C87", name: "네이비" },
  { hex: "#EF4444", name: "레드" },
  { hex: "#E31B23", name: "BDR Red" },
  { hex: "#22C55E", name: "그린" },
  { hex: "#8B5CF6", name: "퍼플" },
  { hex: "#FBBF24", name: "골드" },
  { hex: "#0EA5E9", name: "스카이" },
  { hex: "#1F2937", name: "다크" },
];

function normalizeSubdomain(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9-]/g, "");
}

function templateName(slug: string) {
  return TEMPLATES.find((template) => template.slug === slug)?.name ?? "Classic";
}

function publicUrl(subdomain: string) {
  return `https://${subdomain}.mybdr.kr`;
}

function siteTemplateSlug(site: Site | null) {
  return site?.site_template?.slug ?? site?.siteTemplate?.slug ?? DEFAULT_TEMPLATE;
}

async function readJsonError(res: Response, fallback: string) {
  try {
    const body = await res.json();
    if (typeof body?.error === "string") return body.error;
    if (typeof body?.message === "string") return body.message;
  } catch {
    // Keep the readable fallback when the API returns an empty body.
  }
  return fallback;
}

export default function TournamentSitePage() {
  const { id } = useParams<{ id: string }>();
  const [site, setSite] = useState<Site | null>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(1);
  const [editingPublished, setEditingPublished] = useState(false);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [selectedTemplate, setSelectedTemplate] = useState(DEFAULT_TEMPLATE);
  const [selectedColor, setSelectedColor] = useState(DEFAULT_COLOR);
  const [subdomain, setSubdomain] = useState("");

  const isPublished = Boolean(site?.is_published);
  const activeTemplate = useMemo(
    () => TEMPLATES.find((template) => template.slug === selectedTemplate) ?? TEMPLATES[0],
    [selectedTemplate],
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/web/tournaments/${id}/site`, { cache: "no-store" });
      if (!res.ok) throw new Error(await readJsonError(res, "사이트 설정을 불러오지 못했습니다."));
      const data = (await res.json()) as Site | null;
      setSite(data);
      if (data?.id) {
        setSelectedTemplate(siteTemplateSlug(data));
        setSelectedColor(data.primary_color ?? DEFAULT_COLOR);
        setSubdomain(data.subdomain ?? "");
        setStep(1);
        setEditingPublished(false);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "사이트 설정을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const save = useCallback(async () => {
    const sub = normalizeSubdomain(subdomain.trim());
    if (!sub) {
      setError("사이트 주소를 입력하세요.");
      setStep(3);
      return null;
    }

    setSaving(true);
    setError("");
    setNotice("");
    try {
      const res = await fetch(`/api/web/tournaments/${id}/site`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subdomain: sub,
          siteTemplateSlug: selectedTemplate,
          primaryColor: selectedColor,
          secondaryColor: selectedColor,
        }),
      });
      if (!res.ok) throw new Error(await readJsonError(res, "사이트 설정 저장에 실패했습니다."));
      const data = (await res.json()) as Site;
      setSite(data);
      setSubdomain(data.subdomain ?? sub);
      setNotice("변경사항이 저장되었습니다.");
      return data;
    } catch (e) {
      setError(e instanceof Error ? e.message : "사이트 설정 저장에 실패했습니다.");
      return null;
    } finally {
      setSaving(false);
    }
  }, [id, selectedColor, selectedTemplate, subdomain]);

  const publish = useCallback(
    async (nextPublished: boolean) => {
      setPublishing(true);
      setError("");
      setNotice("");
      try {
        const res = await fetch(`/api/web/tournaments/${id}/site/publish`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ publish: nextPublished }),
        });
        if (!res.ok) {
          throw new Error(
            await readJsonError(
              res,
              nextPublished ? "필수 설정이 완료되지 않아 공개할 수 없습니다." : "비공개 전환에 실패했습니다.",
            ),
          );
        }
        const data = (await res.json()) as Site;
        setSite(data);
        setNotice(nextPublished ? "공개 사이트가 발행되었습니다." : "사이트가 비공개로 전환되었습니다.");
        if (nextPublished) setEditingPublished(false);
      } catch (e) {
        setError(e instanceof Error ? e.message : "사이트 공개 상태 변경에 실패했습니다.");
      } finally {
        setPublishing(false);
      }
    },
    [id],
  );

  const saveDraft = useCallback(async () => {
    const saved = await save();
    if (saved?.is_published) setEditingPublished(false);
  }, [save]);

  const saveAndPublish = useCallback(async () => {
    const saved = await save();
    if (!saved) return;
    await publish(true);
  }, [publish, save]);

  if (loading) {
    return (
      <div className="tsite-panel op-panel-flow">
        <SkelTable rows={4} />
      </div>
    );
  }

  return (
    <div className="tsite-panel op-panel-flow">
      {isPublished && !editingPublished ? (
        <PublishedState
          subdomain={site?.subdomain ?? subdomain}
          template={selectedTemplate}
          color={selectedColor}
          publishing={publishing}
          onVisit={() => window.open(publicUrl(site?.subdomain ?? subdomain), "_blank", "noopener,noreferrer")}
          onUnpublish={() => void publish(false)}
          onEditTemplate={() => {
            setStep(1);
            setEditingPublished(true);
          }}
          onEditColor={() => {
            setStep(2);
            setEditingPublished(true);
          }}
          onEditAddress={() => {
            setStep(3);
            setEditingPublished(true);
          }}
        />
      ) : (
        <Wizard
          step={step}
          setStep={setStep}
          selectedTemplate={selectedTemplate}
          selectedColor={selectedColor}
          subdomain={subdomain}
          activeTemplate={activeTemplate}
          saving={saving || publishing}
          editingPublished={editingPublished}
          onTemplateChange={setSelectedTemplate}
          onColorChange={setSelectedColor}
          onSubdomainChange={(value) => setSubdomain(normalizeSubdomain(value))}
          onCancelPublishedEdit={() => {
            setSelectedTemplate(siteTemplateSlug(site));
            setSelectedColor(site?.primary_color ?? DEFAULT_COLOR);
            setSubdomain(site?.subdomain ?? "");
            setEditingPublished(false);
            setError("");
          }}
          onSaveDraft={saveDraft}
          onPublish={saveAndPublish}
        />
      )}

      {notice && <div className="tsite-message" style={{ color: "var(--ok)" }}>{notice}</div>}
      {error && <div className="tsite-message" data-tone="danger">{error}</div>}

      <section className="ts-card ts-card--flat" style={{ marginTop: 18 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
          <span className="ct-headicon"><Icon name="eye" size={18} /></span>
          <div>
            <h3 style={{ fontSize: 16 }}>공개 섹션</h3>
            <p style={{ marginTop: 3, color: "var(--ink-mute)", fontSize: 13, fontWeight: 700 }}>
              공개 사이트는 대회 정보, 참가팀, 대진표, 일정, 결과 섹션을 사용합니다.
            </p>
          </div>
        </div>
        <div className="tsite-action-grid">
          {["대회 정보", "참가팀", "대진표", "일정", "결과"].map((label) => (
            <div key={label} className="tsite-action-card" aria-disabled="true" style={{ cursor: "default" }}>
              <span className="tsite-action-card__icon"><Icon name="check-circle" size={18} /></span>
              <p className="tsite-action-card__title">{label}</p>
              <p className="tsite-action-card__meta">기본 공개</p>
            </div>
          ))}
        </div>
        <p className="tsite-footnote">
          섹션별 발행 토글은 DATA-CONTRACT의 신규 필드(publishedSections) 연결 후 활성화합니다.
        </p>
      </section>
    </div>
  );
}

function PublishedState({
  subdomain,
  template,
  color,
  publishing,
  onVisit,
  onUnpublish,
  onEditTemplate,
  onEditColor,
  onEditAddress,
}: {
  subdomain: string;
  template: string;
  color: string;
  publishing: boolean;
  onVisit: () => void;
  onUnpublish: () => void;
  onEditTemplate: () => void;
  onEditColor: () => void;
  onEditAddress: () => void;
}) {
  return (
    <>
      <div className="tsite-published-card">
        <div className="tsite-published-card__inner">
          <div>
            <p className="tsite-state-label" data-tone="ok">공개 사이트 운영 중</p>
            <p className="tsite-url">{subdomain ? `${subdomain}.mybdr.kr` : "주소 미설정"}</p>
          </div>
          <div className="tsite-published-card__actions">
            <Btn variant="secondary" size="sm" iconRight="arrow-up-right" disabled={!subdomain} onClick={onVisit}>
              방문하기
            </Btn>
            <Btn variant="danger" size="sm" disabled={publishing} onClick={onUnpublish}>
              {publishing ? "처리 중..." : "비공개 전환"}
            </Btn>
          </div>
        </div>
      </div>

      <div className="tsite-action-grid">
        <button type="button" className="tsite-action-card" onClick={onEditTemplate}>
          <span className="tsite-action-card__icon"><Icon name="layout-template" size={18} /></span>
          <p className="tsite-action-card__title">템플릿 변경</p>
          <p className="tsite-action-card__meta">{templateName(template)}</p>
        </button>
        <button type="button" className="tsite-action-card" onClick={onEditColor}>
          <span className="tsite-color-dot tsite-color-dot--large" style={{ backgroundColor: color }} />
          <p className="tsite-action-card__title">색상 변경</p>
          <p className="tsite-action-card__meta tsite-mono">{color}</p>
        </button>
        <button type="button" className="tsite-action-card" onClick={onEditAddress}>
          <span className="tsite-action-card__icon"><Icon name="link" size={18} /></span>
          <p className="tsite-action-card__title">주소 · 발행 설정</p>
          <p className="tsite-action-card__meta">서브도메인 수정</p>
        </button>
      </div>
    </>
  );
}

function Wizard({
  step,
  setStep,
  selectedTemplate,
  selectedColor,
  subdomain,
  activeTemplate,
  saving,
  editingPublished,
  onTemplateChange,
  onColorChange,
  onSubdomainChange,
  onCancelPublishedEdit,
  onSaveDraft,
  onPublish,
}: {
  step: number;
  setStep: (step: number) => void;
  selectedTemplate: string;
  selectedColor: string;
  subdomain: string;
  activeTemplate: SiteTemplate;
  saving: boolean;
  editingPublished: boolean;
  onTemplateChange: (slug: string) => void;
  onColorChange: (hex: string) => void;
  onSubdomainChange: (value: string) => void;
  onCancelPublishedEdit: () => void;
  onSaveDraft: () => void;
  onPublish: () => void;
}) {
  return (
    <>
      <p className="tsite-wizard-copy">
        템플릿, 색상, 주소를 순서대로 정하면 공개 토너먼트 사이트가 생성됩니다.
      </p>
      <div className="tsite-steps">
        {["템플릿", "색상", "발행"].map((label, index) => {
          const current = index + 1;
          return (
            <div key={label} className="tsite-step">
              <div className="tsite-step__dot" data-state={step === current ? "active" : step > current ? "done" : "todo"}>
                {step > current ? <Icon name="check" size={15} /> : current}
              </div>
              <span className="tsite-step__label" data-current={step === current ? "true" : "false"}>
                {label}
              </span>
              {current < 3 && <div className="tsite-step__line" />}
            </div>
          );
        })}
      </div>

      {step === 1 && (
        <StepTemplate
          selectedTemplate={selectedTemplate}
          selectedColor={selectedColor}
          onChange={onTemplateChange}
          onNext={() => setStep(2)}
          onCancel={editingPublished ? onCancelPublishedEdit : undefined}
        />
      )}
      {step === 2 && (
        <StepColor
          selectedColor={selectedColor}
          onChange={onColorChange}
          onBack={() => setStep(1)}
          onNext={() => setStep(3)}
          saving={saving}
        />
      )}
      {step === 3 && (
        <StepPublish
          subdomain={subdomain}
          selectedColor={selectedColor}
          activeTemplate={activeTemplate}
          saving={saving}
          onChange={onSubdomainChange}
          onBack={() => setStep(2)}
          onSaveDraft={onSaveDraft}
          onPublish={onPublish}
        />
      )}
    </>
  );
}

function StepTemplate({
  selectedTemplate,
  selectedColor,
  onChange,
  onNext,
  onCancel,
}: {
  selectedTemplate: string;
  selectedColor: string;
  onChange: (slug: string) => void;
  onNext: () => void;
  onCancel?: () => void;
}) {
  return (
    <div className="tsite-step-panel">
      <h2 className="tsite-step-title">템플릿 선택</h2>
      <p className="tsite-step-desc">
        공개 사이트의 전체 구조와 분위기를 선택합니다. 발행 후에도 언제든 변경할 수 있습니다.
      </p>

      <div className="tsite-template-grid">
        {TEMPLATES.map((template) => (
          <button
            key={template.slug}
            type="button"
            onClick={() => onChange(template.slug)}
            className="tsite-template-card"
            data-active={selectedTemplate === template.slug ? "true" : "false"}
          >
            <TemplateMockup template={template} accentColor={selectedColor} />
            <div className="tsite-template-card__body">
              <div className="tsite-template-card__head">
                <p className="tsite-template-card__name">{template.name}</p>
                {selectedTemplate === template.slug && (
                  <span className="tsite-selected-badge"><Icon name="check" size={12} />선택됨</span>
                )}
              </div>
              <p className="tsite-template-card__desc">{template.desc}</p>
            </div>
          </button>
        ))}
      </div>

      <div className="tsite-step-actions">
        {onCancel ? (
          <button type="button" onClick={onCancel} className="tsite-text-button">취소</button>
        ) : (
          <span />
        )}
        <Btn onClick={onNext} iconRight="arrow-right">
          다음: 색상 선택
        </Btn>
      </div>
    </div>
  );
}

function StepColor({
  selectedColor,
  onChange,
  onBack,
  onNext,
  saving,
}: {
  selectedColor: string;
  onChange: (hex: string) => void;
  onBack: () => void;
  onNext: () => void;
  saving: boolean;
}) {
  return (
    <div className="tsite-step-panel">
      <h2 className="tsite-step-title">대표 색상 선택</h2>
      <p className="tsite-step-desc">
        공개 사이트의 네비게이션과 주요 강조 영역에 적용할 색상입니다.
      </p>

      <div className="tsite-color-grid">
        {COLOR_PRESETS.map((preset) => (
          <button
            key={preset.hex}
            type="button"
            title={preset.name}
            onClick={() => onChange(preset.hex)}
            className="tsite-color-option"
            data-selected={selectedColor === preset.hex ? "true" : "false"}
          >
            <span className="tsite-color-swatch" style={{ backgroundColor: preset.hex }} />
            <span className="tsite-color-label">{preset.name}</span>
            {selectedColor === preset.hex && (
              <span className="tsite-color-check"><Icon name="check" size={18} /></span>
            )}
          </button>
        ))}
      </div>

      <div className="tsite-preview-box">
        <p className="tsite-preview-label">미리보기</p>
        <div className="tsite-color-preview">
          <div className="tsite-color-preview__nav" style={{ backgroundColor: selectedColor }}>
            <div className="tsite-color-preview__mark" />
            <div className="tsite-color-preview__bar" />
            <div className="tsite-color-preview__links">
              {["홈", "팀", "일정", "결과"].map((label) => <span key={label}>{label}</span>)}
            </div>
          </div>
          <div className="tsite-color-preview__body" style={{ backgroundColor: `${selectedColor}15` }}>
            <div className="tsite-color-preview__body-bar" style={{ backgroundColor: selectedColor, opacity: 0.5 }} />
          </div>
        </div>
      </div>

      <div className="tsite-step-actions">
        <button type="button" onClick={onBack} className="tsite-text-button" disabled={saving}>이전</button>
        <Btn onClick={onNext} disabled={saving} iconRight="arrow-right">
          다음: 주소 설정
        </Btn>
      </div>
    </div>
  );
}

function StepPublish({
  subdomain,
  selectedColor,
  activeTemplate,
  saving,
  onChange,
  onBack,
  onSaveDraft,
  onPublish,
}: {
  subdomain: string;
  selectedColor: string;
  activeTemplate: SiteTemplate;
  saving: boolean;
  onChange: (value: string) => void;
  onBack: () => void;
  onSaveDraft: () => void;
  onPublish: () => void;
}) {
  const hasSubdomain = subdomain.trim().length > 0;

  return (
    <div className="tsite-step-panel">
      <h2 className="tsite-step-title">주소 설정 및 발행</h2>
      <p className="tsite-step-desc">
        공개 사이트 URL을 정하고 즉시 발행하거나 임시 저장할 수 있습니다.
      </p>

      <div className="tsite-summary-grid">
        <div>
          <p className="tsite-summary-label">선택한 템플릿</p>
          <p className="tsite-summary-value">{activeTemplate.name}</p>
        </div>
        <div>
          <p className="tsite-summary-label">대표 색상</p>
          <div className="tsite-summary-color">
            <span className="tsite-color-dot" style={{ backgroundColor: selectedColor }} />
            <span className="tsite-summary-value tsite-mono">{selectedColor}</span>
          </div>
        </div>
      </div>

      <div className="tsite-field">
        <label className="ts-field__label">
          사이트 주소 <span className="tsite-required">*</span>
        </label>
        <div className="tsite-url-field">
          <input
            className="ts-input tsite-url-input"
            value={subdomain}
            onChange={(event) => onChange(event.target.value)}
            placeholder="my-tournament"
            autoFocus
          />
          <span className="tsite-url-suffix">.mybdr.kr</span>
        </div>
        {hasSubdomain && (
          <p className="tsite-url-preview">
            https://<span>{subdomain}</span>.mybdr.kr
          </p>
        )}
      </div>

      <div className="tsite-step-actions">
        <button type="button" onClick={onBack} className="tsite-text-button" disabled={saving}>이전</button>
        <div className="tsite-action-row">
          <Btn variant="secondary" disabled={saving || !hasSubdomain} onClick={onSaveDraft}>
            {saving ? "저장 중..." : "임시 저장"}
          </Btn>
          <Btn disabled={saving || !hasSubdomain} onClick={onPublish}>
            {saving ? "처리 중..." : "공개하기"}
          </Btn>
        </div>
      </div>
      <p className="tsite-footnote">
        이미 사용 중인 주소는 저장할 수 없습니다. 공개 후에도 템플릿, 색상, 주소를 다시 수정할 수 있습니다.
      </p>
    </div>
  );
}

function TemplateMockup({ template, accentColor }: { template: SiteTemplate; accentColor: string }) {
  const nav = template.slug === "minimal-white" ? "#FFFFFF" : accentColor;
  const navTextColor = template.slug === "minimal-white" ? accentColor : "#FFFFFF";

  return (
    <div className="tsite-mockup" style={{ backgroundColor: template.bg, height: 120 }}>
      <div className="tsite-mockup__nav" style={{ backgroundColor: nav }}>
        <div className="tsite-mockup__dot" style={{ backgroundColor: navTextColor, opacity: 0.55 }} />
        <div className="tsite-mockup__bar tsite-mockup__bar--nav" style={{ backgroundColor: navTextColor, opacity: 0.8 }} />
        <div className="tsite-mockup__links">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="tsite-mockup__bar tsite-mockup__bar--link"
              style={{ backgroundColor: navTextColor, opacity: 0.5 }}
            />
          ))}
        </div>
      </div>
      <div className="tsite-mockup__hero" style={{ backgroundColor: accentColor, opacity: 0.15 }}>
        <div className="tsite-mockup__hero-inner">
          <div className="tsite-mockup__bar tsite-mockup__bar--hero" style={{ backgroundColor: accentColor, opacity: 0.7 }} />
        </div>
      </div>
      <div className="tsite-mockup__body">
        {[80, 60, 45].map((width) => (
          <div
            key={width}
            className="tsite-mockup__bar tsite-mockup__bar--content"
            style={{ backgroundColor: template.cardBg, width: `${width}%` }}
          />
        ))}
      </div>
    </div>
  );
}

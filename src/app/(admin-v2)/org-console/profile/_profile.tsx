"use client";

// ============================================================
// org-console/profile/_profile.tsx — 단체 정보 (정본 org-pages OrgProfile 1:1)
//   조회 ↔ 편집 실동작(기존 DB) — 저장 = PATCH /api/web/organizations/[id] (adminFetch).
//   브랜딩(로고·배너 업로드)·인증·서류 현황 = 컨셉(준비중) — DB 컬럼/인프라 부재(§2-2).
//   단체 유형(type) = organizations 스키마에 컬럼 없음 → 표시/저장 대상에서 제외(컨셉만).
// ============================================================

import React from "react";
import { useRouter } from "next/navigation";
import {
  PageHead,
  Btn,
  Badge,
  Icon,
  Modal,
  useAdminShell,
} from "@/components/admin-v2";
import { adminFetch } from "@/lib/admin-v2/data/client";
import { orgColor } from "../_org-color";

export type OrgProfileData = {
  id: string;
  name: string;
  description: string | null;
  region: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  logoUrl: string | null;
  bannerUrl: string | null;
  status: string;
  isPublic: boolean;
};

const REGION_OPTIONS = ["서울", "경기·인천", "강원", "충청", "전라", "경상", "제주", "전국"];

function Concept({ tone, children = "준비중" }: { tone?: "warn"; children?: React.ReactNode }) {
  return (
    <span className="oc-concept" data-tone={tone}>
      <Icon name="sparkles" size={11} />
      {children}
    </span>
  );
}

function Branding({ org, onEdit }: { org: OrgProfileData; onEdit: () => void }) {
  const OC = orgColor(org.id);
  return (
    <div className="oc-brand">
      <div
        className="oc-brand__banner"
        style={{
          background: org.bannerUrl ? `url(${org.bannerUrl}) center/cover` : `linear-gradient(120deg, ${OC.deep}, ${OC.base})`,
        }}
      >
        {!org.bannerUrl && (
          <span className="oc-brand__bannerhint">
            <Icon name="image" size={15} />
            배너 이미지를 등록해보세요
          </span>
        )}
        <button className="oc-brand__edit" onClick={onEdit}>
          <Icon name="pencil" size={14} />
          브랜딩 편집
        </button>
      </div>
      <div className="oc-brand__row">
        <span className="oc-brand__logo" style={{ background: OC.base }}>
          {org.logoUrl ? <img src={org.logoUrl} alt="" /> : org.name.slice(0, 1)}
        </span>
        <div className="oc-brand__meta">
          <div className="oc-brand__name">
            {org.name}
            <Badge tone="grey">단체 유형 준비중</Badge>
          </div>
          <div className="oc-brand__sub">브랜드 색상은 단체 ID로 자동 생성돼요 · 직접 지정하지 않아요</div>
        </div>
      </div>
    </div>
  );
}

function BrandingModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="브랜딩 편집"
      sub="로고와 배너 이미지 등록 기능은 준비 중이에요"
      maxWidth={520}
      foot={
        <Btn variant="secondary" onClick={onClose}>
          닫기
        </Btn>
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div>
          <div className="ts-field__label" style={{ marginBottom: 8, display: "flex", alignItems: "center", gap: 8 }}>
            단체 로고 <Concept tone="warn">준비중</Concept>
          </div>
          <div className="oc-drop">
            <span className="oc-drop__icon">
              <Icon name="upload" size={20} />
            </span>
            <div className="oc-drop__t">로고 이미지를 끌어다 놓기</div>
            <div className="oc-drop__d">정사각형 · PNG/JPG · 최대 2MB</div>
          </div>
        </div>
        <div>
          <div className="ts-field__label" style={{ marginBottom: 8, display: "flex", alignItems: "center", gap: 8 }}>
            단체 배너 <Concept tone="warn">준비중</Concept>
          </div>
          <div className="oc-drop">
            <span className="oc-drop__icon">
              <Icon name="image-plus" size={20} />
            </span>
            <div className="oc-drop__t">배너 이미지를 끌어다 놓기</div>
            <div className="oc-drop__d">가로형 3:1 권장 · PNG/JPG · 최대 4MB</div>
          </div>
        </div>
        <div style={{ fontSize: 12.5, color: "var(--ink-mute)", display: "flex", gap: 8, alignItems: "flex-start" }}>
          <Icon name="info" size={15} style={{ flex: "0 0 auto", marginTop: 1 }} />
          브랜드 색상은 단체 고유 ID로 자동 생성돼요. 별도 색상 지정은 제공하지 않아요.
        </div>
      </div>
    </Modal>
  );
}

function InfoView({ org, canEdit, onEdit }: { org: OrgProfileData; canEdit: boolean; onEdit: () => void }) {
  const rows: { k: string; v: React.ReactNode; empty?: boolean }[] = [
    { k: "단체명", v: org.name },
    { k: "단체 유형", v: <Concept>준비중</Concept> },
    { k: "활동 지역", v: org.region || "미입력", empty: !org.region },
    { k: "한줄 소개", v: org.description || "미입력", empty: !org.description },
    { k: "대표 이메일", v: org.contactEmail || "미입력", empty: !org.contactEmail },
    { k: "대표 연락처", v: org.contactPhone || "미입력", empty: !org.contactPhone },
  ];
  return (
    <div className="ad-panel">
      <div className="ad-panel__head">
        <div className="ad-panel__title">기본 정보</div>
        {canEdit && (
          <Btn variant="secondary" size="sm" icon="pencil" onClick={onEdit}>
            편집
          </Btn>
        )}
      </div>
      <div className="oc-info">
        {rows.map((r) => (
          <div key={r.k} className="oc-inforow">
            <span className="oc-inforow__k">{r.k}</span>
            <span className="oc-inforow__v" data-empty={r.empty ? "true" : "false"}>
              {r.v}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function InfoEdit({
  org,
  onCancel,
  onSaved,
}: {
  org: OrgProfileData;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const { toast } = useAdminShell();
  const router = useRouter();
  const [name, setName] = React.useState(org.name);
  const [region, setRegion] = React.useState(org.region || REGION_OPTIONS[0]);
  const [description, setDescription] = React.useState(org.description || "");
  const [contactEmail, setContactEmail] = React.useState(org.contactEmail || "");
  const [contactPhone, setContactPhone] = React.useState(org.contactPhone || "");
  const [saving, setSaving] = React.useState(false);

  const missing = !name.trim();

  async function handleSave() {
    if (missing || saving) return;
    setSaving(true);
    try {
      // camelCase 로 전송 → adminFetch 가 자동 snake 변환(name/region/description/
      // contact_email/contact_phone) 후 기존 PATCH /api/web/organizations/[id] 재사용.
      await adminFetch(`/api/web/organizations/${org.id}`, {
        method: "PATCH",
        body: { name: name.trim(), region, description, contactEmail, contactPhone },
      });
      toast("변경사항이 저장되었어요");
      router.refresh();
      onSaved();
    } catch (e) {
      toast(e instanceof Error ? e.message : "저장 중 오류가 발생했어요");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="ad-panel">
      <div className="ad-panel__head">
        <div className="ad-panel__title">기본 정보 편집</div>
      </div>
      <div className="ad-formgrid">
        <div>
          <div className="ts-field">
            <label className="ts-field__label">
              단체명<span style={{ color: "var(--danger)" }}> *</span>
            </label>
            <input className="ts-input" type="text" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
        </div>
        <div>
          <div className="ts-field">
            <label className="ts-field__label" style={{ display: "flex", alignItems: "center", gap: 8 }}>
              단체 유형 <Concept tone="warn">준비중</Concept>
            </label>
            <select className="ts-select" disabled value="">
              <option value="">준비 중이에요</option>
            </select>
          </div>
        </div>
        <div>
          <div className="ts-field">
            <label className="ts-field__label">활동 지역</label>
            <select className="ts-select" value={region} onChange={(e) => setRegion(e.target.value)}>
              {REGION_OPTIONS.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div style={{ gridColumn: "1 / -1" }}>
          <div className="ts-field">
            <label className="ts-field__label">한줄 소개</label>
            <textarea
              className="ts-input"
              rows={2}
              style={{ resize: "vertical", lineHeight: 1.5 }}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <div className="ts-field__hint">단체 페이지 상단에 노출돼요</div>
          </div>
        </div>
        <div>
          <div className="ts-field">
            <label className="ts-field__label">대표 이메일</label>
            <input className="ts-input" type="text" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} />
          </div>
        </div>
        <div>
          <div className="ts-field">
            <label className="ts-field__label">대표 연락처</label>
            <input className="ts-input" type="text" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} />
          </div>
        </div>
      </div>
      <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
        <Btn icon="check" disabled={missing || saving} onClick={handleSave}>
          {saving ? "저장 중..." : "변경사항 저장"}
        </Btn>
        <Btn variant="secondary" onClick={onCancel} disabled={saving}>
          취소
        </Btn>
      </div>
    </div>
  );
}

function VerifyPanel() {
  // 인증 상태(컨셉) — 미인증도 중립 톤("기본 단체"). §4-9 점진적 온보딩.
  const docs = [
    { id: "d1", label: "사업자등록증", req: true, status: "검토중", tone: "warn" as const },
    { id: "d2", label: "대표자 신분 확인", req: true, status: "제출 전", tone: "grey" as const },
    { id: "d3", label: "단체 규약/정관", req: false, status: "제출 전", tone: "grey" as const },
  ];
  const { toast } = useAdminShell();
  return (
    <div className="ad-panel">
      <div className="ad-panel__head">
        <div className="ad-panel__title" style={{ display: "flex", alignItems: "center", gap: 8 }}>
          인증 · 서류 <Concept>준비중</Concept>
        </div>
      </div>
      <div className="oc-verify__head">
        <span className="oc-verify__ring" style={{ background: "var(--ink-dim)" }}>
          <Icon name="shield" size={20} color="#fff" />
        </span>
        <div style={{ minWidth: 0 }}>
          <div className="oc-verify__t">
            기본 단체
            <Badge tone="grey">진행률 40%</Badge>
          </div>
          <div className="oc-verify__d">서류 인증 전 · 기본 기능은 바로 사용할 수 있어요</div>
        </div>
      </div>
      <div>
        {docs.map((d) => (
          <div key={d.id} className="oc-doc">
            <span className="oc-doc__icon">
              <Icon name="file-text" size={16} />
            </span>
            <div className="oc-doc__body">
              <div className="oc-doc__t">{d.label}</div>
              <div className="oc-doc__req">{d.req ? "필수 서류" : "선택 서류"}</div>
            </div>
            <Badge tone={d.tone}>{d.status}</Badge>
          </div>
        ))}
      </div>
      <Btn block icon="upload" style={{ marginTop: 16 }} onClick={() => toast("서류 제출 기능은 준비 중이에요")}>
        서류 제출하기
      </Btn>
      <div style={{ fontSize: 12, color: "var(--ink-mute)", textAlign: "center", marginTop: 10, lineHeight: 1.5 }}>
        인증은 공식 대회 개최·회비 출금에만 필요해요. 지금은 안 해도 괜찮아요.
      </div>
    </div>
  );
}

export function OrgProfile({ org, canEdit }: { org: OrgProfileData | null; canEdit: boolean }) {
  const [edit, setEdit] = React.useState(false);
  const [brandOpen, setBrandOpen] = React.useState(false);

  if (!org) {
    return (
      <div>
        <PageHead eyebrow="단체 콘솔" title="단체 정보" sub="단체 기본 정보와 브랜딩·인증 현황을 관리해요." />
        <div className="ad-panel">
          <div style={{ color: "var(--ink-mute)", fontSize: 14 }}>표시할 단체 정보가 없어요.</div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHead eyebrow="단체 콘솔" title="단체 정보" sub="단체 기본 정보와 브랜딩·인증 현황을 관리해요." />
      <Branding org={org} onEdit={() => setBrandOpen(true)} />
      <div className="ad-cols">
        {edit && canEdit ? (
          <InfoEdit org={org} onCancel={() => setEdit(false)} onSaved={() => setEdit(false)} />
        ) : (
          <InfoView org={org} canEdit={canEdit} onEdit={() => setEdit(true)} />
        )}
        <VerifyPanel />
      </div>
      <BrandingModal open={brandOpen} onClose={() => setBrandOpen(false)} />
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/admin-toss";

const STEPS = [
  { id: 1, label: "기본", icon: "pencil" },
  { id: 2, label: "설명", icon: "file-text" },
  { id: 3, label: "검토", icon: "check-circle" },
] as const;

interface OrganizationItem {
  id: string;
  name: string;
  status: string;
  my_role: string;
}

interface OrganizationsResponse {
  organizations?: OrganizationItem[];
}

export default function NewSeriesPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [organizationId, setOrganizationId] = useState("");
  const [createFirstEdition, setCreateFirstEdition] = useState(true);
  const [organizations, setOrganizations] = useState<OrganizationItem[]>([]);
  const [orgsLoading, setOrgsLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/web/organizations");
        if (!res.ok) {
          if (!cancelled) setOrgsLoading(false);
          return;
        }
        const json = (await res.json()) as OrganizationsResponse;
        const filtered = (json.organizations ?? []).filter(
          (org) =>
            (org.my_role === "owner" || org.my_role === "admin") &&
            org.status === "approved",
        );
        if (!cancelled) {
          setOrganizations(filtered);
          setOrgsLoading(false);
        }
      } catch {
        if (!cancelled) setOrgsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const slugPreview =
    name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-") || "series";

  function goNext() {
    if (step === 1 && !name.trim()) {
      setError("시리즈 이름은 필수입니다.");
      return;
    }
    setError(null);
    setStep((current) => Math.min(3, current + 1));
  }

  function goPrev() {
    setError(null);
    setStep((current) => Math.max(1, current - 1));
  }

  async function handleSubmit() {
    if (!name.trim()) {
      setStep(1);
      setError("시리즈 이름은 필수입니다.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const payload: Record<string, string> = {
        name: name.trim(),
        description: description.trim(),
      };
      if (organizationId) payload.organization_id = organizationId;

      const res = await fetch("/api/web/series", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json()) as { id?: string; error?: string };

      if (res.ok && data.id) {
        router.push(
          createFirstEdition
            ? `/tournament-admin/series/${data.id}/add-edition`
            : `/tournament-admin/series/${data.id}`,
        );
      } else {
        setError(data.error ?? "오류가 발생했습니다.");
        setLoading(false);
      }
    } catch {
      setError("네트워크 오류가 발생했습니다.");
      setLoading(false);
    }
  }

  const selectedOrgName = organizationId
    ? organizations.find((org) => org.id === organizationId)?.name
    : null;

  return (
    <div data-skin="toss" className="mx-auto max-w-2xl space-y-6">
      <div className="ts-ph">
        <Link href="/tournament-admin/series" className="ad-backlink">
          <Icon name="chevron-left" size={15} />
          시리즈 목록
        </Link>
        <div className="ts-ph__row">
          <div style={{ minWidth: 0 }}>
            <div className="ts-ph__eyebrow">
              <Icon name="layers" size={15} />
              대회 관리자
            </div>
            <div className="ts-ph__title">새 시리즈 만들기</div>
            <div className="ts-ph__sub">시리즈 기본 정보와 첫 회차 생성 여부를 설정합니다.</div>
          </div>
        </div>
      </div>

      <div className="ts-steps" aria-label="시리즈 생성 단계">
        {STEPS.map((item) => (
          <div key={item.id} className="ts-steps__seg" data-on={item.id <= step ? "true" : "false"} />
        ))}
      </div>

      <section className="ad-panel space-y-6">
        <div className="flex flex-wrap gap-2">
          {STEPS.map((item) => (
            <span
              key={item.id}
              className="ts-badge"
              data-active={item.id === step ? "true" : "false"}
              style={{
                background: item.id === step ? "var(--primary-weak)" : "var(--grey-100)",
                color: item.id === step ? "var(--primary)" : "var(--ink-mute)",
              }}
            >
              <Icon name={item.icon} size={13} />
              {item.id}. {item.label}
            </span>
          ))}
        </div>

        {step === 1 && (
          <div className="space-y-5">
            <div>
              <h2 className="ad-panel__title">시리즈 기본 정보</h2>
              <p className="mt-1 text-sm text-[var(--ink-mute)]">
                단체를 선택하지 않으면 개인 시리즈로 생성됩니다.
              </p>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-bold text-[var(--ink)]">
                시리즈 이름 <span className="text-[var(--danger)]">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="BDR 서울 마스터즈"
                className="ts-input"
                autoFocus
              />
              {name && (
                <p className="mt-1.5 text-xs text-[var(--ink-mute)]">
                  URL 미리보기: /series/{slugPreview}-xxxxx
                </p>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-bold text-[var(--ink)]">소속 단체</label>
              <select
                value={organizationId}
                onChange={(e) => setOrganizationId(e.target.value)}
                disabled={orgsLoading}
                className="ts-select"
              >
                <option value="">단체 미연결</option>
                {organizations.map((org) => (
                  <option key={org.id} value={org.id}>
                    {org.name} ({org.my_role === "owner" ? "소유자" : "운영자"})
                  </option>
                ))}
              </select>
              <p className="mt-1.5 text-xs text-[var(--ink-mute)]">
                {orgsLoading
                  ? "단체 목록을 불러오는 중입니다."
                  : organizations.length === 0
                    ? "관리 가능한 단체가 없어 개인 시리즈로 생성됩니다."
                    : "owner/admin 권한 단체만 표시됩니다."}
              </p>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <div>
              <h2 className="ad-panel__title">설명</h2>
              <p className="mt-1 text-sm text-[var(--ink-mute)]">
                시리즈 페이지에 표시할 짧은 설명을 입력합니다.
              </p>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-bold text-[var(--ink)]">한 줄 설명</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="매분기 진행하는 정규 오픈 대회"
                className="ts-input"
              />
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-5">
            <div>
              <h2 className="ad-panel__title">검토 및 첫 회차</h2>
              <p className="mt-1 text-sm text-[var(--ink-mute)]">
                생성 후 첫 회차 추가 화면으로 바로 이어갈 수 있습니다.
              </p>
            </div>

            <div className="ad-list">
              <div className="ad-listrow">
                <span className="ad-listrow__icon"><Icon name="type" size={16} /></span>
                <div className="ad-listrow__body">
                  <div className="ad-listrow__t">{name.trim() || "이름 미입력"}</div>
                  <div className="ad-listrow__s">시리즈 이름</div>
                </div>
              </div>
              <div className="ad-listrow">
                <span className="ad-listrow__icon"><Icon name="building-2" size={16} /></span>
                <div className="ad-listrow__body">
                  <div className="ad-listrow__t">{selectedOrgName ?? "단체 미연결"}</div>
                  <div className="ad-listrow__s">소속 단체</div>
                </div>
              </div>
              <div className="ad-listrow">
                <span className="ad-listrow__icon"><Icon name="file-text" size={16} /></span>
                <div className="ad-listrow__body">
                  <div className="ad-listrow__t">{description.trim() || "설명 미입력"}</div>
                  <div className="ad-listrow__s">설명</div>
                </div>
              </div>
            </div>

            <label className="flex cursor-pointer items-start gap-3 rounded-[16px] border border-[var(--primary)]/25 bg-[var(--primary-weak)] p-4">
              <input
                type="checkbox"
                checked={createFirstEdition}
                onChange={(e) => setCreateFirstEdition(e.target.checked)}
                className="mt-1 h-4 w-4"
              />
              <span>
                <span className="block text-sm font-bold text-[var(--ink)]">첫 회차도 이어서 만들기</span>
                <span className="mt-0.5 block text-xs leading-relaxed text-[var(--ink-mute)]">
                  생성 후 일정, 장소, 정원 설정 화면으로 이동합니다.
                </span>
              </span>
            </label>
          </div>
        )}

        {error && (
          <div className="rounded-[14px] border border-[color-mix(in_srgb,var(--danger)_28%,transparent)] bg-[var(--danger-weak)] px-4 py-3 text-sm font-semibold text-[var(--danger)]">
            {error}
          </div>
        )}

        <div className="flex items-center justify-between gap-3 pt-2">
          <button
            type="button"
            onClick={goPrev}
            disabled={step === 1}
            className="ts-btn ts-btn--secondary"
          >
            <Icon name="chevron-left" size={17} />
            이전
          </button>

          {step < 3 ? (
            <button type="button" onClick={goNext} className="ts-btn ts-btn--primary">
              다음
              <Icon name="chevron-right" size={17} />
            </button>
          ) : (
            <button type="button" onClick={handleSubmit} disabled={loading} className="ts-btn ts-btn--primary">
              {loading ? "생성 중..." : "시리즈 만들기"}
            </button>
          )}
        </div>
      </section>
    </div>
  );
}

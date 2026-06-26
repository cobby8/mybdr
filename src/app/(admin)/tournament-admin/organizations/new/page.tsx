"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/admin-toss";

const REGIONS = [
  "서울",
  "경기",
  "인천",
  "부산",
  "대구",
  "대전",
  "광주",
  "울산",
  "세종",
  "강원",
  "충북",
  "충남",
  "전북",
  "전남",
  "경북",
  "경남",
  "제주",
];

export default function NewOrganizationPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [region, setRegion] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("단체 이름을 입력해 주세요.");
      return;
    }
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/web/organizations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          slug: slug.trim() || undefined,
          description: description.trim() || undefined,
          region: region.trim() || undefined,
          logo_url: logoUrl.trim() || undefined,
          contact_email: contactEmail.trim() || undefined,
          website_url: websiteUrl.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "생성에 실패했습니다.");
        return;
      }

      router.push(`/tournament-admin/organizations/${data.id}`);
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div data-skin="toss" className="mx-auto max-w-2xl space-y-6">
      <div className="ts-ph">
        <Link href="/tournament-admin/organizations" className="ad-backlink">
          <Icon name="chevron-left" size={15} />
          단체 목록
        </Link>
        <div className="ts-ph__row">
          <div style={{ minWidth: 0 }}>
            <div className="ts-ph__eyebrow">
              <Icon name="building-2" size={15} />
              대회 관리자
            </div>
            <div className="ts-ph__title">단체 만들기</div>
            <div className="ts-ph__sub">시리즈와 대회를 운영할 단체 정보를 입력합니다.</div>
          </div>
        </div>
      </div>

      <div className="ad-panel">
        <div className="ad-listrow">
          <span className="ad-listrow__icon" style={{ background: "var(--warn-weak)" }}>
            <Icon name="shield" size={17} color="var(--warn)" />
          </span>
          <div className="ad-listrow__body">
            <div className="ad-listrow__t">승인 흐름</div>
            <div className="ad-listrow__s">
              단체를 만들면 운영진 검토 후 승인됩니다. 관리자 계정은 즉시 승인될 수 있습니다.
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="ad-panel space-y-5">
        {error && (
          <div className="rounded-[14px] border border-[color-mix(in_srgb,var(--danger)_28%,transparent)] bg-[var(--danger-weak)] px-4 py-3 text-sm font-semibold text-[var(--danger)]">
            {error}
          </div>
        )}

        <div>
          <label className="mb-1.5 block text-sm font-bold text-[var(--ink)]">
            단체 이름 <span className="text-[var(--danger)]">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="서울 농구 협회"
            className="ts-input"
            required
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-bold text-[var(--ink)]">URL 슬러그</label>
          <input
            type="text"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="seoul-basketball"
            className="ts-input"
          />
          <p className="mt-1.5 text-xs text-[var(--ink-mute)]">비워두면 단체 이름 기준으로 자동 생성됩니다.</p>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-bold text-[var(--ink)]">소개</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="단체 소개"
            className="ts-input"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-bold text-[var(--ink)]">활동 지역</label>
            <select value={region} onChange={(e) => setRegion(e.target.value)} className="ts-select">
              <option value="">선택 안 함</option>
              {REGIONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-bold text-[var(--ink)]">로고 URL</label>
            <input
              type="url"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              placeholder="https://..."
              className="ts-input"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-bold text-[var(--ink)]">연락 이메일</label>
            <input
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              placeholder="contact@example.com"
              className="ts-input"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-bold text-[var(--ink)]">웹사이트</label>
            <input
              type="url"
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              placeholder="https://..."
              className="ts-input"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-3 pt-2">
          <button type="submit" disabled={submitting} className="ts-btn ts-btn--primary">
            {submitting ? "생성 중..." : "단체 만들기"}
          </button>
          <button type="button" onClick={() => router.back()} className="ts-btn ts-btn--secondary">
            취소
          </button>
        </div>
      </form>
    </div>
  );
}

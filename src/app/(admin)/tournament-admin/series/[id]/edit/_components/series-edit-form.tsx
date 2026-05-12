"use client";

/**
 * SeriesEditForm — 시리즈 편집 client form.
 *
 * 2026-05-12 (Phase C-3) — name/description/is_public/organization_id 변경.
 *
 * 폼 동작:
 *   - 마운트 시 1회 GET /api/web/organizations → owner/admin + approved 필터 (시리즈 신규 페이지와 동일 패턴)
 *   - 저장 시 PATCH /api/web/series/[id] → 변경값만 전송
 *   - 성공 시 /tournament-admin/series/[id] redirect + refresh
 *
 * organization_id 변경 시 카운터 동기화는 서버 $transaction 책임.
 */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

interface OrganizationItem {
  id: string;
  name: string;
  status: string;
  my_role: string;
}

interface OrganizationsResponse {
  organizations?: OrganizationItem[];
}

interface SeriesEditFormProps {
  seriesId: string;
  initialName: string;
  initialDescription: string;
  initialIsPublic: boolean;
  /** 빈 문자열 = 단체 미연결 */
  initialOrganizationId: string;
}

export function SeriesEditForm({
  seriesId,
  initialName,
  initialDescription,
  initialIsPublic,
  initialOrganizationId,
}: SeriesEditFormProps) {
  const router = useRouter();

  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription);
  const [isPublic, setIsPublic] = useState(initialIsPublic);
  const [organizationId, setOrganizationId] = useState(initialOrganizationId);

  const [organizations, setOrganizations] = useState<OrganizationItem[]>([]);
  const [orgsLoading, setOrgsLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 단체 목록 fetch (시리즈 신규 페이지와 동일 패턴)
  // 이유: 본인 owner/admin + approved 단체만 노출. member 차단.
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
        const list = json.organizations ?? [];
        const filtered = list.filter(
          (o) =>
            (o.my_role === "owner" || o.my_role === "admin") &&
            o.status === "approved",
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

  // 변경 감지 — 변경 사항 0건이면 저장 버튼 disabled
  const isDirty =
    name.trim() !== initialName.trim() ||
    description.trim() !== initialDescription.trim() ||
    isPublic !== initialIsPublic ||
    organizationId !== initialOrganizationId;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("시리즈 이름은 필수입니다.");
      return;
    }
    if (!isDirty) return;

    setLoading(true);
    setError(null);

    try {
      // 변경값만 전송 — 미변경 필드는 omit (서버 부하 감소 + adminLog noise 감소)
      const payload: Record<string, unknown> = {};
      if (name.trim() !== initialName.trim()) payload.name = name.trim();
      if (description.trim() !== initialDescription.trim()) {
        payload.description = description.trim() || null;
      }
      if (isPublic !== initialIsPublic) payload.is_public = isPublic;
      if (organizationId !== initialOrganizationId) {
        // 빈 문자열 = "단체 미연결" 분리. 서버가 null 처리.
        payload.organization_id = organizationId || null;
      }

      const res = await fetch(`/api/web/series/${seriesId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json()) as { id?: string; error?: string };

      if (res.ok && data.id) {
        router.push(`/tournament-admin/series/${seriesId}`);
        router.refresh();
      } else {
        setError(data.error ?? "저장 중 오류가 발생했습니다.");
        setLoading(false);
      }
    } catch {
      setError("네트워크 오류가 발생했습니다.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* 시리즈 이름 */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-[var(--color-text-primary)]">
          시리즈 이름 <span className="text-[var(--color-error)]">*</span>
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={50}
          className="w-full rounded-[12px] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm outline-none focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)]"
          required
        />
        <p className="mt-1.5 text-xs text-[var(--color-text-muted)]">
          {name.length} / 50자
        </p>
      </div>

      {/* 한 줄 설명 */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-[var(--color-text-primary)]">
          한 줄 설명{" "}
          <span className="font-normal text-[var(--color-text-muted)]">
            (선택)
          </span>
        </label>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={200}
          placeholder="예: 매분기 진행되는 BDR 정기 대회"
          className="w-full rounded-[12px] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm outline-none focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)]"
        />
        <p className="mt-1.5 text-xs text-[var(--color-text-muted)]">
          {description.length} / 200자
        </p>
      </div>

      {/* 소속 단체 */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-[var(--color-text-primary)]">
          소속 단체{" "}
          <span className="font-normal text-[var(--color-text-muted)]">
            (선택)
          </span>
        </label>
        <select
          value={organizationId}
          onChange={(e) => setOrganizationId(e.target.value)}
          disabled={orgsLoading}
          className="w-full rounded-[12px] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm outline-none focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)] disabled:opacity-60"
        >
          <option value="">단체 미연결 (개인 시리즈)</option>
          {/* 기존 organization_id 가 본인 owner/admin 가능 단체 목록에 없으면 (예: super_admin 이 타인 시리즈
              편집 케이스) "현재 단체" 옵션을 추가 노출 — 옛 값 유지 가능 */}
          {initialOrganizationId &&
            !organizations.some((o) => o.id === initialOrganizationId) && (
              <option value={initialOrganizationId}>
                (현재 단체) ID: {initialOrganizationId}
              </option>
            )}
          {organizations.map((o) => (
            <option key={o.id} value={o.id}>
              {o.name} ({o.my_role === "owner" ? "소유자" : "운영자"})
            </option>
          ))}
        </select>
        {orgsLoading && (
          <p className="mt-1.5 text-xs text-[var(--color-text-muted)]">
            단체 목록 불러오는 중...
          </p>
        )}
        {organizationId !== initialOrganizationId && (
          <p
            className="mt-1.5 rounded-[12px] p-2 text-xs"
            style={{
              background: "rgba(0,121,185,0.08)",
              color: "var(--color-text-primary)",
            }}
          >
            단체 변경 시 카운터가 자동 동기화됩니다 (이전 단체 -1 / 새 단체 +1).
          </p>
        )}
      </div>

      {/* 공개 여부 */}
      <div>
        <label className="flex cursor-pointer items-center gap-3 rounded-[12px] border border-[var(--color-border)] p-3">
          <input
            type="checkbox"
            checked={isPublic}
            onChange={(e) => setIsPublic(e.target.checked)}
            className="h-4 w-4"
          />
          <div className="flex-1">
            <p className="text-sm font-medium text-[var(--color-text-primary)]">
              공개 시리즈
            </p>
            <p className="text-xs text-[var(--color-text-muted)]">
              체크 해제 시 공개 페이지에서 노출되지 않습니다.
            </p>
          </div>
        </label>
      </div>

      {error && (
        <p
          className="rounded-[12px] px-4 py-3 text-sm"
          style={{
            background: "rgba(239,68,68,0.1)",
            color: "var(--color-error)",
          }}
        >
          {error}
        </p>
      )}

      <Button
        type="submit"
        disabled={!name.trim() || !isDirty || loading}
        className="w-full py-3"
      >
        {loading ? "저장 중..." : isDirty ? "저장하기" : "변경 사항 없음"}
      </Button>
    </form>
  );
}

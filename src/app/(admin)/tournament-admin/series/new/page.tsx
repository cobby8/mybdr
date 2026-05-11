"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

/* ============================================================
 * /tournament-admin/series/new — 시리즈 신규 생성 페이지
 *
 * 이유(왜):
 *   기존 폼은 name/description 만 전송 → organization_id NULL 박제 →
 *   운영 사고 (단체 미연결 고아 시리즈 발생, series id=10 사례).
 *   드롭다운 추가로 본인 소속 단체(owner/admin) 중 하나를 선택 가능하게 함.
 *
 * 데이터 source:
 *   GET /api/web/organizations 는 본인이 소속된 단체 목록 + myRole 반환.
 *   여기서 myRole === "owner" | "admin" 만 필터링 (member 는 시리즈 생성 불가).
 *   (POST /api/web/series 가 동일 권한 검증을 서버에서도 수행 → 이중 가드)
 * ============================================================ */

// 단체 목록 응답 타입
// apiSuccess() 는 convertKeysToSnakeCase 자동 변환 → route.ts 의 myRole 이 응답에서 my_role 로 도착.
// 응답 형식: { organizations: [...] } (data wrap 없음 — apiSuccess 는 인자를 그대로 직렬화)
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
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  // 단체 선택 — 빈 문자열 = "단체 미연결" (organization_id null 전송)
  const [organizationId, setOrganizationId] = useState<string>("");
  const [organizations, setOrganizations] = useState<OrganizationItem[]>([]);
  const [orgsLoading, setOrgsLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 마운트 시 본인 소속 단체 목록 fetch
  // 왜: 페이지 진입 시 1회만 호출. owner/admin 권한 + approved 상태만 노출하여
  // 사용자가 잘못 선택해서 서버에서 403 받는 케이스를 사전 차단.
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
        // owner/admin 만 + approved 만 필터 (member 는 시리즈 생성 불가)
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

  // 이름 기반 slug 미리보기
  const slugPreview = name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-") || "series";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    setError(null);

    try {
      // organization_id 가 빈 문자열이면 body 에서 제외 → 서버에서 null 박제
      const payload: Record<string, string> = {
        name: name.trim(),
        description: description.trim(),
      };
      if (organizationId) {
        payload.organization_id = organizationId;
      }

      const res = await fetch("/api/web/series", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json() as { id?: string; error?: string };

      if (res.ok && data.id) {
        router.push(`/tournament-admin/series/${data.id}`);
      } else {
        setError(data.error ?? "오류가 발생했습니다.");
        setLoading(false);
      }
    } catch {
      setError("네트워크 오류가 발생했습니다.");
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-6 text-xl font-bold sm:text-2xl">새 시리즈 만들기</h1>

      <Card>
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
              placeholder="예: BDR 서울 올스타전"
              className="w-full rounded-[12px] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm outline-none focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)]"
              required
              autoFocus
            />
            {name && (
              <p className="mt-1.5 text-xs text-[var(--color-text-muted)]">
                URL 경로: /series/<span className="font-mono text-[var(--color-text-muted)]">{slugPreview}-xxxxx</span>
              </p>
            )}
          </div>

          {/* 소속 단체 선택 — owner/admin 권한 단체만 노출 */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[var(--color-text-primary)]">
              소속 단체 <span className="text-[var(--color-text-muted)] font-normal">(선택)</span>
            </label>
            <select
              value={organizationId}
              onChange={(e) => setOrganizationId(e.target.value)}
              disabled={orgsLoading}
              className="w-full rounded-[12px] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm outline-none focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)] disabled:opacity-60"
            >
              <option value="">단체 미연결 (개인 시리즈)</option>
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
            {!orgsLoading && organizations.length === 0 && (
              <p className="mt-1.5 text-xs text-[var(--color-text-muted)]">
                관리 가능한 단체가 없어 개인 시리즈로 생성됩니다.
              </p>
            )}
          </div>

          {/* 한 줄 설명 (선택) */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[var(--color-text-primary)]">
              한 줄 설명 <span className="text-[var(--color-text-muted)] font-normal">(선택)</span>
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="예: 매분기 진행되는 BDR 정기 대회"
              className="w-full rounded-[12px] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm outline-none focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)]"
            />
          </div>

          {error && (
            <p className="rounded-[12px] bg-[rgba(239,68,68,0.1)] px-4 py-3 text-sm text-[var(--color-error)]">
              {error}
            </p>
          )}

          <Button
            type="submit"
            disabled={!name.trim() || loading}
            className="w-full py-3"
          >
            {loading ? "생성 중..." : "시리즈 만들기"}
          </Button>
        </form>
      </Card>

      <p className="mt-4 text-center text-xs text-[var(--color-text-muted)]">
        시리즈 생성 후 회차(1회, 2회...)를 추가할 수 있습니다.
      </p>
    </div>
  );
}

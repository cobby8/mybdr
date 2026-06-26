"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

/* ============================================================
 * /tournament-admin/series/new — 시리즈 신규 생성 (Q3 3-step 마법사)
 *
 * 이유(왜):
 *   기존 단일 form 을 OO3 시안의 Q3 3-step lock 순서로 박제.
 *   Q3 lock(순서 절대 보존): ①기본 → ②설명·로고·정기성 → ③검토+첫회차.
 *   기존 폼은 name/description 만 전송 → organization_id NULL 박제 시
 *   운영 사고(단체 미연결 고아 시리즈) 발생 → 드롭다운으로 소속 단체 선택.
 *
 * mock 금지(중요):
 *   시안 STEP2 의 logo(한 글자)/color(테마색)/periodicity(정기성) 는
 *   tournament_series schema 에 컬럼이 없고 POST /api/web/series 도 받지 않음.
 *   → DB 미지원 → 미박제(hide). STEP2 는 실전송 가능한 description 만 담는다.
 *
 * 데이터 source (무변경):
 *   GET /api/web/organizations → 본인 소속 단체 + my_role.
 *   owner/admin + approved 만 필터(member 는 시리즈 생성 불가).
 *   POST /api/web/series 가 동일 권한 검증 수행(이중 가드). route 무변경.
 * ============================================================ */

// Q3 lock — 3-step 순서 절대 보존 (시안 OO3 STEPS 박제)
//   logo/color/periodicity 는 schema 미지원 → step2 라벨은 "설명"만 (정기성/로고 hide)
const STEPS = [
  { id: 1, lbl: "기본", ico: "edit" },
  { id: 2, lbl: "설명", ico: "description" },
  { id: 3, lbl: "검토 · 첫 회차", ico: "check_circle" },
] as const;

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

  // 마법사 현재 단계 (1~3)
  const [step, setStep] = useState(1);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  // 단체 선택 — 빈 문자열 = "단체 미연결" (organization_id null 전송)
  const [organizationId, setOrganizationId] = useState<string>("");
  // STEP3 — 생성 후 첫 회차 만들기로 이어갈지 (체크 시 add-edition 페이지로 이동)
  const [createFirstEdition, setCreateFirstEdition] = useState(true);

  const [organizations, setOrganizations] = useState<OrganizationItem[]>([]);
  const [orgsLoading, setOrgsLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 마운트 시 본인 소속 단체 목록 fetch (기존 로직 100% 보존)
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

  // 이름 기반 slug 미리보기 (기존 로직 보존)
  const slugPreview =
    name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-") || "series";

  // STEP 이동 — STEP1 이름 빈값 차단 (시안 에러 룰)
  function goNext() {
    if (step === 1 && !name.trim()) {
      setError("시리즈 이름은 필수입니다.");
      return;
    }
    setError(null);
    setStep((s) => Math.min(3, s + 1));
  }
  function goPrev() {
    setError(null);
    setStep((s) => Math.max(1, s - 1));
  }

  // 시리즈 생성 — 기존 POST /api/web/series 그대로 활용 (route 무변경)
  async function handleSubmit() {
    if (!name.trim()) {
      setStep(1);
      setError("시리즈 이름은 필수입니다.");
      return;
    }

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
      const data = (await res.json()) as { id?: string; error?: string };

      if (res.ok && data.id) {
        // STEP3 "첫 회차 만들기" 체크 시 → add-edition 페이지로,
        // 미체크 시 → 시리즈 상세로 (시안 STEP3 분기 박제)
        if (createFirstEdition) {
          router.push(`/tournament-admin/series/${data.id}/add-edition`);
        } else {
          router.push(`/tournament-admin/series/${data.id}`);
        }
      } else {
        setError(data.error ?? "오류가 발생했습니다.");
        setLoading(false);
      }
    } catch {
      setError("네트워크 오류가 발생했습니다.");
      setLoading(false);
    }
  }

  // STEP3 검토용 — 선택된 단체명 (없으면 개인 시리즈)
  const selectedOrgName = organizationId
    ? organizations.find((o) => o.id === organizationId)?.name
    : null;

  return (
    <div data-skin="toss" className="mx-auto max-w-lg">
      {/* 뒤로가기 (시안 wizard 상단 "시리즈 목록") */}
      <Link
        href="/tournament-admin/series"
        className="mb-2 inline-flex items-center gap-1 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-muted)]"
      >
        <span className="material-symbols-outlined text-sm">arrow_back</span>
        시리즈 목록
      </Link>
      <h1 className="mb-4 text-xl font-bold sm:text-2xl">새 시리즈 만들기</h1>

      {/* Step indicator (Q3 3-step — 4C-3 OU3 동일 패턴 / 정사각 원형 50%) */}
      <div className="mb-6 flex items-center gap-1.5 sm:gap-2">
        {STEPS.map((s, i) => {
          const isActive = s.id === step;
          const isDone = s.id < step;
          return (
            <div key={s.id} className="flex flex-1 flex-col items-center gap-1.5">
              <div className="flex w-full items-center">
                {/* 단계 번호/완료 표시 — pill 9999px 금지, 정사각 rounded-full(50%) */}
                <div
                  className={[
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold transition-colors",
                    isActive
                      ? "bg-[var(--color-primary)] text-white"
                      : isDone
                        ? "bg-[var(--color-success)] text-white"
                        : "bg-[var(--color-surface)] text-[var(--color-text-muted)] ring-1 ring-[var(--color-border)]",
                  ].join(" ")}
                >
                  {isDone ? (
                    <span className="material-symbols-outlined text-base">check</span>
                  ) : (
                    s.id
                  )}
                </div>
                {/* 단계 사이 연결선 (마지막 단계 제외) */}
                {i < STEPS.length - 1 && (
                  <div
                    className={[
                      "h-0.5 flex-1",
                      isDone ? "bg-[var(--color-success)]" : "bg-[var(--color-border)]",
                    ].join(" ")}
                  />
                )}
              </div>
              <span
                className={[
                  "text-center text-[11px] font-medium",
                  isActive
                    ? "text-[var(--color-text-primary)]"
                    : "text-[var(--color-text-muted)]",
                ].join(" ")}
              >
                {s.lbl}
              </span>
            </div>
          );
        })}
      </div>

      <section className="ts-card">
        {/* STEP 1 — 시리즈 기본 (이름 + 소속 단체) */}
        {step === 1 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-base font-semibold text-[var(--color-text-primary)]">
                STEP 1 · 시리즈 기본 정보
              </h2>
              <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                시리즈 이름과 소속 단체를 지정합니다. 단체 미연결 시 개인 시리즈로 생성됩니다.
              </p>
            </div>

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
                className="w-full rounded-[12px] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-base outline-none focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)]"
                autoFocus
              />
              {name && (
                <p className="mt-1.5 text-xs text-[var(--color-text-muted)]">
                  URL 경로: /series/
                  <span className="font-mono text-[var(--color-text-muted)]">
                    {slugPreview}-xxxxx
                  </span>
                </p>
              )}
            </div>

            {/* 소속 단체 선택 — owner/admin 권한 단체만 노출 */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[var(--color-text-primary)]">
                소속 단체{" "}
                <span className="font-normal text-[var(--color-text-muted)]">(선택)</span>
              </label>
              <select
                value={organizationId}
                onChange={(e) => setOrganizationId(e.target.value)}
                disabled={orgsLoading}
                className="w-full rounded-[12px] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-base outline-none focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)] disabled:opacity-60"
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
              {!orgsLoading && organizations.length > 0 && (
                <p className="mt-1.5 text-xs text-[var(--color-text-muted)]">
                  owner / admin 권한 단체만 노출됩니다 (member 는 시리즈 생성 불가).
                </p>
              )}
            </div>
          </div>
        )}

        {/* STEP 2 — 설명 (logo/color/periodicity 는 schema 미지원 → hide) */}
        {step === 2 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-base font-semibold text-[var(--color-text-primary)]">
                STEP 2 · 설명
              </h2>
              <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                시리즈 페이지에 노출되는 한 줄 설명입니다. 추후 수정 가능합니다.
              </p>
            </div>

            {/* 한 줄 설명 (선택) */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[var(--color-text-primary)]">
                한 줄 설명{" "}
                <span className="font-normal text-[var(--color-text-muted)]">(선택)</span>
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="예: 매분기 진행되는 BDR 정기 대회"
                className="w-full rounded-[12px] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-base outline-none focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)]"
              />
            </div>
          </div>
        )}

        {/* STEP 3 — 검토 + 첫 회차 만들기 */}
        {step === 3 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-base font-semibold text-[var(--color-text-primary)]">
                STEP 3 · 검토 · 첫 회차 만들기
              </h2>
              <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                입력 내용을 확인하고 시리즈를 만듭니다. 첫 회차도 같이 추가할 수 있습니다.
              </p>
            </div>

            {/* 입력 요약 (시안 STEP3 review 박제 — schema 지원 필드만) */}
            <div className="divide-y divide-[var(--color-border)] rounded-[12px] border border-[var(--color-border)]">
              <div className="flex items-center justify-between gap-3 px-4 py-3">
                <span className="text-xs text-[var(--color-text-muted)]">이름</span>
                <span className="text-sm font-semibold text-[var(--color-text-primary)]">
                  {name.trim() || "미입력"}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3 px-4 py-3">
                <span className="text-xs text-[var(--color-text-muted)]">소속 단체</span>
                <span className="text-sm text-[var(--color-text-primary)]">
                  {selectedOrgName ?? "단체 미연결 (개인 시리즈)"}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3 px-4 py-3">
                <span className="text-xs text-[var(--color-text-muted)]">설명</span>
                <span
                  className={
                    description.trim()
                      ? "text-sm text-[var(--color-text-primary)]"
                      : "text-sm text-[var(--color-text-muted)]"
                  }
                >
                  {description.trim() || "미입력"}
                </span>
              </div>
            </div>

            {/* 첫 회차 같이 만들기 (시안 STEP3 체크박스 박제) */}
            <label className="flex cursor-pointer items-start gap-3 rounded-[12px] border border-[var(--color-info)]/30 bg-[var(--color-info)]/10 p-3.5">
              <input
                type="checkbox"
                checked={createFirstEdition}
                onChange={(e) => setCreateFirstEdition(e.target.checked)}
                className="mt-0.5 h-4 w-4"
              />
              <div>
                <p className="text-sm font-semibold text-[var(--color-text-primary)]">
                  첫 회차 (1회)도 같이 만들기
                </p>
                <p className="mt-0.5 text-xs leading-relaxed text-[var(--color-text-muted)]">
                  생성 후 회차 추가 화면으로 이동합니다 (날짜 · 장소 · 최대 팀 수 입력).
                </p>
              </div>
            </label>
          </div>
        )}

        {/* 공통 에러 표시 */}
        {error && (
          <p className="mt-5 rounded-[12px] bg-[color-mix(in_srgb,var(--color-error)_10%,transparent)] px-4 py-3 text-sm text-[var(--color-error)]">
            {error}
          </p>
        )}

        {/* 네비게이션 (이전 / 다음 또는 만들기) — 버튼 min-h 44px 모바일 룰 */}
        <div className="mt-6 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={goPrev}
            disabled={step === 1}
            className="inline-flex min-h-[44px] items-center gap-1 rounded border border-[var(--color-border)] bg-[var(--color-surface)] px-4 text-sm font-semibold text-[var(--color-text-primary)] hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <span className="material-symbols-outlined text-base">arrow_back</span>
            이전
          </button>

          <div className="flex items-center gap-3">
            <span className="font-mono text-xs font-bold text-[var(--color-text-muted)]">
              {step}/3 단계
            </span>
            {step < 3 ? (
              <button
                type="button"
                onClick={goNext}
                className="inline-flex min-h-[44px] items-center gap-1 rounded bg-[var(--color-primary)] px-5 text-sm font-semibold text-white hover:opacity-90"
              >
                다음
                <span className="material-symbols-outlined text-base">arrow_forward</span>
              </button>
            ) : (
              <button type="button" onClick={handleSubmit} disabled={loading} className="ts-btn ts-btn--primary min-h-[44px] px-5">
                {loading ? "생성 중..." : "시리즈 만들기"}
              </button>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

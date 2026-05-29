"use client";

/**
 * 단체 신청 페이지 (OU3 OrganizationApply 박제 — Phase 4C-3)
 *
 * 일반 유저가 단체를 신청하면 pending 상태로 생성되고,
 * 관리자가 승인하면 approved로 변경된다.
 *
 * 박제 핵심 (사용자 결정 Q4 5-step lock — 순서 절대 보존):
 *   STEP 1 — 단체 기본   (name + slug 자동 생성 + description)
 *   STEP 2 — 지역 · 공개 (region 그리드 + is_public 토글)
 *   STEP 3 — 연락        (contact_email + website_url)
 *   STEP 4 — 검토 메모   (apply_note — 운영자만 열람)
 *   STEP 5 — 검토 · 제출 (입력 요약 + status=pending 안내)
 *
 * BO1: form 필드 = organizations 컬럼만 사용
 *   name · slug · description · region · is_public
 *   · contact_email · website_url · apply_note
 *   (schema에 없는 필드 추가 금지)
 *
 * 제출 처리: 기존 POST /api/web/organizations 그대로 활용 (인증 withWebAuth).
 *            일반 유저 → status='pending', 관리자 → 즉시 approved.
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
// Phase 12 §G: 모바일 백버튼 (사용자 보고)
import { PageBackButton } from "@/components/shared/page-back-button";

// Q4 lock — 5-step 순서 절대 보존 (시안 OU3 STEPS 박제)
const STEPS = [
  { id: 1, key: "basic", lbl: "단체 기본", ico: "apartment" },
  { id: 2, key: "region", lbl: "지역 · 공개", ico: "place" },
  { id: 3, key: "contact", lbl: "연락", ico: "contact_mail" },
  { id: 4, key: "note", lbl: "검토 메모", ico: "edit_note" },
  { id: 5, key: "review", lbl: "검토 · 제출", ico: "check_circle" },
] as const;

// 활동 지역 그리드 (시안 OU3 REGIONS 박제)
const REGIONS = [
  "서울", "경기", "인천", "부산", "대구", "대전", "광주", "울산", "세종",
  "강원", "충북", "충남", "전북", "전남", "경북", "경남", "제주", "전국",
];

// 한글 이름 → slug 자동 생성 (시안 slugify 박제: 한글/영문/숫자 허용)
function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9가-힣ㄱ-ㅎ]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export default function OrganizationApplyPage() {
  const router = useRouter();

  // 마법사 현재 단계 (1~5)
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // 폼 상태 (BO1 — organizations 컬럼만)
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  // slug 를 사용자가 직접 건드렸는지 추적 (이름 변경 시 자동 갱신 여부 판단)
  const [slugTouched, setSlugTouched] = useState(false);
  const [description, setDescription] = useState("");
  const [region, setRegion] = useState("서울");
  const [isPublic, setIsPublic] = useState(true);
  const [contactEmail, setContactEmail] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [applyNote, setApplyNote] = useState("");

  const cur = STEPS.find((s) => s.id === step)!;

  // 이름 입력 → slug 미수정 상태면 자동 생성 (시안 STEP1 동작 박제)
  function handleNameChange(value: string) {
    setName(value);
    if (!slugTouched) {
      setSlug(slugify(value));
    }
  }

  // 다음/이전 이동 (1~5 범위 클램프)
  function goNext() {
    // STEP1 단체명 빈값 차단 (시안 에러 룰: "단체명 빈값 시 step 1 차단")
    if (step === 1 && !name.trim()) {
      setError("단체 이름은 필수입니다.");
      return;
    }
    setError(null);
    setStep((s) => Math.min(5, s + 1));
  }
  function goPrev() {
    setError(null);
    setStep((s) => Math.max(1, s - 1));
  }

  // 단체 신청 제출 — 기존 POST /api/web/organizations 그대로 활용
  async function handleSubmit() {
    if (!name.trim()) {
      setStep(1);
      setError("단체 이름은 필수입니다.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/web/organizations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          slug: slug.trim() || undefined,
          description: description.trim() || undefined,
          region: region.trim() || undefined,
          is_public: isPublic, // STEP2 공개 토글
          contact_email: contactEmail.trim() || undefined,
          website_url: websiteUrl.trim() || undefined,
          apply_note: applyNote.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        // 이유: apiError는 문자열을, validationError는 배열을 보낸다.
        //       두 형태 모두 사용자에게 의미 있는 메시지로 보여준다.
        const errMsg =
          typeof data?.error === "string"
            ? data.error
            : Array.isArray(data?.error)
              ? data.error
                  .map((e: { message?: string }) => e?.message)
                  .filter(Boolean)
                  .join(", ")
              : "신청 중 오류가 발생했습니다.";
        setError(errMsg);
        return;
      }

      // 성공: apiSuccess는 객체를 그대로(snake_case로) 직렬화하므로
      //       status / slug는 top-level로 접근한다 (data.data.* 아님).
      if (data?.status === "approved" && data?.slug) {
        router.push(`/organizations/${data.slug}`);
      } else {
        setSuccess(true);
      }
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  // 신청 완료 화면 (시안 OU3 success state 박제 — status=pending)
  if (success) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <span className="material-symbols-outlined text-6xl text-[var(--color-success)]">
          check_circle
        </span>
        <h1 className="mt-4 text-2xl font-bold text-[var(--color-text-primary)]">
          신청이 완료되었습니다
        </h1>
        <p className="mt-2 leading-relaxed text-[var(--color-text-secondary)]">
          <b className="text-[var(--color-text-primary)]">{name.trim()}</b> 등록
          신청이 접수되었습니다.
          <br />
          사이트 운영자 검토 후 승인 결과를 알려드립니다.
          <br />
          보통 1~2일 내에 처리됩니다.
        </p>

        {/* 승인/거절 안내 (시안 success 하단 안내 박제) */}
        <div className="mx-auto mt-6 flex max-w-md items-start gap-2.5 rounded border border-[var(--color-info)]/30 bg-[var(--color-info)]/10 px-3.5 py-3 text-left text-xs leading-relaxed text-[var(--color-text-secondary)]">
          <span className="material-symbols-outlined shrink-0 text-base text-[var(--color-info)]">
            schedule
          </span>
          <div>
            <b className="text-[var(--color-text-primary)]">승인 후</b>: 단체
            페이지가 공개되고 시리즈를 만들 수 있습니다.
            <br />
            <b className="text-[var(--color-text-primary)]">거절 시</b>: 거절
            사유와 함께 안내됩니다. 보완 후 재신청 가능합니다.
          </div>
        </div>

        <div className="mt-6 flex justify-center gap-2">
          <button
            onClick={() => router.push("/organizations")}
            className="inline-flex min-h-[44px] items-center gap-1.5 rounded border border-[var(--color-border)] bg-[var(--color-surface)] px-5 text-sm font-semibold text-[var(--color-text-primary)] hover:opacity-90"
          >
            <span className="material-symbols-outlined text-base">
              arrow_back
            </span>
            단체 목록
          </button>
          <button
            onClick={() => router.push("/")}
            className="min-h-[44px] rounded bg-[var(--color-primary)] px-5 text-sm font-semibold text-white hover:opacity-90"
          >
            홈으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      {/* Phase 12 §G — 모바일 백버튼 (lg+ hidden) */}
      <PageBackButton fallbackHref="/organizations" />

      {/* 헤더 (시안 ou3-head 박제) */}
      <header>
        <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
          단체 등록 · ORGANIZATIONS / APPLY
        </div>
        <h1 className="mt-1 text-2xl font-bold text-[var(--color-text-primary)]">
          단체를 등록합니다
        </h1>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
          5단계로 단체 정보를 입력하면 사이트 운영자 검토 후 승인됩니다 (1~2일
          소요).
        </p>
      </header>

      {/* Step indicator (시안 ou3-steps 박제 — 진행 표시) */}
      <div className="mt-6 flex items-center gap-1.5 sm:gap-2">
        {STEPS.map((s, i) => {
          const isActive = s.id === step;
          const isDone = s.id < step;
          return (
            <div key={s.id} className="flex flex-1 flex-col items-center gap-1.5">
              <div className="flex w-full items-center">
                {/* 단계 번호/완료 표시 (정사각 원형 — pill 9999px 금지, 50% 사용) */}
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
                    <span className="material-symbols-outlined text-base">
                      check
                    </span>
                  ) : (
                    s.id
                  )}
                </div>
                {/* 단계 사이 연결선 (마지막 단계 제외) */}
                {i < STEPS.length - 1 && (
                  <div
                    className={[
                      "h-0.5 flex-1",
                      isDone
                        ? "bg-[var(--color-success)]"
                        : "bg-[var(--color-border)]",
                    ].join(" ")}
                  />
                )}
              </div>
              <span
                className={[
                  "text-center text-[10px] font-semibold leading-tight sm:text-xs",
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

      {/* 에러 메시지 */}
      {error && (
        <div className="mt-5 rounded bg-[var(--color-error)]/10 px-4 py-3 text-sm text-[var(--color-error)]">
          {error}
        </div>
      )}

      {/* Step card (시안 ou3-card 박제) */}
      <div className="mt-5 rounded border border-[var(--color-border)] bg-[var(--color-surface)] p-5 sm:p-6">
        <h2 className="flex items-center gap-1.5 text-base font-bold text-[var(--color-text-primary)]">
          <span className="material-symbols-outlined text-[22px] text-[var(--color-primary)]">
            {cur.ico}
          </span>
          STEP {step} · {cur.lbl}
        </h2>

        {/* STEP 1 — 단체 기본 */}
        {step === 1 && (
          <div className="mt-4 space-y-5">
            <p className="text-xs text-[var(--color-text-secondary)]">
              단체 이름과 URL slug 를 입력합니다. slug 는 비워두면 이름으로부터
              자동 생성됩니다.
            </p>
            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--color-text-primary)]">
                단체 이름 <span className="text-[var(--color-error)]">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="예: 서울 농구 연합회"
                className="w-full rounded border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5 text-base text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)] focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--color-text-primary)]">
                URL Slug{" "}
                <span className="text-xs text-[var(--color-text-muted)]">
                  (선택 · 자동)
                </span>
              </label>
              <input
                type="text"
                value={slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  setSlug(e.target.value);
                }}
                placeholder="seoul-bba"
                className="w-full rounded border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5 text-base text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)] focus:outline-none"
              />
              <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                공개 페이지 URL: mybdr.kr/organizations/
                <b className="text-[var(--color-text-primary)]">
                  {slug || "slug"}
                </b>
              </p>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--color-text-primary)]">
                한 줄 소개{" "}
                <span className="text-xs text-[var(--color-text-muted)]">
                  (선택)
                </span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="단체의 활동 내용, 목적 등을 간단히 소개해주세요"
                rows={3}
                className="w-full rounded border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5 text-base text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)] focus:outline-none"
              />
            </div>
          </div>
        )}

        {/* STEP 2 — 지역 · 공개 */}
        {step === 2 && (
          <div className="mt-4 space-y-5">
            <p className="text-xs text-[var(--color-text-secondary)]">
              활동 지역을 선택하고 단체 페이지 공개 여부를 결정합니다.
            </p>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[var(--color-text-primary)]">
                활동 지역 <span className="text-[var(--color-error)]">*</span>
              </label>
              {/* 지역 그리드 (시안 ou3-region-grid 박제) */}
              <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
                {REGIONS.map((r) => {
                  const on = region === r;
                  return (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRegion(r)}
                      className={[
                        "min-h-[44px] rounded border px-2 py-2 text-sm font-medium transition-colors",
                        on
                          ? "border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)]"
                          : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:border-[var(--color-primary)]",
                      ].join(" ")}
                    >
                      {r}
                    </button>
                  );
                })}
              </div>
              <p className="mt-1.5 text-xs text-[var(--color-text-muted)]">
                필요 시 단체 페이지 안 &quot;활동 지역&quot;에서 상세 구·동 추가
                가능
              </p>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[var(--color-text-primary)]">
                단체 페이지 공개
              </label>
              {/* 공개/비공개 토글 (시안 STEP2 박제) */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsPublic(true)}
                  className={[
                    "flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded border text-sm font-medium transition-colors",
                    isPublic
                      ? "border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)]"
                      : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)]",
                  ].join(" ")}
                >
                  <span className="material-symbols-outlined text-base">
                    visibility
                  </span>
                  공개
                </button>
                <button
                  type="button"
                  onClick={() => setIsPublic(false)}
                  className={[
                    "flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded border text-sm font-medium transition-colors",
                    !isPublic
                      ? "border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)]"
                      : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)]",
                  ].join(" ")}
                >
                  <span className="material-symbols-outlined text-base">
                    visibility_off
                  </span>
                  비공개
                </button>
              </div>
              <p className="mt-1.5 text-xs text-[var(--color-text-muted)]">
                비공개 시 단체 페이지가 검색되지 않습니다. 추후 변경 가능.
              </p>
            </div>
          </div>
        )}

        {/* STEP 3 — 연락 */}
        {step === 3 && (
          <div className="mt-4 space-y-5">
            <p className="text-xs text-[var(--color-text-secondary)]">
              단체 운영자 연락 정보. 사이트 운영자 검토 + 향후 사용자 문의용으로
              사용됩니다.
            </p>
            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--color-text-primary)]">
                연락 이메일 <span className="text-[var(--color-error)]">*</span>
              </label>
              <input
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="contact@example.com"
                className="w-full rounded border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5 text-base text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)] focus:outline-none"
              />
              <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                검토 결과 / 승인 알림이 이 이메일로 발송됩니다
              </p>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--color-text-primary)]">
                웹사이트{" "}
                <span className="text-xs text-[var(--color-text-muted)]">
                  (선택)
                </span>
              </label>
              {/*
                이유: type="url"이면 브라우저(HTML5) native 검증이 강제 발동해서
                      "https//mybdr.kr"처럼 콜론 빠진 입력에 즉시 토스트가 뜨고
                      제출이 막힌다. 형식 검증은 zod(서버) 쪽에서 처리하고,
                      여기선 모바일 키보드 힌트만 inputMode로 준다.
              */}
              <input
                type="text"
                inputMode="url"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                placeholder="https://..."
                className="w-full rounded border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5 text-base text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)] focus:outline-none"
              />
              <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                단체 홈페이지 / SNS 링크 (있다면)
              </p>
            </div>
          </div>
        )}

        {/* STEP 4 — 검토 메모 */}
        {step === 4 && (
          <div className="mt-4 space-y-5">
            <p className="text-xs text-[var(--color-text-secondary)]">
              사이트 운영자 검토용 메모. 단체 활동 내용, 운영 계획, 참고할 점을
              자유롭게 작성하세요.
            </p>
            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--color-text-primary)]">
                검토 메모{" "}
                <span className="text-xs text-[var(--color-text-muted)]">
                  (선택 · 공개 X)
                </span>
              </label>
              <textarea
                value={applyNote}
                onChange={(e) => setApplyNote(e.target.value)}
                placeholder="단체 활동 내용 / 운영 계획 / 기존 대회 이력"
                rows={5}
                className="w-full rounded border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5 text-base text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)] focus:outline-none"
              />
              <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                이 메모는 사이트 운영자만 볼 수 있습니다. 단체 페이지에 노출되지
                않음.
              </p>
            </div>
          </div>
        )}

        {/* STEP 5 — 검토 · 제출 */}
        {step === 5 && (
          <div className="mt-4 space-y-4">
            <p className="text-xs text-[var(--color-text-secondary)]">
              입력 내용을 확인하고 제출합니다. 제출 후 사이트 운영자 검토를 거쳐
              승인됩니다.
            </p>
            {/* 입력 요약 (시안 ou3-review 박제) */}
            <div className="divide-y divide-[var(--color-border)] rounded border border-[var(--color-border)]">
              <ReviewRow label="단체 이름" value={name.trim()} strong />
              <ReviewRow label="Slug" value={`/${slug || slugify(name)}`} mono />
              <ReviewRow label="소개" value={description.trim()} />
              <ReviewRow label="활동 지역" value={region} />
              <ReviewRow label="공개" value={isPublic ? "공개" : "비공개"} />
              <ReviewRow label="연락 이메일" value={contactEmail.trim()} mono />
              <ReviewRow label="웹사이트" value={websiteUrl.trim()} />
              <ReviewRow label="검토 메모" value={applyNote.trim()} />
            </div>
            {/* status=pending 안내 (시안 warn 박스 박제) */}
            <div className="flex items-start gap-2 rounded border border-[var(--color-warning)]/30 bg-[var(--color-warning)]/10 px-3 py-2.5 text-xs leading-relaxed text-[var(--color-text-secondary)]">
              <span className="material-symbols-outlined shrink-0 text-base text-[var(--color-warning)]">
                info
              </span>
              <div>
                제출 후 <b className="text-[var(--color-text-primary)]">검토 대기</b>{" "}
                상태로 등록됩니다. 단체 페이지는 승인 전까지 공개되지 않으며,
                시리즈 / 회차 생성도 차단됩니다.
              </div>
            </div>
          </div>
        )}

        {/* 하단 네비게이션 (시안 ou3-foot 박제) */}
        <div className="mt-6 flex items-center justify-between border-t border-[var(--color-border)] pt-5">
          <button
            type="button"
            onClick={goPrev}
            disabled={step === 1}
            className="inline-flex min-h-[44px] items-center gap-1.5 rounded border border-[var(--color-border)] bg-[var(--color-surface)] px-4 text-sm font-semibold text-[var(--color-text-primary)] hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <span className="material-symbols-outlined text-base">
              arrow_back
            </span>
            이전
          </button>

          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-[var(--color-text-muted)]">
              {step}/5 단계
            </span>
            {step < 5 ? (
              <button
                type="button"
                onClick={goNext}
                className="inline-flex min-h-[44px] items-center gap-1.5 rounded bg-[var(--color-primary)] px-5 text-sm font-semibold text-white hover:opacity-90"
              >
                다음
                <span className="material-symbols-outlined text-base">
                  arrow_forward
                </span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="inline-flex min-h-[44px] items-center gap-1.5 rounded bg-[var(--color-primary)] px-5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-base">send</span>
                {loading ? "신청 중..." : "신청 제출"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// STEP5 검토 요약 행 — 미입력 값은 흐리게 표시 (시안 ou3-review__row 박제)
function ReviewRow({
  label,
  value,
  strong,
  mono,
}: {
  label: string;
  value: string;
  strong?: boolean;
  mono?: boolean;
}) {
  const empty = !value;
  return (
    <div className="flex items-start justify-between gap-4 px-4 py-2.5">
      <span className="shrink-0 text-xs font-medium text-[var(--color-text-muted)]">
        {label}
      </span>
      <span
        className={[
          "text-right text-sm",
          empty
            ? "italic text-[var(--color-text-muted)]"
            : "text-[var(--color-text-primary)]",
          strong ? "font-bold" : "",
          mono && !empty ? "font-mono text-xs" : "",
        ].join(" ")}
      >
        {value || "미입력"}
      </span>
    </div>
  );
}

"use client";

/**
 * 단체 신청 페이지
 * 일반 유저가 단체를 신청하면 pending 상태로 생성되고,
 * 관리자가 승인하면 approved로 변경된다.
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
// Phase 12 §G: 모바일 백버튼 (사용자 보고)
import { PageBackButton } from "@/components/shared/page-back-button";

export default function OrganizationApplyPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // 폼 상태
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [region, setRegion] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [applyNote, setApplyNote] = useState("");

  // 단체 신청 제출
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
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
          description: description.trim() || undefined,
          region: region.trim() || undefined,
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
              ? data.error.map((e: { message?: string }) => e?.message).filter(Boolean).join(", ")
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

  // 신청 완료 화면
  if (success) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <span className="material-symbols-outlined text-6xl text-[var(--color-success)]">
          check_circle
        </span>
        <h1 className="mt-4 text-2xl font-bold text-[var(--color-text-primary)]">
          신청이 완료되었습니다
        </h1>
        <p className="mt-2 text-[var(--color-text-secondary)]">
          관리자 검토 후 승인되면 알려드리겠습니다.
          <br />
          보통 1~2일 내에 처리됩니다.
        </p>
        <button
          onClick={() => router.push("/")}
          className="mt-6 rounded bg-[var(--color-primary)] px-6 py-3 text-sm font-semibold text-white hover:opacity-90"
        >
          홈으로 돌아가기
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      {/* Phase 12 §G — 모바일 백버튼 (lg+ hidden) */}
      <PageBackButton fallbackHref="/organizations" />
      <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
        단체 신청
      </h1>
      <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
        단체를 등록하면 시리즈와 대회를 체계적으로 관리할 수 있습니다.
      </p>

      {/* 에러 메시지 */}
      {error && (
        <div className="mt-4 rounded bg-[var(--color-error)]/10 px-4 py-3 text-sm text-[var(--color-error)]">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-6 space-y-5">
        {/* 단체 이름 (필수) */}
        <div>
          <label className="mb-1 block text-sm font-medium text-[var(--color-text-primary)]">
            단체 이름 <span className="text-[var(--color-error)]">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="예: 서울 농구 연합회"
            className="w-full rounded border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)] focus:outline-none"
            required
          />
        </div>

        {/* 소개 */}
        <div>
          <label className="mb-1 block text-sm font-medium text-[var(--color-text-primary)]">
            단체 소개
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="단체의 활동 내용, 목적 등을 간단히 소개해주세요"
            rows={3}
            className="w-full rounded border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)] focus:outline-none"
          />
        </div>

        {/* 활동 지역 */}
        <div>
          <label className="mb-1 block text-sm font-medium text-[var(--color-text-primary)]">
            활동 지역
          </label>
          <input
            type="text"
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            placeholder="예: 서울, 경기"
            className="w-full rounded border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)] focus:outline-none"
          />
        </div>

        {/* 연락 이메일 */}
        <div>
          <label className="mb-1 block text-sm font-medium text-[var(--color-text-primary)]">
            연락 이메일
          </label>
          <input
            type="email"
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
            placeholder="contact@example.com"
            className="w-full rounded border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)] focus:outline-none"
          />
        </div>

        {/* 웹사이트 */}
        <div>
          <label className="mb-1 block text-sm font-medium text-[var(--color-text-primary)]">
            웹사이트
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
            className="w-full rounded border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)] focus:outline-none"
          />
        </div>

        {/* 신청 메모 */}
        <div>
          <label className="mb-1 block text-sm font-medium text-[var(--color-text-primary)]">
            신청 메모
          </label>
          <textarea
            value={applyNote}
            onChange={(e) => setApplyNote(e.target.value)}
            placeholder="단체 등록 목적이나 관리자에게 전달하고 싶은 내용"
            rows={2}
            className="w-full rounded border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)] focus:outline-none"
          />
        </div>

        {/* 제출 버튼 */}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded bg-[var(--color-primary)] py-3 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "신청 중..." : "단체 신청"}
        </button>
      </form>
    </div>
  );
}

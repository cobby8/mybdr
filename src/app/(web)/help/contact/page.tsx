"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";

type SignalType = "inquiry" | "site_error" | "correction_request";
type SubmitState = "idle" | "submitting" | "success" | "error";

const TYPE_OPTIONS: { value: SignalType; label: string; icon: string }[] = [
  { value: "inquiry", label: "이용문의", icon: "support_agent" },
  { value: "site_error", label: "오류 신고", icon: "bug_report" },
  { value: "correction_request", label: "수정 요청", icon: "edit_note" },
];

export default function HelpContactPage() {
  const [type, setType] = useState<SignalType>("inquiry");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [pageUrl, setPageUrl] = useState("");
  const [status, setStatus] = useState<SubmitState>("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitting");
    setMessage("");

    try {
      const res = await fetch("/api/web/customer-signals", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          type,
          title,
          content,
          contactEmail,
          pageUrl,
          deviceInfo: typeof navigator !== "undefined" ? navigator.userAgent : "",
        }),
      });
      const json = (await res.json()) as { error?: string; message?: string };
      if (!res.ok) {
        setStatus("error");
        setMessage(json.error ?? "접수 중 오류가 발생했습니다.");
        return;
      }
      setStatus("success");
      setMessage(json.message ?? "접수되었습니다.");
      setTitle("");
      setContent("");
      setContactEmail("");
      setPageUrl("");
    } catch {
      setStatus("error");
      setMessage("네트워크 오류가 발생했습니다.");
    }
  }

  return (
    <div className="page">
      <div className="page__inner" style={{ maxWidth: 760 }}>
        <header className="info-hero" style={{ paddingBottom: 4 }}>
          <div className="eyebrow">도움말 · CONTACT</div>
          <h1 className="info-hero__title">문의하기</h1>
          <p style={{ color: "var(--ink-mute)", fontSize: 14, lineHeight: 1.7, marginTop: 8 }}>
            이용문의, 오류 신고, 수정 요청을 운영팀에 보낼 수 있습니다.
          </p>
        </header>

        <form className="card" onSubmit={handleSubmit} style={{ padding: 22 }}>
          <div style={{ display: "grid", gap: 18 }}>
            <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
              <legend style={{ fontSize: 12, fontWeight: 800, color: "var(--ink-soft)", marginBottom: 8 }}>
                접수 유형
              </legend>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 8 }}>
                {TYPE_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className={`btn btn--sm ${type === option.value ? "btn--primary" : ""}`}
                    onClick={() => setType(option.value)}
                    aria-pressed={type === option.value}
                    style={{ minHeight: 44, justifyContent: "center" }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 17 }}>
                      {option.icon}
                    </span>
                    {option.label}
                  </button>
                ))}
              </div>
            </fieldset>

            <label style={{ display: "grid", gap: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 800, color: "var(--ink-soft)" }}>제목</span>
              <input
                className="input"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="요약을 입력해주세요"
                minLength={2}
                maxLength={120}
                required
              />
            </label>

            <label style={{ display: "grid", gap: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 800, color: "var(--ink-soft)" }}>내용</span>
              <textarea
                className="input"
                value={content}
                onChange={(event) => setContent(event.target.value)}
                placeholder="상황을 자세히 적어주세요"
                rows={7}
                minLength={5}
                maxLength={4000}
                required
                style={{ resize: "vertical", fontFamily: "inherit", lineHeight: 1.7 }}
              />
            </label>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
              <label style={{ display: "grid", gap: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 800, color: "var(--ink-soft)" }}>회신 이메일</span>
                <input
                  className="input"
                  type="email"
                  value={contactEmail}
                  onChange={(event) => setContactEmail(event.target.value)}
                  placeholder="name@example.com"
                  maxLength={254}
                />
              </label>
              <label style={{ display: "grid", gap: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 800, color: "var(--ink-soft)" }}>관련 페이지</span>
                <input
                  className="input"
                  value={pageUrl}
                  onChange={(event) => setPageUrl(event.target.value)}
                  placeholder="/games/..."
                  maxLength={500}
                />
              </label>
            </div>

            {message && (
              <div
                role="status"
                style={{
                  border: `1px solid ${status === "error" ? "var(--danger)" : "var(--ok)"}`,
                  color: status === "error" ? "var(--danger)" : "var(--ok)",
                  borderRadius: 6,
                  padding: "10px 12px",
                  fontSize: 13,
                  fontWeight: 700,
                }}
              >
                {message}
              </div>
            )}

            <div style={{ display: "flex", gap: 8, justifyContent: "space-between" }}>
              <Link href="/help" className="btn">
                도움말로
              </Link>
              <button
                type="submit"
                className="btn btn--accent"
                disabled={status === "submitting"}
                style={{ minWidth: 132, justifyContent: "center" }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 17 }}>
                  send
                </span>
                {status === "submitting" ? "접수 중" : "접수하기"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

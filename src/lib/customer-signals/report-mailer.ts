import { after } from "next/server";
import { sendEmail } from "@/lib/utils/email";

export const CUSTOMER_SIGNAL_TYPES = [
  "inquiry",
  "site_error",
  "correction_request",
  "game_report",
  "court_report",
  "court_edit_suggestion",
] as const;

export type CustomerSignalType = (typeof CUSTOMER_SIGNAL_TYPES)[number];
export type CustomerSignalPriority = "low" | "normal" | "high" | "urgent";

export interface CustomerSignalReporter {
  id?: string | null;
  name?: string | null;
  email?: string | null;
}

export interface CustomerSignalReport {
  type: CustomerSignalType;
  title: string;
  content: string;
  priority?: CustomerSignalPriority;
  reporter?: CustomerSignalReporter;
  contactEmail?: string | null;
  sourceUrl?: string | null;
  adminUrl?: string | null;
  metadata?: Record<string, unknown>;
  createdAt?: Date;
}

interface CustomerSignalEmail {
  subject: string;
  html: string;
}

interface CustomerSignalSendResult {
  sent: boolean;
  skipped: boolean;
  messageId?: string;
  reason?: "missing_recipient";
  error?: string;
}

const TYPE_LABEL: Record<CustomerSignalType, string> = {
  inquiry: "이용문의",
  site_error: "사이트 오류",
  correction_request: "수정 요청",
  game_report: "경기 신고",
  court_report: "코트 제보",
  court_edit_suggestion: "코트 수정 제안",
};

const PRIORITY_LABEL: Record<CustomerSignalPriority, string> = {
  low: "낮음",
  normal: "보통",
  high: "높음",
  urgent: "긴급",
};

const URGENT_KEYWORDS = [
  "결제",
  "환불",
  "로그인",
  "탈퇴",
  "개인정보",
  "정산",
  "접속",
  "오류",
  "에러",
  "안됨",
];

export function inferCustomerSignalPriority(
  type: CustomerSignalType,
  text: string,
): CustomerSignalPriority {
  const haystack = text.toLowerCase();
  if (URGENT_KEYWORDS.some((keyword) => haystack.includes(keyword.toLowerCase()))) {
    return "urgent";
  }
  if (type === "site_error" || type === "game_report" || type === "court_report") {
    return "high";
  }
  return "normal";
}

export function buildCustomerSignalEmail(
  report: CustomerSignalReport,
): CustomerSignalEmail {
  const priority =
    report.priority ?? inferCustomerSignalPriority(report.type, `${report.title}\n${report.content}`);
  const createdAt = report.createdAt ?? new Date();
  const reporter = formatReporter(report.reporter, report.contactEmail);
  const sourceUrl = toAbsoluteUrl(report.sourceUrl);
  const adminUrl = toAbsoluteUrl(report.adminUrl);
  const subject = `[BDR 고객신호][${TYPE_LABEL[report.type]}][${PRIORITY_LABEL[priority]}] ${trimText(
    report.title,
    80,
  )}`;

  const rows = [
    ["유형", TYPE_LABEL[report.type]],
    ["우선순위", PRIORITY_LABEL[priority]],
    ["접수시각", createdAt.toLocaleString("ko-KR", { timeZone: "Asia/Seoul" })],
    ["작성자", reporter],
    ["접수 위치", sourceUrl ? link(sourceUrl) : "-"],
    ["관리자 확인", adminUrl ? link(adminUrl) : "-"],
  ];

  const metadataRows = Object.entries(report.metadata ?? {}).map(([key, value]) => [
    key,
    formatMetadataValue(value),
  ]);

  const htmlRows = [...rows, ...metadataRows]
    .map(
      ([label, value]) => `
        <tr>
          <th style="width:120px;text-align:left;vertical-align:top;padding:8px 10px;background:#f8fafc;border:1px solid #e5e7eb;color:#475569;font-size:13px;">${escapeHtml(label)}</th>
          <td style="padding:8px 10px;border:1px solid #e5e7eb;color:#111827;font-size:13px;line-height:1.6;">${value}</td>
        </tr>
      `,
    )
    .join("");

  return {
    subject,
    html: `
      <div style="font-family:Pretendard,Arial,sans-serif;max-width:720px;margin:0 auto;color:#111827;">
        <p style="margin:0 0 8px;color:#E31B23;font-size:12px;font-weight:800;letter-spacing:.08em;">BDR CUSTOMER SIGNAL</p>
        <h2 style="margin:0 0 18px;font-size:22px;line-height:1.35;">${escapeHtml(report.title)}</h2>
        <table style="width:100%;border-collapse:collapse;margin-bottom:18px;">${htmlRows}</table>
        <div style="padding:14px 16px;border:1px solid #e5e7eb;border-radius:6px;background:#ffffff;">
          <div style="margin-bottom:8px;color:#475569;font-size:13px;font-weight:700;">내용</div>
          <div style="white-space:pre-wrap;color:#111827;font-size:14px;line-height:1.7;">${escapeHtml(report.content)}</div>
        </div>
      </div>
    `,
  };
}

export async function sendCustomerSignalReport(
  report: CustomerSignalReport,
): Promise<CustomerSignalSendResult> {
  const to = getCustomerSignalRecipient();
  if (!to) return { sent: false, skipped: true, reason: "missing_recipient" };

  const email = buildCustomerSignalEmail(report);
  const result = await sendEmail({
    to,
    subject: email.subject,
    html: email.html,
  });

  return {
    sent: result.success,
    skipped: false,
    messageId: result.messageId,
    error: result.error,
  };
}

export function scheduleCustomerSignalReport(report: CustomerSignalReport) {
  after(async () => {
    const result = await sendCustomerSignalReport(report);
    if (!result.sent && !result.skipped) {
      console.error("[customer-signal] email report failed:", result.error ?? "unknown");
    }
    if (result.skipped) {
      console.warn("[customer-signal] email report skipped: CUSTOMER_SIGNAL_REPORT_TO missing");
    }
  });
}

function getCustomerSignalRecipient() {
  return (
    process.env.CUSTOMER_SIGNAL_REPORT_TO ??
    process.env.ADMIN_REPORT_EMAIL ??
    process.env.SUPPORT_EMAIL ??
    ""
  ).trim();
}

function formatReporter(reporter?: CustomerSignalReporter, contactEmail?: string | null) {
  const parts = [
    reporter?.name,
    reporter?.email ?? contactEmail,
    reporter?.id ? `user#${reporter.id}` : null,
  ].filter(Boolean);
  return parts.length ? escapeHtml(parts.join(" / ")) : "비로그인 또는 미확인";
}

function formatMetadataValue(value: unknown) {
  if (value == null || value === "") return "-";
  if (typeof value === "string") return escapeHtml(trimText(value, 1000));
  if (typeof value === "number" || typeof value === "boolean") return escapeHtml(String(value));
  return `<code style="white-space:pre-wrap;font-size:12px;">${escapeHtml(
    trimText(JSON.stringify(value, null, 2), 1200),
  )}</code>`;
}

function toAbsoluteUrl(value?: string | null) {
  const raw = value?.trim();
  if (!raw) return null;
  if (/^https?:\/\//i.test(raw)) return raw;
  const base = (process.env.NEXT_PUBLIC_APP_URL ?? "https://www.mybdr.kr").replace(/\/$/, "");
  return `${base}${raw.startsWith("/") ? raw : `/${raw}`}`;
}

function link(url: string) {
  const safeUrl = escapeHtml(url);
  return `<a href="${safeUrl}" style="color:#1B3C87;text-decoration:underline;">${safeUrl}</a>`;
}

function trimText(value: string, maxLength: number) {
  return value.length > maxLength ? `${value.slice(0, maxLength - 1)}...` : value;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

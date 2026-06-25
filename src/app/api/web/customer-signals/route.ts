import crypto from "crypto";
import { NextRequest } from "next/server";
import type { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { apiError, apiSuccess, validationError } from "@/lib/api/response";
import { getWebSession } from "@/lib/auth/web-session";
import { checkRateLimit, RATE_LIMITS } from "@/lib/security/rate-limit";
import { getClientIp } from "@/lib/security/get-client-ip";
import {
  CUSTOMER_SIGNAL_TYPES,
  inferCustomerSignalPriority,
  scheduleCustomerSignalReport,
  type CustomerSignalType,
} from "@/lib/customer-signals/report-mailer";

const optionalTrimmedString = (max: number) =>
  z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
    z.string().trim().max(max).optional(),
  );

const requestSchema = z.object({
  type: z.enum(CUSTOMER_SIGNAL_TYPES),
  title: z.string().trim().min(2).max(120),
  content: z.string().trim().min(5).max(4000),
  contactEmail: z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
    z.string().trim().email().max(254).optional(),
  ),
  pageUrl: optionalTrimmedString(500),
  deviceInfo: optionalTrimmedString(500),
});

const CATEGORY_BY_TYPE: Record<CustomerSignalType, string> = {
  inquiry: "inquiry",
  site_error: "site_error",
  correction_request: "correction_request",
  game_report: "report",
  court_report: "report",
  court_edit_suggestion: "correction_request",
};

const PRIORITY_SCORE = {
  low: 0,
  normal: 1,
  high: 2,
  urgent: 3,
} as const;

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const rateLimit = await checkRateLimit(`customer-signal:${ip}`, RATE_LIMITS.customerSignal);
  if (!rateLimit.allowed) {
    return apiError("요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.", 429, "RATE_LIMITED");
  }

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return apiError("잘못된 요청 형식입니다.", 400, "BAD_REQUEST");
  }

  const parsed = requestSchema.safeParse(raw);
  if (!parsed.success) return validationError(parsed.error.issues);

  const data = parsed.data;
  const session = await getWebSession();
  const userId = session ? BigInt(session.sub) : null;
  const now = new Date();
  const priority = inferCustomerSignalPriority(data.type, `${data.title}\n${data.content}`);
  const deviceInfo = data.deviceInfo ?? req.headers.get("user-agent")?.slice(0, 500) ?? null;
  const referer = req.headers.get("referer")?.slice(0, 500) ?? null;
  const sourceUrl = data.pageUrl ?? referer;

  const user = userId
    ? await prisma.user
        .findUnique({
          where: { id: userId },
          select: { id: true, nickname: true, email: true },
        })
        .catch(() => null)
    : null;

  const metadata = {
    signal_type: data.type,
    contact_email: data.contactEmail ?? null,
    page_url: sourceUrl,
    ip,
    source: "help_contact",
    logged_in: !!userId,
  };

  const suggestion = userId
    ? await prisma.suggestions.create({
        data: {
          user_id: userId,
          title: data.title,
          content: data.content,
          category: CATEGORY_BY_TYPE[data.type],
          priority: PRIORITY_SCORE[priority],
          metadata: metadata as Prisma.InputJsonValue,
          device_info: deviceInfo,
          app_version: null,
          created_at: now,
          updated_at: now,
          uuid: crypto.randomUUID(),
        },
        select: { id: true },
      })
    : null;

  scheduleCustomerSignalReport({
    type: data.type,
    title: data.title,
    content: data.content,
    priority,
    reporter: user
      ? {
          id: user.id.toString(),
          name: user.nickname,
          email: user.email,
        }
      : undefined,
    contactEmail: data.contactEmail,
    sourceUrl,
    adminUrl: suggestion ? "/admin/suggestions" : null,
    metadata: {
      ...metadata,
      stored: !!suggestion,
      suggestion_id: suggestion?.id.toString() ?? null,
      device_info: deviceInfo,
    },
    createdAt: now,
  });

  return apiSuccess(
    {
      message: "접수되었습니다. 운영자가 확인 후 필요한 경우 답변드릴게요.",
      stored: !!suggestion,
      suggestionId: suggestion?.id.toString() ?? null,
      emailReportQueued: true,
    },
    201,
  );
}

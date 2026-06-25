import { beforeEach, describe, expect, it, vi } from "vitest";

const sendEmailMock = vi.fn();

vi.mock("@/lib/utils/email", () => ({
  sendEmail: (...args: unknown[]) => sendEmailMock(...args),
}));

import {
  buildCustomerSignalEmail,
  inferCustomerSignalPriority,
  sendCustomerSignalReport,
} from "@/lib/customer-signals/report-mailer";

describe("customer signal mailer", () => {
  beforeEach(() => {
    sendEmailMock.mockReset();
    delete process.env.CUSTOMER_SIGNAL_REPORT_TO;
    delete process.env.ADMIN_REPORT_EMAIL;
    delete process.env.SUPPORT_EMAIL;
  });

  it("builds a Korean PM-style email subject and escapes html", () => {
    const email = buildCustomerSignalEmail({
      type: "site_error",
      title: "<script>결제 오류</script>",
      content: "결제 버튼을 눌렀는데 <b>실패</b>합니다.",
      reporter: { id: "7", name: "수빈", email: "subin@example.com" },
      sourceUrl: "/pricing/fail",
      createdAt: new Date("2026-06-25T03:00:00.000Z"),
    });

    expect(email.subject).toContain("[BDR 고객신호][사이트 오류][긴급]");
    expect(email.html).toContain("&lt;script&gt;결제 오류&lt;/script&gt;");
    expect(email.html).toContain("subin@example.com");
    expect(email.html).toContain("https://www.mybdr.kr/pricing/fail");
  });

  it("skips sending when no report recipient is configured", async () => {
    const result = await sendCustomerSignalReport({
      type: "inquiry",
      title: "문의",
      content: "문의 내용입니다.",
    });

    expect(result).toEqual({
      sent: false,
      skipped: true,
      reason: "missing_recipient",
    });
    expect(sendEmailMock).not.toHaveBeenCalled();
  });

  it("sends through configured customer signal recipient", async () => {
    process.env.CUSTOMER_SIGNAL_REPORT_TO = "owner@example.com";
    sendEmailMock.mockResolvedValue({ success: true, messageId: "mail-1" });

    const result = await sendCustomerSignalReport({
      type: "correction_request",
      title: "코트 정보 수정",
      content: "운영 시간이 달라졌습니다.",
    });

    expect(result).toEqual({
      sent: true,
      skipped: false,
      messageId: "mail-1",
      error: undefined,
    });
    expect(sendEmailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "owner@example.com",
        subject: expect.stringContaining("[수정 요청]"),
      }),
    );
  });

  it("escalates payment/login/error keywords", () => {
    expect(inferCustomerSignalPriority("inquiry", "로그인이 안됨")).toBe("urgent");
    expect(inferCustomerSignalPriority("site_error", "버튼 깨짐")).toBe("high");
    expect(inferCustomerSignalPriority("correction_request", "문구 수정")).toBe("normal");
  });
});

/**
 * EnrollSuccessHero — 참가신청 완료 화면 (Toss 룩) — Track B Phase4
 *
 * 왜 바꿨나(이유):
 *  시안 Apply.jsx Step4(완료)는 "입금 안내"를 완료 화면으로 흡수한다.
 *  기존엔 결제 step에 있던 입금계좌 안내가 여기로 합쳐졌다(서류 step 폐지).
 *  → 시안 ts-done / ts-bankbox 구조로 체크 아이콘 + 입금계좌 + 금액 + CTA 표시.
 *
 * 박제 정책:
 *  - status="waiting" 면 "대기 접수" 톤(warn), 아니면 "신청 완료" 톤(ok)
 *  - 입금계좌(bank_*)는 완료 화면에서 안내(결제 step 폐지로 흡수)
 *  - 아이콘 = lucide-react 직접 import(CDN injection 금지)
 *  - CTA 라우팅 운영 그대로(/games/my-games + /tournaments/${id})
 *  - 새 라우트 ❌ — page.tsx done 분기 안에서만 렌더
 */

import { Check, Clock, Copy, ArrowLeft, User } from "lucide-react";

interface EnrollSuccessHeroProps {
  // 운영 result 객체 — POST /api/web/tournaments/[id]/join 응답
  result: {
    id: number;
    status: string;
    waiting_number: number | null;
    message: string;
  };
  // 입금 안내(완료 화면으로 흡수) — bank 정보 + 금액
  bankName: string | null;
  bankAccount: string | null;
  bankHolder: string | null;
  feeText: string;
  // CTA 라우팅 — page.tsx 에서 useRouter 주입
  onMyApplications: () => void;
  onTournamentDetail: () => void;
}

export function EnrollSuccessHero({
  result,
  bankName,
  bankAccount,
  bankHolder,
  feeText,
  onMyApplications,
  onTournamentDetail,
}: EnrollSuccessHeroProps) {
  // 대기 접수 여부 — POST 응답 status 로 판정
  const isWaiting = result.status === "waiting";

  return (
    <div className="ts-card ts-done">
      {/* 체크/시계 아이콘 — 대기면 시계(warn), 완료면 체크(ok) */}
      <div className="ts-done__icon" data-tone={isWaiting ? "warn" : "ok"}>
        {isWaiting ? <Clock size={36} /> : <Check size={36} />}
      </div>

      {/* 제목 — 서버 메시지 우선, 없으면 상태별 폴백 */}
      <h2 className="ts-done__title">
        {result.message ||
          (isWaiting ? "대기 접수되었습니다" : "신청이 완료되었습니다!")}
      </h2>

      {/* 부제 — 대기 순번 또는 입금 안내 */}
      <p className="ts-done__sub">
        {isWaiting ? (
          <>
            대기 순번 <b style={{ color: "var(--warn)" }}>{result.waiting_number}번</b>
            으로 접수되었습니다.
            <br />
            아래 계좌로 참가비를 입금하시면 정원 확보 시 확정됩니다.
          </>
        ) : (
          <>
            아래 계좌로 참가비를 입금하시면
            <br />
            관리자 확인 후 확정됩니다.
          </>
        )}
      </p>

      {/* 입금 계좌 안내 — bank 정보 있을 때만 (결제 step 흡수) */}
      {bankName && (
        <div className="ts-bankbox">
          <div style={{ fontSize: 13, color: "var(--ink-mute)", marginBottom: 4 }}>
            {bankName}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span
              style={{
                fontFamily: "var(--ff-mono)",
                fontSize: 21,
                fontWeight: 800,
                color: "var(--primary)",
              }}
            >
              {bankAccount}
            </span>
            {/* 계좌번호 복사 — 운영 보존 */}
            <button
              type="button"
              className="ts-btn ts-btn--ghost ts-btn--sm"
              style={{ padding: 6, minHeight: 0 }}
              onClick={() => {
                navigator.clipboard.writeText(
                  `${bankName ?? ""} ${bankAccount ?? ""}`,
                );
              }}
              aria-label="계좌번호 복사"
            >
              <Copy size={16} />
            </button>
          </div>
          <div style={{ fontSize: 13, color: "var(--ink-mute)", marginTop: 4 }}>
            예금주 {bankHolder}
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: 16,
              paddingTop: 16,
              borderTop: "1px solid var(--border)",
            }}
          >
            <span style={{ fontSize: 14, color: "var(--ink-soft)" }}>입금 금액</span>
            <span style={{ fontSize: 20, fontWeight: 800, color: "var(--ink)" }}>
              {feeText}
            </span>
          </div>
          <div
            style={{
              fontSize: 12,
              color: "var(--ink-dim)",
              marginTop: 12,
              lineHeight: 1.5,
            }}
          >
            입금자명에 <b>팀명_주장닉네임</b> 형식으로 입금해 주세요. 입금 후
            운영팀이 확인하면 출전이 확정됩니다.
          </div>
        </div>
      )}

      {/* CTA 2개 — 운영 라우팅 보존 */}
      <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
        <button
          type="button"
          className="ts-btn ts-btn--secondary"
          style={{ flex: 1 }}
          onClick={onTournamentDetail}
        >
          <ArrowLeft size={16} /> 대회 상세
        </button>
        <button
          type="button"
          className="ts-btn ts-btn--primary"
          style={{ flex: 2 }}
          onClick={onMyApplications}
        >
          <User size={16} /> 내 신청 내역 보기
        </button>
      </div>
    </div>
  );
}

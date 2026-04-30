import Link from "next/link";

export const metadata = {
  title: "개인정보 처리방침 | MyBDR",
  description: "MyBDR 개인정보 처리방침",
};

// 시안 v2(1) Privacy.jsx 스타일 박제 — eyebrow + breadcrumb + v2.1 날짜 + 카드 컨테이너.
// 본문 10조 + 표 2개 + 부칙은 기존 그대로 보존.
export default function PrivacyPage() {
  return (
    <div className="page mx-auto" style={{ maxWidth: 880 }}>
      {/* breadcrumb (시안 톤) */}
      <div style={{ fontSize: 12, color: "var(--ink-mute)", marginBottom: 10 }}>
        <Link href="/" style={{ color: "var(--ink-mute)" }}>홈</Link>
        {" › "}
        <span style={{ color: "var(--color-text-primary)" }}>개인정보처리방침</span>
      </div>

      {/* eyebrow + 제목 + v2.1 날짜 */}
      <div className="eyebrow">법적 고지 · PRIVACY POLICY</div>
      <h1
        style={{
          margin: "6px 0 6px",
          fontSize: 30,
          fontWeight: 800,
          letterSpacing: "-0.02em",
        }}
      >
        개인정보처리방침
      </h1>
      <div
        style={{
          fontSize: 13,
          color: "var(--ink-mute)",
          marginBottom: 24,
          fontFamily: "var(--ff-mono)",
        }}
      >
        시행 · 2025-01-01 · 최종 개정 · 2026-03-01 · v2.1
      </div>

      {/* 본문 카드 컨테이너 */}
      <div className="card" style={{ padding: "24px 28px", marginBottom: 18 }}>
        {/* 머리말 (시안의 BDR 리그 사무국 안내 톤) */}
        <p style={{ margin: "0 0 18px", color: "var(--ink-soft)", fontSize: 14, lineHeight: 1.75 }}>
          BDR(이하 &quot;회사&quot;)은 「개인정보 보호법」을 준수하여 이용자의 개인정보 보호 및 권익을 보호하고,
          개인정보와 관련한 고충을 원활하게 처리할 수 있도록 다음과 같은 처리방침을 두고 있습니다.
        </p>

        <div className="space-y-6 text-sm leading-relaxed text-[var(--color-text-secondary)]">

          {/* 제1조 */}
          <section>
            <h2 className="mb-3 text-base font-semibold text-[var(--color-text-primary)]">제1조 (개인정보의 처리 목적)</h2>
            <p className="mb-2">회사는 다음의 목적으로 개인정보를 처리합니다. 처리하는 개인정보는 목적 이외의 용도로 이용되지 않습니다.</p>
            <ul className="space-y-1 pl-4">
              <li>• 회원 가입 및 관리 (본인 확인, 부정 이용 방지)</li>
              <li>• 서비스 제공 (경기·대회 매칭, 팀 관리, 알림 발송)</li>
              <li>• 결제 처리 및 구독 관리</li>
              <li>• 서비스 개선 및 통계 분석</li>
              <li>• 고객 문의 응대 및 불만 처리</li>
            </ul>
          </section>

          {/* 제2조 — 표 1 (수집 항목) */}
          <section>
            <h2 className="mb-3 text-base font-semibold text-[var(--color-text-primary)]">제2조 (처리하는 개인정보 항목)</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-[var(--color-border)] text-left text-[var(--color-text-muted)]">
                    <th className="pb-2 pr-4 font-medium">구분</th>
                    <th className="pb-2 pr-4 font-medium">항목</th>
                    <th className="pb-2 font-medium">수집 방법</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border-subtle)]">
                  <tr>
                    <td className="py-2 pr-4 font-medium text-[var(--color-text-primary)]">필수</td>
                    <td className="py-2 pr-4">이메일, 닉네임, 이름</td>
                    <td className="py-2">회원가입 / OAuth</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4 font-medium text-[var(--color-text-primary)]">선택</td>
                    <td className="py-2 pr-4">전화번호, 포지션, 지역, 프로필 사진</td>
                    <td className="py-2">프로필 등록</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4 font-medium text-[var(--color-text-primary)]">자동 수집</td>
                    <td className="py-2 pr-4">IP 주소, 접속 기기·브라우저 정보, 서비스 이용 기록</td>
                    <td className="py-2">서비스 이용 시</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4 font-medium text-[var(--color-text-primary)]">결제</td>
                    <td className="py-2 pr-4">결제 수단 정보 (토스페이먼츠 위탁 처리)</td>
                    <td className="py-2">유료 결제 시</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* 제3조 */}
          <section>
            <h2 className="mb-3 text-base font-semibold text-[var(--color-text-primary)]">제3조 (개인정보의 보유 및 이용 기간)</h2>
            <ul className="space-y-2">
              <li>
                <span className="font-medium">회원 탈퇴 시</span>: 즉시 파기 (단, 관련 법령에 따라
                일정 기간 보존이 필요한 정보는 해당 기간 동안 보관)
              </li>
              <li>
                <span className="font-medium">전자상거래 기록</span>: 결제·계약 기록 5년 보관
                (전자상거래 등에서의 소비자 보호에 관한 법률)
              </li>
              <li>
                <span className="font-medium">접속 로그</span>: 3개월 보관 (통신비밀보호법)
              </li>
            </ul>
          </section>

          {/* 제4조 */}
          <section>
            <h2 className="mb-3 text-base font-semibold text-[var(--color-text-primary)]">제4조 (개인정보의 제3자 제공)</h2>
            <p className="mb-2">
              회사는 원칙적으로 이용자의 개인정보를 제3자에게 제공하지 않습니다. 다만, 아래의 경우는 예외입니다.
            </p>
            <ul className="space-y-1 pl-4">
              <li>• 이용자가 사전에 동의한 경우</li>
              <li>• 법령의 규정에 의하거나 수사 기관의 요청이 있는 경우</li>
              <li>
                • 경기·대회 신청 시, 주최자에게 신청자의 닉네임·포지션·지역이 전달될 수 있습니다.
                (서비스 제공을 위한 필요 범위 내)
              </li>
            </ul>
          </section>

          {/* 제5조 — 표 2 (수탁업체) */}
          <section>
            <h2 className="mb-3 text-base font-semibold text-[var(--color-text-primary)]">제5조 (개인정보 처리 위탁)</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-[var(--color-border)] text-left text-[var(--color-text-muted)]">
                    <th className="pb-2 pr-4 font-medium">수탁업체</th>
                    <th className="pb-2 pr-4 font-medium">위탁 업무</th>
                    <th className="pb-2 font-medium">보유 기간</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border-subtle)]">
                  <tr>
                    <td className="py-2 pr-4">토스페이먼츠</td>
                    <td className="py-2 pr-4">결제 처리</td>
                    <td className="py-2">계약 종료 시까지</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4">Supabase (PostgreSQL)</td>
                    <td className="py-2 pr-4">데이터 저장·관리</td>
                    <td className="py-2">계약 종료 시까지</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4">Vercel</td>
                    <td className="py-2 pr-4">서비스 호스팅</td>
                    <td className="py-2">계약 종료 시까지</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* 제6조 */}
          <section>
            <h2 className="mb-3 text-base font-semibold text-[var(--color-text-primary)]">제6조 (이용자의 권리)</h2>
            <p className="mb-2">이용자는 언제든지 다음의 권리를 행사할 수 있습니다.</p>
            <ul className="space-y-1 pl-4">
              <li>• 개인정보 열람·정정·삭제 요청</li>
              <li>• 처리 정지 요청</li>
              <li>• 동의 철회 (회원 탈퇴)</li>
            </ul>
            <p className="mt-2">
              권리 행사는 서비스 내 프로필 설정 또는{" "}
              <a href="mailto:bdr.wonyoung@gmail.com" className="text-[var(--color-primary)] underline underline-offset-2">
                bdr.wonyoung@gmail.com
              </a>
              으로 요청하시면 지체 없이 처리합니다.
            </p>
          </section>

          {/* 제7조 */}
          <section>
            <h2 className="mb-3 text-base font-semibold text-[var(--color-text-primary)]">제7조 (쿠키의 사용)</h2>
            <ul className="space-y-2">
              <li>
                ① 회사는 로그인 세션 유지 및 서비스 제공을 위해 쿠키를 사용합니다.
              </li>
              <li>
                ② 이용자는 브라우저 설정을 통해 쿠키 허용 여부를 선택할 수 있습니다. 단, 쿠키를 차단하면
                로그인 등 일부 서비스 이용이 제한될 수 있습니다.
              </li>
            </ul>
          </section>

          {/* 제8조 */}
          <section>
            <h2 className="mb-3 text-base font-semibold text-[var(--color-text-primary)]">제8조 (개인정보의 파기)</h2>
            <p>
              회사는 개인정보 보유 기간의 경과, 처리 목적 달성 등 개인정보가 불필요하게 된 경우 지체 없이
              파기합니다. 전자적 파일은 복구 불가능한 방법으로 영구 삭제하고, 종이 서류는 분쇄기로 분쇄합니다.
            </p>
          </section>

          {/* 제9조 */}
          <section>
            <h2 className="mb-3 text-base font-semibold text-[var(--color-text-primary)]">제9조 (개인정보 보호책임자)</h2>
            <div
              style={{
                padding: "14px 16px",
                background: "var(--bg-alt)",
                borderRadius: "var(--radius-chip)",
              }}
            >
              <p className="font-medium text-[var(--color-text-primary)]">개인정보 보호책임자</p>
              <ul className="mt-2 space-y-1 text-[var(--color-text-muted)]">
                <li>성명: BDR 운영팀</li>
                <li>
                  이메일:{" "}
                  <a href="mailto:bdr.wonyoung@gmail.com" className="text-[var(--color-primary)]">
                    bdr.wonyoung@gmail.com
                  </a>
                </li>
              </ul>
              <p className="mt-2 text-xs text-[var(--color-text-muted)]">
                개인정보 관련 문의, 침해 신고, 불만 처리 등은 위 이메일로 접수하시기 바랍니다.
              </p>
            </div>
          </section>

          {/* 제10조 */}
          <section>
            <h2 className="mb-3 text-base font-semibold text-[var(--color-text-primary)]">제10조 (개인정보 침해 신고)</h2>
            <p className="mb-2">이용자는 개인정보 침해로 인한 구제를 받기 위하여 아래 기관에 신고할 수 있습니다.</p>
            <ul className="space-y-1 pl-4 text-[var(--color-text-muted)]">
              <li>• 개인정보 분쟁조정위원회: <span className="text-[var(--color-text-primary)]">www.kopico.go.kr / 1833-6972</span></li>
              <li>• 개인정보 침해신고센터: <span className="text-[var(--color-text-primary)]">privacy.kisa.or.kr / 118</span></li>
              <li>• 대검찰청 사이버수사과: <span className="text-[var(--color-text-primary)]">www.spo.go.kr / 1301</span></li>
              <li>• 경찰청 사이버수사국: <span className="text-[var(--color-text-primary)]">ecrm.cyber.go.kr / 182</span></li>
            </ul>
          </section>

          {/* 부칙 */}
          <section>
            <h2 className="mb-2 text-base font-semibold text-[var(--color-text-primary)]">부칙</h2>
            <p>이 방침은 2026년 3월 1일부터 시행합니다.</p>
          </section>

        </div>
      </div>

      {/* 하단 링크 */}
      <div className="mt-10 flex items-center gap-4 border-t border-[var(--color-border)] pt-6 text-sm text-[var(--color-text-muted)]">
        <Link href="/terms" className="hover:text-[var(--color-text-muted)]">서비스 이용약관</Link>
        <span>·</span>
        <a href="mailto:bdr.wonyoung@gmail.com" className="hover:text-[var(--color-text-muted)]">문의: bdr.wonyoung@gmail.com</a>
        <span>·</span>
        <Link href="/" className="hover:text-[var(--color-text-muted)]">홈으로</Link>
      </div>
    </div>
  );
}

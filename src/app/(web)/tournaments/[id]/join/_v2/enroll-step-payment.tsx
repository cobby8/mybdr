/**
 * EnrollStepPayment — UA3 B3 결제 step 박제 (옵션 B: bank 단일)
 *
 * 왜 이 컴포넌트가 있는가:
 *  운영 page.tsx 의 결제 step (stage === "pay" / line 1280~1473) 이
 *  inline 250+ LOC 로 작성되어 가독성이 떨어짐. 본 PR 박제 범위인
 *  시안 te-pay / te-bill / te-bank / te-pay__note / te-method 클래스로
 *  시각만 갱신하면서 페이지에서 분리.
 *
 * 박제 정책 (옵션 B / 의뢰서 §4 사용자 결재):
 *  - bank 단일 결제수단만 노출 (manual / card 옵션 박제 ❌ — Phase B 별 PR)
 *  - 시안 te-method.is-on 형식으로 "계좌이체" 한 건만 always active
 *  - 약관 동의 (대회 규정 / 미디어) 운영 보존 — input 시각만 시안 톤 정렬
 *  - API/payment_status 변경 ❌
 *
 * 운영 데이터 매핑:
 *  - tournament.bank_name / bank_account / bank_holder → te-bank 카드
 *  - selectedTeam.name / managerName / managerPhone / category / division /
 *    selectedRosterCount / feeForSelected → te-bill 명세
 *  - tournament.fee_notes → te-bank__note 보조 안내
 *  - agreeRules / agreeMedia → 약관 동의 (제출 활성화 게이트)
 */

interface EnrollStepPaymentProps {
  // 대회 정보 — bank_*, fee_notes 만 사용
  tournament: {
    name: string;
    bank_name: string | null;
    bank_account: string | null;
    bank_holder: string | null;
    fee_notes: string | null;
  };
  // 선택된 팀 (요약 카드용)
  selectedTeam: { name: string } | null;
  // 대표자 정보
  managerName: string;
  managerPhone: string;
  // 부문 / 디비전 (hasCategories=true 시만 의미)
  selectedCategory: string;
  selectedDivision: string;
  // 로스터
  selectedRosterCount: number;
  // 최종 참가비 (null 가능 — "무료" 표시)
  feeForSelected: number | null;
  // 약관 동의 상태
  agreeRules: boolean;
  agreeMedia: boolean;
  // 약관 toggle 콜백
  onChangeAgreeRules: (v: boolean) => void;
  onChangeAgreeMedia: (v: boolean) => void;
}

// 금액 포맷 헬퍼 — page.tsx 의 formatWon 과 동일 로직 (의존성 0)
function formatWon(n: number | null | undefined): string {
  if (!n) return "무료";
  return `₩${Number(n).toLocaleString()}`;
}

export function EnrollStepPayment({
  tournament,
  selectedTeam,
  managerName,
  managerPhone,
  selectedCategory,
  selectedDivision,
  selectedRosterCount,
  feeForSelected,
  agreeRules,
  agreeMedia,
  onChangeAgreeRules,
  onChangeAgreeMedia,
}: EnrollStepPaymentProps) {
  // 헤더 텍스트 + 안내 — 운영 보존 (page.tsx L1282~1293 동일 문구)
  return (
    <div>
      <h2 style={{ margin: "0 0 4px", fontSize: 18, fontWeight: 700 }}>
        결제 · 신청 확인
      </h2>
      <p
        style={{
          margin: "0 0 20px",
          fontSize: 13,
          color: "var(--ink-mute)",
        }}
      >
        참가비 결제는 입금 후 운영팀이 확인합니다. (PG 결제는 추후 도입)
      </p>

      {/* ============= te-pay 2-column grid (시안 L65~) ============= */}
      <div className="te-pay">
        {/* ---------- LEFT col: 결제수단 + 입금 계좌 ---------- */}
        <div className="te-pay__col">
          <h3 className="te-h3">결제 수단</h3>

          {/* 시안 te-methods — bank 단일 옵션 (옵션 B) */}
          <div className="te-methods">
            {/* 계좌이체 = always active (옵션 B 룰) */}
            <label className="te-method is-on">
              <input type="radio" name="pay" checked readOnly />
              <span className="te-method__ico ico material-symbols-outlined">
                account_balance
              </span>
              <span className="te-method__txt">
                <span className="te-method__label">계좌이체</span>
                <span className="te-method__desc">운영팀 계좌로 입금 (수동 확인)</span>
              </span>
              <span className="te-method__check ico material-symbols-outlined">
                check_circle
              </span>
            </label>
          </div>

          {/* 운영팀 입금 계좌 — bank_name 있을 때만 노출 (운영 보존) */}
          {tournament.bank_name && (
            <div className="te-bank">
              <div className="te-bank__title">운영팀 입금 계좌</div>
              <div className="te-bank__row">
                <span>은행</span>
                <b>{tournament.bank_name}</b>
              </div>
              <div className="te-bank__row">
                <span>계좌</span>
                <b>{tournament.bank_account}</b>
              </div>
              <div className="te-bank__row">
                <span>예금주</span>
                <b>{tournament.bank_holder}</b>
              </div>
              <div className="te-bank__note">
                입금자명에 <b>팀명_주장닉네임</b> 형식으로 입금해 주세요.
                {tournament.fee_notes && (
                  <>
                    <br />
                    {tournament.fee_notes}
                  </>
                )}
              </div>
              {/* 계좌번호 복사 버튼 — 운영 보존 (page.tsx L1410~1421) */}
              <button
                type="button"
                className="btn btn--sm"
                style={{ marginTop: 10 }}
                onClick={() => {
                  navigator.clipboard.writeText(
                    `${tournament.bank_name ?? ""} ${tournament.bank_account ?? ""}`,
                  );
                }}
              >
                계좌번호 복사
              </button>
            </div>
          )}
        </div>

        {/* ---------- RIGHT col: 결제 금액 명세 ---------- */}
        <div className="te-pay__col">
          <h3 className="te-h3">결제 금액</h3>

          {/* 신청 요약 (운영 보존) — 시안 결제 영수증 */}
          <div className="te-bill">
            <div className="te-bill__row">
              <span>참가팀</span>
              <b>{selectedTeam?.name ?? "—"}</b>
            </div>
            <div className="te-bill__row">
              <span>대표자</span>
              <b>
                {managerName}
                {managerPhone ? ` (${managerPhone})` : ""}
              </b>
            </div>
            {/* hasCategories=true 일 때만 노출 — 운영 분기 보존 */}
            {selectedCategory && (
              <div className="te-bill__row">
                <span>부문 / 디비전</span>
                <b>
                  {selectedCategory} · {selectedDivision || "—"}
                </b>
              </div>
            )}
            <div className="te-bill__row">
              <span>로스터</span>
              <b>{selectedRosterCount}명</b>
            </div>

            {/* 합계 — 참가비만 (운영 보험료 데이터 없음) */}
            <div className="te-bill__row te-bill__row--total">
              <span>총 참가비</span>
              <span>{formatWon(feeForSelected)}</span>
            </div>
          </div>

          {/* 안내 콜아웃 — 시안 te-pay__note (cafe-blue 톤) */}
          <div className="te-pay__note">
            <span className="ico material-symbols-outlined">info</span>
            <div>
              <b>결제 완료 후 운영자 승인 대기.</b>
              <br />
              승인 결과는 알림으로 전달됩니다. 입금 후 24시간 내 자동 확인됩니다.
            </div>
          </div>
        </div>
      </div>

      {/* ============= 약관 동의 (운영 보존 — page.tsx L1437~1471) =============
          - 5/4-step adaptive 통과 후 결제 step 안에서 약관 동의가 제출 활성화 게이트
          - 두 체크박스 모두 체크되어야 page.tsx 의 "참가신청" 버튼 활성화
          - 시안 te-pay 와 별 영역 (시안에는 미존재 — 운영 고유 흐름 보존)
      */}
      <div
        style={{
          marginTop: 20,
          paddingTop: 16,
          borderTop: "1px solid var(--border)",
        }}
      >
        <label
          style={{
            display: "flex",
            gap: 8,
            alignItems: "flex-start",
            fontSize: 13,
            marginBottom: 8,
            cursor: "pointer",
          }}
        >
          <input
            type="checkbox"
            checked={agreeRules}
            onChange={(e) => onChangeAgreeRules(e.target.checked)}
            style={{ marginTop: 3, accentColor: "var(--accent)" }}
          />
          <span>대회 규정·환불 정책에 동의합니다</span>
        </label>
        <label
          style={{
            display: "flex",
            gap: 8,
            alignItems: "flex-start",
            fontSize: 13,
            cursor: "pointer",
          }}
        >
          <input
            type="checkbox"
            checked={agreeMedia}
            onChange={(e) => onChangeAgreeMedia(e.target.checked)}
            style={{ marginTop: 3, accentColor: "var(--accent)" }}
          />
          <span>경기 촬영·중계·사진 공개에 동의합니다</span>
        </label>
      </div>
    </div>
  );
}

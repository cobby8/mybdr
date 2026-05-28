/**
 * EnrollSuccessHero — UA3 사후 안내 hero 박제
 *
 * 왜 이 컴포넌트가 있는가:
 *  운영 page.tsx 의 done 분기 (L408~524) 가 inline 100+ LOC.
 *  시안 te-success__* 클래스로 시각만 갱신.
 *  signature: page.tsx 가 done=true + result 도착 시 분기 → 본 컴포넌트만 렌더.
 *
 * 박제 정책:
 *  - 시안 te-success 구조 (체크 아이콘 + eyebrow + h1 + sub + 3 STEPS + CTA 2개)
 *  - 운영 result 데이터 보존 (status / waiting_number / message)
 *  - bank 안내 운영 보존 → 결제 step 에서 이미 노출됐으므로 여기서는 미반복
 *  - CTA 라우팅 운영 그대로 (/games/my-games + /tournaments/${id})
 *  - 새 라우트 ❌ (의뢰서 §6 룰)
 *
 * 시안 ↔ 운영 매핑:
 *  - 시안 "신청이 접수되었습니다" → 운영 result.message (서버 응답 그대로)
 *  - 시안 sub "관리자 승인 시 알림" → 운영 waiting_number 가드 + 기본 안내
 *  - 시안 3 STEPS (서류 검토 / 결제 확인 / 참가 확정) → 시안 카피 그대로
 *  - 시안 CTA "내 참가 현황 보기" → 운영 /games/my-games 로 라우팅
 *  - 시안 CTA "대회 상세로" → 운영 /tournaments/${id} 로 라우팅
 */

interface EnrollSuccessHeroProps {
  // 운영 result 객체 — POST /api/web/tournaments/[id]/join 응답
  result: {
    id: number;
    status: string;
    waiting_number: number | null;
    message: string;
  };
  // CTA 라우팅 — page.tsx 에서 useRouter 주입
  onMyApplications: () => void;
  onTournamentDetail: () => void;
}

export function EnrollSuccessHero({
  result,
  onMyApplications,
  onTournamentDetail,
}: EnrollSuccessHeroProps) {
  return (
    <div className="te-success">
      {/* 체크 아이콘 — 72×72 정사각형 50% 원 (9999px 회피) */}
      <div className="te-success__icon">
        <span className="ico material-symbols-outlined">check_circle</span>
      </div>

      {/* eyebrow — 시안 ENROLLMENT COMPLETE */}
      <div className="te-success__eyebrow">ENROLLMENT COMPLETE</div>

      {/* h1 — 운영 result.message (서버 응답 우선) 또는 시안 폴백 */}
      <h1 className="te-success__title">
        {result.message || "신청이 접수되었습니다"}
      </h1>

      {/* sub — 운영 status 분기 (대기 / 즉시승인 / 검토 대기) */}
      <p className="te-success__sub">
        {result.status === "waiting" ? (
          <>
            대기 순번 <b>{result.waiting_number}번</b>으로 접수되었습니다. 정원
            확보 시 알림으로 안내드립니다.
          </>
        ) : result.status === "approved" ? (
          <>
            <b>참가가 확정되었습니다.</b> 결제 완료 후 운영팀이 확인하면 출전이
            확정됩니다.
          </>
        ) : (
          <>
            관리자 승인 시 알림과 쪽지로 알려드립니다. 결제는 <b>3일 내</b> 처리해
            주세요.
          </>
        )}
      </p>

      {/* 3 STEPS — 시안 te-success__steps (서류 검토 → 결제 확인 → 참가 확정) */}
      <ol className="te-success__steps">
        <li>
          <span className="te-success__step-n">1</span>
          <div>
            <div className="te-success__step-t">서류 검토 (24시간 이내)</div>
            <div className="te-success__step-s">
              운영자가 로스터 / 보험증서 확인
            </div>
          </div>
        </li>
        <li>
          <span className="te-success__step-n">2</span>
          <div>
            <div className="te-success__step-t">결제 확인</div>
            <div className="te-success__step-s">
              계좌이체 입금 후 운영팀 수동 확인
            </div>
          </div>
        </li>
        <li>
          <span className="te-success__step-n">3</span>
          <div>
            <div className="te-success__step-t">참가 확정 알림</div>
            <div className="te-success__step-s">
              조 추첨 + 대진표 공개 시 자동 알림
            </div>
          </div>
        </li>
      </ol>

      {/* CTA 2개 — 운영 라우팅 보존 */}
      <div className="te-success__cta">
        <button
          type="button"
          className="btn btn--accent"
          onClick={onMyApplications}
        >
          <span className="ico material-symbols-outlined">person</span>
          내 신청 내역 보기
        </button>
        <button type="button" className="btn" onClick={onTournamentDetail}>
          <span className="ico material-symbols-outlined">arrow_back</span>
          대회 상세로
        </button>
      </div>
    </div>
  );
}

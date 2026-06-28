// ============================================================
// referee-console/_soon.tsx — 미배선 화면 공용 "준비 중" placeholder (R6-B)
//   ★백엔드 부재/후속/R6-C 인 nav 항목(배정캘린더/신청관리/배정요청/평가/등급/알림)이
//     데드링크가 되지 않도록 라우트는 존재시키되 진입 시 정직한 "준비 중" 안내만 표시.
//   mock 데이터 박제 금지 — 정본의 데모 행은 절대 박제하지 않는다.
// ============================================================

import { PageHead, Empty } from "@/components/admin-v2";

export function RefereeSoon({
  title,
  sub,
  icon = "inbox",
  desc,
}: {
  title: string;
  sub: string;
  icon?: string;
  desc: string;
}) {
  return (
    <div>
      <PageHead eyebrow="심판 콘솔" title={title} sub={sub} />
      <Empty icon={icon} title={`${title}은(는) 준비 중입니다`} desc={desc} />
    </div>
  );
}

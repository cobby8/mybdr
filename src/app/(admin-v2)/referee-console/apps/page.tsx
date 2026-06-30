// referee-console/apps — 신청 관리 (컷오버 4-5 ③-B)
//   협회 관리자가 받은 배정 신청을 상태별로 모아 승인/거절하는 inbox.
//   thin 서버 컴포넌트 → 클라 콘솔(_apps) 마운트. 데이터/권한은 layout 게이트 + API 협회게이트.
import { AppsConsole } from "./_apps";

export const dynamic = "force-dynamic";

export default function RefereeAppsPage() {
  return <AppsConsole />;
}

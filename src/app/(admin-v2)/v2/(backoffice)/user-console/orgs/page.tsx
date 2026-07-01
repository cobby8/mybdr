// ============================================================
// user-console/orgs/page.tsx — 유저 콘솔 단체 탭 서브라우트 (/v2/user-console/orgs)
//   레일 "단체" 클릭 시 진입. fetchUserConsoleData 재사용 + initialTab="orgs".
//   백엔드/API/Prisma 쿼리 0변경 — _data.ts 공용 페치 재사용.
//   단체 인증 처리 (approve/reject): _detail.tsx OrgDetail + adminFetch 기존 연결 유지.
// ============================================================

import { getWebSession } from "@/lib/auth/web-session";
import { updateUserStatusAction } from "@/app/actions/admin-users";
import { fetchUserConsoleData } from "../_data";
import { UserConsole } from "../_console";

export const dynamic = "force-dynamic";

export default async function AdminV2UserOrgs() {
  const session = await getWebSession();
  const { userData, teamData, orgData } = await fetchUserConsoleData();

  return (
    <UserConsole
      users={userData}
      teams={teamData}
      orgs={orgData}
      currentUserId={session?.sub ?? null}
      suspendAction={updateUserStatusAction}
      initialTab="orgs"
    />
  );
}

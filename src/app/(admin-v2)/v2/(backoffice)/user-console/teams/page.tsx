// ============================================================
// user-console/teams/page.tsx — 유저 콘솔 팀 탭 서브라우트 (/v2/user-console/teams)
//   레일 "팀" 클릭 시 진입. fetchUserConsoleData 재사용 + initialTab="teams".
//   백엔드/API/Prisma 쿼리 0변경 — _data.ts 공용 페치 재사용.
// ============================================================

import { getWebSession } from "@/lib/auth/web-session";
import { updateUserStatusAction } from "@/app/actions/admin-users";
import { fetchUserConsoleData } from "../_data";
import { UserConsole } from "../_console";

export const dynamic = "force-dynamic";

export default async function AdminV2UserTeams() {
  const session = await getWebSession();
  const { userData, teamData, orgData } = await fetchUserConsoleData();

  return (
    <UserConsole
      users={userData}
      teams={teamData}
      orgs={orgData}
      currentUserId={session?.sub ?? null}
      suspendAction={updateUserStatusAction}
      initialTab="teams"
    />
  );
}

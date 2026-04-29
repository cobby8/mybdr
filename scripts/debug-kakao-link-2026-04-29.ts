/**
 * 2026-04-29 디버깅 스크립트 — 김병곤 사용자 카카오 OAuth 연결 후 루나틱 팀 분리 현상
 * 실행: npx tsx scripts/debug-kakao-link-2026-04-29.ts
 * 읽기 전용. dev DB 한정.
 */
import { prisma } from "@/lib/db/prisma";

async function main() {
  console.log("=== 1) '김병곤' 관련 user 전부 ===");
  const users = await prisma.user.findMany({
    where: {
      OR: [
        { name: { contains: "김병곤" } },
        { nickname: { contains: "김병곤" } },
      ],
    },
    select: {
      id: true,
      name: true,
      nickname: true,
      email: true,
      phone: true,
      provider: true,
      uid: true,
      profile_image_url: true,
      status: true,
      createdAt: true,
      last_login_at: true,
    },
    orderBy: { createdAt: "asc" },
  });
  console.log(JSON.stringify(users.map((u) => ({ ...u, id: u.id.toString() })), null, 2));

  console.log("\n=== 2) '루나틱' 팀 + captain/manager 정보 ===");
  const teams = await prisma.team.findMany({
    where: { name: { contains: "루나틱" } },
    select: {
      id: true,
      name: true,
      captainId: true,
      manager_id: true,
      status: true,
      createdAt: true,
      users_teams_captain_idTousers: {
        select: { id: true, name: true, email: true, phone: true, provider: true, uid: true },
      },
      users_teams_manager_idTousers: {
        select: { id: true, name: true, email: true, phone: true, provider: true, uid: true },
      },
    },
  });
  console.log(JSON.stringify(
    teams.map((t) => ({
      ...t,
      id: t.id.toString(),
      captainId: t.captainId.toString(),
      manager_id: t.manager_id?.toString() ?? null,
      users_teams_captain_idTousers: t.users_teams_captain_idTousers
        ? { ...t.users_teams_captain_idTousers, id: t.users_teams_captain_idTousers.id.toString() }
        : null,
      users_teams_manager_idTousers: t.users_teams_manager_idTousers
        ? { ...t.users_teams_manager_idTousers, id: t.users_teams_manager_idTousers.id.toString() }
        : null,
    })),
    null,
    2,
  ));

  console.log("\n=== 3) 김병곤 user들이 captain/manager 또는 멤버로 속한 team 모두 ===");
  const userIds = users.map((u) => u.id);
  if (userIds.length > 0) {
    const ownedTeams = await prisma.team.findMany({
      where: {
        OR: [
          { captainId: { in: userIds } },
          { manager_id: { in: userIds } },
        ],
      },
      select: { id: true, name: true, captainId: true, manager_id: true, status: true },
    });
    console.log("captain/manager로 소유한 팀:");
    console.log(JSON.stringify(
      ownedTeams.map((t) => ({
        ...t,
        id: t.id.toString(),
        captainId: t.captainId.toString(),
        manager_id: t.manager_id?.toString() ?? null,
      })),
      null,
      2,
    ));

    const memberRows = await prisma.teamMember.findMany({
      where: { userId: { in: userIds } },
      select: { id: true, teamId: true, userId: true, role: true, status: true },
    });
    console.log("team_members 가입 현황:");
    console.log(JSON.stringify(
      memberRows.map((m) => ({
        ...m,
        id: m.id.toString(),
        teamId: m.teamId.toString(),
        userId: m.userId.toString(),
      })),
      null,
      2,
    ));
  }

  console.log("\n=== 4) 같은 phone/email로 매칭되는 user 중복 검사 ===");
  for (const u of users) {
    if (u.phone) {
      const samePhone = await prisma.user.findMany({
        where: { phone: u.phone },
        select: { id: true, name: true, email: true, provider: true },
      });
      if (samePhone.length > 1) {
        console.log(`phone=${u.phone} 공유 user ${samePhone.length}명:`,
          JSON.stringify(samePhone.map((s) => ({ ...s, id: s.id.toString() }))));
      }
    }
    if (u.email && !u.email.endsWith("@oauth.local") && !u.email.endsWith("@kakao.local")) {
      const sameEmail = await prisma.user.findMany({
        where: { email: u.email },
        select: { id: true, name: true, email: true, provider: true },
      });
      if (sameEmail.length > 1) {
        console.log(`email=${u.email} 공유 user ${sameEmail.length}명:`,
          JSON.stringify(sameEmail.map((s) => ({ ...s, id: s.id.toString() }))));
      }
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });

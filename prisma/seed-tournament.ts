/**
 * 전국 최강전 대회 시드 스크립트
 *
 * 실행 방법: npx tsx prisma/seed-tournament.ts
 *
 * 이 스크립트는 다음을 생성합니다:
 * 1. 대회 1건 ("전국 최강전")
 * 2. 팀 8개 (라이징이글스 + 풀리그 7팀) — 이미 존재하면 스킵
 * 3. tournament_teams 8건 — 대회에 팀 등록
 * 4. 방송경기 9경기 (라이징이글스 vs 각 팀)
 * 5. 풀리그 21경기 (7팀 리그, 4일간 진행)
 */

import { PrismaClient } from "@prisma/client";
import { randomUUID } from "crypto";

const prisma = new PrismaClient();

// ──────────────────────────────────────────────
// 대회 운영자 ID (실제 DB에 존재하는 유저 ID 필요)
// 실행 전 본인 계정의 user ID로 변경하세요
// ──────────────────────────────────────────────
let ORGANIZER_ID: bigint; // DB에서 자동 조회

// ──────────────────────────────────────────────
// 팀 정보 (8팀: 라이징이글스 + 풀리그 7팀)
// color는 팀 고유색상, slug는 URL용 영문 식별자
// ──────────────────────────────────────────────
const TEAM_DEFS = [
  { name: "라이징이글스",  slug: "rising-eagles",  city: "서울",  color: "#EF4444" },
  { name: "경기 셋업",     slug: "gg-setup",       city: "경기",  color: "#FF6B6B" },
  { name: "경기 제이크루", slug: "gg-jcrew",       city: "경기",  color: "#4ECDC4" },
  { name: "원주 3포인트",  slug: "wonju-3point",   city: "강원",  color: "#45B7D1" },
  { name: "대구 경북소방", slug: "daegu-fire",     city: "대구",  color: "#F7DC6F" },
  { name: "전주 몽키즈",   slug: "jeonju-monkyz",  city: "전북",  color: "#BB8FCE" },
  { name: "천안 펜타곤",   slug: "cheonan-penta",  city: "충남",  color: "#82E0AA" },
  { name: "제주 리딤",     slug: "jeju-redeem",    city: "제주",  color: "#F0B27A" },
];

// ──────────────────────────────────────────────
// 방송경기 일정 (트랙A) — 라이징이글스 vs 각 팀
// 라이징이글스가 항상 homeTeam
// 장소: 화성시 종합경기타운 실내체육관
// ──────────────────────────────────────────────
const BROADCAST_MATCHES = [
  { date: "2026-04-11", time: "19:00", away: "대구 경북소방", round: "예선 1경기" },
  { date: "2026-04-18", time: "19:00", away: "경기 셋업",     round: "예선 2경기" },
  { date: "2026-05-02", time: "19:00", away: "원주 3포인트",  round: "예선 3경기" },
  { date: "2026-05-06", time: "19:00", away: "제주 리딤",     round: "예선 4경기" },
  { date: "2026-05-11", time: "19:00", away: "천안 펜타곤",   round: "예선 5경기" },
  { date: "2026-05-20", time: "19:00", away: "경기 제이크루", round: "예선 6경기" },
  { date: "2026-06-13", time: "19:00", away: "전주 몽키즈",   round: "예선 7경기" },
  // 준결승/결승은 대진 미정이므로 homeTeam/awayTeam 없이 등록
  { date: "2026-06-17", time: "19:00", away: null as string | null, round: "준결승" },
  { date: "2026-06-27", time: "19:00", away: null as string | null, round: "결승" },
];

// ──────────────────────────────────────────────
// 풀리그 일정 (트랙B) — 전국-최강전.jsx의 TRACK_B_DAYS에서 추출
// 7팀 풀리그 총 21경기, 4일간 진행
// 장소: 남양주 스포라운드 체육관
// ──────────────────────────────────────────────
const FULLLEAGUE_MATCHES = [
  // === 1일차: 4월 12일 (일) — 6팀 출전, 전주 몽키즈 부재 ===
  { date: "2026-04-12", time: "10:00", home: "경기 셋업",     away: "원주 3포인트",  round: "1일차 G1" },
  { date: "2026-04-12", time: "11:00", home: "경기 제이크루", away: "천안 펜타곤",   round: "1일차 G2" },
  { date: "2026-04-12", time: "12:00", home: "원주 3포인트",  away: "제주 리딤",     round: "1일차 G3" },
  { date: "2026-04-12", time: "13:00", home: "대구 경북소방", away: "천안 펜타곤",   round: "1일차 G4" },
  { date: "2026-04-12", time: "14:00", home: "경기 제이크루", away: "제주 리딤",     round: "1일차 G5" },
  { date: "2026-04-12", time: "15:00", home: "경기 셋업",     away: "대구 경북소방", round: "1일차 G6" },

  // === 2일차: 5월 5일 (화) — 6팀 출전, 경기 셋업 부재 ===
  { date: "2026-05-05", time: "10:00", home: "경기 제이크루", away: "원주 3포인트",  round: "2일차 G1" },
  { date: "2026-05-05", time: "11:00", home: "대구 경북소방", away: "전주 몽키즈",   round: "2일차 G2" },
  { date: "2026-05-05", time: "12:00", home: "천안 펜타곤",   away: "제주 리딤",     round: "2일차 G3" },
  { date: "2026-05-05", time: "13:00", home: "경기 제이크루", away: "대구 경북소방", round: "2일차 G4" },
  { date: "2026-05-05", time: "14:00", home: "원주 3포인트",  away: "천안 펜타곤",   round: "2일차 G5" },
  { date: "2026-05-05", time: "15:00", home: "전주 몽키즈",   away: "제주 리딤",     round: "2일차 G6" },

  // === 3일차: 5월 17일 (일) — 6팀 출전, 경기 제이크루 부재 ===
  { date: "2026-05-17", time: "10:00", home: "경기 셋업",     away: "천안 펜타곤",   round: "3일차 G1" },
  { date: "2026-05-17", time: "11:00", home: "원주 3포인트",  away: "대구 경북소방", round: "3일차 G2" },
  { date: "2026-05-17", time: "12:00", home: "전주 몽키즈",   away: "천안 펜타곤",   round: "3일차 G3" },
  { date: "2026-05-17", time: "13:00", home: "경기 셋업",     away: "제주 리딤",     round: "3일차 G4" },
  { date: "2026-05-17", time: "14:00", home: "원주 3포인트",  away: "전주 몽키즈",   round: "3일차 G5" },
  { date: "2026-05-17", time: "15:00", home: "대구 경북소방", away: "제주 리딤",     round: "3일차 G6" },

  // === 4일차 (최종일): 5월 31일 (일) — 3팀 삼파전 ===
  { date: "2026-05-31", time: "10:00", home: "경기 셋업",     away: "전주 몽키즈",   round: "4일차 G1" },
  { date: "2026-05-31", time: "11:30", home: "전주 몽키즈",   away: "경기 제이크루", round: "4일차 G2" },
  { date: "2026-05-31", time: "13:00", home: "경기 제이크루", away: "경기 셋업",     round: "4일차 G3" },
];

// ──────────────────────────────────────────────
// 한국시간(KST)을 UTC Date 객체로 변환
// DB에는 UTC로 저장하되 표시할 때 KST로 변환
// ──────────────────────────────────────────────
function kstToUtc(dateStr: string, timeStr: string): Date {
  // "2026-04-12" + "10:00" → KST 시각을 만들고 9시간 빼서 UTC로
  const kst = new Date(`${dateStr}T${timeStr}:00+09:00`);
  return kst;
}

async function main() {
  console.log("=== 전국 최강전 시드 시작 ===\n");

  // 운영자 ID 자동 조회 (DB의 첫 번째 유저)
  const organizer = await prisma.user.findFirst({ orderBy: { id: "asc" } });
  if (!organizer) throw new Error("DB에 유저가 없습니다. 먼저 회원가입하세요.");
  ORGANIZER_ID = organizer.id;
  console.log(`운영자: ${organizer.nickname || organizer.email} (ID: ${ORGANIZER_ID})\n`);

  // ──────────────────────────────────────────
  // 1단계: 팀 8개 생성 (upsert — 이미 있으면 스킵)
  // 팀은 대회와 독립적으로 존재하는 엔티티
  // ──────────────────────────────────────────
  console.log("1. 팀 생성 (8팀)...");

  // 팀 이름 → DB ID 매핑을 저장할 객체
  const teamIdMap: Record<string, bigint> = {};

  for (const def of TEAM_DEFS) {
    // upsert: slug로 찾아서 있으면 update(변경 없음), 없으면 create
    const team = await prisma.team.upsert({
      where: { slug: def.slug },
      update: {}, // 이미 존재하면 아무것도 변경하지 않음
      create: {
        uuid: randomUUID(), // 팀 고유 식별자 (DB에 @default 없으므로 직접 생성)
        name: def.name,
        slug: def.slug,
        city: def.city,
        primaryColor: def.color,
        // 팀장(captain)을 운영자 계정으로 연결 (relation connect)
        users_teams_captain_idTousers: { connect: { id: ORGANIZER_ID } },
      },
    });
    teamIdMap[def.name] = team.id;
    console.log(`  [OK] ${def.name} (id: ${team.id})`);
  }

  // ──────────────────────────────────────────
  // 2단계: 대회 생성 ("전국 최강전")
  // format: full_league_knockout (풀리그+토너먼트 혼합)
  // is_public: false (비공개 — 직접 URL로만 접근)
  // ──────────────────────────────────────────
  console.log("\n2. 대회 생성...");

  const tournament = await prisma.tournament.create({
    data: {
      name: "전국 최강전",
      description: "7팀 풀리그 + 라이징이글스 방송경기. 방송경기(화성시 종합경기타운)와 풀리그(남양주 스포라운드)로 2트랙 운영.",
      format: "full_league_knockout",
      status: "upcoming", // 준비중 상태
      is_public: false,
      maxTeams: 8,
      startDate: kstToUtc("2026-04-11", "00:00"),
      endDate: kstToUtc("2026-06-27", "23:59"),
      venue_name: "화성시 종합경기타운 / 남양주 스포라운드",
      city: "경기",
      // 대회 운영자 연결 (relation connect)
      users_tournaments_organizer_idTousers: { connect: { id: ORGANIZER_ID } },
      primary_color: "#E31B23", // BDR Red
      secondary_color: "#1B3C87", // Navy
    },
  });
  console.log(`  [OK] 대회 생성 완료 (id: ${tournament.id})`);

  // ──────────────────────────────────────────
  // 3단계: tournament_teams — 대회에 8팀 등록
  // groupName으로 트랙 구분: 방송경기 참가팀 / 풀리그 참가팀
  // ──────────────────────────────────────────
  console.log("\n3. 대회 참가팀 등록 (8팀)...");

  // tournament_team ID를 팀 이름으로 찾기 위한 매핑
  const ttIdMap: Record<string, bigint> = {};

  for (let i = 0; i < TEAM_DEFS.length; i++) {
    const def = TEAM_DEFS[i];
    const tt = await prisma.tournamentTeam.create({
      data: {
        tournamentId: tournament.id,
        teamId: teamIdMap[def.name],
        status: "approved", // 승인 완료 상태
        seedNumber: i + 1,
        // 라이징이글스는 방송경기 전용, 나머지 7팀은 양쪽 모두 참가
        category: def.name === "라이징이글스" ? "broadcast" : "league",
        uniform_home: def.color, // 홈 유니폼 색상
      },
    });
    ttIdMap[def.name] = tt.id;
    console.log(`  [OK] ${def.name} (tournament_team id: ${tt.id})`);
  }

  // ──────────────────────────────────────────
  // 4단계: 방송경기 9경기 등록 (트랙A)
  // 라이징이글스가 항상 homeTeam
  // 준결승/결승은 대진 미정 (homeTeamId/awayTeamId = null)
  // ──────────────────────────────────────────
  console.log("\n4. 방송경기 등록 (9경기)...");

  let broadcastNum = 0;
  for (const match of BROADCAST_MATCHES) {
    broadcastNum++;
    await prisma.tournamentMatch.create({
      data: {
        tournamentId: tournament.id,
        // 라이징이글스가 항상 홈팀 (준결승/결승은 대진 미정)
        homeTeamId: match.away ? ttIdMap["라이징이글스"] : null,
        awayTeamId: match.away ? ttIdMap[match.away] : null,
        scheduledAt: kstToUtc(match.date, match.time),
        venue_name: "화성시 종합경기타운 실내체육관",
        group_name: "방송경기", // 트랙 구분용
        roundName: match.round,
        match_number: broadcastNum,
        status: "scheduled",
      },
    });
    const label = match.away ?? "대진 미정";
    console.log(`  [OK] 방송경기 #${broadcastNum}: 라이징이글스 vs ${label} (${match.date})`);
  }

  // ──────────────────────────────────────────
  // 5단계: 풀리그 21경기 등록 (트랙B)
  // TRACK_B_DAYS 데이터에서 정확히 추출한 대진
  // ──────────────────────────────────────────
  console.log("\n5. 풀리그 등록 (21경기)...");

  let leagueNum = 0;
  for (const match of FULLLEAGUE_MATCHES) {
    leagueNum++;
    await prisma.tournamentMatch.create({
      data: {
        tournamentId: tournament.id,
        homeTeamId: ttIdMap[match.home],
        awayTeamId: ttIdMap[match.away],
        scheduledAt: kstToUtc(match.date, match.time),
        venue_name: "남양주 스포라운드 체육관",
        group_name: "풀리그", // 트랙 구분용
        roundName: match.round,
        match_number: leagueNum,
        status: "scheduled",
      },
    });
    console.log(`  [OK] 풀리그 #${leagueNum}: ${match.home} vs ${match.away} (${match.date} ${match.time})`);
  }

  // ──────────────────────────────────────────
  // 완료 요약
  // ──────────────────────────────────────────
  console.log("\n=== 시드 완료 ===");
  console.log(`  대회 ID: ${tournament.id}`);
  console.log(`  팀: ${TEAM_DEFS.length}개`);
  console.log(`  방송경기: ${broadcastNum}경기`);
  console.log(`  풀리그: ${leagueNum}경기`);
  console.log(`  총 경기: ${broadcastNum + leagueNum}경기`);
  console.log(`\n  확인 URL: /tournaments/${tournament.id}`);
}

// 실행 + 에러 처리 + DB 연결 해제
main()
  .then(() => {
    console.log("\n시드 스크립트 정상 종료.");
  })
  .catch((e) => {
    console.error("\n[에러] 시드 실행 실패:", e);
    process.exit(1);
  })
  .finally(async () => {
    // DB 연결을 반드시 해제해야 프로세스가 종료됨
    await prisma.$disconnect();
  });

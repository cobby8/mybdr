import { type NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireTournamentAdmin } from "@/lib/auth/tournament-auth";
import { getBracketVersionStatus, createBracketVersion, activateBracketVersion } from "@/lib/tournaments/bracket-version";
import { createNotificationBulk } from "@/lib/notifications/create";
import { NOTIFICATION_TYPES } from "@/lib/notifications/types";
import { apiSuccess, apiError } from "@/lib/api/response";
// 풀리그(라운드 로빈) 자동 생성 유틸 — single_elimination 외 format 분기용
import { generateRoundRobinMatches, isLeagueFormat } from "@/lib/tournaments/league-generator";
// 듀얼토너먼트 자동 생성 유틸 (Phase A 신설) — 16팀 4조 27 매치 구조
import {
  generateDualTournament,
  validateGroupAssignment,
  type DualGroupAssignment,
} from "@/lib/tournaments/dual-tournament-generator";
// 2026-05-04 (P3) — 듀얼 표준 default: 4강 페어링 모드 (sequential/adjacent)
import {
  DUAL_DEFAULT_PAIRING,
  type SemifinalPairingMode,
} from "@/lib/tournaments/dual-defaults";
// Phase 4 — 매치 코드 v4 자동 부여 (호출자 영향 0 / NULL 안전)
import { applyMatchCodeFields } from "@/lib/tournaments/match-code";
import { Prisma } from "@prisma/client";

type Ctx = { params: Promise<{ id: string }> };

function nextPow2(n: number) {
  return Math.pow(2, Math.ceil(Math.log2(n)));
}

function roundName(round: number, totalRounds: number): string {
  const fromFinal = totalRounds - round;
  const names: Record<number, string> = {
    0: "결승",
    1: "준결승",
    2: "준준결승",
    3: "8강",
    4: "16강",
    5: "32강",
  };
  return names[fromFinal] ?? `라운드 ${round}`;
}

// GET: bracket version status + matches + approved teams
export async function GET(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const auth = await requireTournamentAdmin(id);
  if ("error" in auth) return auth.error;

  // 풀리그/토너먼트 UI 분기에 필요한 format 을 함께 반환
  const [versionStatus, versions, matches, approvedTeams, tournamentMeta] = await Promise.all([
    getBracketVersionStatus(id),
    prisma.tournament_bracket_versions.findMany({
      where: { tournament_id: id },
      orderBy: { version_number: "asc" },
      select: { id: true, version_number: true, created_at: true, is_active: true },
    }),
    prisma.tournamentMatch.findMany({
      where: { tournamentId: id },
      orderBy: [{ round_number: "asc" }, { bracket_position: "asc" }, { match_number: "asc" }],
      select: {
        id: true,
        roundName: true,
        round_number: true,
        bracket_position: true,
        match_number: true,
        // Phase 5 (매치 코드 v4) — admin bracket 응답에도 코드 포함
        // bracket-builder DbMatch 가 옵셔널이라 호출자 영향 0 (필드만 추가)
        match_code: true,
        status: true,
        homeTeamId: true,
        awayTeamId: true,
        homeScore: true,
        awayScore: true,
        winner_team_id: true,
        next_match_id: true,
        // Phase D: dual_tournament 5섹션 그룹핑 + 매치 카드 표시 위한 추가 필드
        // - group_name: A/B/C/D 조별 묶음 키 (Stage 1 추가 그룹핑용)
        // - settings: homeSlotLabel/awaySlotLabel (빈 슬롯 표시 라벨)
        // - scheduledAt/venue_name/court_number: 매치 카드 일정/장소 표시
        group_name: true,
        settings: true,
        scheduledAt: true,
        venue_name: true,
        court_number: true,
        homeTeam: { select: { id: true, team: { select: { name: true, primaryColor: true } } } },
        awayTeam: { select: { id: true, team: { select: { name: true, primaryColor: true } } } },
      },
    }),
    prisma.tournamentTeam.findMany({
      where: { tournamentId: id, status: "approved" },
      orderBy: [{ seedNumber: "asc" }, { createdAt: "asc" }],
      select: { id: true, seedNumber: true, team: { select: { name: true } } },
    }),
    prisma.tournament.findUnique({
      where: { id },
      // 2026-05-04 (P4) — settings 추가: dual 조 배정 에디터가 기존 settings.bracket.groupAssignment + semifinalPairing 복원
      select: { format: true, settings: true },
    }),
  ]);

  return apiSuccess({
    ...versionStatus,
    versions,
    matches,
    approvedTeams,
    format: tournamentMeta?.format ?? null, // UI 가 풀리그/토너먼트 분기할 때 사용
    // 2026-05-04 (P4) — settings.bracket 노출 (dual editor 복원용 / 다른 포맷도 안전 — 무시)
    settings: tournamentMeta?.settings ?? null,
  });
}

// POST: generate bracket (single elimination)
export async function POST(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const auth = await requireTournamentAdmin(id);
  if ("error" in auth) return auth.error;

  let body: { clear?: boolean } = {};
  try { body = await req.json(); } catch { /* optional */ }

  // Version limit check
  const versionStatus = await getBracketVersionStatus(id);
  if (versionStatus.needsApproval) {
    const [superAdmins, tournament] = await Promise.all([
      prisma.user.findMany({ where: { isAdmin: true }, select: { id: true } }),
      prisma.tournament.findUnique({ where: { id }, select: { name: true } }),
    ]);
    if (superAdmins.length > 0) {
      await createNotificationBulk(
        superAdmins.map((u) => ({
          userId: u.id,
          notificationType: NOTIFICATION_TYPES.TOURNAMENT_BRACKET_APPROVAL,
          title: "대진표 추가 생성 승인 요청",
          content: `"${tournament?.name ?? id}" 대회에서 대진표 ${versionStatus.currentVersion + 1}번째 생성 승인이 요청되었습니다.`,
          actionUrl: `/admin/tournaments`,
        }))
      );
    }
    return apiError(
      `무료 생성 횟수(${versionStatus.currentVersion}회)를 초과하였습니다. 슈퍼관리자의 승인을 요청했습니다.`,
      403
    );
  }

  // ── format 분기: 풀리그 계열이면 라운드 로빈 경기 생성 후 조기 반환 ──
  // 이유: single_elimination 트리 생성과 풀리그(N*(N-1)/2) 생성은 완전히 다른 로직.
  // 기존 single_elimination 로직 보존 + 분기만 최소 추가
  const tournamentMeta = await prisma.tournament.findUnique({
    where: { id },
    // Phase 4 — 매치 코드 v4 자동 부여를 위해 short_code/region_code/categories/startDate 추가 select
    // (호출자 영향 0 — 추가 select 만이고 기존 분기 로직 영향 0)
    select: {
      format: true,
      settings: true,
      short_code: true,
      region_code: true,
      categories: true,
      startDate: true,
    },
  });

  if (isLeagueFormat(tournamentMeta?.format)) {
    try {
      const league = await generateRoundRobinMatches(id, { clear: body.clear });

      // ✨ Phase 2C: full_league_knockout이면 토너먼트 "빈 뼈대"도 함께 생성
      //   → 리그 진행 중에도 대진표 탭에 토너먼트 트리가 보이고
      //     팀 없는 슬롯은 "1위", "4위" 같은 라벨로 표시됨
      //   실패해도 리그 생성 자체는 성공으로 유지 (뼈대는 admin이 수동 재시도 가능)
      let skeletonCreated = 0;
      if (tournamentMeta?.format === "full_league_knockout") {
        try {
          const settings = tournamentMeta.settings as Record<string, unknown> | null;
          const bracket = settings?.bracket as Record<string, unknown> | undefined;
          const knockoutSize = (bracket?.knockoutSize as number | undefined) ?? 4;
          const bronzeMatch = (bracket?.bronzeMatch as boolean | undefined) ?? false;
          // 동적 import: 엣지 경로라 번들 분리
          const { generateEmptyKnockoutSkeleton } = await import(
            "@/lib/tournaments/tournament-seeding"
          );
          skeletonCreated = await generateEmptyKnockoutSkeleton(
            id,
            knockoutSize,
            bronzeMatch,
          );
        } catch (e) {
          console.error("[skeleton-gen]", e);
        }
      }

      // bracket_version 기록 — single_elimination 과 동일하게 버전 관리 일관성 유지
      await createBracketVersion(id, auth.userId);
      return apiSuccess({
        success: true,
        type: "round_robin", // UI 에서 메시지 분기용
        matchesCreated: league.matchesCreated,
        teamCount: league.teamCount,
        skeletonCreated, // 토너먼트 뼈대 경기 수 (0이면 생성 안 됨)
        versionNumber: versionStatus.currentVersion + 1,
      });
    } catch (e) {
      const err = e as { code?: string; message?: string };
      if (err.code === "TEAMS_INSUFFICIENT" || err.message === "TEAMS_INSUFFICIENT") {
        return apiError("2팀 이상 승인되어야 풀리그 경기를 생성할 수 있습니다.", 400);
      }
      if (err.code === "ALREADY_EXISTS" || err.message === "ALREADY_EXISTS") {
        return apiError("이미 경기가 존재합니다. 재생성을 원하면 clear=true 로 요청하세요.", 409);
      }
      throw e;
    }
  }

  // ── format 분기: 듀얼토너먼트 (16팀 4조 27 매치 고정 구조) ──
  // 이유: dual 은 single elim 트리와 완전히 다른 구조 (조별 미니 더블엘리미 + 8강~결승 5단계).
  //       generator 가 27 매치 + nextMatch/loserNext 매핑까지 전부 만들고,
  //       caller(여기) 는 createMany + 받은 BigInt id 로 next_match_id 2단계 UPDATE 만 처리.
  //       single elim 회귀 0 — 본 분기는 dual_tournament 일 때만 진입 후 조기 return.
  if (tournamentMeta?.format === "dual_tournament") {
    try {
      // 1) settings.bracket.groupAssignment 검증 (사용자 수동 입력)
      //    - 4조 × 4팀 = 16팀 unique
      //    - 사진 그대로 입력: A=[피벗, SYBC, ...], B=[...], C=[...], D=[...]
      const settings = tournamentMeta.settings as Record<string, unknown> | null;
      const bracket = settings?.bracket as Record<string, unknown> | undefined;
      const rawGroupAssignment = bracket?.groupAssignment as
        | Record<string, Array<string | number>>
        | undefined;

      if (!rawGroupAssignment || !rawGroupAssignment.A || !rawGroupAssignment.B || !rawGroupAssignment.C || !rawGroupAssignment.D) {
        return apiError(
          "듀얼토너먼트는 settings.bracket.groupAssignment 에 4조(A/B/C/D) 배정이 필요합니다.",
          400,
        );
      }

      // string|number 입력을 BigInt 로 변환 (settings JSON 직렬화 안전성)
      let groupAssignment: DualGroupAssignment;
      try {
        groupAssignment = {
          A: rawGroupAssignment.A.map((id) => BigInt(id)) as [bigint, bigint, bigint, bigint],
          B: rawGroupAssignment.B.map((id) => BigInt(id)) as [bigint, bigint, bigint, bigint],
          C: rawGroupAssignment.C.map((id) => BigInt(id)) as [bigint, bigint, bigint, bigint],
          D: rawGroupAssignment.D.map((id) => BigInt(id)) as [bigint, bigint, bigint, bigint],
        };
        validateGroupAssignment(groupAssignment); // 16팀 unique + 각 조 4팀
      } catch (validateErr) {
        const msg = validateErr instanceof Error ? validateErr.message : "조 배정 검증 실패";
        return apiError(msg, 400);
      }

      // 2) 매치 0건 확인 (B 대회 첫 생성 OK / 재생성은 clear=true 필요)
      //    + advisory lock + createMany + 27 update 까지 한 트랜잭션
      const dualResult = await prisma.$transaction(
        async (tx) => {
          // tournament_id 기반 advisory lock (동시 생성 방지)
          await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${id})::bigint)`;

          // clear 처리: false 면 기존 매치 있을 때 ALREADY_EXISTS, true 면 모두 삭제 후 재생성
          if (body.clear) {
            await tx.tournamentMatch.deleteMany({ where: { tournamentId: id } });
          } else {
            const existing = await tx.tournamentMatch.count({ where: { tournamentId: id } });
            if (existing > 0) {
              throw Object.assign(new Error("ALREADY_EXISTS"), { code: "ALREADY_EXISTS" });
            }
          }

          // 3) generator 호출 — 27 DualMatchToCreate 반환
          // 2026-05-04 (P3) — settings.bracket.semifinalPairing 참조 (default = sequential)
          //   sequential = 표준 / adjacent = 5/2 동호회최강전 호환 옵션
          //   bracket 변수는 위 1) 단계에서 추출 완료
          const pairing: SemifinalPairingMode =
            bracket?.semifinalPairing === "adjacent"
              ? "adjacent"
              : bracket?.semifinalPairing === "sequential"
                ? "sequential"
                : DUAL_DEFAULT_PAIRING;
          const dualMatches = generateDualTournament(groupAssignment, id, pairing);

          // 4) createMany 27건 INSERT (next_match_id 는 null — 자기 참조 FK 회피)
          //    settings JSON 에 슬롯 라벨 + (G1·G2·G3 의 loserNextMatchSlot) 임시 저장
          //    실제 loserNextMatchId 는 INSERT 후 2단계 UPDATE 에서 채움
          const matchNumberToIndex = new Map<number, number>(); // matchNumber → matches[] 인덱스 (역추적용)
          const createData: Prisma.TournamentMatchCreateManyInput[] = dualMatches.map((m, idx) => {
            matchNumberToIndex.set(m.matchNumber, idx);
            // 슬롯 라벨은 항상 settings 에 저장 (UI 표시용)
            const settingsJson: Record<string, unknown> = {
              homeSlotLabel: m._homeSlotLabel,
              awaySlotLabel: m._awaySlotLabel,
            };
            return {
              tournamentId: m.tournamentId,
              homeTeamId: m.homeTeamId,
              awayTeamId: m.awayTeamId,
              status: m.status,
              bracket_position: m.bracketPosition,
              bracket_level: m.bracketLevel,
              roundName: m.roundName,
              round_number: m.roundNumber,
              match_number: m.matchNumber,
              group_name: m.group_name,
              homeScore: 0,
              awayScore: 0,
              settings: settingsJson as Prisma.InputJsonValue,
              // next_match_id / next_match_slot 는 2단계 UPDATE 에서 채움
            };
          });

          // Phase 4 — 매치 코드 v4 필드 자동 부여 (dual_tournament 통합)
          //   - tournamentMeta 의 short_code/region_code 둘 다 있으면 match_code 생성
          //   - dual 의 group_name (A/B/C/D) → group_letter 자동 복사
          //   - categories 단일 종별/디비전이면 일괄 부여
          //   호출자 영향 0 — createData 형식 그대로 유지하며 신규 4컬럼만 추가
          const createDataWithCode = tournamentMeta
            ? applyMatchCodeFields(createData, {
                short_code: tournamentMeta.short_code ?? null,
                region_code: tournamentMeta.region_code ?? null,
                categories: tournamentMeta.categories,
                startDate: tournamentMeta.startDate,
              })
            : createData;

          await tx.tournamentMatch.createMany({ data: createDataWithCode });

          // 5) 새로 생성된 27 매치를 match_number 순으로 다시 조회해서 BigInt id 매핑
          //    matchNumber 는 generator 에서 1부터 순차 부여 = matches[] 인덱스 + 1
          const insertedMatches = await tx.tournamentMatch.findMany({
            where: { tournamentId: id },
            orderBy: { match_number: "asc" },
            select: { id: true, match_number: true, settings: true },
          });

          if (insertedMatches.length !== 27) {
            throw new Error(
              `듀얼토너먼트 INSERT 후 매치 수 불일치: 27 expected, ${insertedMatches.length} found`,
            );
          }

          // matches[] 인덱스 → 새 BigInt id
          const indexToId = new Map<number, bigint>();
          for (const inserted of insertedMatches) {
            const idx = matchNumberToIndex.get(inserted.match_number ?? -1);
            if (idx === undefined) {
              throw new Error(
                `INSERT 결과 match_number ${inserted.match_number} 가 generator 출력에 없음`,
              );
            }
            indexToId.set(idx, inserted.id);
          }

          // 6) 27건 UPDATE: next_match_id + next_match_slot + settings.loserNextMatchId/Slot
          //    generator 의 _winnerNextMatchIndex / _loserNextMatchIndex 를 실제 BigInt id 로 변환
          for (let idx = 0; idx < dualMatches.length; idx++) {
            const m = dualMatches[idx];
            const myId = indexToId.get(idx)!;

            // 다음 winner 진출 매치 id (있으면)
            const winnerNextId =
              m._winnerNextMatchIndex != null ? indexToId.get(m._winnerNextMatchIndex) ?? null : null;
            // 다음 loser 진출 매치 id (있으면) — settings JSON 에 저장
            const loserNextId =
              m._loserNextMatchIndex != null ? indexToId.get(m._loserNextMatchIndex) ?? null : null;

            // settings JSON 갱신: 기존 슬롯 라벨 + loserNextMatchId/Slot 추가
            // BigInt 직렬화 안전성: loserNextMatchId 는 string 으로 저장 (JSON 호환)
            const updatedSettings: Record<string, unknown> = {
              homeSlotLabel: m._homeSlotLabel,
              awaySlotLabel: m._awaySlotLabel,
            };
            if (loserNextId != null && m._loserNextMatchSlot) {
              updatedSettings.loserNextMatchId = loserNextId.toString();
              updatedSettings.loserNextMatchSlot = m._loserNextMatchSlot;
            }

            await tx.tournamentMatch.update({
              where: { id: myId },
              data: {
                next_match_id: winnerNextId,
                next_match_slot: m._winnerNextMatchSlot,
                settings: updatedSettings as Prisma.InputJsonValue,
              },
            });
          }

          // 7) Tournament.matches_count 캐시 업데이트
          const total = await tx.tournamentMatch.count({ where: { tournamentId: id } });
          await tx.tournament.update({
            where: { id },
            data: { matches_count: total },
          });

          return { created: dualMatches.length };
        },
        { timeout: 30000 }, // 27 매치 + 27 update = 54 쿼리. 여유 타임아웃
      );

      // 8) bracket_version 기록 (다른 format 과 일관성 유지)
      await createBracketVersion(id, auth.userId);

      return apiSuccess({
        success: true,
        type: "dual_tournament",
        format: "dual_tournament",
        created: dualResult.created,
        versionNumber: versionStatus.currentVersion + 1,
      });
    } catch (e) {
      const err = e as { code?: string; message?: string };
      if (err.code === "ALREADY_EXISTS" || err.message === "ALREADY_EXISTS") {
        return apiError("이미 경기가 존재합니다. 재생성을 원하면 clear=true 로 요청하세요.", 409);
      }
      throw e;
    }
  }

  // TC-003: 브라켓 생성 전 DB 어드바이저리 락으로 동시 생성 race condition 방지
  let result: { matchCounter: number; totalRounds: number };
  try {
  result = await prisma.$transaction(async (tx) => {
    // tournament_id 기반 advisory lock (동일 대회 동시 요청 직렬화)
    await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${id})::bigint)`;

    const teams = await tx.tournamentTeam.findMany({
      where: { tournamentId: id, status: "approved" },
      orderBy: [{ seedNumber: "asc" }, { createdAt: "asc" }],
      select: { id: true, seedNumber: true },
    });

    if (teams.length < 2) throw Object.assign(new Error("TEAMS_INSUFFICIENT"), { code: "TEAMS_INSUFFICIENT" });

    if (body.clear) {
      await tx.tournamentMatch.deleteMany({ where: { tournamentId: id } });
    } else {
      const existing = await tx.tournamentMatch.count({ where: { tournamentId: id } });
      if (existing > 0) throw Object.assign(new Error("ALREADY_EXISTS"), { code: "ALREADY_EXISTS" });
    }

    const n = teams.length;
    const slots = nextPow2(n);
    const totalRounds = Math.log2(slots);
    const roundMatchIds: Record<number, bigint[]> = {};
    let matchCounter = 1;

    // Phase 4 — 매치 코드 v4 자동 부여 closure (single_elimination 통합)
    // 매치 단위 create 패턴이라 createMany 와 달리 각 매치 데이터에 즉시 적용
    // - tournamentMeta 의 short_code/region_code 둘 다 있으면 match_code 생성
    // - single_elimination 은 group_letter/category_letter 보통 부재 → 단일 카테고리만 일괄
    const applyV4 = <T extends { match_number?: number | null; group_name?: string | null }>(
      data: T,
    ): T => {
      if (!tournamentMeta) return data;
      const [withCode] = applyMatchCodeFields([data], {
        short_code: tournamentMeta.short_code ?? null,
        region_code: tournamentMeta.region_code ?? null,
        categories: tournamentMeta.categories,
        startDate: tournamentMeta.startDate,
      });
      return withCode;
    };

    for (let r = totalRounds; r >= 1; r--) {
      const matchCount = slots / Math.pow(2, r);
      roundMatchIds[r] = [];

      for (let pos = 1; pos <= matchCount; pos++) {
        let homeTeamId: bigint | null = null;
        let awayTeamId: bigint | null = null;

        if (r === 1) {
          const homeIdx = (pos - 1) * 2;
          const awayIdx = homeIdx + 1;
          homeTeamId = teams[homeIdx]?.id ?? null;
          awayTeamId = teams[awayIdx]?.id ?? null;
        }

        let nextMatchId: bigint | null = null;
        let nextMatchSlot: string | null = null;

        if (r < totalRounds) {
          const nextPos = Math.ceil(pos / 2);
          nextMatchId = roundMatchIds[r + 1]?.[nextPos - 1] ?? null;
          nextMatchSlot = pos % 2 === 1 ? "home" : "away";
        }

        if (r === 1 && homeTeamId && !awayTeamId) {
          if (nextMatchId && nextMatchSlot) {
            await tx.tournamentMatch.update({
              where: { id: nextMatchId },
              data: {
                ...(nextMatchSlot === "home" && { homeTeamId }),
                ...(nextMatchSlot === "away" && { awayTeamId: homeTeamId }),
              },
            });
          }
          // Phase 4 — applyV4 로 v4 필드 자동 부여 (match_code 등)
          const match = await tx.tournamentMatch.create({
            data: applyV4({
              tournamentId: id,
              homeTeamId,
              awayTeamId: null,
              roundName: roundName(r, totalRounds),
              round_number: r,
              bracket_level: r,
              bracket_position: pos,
              match_number: matchCounter++,
              status: "bye",
              winner_team_id: homeTeamId,
              next_match_id: nextMatchId,
              next_match_slot: nextMatchSlot,
            }),
          });
          roundMatchIds[r].push(match.id);
          continue;
        }

        // 2026-05-15 PR-G5.6 — single_elim 2R~ NULL placeholder 슬롯 라벨 보강.
        //   사유: 강남구 사고 영구 차단 패턴 동일 적용 — placeholder 매치도 UI 카드에
        //         "준결승 1경기 승자" 형식 표시 (homeTeamId NULL 시 settings.homeSlotLabel 우선).
        //   r=1 (실팀 매칭) = 슬롯 라벨 없음 / r > 1 = 이전 라운드 두 매치 승자 슬롯.
        //   buildSlotLabel 호출로 형식 일관성 보장 (CLAUDE.md G5.1 헬퍼 단일 source).
        let slotSettings: { homeSlotLabel: string; awaySlotLabel: string } | undefined;
        if (r > 1) {
          const prevRoundName = roundName(r - 1, totalRounds);
          slotSettings = {
            homeSlotLabel: `${prevRoundName} ${2 * pos - 1}경기 승자`,
            awaySlotLabel: `${prevRoundName} ${2 * pos}경기 승자`,
          };
        }

        // Phase 4 — applyV4 로 v4 필드 자동 부여 (match_code 등)
        const match = await tx.tournamentMatch.create({
          data: applyV4({
            tournamentId: id,
            homeTeamId,
            awayTeamId,
            roundName: roundName(r, totalRounds),
            round_number: r,
            bracket_level: r,
            bracket_position: pos,
            match_number: matchCounter++,
            status: r === 1 ? "scheduled" : "pending",
            next_match_id: nextMatchId,
            next_match_slot: nextMatchSlot,
            ...(slotSettings && { settings: slotSettings }),
          }),
        });
        roundMatchIds[r].push(match.id);
      }
    }

    const total = await tx.tournamentMatch.count({ where: { tournamentId: id } });
    await tx.tournament.update({ where: { id }, data: { matches_count: total } });

    return { matchCounter, totalRounds };
  }, { timeout: 30000 });
  } catch (e) {
    const err = e as { code?: string; message?: string };
    if (err.code === "TEAMS_INSUFFICIENT" || err.message === "TEAMS_INSUFFICIENT") {
      return apiError("2팀 이상 승인되어야 대진표를 생성할 수 있습니다.", 400);
    }
    if (err.code === "ALREADY_EXISTS" || err.message === "ALREADY_EXISTS") {
      return apiError("이미 경기가 존재합니다. clear=true로 재생성하세요.", 409);
    }
    throw e;
  }

  // Record new bracket version (트랜잭션 외부)
  await createBracketVersion(id, auth.userId);

  return apiSuccess({
    success: true,
    matchesCreated: result.matchCounter - 1,
    rounds: result.totalRounds,
    versionNumber: versionStatus.currentVersion + 1,
  });
}

// PATCH: activate latest bracket version
export async function PATCH(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const auth = await requireTournamentAdmin(id);
  if ("error" in auth) return auth.error;

  const latest = await prisma.tournament_bracket_versions.findFirst({
    where: { tournament_id: id },
    orderBy: { version_number: "desc" },
    select: { id: true },
  });

  if (!latest) {
    return apiError("생성된 대진표 버전이 없습니다.", 404);
  }

  await activateBracketVersion(id, latest.id);
  return apiSuccess({ success: true });
}

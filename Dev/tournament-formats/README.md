# 대회 형식 (Tournament Formats) — 학습/참고 자료

> 이 폴더는 **대회 진행 방식**의 정의·작동 방식·실제 사례를 정리한 학습 자료다.
> 사람과 AI(Claude/Codex 등) 모두 참고 — 코드 구현/문서화 전 반드시 본 폴더를 확인.

## 목적

- 각 대회 방식의 **명확한 정의** (그림 + 글)
- 코드 구현 시 **올바른 동작 기준**
- 사용자/원영 협의 시 **공통 어휘 확립**

## 카테고리 폴더 컨벤션

각 형식별로 폴더 1개 + 내부 구조:

```
Dev/tournament-formats/{format-key}/
├── README.md          # 정의 + 작동 방식 + 코드 매핑 (필수)
├── screenshots/       # 사진 (.png/.jpg/.pdf)
├── diagrams/          # 다이어그램 (.svg/.png)
└── examples/          # 실제 대회 사례 (선택)
```

`{format-key}` = `prisma/schema.prisma` 의 `Tournament.format` 값 (snake_case).

## 현재 등록된 형식

| key | 한글명 | 폴더 | 코드 구현 |
|-----|--------|------|---------|
| `dual_tournament` | 듀얼토너먼트 | [dual-tournament/](./dual-tournament/) | ⚠️ 라벨만 (single과 동일 처리) |
| `single_elimination` | 토너먼트 | (미생성) | ✅ `bracket-generator.ts` |
| `double_elimination` | 더블 엘리미네이션 | (미생성) | ⚠️ 라벨만 |
| `round_robin` | 리그전 | (미생성) | 일부 (`league-generator.ts`) |
| `group_stage` | 조별리그 | (미생성) | 일부 |
| `group_stage_knockout` | 조별리그+토너먼트 | (미생성) | 일부 |
| `full_league_knockout` | 풀리그+토너먼트 | (미생성) | 미구현 |
| `swiss` | 스위스 라운드 | (미생성) | 미구현 |

→ 새 형식 추가 시 본 표 갱신 + 폴더 생성.

## 참고

- 코드 매핑: `src/lib/constants/tournament-status.ts` (TOURNAMENT_FORMAT_LABEL)
- 대진 생성: `src/lib/tournaments/bracket-generator.ts` + `league-generator.ts`
- DB schema: `prisma/schema.prisma` Tournament.format
- 위자드 입력: `src/app/(web)/tournament-admin/tournaments/new/wizard/page.tsx`

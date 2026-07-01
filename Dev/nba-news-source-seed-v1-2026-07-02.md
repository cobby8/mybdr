# NBA 뉴스 소스 Seed v1

작성일: 2026-07-02
목적: NBA 뉴스룸 MVP의 1차 모니터링 대상과 발행 정책을 정의한다.
상태: 운영 DB seed 전 검토용 문서. 코드/DB에는 아직 반영하지 않는다.

## 1. Seed 원칙

| 원칙 | 내용 |
|---|---|
| 공식 우선 | 리그/팀 공식 계정은 `official` 확인 소스로 사용한다. |
| 기자와 상태 분리 | 기자 등급이 높아도 단독 보도는 `official`이 아니라 `reported_single`이다. |
| 원문 재배포 금지 | X 게시물 전문 저장/재게시 금지. post id, URL, 짧은 excerpt, AI 요약만 보관한다. |
| parody 방지 | handle, 계정명, 인증 상태, 과거 활동, 팔로워 규모를 seed 전 확인한다. |
| 최신성 관리 | 이직/은퇴가 잦으므로 `verified_at`과 `verify_status`를 둔다. |
| 자동 발행 제한 | MVP는 AI 초안 + 관리자 승인 발행만 허용한다. |

## 2. Source Type

| source_type | 의미 | 발행 정책 |
|---|---|---|
| `official_league` | NBA/리그 공식 발표 | 공식 확인 소스 |
| `official_team` | NBA 30팀 공식 계정 | 팀 관련 공식 확인 |
| `tier_1_insider` | 리그 전체급 브레이킹 insider | 단독 초안 가능, 승인 필수 |
| `tier_2_insider` | 전국구 기자/주요 매체 writer | 교차 확인/보조 출처 |
| `team_beat` | 팀 담당 beat writer | 팀별 세부 확인 |
| `analyst` | 분석가/칼럼니스트 | 배경/영향 문단용 |
| `media_account` | 매체 공식 계정 | 기사 링크/공식 매체 보조 |
| `rumor_watch` | 루머/집계 계정 | 공개 발행 금지, 감지 신호만 |
| `legacy` | 은퇴/비활동/역사적 권위 | 자동 수집 제외 |

## 3. Tier와 기본 점수

| Tier | 기본 trust_score | 설명 |
|---|---:|---|
| T0 | 95 | 리그/팀 공식 |
| T1 | 88 | 최상위 insider |
| T2 | 78 | 검증된 전국구 기자/인사이더 |
| T3 | 68 | 팀 beat writer |
| T4 | 58 | 분석/칼럼/맥락 제공 |
| T5 | 25 | 루머/집계/비공식 |
| Legacy | 0 | active 수집 제외 |

## 4. T0 공식 리그 소스

| name | handle | source_type | trust_score | usage_policy | verify_status |
|---|---|---|---:|---|---|
| NBA | `@NBA` | `official_league` | 95 | 리그 공식 확인, 일정, 수상, 주요 발표 | 확인 필요 |
| NBA Communications | `@NBAPR` | `official_league` | 98 | 징계, 수상, 규정, 공식 커뮤니케이션 | 확인 필요 |
| NBA Official | `@NBAOfficial` | `official_league` | 92 | 심판/룰/판정 관련 보조 확인 | 확인 필요 |

## 5. T1/T2 리그 전체 인사이더

| name | handle | source_type | trust_score | primary_topics | usage_policy | notes |
|---|---|---|---:|---|---|---|
| Shams Charania | `@ShamsCharania` | `tier_1_insider` | 90 | 트레이드, 계약, 부상, 리그 속보 | 단독 보도 초안 가능. 제목/리드에 출처 명시 | ESPN Senior NBA Insider로 확인됨. 베팅시장 영향 이슈가 있어 단정 표현 주의 |
| Marc Stein | `@TheSteinLine` | `tier_1_insider` | 88 | FA, 트레이드 시장, 리그 운영, 코칭 | 높은 신뢰. 복수 확인 시 발행 후보 | The Stein Line/Substack 중심. Jake Fischer와 협업 |
| Brian Windhorst | `@WindhorstESPN` | `tier_2_insider` | 78 | 리그 맥락, 스타 플레이어, ESPN 분석 | 배경/영향 강화용. 단독 속보는 승인 필수 | ESPN NBA writer/podcast host |
| Tim Bontemps | `@TimBontemps` | `tier_2_insider` | 76 | 리그 동향, 팀/선수 분석, ESPN 리포팅 | 교차 확인/보조 출처 | ESPN writer. role 최신 확인 필요 |
| Chris Haynes | `@ChrisBHaynes` | `tier_2_insider` | 77 | 선수 측 소스, FA, 트레이드, 인터뷰 | 단독은 `reported_single`. 공식 확인 전 과장 금지 | 2025~26 NBA on Prime 관련 보도 있음. 공식 role 확인 필요 |
| Jake Fischer | `@JakeLFischer` | `tier_2_insider` | 74 | 트레이드 시장, 코칭, FA, 리그 노트 | 기본 `developing`, 교차 확인 권장 | The Stein Line contributor로 보도 확인 |
| Adrian Wojnarowski | `@wojespn` | `legacy` | 0 | 과거 NBA 대표 insider | active 수집 제외 | 2024년 ESPN/뉴스업 은퇴. 역사적 참고만 |

## 6. T4 분석/맥락 소스

| name | handle | source_type | trust_score | primary_topics | usage_policy | notes |
|---|---|---|---:|---|---|---|
| Zach Lowe | `@ZachLowe_NBA` | `analyst` | 62 | 전술, 로스터, 팀 빌딩, 장기 맥락 | 속보 소스가 아니라 분석/배경 문단용 | ESPN 출신. 2025년 이후 The Ringer/Prime Video 관련 보도 있음 |
| Kevin O'Connor | `@KevinOConnorNBA` | `analyst` | 60 | 드래프트, 로스터, 트레이드 루머, 분석 | 루머성 표현은 `developing`. 기사 배경용 | Yahoo Sports 관련 보도 있음. handle/소속 최신 확인 필요 |
| Bobby Marks | `@BobbyMarks42` | `analyst` | 64 | 샐러리캡, 계약 구조, 트레이드 가능성 | 금액/캡 해석 검증용 | ESPN cap analyst. 최신 role 확인 필요 |
| John Hollinger | `@johnhollinger` | `analyst` | 62 | 프론트오피스 관점, 팀 빌딩, 분석 | 배경/영향 문단용 | The Athletic. paywall 기사 원문 재사용 금지 |

## 7. T3 팀 Beat Writer MVP 후보

MVP에서는 30팀 전체를 한 번에 넣지 않고, 시장 영향이 큰 팀과 정보량이 많은 팀을 먼저 모니터링한다.

| team | name | handle | source_type | trust_score | usage_policy | verify_status |
|---|---|---|---|---:|---|---|
| Knicks | Ian Begley | `@IanBegley` | `team_beat` | 70 | Knicks 관련 세부 확인 | 확인 필요 |
| Knicks | Steve Popper | `@StevePopper` | `team_beat` | 66 | Knicks 현장/로컬 확인 | 확인 필요 |
| Celtics | Jay King | `@ByJayKing` | `team_beat` | 68 | Celtics 세부 확인 | 확인 필요 |
| Thunder | Brandon Rahbar | `@BrandonRahbar` | `team_beat` | 66 | Thunder 세부 확인 | 확인 필요 |
| Lakers | Dave McMenamin | `@mcten` | `team_beat` | 70 | Lakers/LeBron 관련 ESPN 확인 | 확인 필요 |
| Lakers | Jovan Buha | `@jovanbuha` | `team_beat` | 66 | Lakers 로스터/현장 | 확인 필요 |
| Warriors | Anthony Slater | `@anthonyVslater` | `team_beat` | 68 | Warriors 현장/로스터 | 확인 필요 |
| Warriors | Marcus Thompson | `@ThompsonScribe` | `team_beat` | 66 | Warriors 맥락/피처 | 확인 필요 |
| Mavericks | Tim MacMahon | `@espn_macmahon` | `team_beat` | 68 | Mavericks/Texas/ESPN 리포팅 | 확인 필요 |
| Heat | Ira Winderman | `@IraHeatBeat` | `team_beat` | 66 | Heat 로컬/beat | 확인 필요 |
| Bucks | Eric Nehm | `@eric_nehm` | `team_beat` | 66 | Bucks beat | 확인 필요 |
| Suns | Gerald Bourguet | `@GeraldBourguet` | `team_beat` | 62 | Suns beat | 확인 필요 |
| Clippers | Law Murray | `@LawMurrayTheNU` | `team_beat` | 62 | Clippers beat | 확인 필요 |
| Sixers | Kyle Neubeck | `@KyleNeubeck` | `team_beat` | 64 | Sixers beat | 확인 필요 |

## 8. NBA 30팀 공식 계정

공식 팀 계정은 팀 발표 확인용이다. 루머를 먼저 감지하는 용도가 아니라, 이미 감지된 이벤트를 공식 상태로 승격시키는 데 사용한다.

| team_code | team | handle | trust_score | usage_policy |
|---|---|---|---:|---|
| ATL | Atlanta Hawks | `@ATLHawks` | 95 | 공식 확인 |
| BOS | Boston Celtics | `@celtics` | 95 | 공식 확인 |
| BKN | Brooklyn Nets | `@BrooklynNets` | 95 | 공식 확인 |
| CHA | Charlotte Hornets | `@hornets` | 95 | 공식 확인 |
| CHI | Chicago Bulls | `@chicagobulls` | 95 | 공식 확인 |
| CLE | Cleveland Cavaliers | `@cavs` | 95 | 공식 확인 |
| DAL | Dallas Mavericks | `@dallasmavs` | 95 | 공식 확인 |
| DEN | Denver Nuggets | `@nuggets` | 95 | 공식 확인 |
| DET | Detroit Pistons | `@DetroitPistons` | 95 | 공식 확인 |
| GSW | Golden State Warriors | `@warriors` | 95 | 공식 확인 |
| HOU | Houston Rockets | `@HoustonRockets` | 95 | 공식 확인 |
| IND | Indiana Pacers | `@Pacers` | 95 | 공식 확인 |
| LAC | LA Clippers | `@LAClippers` | 95 | 공식 확인 |
| LAL | Los Angeles Lakers | `@Lakers` | 95 | 공식 확인 |
| MEM | Memphis Grizzlies | `@memgrizz` | 95 | 공식 확인 |
| MIA | Miami Heat | `@MiamiHEAT` | 95 | 공식 확인 |
| MIL | Milwaukee Bucks | `@Bucks` | 95 | 공식 확인 |
| MIN | Minnesota Timberwolves | `@Timberwolves` | 95 | 공식 확인 |
| NOP | New Orleans Pelicans | `@PelicansNBA` | 95 | 공식 확인 |
| NYK | New York Knicks | `@nyknicks` | 95 | 공식 확인 |
| OKC | Oklahoma City Thunder | `@okcthunder` | 95 | 공식 확인 |
| ORL | Orlando Magic | `@OrlandoMagic` | 95 | 공식 확인 |
| PHI | Philadelphia 76ers | `@sixers` | 95 | 공식 확인 |
| PHX | Phoenix Suns | `@Suns` | 95 | 공식 확인 |
| POR | Portland Trail Blazers | `@trailblazers` | 95 | 공식 확인 |
| SAC | Sacramento Kings | `@SacramentoKings` | 95 | 공식 확인 |
| SAS | San Antonio Spurs | `@spurs` | 95 | 공식 확인 |
| TOR | Toronto Raptors | `@Raptors` | 95 | 공식 확인 |
| UTA | Utah Jazz | `@utahjazz` | 95 | 공식 확인 |
| WAS | Washington Wizards | `@WashWizards` | 95 | 공식 확인 |

## 9. Media Account 보조 소스

매체 계정은 기자 개인 소스보다 느릴 수 있지만, 공식 기사 링크와 편집 검수를 거친 보조 근거로 유용하다.

| name | handle/site | source_type | trust_score | usage_policy |
|---|---|---|---:|---|
| ESPN NBA | `@ESPNNBA` | `media_account` | 72 | 기사 링크/공식 ESPN 보조 |
| NBA on ESPN | `@ESPNNBA` | `media_account` | 72 | 위와 동일. 중복 여부 확인 |
| The Athletic NBA | site/account 확인 필요 | `media_account` | 72 | paywall 원문 재사용 금지, 링크/요약만 |
| Yahoo Sports NBA | site/account 확인 필요 | `media_account` | 68 | 기사 링크 보조 |
| AP Sports | `@AP_Sports` | `media_account` | 76 | 공식 발표성 보도 보조 |

## 10. Rumor Watch 후보

이 섹션은 seed에 넣더라도 `is_active_for_publish=false`로 둔다. 공개 기사 작성에는 쓰지 않고, 이벤트 감지 신호로만 사용한다.

| name | handle/site | source_type | trust_score | usage_policy |
|---|---|---|---:|---|
| HoopsHype | site/account 확인 필요 | `rumor_watch` | 35 | 루머 집계 감지. 원 출처 확인 전 발행 금지 |
| RealGM Wiretap | site/account 확인 필요 | `rumor_watch` | 40 | 리그 뉴스 집계. 원 출처 확인 필수 |
| Reddit r/nba beat writer lists | web | `rumor_watch` | 20 | seed 후보 탐색용. 기사 근거로 사용 금지 |

## 11. Seed 후보 JSON 형태

나중에 실제 seed 파일로 바꿀 때의 형태다. MVP에서는 이 구조를 `src/lib/nba-news/sources.seed.ts` 또는 DB seed로 변환할 수 있다.

```json
{
  "displayName": "Shams Charania",
  "platform": "x",
  "handle": "ShamsCharania",
  "sourceType": "tier_1_insider",
  "tier": "T1",
  "trustScore": 90,
  "teamCode": null,
  "primaryTopics": ["trade", "signing", "injury", "league"],
  "usagePolicy": "single_source_draft_admin_approval",
  "isActive": true,
  "isPublishEligible": true,
  "verifyStatus": "needs_manual_check",
  "verifiedAt": null,
  "notes": "단독 보도 시 제목/리드에 기자명 명시"
}
```

## 12. 발행 정책 매핑

| source_type | source_count | event_risk | verification_status | editorial_status |
|---|---:|---|---|---|
| `official_league` | 1 | any | `official` | `needs_review` |
| `official_team` | 1 | team_event | `official` | `needs_review` |
| `tier_1_insider` | 1 | low/medium | `reported_single` | `needs_review` |
| `tier_1_insider` + `tier_1_insider` | 2 | any | `confirmed_multiple` | `needs_review` |
| `tier_1_insider` + `official_team` | 2 | any | `official` | `needs_review` |
| `tier_2_insider` | 1 | medium/high | `developing` | `draft` |
| `team_beat` | 1 | team_event | `reported_single` | `needs_review` |
| `analyst` | 1 | analysis | `analysis` | `draft` |
| `rumor_watch` | any | any | `rumor` | `rejected_or_queue_only` |

## 13. 수집 필터 키워드

| category | positive keywords | caution keywords |
|---|---|---|
| trade | `trade`, `traded`, `deal`, `acquire`, `send`, `receive` | `interest`, `discussed`, `could`, `monitoring` |
| signing | `agreed`, `signing`, `extension`, `contract`, `free agent` | `expected`, `likely`, `candidate` |
| injury | `out`, `injury`, `surgery`, `MRI`, `return`, `re-evaluated` | `could miss`, `fear`, `optimism` |
| waiver | `waived`, `released`, `buyout`, `10-day`, `two-way` | `expected to waive` |
| discipline | `suspended`, `fined`, `violation`, `league announced` | `could face` |
| draft | `workout`, `draft`, `prospect`, `pick`, `lottery` | `rumor`, `buzz`, `hearing` |

## 14. 검증 체크리스트

기사 초안을 만들기 전 아래 항목을 통과해야 한다.

| 체크 | 기준 |
|---|---|
| 계정 확인 | seed handle과 실제 handle 일치 |
| parody 방지 | 계정명/인증/과거 게시물/팔로워 규모 확인 |
| 원문 확인 | X URL 또는 공식 기사 URL 존재 |
| 시간 확인 | posted_at이 최신 이벤트와 일치 |
| 이벤트 분류 | trade/signing/injury/quote 등 분류 완료 |
| 위험도 확인 | high risk는 official/복수 확인 전 자동 발행 금지 |
| 문장 검수 | "확정", "공식" 같은 단어가 verification_status와 일치 |

## 15. 다음 작업

| 우선순위 | 작업 | 이유 |
|---|---|---|
| P1 | 이 seed 문서 검토 후 MVP 대상 20~30개로 축소 | 초기 수집 노이즈를 줄이기 위해 |
| P1 | `source_type`, `tier`, `usage_policy` enum 확정 | Prisma/type 설계 기반 |
| P2 | `src/lib/nba-news/types.ts` 작성 | 코드 구현 전 계약 고정 |
| P2 | mock source registry 작성 | X API 없이 관리자 큐 테스트 |
| P3 | 팀별 beat writer 30팀 확장 | MVP 안정화 후 |

## 16. 확인한 공개 참고자료

| 항목 | 참고 |
|---|---|
| Shams Charania ESPN 합류/역할 | https://en.wikipedia.org/wiki/Shams_Charania |
| Brian Windhorst ESPN NBA writer | https://en.wikipedia.org/wiki/Brian_Windhorst |
| Zach Lowe ESPN 이후 이력 | https://en.wikipedia.org/wiki/Zach_Lowe |
| Jake Fischer The Stein Line 합류 보도 | https://nypost.com/2024/11/20/sports/nba-insider-jake-fischer-joining-marc-steins-substack/ |
| Chris Haynes/Prime Video 관련 보도 | https://en.wikipedia.org/wiki/2025%E2%80%9326_NBA_season |
| X Developer Policy | https://docs.x.com/developer-terms/policy |

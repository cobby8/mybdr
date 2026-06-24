# BDR Ranking Research Automation MVP

## 목적

엑셀 업로드를 없애기 전에, 랭킹 산정에 쓸 수 있는 공개 후보 글이 실제로 얼마나 잡히는지 검증한다.

1차 MVP는 DB에 저장하지 않는다. 키워드 사전으로 네이버 카페글/블로그 공개 검색 결과를 수집하고, JSON 후보 파일로 저장한다. 이후 후보 품질을 보고 관리자 검토함과 랭킹 산정 DB를 붙인다.

## 파일

| 파일 | 역할 |
|---|---|
| `keyword-seed.json` | 공식 협회, 디비전, 동호회, 대회 결과 키워드 seed |
| `sources.json` | 네이버, 공식 사이트, 다음카페, 웹검색 후보 등 수집 출처 registry |
| `../../scripts/collect-ranking-research.mjs` | 네이버 카페글/블로그 검색 PoC |

## 실행

API 키 없이 쿼리 계획만 확인:

```powershell
node scripts/collect-ranking-research.mjs --dry-run --limit 20
```

멀티소스 계획 확인:

```powershell
node scripts/collect-ranking-research.mjs --dry-run --source naver-cafe,naver-blog,official-kba,daum-cafe --limit 10
```

네이버 검색 API 키로 실제 후보 수집:

```powershell
$env:NAVER_CLIENT_ID="..."
$env:NAVER_CLIENT_SECRET="..."
node scripts/collect-ranking-research.mjs --limit 40 --display 10
```

특정 그룹만 수집:

```powershell
node scripts/collect-ranking-research.mjs --group bdr_community --group tournament_results --limit 30
```

공식/수동 URL 후보를 JSON에 포함:

```powershell
node scripts/collect-ranking-research.mjs --include-manual --out tmp/ranking-research-candidates.json
```

출력 파일 지정:

```powershell
node scripts/collect-ranking-research.mjs --out tmp/ranking-research-candidates.json
```

## 1차 판정 기준

| 항목 | 기준 |
|---|---|
| 좋은 후보 | 제목/요약에 대회명, 날짜, 팀명, 우승/준우승/순위/스코어 중 2개 이상 포함 |
| 보류 후보 | 모집글, 일정글, 후기글처럼 결과 여부가 불명확한 글 |
| 제외 후보 | 프로/학생 엘리트 기사, 농구와 무관한 검색 오탐 |

## 다음 단계

1. 후보 JSON 100~300건을 수빈이 훑어보고 유효 키워드/오탐 키워드를 분리한다.
2. 유효 후보가 충분하면 DB 모델을 추가한다.
3. `ranking_sources`와 `ranking_review_queue`를 만들고 관리자 후보함을 붙인다.
4. 승인된 결과만 랭킹 점수 계산에 반영한다.
